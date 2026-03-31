# ChamberAI Production Deployment Guide

## Overview

This guide covers deploying ChamberAI to production on Google Cloud Platform (GCP)
with a staged rollout strategy: development → staging → canary → production.

**Timeline**: ~2-3 hours for full rollout with monitoring

---

## Prerequisites

- `gcloud` CLI installed and authenticated
- `firebase-tools` CLI installed
- GitHub repository with release tags
- GCP project with billing enabled
- Domain registered (chamberai.com)
- Sentry account created

---

## Phase 1: Firebase Project Setup (30 min)

### Create Firebase Projects

```bash
# Create three separate projects for isolation
firebase projects:create chamberai-dev
firebase projects:create chamberai-staging
firebase projects:create chamberai-prod
```

### Enable Required Services

For each project:
```bash
gcloud services enable --project=chamberai-prod \
  firestore.googleapis.com \
  storage-api.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

### Deploy Firestore Rules

```bash
# Staging (test rules before prod)
firebase deploy --project chamberai-staging --only firestore:rules

# Production (after validation)
firebase deploy --project chamberai-prod --only firestore:rules
```

**Verify rules:**
```bash
# Test org isolation rule
curl -H "Authorization: Bearer {token_for_org_a}" \
  https://firestore.googleapis.com/v1/projects/chamberai-prod/databases/default/documents/organizations/org_b
# Should return 403 PERMISSION_DENIED
```

---

## Phase 2: Build & Container Setup (20 min)

### Build Docker Images

```bash
# Build API image
docker build -t gcr.io/chamberai-prod/api:v1.0.0 \
  --build-arg NODE_ENV=production \
  -f services/api-firebase/Dockerfile \
  services/api-firebase

# Push to Container Registry
docker push gcr.io/chamberai-prod/api:v1.0.0

