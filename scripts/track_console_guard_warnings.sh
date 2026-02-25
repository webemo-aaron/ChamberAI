#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${1:-artifacts/console-guard-warn.log}"
OUT_FILE="${2:-artifacts/console-guard-warning-count.txt}"
TREND_FILE="${3:-artifacts/console-guard-warning-trend.json}"

if [[ ! -f "${LOG_FILE}" ]]; then
  echo "Log file not found: ${LOG_FILE}" >&2
  exit 1
fi

count="$(grep -c '^console: ' "${LOG_FILE}" || true)"
blocks="$(grep -c '^Console guard warnings:' "${LOG_FILE}" || true)"
run_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

mkdir -p "$(dirname "${OUT_FILE}")"
mkdir -p "$(dirname "${TREND_FILE}")"

echo "warning_lines=${count}" > "${OUT_FILE}"
echo "warning_blocks=${blocks}" >> "${OUT_FILE}"
echo "generated_at=${run_at}" >> "${OUT_FILE}"

cat > "${TREND_FILE}" <<JSON
{"generated_at":"${run_at}","warning_lines":${count},"warning_blocks":${blocks}}
JSON

echo "Console guard warning trend: lines=${count} blocks=${blocks}"
