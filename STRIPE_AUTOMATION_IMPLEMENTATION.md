# Automated Stripe Implementation Guide

**Version:** 1.0
**Date:** 2026-03-06
**Status:** ✅ COMPLETE - Ready for Production

---

## Overview

A **fully automated, context-aware Stripe integration** that enables:

1. **One-Command Setup** - `./scripts/setup-stripe-automated.sh`
2. **Zero-Touch Onboarding** - Tenants automatically in free tier
3. **Proof of Implementation** - Audit trail and validation artifacts
4. **Admin Control Panel** - Real-time Stripe status dashboard
5. **Complete Validation** - Comprehensive health checks

---

## Components Included

### 1. Automated Setup Script

**File:** `scripts/setup-stripe-automated.sh`

**What it does:**
- ✅ Installs Stripe CLI automatically
- ✅ Authenticates with Stripe account
- ✅ Creates 3 products (Pro $9, Council $149, Network $399)
- ✅ Creates 3 monthly subscription prices
- ✅ Updates `.env` with all configuration
- ✅ Validates Stripe connectivity
- ✅ Generates proof artifacts
- ✅ Creates setup summary

**Usage:**

```bash
# Interactive (prompts for Stripe login)
./scripts/setup-stripe-automated.sh

# Non-interactive (provides API key)
./scripts/setup-stripe-automated.sh "sk_test_..." default
```

**Output:**
```
.stripe-proof/
├── setup-proof.json          # Proof of setup completion
├── SETUP_SUMMARY.md          # Setup checklist & next steps
├── stripe-config.txt         # Product & price IDs
└── setup-log.json           # Audit trail
```

### 2. Context-Aware Onboarding Workflow

**File:** `docs/STRIPE_ONBOARDING_WORKFLOW.md`

**Phases:**

1. **Platform Admin Setup** (5-10 min)
   - Create Stripe account (if needed)
   - Get API keys from Stripe
   - Run automated setup script
   - Verify configuration

2. **Local Testing** (5 min)
   - Restart Docker services
   - Run E2E tests
   - Validate tier enforcement
   - Test webhook processing

3. **Production Preparation** (5-10 min)
   - Configure webhook endpoint in Stripe Dashboard
   - Update production environment variables
   - Deploy to production
   - Enable monitoring

4. **Tenant Onboarding** (Ongoing)
   - Tenants create organizations (auto free tier)
   - Click "Upgrade" for premium features
   - Complete Stripe checkout
   - Webhook processes payment
   - Tier automatically upgrades
   - Premium features unlock

### 3. Stripe Status & Validation API

**File:** `services/api-firebase/src/routes/billing-status.js`

**Endpoints:**

```
GET /billing/status/system
├── Returns Stripe system status
├── Public endpoint (no auth)
└── Use for: Admin dashboards, health checks

GET /billing/status/organization/:orgId
├── Returns org billing status
├── Includes: Tier, renewal date, features
└── Use for: Tenant dashboards, status pages

GET /billing/status/validation
├── Comprehensive validation report
├── Shows: All config checks, missing items, recommendations
└── Use for: Setup verification, troubleshooting

GET /billing/status/proof
├── Returns proof artifacts
├── Shows: Setup audit trail, validation history
└── Use for: Compliance, audit requirements
```

### 4. Admin Control Panel

**File:** `apps/secretary-console/stripe-admin.html`

**Features:**
- ✅ Real-time Stripe configuration status
- ✅ Visual validation dashboard
- ✅ Organization billing lookup
- ✅ Setup guide integration
- ✅ One-click access to automated setup
- ✅ System health monitoring

**Access:**
```
http://localhost:5173/stripe-admin.html
```

---

## Quick Start (5 minutes)

### Step 1: Run Automated Setup

```bash
chmod +x ./scripts/setup-stripe-automated.sh
./scripts/setup-stripe-automated.sh
```

This will:
- Install Stripe CLI
- Create products & prices in Stripe
- Update `.env` with configuration
- Generate proof artifacts

### Step 2: Verify Setup

```bash
# View setup summary
cat .stripe-proof/SETUP_SUMMARY.md

# Check environment
grep STRIPE_ .env
```

### Step 3: Restart Services

```bash
docker compose restart api

# Verify health
curl http://localhost:4001/health
```

### Step 4: Test Configuration

Visit: **http://localhost:5173/stripe-admin.html**

See:
- ✓ Configuration status
- ✓ Validation results
- ✓ Feature enablement
- ✓ Next steps

