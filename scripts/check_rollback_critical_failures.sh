#!/usr/bin/env bash
set -euo pipefail

REPORT_FILE="${1:-artifacts/rollback-drill-report.txt}"

if [[ ! -f "${REPORT_FILE}" ]]; then
  echo "Rollback report not found: ${REPORT_FILE}" >&2
  exit 1
fi

if ! grep -q "\[6/6\] Rollback drill complete" "${REPORT_FILE}"; then
  echo "Rollback drill did not complete successfully." >&2
  exit 1
fi

if grep -Eq "[1-9][0-9]* failed" "${REPORT_FILE}"; then
  echo "Rollback drill report contains test failures." >&2
  grep -En "[1-9][0-9]* failed" "${REPORT_FILE}" >&2 || true
  exit 1
fi

echo "Rollback critical-test gate OK: no failed tests detected."
