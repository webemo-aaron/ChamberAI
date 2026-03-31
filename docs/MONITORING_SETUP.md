# ChamberAI Monitoring & Alerting Setup

## Overview

Production monitoring covers three dimensions:
- **Performance**: Latency, throughput, resource utilization
- **Reliability**: Error rates, availability, Firestore quota
- **Business**: AI token costs, user activity, governance metrics

---

## Cloud Monitoring Dashboards

### Main Operations Dashboard

Create dashboard with these panels:

**API Metrics:**
- Request rate (req/sec)
- Error rate (% 5xx errors)
- Latency (p50, p95, p99 in ms)
- CPU utilization (%)
- Memory utilization (%)

**Database Metrics:**
- Firestore read/write ops
- Quota utilization (%)
- Document count trend
- Replication lag (if multi-region)

**Business Metrics:**
- Active org count (24h)
- AI interactions (kiosk chats today)
- Export requests (GDPR)
- Billing revenue

### Create via gcloud

```bash
gcloud monitoring dashboards create --config-from-file=- <<EOF
{
  "displayName": "ChamberAI Production",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "API Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
                }
              }
            }]
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "API Error Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\" AND resource.labels.service_name=\"chamberai-api\""
                }
              }
            }]
          }
        }
      }
    ]
  }
}
EOF
```

---

## Alert Policies

### Critical Alerts (Page On-Call)

**1. High Error Rate**
```
Condition: Error rate > 5% (5 min average)
Alert: "API error rate spiked above 5%"
Channel: PagerDuty (critical)
Runbook: docs/RUNBOOKS.md#high-error-rate
```

**2. API Latency Degradation**
```
Condition: p99 latency > 2000ms (5 min average)
Alert: "API latency p99 exceeded 2 seconds"
Channel: PagerDuty (critical)
Runbook: docs/RUNBOOKS.md#high-latency
```

**3. Firestore Quota Exceeded**
```
Condition: Firestore ops > 80% of daily quota
Alert: "Firestore quota utilization above 80%"
Channel: PagerDuty (warning)
Action: Request quota increase or rate limit
```

### Warning Alerts (Slack #incidents)

**4. High Memory Usage**
```
Condition: Memory utilization > 80% (5 min average)
Alert: "API memory usage high, may cause OOM"
Channel: Slack
Action: Increase memory limit or investigate memory leak
```

**5. Authentication Failures**
```
Condition: Failed auth attempts > 50/min (5 min average)
Alert: "High authentication failure rate"
Channel: Slack
Action: Check auth service status, review logs
```

**6. AI Token Cost Anomaly**
```
Condition: Daily AI cost > 2x rolling 30-day average
Alert: "AI token spending anomaly detected"
Channel: Slack
Action: Review kiosk usage patterns, consider rate limiting
```

### Create Alert Policy

```bash
gcloud alpha monitoring policies create --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-name="error_rate_5pct" \
  --condition-threshold-value=0.05 \
  --condition-threshold-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count"'
```

---

## Sentry Error Tracking

Sentry is the primary production error tracking system for ChamberAI.

### Setup

1. Create Sentry project at sentry.io
2. Store DSN in Secret Manager:
```bash
echo -n "https://key@sentry.io/project" | \
  gcloud secrets create sentry-dsn --data-file=-
```

3. Add to server.js:
```javascript
if (process.env.SENTRY_DSN) {
  import("@sentry/node").then(Sentry => {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [new Sentry.Integrations.Http({ tracing: true })]
    });
  });
}
```

### Configure Release Tracking

```bash
# Tag release in Sentry
sentry-cli releases -o chamberai create v1.0.0
sentry-cli releases -o chamberai set-commits v1.0.0 \
  --commit chamberai/chamberai@$(git rev-parse HEAD)
sentry-cli releases -o chamberai deploys v1.0.0 \
  create -e production
```

### Alert Rules

**Alert on new error type:**
- Any unhandled exception
- Rate limit exceeded
- Database connection failure

**Ignore (spam):**
- Browser plugin errors (Grammarly, etc)
- Network errors (offline users)
- 404s for favicon.ico

---

## Structured Logging

### JSON Log Format

All logs MUST be valid JSON for Cloud Logging:

