import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";

const router = express.Router();

router.post("/meetings/:id/process", async (req, res, next) => {
  try {
    const db = initFirestore();
    await db.collection("meetings").doc(req.params.id).set({
      status: "PROCESSING",
      updated_at: serverTimestamp()
    }, { merge: true });

    if (process.env.WORKER_ENDPOINT) {
      await fetch(process.env.WORKER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: req.params.id })
      });
    }

    res.json({ status: "PROCESSING" });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id/process-status", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await db.collection("meetings").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Meeting not found" });
    res.json({ status: doc.data().status });
  } catch (error) {
    next(error);
  }
});

export default router;
