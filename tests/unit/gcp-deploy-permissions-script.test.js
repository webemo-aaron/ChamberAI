import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("gcp deploy permissions script checks required env and Cloud Run/Storage permissions", () => {
  const source = read("scripts/check_gcp_deploy_permissions.sh");

  assert.match(source, /PROJECT_ID is required/);
  assert.match(source, /REGION is required/);
  assert.match(source, /API_SERVICE is required/);
  assert.match(source, /WORKER_SERVICE is required/);
  assert.match(source, /GCS_BUCKET_NAME is required/);
  assert.match(source, /gcloud run services describe "\$\{API_SERVICE\}"/);
  assert.match(source, /gcloud run services describe "\$\{WORKER_SERVICE\}"/);
  assert.match(source, /gcloud storage buckets describe "gs:\/\/\$\{GCS_BUCKET_NAME\}"/);
  assert.match(source, /Permission preflight complete|Missing required access/);
});

test("gcp low-cost deployment docs reference the permissions preflight script", () => {
  const source = read("docs/DEPLOYMENT_GCP_VERCEL_LOW_COST.md");

  assert.match(source, /check_gcp_deploy_permissions\.sh/);
});
