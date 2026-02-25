#!/usr/bin/env bash
set -euo pipefail

echo "== Verify Local Stack =="

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD="docker compose"
fi

echo "[1/4] Compose status"
${COMPOSE_CMD} ps

echo "[2/4] Console health (in-container)"
${COMPOSE_CMD} exec -T console node -e "require('http').get('http://localhost:5173/healthz',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

echo "[3/4] API health (in-container)"
${COMPOSE_CMD} exec -T api node -e "require('http').get('http://localhost:8080/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

echo "[4/4] Worker health (in-container)"
${COMPOSE_CMD} exec -T worker node -e "require('http').get('http://localhost:8080/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

echo "Stack verification complete."
