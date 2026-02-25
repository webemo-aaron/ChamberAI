#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"
COMPOSE_FILE="docker-compose.hybrid.yml"
BACKUP_DIR="${BACKUP_DIR:-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "${BACKUP_DIR}"

project_name="$(grep -E '^COMPOSE_PROJECT_NAME=' "${ENV_FILE}" 2>/dev/null | cut -d= -f2 || true)"
if [[ -z "${project_name}" ]]; then
  project_name="chamberofcommerceai"
fi

volume_name="${project_name}_firebase-data"
archive_path="${BACKUP_DIR}/firebase-data-${STAMP}.tgz"

echo "Backing up volume ${volume_name} -> ${archive_path}"
docker run --rm \
  -v "${volume_name}:/volume:ro" \
  -v "$(pwd)/${BACKUP_DIR}:/backup" \
  alpine:3.20 \
  sh -c "tar -czf /backup/$(basename "${archive_path}") -C /volume ."

cp -f "${ENV_FILE}" "${BACKUP_DIR}/env-${STAMP}.backup"
echo "Backup complete: ${archive_path}"

# Keep latest 14 backups by default
keep="${KEEP_BACKUPS:-14}"
ls -1t "${BACKUP_DIR}"/firebase-data-*.tgz 2>/dev/null | awk "NR>${keep}" | xargs -r rm -f
