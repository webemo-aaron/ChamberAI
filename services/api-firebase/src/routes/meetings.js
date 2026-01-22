import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { makeId } from "../utils/ids.js";
import { normalizeTags, requireFields } from "../utils/validation.js";

const router = express.Router();

router.post("/meetings", async (req, res, next) => {
  try {
    requireFields(req.body, ["date", "start_time", "location"]);
    const db = initFirestore();
    const id = makeId("meeting");
    const meeting = {
      id,
      date: req.body.date,
      start_time: req.body.start_time,
      end_time: req.body.end_time ?? null,
      location: req.body.location,
      chair_name: req.body.chair_name ?? null,
      secretary_name: req.body.secretary_name ?? null,
      status: "CREATED",
      tags: normalizeTags(req.body.tags),
      no_motions: false,
      no_action_items: false,
      no_adjournment_time: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    await db.collection("meetings").doc(id).set(meeting);
    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("meetings").get();
    const meetings = snapshot.docs.map((doc) => doc.data());
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id", async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await db.collection("meetings").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id", async (req, res, next) => {
  try {
    const db = initFirestore();
    const update = {
      ...req.body,
      tags: req.body.tags ? normalizeTags(req.body.tags) : undefined,
      updated_at: serverTimestamp()
    };
    await db.collection("meetings").doc(req.params.id).set(update, { merge: true });
    const doc = await db.collection("meetings").doc(req.params.id).get();
    res.json(doc.data());
  } catch (error) {
    next(error);
  }
});

export default router;
