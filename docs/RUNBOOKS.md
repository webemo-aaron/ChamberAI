# ChamberAI Production Runbooks

On-call playbooks for common production incidents. Follow the **Diagnosis** → **Common Causes** → **Resolution** → **Verification** flow.

---

## High Error Rate (>5%)

### Alert Trigger
- Error rate exceeds 5% for 5+ minutes
- Sentry shows spike in error count
- Cloud Monitoring triggers P1 alert

### Diagnosis (2 min)

1. **Check Sentry dashboard** (sentry.io/chamberai)
   - Filter: `is:unresolved AND date>=-30m`
   - Note: top 3 error types and their frequency
   - Look for: new patterns vs regression

2. **Check Cloud Logs**
   ```bash
   gcloud logging read "severity=ERROR AND resource.type=cloud_run_revision AND resource.labels.service_name=chamberai-api" \
     --project=chamberai-prod \
     --limit=50 \
     --format=json | jq '.[] | {timestamp, message, labels: .labels}'
   ```
   - Look for: root cause in error messages
   - Pattern: are errors clustered by endpoint or user?

3. **Check Cloud Monitoring**
   - Open "ChamberAI Production" dashboard
   - Check: CPU, memory, request rate
   - Look for: resource exhaustion or traffic spike

4. **Check Firestore**
   ```bash
   gcloud firestore:export \
     --project chamberai-prod \
     gs://chamberai-prod-backups/diagnostic-$(date +%s)
   ```
   - Check quota in GCP Console → Firestore → Indexes
   - Look for: quota exceeded errors in logs

### Common Causes (80/20)

1. **Database quota exceeded** (40% of cases)
   - Symptoms: "Quota exceeded" errors in logs, latency spikes, some operations fail
   - Fix: Check Firestore quota in GCP Console, request increase if needed

2. **Missing environment variables** (25%)
   - Symptoms: Authentication fails, config errors
   - Fix: Verify Secret Manager keys: `gcloud secrets list --project chamberai-prod`

3. **Firestore rules blocking requests** (20%)
   - Symptoms: "Permission denied" errors, but rules look correct
   - Fix: Check if rules were recently deployed incorrectly

4. **Upstream service failure** (10%)
   - Symptoms: Errors calling external APIs (Stripe, OpenAI)
   - Fix: Check service status pages, verify API keys not expired

5. **Code bug in latest deployment** (5%)
   - Symptoms: Specific endpoint returns error, worked before
   - Fix: Check git diff from previous revision, redeploy previous if needed

### Resolution Steps

**Option A: Config issue (no code fix needed)**
1. Verify all env vars in Secret Manager
2. Update Secret Manager if needed
3. Restart Cloud Run revision:
   ```bash
   gcloud run deploy chamberai-api \
     --project chamberai-prod \
     --region us-central1 \
     --no-traffic  # Do NOT route traffic yet
   ```
4. Run smoke tests on new revision
5. If passing, route 10% traffic and monitor

**Option B: Firestore quota exceeded**
1. Check current quota usage:
   ```bash
   gcloud compute project-info describe --project=chamberai-prod \
     | grep -A5 "firestore"
   ```
2. Request quota increase (GCP Console → Firestore → Quotas)
3. As temporary mitigation: implement rate limiting on high-traffic endpoints
4. Monitor quota over next 24 hours

**Option C: Code bug (needs hotfix)**
1. Stop canary traffic: `gcloud run services update-traffic chamberai-api --project chamberai-prod --to-revisions PREVIOUS=100`
2. Investigate in staging: `git checkout main && npm run test:unit`
3. Fix bug, test locally with emulator
4. Tag hotfix: `git tag v1.0.1 && git push origin v1.0.1`
5. Deploy to staging first: `npm run deploy:staging`
6. If staging passes smoke tests, deploy canary to prod: `npm run deploy:production`

### Verification (5 min)

