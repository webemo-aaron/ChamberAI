#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${1:-root@46.224.10.3}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/opt/ChamberAI}"
MANIFEST_FILE="${MANIFEST_FILE:-$(dirname "$0")/lib/hetzner_release_sync_manifest.txt}"

if [[ ! -f "${MANIFEST_FILE}" ]]; then
  echo "Missing sync manifest: ${MANIFEST_FILE}" >&2
  exit 1
fi

mapfile -t manifest_paths < <(grep -v '^\s*$' "${MANIFEST_FILE}" | grep -v '^\s*#')
if [[ "${#manifest_paths[@]}" -eq 0 ]]; then
  echo "Sync manifest is empty: ${MANIFEST_FILE}" >&2
  exit 1
fi

echo "== Sync Hetzner release workspace =="
echo "Remote host: ${REMOTE_HOST}"
echo "Remote app dir: ${REMOTE_APP_DIR}"
echo "Manifest: ${MANIFEST_FILE}"

for path in "${manifest_paths[@]}"; do
  if [[ ! -e "${path}" ]]; then
    echo "Manifest path does not exist locally: ${path}" >&2
    exit 1
  fi
done

ssh "${REMOTE_HOST}" "mkdir -p '${REMOTE_APP_DIR}'"
tar czf - "${manifest_paths[@]}" | ssh "${REMOTE_HOST}" "tar xzf - -C '${REMOTE_APP_DIR}'"

echo "Synced paths:"
printf '  - %s\n' "${manifest_paths[@]}"
