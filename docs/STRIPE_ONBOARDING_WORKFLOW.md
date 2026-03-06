# ChamberAI Stripe Onboarding Workflow

## Overview

Complete, context-aware workflow for platform admins and tenants to:
- Automatically configure Stripe
- Validate billing setup
- Test payment flows
- Enable production billing

**Time Required:** 15-30 minutes (depending on Stripe account setup)

---

## Phase 1: Platform Admin Setup (5-10 minutes)

### 1.1 Prerequisites Check

```bash
# Verify Docker is running
docker compose ps

# Verify API is healthy
curl http://localhost:4001/health
# Expected: {"ok": true}
```

### 1.2 Create Stripe Account (if needed)

- Go to https://dashboard.stripe.com
- Sign up for account (or login if existing)
- Note: Use test mode for development

### 1.3 Get API Keys

From Stripe Dashboard:
1. Go to Developers → API Keys
2. Copy **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Keep this safe - it's like a password!

### 1.4 Run Automated Setup

```bash
# Make script executable
chmod +x ./scripts/setup-stripe-automated.sh

# Run setup (interactive - Stripe CLI will prompt for login)
./scripts/setup-stripe-automated.sh

# OR provide API key directly (non-interactive)
./scripts/setup-stripe-automated.sh "sk_test_..." default
```

**What the script does:**
- ✓ Installs Stripe CLI (if needed)
- ✓ Creates 3 products (Pro, Council, Network)
- ✓ Creates 3 monthly prices
- ✓ Updates `.env` with price IDs
- ✓ Validates Stripe configuration
- ✓ Generates proof of setup

### 1.5 Verify Setup Completed

```bash
# Check proof document
cat .stripe-proof/SETUP_SUMMARY.md

# View environment configuration
grep STRIPE_ .env
```

---

## Phase 2: Local Testing (5 minutes)

### 2.1 Restart Services

```bash
# Rebuild API image with new config
docker compose down
docker compose up -d

# Verify API is healthy
docker compose ps
```

### 2.2 Manual E2E Test

```bash
# Step 1: Create test organization
ORG=$(curl -s -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Chamber","slug":"test-chamber"}')
ORG_ID=$(echo "$ORG" | jq -r '.orgId')
echo "Created org: $ORG_ID"

# Step 2: Verify free tier (should block meetings)
curl -s -X POST http://localhost:4001/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  -d '{"name":"Test","date":"2026-03-10","body":"test","members":[]}' \
  | jq '.error'
# Expected: "Payment required for this tier"

# Step 3: Check billing status
curl -s -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  http://localhost:4001/billing/status | jq '.'
# Expected: tier: "free", status: "active"

# Step 4: Test webhook (test mode - no real payment)
curl -s -X POST http://localhost:4001/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=mock_signature" \
  -d "{
    \"type\": \"checkout.session.completed\",
    \"data\": {
      \"object\": {
        \"id\": \"cs_test_1\",
        \"customer\": \"cus_test_1\",
        \"subscription\": \"sub_test_1\",
        \"metadata\": {\"orgId\": \"$ORG_ID\"}
      }
    }
  }" | jq '.'

# Step 5: Verify tier upgraded
curl -s -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  http://localhost:4001/billing/status | jq '.tier'
# Expected: "pro" (from webhook)
```

### 2.3 Validation Checklist

- [ ] Stripe CLI installed successfully
- [ ] Stripe products created (Pro, Council, Network)
- [ ] Price IDs generated
- [ ] `.env` updated with STRIPE_PRICE_* variables
- [ ] API restarted without errors
- [ ] Free tier enforcement working (402 response)
- [ ] Webhook processing working
- [ ] Tier upgrade detected after webhook

---

## Phase 3: Production Preparation (5-10 minutes)

### 3.1 Enable Stripe Webhooks

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/billing/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy webhook signing secret

### 3.2 Update Production Environment

```bash
# Update .env with production credentials
STRIPE_SECRET_KEY=sk_live_...          # Use live key
STRIPE_WEBHOOK_SECRET=whsec_live_...   # From webhook setup
APP_BASE_URL=https://yourdomain.com    # Your production URL
```

### 3.3 Deploy to Production

```bash
# Verify configuration
grep STRIPE_ .env

# Deploy with new environment
docker compose -f docker-compose.hybrid.yml down
docker compose -f docker-compose.hybrid.yml up -d

# Verify services are healthy
docker compose -f docker-compose.hybrid.yml ps
```

---

## Phase 4: Tenant Onboarding (Ongoing)

### 4.1 Tenant Self-Service Signup

Tenants visit your app:
1. Click "Create Organization"
2. Enter organization name & slug
3. Automatically creates free tier account
4. Sees "Upgrade" button (when features are gated)

### 4.2 Tenant Upgrade Flow

Tenant wants to upgrade:
1. Click "Upgrade Plan"
2. Choose tier (Pro $9, Council $149, Network $399)
3. Redirected to Stripe Checkout
4. Enters payment info (test card in dev, real card in prod)
5. Returns to app after payment
6. Webhook processes subscription
7. Tier automatically upgrades
8. Premium features unlocked

