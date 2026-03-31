#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"
SHOWCASE_NAMESPACE="${SHOWCASE_NAMESPACE:-showcase-live}"
SHOWCASE_AUTH_TOKEN="${SHOWCASE_AUTH_TOKEN:-demo-token}"
SHOWCASE_AUTH_EMAIL="${SHOWCASE_AUTH_EMAIL:-admin@acme.com}"
RUNTIME_API_BASE="${API_BASE:-}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

APP_DIR="${APP_DIR:-$(pwd)}"

# Use runtime API override (if provided), else env/deployed value, else local fallback
if [[ -n "${RUNTIME_API_BASE}" ]]; then
  API_BASE="${RUNTIME_API_BASE}"
else
  API_BASE="${API_BASE:-http://127.0.0.1}"
fi

echo "== Verify Showcase Data =="
echo "API base: ${API_BASE}"
echo "Namespace: ${SHOWCASE_NAMESPACE}"

# Run audit with timeout
export API_BASE
export SHOWCASE_NAMESPACE
export SHOWCASE_AUTH_TOKEN
export SHOWCASE_AUTH_EMAIL

timeout 30s node "${APP_DIR}/scripts/audit_showcase_data.mjs" || {
  echo "Showcase data audit failed." >&2
  exit 1
}

echo "Showcase data verification complete."
