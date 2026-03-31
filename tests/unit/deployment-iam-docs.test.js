import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("gcp vercel deployment docs list required IAM roles for deploy and readiness", () => {
  const source = read("docs/DEPLOYMENT_GCP_VERCEL_LOW_COST.md");

  assert.match(source, /roles\/run\.admin/);
  assert.match(source, /roles\/iam\.serviceAccountUser/);
  assert.match(source, /roles\/artifactregistry\.admin/);
  assert.match(source, /roles\/cloudbuild\.builds\.editor/);
  assert.match(source, /roles\/storage\.admin/);
  assert.match(source, /roles\/serviceusage\.serviceUsageAdmin/);
  assert.match(source, /roles\/datastore\.owner/);
  assert.match(source, /roles\/run\.viewer/);
  assert.match(source, /CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE/);
});
