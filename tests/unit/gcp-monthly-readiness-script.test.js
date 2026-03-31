import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("gcp monthly readiness script treats unset Cloud Run minScale as effective zero", () => {
  const source = read("scripts/check_gcp_monthly_readiness.sh");

  assert.match(source, /api_min="\$\{api_min_raw:-0\}"/);
  assert.match(source, /worker_min="\$\{worker_min_raw:-0\}"/);
  assert.match(source, /API scale: min=\$\{api_min:-0\}, max=\$\{api_max:-unset\}/);
  assert.match(source, /Worker scale: min=\$\{worker_min:-0\}, max=\$\{worker_max:-unset\}/);
});
