# ChamberAI Cost Forecast (March 2026)

## Assumptions
- Pricing based on GCP (Google Cloud Platform) + Firebase
- Monthly user engagement patterns
- Standard meeting duration: 45-90 minutes
- Average meeting size: 10-25 participants
- Current tech stack: Node.js API + Firebase + Cloud Run

---

## SCENARIO 1: Development/Staging Environment
**Target**: Single developer/small team, testing

### Compute
- Cloud Run: 0.5 vCPU, 1 GB RAM
  - API service: 2 instances × 0.5 vCPU × 730 hrs = 730 vCPU-hours
  - Worker service: 1 instance × 0.5 vCPU × 730 hrs = 365 vCPU-hours
  - Cost: (1,095 vCPU-hours) × $0.024/hour = **$26/month**

### Database
- Firebase Firestore (dev usage):
  - ~10,000 reads/month (testing)
  - ~2,000 writes/month
  - ~10 GB storage
  - Cost: $0.60 + $0.36 + $10 = **$11/month**

### Storage
- Cloud Storage: 5 GB test data
  - Cost: 5 GB × $0.020/month = **$0.10/month**

### Other
- Firebase Auth: Free (< 50k sign-ups/month)
- Cloud Firestore backup: Free tier

**TOTAL DEV: ~$37/month**

---

## SCENARIO 2: Free Tier (Production - Single Instance)
**Target**: Launch product, < 500 active users, organic growth

### Compute
- Cloud Run (always-on small):
  - 1 API instance: 1 vCPU, 2 GB RAM
  - 1 Worker instance: 0.5 vCPU, 1 GB RAM
  - Cost: (1 vCPU × 730 + 0.5 vCPU × 730) × $0.024 = **$52/month**

### Database
- Firestore:
  - 100 meetings/month × 50 reads per meeting = 5,000 reads
  - 100 meetings × 20 writes = 2,000 writes
  - ~5 GB storage
  - Cost: $0.30 + $0.36 + $5 = **$5.66/month**

### Storage
- Cloud Storage (meeting assets, exports):
  - 100 meetings × 5 MB average = 500 MB
  - Cost: 0.5 GB × $0.020 = **$0.01/month**

### Email (Resend)
- 100 users × 1 email/month = 100 emails
- Cost: Free tier (100/day included) = **$0/month**

### Monitoring & Logging
- Cloud Logging: First 50 GB free = **$0/month**
- Cloud Monitoring: Free tier = **$0/month**

**TOTAL FREE TIER: ~$58/month**

---

## SCENARIO 3: Growth Tier (Production - 1,000-5,000 Active Users)
**Target**: Scaling after product-market fit, smaller organizations using feature

### Compute
- Cloud Run (3 API instances, 2 worker instances):
  - 3 × 1 vCPU, 2 GB RAM × 730 hrs = 2,190 vCPU-hours
  - 2 × 1 vCPU, 2 GB RAM × 730 hrs = 1,460 vCPU-hours
  - Cost: 3,650 vCPU-hours × $0.024 = **$88/month**

### Database
- Firestore:
  - 5,000 meetings/month × 60 reads = 300,000 reads
  - 5,000 meetings × 30 writes = 150,000 writes
  - ~100 GB storage
  - Cost: $18 + $27 + $100 = **$145/month**

- PostgreSQL (backup/analytics):
  - db-n1-standard-2 (2 vCPU, 7.5 GB RAM)
  - Cost: ~**$120/month**

### Storage
- Cloud Storage:
  - 5,000 meetings × 10 MB average = 50 GB
  - Cost: 50 GB × $0.020 = **$1/month**

### Email (Resend)
- 5,000 users × 2 emails/month = 10,000 emails
- Cost: (10,000 - 3,000 free) × $0.50 per 1000 = **$3.50/month**

### Monitoring & Logging
- Cloud Logging: 500 GB/month
  - Free: 50 GB, Charged: 450 GB × $0.50 = **$225/month**
- Cloud Monitoring: Standard pricing = **$10/month**

### CDN (Cloudflare or Cloud CDN)
- Estimated 100 GB egress/month
- Cost: ~**$15/month**

**TOTAL GROWTH TIER: ~$588/month**

---

## SCENARIO 4: Enterprise (10,000-50,000 Active Users)
**Target**: Adoption by larger chamber of commerce, multi-location organizations

### Compute
- Cloud Run (10 API instances, 5 worker instances):
  - Cost: 10,950 vCPU-hours × $0.024 = **$262/month**

