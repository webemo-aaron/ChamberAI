#!/usr/bin/env bash
set -euo pipefail

# Check whether the active gcloud principal has the minimum access
# needed for ChamberAI Cloud Run readiness and deployment operations.
#
# Usage:
#   ./scripts/check_gcp_deploy_permissions.sh .env.gcp.vercel

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

echo "== Active gcloud principal =="
gcloud auth list --filter=status:ACTIVE --format="value(account)"

echo "== Target project =="
echo "${PROJECT_ID}"

missing=0

check_cmd() {
  local label="$1"
  shift

  echo "-- ${label}"
  if "$@" >/dev/null 2>&1; then
    echo "ok: ${label}"
  else
    echo "missing: ${label}" >&2
    missing=1
  fi
}

check_cmd "Cloud Run viewer: API service" \
  gcloud run services describe "${API_SERVICE}" --project "${PROJECT_ID}" --region "${REGION}"

check_cmd "Cloud Run viewer: worker service" \
  gcloud run services describe "${WORKER_SERVICE}" --project "${PROJECT_ID}" --region "${REGION}"

check_cmd "Storage access: audio bucket" \
  gcloud storage buckets describe "gs://${GCS_BUCKET_NAME}" --project "${PROJECT_ID}"

if [[ "${missing}" -ne 0 ]]; then
  echo "Missing required access. See docs/DEPLOYMENT_GCP_VERCEL_LOW_COST.md for required IAM roles." >&2
  exit 1
fi

echo "Permission preflight complete."
