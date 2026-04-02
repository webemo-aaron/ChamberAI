import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("hosted demo login marks auth mode and API client sends demo token when camAuthMode=demo", () => {
  const loginJs = read("apps/secretary-console/views/login/login.js");
  const apiJs = read("apps/secretary-console/core/api.js");

  assert.match(loginJs, /localStorage\.setItem\("camAuthMode", "demo"\)/);
  assert.match(apiJs, /const authMode = localStorage\.getItem\('camAuthMode'\)/);
  assert.match(apiJs, /const shouldUseDemoToken = authMode === 'demo' \|\| isLocalDevHost/);
  assert.match(apiJs, /headers\.Authorization = 'Bearer demo-token'/);
});

test("sign out clears camAuthMode", () => {
  const authJs = read("apps/secretary-console/core/auth.js");
  assert.match(authJs, /localStorage\.removeItem\("camAuthMode"\)/);
});

