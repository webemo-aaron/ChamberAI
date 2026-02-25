#!/usr/bin/env bash
set -euo pipefail

SOAK_CRITICAL_RUNS="${SOAK_CRITICAL_RUNS:-10}"
SOAK_ROLLBACK_RUNS="${SOAK_ROLLBACK_RUNS:-3}"
SKIP_RESET="${SKIP_RESET:-0}"

run_step() {
  local label="$1"
  shift
  echo ""
  echo "== ${label} =="
  "$@"
}

run_soak() {
  mkdir -p artifacts/soak
  local crit_pass=0
  local crit_fail=0
  local roll_pass=0
  local roll_fail=0

  for i in $(seq 1 "${SOAK_CRITICAL_RUNS}"); do
    echo "[critical] run ${i}/${SOAK_CRITICAL_RUNS}"
    if npm run test:e2e:critical >"artifacts/soak/critical-${i}.log" 2>&1; then
      crit_pass=$((crit_pass + 1))
    else
      crit_fail=$((crit_fail + 1))
    fi
  done

  for i in $(seq 1 "${SOAK_ROLLBACK_RUNS}"); do
    echo "[rollback] run ${i}/${SOAK_ROLLBACK_RUNS}"
    if npm run test:rollback-drill >"artifacts/soak/rollback-${i}.log" 2>&1; then
      roll_pass=$((roll_pass + 1))
    else
      roll_fail=$((roll_fail + 1))
    fi
    cp -f artifacts/rollback-drill-report.txt "artifacts/soak/rollback-${i}-report.txt" || true
  done

  cat > artifacts/soak/soak-summary.json <<EOF
{"critical":{"total":${SOAK_CRITICAL_RUNS},"pass":${crit_pass},"fail":${crit_fail}},"rollback":{"total":${SOAK_ROLLBACK_RUNS},"pass":${roll_pass},"fail":${roll_fail}}}
EOF

  cat artifacts/soak/soak-summary.json

  if (( crit_fail > 0 || roll_fail > 0 )); then
    echo "Soak failed: critical_fail=${crit_fail}, rollback_fail=${roll_fail}" >&2
    exit 1
  fi
}

echo "Starting local RC candidate pipeline"
echo "Config: SOAK_CRITICAL_RUNS=${SOAK_CRITICAL_RUNS}, SOAK_ROLLBACK_RUNS=${SOAK_ROLLBACK_RUNS}, SKIP_RESET=${SKIP_RESET}"

if [[ "${SKIP_RESET}" != "1" ]]; then
  run_step "Reset Test State" npm run test:reset-state
fi

run_step "Release Gate" npm run test:release-gate
run_step "Rollback Drill" npm run test:rollback-drill
run_step "Rollback Critical Gate" npm run test:rollback-critical-gate
run_step "Console Guard Trend" npm run test:console-guard-trend
run_step "Soak Loops" run_soak
run_step "Build Release Evidence" npm run release:evidence
run_step "Verify Release Evidence" ./scripts/verify_release_evidence.sh
run_step "Package Evidence Archive" tar -czf artifacts/release-evidence.tar.gz -C artifacts release-evidence
run_step "Verify Evidence Archive" npm run test:verify-release-archive

echo ""
echo "Local RC candidate PASS"
echo "Artifacts:"
echo "- artifacts/release-gate-report.txt"
echo "- artifacts/rollback-drill-report.txt"
echo "- artifacts/console-guard-warning-trend.json"
echo "- artifacts/release-evidence.tar.gz"
echo "- artifacts/soak/soak-summary.json"