# Build Frontend
npm run build
gsutil -m cp -r apps/secretary-console/dist/* \
  gs://chamberai-prod-console/
```

### Create Secrets

```bash
# Store sensitive config in Secret Manager
echo -n "$FIREBASE_PRIVATE_KEY" | gcloud secrets create firebase-key --data-file=-
echo -n "$SENTRY_DSN" | gcloud secrets create sentry-dsn --data-file=-
echo -n "$STRIPE_SECRET_KEY" | gcloud secrets create stripe-key --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding firebase-key \
  --member=serviceAccount:chamberai-api@chamberai-prod.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

---

## Phase 3: Cloud Run Deployment (20 min)

### Deploy to Staging First

```bash
# Deploy with env vars from Secret Manager
gcloud run deploy chamberai-api \
  --project chamberai-staging \
  --image gcr.io/chamberai-staging/api:v1.0.0 \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 2 \
  --concurrency 100 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=staging,FIRESTORE_PROJECT_ID=chamberai-staging \
  --set-cloudsql-instances chamberai-staging:us-central1:postgres \
  --no-allow-unauthenticated
```

### Smoke Test Staging

Run a staging smoke test before any canary promotion:

```bash
# Get staging API URL
STAGING_API=$(gcloud run services describe chamberai-api \
  --project chamberai-staging --region us-central1 \
  --format='value(status.address.url)')

# Test health endpoint
curl $STAGING_API/health
# Expected: {"ok": true}

# Test metrics endpoint
curl $STAGING_API/metrics
# Expected: JSON with request counts
```

---

## Phase 4: Production Canary Deployment (30 min)

### Initial Production Deployment (10% traffic)

```bash
# Deploy to production
gcloud run deploy chamberai-api \
  --project chamberai-prod \
  --image gcr.io/chamberai-prod/api:v1.0.0 \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 4 \
  --concurrency 200 \
  --max-instances 50 \
  --set-env-vars NODE_ENV=production,FIRESTORE_PROJECT_ID=chamberai-prod \
  --set-cloudsql-instances chamberai-prod:us-central1:postgres \
  --no-allow-unauthenticated
```

### Set Up Traffic Splitting

Use a traffic split for the canary rollout so production traffic moves from 10% to 50% to 100% only after each validation gate passes.

```bash
# Initially send 10% to new revision
gcloud run services update-traffic chamberai-api \
  --project chamberai-prod \
  --to-revisions LATEST=10 \
  --region us-central1

# Monitor for 15 minutes (check error rates, latency)
# Check Sentry and Cloud Monitoring dashboards
```

### Gradually Roll Out

```bash
# After 15 min: 50% traffic to new revision
gcloud run services update-traffic chamberai-api \
  --to-revisions LATEST=50 --region us-central1

# After another 10 min: 100% traffic
gcloud run services update-traffic chamberai-api \
  --to-revisions LATEST=100 --region us-central1
```

---

## Phase 5: DNS & Load Balancing (15 min)

### Configure Cloud Load Balancer

```bash
# Create global static IP
gcloud compute addresses create chamberai-api-ip \
  --project chamberai-prod \
  --global

# Create health check
gcloud compute health-checks create https chamberai-health \
  --request-path=/health \
  --port=443

# Create backend service
gcloud compute backend-services create chamberai-api-backend \
  --global \
  --protocol=HTTPS \
  --health-checks=chamberai-health
```

### DNS Configuration

**In Cloud DNS:**
```
api.chamberai.com      A       <STATIC_IP>
console.chamberai.com  CNAME   c.storage.googleapis.com
*.chamberai.com        CNAME   api.chamberai.com
chamberai.com          A       <MARKETING_SITE_IP>
```

**CloudFlare SSL:**
- Enable "Full (strict)" SSL mode
- Configure origin certificate validation
- Enable HTTP/2 and HTTP/3
- Set cache rules for `/api/*` to bypass cache

---

## Phase 6: Post-Deployment Verification (30 min)

### Run Smoke Tests

```bash
# Test API endpoints
./scripts/smoke-test.sh https://api.chamberai.com

# Test console accessibility
curl https://console.chamberai.com/index.html

# Test subdomain routing
curl https://portland.chamberai.com/index.html
# Should load console with portland org context
```

### Monitor Metrics

**Check these dashboards for 30 minutes:**
- Error rate (should be <1%)
- API latency p99 (should be <1s)
- CPU/memory utilization
- Firestore read/write quota

**Sentry checks:**
- No new error patterns
- No spike in error count

### Database Validation

```bash
# Verify data integrity
firebase firestore:export \
  --project chamberai-prod \
  gs://chamberai-prod-backups/$(date +%s)

# Run migration verification
npm run test:integration -- --prod
```

---

## Rollback Procedure

If critical issues detected in first hour:

```bash
# Option 1: Revert traffic to previous stable revision
gcloud run services update-traffic chamberai-api \
  --project chamberai-prod \
  --to-revisions PREVIOUS=100

# Option 2: Deploy previous version
gcloud run deploy chamberai-api \
  --image gcr.io/chamberai-prod/api:v0.9.5 \
  --project chamberai-prod \
  --region us-central1
```

**Steps after rollback:**
1. Investigate root cause in Sentry
2. Fix issue locally
3. Push new tag (v1.0.1)
4. Test in staging again
5. Deploy canary with lessons learned

---

## Ongoing Operations

### Weekly Checks

```bash
# Review error rates and performance
gcloud monitoring read \
  --project chamberai-prod \
  projects/chamberai-prod/timeSeries | grep error_rate

# Verify backups completed
gsutil ls -p chamberai-prod gs://chamberai-prod-backups/
```

### Monthly Updates

```bash
# Check for dependency updates
npm audit
npm outdated

# Update Docker base image
docker pull node:20-alpine
# Rebuild and redeploy
```

### Emergency Contacts

- **On-call**: PagerDuty (configure during launch)
- **Escalation**: Team Slack channel #chamberai-incidents
- **Incident runbook**: docs/INCIDENT_RESPONSE.md

---

## Troubleshooting

### Issue: High error rate after deployment

**Diagnosis:**
1. Check Sentry dashboard for error type
2. Check Cloud Logs for stack traces
3. Check Firestore quota (easy to hit on new org)

**Common causes:**
- Missing environment variables (check Secret Manager)
- Firestore rules blocking legitimate requests (test rule change)
- API key expired or wrong credentials

**Resolution:**
- If fixable in code: deploy v1.0.1 hotfix
- If config issue: update Secret Manager, restart Cloud Run revision
- If quota issue: request quota increase

### Issue: Frontend not loading

**Diagnosis:**
1. Verify Cloud Storage bucket is public
2. Check CloudFlare cache bypass rules
3. Check CORS headers in API responses

**Resolution:**
```bash
# Make bucket public
gsutil iam ch serviceAccount:cloud-static:objectViewer \
  gs://chamberai-prod-console

# Clear CloudFlare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -d '{"purge_everything":true}'
```

---

## Success Criteria

✅ API health check passes
✅ Console loads in <2s
✅ Error rate <1%
✅ No critical Sentry issues
✅ Database backups working
✅ All smoke tests passing
✅ Monitoring alerts configured
✅ On-call rotation activated
