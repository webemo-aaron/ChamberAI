#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"
SHOWCASE_NAMESPACE="${SHOWCASE_NAMESPACE:-showcase-live}"
SHOWCASE_AUTH_TOKEN="${SHOWCASE_AUTH_TOKEN:-demo-token}"
SHOWCASE_AUTH_EMAIL="${SHOWCASE_AUTH_EMAIL:-admin@acme.com}"
RUNTIME_API_BASE="${API_BASE:-}"
ALLOW_COMPOSE_FALLBACK="${SHOWCASE_ALLOW_COMPOSE_FALLBACK:-false}"

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

run_audit() {
  timeout 30s node "${APP_DIR}/scripts/audit_showcase_data.mjs"
}

if ! run_audit; then
  echo "Primary showcase audit failed for API base: ${API_BASE}" >&2

  if [[ "${ALLOW_COMPOSE_FALLBACK}" != "true" ]]; then
    echo "Compose-network fallback disabled. Set SHOWCASE_ALLOW_COMPOSE_FALLBACK=true to enable it." >&2
    echo "Showcase data audit failed." >&2
    exit 1
  fi

  if command -v docker >/dev/null 2>&1; then
    compose_project="${COMPOSE_PROJECT_NAME:-chamberofcommerceai}"
    compose_network="${compose_project}_${compose_project}-network"
    if docker network inspect "${compose_network}" >/dev/null 2>&1; then
      echo "Retrying showcase audit through compose network: ${compose_network}"
      docker run --rm \
        --network "${compose_network}" \
        -v "${APP_DIR}:/workspace" \
        -w /workspace \
        -e API_BASE="http://api:8080" \
        -e SHOWCASE_NAMESPACE="${SHOWCASE_NAMESPACE}" \
        -e SHOWCASE_AUTH_TOKEN="${SHOWCASE_AUTH_TOKEN}" \
        -e SHOWCASE_AUTH_EMAIL="${SHOWCASE_AUTH_EMAIL}" \
        node:20-slim \
        node /workspace/scripts/audit_showcase_data.mjs || {
          echo "Showcase data audit failed." >&2
          exit 1
        }
    else
      echo "Showcase data audit failed." >&2
      exit 1
    fi
  else
    echo "Showcase data audit failed." >&2
    exit 1
  fi
fi

echo "Showcase data verification complete."
