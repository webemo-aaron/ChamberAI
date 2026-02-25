#!/usr/bin/env bash
set -euo pipefail

# Configure low-cost controls:
# - Cloud Storage lifecycle for audio retention
# - Reassert Cloud Run scale-to-zero settings
#
# Usage:
#   ./scripts/configure_gcp_low_cost_controls.sh .env.gcp.vercel

ENV_FILE="${1:-.env.gcp.vercel}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

: "${PROJECT_ID:?PROJECT_ID is required}"
: "${REGION:?REGION is required}"
: "${API_SERVICE:?API_SERVICE is required}"
: "${WORKER_SERVICE:?WORKER_SERVICE is required}"
: "${GCS_BUCKET_NAME:?GCS_BUCKET_NAME is required}"

API_MIN_INSTANCES="${API_MIN_INSTANCES:-0}"
API_MAX_INSTANCES="${API_MAX_INSTANCES:-2}"
WORKER_MIN_INSTANCES="${WORKER_MIN_INSTANCES:-0}"
WORKER_MAX_INSTANCES="${WORKER_MAX_INSTANCES:-1}"
AUDIO_RETENTION_DAYS="${AUDIO_RETENTION_DAYS:-30}"

echo "== Configure gcloud project =="
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "== Reapply scale-to-zero settings =="
gcloud run services update "${API_SERVICE}" \
  --region "${REGION}" \
  --min-instances "${API_MIN_INSTANCES}" \
  --max-instances "${API_MAX_INSTANCES}" >/dev/null

gcloud run services update "${WORKER_SERVICE}" \
  --region "${REGION}" \
  --min-instances "${WORKER_MIN_INSTANCES}" \
  --max-instances "${WORKER_MAX_INSTANCES}" >/dev/null

echo "== Apply storage lifecycle policy (${AUDIO_RETENTION_DAYS} days) =="
TMP_RULE="$(mktemp)"
cat > "${TMP_RULE}" <<EOF
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": { "age": ${AUDIO_RETENTION_DAYS} }
    }
  ]
}
EOF
gcloud storage buckets update "gs://${GCS_BUCKET_NAME}" --lifecycle-file="${TMP_RULE}" >/dev/null
rm -f "${TMP_RULE}"

echo "Low-cost controls applied."