```javascript
// In server.js middleware:
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: "info",
  service: "api",
  method: req.method,
  path: req.path,
  status: res.statusCode,
  duration_ms: Date.now() - started,
  user_org: req.orgId,
  message: "Request completed"
}));
```

### Log Severity Levels

- **ERROR**: Should page on-call (e.g., database connection failure)
- **WARNING**: Should alert but not page (e.g., quota 80% utilized)
- **INFO**: Normal operational (e.g., request processed, config loaded)
- **DEBUG**: Development only (e.g., SQL query, token verification)

### Query Logs in Cloud Logging

```bash
# Find all errors in last hour
gcloud logging read "severity=ERROR AND resource.type=cloud_run_revision AND resource.labels.service_name=chamberai-api" \
  --project=chamberai-prod \
  --limit 100 \
  --format json
```

---

## Performance Profiling

### Cloud Trace Setup

Enable for latency analysis:

```bash
gcloud trace-related services --project chamberai-prod enable
```

### Identify Bottlenecks

```bash
# Find slowest requests (p99 latency)
gcloud trace list --project chamberai-prod \
  --filter='span.span_kind=RPC AND latency>2000ms' \
  --limit=10
```

Common culprits:
- Firestore read/write (check indexes)
- External API calls (check timeouts)
- Cold starts (consider warm-up requests)

---

## Incident Response

### Incident Severity Levels

| Level | Response | Page | Example |
|-------|----------|------|---------|
| **Critical (P1)** | Immediate | Yes | API down, data loss |
| **High (P2)** | 15 min | Yes | Error rate >5% |
| **Medium (P3)** | 1 hour | No | Latency degraded |
| **Low (P4)** | Next business day | No | Minor bug, spike in logs |

### P1 Incident Response Checklist

- [ ] Open incident in incident.io
- [ ] Page on-call engineer
- [ ] Establish war room (video + chat)
- [ ] Investigate root cause (Sentry, logs, metrics)
- [ ] Communicate status every 10 min
- [ ] Execute rollback or deploy hotfix
- [ ] Verify issue resolved
- [ ] Post-incident: Root cause analysis within 24h

---

## Maintenance Windows

### Scheduled Maintenance

Announce 24h in advance:

```bash
# Create maintenance window in Cloud Monitoring
gcloud monitoring windows create \
  --display-name="Weekly database maintenance" \
  --start-time "Sundays 02:00 UTC" \
  --duration 1h
```

During maintenance:
- Suppress non-critical alerts
- Enable read-only API (if possible)
- Have on-call ready for issues

---

## Metrics Worth Tracking

### Operational SLOs

- **API Availability**: 99.9% (41 min/month downtime allowed)
- **Error Rate**: <1% (target: <0.1%)
- **Latency (p99)**: <1000ms (target: <500ms)

### Business Metrics

- **Kiosk Usage**: chats/day, tokens/day
- **Governance Metrics**: meetings/org/month, completion rate
- **Financial**: API costs, AI costs, revenue

### Trend Alerts

Monitor these on monthly basis:
- Growing error types (new bugs)
- Latency trends (performance regression)
- Quota utilization (planning for growth)

---

## On-Call Rotation

### Setup PagerDuty Integration

```bash
# Get PagerDuty service ID
PAGERDUTY_SERVICE_ID="..."

# Create Cloud Monitoring notification channel
gcloud alpha monitoring channels create \
  --display-name="PagerDuty On-Call" \
  --type=pagerduty \
  --channel-labels="service_key=$PAGERDUTY_SERVICE_ID"
```

### On-Call Responsibilities

- Respond to P1/P2 alerts within 15 min
- Triage issue (is it real? severity?)
- Communicate status in #incidents channel
- Execute playbooks (runbooks)
- Escalate if stuck after 30 min

### Runbooks

Create runbook for each alert type:
- **docs/RUNBOOKS.md#high-error-rate**
- **docs/RUNBOOKS.md#high-latency**
- **docs/RUNBOOKS.md#quota-exceeded**

Each runbook includes:
1. Diagnosis steps (what to check)
2. Common causes (80/20)
3. Resolution steps (escalation path)
4. Rollback procedure (if needed)

---

## Success Criteria

✅ All dashboards loading real-time data
✅ Alert channels tested and working
✅ Sentry tracking errors (test error deployed)
✅ On-call rotation configured
✅ Team familiar with runbooks
✅ No alert fatigue (tuned thresholds)
