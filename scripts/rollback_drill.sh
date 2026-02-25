#!/usr/bin/env bash
set -euo pipefail

wait_for_stable_health() {
  local endpoint="$1"
  local label="$2"
  local target_consecutive="${3:-5}"
  local max_attempts="${4:-30}"
  local consecutive=0
  local attempt=0

  while (( attempt < max_attempts )); do
    attempt=$((attempt + 1))
    if curl -fsS "$endpoint" >/dev/null 2>&1; then
      consecutive=$((consecutive + 1))
      if (( consecutive >= target_consecutive )); then
        echo "${label} stable (${target_consecutive} consecutive successful checks)."
        return 0
      fi
    else
      consecutive=0
    fi
    sleep 1
  done

  echo "Failed to stabilize ${label} at ${endpoint} after ${max_attempts} checks." >&2
  return 1
}

run_critical_with_retry() {
  local stage="$1"
  local retries="${2:-1}"
  local attempt=1

  while true; do
    echo "Running critical E2E (${stage}) attempt ${attempt}/$((retries + 1))"
    if npm run test:e2e:critical; then
      return 0
    fi

    if (( attempt > retries )); then
      echo "Critical E2E failed during ${stage} after $((retries + 1)) attempts." >&2
      return 1
    fi

    echo "Critical E2E failed during ${stage}; retrying after stack health check..."
    ./scripts/verify_local_stack.sh
    wait_for_stable_health "http://127.0.0.1:4001/health" "API"
    wait_for_stable_health "http://127.0.0.1:5173/" "Console"
    wait_for_stable_health "http://127.0.0.1:4002/health" "Worker"
    attempt=$((attempt + 1))
  done
}

echo "== Rollback Drill =="
echo "[1/6] Validate current stack"
./scripts/verify_local_stack.sh

echo "[2/6] Snapshot release gate critical checks"
npm run test:unit
run_critical_with_retry "pre-rollback"

echo "[3/6] Simulate rollback by recreating stack"
docker compose down
docker compose up -d

echo "[4/6] Validate rolled back stack health"
./scripts/verify_local_stack.sh
wait_for_stable_health "http://127.0.0.1:4001/health" "API"
wait_for_stable_health "http://127.0.0.1:5173/" "Console"
wait_for_stable_health "http://127.0.0.1:4002/health" "Worker"

echo "[5/6] Re-run critical checks after rollback"
npm run test:unit
run_critical_with_retry "post-rollback"

echo "[6/6] Rollback drill complete"
