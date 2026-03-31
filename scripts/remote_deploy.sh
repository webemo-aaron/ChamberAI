#!/usr/bin/env bash
#
# remote_deploy.sh
#
# Deploy script that runs on the Hetzner VPS.
# Pulls latest code, rebuilds, and verifies the stack.
#
# Usage:
#   cd /opt/ChamberAI
#   ./scripts/remote_deploy.sh
#
# Or with custom env file:
#   ./scripts/remote_deploy.sh /path/to/.env.hybrid

set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"
APP_DIR="${APP_DIR:-/opt/ChamberAI}"
VERIFY_RETRIES="${VERIFY_RETRIES:-4}"
VERIFY_RETRY_DELAY_SECONDS="${VERIFY_RETRY_DELAY_SECONDS:-20}"
POST_DEPLOY_STABILIZATION_SECONDS="${POST_DEPLOY_STABILIZATION_SECONDS:-30}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Environment file not found: $ENV_FILE"
  exit 1
fi

echo "=== ChamberAI Remote Deploy ==="
echo "App directory: $APP_DIR"
echo "Environment file: $ENV_FILE"
echo "Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# Pull latest code
echo ""
echo "--- Pulling latest code ---"
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

# Load env to get image tags for rollback
source "$ENV_FILE" || true

# Deploy stack
echo ""
echo "--- Deploying stack ---"
if ! ./scripts/deploy_hybrid_vps.sh "$ENV_FILE"; then
  echo "ERROR: Deployment failed"
  exit 1
fi

# Verify deployment
echo ""
echo "--- Verifying deployment ---"
echo "Stabilization wait: ${POST_DEPLOY_STABILIZATION_SECONDS}s"
sleep "${POST_DEPLOY_STABILIZATION_SECONDS}"

verify_ok=0
for attempt in $(seq 1 "${VERIFY_RETRIES}"); do
  echo "Verification attempt ${attempt}/${VERIFY_RETRIES}"
  if ./scripts/verify_hybrid_stack.sh "$ENV_FILE"; then
    verify_ok=1
    break
  fi
  if [[ "${attempt}" -lt "${VERIFY_RETRIES}" ]]; then
    echo "Verification failed; retrying in ${VERIFY_RETRY_DELAY_SECONDS}s..."
    sleep "${VERIFY_RETRY_DELAY_SECONDS}"
  fi
done

if [[ "${verify_ok}" -ne 1 ]]; then
  echo "ERROR: Verification failed after ${VERIFY_RETRIES} attempts, rolling back..."

  # Simple rollback: bring stack down for manual intervention
  docker compose -f docker-compose.hybrid.yml down || true
  echo "Rollback complete. Manual intervention may be required."
  exit 1
fi

echo ""
echo "=== Deploy Successful ==="
echo "Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
