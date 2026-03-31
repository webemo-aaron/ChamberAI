import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../../scripts/check_metrics_thresholds.sh", import.meta.url),
  "utf8"
);

test("metrics threshold script defaults to host-local API metrics and optional worker metrics", () => {
  assert.match(source, /http:\/\/127\.0\.0\.1:4000\/metrics/);
  assert.match(source, /LOCAL_API_METRICS_URL/);
  assert.match(source, /LOCAL_WORKER_METRICS_URL/);
  assert.match(source, /probe_url_from_metrics/);
  assert.match(source, /window_total=/);
  assert.match(source, /worker metrics skipped/);
});
