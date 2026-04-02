import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("topbar logout uses signOut and routes to login", () => {
  const appJs = read("apps/secretary-console/app.js");

  assert.match(appJs, /logoutBtn\.addEventListener\("click", async \(\) => \{/);
  assert.match(appJs, /await signOut\(\)/);
  assert.match(appJs, /navigate\("\/login"\)/);
});

test("kiosk logout uses signOut and routes to login", () => {
  const kioskJs = read("apps/secretary-console/views/kiosk/kiosk-view.js");

  assert.match(kioskJs, /logoutBtn\.addEventListener\("click", async \(\) => \{/);
  assert.match(kioskJs, /await signOut\(\)/);
  assert.match(kioskJs, /navigate\("\/login"\)/);
});

