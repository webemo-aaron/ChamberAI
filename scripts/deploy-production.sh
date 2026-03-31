#!/bin/bash
set -e

# ChamberAI Production Deployment Script
# Stages: dev → staging → canary (10%) → production (100%)
# Usage: ./scripts/deploy-production.sh --version v1.0.0 --env staging

VERSION=${1:-""}
ENV=${2:-"staging"}
PROJECT=""
IMAGE_TAG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --version) VERSION="$2"; shift 2 ;;
    --env) ENV="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Validate
if [ -z "$VERSION" ]; then
  echo "❌ Error: --version required (e.g., v1.0.0)"
  exit 1
fi

# Map environment to project
case "$ENV" in
  staging) PROJECT="chamberai-staging" ;;
  prod|production) PROJECT="chamberai-prod" ;;
  *) echo "❌ Unknown environment: $ENV"; exit 1 ;;
esac

IMAGE_TAG="gcr.io/${PROJECT}/api:${VERSION}"

echo "🚀 Deploying ChamberAI ${VERSION} to ${ENV}..."
echo "   Project: ${PROJECT}"
echo "   Image: ${IMAGE_TAG}"

# Step 1: Verify tests pass
echo ""
echo "📋 Step 1: Running test suite..."
npm run test || { echo "❌ Tests failed"; exit 1; }

# Step 2: Build Docker image
echo ""
echo "🔨 Step 2: Building Docker image..."
docker build -t "${IMAGE_TAG}" \
  --build-arg NODE_ENV="${ENV}" \
  -f services/api-firebase/Dockerfile \
  services/api-firebase

# Step 3: Push to Container Registry
echo ""
echo "📤 Step 3: Pushing image to GCR..."
docker push "${IMAGE_TAG}"

# Step 4: Deploy to Cloud Run
echo ""
echo "☁️  Step 4: Deploying to Cloud Run..."
gcloud run deploy chamberai-api \
  --project "${PROJECT}" \
  --image "${IMAGE_TAG}" \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 4 \
  --max-instances 50 \
  --allow-unauthenticated=false \
  --set-env-vars="NODE_ENV=${ENV},FIRESTORE_PROJECT_ID=${PROJECT}" \
  --no-traffic

# Get the new revision name
NEW_REVISION=$(gcloud run services describe chamberai-api \
  --project "${PROJECT}" \
  --region us-central1 \
  --format='value(status.latestCreatedRevisionName)')

echo "✅ New revision deployed: ${NEW_REVISION}"

# Step 5: Smoke tests
echo ""
echo "🧪 Step 5: Running smoke tests..."
SERVICE_URL=$(gcloud run services describe chamberai-api \
  --project "${PROJECT}" \
  --region us-central1 \
  --format='value(status.address.url)')

# Test health endpoint
if ! curl -s "${SERVICE_URL}/health" | grep -q '"ok"'; then
  echo "❌ Health check failed"
  exit 1
fi

echo "✅ Smoke tests passed"

# Step 6: Traffic rollout (production only)
if [ "$ENV" = "prod" ] || [ "$ENV" = "production" ]; then
  echo ""
  echo "📊 Step 6: Starting canary rollout..."
  echo "   10% to new revision, 90% to previous (${NEW_REVISION})"
  
  # Get previous revision
  PREVIOUS_REVISION=$(gcloud run services describe chamberai-api \
    --project "${PROJECT}" \
    --region us-central1 \
    --format='value(status.traffic[0].revisionName)')
  
  # 10% canary
  gcloud run services update-traffic chamberai-api \
    --project "${PROJECT}" \
    --region us-central1 \
    --to-revisions "${NEW_REVISION}=10,${PREVIOUS_REVISION}=90"
  
  echo "⏱️  Monitoring for 15 minutes... (check Sentry & Cloud Monitoring)"
  echo "   URL: ${SERVICE_URL}"
  sleep 15m
  
  # Check error rate (manually or via monitoring API)
  echo ""
  echo "📈 Scaling to 50% traffic..."
  gcloud run services update-traffic chamberai-api \
    --project "${PROJECT}" \
    --region us-central1 \
    --to-revisions "${NEW_REVISION}=50,${PREVIOUS_REVISION}=50"
  
  sleep 10m
  
  echo ""
  echo "✅ Scaling to 100% traffic (full rollout)..."
  gcloud run services update-traffic chamberai-api \
    --project "${PROJECT}" \
    --region us-central1 \
    --to-revisions "${NEW_REVISION}=100"
else
  # Staging: immediate full traffic
  gcloud run services update-traffic chamberai-api \
    --project "${PROJECT}" \
    --region us-central1 \
    --to-revisions "${NEW_REVISION}=100"
fi

echo ""
echo "✅ Deployment complete!"
echo "   Revision: ${NEW_REVISION}"
echo "   URL: ${SERVICE_URL}"
