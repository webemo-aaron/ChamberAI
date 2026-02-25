#!/usr/bin/env bash
set -euo pipefail

# Quick monthly readiness checks for Vercel + GCP deployment.
#
# Usage:
#   ./scripts/check_gcp_monthly_readiness.sh .env.gcp.vercel

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

gcloud config set project "${PROJECT_ID}" >/dev/null

API_URL="$(gcloud run services describe "${API_SERVICE}" --region "${REGION}" --format='value(status.url)')"
WORKER_URL="$(gcloud run services describe "${WORKER_SERVICE}" --region "${REGION}" --format='value(status.url)')"

echo "== Endpoints =="
echo "API: ${API_URL}"
echo "Worker: ${WORKER_URL}"

echo "== API health =="
curl -fsS "${API_URL}/health"
echo

echo "== Cloud Run cost controls =="
api_min="$(gcloud run services describe "${API_SERVICE}" --region "${REGION}" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])")"
api_max="$(gcloud run services describe "${API_SERVICE}" --region "${REGION}" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])")"
worker_min="$(gcloud run services describe "${WORKER_SERVICE}" --region "${REGION}" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])")"
worker_max="$(gcloud run services describe "${WORKER_SERVICE}" --region "${REGION}" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])")"
echo "API scale: min=${api_min:-unset}, max=${api_max:-unset}"
echo "Worker scale: min=${worker_min:-unset}, max=${worker_max:-unset}"

echo "Monthly readiness checks complete."
