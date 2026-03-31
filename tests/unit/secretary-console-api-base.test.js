import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("local operations workspace defaults local dev sessions to the mock API on port 4010", () => {
  const apiJs = read("apps/secretary-console/core/api.js");
  const appJs = read("apps/secretary-console/app.js");

  assert.match(apiJs, /export function detectDefaultApiBase/);
  assert.match(apiJs, /currentPort === '5175' \|\| currentPort === '5176' \|\| currentPort === '5173'/);
  assert.match(apiJs, /return 'http:\/\/127\.0\.0\.1:4010'/);
  assert.match(appJs, /detectDefaultApiBase/);
});

test("hosted Vercel operations workspace defaults to the deployed Cloud Run API", () => {
  const apiJs = read("apps/secretary-console/core/api.js");

  assert.match(apiJs, /window\.location\.hostname\.endsWith\('\.vercel\.app'\)/);
  assert.match(apiJs, /return 'https:\/\/chamberai-api-ecfgvedexq-uc\.a\.run\.app'/);
  assert.doesNotMatch(apiJs, /return 'https:\/\/chamberai-api\.vercel\.app'/);
});
