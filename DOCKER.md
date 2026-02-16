# Docker Deployment Guide for ChamberOfCommerceAI

## Overview

This guide covers running ChamberOfCommerceAI services in Docker containers, both locally for testing and deploying to Google Cloud Run.

## Local Development with Docker Compose

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for Firebase CLI if running emulators directly)

### Quick Start

```bash
# Build images
docker build -t chamberofcommerceai-api:local -f services/api-firebase/Dockerfile services/api-firebase/
docker build -t chamberofcommerceai-worker:local -f services/worker-firebase/Dockerfile services/worker-firebase/

# Start all services
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Services

The docker-compose setup includes:

1. **Firebase Emulators** (Port 4000)
   - Auth Emulator: Port 9099
   - Firestore Emulator: Port 8080
   - Storage Emulator: Port 9199
   - Emulator UI: http://localhost:4000

2. **API Service** (Port 4001)
   - Health endpoint: http://localhost:4001/health
   - Meetings API: http://localhost:4001/meetings
   - Audio API: http://localhost:4001/audio-sources

3. **Worker Service** (Port 4002)
   - Health endpoint: http://localhost:4002/health
   - Process task: POST http://localhost:4002/tasks/process

### Testing Without Authentication

The docker-compose setup has `FIREBASE_AUTH_ENABLED=false` by default, allowing you to test APIs without authentication tokens.

**Example API calls:**

```bash
# Health check
curl http://localhost:4001/health

# Create a meeting (no auth required in local mode)
curl -X POST http://localhost:4001/meetings \
  -H "Content-Type: application/json" \
  -d '{"title": "Board Meeting", "date": "2026-02-12", "organization_id": "org-1"}'

# Get meetings
curl http://localhost:4001/meetings
```

## Google Cloud Run Deployment

### Prerequisites

- Google Cloud Project with billing enabled
- gcloud CLI installed and authenticated
- Container Registry or Artifact Registry enabled

### Deployment Steps

1. **Tag images for GCR:**

```bash
# Set your project ID
export PROJECT_ID=chamberofcommerceai

# Tag images
docker tag chamberofcommerceai-api:local gcr.io/$PROJECT_ID/api-firebase:latest
docker tag chamberofcommerceai-worker:local gcr.io/$PROJECT_ID/worker-firebase:latest

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/api-firebase:latest
docker push gcr.io/$PROJECT_ID/worker-firebase:latest
```

2. **Deploy to Cloud Run:**

```bash
# Deploy API service
gcloud run deploy api-firebase \
  --image gcr.io/$PROJECT_ID/api-firebase:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID" \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT=/secrets/firebase-sa.json:latest"

# Deploy Worker service
gcloud run deploy worker-firebase \
  --image gcr.io/$PROJECT_ID/worker-firebase:latest \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID" \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT=/secrets/firebase-sa.json:latest"
```

### Environment Variables

**Required for Cloud Run:**
- `GCP_PROJECT_ID` - Your GCP project ID
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to service account JSON (or use secrets)
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket for audio files
- `NODE_ENV=production`

**Optional:**
- `FIREBASE_AUTH_ENABLED=true` - Enable Firebase authentication
- `CORS_ORIGIN` - CORS allowed origin (default: *)
- `LOG_LEVEL` - Logging level (default: info)

## Health Checks

Both services expose `/health` endpoints that return:

```json
{
  "ok": true,
  "service": "api|worker",
  "timestamp": "2026-02-12T..."
}
```

Cloud Run uses these for:
- Startup probes
- Liveness probes
- Readiness probes

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs <container-id>

# Inspect container
docker inspect <container-id>

# Shell into container
docker run -it --entrypoint /bin/bash chamberofcommerceai-api:local
```

### Firebase emulator connection issues

```bash
# Check emulator status
docker-compose logs firebase-emulators

# Ensure services are on same network
docker network ls
docker network inspect <project>_chamberofcommerceai-network
```

### Port conflicts

If ports 4000-4002, 8080, 9099, or 9199 are in use:

1. Stop conflicting services
2. Or modify `docker-compose.yml` to use different ports:

```yaml
services:
  api:
    ports:
      - "5001:8080"  # Change 4001 to 5001
```

## Production Considerations

1. **Security:**
   - Enable `FIREBASE_AUTH_ENABLED=true` in production
   - Use Secret Manager for sensitive credentials
   - Implement rate limiting
   - Set appropriate CORS origins

2. **Scaling:**
   - Configure Cloud Run min/max instances
   - Set appropriate CPU and memory limits
   - Use Cloud Load Balancing for multiple regions

3. **Monitoring:**
   - Enable Cloud Logging
   - Set up Cloud Monitoring alerts
   - Track health endpoint metrics

4. **Backup:**
   - Regular Firestore backups
   - GCS bucket versioning
   - Audit log retention

## Next Steps

- [ ] Set up Cloud Build for CI/CD
- [ ] Configure custom domain with Cloud Run
- [ ] Implement Cloud CDN for static assets
- [ ] Set up Cloud Armor for DDoS protection
