import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { makeId } from "../utils/ids.js";

const router = express.Router();

router.get("/meetings/:id/action-items", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("actionItems").where("meeting_id", "==", req.params.id).get();
    const items = snapshot.docs.map((doc) => doc.data());
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id/action-items", async (req, res, next) => {
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
      batch.set(db.collection("actionItems").doc(item.id), item, { merge: true });
    });
    await batch.commit();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id/action-items/export/csv", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("actionItems").where("meeting_id", "==", req.params.id).get();
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
