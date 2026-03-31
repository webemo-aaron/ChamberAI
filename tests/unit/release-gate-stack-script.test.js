import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../scripts/verify_local_stack.sh", import.meta.url),
  "utf8"
);

test("verify_local_stack supports docker-compose, docker compose, and host-local fallback", () => {
  assert.match(source, /detect_compose_cmd\(\)/);
  assert.match(source, /docker-compose/);
  assert.match(source, /docker compose version/);
  assert.match(source, /Compose unavailable or inactive; using host-local stack verification/);
  assert.match(source, /LOCAL_CONSOLE_HEALTH_URL/);
  assert.match(source, /LOCAL_API_HEALTH_URL/);
  assert.match(source, /LOCAL_WORKER_HEALTH_URL/);
});
