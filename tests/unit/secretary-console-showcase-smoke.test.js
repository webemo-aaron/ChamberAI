import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("live showcase smoke script targets dashboard, meetings, and business hub", () => {
  const script = read("scripts/live_showcase_smoke.mjs");

  assert.match(script, /camShowcaseCity/);
  assert.match(script, /#\/dashboard/);
  assert.match(script, /#\/meetings/);
  assert.match(script, /#\/business-hub/);
  assert.match(script, /SHOWCASE_CITY_ID/);
  assert.match(script, /SHOWCASE_MEETING_TEXT/);
  assert.match(script, /SHOWCASE_BUSINESS_TEXT/);
});
