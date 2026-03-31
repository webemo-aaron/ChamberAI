#!/usr/bin/env bash
set -euo pipefail

API_METRICS_URL="${API_METRICS_URL:-${LOCAL_API_METRICS_URL:-http://127.0.0.1:4000/metrics}}"
WORKER_METRICS_URL="${WORKER_METRICS_URL:-${LOCAL_WORKER_METRICS_URL:-}}"
MAX_ERROR_RATE="${MAX_ERROR_RATE:-0.05}"
ALERT_WEBHOOK_URL="${METRICS_ALERT_WEBHOOK_URL:-}"
failed=0

probe_url_from_metrics() {
  local url="$1"
  if [[ "$url" == */metrics ]]; then
    printf '%s\n' "${url%/metrics}/health"
  else
    printf '%s\n' "$url"
  fi
}

sample_metrics() {
  local url="$1"
  curl -fsS "$url"
}

check_url() {
  local name="$1"
  local url="$2"
  local before after probe_url
  before="$(sample_metrics "$url")"
  probe_url="$(probe_url_from_metrics "$url")"
  curl -fsS "$probe_url" >/dev/null
  after="$(sample_metrics "$url")"
  if ! node - "$name" "$MAX_ERROR_RATE" "$before" "$after" <<'NODE'
const name = process.argv[2];
const maxErrorRate = Number(process.argv[3]);
const before = JSON.parse(process.argv[4]);
const after = JSON.parse(process.argv[5]);
const total = Math.max(0, Number(after.requests_total ?? 0) - Number(before.requests_total ?? 0));
const errors = Math.max(0, Number(after.errors_total ?? 0) - Number(before.errors_total ?? 0));
const errorRate = total === 0 ? 0 : errors / total;
if (!Number.isFinite(errorRate) || errorRate > maxErrorRate) {
  console.error(`${name} error rate ${errorRate.toFixed(4)} exceeds threshold ${maxErrorRate}`);
  process.exit(1);
}
console.log(`${name} metrics OK: window_total=${total} window_errors=${errors} error_rate=${errorRate.toFixed(4)}`);
NODE
  then
    failed=1
  fi
}

check_url "api" "$API_METRICS_URL"
if [[ -n "$WORKER_METRICS_URL" ]]; then
  check_url "worker" "$WORKER_METRICS_URL"
else
  echo "worker metrics skipped; set WORKER_METRICS_URL or LOCAL_WORKER_METRICS_URL to enforce"
fi

if [[ "$failed" -ne 0 ]]; then
  if [[ -n "$ALERT_WEBHOOK_URL" ]]; then
    curl -sS -X POST -H "Content-Type: application/json" \
      -d "{\"text\":\"ChamberAI metrics threshold check failed. API: ${API_METRICS_URL}, Worker: ${WORKER_METRICS_URL}\"}" \
      "$ALERT_WEBHOOK_URL" >/dev/null || true
  fi
  exit 1
fi