- [ ] Error rate drops below 2% in Cloud Monitoring
- [ ] Sentry shows no new errors (only resolves old ones)
- [ ] Request latency p50 <200ms (normal baseline)
- [ ] No alerts triggered in past 5 minutes
- [ ] Team notified in #incidents

### Escalation
- **15 min with no improvement**: Page on-call engineering lead
- **30 min with no improvement**: Declare SEV-1, initiate incident.io war room
- **60 min with no improvement**: Consider full rollback to previous stable version

---

## API Latency Degradation (p99 > 2s)

### Alert Trigger
- p99 latency exceeds 2000ms for 5+ minutes
- Users report slow API responses
- Cloud Monitoring triggers P2 alert

### Diagnosis (3 min)

1. **Check Cloud Trace**
   ```bash
   gcloud trace list --project chamberai-prod \
     --filter='span.span_kind=RPC AND latency>2000ms' \
     --limit=10 \
     --format=json
   ```
   - Look for: which RPC calls are slow
   - Note: Firestore, external APIs, or application logic?

2. **Check Cloud Profiler** (if enabled)
   - GCP Console → Cloud Profiler
   - Filter by latency percentile
   - Look for: CPU hotspots, memory allocation, I/O wait

3. **Check request patterns**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=chamberai-api" \
     --project=chamberai-prod \
     --limit=1000 \
     --format=json | jq '.[] | select(.duration_ms > 2000) | {path, duration_ms, status}'
   ```
   - Look for: specific endpoints that are slow
   - Pattern: is it all requests or just some?

### Common Causes (80/20)

1. **Firestore index missing** (35% of cases)
   - Symptoms: Complex queries slow, p99 spikes on specific endpoint
   - Fix: Check Firestore Indexes tab, create missing composite index

2. **External API timeout** (25%)
   - Symptoms: Latency spikes when calling OpenAI, Stripe, etc
   - Fix: Check timeout settings, increase if reasonable, consider caching responses

3. **N+1 query pattern** (20%)
   - Symptoms: Request loads one document, then loops fetching child docs
   - Fix: Use batch reads or collection groups queries

4. **Database connection pool exhausted** (15%)
   - Symptoms: Latency increases under load, timeouts
   - Fix: Increase Cloud Run concurrency or instance count

5. **Code hotspot** (5%)
   - Symptoms: Specific code path takes unexpectedly long
   - Fix: Profile with Cloud Profiler, optimize loop or algorithm

### Resolution Steps

**Option A: Missing Firestore index**
1. Get slow query from logs
2. Check Cloud Firestore → Indexes
3. Create composite index if missing:
   ```bash
   gcloud firestore indexes create --collection=meetings \
     --field-config field-path=org_id,order=ascending \
     --field-config field-path=created_at,order=descending
   ```
4. Wait for index to build (may take 10-30 min)
5. Monitor latency drop after build completes

**Option B: External API timeout**
1. Increase timeout in code (config)
2. Add caching for responses (Redis or in-memory)
3. Or implement circuit breaker pattern (fail fast instead of hanging)
4. Redeploy and monitor

**Option C: Database connection issue**
1. Check Cloud Run → Service → Metrics
   - Look for: Concurrency at max, CPU throttled
2. Increase either:
   - Cloud Run memory (more CPU)
   - Concurrency limit (higher requests per instance)
   - Max instances (scale horizontally)
3. Redeploy and monitor over next 10 minutes

### Verification (5 min)

- [ ] p99 latency drops below 1000ms
- [ ] p50 latency <200ms (baseline)
- [ ] No "timeout" errors in logs
- [ ] Sentry shows no increase in errors
- [ ] Users report normal response times

### Escalation
- **30 min with no improvement**: Page on-call performance engineer
- **60 min with no improvement**: Consider rollback + investigate root cause

---

## Firestore Quota Exceeded

### Alert Trigger
- Firestore operations exceed 80% of daily quota
- Operations failing with "Quota exceeded" error
- Cloud Monitoring triggers P2 alert

### Diagnosis (2 min)

1. **Check Firestore quota**
   ```bash
   gcloud firestore:describe --project=chamberai-prod | grep quota
   ```

2. **Check quota breakdown**
   - GCP Console → Firestore → Metrics
   - Look for: read ops vs write ops
   - Compare: usage pattern vs baseline

3. **Identify high-traffic collections**
   ```bash
   gcloud logging read "resource.type=cloud_firestore_database" \
     --project=chamberai-prod \
     --limit=100 \
     --format=json | jq '.[] | {collection: .labels.collection, count: 1}' | sort | uniq -c
   ```

### Common Causes

1. **Increased user activity** (50%)
   - Symptoms: Quota normal yesterday, high today
   - Fix: Temporary rate limiting, or request quota increase

2. **Inefficient query pattern** (30%)
   - Symptoms: Quota high on specific collection
   - Fix: Add indexes, refactor queries to batch reads

3. **Data export running** (15%)
   - Symptoms: Sudden spike, users report GDPR/export requests
   - Fix: Throttle export jobs, run during off-peak hours

4. **Leak in application code** (5%)
   - Symptoms: Quota climbing without user activity
   - Fix: Check logs for runaway queries, patch code

### Resolution Steps

### Verification

- [ ] Firestore utilization drops back under the alert threshold
- [ ] No new quota-exceeded errors appear in logs
- [ ] Write-heavy jobs are throttled or rescheduled
- [ ] Customer-facing operations recover

### Escalation
- **15 min with no improvement**: engage platform owner and request quota increase
- **30 min with no improvement**: disable non-critical background jobs until load stabilizes

---

## Database Connection Failure

### Alert Trigger
- Database or Firestore access failures spike suddenly
- API endpoints return connection, timeout, or unavailable errors
- Sentry and Cloud Monitoring show a shared backend dependency failure

### Diagnosis (3 min)

1. **Check Cloud Run logs**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=chamberai-api" \
     --project=chamberai-prod \
     --limit=100 \
     --format=json | jq '.[] | select(.severity=="ERROR")'
   ```
