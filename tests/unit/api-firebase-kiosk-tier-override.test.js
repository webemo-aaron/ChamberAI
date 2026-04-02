import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("requireKioskTier uses higher of settings tier and req.user tier", () => {
  const middleware = fs.readFileSync("services/api-firebase/src/middleware/requireKioskTier.js", "utf8");
  assert.match(middleware, /const\s+settingsTier\s*=\s*settings\.subscription\?\.tier\s*\?\?\s*"free"/);
  assert.match(middleware, /const\s+userTier\s*=\s*String\(req\.user\?\.tier\s*\?\?\s*""\)\.toLowerCase\(\)/);
  assert.match(middleware, /const\s+effectiveTier\s*=\s*\(tierLevels\[userTier\]\s*\?\?\s*-1\)\s*>\s*\(tierLevels\[settingsTier\]\s*\?\?\s*-1\)/);
  assert.match(middleware, /current_tier:\s*effectiveTier/);
});

