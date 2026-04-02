import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("demo login maps admin and secretary roles to elevated tiers", () => {
  const loginJs = read("apps/secretary-console/views/login/login.js");

  assert.match(loginJs, /function getDemoTierForRole\(role\)/);
  assert.match(loginJs, /if \(role === "admin"\) return "Network"/);
  assert.match(loginJs, /if \(role === "secretary"\) return "Council"/);
});

test("demo login persists tier and clears tier preview", () => {
  const loginJs = read("apps/secretary-console/views/login/login.js");

  assert.match(loginJs, /localStorage\.setItem\("camUserTier", demoTier\)/);
  assert.match(loginJs, /localStorage\.removeItem\("camTierPreview"\)/);
});

test("demo login includes explicit access tier selector with Council\\+ option", () => {
  const loginJs = read("apps/secretary-console/views/login/login.js");

  assert.match(loginJs, /tierSelect\.id = "loginTier"/);
  assert.match(loginJs, /tierCouncilOption\.textContent = "Council\+"/);
  assert.match(loginJs, /tierSelect\.value === "auto"/);
});