### 4.3 Monitoring Tenant Billing

Admin dashboard (to be built):
- View all organizations
- Check billing status per org
- See subscription tier and renewal date
- Monitor failed payments
- Trigger manual reconciliation

---

## Proof of Implementation

### Artifacts Generated

**Automated Setup:**
```
.stripe-proof/
├── setup-proof.json           # Proof of setup completion
├── SETUP_SUMMARY.md           # Setup checklist & next steps
├── stripe-config.txt          # Product and price IDs
└── setup-log.json             # Audit trail of all actions
```

**Environment:**
```
.env
├── STRIPE_SECRET_KEY          # API authentication
├── STRIPE_WEBHOOK_SECRET      # Webhook validation
├── STRIPE_PRICE_PRO           # $9/month price ID
├── STRIPE_PRICE_COUNCIL       # $149/month price ID
└── STRIPE_PRICE_NETWORK       # $399/month price ID
```

**Validation Results:**
```
Health checks:
✓ API health: 200 OK
✓ Firestore connected: active
✓ Firebase Auth: enabled

Stripe configuration:
✓ API key valid
✓ Products created (3)
✓ Prices created (3)
✓ Webhook endpoint registered

Functional tests:
✓ Free tier enforcement (402)
✓ Billing status endpoint
✓ Webhook processing
✓ Tier upgrade detection
```

---

## Troubleshooting

### "Stripe CLI not found"

```bash
# Install manually
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://downloads.stripe.com/stripe-cli/v1.x.x/stripe_linux_x86_64.tar.gz
tar -xzf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### "Stripe authentication failed"

```bash
# Clear existing authentication
stripe logout

# Re-authenticate
stripe login
```

### "Price ID not configured"

```bash
# Run setup again to generate prices
./scripts/setup-stripe-automated.sh

# Verify .env has STRIPE_PRICE_* variables
grep STRIPE_PRICE .env
```

### "Webhook signature verification failed"

- Verify `STRIPE_WEBHOOK_SECRET` in `.env` matches Stripe Dashboard
- For local testing, ensure signature header is: `t=1234567890,v1=mock_signature`
- Restart API after env changes: `docker compose restart api`

### "Organization not found after webhook"

```bash
# Check if org exists in Firestore
# Go to Firebase Console → Firestore → organizations collection
# Verify organization document exists

# Check webhook processing log
docker logs chamberofcommerceai-api-1 | grep webhook
```

---

## Validation Endpoints

All endpoints documented in `STRIPE_WEBHOOK_TESTING_GUIDE.md`

**Quick validation:**
```bash
# Health check
curl http://localhost:4001/health

# Org creation
curl -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Org","slug":"org"}'

# Billing status
curl -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: ORG_ID" \
  http://localhost:4001/billing/status

# Webhook test
curl -X POST http://localhost:4001/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=mock_signature" \
  -d '{"type":"checkout.session.completed",...}'
```

---

## Success Criteria

✅ Platform admin has completed setup when:
- [ ] Stripe CLI installed
- [ ] Stripe account created/authenticated
- [ ] 3 products created in Stripe
- [ ] 3 prices generated
- [ ] `.env` updated with all STRIPE_* variables
- [ ] `.stripe-proof/` contains validation artifacts
- [ ] Local testing shows all green
- [ ] Proof of setup documented

✅ Tenant can upgrade when:
- [ ] Free org created successfully
- [ ] Tier enforcement blocks premium features
- [ ] Checkout endpoint responds with Stripe URL
- [ ] Webhook processes payment
- [ ] Tier updates in organization document
- [ ] Premium features unlock

✅ Production deployment ready when:
- [ ] Live Stripe API key configured
- [ ] Webhook endpoint registered in Stripe Dashboard
- [ ] All environment variables set
- [ ] Services restarted and healthy
- [ ] Real test payment validates flow

---

## Context Awareness

**The workflow adapts based on:**

1. **Environment Detection**
   - Dev: Test mode, mock webhooks, Stripe CLI listen
   - Prod: Live keys, real webhooks, full validation

2. **Platform Readiness**
   - First run: Full setup walkthrough
   - Already configured: Quick validation only
   - Issues detected: Troubleshooting guide

3. **Tenant Journey**
   - Signup: Auto-creates free org
   - Upgrade: Seamless Stripe checkout
   - Renewal: Automatic via webhook
   - Failure: Graceful degradation to past_due

---

## Next Steps

1. **Run automated setup:** `./scripts/setup-stripe-automated.sh`
2. **Validate locally:** Run E2E tests in Phase 2
3. **Prepare production:** Configure webhook in Stripe Dashboard
4. **Deploy:** Update prod environment and restart services
5. **Monitor:** Check webhook delivery in Stripe Dashboard
6. **Support:** Use proof documents for customer support

---

## Files Reference

- **Setup Script:** `scripts/setup-stripe-automated.sh`
- **Testing Guide:** `STRIPE_WEBHOOK_TESTING_GUIDE.md`
- **Billing Guide:** `docs/STRIPE_SETUP.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`
- **Proof Artifacts:** `.stripe-proof/`
