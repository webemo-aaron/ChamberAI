#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${SCRIPT_DIR}/../tests/playwright"

if [[ ! -d "${ROOT}" ]]; then
  echo "Quality gate failed: tests directory not found at ${ROOT}" >&2
  exit 1
fi

echo "Running Playwright quality checks..."

search_pattern() {
  local pattern="$1"
  if command -v rg >/dev/null 2>&1; then
    rg -n "${pattern}" "${ROOT}" --glob '!placeholders/**' --glob '*.js' --glob '*.mjs'
  else
    grep -R -n -E "${pattern}" "${ROOT}" --exclude-dir=placeholders --include='*.js' --include='*.mjs'
  fi
}

if search_pattern "expect\\(true\\)\\.toBeTruthy\\(\\)"; then
  echo "Quality gate failed: placeholder assertions found."
  exit 1
fi

# Allow accessibility spec attribute probes, but block blanket swallowed errors elsewhere.
if search_pattern "\\.catch\\(\\(\\) => null\\)" | grep -v "accessibility\\.spec\\.js"; then
  echo "Quality gate failed: swallowed errors found outside approved accessibility probes."
  exit 1
fi

echo "Playwright quality checks passed."
