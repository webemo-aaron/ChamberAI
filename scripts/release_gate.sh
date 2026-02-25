#!/usr/bin/env bash
set -euo pipefail

mkdir -p artifacts
REPORT="artifacts/release-gate-report.txt"
: > "$REPORT"

run_step() {
  local name="$1"
  shift
  echo "== ${name} ==" | tee -a "$REPORT"
  if "$@" 2>&1 | tee -a "$REPORT"; then
    echo "RESULT: PASS" | tee -a "$REPORT"
  else
    echo "RESULT: FAIL" | tee -a "$REPORT"
    return 1
  fi
  echo | tee -a "$REPORT"
}

run_step "Stack Verification" ./scripts/verify_local_stack.sh
run_step "Metrics Thresholds" ./scripts/check_metrics_thresholds.sh
run_step "Test Quality" npm run test:quality
run_step "Unit Tests" npm run test:unit
run_step "API Contract Tests" npm run test:contracts
run_step "E2E Critical" npm run test:e2e:critical
run_step "E2E Full" npm run test:e2e

echo "Release gate report written to ${REPORT}"
