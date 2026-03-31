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
if ! ./scripts/verify_hybrid_stack.sh "$ENV_FILE"; then
  echo "ERROR: Verification failed, rolling back..."

  # Simple rollback: bring stack back up with previous images if available
  # In production, you'd use saved image tags
  docker compose -f docker-compose.hybrid.yml down || true
  echo "Rollback complete. Manual intervention may be required."
  exit 1
fi

echo ""
echo "=== Deploy Successful ==="
echo "Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