2. **Check backend dependency status**
   - Firestore console health and quota
   - Secret Manager access failures
   - Any upstream database or connector incident
3. **Check recent deploys**
   - Confirm whether the latest revision introduced new auth or connection configuration

### Resolution Steps

1. Verify service account permissions and secret access
2. Re-check the deployed environment variables and secret mounts
3. Roll traffic back to `PREVIOUS=100` if the latest revision introduced the failure
4. Restart only after verifying connectivity on the candidate revision

### Verification

- [ ] `/health` returns `200`
- [ ] No new connection errors appear in logs for 5 minutes
- [ ] Sentry error volume flattens
- [ ] Core write paths succeed again

1. **Immediate (if critical)**
   ```bash
   gcloud firestore quota-exceeded --project=chamberai-prod \
     --enable-quota-override
   ```
   (Allows operations to continue temporarily)

2. **Short-term (1-2 hours)**
   - Implement client-side rate limiting for bulk operations
   - Batch document reads where possible
   - Add caching layer for frequently-read data

3. **Medium-term (24 hours)**
   - File quota increase request with GCP (can take 1-7 days)
   - Optimize query patterns (add missing indexes)
   - Consider partitioning data by time/region if growing

4. **Monitor after fix**
   ```bash
   gcloud monitoring write \
     --metric=firestore_quota_utilization \
     --value 65  # Should drop back to baseline
   ```

### Verification

- [ ] Firestore quota utilization <70%
- [ ] No more "Quota exceeded" errors in logs
- [ ] API latency p99 <1000ms (no more rejection backlog)

---

## Database Connection Failure

### Alert Trigger
- Firestore authentication fails
- "Connection refused" or "Auth failed" in logs
- Cloud Monitoring triggers P1 alert

