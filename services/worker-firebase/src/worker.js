import "dotenv/config";
import express from "express";
import admin from "firebase-admin";
import fs from "node:fs";

const port = Number(process.env.WORKER_PORT ?? 4001);

function initAdmin() {
  if (admin.apps.length > 0) return admin;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const useEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    if (!useEmulator) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH not set or file missing");
    }
    admin.initializeApp({ projectId: process.env.GCP_PROJECT_ID });
  } else {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.GCP_PROJECT_ID
    });
  }
  return admin;
}

const app = express();
app.use(express.json());

app.post("/tasks/process", async (req, res) => {
  const { meeting_id } = req.body;
  if (!meeting_id) return res.status(422).json({ error: "meeting_id required" });

  const adminApp = initAdmin();
  const db = adminApp.firestore();

  await db.collection("meetings").doc(meeting_id).set({
    status: "DRAFT_READY",
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await db.collection("draftMinutes").doc(meeting_id).set({
    meeting_id,
    content: "# Draft Minutes\n\n(Worker stub generated.)",
    minutes_version: 1,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  res.json({ ok: true });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Worker listening on http://127.0.0.1:${port}`);
});
