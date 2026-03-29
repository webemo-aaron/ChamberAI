import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("showcase audit script validates all core showcase surfaces from the city manifest", () => {
  const script = read("scripts/audit_showcase_data.mjs");

  assert.match(script, /data\/showcase\/cities\.json/);
  assert.match(script, /\/meetings\?limit=200/);
  assert.match(script, /\/business-listings\?limit=200/);
  assert.match(script, /\/business-listings\/\$\{business\.id\}\/reviews/);
  assert.match(script, /\/business-listings\/\$\{business\.id\}\/quotes/);
  assert.match(script, /\/geo-profiles\?scopeType=/);
  assert.match(script, /\/geo-content-briefs\?scopeType=/);
  assert.match(script, /Array\.isArray\(payload\?\.items\)/);
  assert.match(script, /\.\.\.\(Array\.isArray\(meeting\.tags\) \? meeting\.tags : \[\]\)/);
  assert.match(script, /unexpected business: \$\{business\.id\}/);
  assert.match(script, /process\.exit\(1\)/);
});
