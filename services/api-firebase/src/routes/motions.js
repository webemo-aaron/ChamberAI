import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { makeId } from "../utils/ids.js";

const router = express.Router();

router.get("/meetings/:id/motions", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("motions").where("meeting_id", "==", req.params.id).get();
    const motions = snapshot.docs.map((doc) => doc.data());
    res.json(motions);
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id/motions", async (req, res, next) => {
  try {
    const db = initFirestore();
    const motions = (req.body.motions ?? []).map((motion, index) => ({
      id: motion.id ?? makeId(`motion_${index + 1}`),
      meeting_id: req.params.id,
      text: motion.text ?? "",
      mover_name: motion.mover_name ?? null,
      seconder_name: motion.seconder_name ?? null,
      vote_method: motion.vote_method ?? null,
      outcome: motion.outcome ?? null,
      updated_at: serverTimestamp()
    }));

    const batch = db.batch();
    motions.forEach((motion) => {
      batch.set(db.collection("motions").doc(motion.id), motion, { merge: true });
    });
    await batch.commit();
    res.json(motions);
  } catch (error) {
    next(error);
  }
});

export default router;
