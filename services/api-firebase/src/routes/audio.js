import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { getBucket } from "../db/storage.js";
import { makeId } from "../utils/ids.js";

const router = express.Router();

router.post("/meetings/:id/audio-sources", async (req, res, next) => {
  try {
    const db = initFirestore();
    const id = makeId("audio");
    const source = {
      id,
      meeting_id: req.params.id,
      type: req.body.type ?? "UPLOAD",
      participant_id: req.body.participant_id ?? null,
      file_uri: req.body.file_uri ?? null,
      duration_seconds: req.body.duration_seconds ?? null,
      created_at: serverTimestamp()
    };
    await db.collection("audioSources").doc(id).set(source);
    await db.collection("meetings").doc(req.params.id).set({
      status: "UPLOADED",
      updated_at: serverTimestamp()
    }, { merge: true });
    res.status(201).json(source);
  } catch (error) {
    next(error);
  }
});

router.get("/meetings/:id/audio-sources", async (req, res, next) => {
  try {
    const db = initFirestore();
    const snapshot = await db.collection("audioSources").where("meeting_id", "==", req.params.id).get();
    const sources = snapshot.docs.map((doc) => doc.data());
    res.json(sources);
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:id/audio-sources/upload-url", async (req, res, next) => {
  try {
    const bucket = getBucket();
    const objectName = `meetings/${req.params.id}/${Date.now()}-${req.body.filename}`;
    const [url] = await bucket.file(objectName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: req.body.content_type ?? "application/octet-stream"
    });
    res.json({ upload_url: url, file_uri: objectName });
  } catch (error) {
    next(error);
  }
});

export default router;
