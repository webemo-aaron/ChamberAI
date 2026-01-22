import admin from "firebase-admin";
import fs from "node:fs";

let app;

export function initFirestore() {
  if (app) return admin.firestore();

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const useEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    if (!useEmulator) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH not set or file missing");
    }
    app = admin.initializeApp({
      projectId: process.env.GCP_PROJECT_ID
    });
  } else {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.GCP_PROJECT_ID
    });
  }

  const firestore = admin.firestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
}

export function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}
