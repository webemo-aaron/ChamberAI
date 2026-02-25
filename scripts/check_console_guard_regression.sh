#!/usr/bin/env bash
set -euo pipefail

TREND_FILE="${1:-artifacts/console-guard-warning-trend.json}"
BASELINE_FILE="${2:-docs/testing/console_guard_baseline.json}"
MAX_DELTA="${MAX_CONSOLE_GUARD_WARNING_DELTA:-20}"

if [[ ! -f "${TREND_FILE}" ]]; then
  echo "Trend file not found: ${TREND_FILE}" >&2
  exit 1
fi
if [[ ! -f "${BASELINE_FILE}" ]]; then
  echo "Baseline file not found: ${BASELINE_FILE}" >&2
  exit 1
fi

node - "$TREND_FILE" "$BASELINE_FILE" "$MAX_DELTA" <<'NODE'
const fs = require("fs");
const trendPath = process.argv[2];
const baselinePath = process.argv[3];
const maxDelta = Number(process.argv[4]);
const trend = JSON.parse(fs.readFileSync(trendPath, "utf8"));
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const current = Number(trend.warning_lines ?? 0);
const base = Number(baseline.warning_lines ?? 0);
const allowed = base + maxDelta;
if (!Number.isFinite(current) || !Number.isFinite(base) || !Number.isFinite(maxDelta)) {
  console.error("Invalid console guard regression inputs");
  process.exit(1);
}
if (current > allowed) {
  console.error(`Console guard warning regression: current=${current}, baseline=${base}, allowed=${allowed}`);
  process.exit(1);
}
console.log(`Console guard regression OK: current=${current}, baseline=${base}, allowed=${allowed}`);
NODE
