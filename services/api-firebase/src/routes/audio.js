import express from "express";
import { initFirestore, serverTimestamp } from "../db/firestore.js";
import { getBucket } from "../db/storage.js";
import { makeId } from "../utils/ids.js";
import { requireRole } from "../middleware/rbac.js";

const router = express.Router();

router.post("/meetings/:id/audio-sources", requireRole("admin", "secretary"), async (req, res, next) => {
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

router.post("/meetings/:id/audio-sources/upload-url", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const objectName = `meetings/${req.params.id}/${Date.now()}-${req.body.filename}`;
    if (process.env.STORAGE_EMULATOR_HOST) {
      return res.json({ upload_url: null, file_uri: objectName });
    }
    const bucket = getBucket();
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

router.get("/audio-sources/:id/download-url", requireRole("admin", "secretary"), async (req, res, next) => {
  try {
    const db = initFirestore();
    const doc = await db.collection("audioSources").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Audio source not found" });
    const source = doc.data();
    const fileUri = source.file_uri;
    if (!fileUri) return res.status(404).json({ error: "file_uri missing" });

    if (process.env.STORAGE_EMULATOR_HOST) {
      const bucketName = process.env.GCS_BUCKET_NAME || "cam-aims-audio";
      const encoded = encodeURIComponent(fileUri);
      const base = process.env.STORAGE_EMULATOR_HOST.replace(/\/$/, "");
      return res.json({ download_url: `${base}/v0/b/${bucketName}/o/${encoded}?alt=media` });
    }

    const bucket = getBucket();
    const [url] = await bucket.file(fileUri).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000
    });
    res.json({ download_url: url });
  } catch (error) {
    next(error);
  }
});

export default router;
