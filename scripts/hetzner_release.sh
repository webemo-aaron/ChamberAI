#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.hybrid}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

APP_DIR="${APP_DIR:-$(pwd)}"
DEPLOY_STABILIZATION_SECONDS="${DEPLOY_STABILIZATION_SECONDS:-15}"
RELEASE_REF="${RELEASE_REF:-$(git rev-parse --short HEAD 2>/dev/null || printf 'unknown')}"
SNAPSHOT_LABEL="${HCLOUD_SNAPSHOT_LABEL:-chamberai-auto}"
SNAPSHOT_REASON="${SNAPSHOT_REASON:-pre-deploy}"

echo "== Hetzner release workflow =="
echo "Env file: ${ENV_FILE}"
echo "Release ref: ${RELEASE_REF}"
echo "App dir: ${APP_DIR}"

"${APP_DIR}/scripts/hetzner_preflight.sh" "${ENV_FILE}"

echo "== Create application backup =="
backup_output="$("${APP_DIR}/scripts/backup_hybrid_data.sh" "${ENV_FILE}")"
printf '%s\n' "${backup_output}"
backup_archive="$(printf '%s\n' "${backup_output}" | awk -F': ' '/Backup complete: /{print $2}' | tail -1)"

echo "== Create Hetzner snapshot =="
SNAPSHOT_LABEL="${SNAPSHOT_LABEL}" \
RETENTION_COUNT="${HCLOUD_SNAPSHOT_RETENTION:-7}" \
SNAPSHOT_REASON="${SNAPSHOT_REASON}" \
RELEASE_REF="${RELEASE_REF}" \
"${APP_DIR}/scripts/hetzner_snapshot.sh"

echo "== Deploy hybrid stack =="
"${APP_DIR}/scripts/deploy_hybrid_vps.sh" "${ENV_FILE}"

echo "== Stabilization wait =="
sleep "${DEPLOY_STABILIZATION_SECONDS}"

echo "== Verify hybrid stack =="
if ! "${APP_DIR}/scripts/verify_hybrid_stack.sh" "${ENV_FILE}"; then
  echo "Verification failed after deploy." >&2
  echo "Most recent backup: ${backup_archive:-unknown}" >&2
  echo "Run ./scripts/hetzner_rollback.sh ${ENV_FILE} with ROLLBACK_MODE=app or snapshot." >&2
  exit 1
fi

echo "== Verify showcase data =="
if ! "${APP_DIR}/scripts/verify_showcase_data.sh" "${ENV_FILE}"; then
  echo "Showcase data verification failed after deploy." >&2
  echo "Most recent backup: ${backup_archive:-unknown}" >&2
  echo "Run ./scripts/hetzner_rollback.sh ${ENV_FILE} with ROLLBACK_MODE=app or snapshot." >&2
  exit 1
fi

echo "== Post-deploy preflight =="
"${APP_DIR}/scripts/hetzner_preflight.sh" "${ENV_FILE}"
echo "Release workflow complete."
