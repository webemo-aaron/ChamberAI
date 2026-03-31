import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { orgCollection } from "../db/orgFirestore.js";
import { makeId } from "../utils/ids.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.get("/meetings/:id/action-items", async (req, res, next) => {
  try {
    const db = initFirestore();

    // Pagination and filtering support
    const limitParam = Number(req.query.limit) || 50;
    const offsetParam = Number(req.query.offset) || 0;
    const sinceParam = req.query.since;
    const statusParam = req.query.status;  // "OPEN" or "COMPLETED"

    // Validate pagination params
    const limit = Math.min(Math.max(limitParam, 1), 100);
    const offset = Math.max(offsetParam, 0);

    // Build query
    let query = orgCollection(db, req.orgId, "actionItems")
      .where("meeting_id", "==", req.params.id)
      .orderBy("updated_at", "desc");

    // Apply status filter if provided
    if (statusParam && ["OPEN", "COMPLETED"].includes(statusParam)) {
      query = query.where("status", "==", statusParam);
    }

    // Apply delta sync filter if provided
    if (sinceParam) {
      try {
        const sinceDate = new Date(sinceParam);
        query = query.where("updated_at", ">", sinceDate);
      } catch (e) {
        return res.status(400).json({ error: "Invalid since parameter (must be ISO8601 or timestamp)" });
      }
    }

    // Get total count
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Fetch paginated results
    const snapshot = await query.offset(offset).limit(limit).get();
    const items = snapshot.docs.map((doc) => doc.data());

    // Compute next cursor
    let nextCursor = null;
    if (offset + items.length < total) {
      nextCursor = offset + items.length;
    }

    res.json({
      action_items: items,
      total,
      limit,
      offset,
      next_cursor: nextCursor
    });
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id/action-items", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const items = (req.body.items ?? []).map((item, index) => ({
      id: item.id ?? makeId(`action_${index + 1}`),
      meeting_id: req.params.id,
      description: item.description ?? "",
      owner_name: item.owner_name ?? null,
      due_date: item.due_date ?? null,
      status: item.status ?? "OPEN",
      updated_at: serverTimestamp()
    }));

    const batch = db.batch();
    items.forEach((item) => {
      batch.set(orgCollection(db, req.orgId, "actionItems").doc(item.id), item, { merge: true });
    });
    await batch.commit();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /action-items/my-open
 * Returns all OPEN action items assigned to the authenticated user (org-wide, not scoped to a meeting)
 * Used by mobile app to show dashboard of user's open tasks
 */
router.get("/action-items/my-open", async (req, res, next) => {
  try {
    const db = initFirestore();
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(400).json({ error: "User email not found in token" });
    }

    // Fetch all OPEN action items for this user in the org
    const snapshot = await orgCollection(db, req.orgId, "actionItems")
      .where("status", "==", "OPEN")
      .where("owner_name", "==", userEmail)
      .orderBy("due_date", "asc")
      .get();

    const items = snapshot.docs.map((doc) => doc.data());

    res.json({
      action_items: items,
      total: items.length,
      user_email: userEmail
    });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id/action-items/export/csv", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await orgCollection(db, req.orgId, "actionItems").where("meeting_id", "==", req.params.id).get();
    const items = snapshot.docs.map((doc) => doc.data());
    const header = ["description", "owner_name", "due_date", "status"];
    const lines = [header.join(",")];
    items.forEach((item) => {
      const row = [
        escapeCsv(item.description ?? ""),
        escapeCsv(item.owner_name ?? ""),
        escapeCsv(item.due_date ?? ""),
        escapeCsv(item.status ?? "")
      ];
      lines.push(row.join(","));
    });
    res.setHeader("Content-Type", "text/csv");
    res.send(lines.join("\\n"));
  } catch (error) {
    next(error);
  }
});

export default router;

function escapeCsv(value) {
  const text = String(value);
  if (text.includes("\"")) {
    return `"${text.replace(/\"/g, "\"\"")}"`;
  }
  if (text.includes(",") || text.includes("\\n")) {
    return `"${text}"`;
  }
  return text;
}
