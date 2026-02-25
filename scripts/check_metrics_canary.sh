#!/usr/bin/env bash
set -euo pipefail

API_METRICS_URL="${API_METRICS_URL:-http://127.0.0.1:4001/metrics}"
WORKER_METRICS_URL="${WORKER_METRICS_URL:-http://127.0.0.1:4002/metrics}"
WINDOW_SECONDS="${CANARY_WINDOW_SECONDS:-15}"
MAX_DELTA_ERROR_RATE="${MAX_DELTA_ERROR_RATE:-0.05}"

snapshot() {
  local url="$1"
  curl -fsS "$url"
}

api_start="$(snapshot "$API_METRICS_URL")"
worker_start="$(snapshot "$WORKER_METRICS_URL")"
sleep "$WINDOW_SECONDS"
api_end="$(snapshot "$API_METRICS_URL")"
worker_end="$(snapshot "$WORKER_METRICS_URL")"

node - "$MAX_DELTA_ERROR_RATE" "$api_start" "$api_end" "$worker_start" "$worker_end" <<'NODE'
const maxRate = Number(process.argv[2]);
const apiStart = JSON.parse(process.argv[3]);
const apiEnd = JSON.parse(process.argv[4]);
const workerStart = JSON.parse(process.argv[5]);
const workerEnd = JSON.parse(process.argv[6]);

function check(name, start, end) {
  const deltaReq = Number(end.requests_total ?? 0) - Number(start.requests_total ?? 0);
  const deltaErr = Number(end.errors_total ?? 0) - Number(start.errors_total ?? 0);
  const rate = deltaReq <= 0 ? 0 : deltaErr / deltaReq;
  if (!Number.isFinite(rate) || rate > maxRate) {
    throw new Error(`${name} canary delta error rate ${rate.toFixed(4)} exceeds ${maxRate}`);
  }
  console.log(`${name} canary OK: delta_requests=${deltaReq} delta_errors=${deltaErr} delta_error_rate=${rate.toFixed(4)}`);
}

check("api", apiStart, apiEnd);
check("worker", workerStart, workerEnd);
NODE
