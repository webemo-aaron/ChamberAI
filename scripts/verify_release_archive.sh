#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_FILE="${1:-artifacts/release-evidence.tar.gz}"

if [[ ! -f "${ARCHIVE_FILE}" ]]; then
  echo "Archive not found: ${ARCHIVE_FILE}" >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

tar -xzf "${ARCHIVE_FILE}" -C "${tmpdir}"

if [[ ! -d "${tmpdir}/release-evidence" ]]; then
  echo "Archive missing release-evidence directory" >&2
  exit 1
fi

(
  cd "${tmpdir}/release-evidence"
  test -f checksums.sha256
  sha256sum -c checksums.sha256
)

echo "Release evidence archive verified: ${ARCHIVE_FILE}"
