#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"
COMPOSE_FILE="docker-compose.hybrid.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  echo "Copy .env.hybrid.example to ${ENV_FILE} and set values." >&2
  exit 1
fi

echo "== Validate compose config =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config >/dev/null

echo "== Build API image (no cache) =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build --no-cache api

echo "== Build remaining hybrid stack images =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build

echo "== Verify API image integrity =="
bash "$(dirname "$0")/verify_api_image_integrity.sh" "chamberofcommerceai-api:local"

echo "== Start hybrid stack =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d

echo "== Compose status =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

echo "Deployment complete."
