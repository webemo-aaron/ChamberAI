import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("auth middleware maps mocked token tier onto req.user", () => {
  const authMiddleware = fs.readFileSync("services/api-firebase/src/middleware/auth.js", "utf8");
  assert.match(authMiddleware, /tier:\s*mocked\.tier\s*\?\?\s*null/);
});

test("requireTier uses higher of settings tier and req.user tier", () => {
  const tierMiddleware = fs.readFileSync("services/api-firebase/src/middleware/requireTier.js", "utf8");
  assert.match(tierMiddleware, /const\s+settingsTier\s*=\s*settings\.subscription\?\.tier\s*\?\?\s*"free"/);
  assert.match(tierMiddleware, /const\s+userTier\s*=\s*String\(req\.user\?\.tier\s*\?\?\s*""\)\.toLowerCase\(\)/);
  assert.match(tierMiddleware, /const\s+effectiveTier\s*=\s*\(tierLevels\[userTier\]\s*\?\?\s*-1\)\s*>\s*\(tierLevels\[settingsTier\]\s*\?\?\s*-1\)/);
  assert.match(tierMiddleware, /current_tier:\s*effectiveTier/);
});

