import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.get("/meetings/:id/draft-minutes", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await db.collection("draftMinutes").doc(req.params.id).get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id/draft-minutes", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const ref = db.collection("draftMinutes").doc(req.params.id);
    const snapshot = await ref.get();
    const existing = snapshot.exists ? snapshot.data() : null;
    const currentVersion = Number(existing?.minutes_version ?? 0);
    const baseVersion = req.body.base_version;

    if (baseVersion !== undefined && Number(baseVersion) !== currentVersion) {
      return res.status(409).json({
        error: "Version conflict",
        current_version: currentVersion,
        current_content: existing?.content ?? ""
      });
    }

    const nextVersion = currentVersion + 1;
    const draft = {
      meeting_id: req.params.id,
      content: req.body.content ?? "",
      minutes_version: nextVersion,
      updated_by: req.user?.email ?? "user",
      updated_at: serverTimestamp()
    };
    await ref.set(draft, { merge: true });
    await db.collection("draftMinuteVersions").add({
      meeting_id: req.params.id,
      version: nextVersion,
      content: draft.content,
      actor: req.user?.email ?? "user",
      created_at: serverTimestamp()
    });
    await db.collection("auditLogs").add({
      meeting_id: req.params.id,
      event_type: "MINUTES_VERSION_SAVED",
      actor: req.user?.email ?? "user",
      timestamp: serverTimestamp(),
      details: { version: nextVersion }
    });
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id/draft-minutes/versions", async (req, res, next) => {
  try {
    const db = initFirestore();
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const limitParam = Number.parseInt(String(limitRaw ?? "50"), 10);
    const offsetParam = Number.parseInt(String(offsetRaw ?? "0"), 10);
    if (limitRaw !== undefined && Number.isNaN(limitParam)) {
      return res.status(400).json({ error: "limit must be a number" });
    }
    if (offsetRaw !== undefined && Number.isNaN(offsetParam)) {
      return res.status(400).json({ error: "offset must be a number" });
    }
    const limit = Number.isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100);
    const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);
    const snapshot = await db.collection("draftMinuteVersions").where("meeting_id", "==", req.params.id).get();
    const allVersions = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0));
    const items = allVersions.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < allVersions.length;
    res.json({
      items,
      offset,
      limit,
      next_offset: hasMore ? nextOffset : null,
      has_more: hasMore,
      total: allVersions.length
    });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/draft-minutes/rollback", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const targetVersion = Number(req.body.version ?? 0);
    if (!targetVersion) {
      return res.status(400).json({ error: "version required" });
    }

    const versionsSnap = await db.collection("draftMinuteVersions").where("meeting_id", "==", req.params.id).get();
    const target = versionsSnap.docs.map((doc) => doc.data()).find((entry) => Number(entry.version) === targetVersion);
    if (!target) {
      return res.status(404).json({ error: "Version not found" });
    }

    const draftRef = db.collection("draftMinutes").doc(req.params.id);
    const current = await draftRef.get();
    const currentVersion = Number(current.data()?.minutes_version ?? 0);
    const nextVersion = currentVersion + 1;
    const draft = {
      meeting_id: req.params.id,
      content: target.content ?? "",
      minutes_version: nextVersion,
      updated_by: req.user?.email ?? "user",
      rolled_back_from_version: targetVersion,
      updated_at: serverTimestamp()
    };
    await draftRef.set(draft, { merge: true });
    await db.collection("draftMinuteVersions").add({
      meeting_id: req.params.id,
      version: nextVersion,
      content: draft.content,
      actor: req.user?.email ?? "user",
      rollback_from_version: targetVersion,
      created_at: serverTimestamp()
    });
    await db.collection("auditLogs").add({
      meeting_id: req.params.id,
      event_type: "MINUTES_ROLLBACK",
      actor: req.user?.email ?? "user",
      timestamp: serverTimestamp(),
      details: { from_version: targetVersion, to_version: nextVersion }
    });
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/export", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const format = req.body.format ?? "pdf";
    const file_uri = `exports/${req.params.id}/${Date.now()}.${format}`;
    await db.collection("auditLogs").add({
      meeting_id: req.params.id,
      event_type: "MINUTES_EXPORT",
      actor: req.user?.email ?? "user",
      timestamp: serverTimestamp(),
      details: { format, file_uri }
    });
    res.json({ format, file_uri });
  } catch (error) {
    next(error);
  }
});

export default router;