### Diagnosis (1 min)

1. **Check Firestore connectivity**
   ```bash
   curl https://firestore.googleapis.com/v1/projects/chamberai-prod/databases/default \
     -H "Authorization: Bearer $(gcloud auth print-access-token)"
   ```

2. **Check Cloud Run service logs**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
     --project=chamberai-prod \
     --limit=20
   ```

3. **Check Firebase Console**
   - GCP Console → Firestore → Status
   - Look for: service incidents, maintenance windows

### Resolution Steps

1. **If Firestore is down**
   - Check Google Cloud Status: https://status.cloud.google.com/
   - Wait for service to recover
   - No action needed on our side

2. **If our service lost credentials**
   ```bash
   gcloud secrets list --project=chamberai-prod | grep firebase
   gcloud secrets versions list firebase-key --project=chamberai-prod
   ```
   - If key expired: upload new key to Secret Manager
   - Restart Cloud Run revision to pick up new credentials

3. **If network connectivity issue**
   - Check Cloud Run → VPC Connector (if using)
   - Verify firewall rules allow Firestore traffic
   - Check IAM: `gcloud iam service-accounts get-iam-policy chamberai-api@chamberai-prod.iam.gserviceaccount.com`

### Verification

- [ ] `curl https://firestore.googleapis.com` returns 200
- [ ] API health check returns `{"ok": true}`
- [ ] Sample meeting query returns data
- [ ] No more "Auth failed" errors in logs

---

## Authentication Failures (>50/min)

### Alert Trigger
- Failed auth attempts exceed 50/min average over 5 minutes
- Users report "Unauthorized" errors
- Sentry shows auth-related errors

### Diagnosis (2 min)

1. **Check auth logs**
   ```bash
   gcloud logging read "jsonPayload.level=error AND jsonPayload.service=api AND 'auth' in message" \
     --project=chamberai-prod \
     --limit=50
   ```

2. **Identify pattern**
   - Is it all users or specific org?
   - Is it specific endpoint or all routes?
   - When did it start?

### Common Causes

1. **Firebase key expired** (40%)
2. **JWT signature verification failing** (25%)
3. **Custom claims (orgId) missing from token** (20%)
4. **CORS misconfiguration** (10%)
5. **Client code bug** (5%)

### Resolution Steps

1. **Verify Firebase credentials**
   ```bash
   gcloud secrets describe firebase-key --project=chamberai-prod
   ```
   - Check: when was key last rotated?
   - If >90 days old, rotate key in GCP Console

2. **Check JWT configuration**
   - Verify algorithm (RS256), issuer, audience match Firebase project
   - Test token generation in staging

3. **Verify custom claims in token**
   ```bash
   gcloud logging read "jsonPayload.service=api AND 'orgId' in message" \
     --project=chamberai-prod \
     --limit=10
   ```

4. **Clear browser cache / test with new token**
   - Auth tokens cached in browser
   - Users may need to refresh/logout/login

### Verification

- [ ] Auth success rate >99%
- [ ] No "Unauthorized" errors in last 5 minutes
- [ ] Sample request with valid token succeeds

---

## AI Token Cost Anomaly (>$500/day)

### Alert Trigger
- Daily AI token cost exceeds 2x rolling 30-day average
- Kiosk usage spike detected
- Sentry/logs show high volume of OpenAI/Claude calls

### Diagnosis (3 min)

1. **Check kiosk usage**
   ```bash
   gcloud logging read "jsonPayload.service=api AND 'kiosk' in jsonPayload.path" \
     --project=chamberai-prod \
     --limit=1000 | jq '.[] | {timestamp, user_org: .jsonPayload.user_org, cost_estimate: .jsonPayload.tokens}'
   ```

2. **Check by organization**
   - Which org is generating most tokens?
   - Is it legitimate usage or abuse?

