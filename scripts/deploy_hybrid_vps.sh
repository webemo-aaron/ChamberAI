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

echo "== Build and start hybrid stack =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build

echo "== Compose status =="
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

echo "Deployment complete."
