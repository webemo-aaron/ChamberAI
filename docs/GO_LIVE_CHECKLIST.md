# ChamberAI Go-Live Checklist

## Pre-Launch (Week Before)

### Infrastructure
- [ ] GCP projects created (dev, staging, prod)
- [ ] Firebase projects initialized
- [ ] Cloud Run services configured
- [ ] Cloud Storage buckets created
- [ ] Cloud DNS zones configured
- [ ] Static IPs allocated
- [ ] SSL certificates provisioned

### Security & Compliance
- [ ] Firestore rules reviewed and tested
- [ ] API authentication validated (Firebase tokens)
- [ ] CORS headers configured for all domains
- [ ] Rate limiting tested
- [ ] GDPR data export endpoints working
- [ ] Encryption keys stored in Secret Manager
- [ ] Service accounts with minimal permissions

### Monitoring & Alerting
- [ ] Sentry project created and DSN stored
- [ ] Cloud Monitoring dashboards created
- [ ] Alert policies configured
- [ ] PagerDuty integration tested
- [ ] Slack channels created (#incidents, #deployments)
- [ ] On-call rotation scheduled
- [ ] Runbooks written and reviewed

### Documentation
- [ ] DEPLOYMENT_GUIDE.md completed
- [ ] MONITORING_SETUP.md completed
- [ ] RUNBOOKS.md completed
- [ ] API documentation generated
- [ ] Architecture diagram updated
- [ ] Team trained on deployment process
- [ ] Team trained on incident response

### Testing
- [ ] Full integration test suite passing
- [ ] Staging deployment smoke tests passing
- [ ] E2E smoke test run against the hosted console
- [ ] Load test completed (target: 1000 req/sec)
- [ ] Database backup/restore tested
- [ ] Disaster recovery drill completed
- [ ] Cross-org access prevention tested

### Legal & Compliance
- [ ] Privacy policy reviewed by legal
- [ ] Terms of Service reviewed by legal
- [ ] GDPR compliance audit completed
- [ ] Data processing agreement signed
- [ ] SOC 2 Type II audit scheduled
- [ ] Cookie policy configured

---

## Launch Day (Day 1)

### 2 Hours Before
- [ ] On-call engineer on shift
- [ ] Staging deployment verified (all tests passing)
- [ ] Monitoring dashboards operational
- [ ] Sentry capturing errors
- [ ] Team in war room (Slack, video)

### 1 Hour Before
- [ ] Announce maintenance window on status page
- [ ] Backup production Firestore
- [ ] Review rollback plan with team
- [ ] All team members confirm readiness

### Launch
- [ ] Execute deploy-production.sh script
- [ ] Monitor health checks (5 min)
- [ ] Monitor error rate (5 min)
- [ ] Monitor latency (5 min)
- [ ] Verify DNS is resolving
- [ ] Test API endpoints manually
- [ ] Test console loads properly

### Canary Phase (First Hour)
- [ ] 10% traffic to new revision
- [ ] Monitor Sentry for errors
- [ ] Monitor Cloud Monitoring for latency/errors
- [ ] Check database performance
- [ ] Verify backups are running
- [ ] All systems green? Proceed to 50%

### Gradual Rollout
- [ ] 50% traffic after 15 min
- [ ] 100% traffic after 30 min total
- [ ] Monitor continuously for 1 hour
- [ ] No critical issues? Call it success

### Post-Launch Verification (Hour 2-3)
- [ ] Verify all endpoints responding
- [ ] Verify database replication working
- [ ] Verify backups running
- [ ] Verify monitoring alerts working
- [ ] Verify audit logs recording
- [ ] Verify Sentry integration
- [ ] All tests passing in production

---

## First Week

### Daily Checks (Mon-Fri)
- [ ] Error rate stable (<1%)
- [ ] Latency stable (p99 <1s)
- [ ] CPU/memory not spiking
- [ ] Firestore quota healthy
- [ ] No major Sentry issues
- [ ] Team reports no user issues

### Investigation Areas
- [ ] Any slow queries? Optimize indexes
- [ ] Any repeated errors? Fix or create ticket
- [ ] Any quota concerns? Plan scaling
- [ ] Any performance issues? Profile and optimize

### Customer Communication
- [ ] Send launch announcement to users
- [ ] Monitor support channel for issues
- [ ] Collect early feedback
- [ ] Fix any critical issues immediately

---

## First Month

### Weekly Reviews
- [ ] Deployment metrics review (SLOs met?)
- [ ] Error trend analysis
- [ ] Performance trend analysis
- [ ] Cost analysis (API, storage, compute)
- [ ] Team retrospective on launch

### Optimizations
- [ ] Identify slow endpoints (Cloud Trace)
- [ ] Optimize hot paths (database, code)
- [ ] Tune rate limits based on real traffic
- [ ] Adjust autoscaling policies
- [ ] Optimize Cloud Run configuration

### Stability
- [ ] Zero unplanned downtime? ✅
- [ ] All alerts tuned (not firing falses)? ✅
- [ ] Rollback plan tested? ✅
- [ ] On-call working smoothly? ✅

---

## Success Criteria

### Infrastructure
✅ API health check passes consistently
✅ Console loads in <2s
✅ Database backups running daily
✅ Disaster recovery tested

### Performance
✅ Error rate <1%
✅ Latency p99 <1000ms
✅ Request throughput stable
✅ No memory/CPU issues

### Reliability
✅ Zero critical incidents
✅ No data loss
✅ All alert policies working
✅ On-call rotation functional

### Monitoring
✅ Sentry capturing all errors
✅ Cloud Monitoring dashboards accurate
✅ Alert response time <15 min
✅ Runbooks effective

### User Experience
✅ Positive user feedback
✅ No critical bugs reported
✅ Feature adoption on track
✅ Sign-up conversion acceptable

---

## Rollback Triggers

**Automatic Rollback If:**
- Error rate >10% for 5 min (page on-call)
- API latency p99 >5s (page on-call)
- Data loss or corruption detected
- Authentication service down
- Critical security vulnerability discovered

**Manual Rollback Process:**
```bash
# Revert to previous revision
gcloud run services update-traffic chamberai-api \
  --project chamberai-prod \
  --to-revisions PREVIOUS=100

# Notify team
# Post-incident review within 24h
```

---

## Contact Info

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Product Lead | | | |
| Engineering Lead | | | |
| On-Call Engineer | | | |
| Support Lead | | | |

**Escalation Path:**
1. On-call engineer
2. Engineering lead
3. Product lead
4. Executive sponsor
