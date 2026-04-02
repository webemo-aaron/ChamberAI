import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("kiosk config route uses set+merge for first-time settings initialization", () => {
  const route = fs.readFileSync("services/api-firebase/src/routes/kiosk.js", "utf8");
  assert.match(route, /settingsRef\.set\(/);
  assert.match(route, /\{\s*merge:\s*true\s*\}/);
});

