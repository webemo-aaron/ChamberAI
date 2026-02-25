#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/webemo-aaron/projects/ChamberAI/tests/playwright"
ACTIVE_FILES=$(find "$ROOT" -type f \( -name "*.js" -o -name "*.mjs" \) ! -path "*/placeholders/*")

echo "Running Playwright quality checks..."

if rg -n "expect\\(true\\)\\.toBeTruthy\\(\\)" $ACTIVE_FILES; then
  echo "Quality gate failed: placeholder assertions found."
  exit 1
fi

# Allow accessibility spec attribute probes, but block blanket swallowed errors elsewhere.
if rg -n "\\.catch\\(\\(\\) => null\\)" $ACTIVE_FILES | rg -v "accessibility\\.spec\\.js"; then
  echo "Quality gate failed: swallowed errors found outside approved accessibility probes."
  exit 1
fi

echo "Playwright quality checks passed."