3. **Check AI provider costs**
   - OpenAI API: https://platform.openai.com/account/billing/overview
   - Anthropic dashboard (if using Claude)

### Common Causes

1. **One org spamming kiosk** (50%)
   - Symptoms: High volume from single org_id
   - Fix: Rate limit that org or contact them

2. **Longer context/model change** (25%)
   - Symptoms: Token count per request increased
   - Fix: Review conversation context, truncate if too long

3. **Bug causing infinite loop** (15%)
   - Symptoms: Tokens climbing without user interaction
   - Fix: Check logs for repeated calls, patch code

4. **Model upgrade** (10%)
   - Symptoms: Costs increased after deploying new model
   - Fix: Verify model selection in code

### Resolution Steps

1. **Identify problem org**
   ```bash
   # Query analytics
   curl https://api.chamberai.com/analytics/kiosk
   ```
   - Look for: which org has highest token_count

2. **Implement rate limiting**
   - Code: Add daily token budget per org
   - Config: Set `MAX_TOKENS_PER_DAY_PER_ORG = 50000`
   - Redeploy

3. **Contact affected org**
   - Explain: cost increase, offer to discuss usage patterns
   - Options: reduce frequency, archive old conversations, upgrade billing tier

4. **Monitor cost trend**
   - Set daily budget alert
   - Review weekly AI costs in Stripe dashboard

### Verification

- [ ] Daily AI cost drops to <$500
- [ ] Kiosk request rate returns to baseline
- [ ] Rate limiting is active (logs show throttled requests)

---

## Deployment Failure

### Alert Trigger
- Cloud Run deployment fails to reach stable state
- Health checks fail
- New revision shows 100% error rate

### Diagnosis (2 min)

1. **Check Cloud Run logs**
   ```bash
   gcloud run revisions describe --project=chamberai-prod --region=us-central1 chamberai-api:latest
   ```

2. **Check startup errors**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
     --project=chamberai-prod \
     --limit=20
   ```

3. **Check health endpoint**
   ```bash
   curl https://api.chamberai.com/health
   ```

### Common Causes

1. **Missing environment variable** (40%)
2. **Docker build failed** (25%)
3. **Startup error in code** (20%)
4. **Insufficient memory/CPU** (10%)
5. **Port not exposed correctly** (5%)

### Resolution Steps

1. **Rollback to previous revision**
   ```bash
   gcloud run services update-traffic chamberai-api \
     --project chamberai-prod \
     --to-revisions PREVIOUS=100
   ```

2. **Investigate in staging**
   - Deploy same image to staging: `npm run deploy:staging`
   - Check logs: `gcloud logging read ... --project chamberai-staging`

3. **Fix and redeploy**
   - Fix code/config locally
   - Test with emulator: `npm test`
   - Deploy to staging again
   - Once passing, deploy canary to prod

### Verification

- [ ] Health endpoint returns `{"ok": true}`
- [ ] Metrics endpoint returns data
- [ ] Sample API call succeeds
- [ ] No errors in logs for 5 minutes

---

## Post-Incident Checklist

### Diagnosis

After any incident:

- [ ] Create post-mortem issue in Linear
- [ ] Document root cause (was it predictable?)
- [ ] Document fix (code change, config change, runbook improvement?)
- [ ] Assign owner to implement preventive measure
- [ ] Update this runbook if new pattern discovered
- [ ] Share learnings in #incidents channel

### Resolution

- [ ] Schedule blameless postmortem meeting within 24h (for P1 only)
- [ ] Convert remediation items into tracked work
- [ ] Update alerts, dashboards, or deployment safeguards if they were insufficient

### Verification

- [ ] Timeline and root cause are documented clearly
- [ ] Preventive action has an owner and due date
- [ ] Relevant runbooks and deployment docs were updated

Timeline for postmortem:
- **P1 incident**: Postmortem within 24h
- **P2 incident**: Postmortem within 3 days
- **P3+ incident**: Document learning, no meeting required
