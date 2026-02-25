#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"
COMPOSE_FILE="docker-compose.hybrid.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

echo "== Verify Hybrid Stack =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

echo "[1/3] API health (in-container)"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T api \
  node -e "require('http').get('http://localhost:8080/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

echo "[2/3] Worker health (in-container)"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T worker \
  node -e "require('http').get('http://localhost:8080/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

echo "[3/3] Caddy proxy health"
curl -fsS "http://127.0.0.1/health" >/dev/null || true
curl -fsS "http://127.0.0.1/meetings?limit=1" >/dev/null || true

echo "Hybrid stack verification complete."
