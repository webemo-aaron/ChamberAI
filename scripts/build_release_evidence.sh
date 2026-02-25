#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR="${ARTIFACTS_DIR:-artifacts}"
EVIDENCE_DIR="${ARTIFACTS_DIR}/release-evidence"
REPORT_FILE="${ARTIFACTS_DIR}/release-gate-report.txt"
ROLLBACK_FILE="${ARTIFACTS_DIR}/rollback-drill-report.txt"
API_METRICS_URL="${API_METRICS_URL:-http://127.0.0.1:4001/metrics}"
WORKER_METRICS_URL="${WORKER_METRICS_URL:-http://127.0.0.1:4002/metrics}"

mkdir -p "${EVIDENCE_DIR}"

if [[ ! -f "${REPORT_FILE}" ]]; then
  echo "Missing release gate report: ${REPORT_FILE}" >&2
  exit 1
fi
if [[ ! -f "${ROLLBACK_FILE}" ]]; then
  echo "Missing rollback drill report: ${ROLLBACK_FILE}" >&2
  exit 1
fi

cp "${REPORT_FILE}" "${EVIDENCE_DIR}/release-gate-report.txt"
cp "${ROLLBACK_FILE}" "${EVIDENCE_DIR}/rollback-drill-report.txt"

awk '
  /^== E2E Critical ==/ { capture=1 }
  capture { print }
  /^== E2E Full ==/ { exit }
' "${REPORT_FILE}" > "${EVIDENCE_DIR}/e2e-critical-summary.txt"

curl -fsS "${API_METRICS_URL}" > "${EVIDENCE_DIR}/metrics-api.json"
curl -fsS "${WORKER_METRICS_URL}" > "${EVIDENCE_DIR}/metrics-worker.json"

git rev-parse HEAD > "${EVIDENCE_DIR}/git-revision.txt"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "${EVIDENCE_DIR}/generated-at-utc.txt"

manifest="${EVIDENCE_DIR}/manifest.txt"
checksums="${EVIDENCE_DIR}/checksums.sha256"
: > "${manifest}"
(
  cd "${EVIDENCE_DIR}"
  for file in release-gate-report.txt rollback-drill-report.txt e2e-critical-summary.txt metrics-api.json metrics-worker.json git-revision.txt generated-at-utc.txt; do
    if [[ -f "$file" ]]; then
      sha256sum "$file"
    fi
  done
) > "${checksums}"

{
  echo "Release Evidence Bundle"
  echo "Generated: $(cat "${EVIDENCE_DIR}/generated-at-utc.txt")"
  echo "Git revision: $(cat "${EVIDENCE_DIR}/git-revision.txt")"
  echo
  echo "Files:"
} >> "${manifest}"
cat "${checksums}" >> "${manifest}"

echo "Release evidence bundle written to ${EVIDENCE_DIR}"
