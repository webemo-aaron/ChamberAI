#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${SCRIPT_DIR}/../tests/playwright"

if [[ ! -d "${ROOT}" ]]; then
  echo "Quality gate failed: tests directory not found at ${ROOT}" >&2
  exit 1
fi

echo "Running Playwright quality checks..."

if rg -n "expect\\(true\\)\\.toBeTruthy\\(\\)" "${ROOT}" --glob '!placeholders/**' --glob '*.js' --glob '*.mjs'; then
  echo "Quality gate failed: placeholder assertions found."
  exit 1
fi

# Allow accessibility spec attribute probes, but block blanket swallowed errors elsewhere.
if rg -n "\\.catch\\(\\(\\) => null\\)" "${ROOT}" --glob '!placeholders/**' --glob '*.js' --glob '*.mjs' | rg -v "accessibility\\.spec\\.js"; then
  echo "Quality gate failed: swallowed errors found outside approved accessibility probes."
  exit 1
fi

echo "Playwright quality checks passed."
