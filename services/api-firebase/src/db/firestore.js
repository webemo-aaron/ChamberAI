import admin from "firebase-admin";
import fs from "node:fs";

let app;

export function initFirebaseAdminApp() {
  if (app) return app;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.GCP_PROJECT_ID
    });
    return app;
  }

  // Cloud Run and local gcloud ADC can authenticate without a JSON key file.
  app = admin.initializeApp({
    projectId: process.env.GCP_PROJECT_ID
  });
  return app;
}

export function initFirestore() {
  initFirebaseAdminApp();

  const firestore = admin.firestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
}

export function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}
