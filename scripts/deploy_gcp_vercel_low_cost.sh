#!/usr/bin/env bash
set -euo pipefail

# Deploy API + worker to Cloud Run with aggressive cost controls.
# Frontend is hosted on Vercel Pro.
#
# Usage:
#   ./scripts/deploy_gcp_vercel_low_cost.sh .env.gcp.vercel

ENV_FILE="${1:-.env.gcp.vercel}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  echo "Copy .env.gcp.vercel.example to ${ENV_FILE} and set values." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

: "${PROJECT_ID:?PROJECT_ID is required}"
: "${REGION:?REGION is required}"
: "${AR_REPO:?AR_REPO is required}"
: "${API_SERVICE:?API_SERVICE is required}"
: "${WORKER_SERVICE:?WORKER_SERVICE is required}"
: "${VERCEL_FRONTEND_URL:?VERCEL_FRONTEND_URL is required}"
: "${GCS_BUCKET_NAME:?GCS_BUCKET_NAME is required}"

API_MIN_INSTANCES="${API_MIN_INSTANCES:-0}"
API_MAX_INSTANCES="${API_MAX_INSTANCES:-2}"
WORKER_MIN_INSTANCES="${WORKER_MIN_INSTANCES:-0}"
WORKER_MAX_INSTANCES="${WORKER_MAX_INSTANCES:-1}"
API_MEMORY="${API_MEMORY:-512Mi}"
WORKER_MEMORY="${WORKER_MEMORY:-512Mi}"
API_CPU="${API_CPU:-1}"
WORKER_CPU="${WORKER_CPU:-1}"
FIREBASE_AUTH_ENABLED="${FIREBASE_AUTH_ENABLED:-true}"

echo "== Configure gcloud project =="
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "== Ensure required services are enabled =="
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firebase.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com >/dev/null

echo "== Ensure Artifact Registry repo exists =="
if ! gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="ChamberAI images" >/dev/null
fi

API_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/api-firebase:latest"
WORKER_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/worker-firebase:latest"

echo "== Build and push API image =="
gcloud builds submit services/api-firebase --tag "${API_IMAGE}" >/dev/null

echo "== Build and push Worker image =="
gcloud builds submit services/worker-firebase --tag "${WORKER_IMAGE}" >/dev/null

echo "== Deploy worker (private) =="
gcloud run deploy "${WORKER_SERVICE}" \
  --image "${WORKER_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --no-allow-unauthenticated \
  --cpu "${WORKER_CPU}" \
  --memory "${WORKER_MEMORY}" \
  --min-instances "${WORKER_MIN_INSTANCES}" \
  --max-instances "${WORKER_MAX_INSTANCES}" \
  --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=${PROJECT_ID},FIREBASE_USE_EMULATOR=false,GCS_BUCKET_NAME=${GCS_BUCKET_NAME}" >/dev/null

WORKER_URL="$(gcloud run services describe "${WORKER_SERVICE}" --region "${REGION}" --format='value(status.url)')"

echo "== Deploy API (public) =="
gcloud run deploy "${API_SERVICE}" \
  --image "${API_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --cpu "${API_CPU}" \
  --memory "${API_MEMORY}" \
  --min-instances "${API_MIN_INSTANCES}" \
  --max-instances "${API_MAX_INSTANCES}" \
  --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=${PROJECT_ID},FIREBASE_USE_EMULATOR=false,FIREBASE_AUTH_ENABLED=${FIREBASE_AUTH_ENABLED},GCS_BUCKET_NAME=${GCS_BUCKET_NAME},CORS_ORIGIN=${VERCEL_FRONTEND_URL},WORKER_ENDPOINT=${WORKER_URL}/tasks/process" >/dev/null

API_URL="$(gcloud run services describe "${API_SERVICE}" --region "${REGION}" --format='value(status.url)')"

echo "== Deployment complete =="
echo "API URL: ${API_URL}"
echo "Worker URL: ${WORKER_URL}"
echo ""
echo "Set this in Vercel runtime config/UI:"
echo "- API base: ${API_URL}"