---

## Workflow: Tenant Upgrade

### Step 1: Tenant Creates Organization

```bash
curl -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"My Chamber","slug":"my-chamber"}'
```

Response:
```json
{
  "orgId": "org_1772808500760_2c43i1jm",
  "name": "My Chamber",
  "slug": "my-chamber"
}
```

**Status:** Free tier, all data isolated per org

### Step 2: Tenant Views Billing Status

```bash
curl -H "Authorization: Bearer tenant-token" \
  -H "X-Org-Id: org_1772808500760_2c43i1jm" \
  http://localhost:4001/billing/status/organization/org_1772808500760_2c43i1jm
```

Response:
```json
{
  "subscription": {
    "tier": "free",
    "status": "active",
    "validUntil": null
  },
  "features": {
    "unlimited_meetings": false,
    "docx_export": false,
    "analytics": false
  }
}
```

### Step 3: Tier Enforcement (Free Tier Blocks)

```bash
# Attempt to create meeting as free user
curl -X POST http://localhost:4001/meetings \
  -H "Authorization: Bearer tenant-token" \
  -H "X-Org-Id: org_..." \
  -d '{"name":"Test","date":"2026-03-10","body":"test","members":[]}'
```

Response: `402 Payment Required`

### Step 4: Tenant Initiates Upgrade

```bash
curl -X POST http://localhost:4001/billing/checkout \
  -H "Authorization: Bearer tenant-token" \
  -H "X-Org-Id: org_..." \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro"}'
```

Response:
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Step 5: Tenant Completes Payment

1. Click checkout URL
2. Enter test card: `4242 4242 4242 4242`
3. Confirm payment
4. Redirected back to app

### Step 6: Webhook Processes Payment

Stripe sends `checkout.session.completed`:

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "customer": "cus_...",
      "subscription": "sub_...",
      "metadata": {"orgId": "org_..."}
    }
  }
}
```

API updates organization:
```
organizations/{orgId}/settings/system
├── subscription.tier: "pro"
├── subscription.status: "active"
└── subscription.validUntil: "2026-04-10T..."
```

### Step 7: Features Unlock

Tenant checks status:

```bash
curl -H "Authorization: Bearer tenant-token" \
  -H "X-Org-Id: org_..." \
  http://localhost:4001/billing/status/organization/org_...
```

Response:
```json
{
  "subscription": {
    "tier": "pro",
    "status": "active",
    "validUntil": "2026-04-10T..."
  },
  "features": {
    "unlimited_meetings": true,
    "ai_minutes": true,
    "docx_export": false,
    "analytics": false
  }
}
```

Meeting creation now works: `201 Created`

---

## Validation & Proof

### System Validation

```bash
curl http://localhost:4001/billing/status/validation | jq .
```

Shows:
- ✓ Stripe secret key configured
- ✓ All 3 prices set
- ✓ Webhook secret configured
- ✓ Tier enforcement working
- ✓ Multi-tenancy enabled
- ✓ Firebase auth enabled

### Proof Artifacts

All setup actions logged to:

```
.stripe-proof/
├── setup-proof.json
│   └── Timestamp, environment, status
├── SETUP_SUMMARY.md
│   └── Checklist of completed steps
├── stripe-config.txt
│   └── Product & price IDs created
└── setup-log.json
│   └── Full audit trail of actions
```

### Admin Dashboard Validation

Visit: **http://localhost:5173/stripe-admin.html**

Shows:
- Overall status (ready / incomplete)
- Configuration percentage
- Feature enablement
- Missing configuration items
- Recommendations for next steps
- Organization billing lookup

---

## Production Deployment

### Step 1: Get Live API Keys

In Stripe Dashboard:
1. Switch to Live mode (toggle in top-right)
2. Go to Developers → API Keys
3. Copy Secret Key (starts with `sk_live_`)

### Step 2: Update Environment

```bash
# .env or production secrets manager
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
APP_BASE_URL=https://yourdomain.com
```

### Step 3: Register Webhook

In Stripe Dashboard → Developers → Webhooks:
1. Add endpoint: `https://yourdomain.com/billing/webhook`
2. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
3. Copy signing secret (whsec_...)

### Step 4: Deploy

```bash
# Update services with new env
docker compose -f docker-compose.hybrid.yml down
docker compose -f docker-compose.hybrid.yml up -d

# Verify
docker compose -f docker-compose.hybrid.yml ps
curl https://yourdomain.com/health
```

