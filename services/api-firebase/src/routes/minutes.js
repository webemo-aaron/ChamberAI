import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";

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

router.put("/meetings/:id/draft-minutes", async (req, res, next) => {
  try {
    const db = initFirestore();
    const draft = {
      meeting_id: req.params.id,
      content: req.body.content ?? "",
      minutes_version: req.body.minutes_version ?? 1,
      updated_at: serverTimestamp()
    };
    await db.collection("draftMinutes").doc(req.params.id).set(draft, { merge: true });
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/export", async (req, res, next) => {
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
