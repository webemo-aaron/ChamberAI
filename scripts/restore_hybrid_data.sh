#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-archive.tgz> [env-file]" >&2
  exit 1
fi

ARCHIVE_PATH="$1"
ENV_FILE="${2:-.env.hybrid}"
COMPOSE_FILE="docker-compose.hybrid.yml"

if [[ ! -f "${ARCHIVE_PATH}" ]]; then
  echo "Backup archive not found: ${ARCHIVE_PATH}" >&2
  exit 1
fi

project_name="$(grep -E '^COMPOSE_PROJECT_NAME=' "${ENV_FILE}" 2>/dev/null | cut -d= -f2 || true)"
if [[ -z "${project_name}" ]]; then
  project_name="chamberofcommerceai"
fi

volume_name="${project_name}_firebase-data"

echo "Stopping hybrid stack before restore..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down

echo "Restoring ${ARCHIVE_PATH} into volume ${volume_name}"
docker run --rm \
  -v "${volume_name}:/volume" \
  -v "$(dirname "${ARCHIVE_PATH}"):/backup:ro" \
  alpine:3.20 \
  sh -c "rm -rf /volume/* && tar -xzf /backup/$(basename "${ARCHIVE_PATH}") -C /volume"

echo "Starting hybrid stack after restore..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d
echo "Restore complete."
