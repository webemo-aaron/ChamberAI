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

ROLLBACK_MODE="${ROLLBACK_MODE:-app}"
BACKUP_ARCHIVE="${BACKUP_ARCHIVE:-}"

echo "== Hetzner rollback =="
echo "Mode: ${ROLLBACK_MODE}"

case "${ROLLBACK_MODE}" in
  app)
    if [[ -z "${BACKUP_ARCHIVE}" ]]; then
      echo "BACKUP_ARCHIVE must be set for application rollback." >&2
      exit 1
    fi
    ./scripts/restore_hybrid_data.sh "${BACKUP_ARCHIVE}" "${ENV_FILE}"
    ./scripts/verify_hybrid_stack.sh "${ENV_FILE}"
    ;;
  snapshot)
    echo "Snapshot rollback is an operator-confirmed Hetzner action." >&2
    echo "Use Hetzner MCP or hcloud to rebuild from the desired snapshot, then redeploy and verify." >&2
    echo "Required inputs:" >&2
    echo "  HCLOUD_SERVER_ID=${HCLOUD_SERVER_ID:-unset}" >&2
    echo "  HCLOUD_FIREWALL_NAME=${HCLOUD_FIREWALL_NAME:-chamberai-firewall}" >&2
    echo "  Snapshot label prefix=${HCLOUD_SNAPSHOT_LABEL:-chamberai-auto}" >&2
    ;;
  *)
    echo "Unsupported ROLLBACK_MODE: ${ROLLBACK_MODE}" >&2
    exit 1
    ;;
esac

echo "Rollback workflow complete."
