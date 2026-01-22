import { Storage } from "@google-cloud/storage";

let storage;

export function initStorage() {
  if (storage) return storage;
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    apiEndpoint: process.env.STORAGE_EMULATOR_HOST
  });
  return storage;
}

export function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME not set");
  }
  return initStorage().bucket(bucketName);
}
