#!/usr/bin/env bash
set -euo pipefail

API_METRICS_URL="${API_METRICS_URL:-http://127.0.0.1:4001/metrics}"
WORKER_METRICS_URL="${WORKER_METRICS_URL:-http://127.0.0.1:4002/metrics}"
MAX_ERROR_RATE="${MAX_ERROR_RATE:-0.05}"
ALERT_WEBHOOK_URL="${METRICS_ALERT_WEBHOOK_URL:-}"
failed=0

check_url() {
  local name="$1"
  local url="$2"
  local payload
  payload="$(curl -fsS "$url")"
  if ! node - "$name" "$MAX_ERROR_RATE" "$payload" <<'NODE'
const name = process.argv[2];
const maxErrorRate = Number(process.argv[3]);
const metrics = JSON.parse(process.argv[4]);
const total = Number(metrics.requests_total ?? 0);
const errors = Number(metrics.errors_total ?? 0);
const errorRate = total === 0 ? 0 : errors / total;
if (!Number.isFinite(errorRate) || errorRate > maxErrorRate) {
  console.error(`${name} error rate ${errorRate.toFixed(4)} exceeds threshold ${maxErrorRate}`);
  process.exit(1);
}
console.log(`${name} metrics OK: total=${total} errors=${errors} error_rate=${errorRate.toFixed(4)}`);
NODE
  then
    failed=1
  fi
}

check_url "api" "$API_METRICS_URL"
check_url "worker" "$WORKER_METRICS_URL"

if [[ "$failed" -ne 0 ]]; then
  if [[ -n "$ALERT_WEBHOOK_URL" ]]; then
    curl -sS -X POST -H "Content-Type: application/json" \
      -d "{\"text\":\"ChamberAI metrics threshold check failed. API: ${API_METRICS_URL}, Worker: ${WORKER_METRICS_URL}\"}" \
      "$ALERT_WEBHOOK_URL" >/dev/null || true
  fi
  exit 1
fi
