#!/usr/bin/env bash
set -euo pipefail

# Deploy secretary console static app to Vercel.
# Requires Vercel CLI auth and project linkage.
#
# Usage:
#   ./scripts/deploy_vercel_console.sh
# Optional:
#   VERCEL_TOKEN=... ./scripts/deploy_vercel_console.sh

APP_DIR="apps/secretary-console"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is not installed." >&2
  exit 1
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "App directory not found: ${APP_DIR}" >&2
  exit 1
fi

echo "== Deploy secretary console to Vercel (production) =="
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  vercel --token "${VERCEL_TOKEN}" --cwd "${APP_DIR}" deploy --prod --yes
else
  vercel --cwd "${APP_DIR}" deploy --prod --yes
fi
