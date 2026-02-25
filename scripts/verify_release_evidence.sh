#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR="${ARTIFACTS_DIR:-artifacts}"
EVIDENCE_DIR="${ARTIFACTS_DIR}/release-evidence"

required=(
  "release-gate-report.txt"
  "rollback-drill-report.txt"
  "e2e-critical-summary.txt"
  "metrics-api.json"
  "metrics-worker.json"
  "git-revision.txt"
  "generated-at-utc.txt"
  "checksums.sha256"
  "manifest.txt"
)

for file in "${required[@]}"; do
  if [[ ! -f "${EVIDENCE_DIR}/${file}" ]]; then
    echo "Missing evidence file: ${EVIDENCE_DIR}/${file}" >&2
    exit 1
  fi
done

(
  cd "${EVIDENCE_DIR}"
  sha256sum -c checksums.sha256
)

echo "Release evidence verification passed: ${EVIDENCE_DIR}"
