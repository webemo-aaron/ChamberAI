import { test } from "node:test";
import assert from "node:assert/strict";

test("resolveOrgId falls back to default when candidate and fallback are blank", async () => {
  const { resolveOrgId } = await import("../../services/api-firebase/src/db/orgFirestore.js");

  assert.equal(resolveOrgId("", ""), "default");
  assert.equal(resolveOrgId("   ", "   "), "default");
  assert.equal(resolveOrgId(undefined, undefined), "default");
});

test("resolveOrgId prefers a trimmed explicit org id", async () => {
  const { resolveOrgId } = await import("../../services/api-firebase/src/db/orgFirestore.js");

  assert.equal(resolveOrgId("  chamber-main  ", "fallback-org"), "chamber-main");
});

test("resolveOrgId uses a trimmed fallback org id when explicit value is blank", async () => {
  const { resolveOrgId } = await import("../../services/api-firebase/src/db/orgFirestore.js");

  assert.equal(resolveOrgId("   ", "  fallback-org  "), "fallback-org");
});
