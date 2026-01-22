import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";

const router = express.Router();

router.get("/settings", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await db.collection("settings").doc("system").get();
    res.json(doc.exists ? doc.data() : { retentionDays: 60, maxFileSizeMb: 500, maxDurationSeconds: 14400 });
  } catch (error) {
    next(error);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const db = initFirestore();
    const patch = {
      retentionDays: req.body.retentionDays ?? 60,
      maxFileSizeMb: req.body.maxFileSizeMb ?? 500,
      maxDurationSeconds: req.body.maxDurationSeconds ?? 14400,
      updated_at: serverTimestamp()
    };
    await db.collection("settings").doc("system").set(patch, { merge: true });
    res.json(patch);
  } catch (error) {
    next(error);
  }
});

export default router;
