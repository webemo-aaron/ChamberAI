import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rootPackage = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8")
);
const servicePackage = JSON.parse(
  readFileSync(new URL("../../services/api-firebase/package.json", import.meta.url), "utf8")
);

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("governance insights smoke script targets Phase 17 endpoints and env vars", () => {
  const script = read("scripts/governance_insights_smoke.mjs");

  assert.match(script, /API_BASE/);
  assert.match(script, /GOVERNANCE_SMOKE_TOKEN/);
  assert.match(script, /GOVERNANCE_SMOKE_FIREBASE_AUTH/);
  assert.match(script, /GOVERNANCE_SMOKE_FIREBASE_SERVICE_ACCOUNT_PATH/);
  assert.match(script, /GOVERNANCE_SMOKE_FIREBASE_WEB_API_KEY/);
  assert.match(script, /GOVERNANCE_SMOKE_ORG_ID/);
  assert.match(script, /GOVERNANCE_SMOKE_CHECK_AI/);
  assert.match(script, /\/analytics\/anomalies/);
  assert.match(script, /\/analytics\/predictions/);
  assert.match(script, /\/analytics\/narrative/);
  assert.match(script, /next_3_months/);
  assert.match(script, /createCustomToken/);
  assert.match(script, /signInWithCustomToken/);
});

test("governance insights smoke script is exposed through package scripts", () => {
  assert.equal(
    rootPackage.scripts["test:governance-insights-smoke"],
    "node scripts/governance_insights_smoke.mjs"
  );
  assert.equal(
    servicePackage.scripts["smoke:governance-insights"],
    "node ../../scripts/governance_insights_smoke.mjs"
  );
});
