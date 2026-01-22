import express from "express";
import { initFirestore } from "../db/firestore.js";

const router = express.Router();

router.get("/meetings/:id/audit-log", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("auditLogs").where("meeting_id", "==", req.params.id).get();
    const logs = snapshot.docs.map((doc) => doc.data());
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
