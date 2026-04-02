import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("kiosk view no longer redirects unavailable states to meetings", () => {
  const kioskJs = read("apps/secretary-console/views/kiosk/kiosk-view.js");

  assert.doesNotMatch(kioskJs, /navigate\("\/meetings"\)/);
  assert.match(kioskJs, /renderKioskUnavailable/);
  assert.match(kioskJs, /Open Kiosk Settings/);
});

