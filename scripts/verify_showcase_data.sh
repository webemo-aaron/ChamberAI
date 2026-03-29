#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"
SHOWCASE_NAMESPACE="${SHOWCASE_NAMESPACE:-showcase-live}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

APP_DIR="${APP_DIR:-$(pwd)}"

# Use deployed API or fall back to local
API_BASE="${API_BASE:-http://127.0.0.1}"

echo "== Verify Showcase Data =="
echo "API base: ${API_BASE}"
echo "Namespace: ${SHOWCASE_NAMESPACE}"

# Run audit with timeout
export API_BASE
export SHOWCASE_NAMESPACE

timeout 30s node "${APP_DIR}/scripts/audit_showcase_data.mjs" || {
  echo "Showcase data audit failed." >&2
  exit 1
}

echo "Showcase data verification complete."
