#!/usr/bin/env bash
set -euo pipefail

REPORT_FILE="${1:-artifacts/rollback-drill-report.txt}"
MAX_WARNINGS="${MAX_ROLLBACK_CONSOLE_WARNINGS:-120}"
OUT_FILE="${2:-artifacts/rollback-warning-count.txt}"
TREND_FILE="${3:-artifacts/rollback-warning-trend.json}"

if [[ ! -f "${REPORT_FILE}" ]]; then
  echo "Rollback report not found: ${REPORT_FILE}" >&2
  exit 1
fi

warning_count="$(grep -c '^console: ' "${REPORT_FILE}" || true)"
warning_blocks="$(grep -c '^Console guard warnings:' "${REPORT_FILE}" || true)"
generated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "$(dirname "${OUT_FILE}")"
mkdir -p "$(dirname "${TREND_FILE}")"
echo "warning_lines=${warning_count}" > "${OUT_FILE}"
echo "warning_blocks=${warning_blocks}" >> "${OUT_FILE}"
echo "threshold=${MAX_WARNINGS}" >> "${OUT_FILE}"
echo "generated_at=${generated_at}" >> "${OUT_FILE}"
cat > "${TREND_FILE}" <<JSON
{"generated_at":"${generated_at}","warning_lines":${warning_count},"warning_blocks":${warning_blocks},"threshold":${MAX_WARNINGS}}
JSON

if (( warning_count > MAX_WARNINGS )); then
  echo "Rollback warning threshold exceeded: ${warning_count} > ${MAX_WARNINGS}" >&2
  exit 1
fi

echo "Rollback warning threshold OK: ${warning_count}/${MAX_WARNINGS}"
