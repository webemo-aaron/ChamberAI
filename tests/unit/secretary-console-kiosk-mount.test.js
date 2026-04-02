import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("kiosk view mounts into utilityView and unhides it", () => {
  const kioskView = fs.readFileSync("apps/secretary-console/views/kiosk/kiosk-view.js", "utf8");
  assert.match(kioskView, /function getKioskMountContainer\(\)/);
  assert.match(kioskView, /document\.getElementById\("utilityView"\)/);
  assert.match(kioskView, /document\.querySelectorAll\("main\.shell"\)/);
  assert.match(kioskView, /utilityView\.classList\.remove\("hidden"\)/);
});

