#!/usr/bin/env bash
set -euo pipefail

echo "== Reset Test State =="
echo "[1/3] Recreate stack with fresh volumes"
docker compose down -v || true
docker compose up -d

echo "[2/3] Wait for healthy services"
bash ./scripts/verify_local_stack.sh

echo "[3/3] Reset complete"
echo "Stack is ready with clean emulator data."