### Step 5: Monitor

In Stripe Dashboard → Developers → Webhooks:
- Watch webhook delivery
- Check for failed events
- Monitor event processing
- Enable email alerts

---

## Architecture

### Data Flow

```
Tenant
  ↓
[App UI] → POST /billing/checkout
  ↓
[API] → Create Stripe customer + session
  ↓
[Stripe] → Checkout page
  ↓
Tenant enters card
  ↓
[Stripe] → Payment processed
  ↓
[Stripe] → Webhook to /billing/webhook
  ↓
[API] → Update organizations/{orgId}/settings/system
  ↓
[App] → Detects tier upgrade
  ↓
Features unlock
```

### Multi-Tenancy

Each organization:
- Has unique `orgId`
- Creates own Stripe customer
- Maintains own subscription
- Stores tier in `settings/system`
- Completely isolated data

### Tier Enforcement

```
Free:
├── No meetings (402 blocked)
├── No AI minutes
├── No DOCX export
└── No analytics

Pro ($9/mo):
├── Unlimited meetings ✓
├── AI minutes ✓
├── No DOCX export
└── No analytics

Council ($149/mo):
├── Unlimited meetings ✓
├── AI minutes ✓
├── DOCX export ✓
└── Analytics ✓

Network ($399/mo):
├── All features ✓
├── Multi-chamber ✓
└── Enterprise support
```

---

## Troubleshooting

### Setup Fails: "Stripe CLI not found"

```bash
# Manual installation
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://downloads.stripe.com/stripe-cli/v1.x.x/stripe_linux_x86_64.tar.gz
tar -xzf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Webhook Not Processing

```bash
# Check API logs
docker logs chamberofcommerceai-api-1 | grep webhook

# Verify webhook secret matches Stripe Dashboard
grep STRIPE_WEBHOOK_SECRET .env

# Restart API
docker compose restart api
```

### Price IDs Not Set

```bash
# View .stripe-proof/stripe-config.txt
cat .stripe-proof/stripe-config.txt

# Update .env manually if needed
# Or re-run setup
./scripts/setup-stripe-automated.sh
```

### Tier Not Upgrading After Payment

```bash
# Check Firestore
# organizations/{orgId}/settings/system
# Verify subscription.tier field exists

# Check webhook delivery in Stripe Dashboard
# Look for failed events
```

---

## Files & Documentation

| File | Purpose |
|------|---------|
| `scripts/setup-stripe-automated.sh` | Automated setup (CLI) |
| `docs/STRIPE_ONBOARDING_WORKFLOW.md` | Complete onboarding guide |
| `services/api-firebase/src/routes/billing-status.js` | Status & validation API |
| `apps/secretary-console/stripe-admin.html` | Admin dashboard |
| `STRIPE_WEBHOOK_TESTING_GUIDE.md` | Webhook testing |
| `STRIPE_AUTOMATION_IMPLEMENTATION.md` | This file |

---

## Success Criteria

✅ **Setup Complete When:**
- [ ] Stripe CLI installed
- [ ] Products created in Stripe
- [ ] Prices generated
- [ ] `.env` updated
- [ ] `.stripe-proof/` artifacts generated
- [ ] `docker compose restart api` successful
- [ ] Health check: `curl http://localhost:4001/health` → 200

✅ **Validation Passing When:**
- [ ] `curl http://localhost:4001/billing/status/system` shows "configured"
- [ ] `curl http://localhost:4001/billing/status/validation` shows 100%
- [ ] Admin dashboard shows ✓ all green
- [ ] Free tier enforcement: Meeting creation returns 402

✅ **Production Ready When:**
- [ ] Live Stripe API key configured
- [ ] Webhook endpoint registered in Stripe Dashboard
- [ ] All STRIPE_* env vars set
- [ ] `docker compose -f docker-compose.hybrid.yml up -d` successful
- [ ] Real webhook test passes

---

## Next Steps

1. **Run Setup:** `./scripts/setup-stripe-automated.sh`
2. **Verify:** Visit `http://localhost:5173/stripe-admin.html`
3. **Test:** Run E2E tests from STRIPE_ONBOARDING_WORKFLOW.md
4. **Deploy:** Follow production deployment steps
5. **Monitor:** Watch webhook delivery in Stripe Dashboard

---

**Status:** ✅ Ready for immediate use
**Support:** See docs/ folder for detailed guides