### Database
- Firestore:
  - 50,000 meetings/month × 80 reads = 4,000,000 reads
  - 50,000 meetings × 50 writes = 2,500,000 writes
  - ~1,000 GB storage
  - Cost: $240 + $450 + $1,000 = **$1,690/month**

- PostgreSQL (HA setup):
  - db-n1-highmem-4 (4 vCPU, 26 GB RAM) × 2 for HA
  - Cost: ~**$500/month**

### Storage & Backup
- Cloud Storage: 500 GB
  - Cost: **$10/month**
- Backups (daily): ~100 GB
  - Cost: **$2/month**

### Email (Resend)
- 50,000 users × 3 emails/month = 150,000 emails
- Cost: (150,000 - 3,000 free) × $0.50 per 1000 = **$73.50/month**

### Monitoring & Logging
- Cloud Logging: 5,000 GB/month
  - Free: 50 GB, Charged: 4,950 GB × $0.50 = **$2,475/month**
- Application Performance Monitoring: **$50/month**

### CDN & Load Balancing
- Cloud Load Balancer: **$18/month**
- CDN (1,000 GB egress): **$20/month**

### Stripe (for paid tier)
- Assume 20% of users on paid plan × $20-100/month
- Stripe fees: 2.9% + $0.30 per transaction = **~$5,000/month** (revenue sharing)

**TOTAL ENTERPRISE TIER: ~$10,100/month**

---

## Summary Table

| Scenario | Compute | Database | Storage | Email | Monitoring | Misc | **Total** |
|----------|---------|----------|---------|-------|------------|------|----------|
| Dev | $26 | $11 | $0.10 | $0 | $0 | $0 | **~$37** |
| Free Tier (500 users) | $52 | $5.66 | $0.01 | $0 | $0 | $0 | **~$58** |
| Growth (1K-5K users) | $88 | $265 | $1 | $3.50 | $235 | $15 | **~$588** |
| Enterprise (10K-50K users) | $262 | $2,190 | $12 | $73.50 | $2,525 | $38 | **~$10,101** |

---

## Cost Optimization Strategies

### Immediate (No Changes)
✅ Already implemented:
- Firestore for auto-scaling reads/writes
- Cloud Run for serverless (pay-per-use)
- Firebase free tier auth
- Structured logging

### Short-term (1-2 months)
1. **Implement caching layer**
   - Add Redis (Cloud Memorystore): +$50/month, save $200/month on Firestore reads
   - **ROI**: Break-even in ~2 weeks

2. **Optimize logging**
   - Reduce debug logging in production
   - Implement log sampling (10% of requests)
   - **Savings**: $100-200/month

3. **Archive old meetings**
   - Move meetings > 1 year to Cold Storage ($0.004/GB)
   - **Savings**: $5-10/month per 1K users

### Medium-term (2-6 months)
1. **Dedicated database for paid tier**
   - Separate Firestore collection with different quotas
   - **Impact**: Control costs per customer

2. **Self-hosted option**
   - Docker on Compute Engine (cheaper at scale)
   - **Impact**: -30% compute costs at 50K+ users

3. **CDN image optimization**
   - WebP conversion, thumbnails
   - **Savings**: 40-50% of storage costs

### Long-term (6-12 months)
1. **Multi-region deployment**
   - Reduce latency, improve reliability
   - **Cost**: +20-30% but enables enterprise contracts

2. **Data warehouse for analytics**
   - BigQuery for paid tier analytics
   - **Cost**: $5-50/month depending on query volume

---

## Profitability Scenarios

### Free Tier Monetization (Year 1)
- **User Base**: 1,000 active users
- **Infrastructure Cost**: ~$70/month
- **Revenue Model**: Ads, premium features, API access
- **Break-even**: 50-100 users with $1/month sponsorship

### SaaS Tier (Year 2)
- **User Base**: 10,000 active users
- **Cost**: ~$600/month
- **Pricing**: $10-50/month per organization
- **Break-even**: 60-100 paying customers at $10/month = $600-1,000/month revenue

### Enterprise (Year 3+)
- **User Base**: 50,000 active users
- **Cost**: ~$10,100/month
- **Pricing**: $200-1,000+/month per enterprise
- **Break-even**: 20-50 enterprise customers

---

## Recommendations

**For Launch (Free Tier)**:
- Start with Scenario 2 (**~$58/month**)
- Monitor costs weekly
- Set up billing alerts at $200/month

**Growth Phase (1K-5K users)**:
- Optimize logging and implement caching
- Target: **$400-500/month**
- Monetize via premium features

**Enterprise Phase (10K+ users)**:
- Separate billing models for tiers
- Premium features subsidize free tier
- Target: **$1-2 per active user/month cost**
