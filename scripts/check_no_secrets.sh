#!/usr/bin/env bash
set -euo pipefail

mkdir -p artifacts/security

OUT_FILE="artifacts/security/secret-scan.txt"
PATTERN='(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|OPENAI_API_KEY\s*=\s*[^[:space:]]+|AWS_SECRET_ACCESS_KEY\s*=\s*[^[:space:]]+|PRIVATE_KEY\s*=\s*.+|SECRET_KEY\s*=\s*[^[:space:]]+|TOKEN\s*=\s*[^[:space:]]+)'

rg -n -S "${PATTERN}" \
  --glob '!docs/**' \
  --glob '!artifacts/**' \
  --glob '!node_modules/**' \
  --glob '!.git/**' \
  --glob '!coverage/**' \
  --glob '!playwright-report/**' \
  --glob '!test-results/**' \
  --glob '!**/*.md' \
  --glob '!**/.env.example' \
  > "${OUT_FILE}" || true

if [[ -s "${OUT_FILE}" ]]; then
  echo "Potential secret material found:" >&2
  cat "${OUT_FILE}" >&2
  exit 1
fi

echo "No potential secrets found." | tee "${OUT_FILE}"
