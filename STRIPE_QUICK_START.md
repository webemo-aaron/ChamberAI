# Stripe Automated Setup - Quick Start

**Everything you need to enable Stripe billing in 15 minutes.**

---

## ⚡ 5-Minute Setup

### 1. Create Stripe Account (if needed)
```
Visit: https://dashboard.stripe.com
Sign up and verify email
```

### 2. Run Automated Setup
```bash
chmod +x ./scripts/setup-stripe-automated.sh
./scripts/setup-stripe-automated.sh
```

**What happens:**
- ✅ Stripe CLI installed
- ✅ Stripe account authenticated
- ✅ 3 products created
- ✅ 3 prices generated
- ✅ .env updated
- ✅ Proof artifacts created

### 3. Restart Services
```bash
docker compose restart api
curl http://localhost:4001/health
```

### 4. Verify in Admin Panel
```
Open: http://localhost:5173/stripe-admin.html
See: ✓ All green
```

---

## ✅ Validation Checklist

### System Status
```bash
curl http://localhost:4001/billing/status/system | jq '.status'
# Expected: "configured"
```

### Configuration Percentage
```bash
curl http://localhost:4001/billing/status/validation | jq '.validation_percentage'
# Expected: 100
```

### Proof Artifacts
```bash
ls -la .stripe-proof/
# Should contain: setup-proof.json, SETUP_SUMMARY.md, stripe-config.txt
```

### Environment Variables
```bash
grep STRIPE_ .env
# Should show all STRIPE_* variables set
```

---

## 🧪 Test E2E Flow (5 minutes)

### 1. Create Test Org
```bash
ORG=$(curl -s -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test"}')
ORG_ID=$(echo "$ORG" | jq -r '.orgId')
echo "Org ID: $ORG_ID"
```

### 2. Verify Free Tier (Should Block)
```bash
curl -s -X POST http://localhost:4001/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  -d '{"name":"Test","date":"2026-03-10","body":"test","members":[]}' \
  | jq '.error'
# Expected: "Payment required for this tier"
```

### 3. Check Billing Status
```bash
curl -s -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  http://localhost:4001/billing/status | jq '.tier'
# Expected: "free"
```

### 4. Simulate Upgrade Webhook
```bash
curl -s -X POST http://localhost:4001/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=mock_signature" \
  -d "{\"type\":\"checkout.session.completed\",\"data\":{\"object\":{\"id\":\"cs_test_1\",\"customer\":\"cus_test_1\",\"subscription\":\"sub_test_1\",\"metadata\":{\"orgId\":\"$ORG_ID\"}}}}" \
  | jq '.status'
# Expected: 200
```

### 5. Verify Upgrade
```bash
curl -s -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  http://localhost:4001/billing/status | jq '.tier'
# Expected: "pro"
```

### 6. Verify Meeting Creation Works
```bash
curl -s -X POST http://localhost:4001/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  -d '{"name":"Pro Meeting","date":"2026-03-10","body":"test","members":[]}'
  | jq '.status'
# Expected: 201 (or similar success response)
```

---

## 🚀 Production Deployment

### 1. Get Live API Key
```
Stripe Dashboard → Developers → API Keys → Live mode
Copy: sk_live_...
```

### 2. Register Webhook
```
Stripe Dashboard → Developers → Webhooks → Add endpoint
URL: https://yourdomain.com/billing/webhook
Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
Copy webhook signing secret: whsec_live_...
```

### 3. Update Environment
```bash
# Production .env or secrets manager
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
APP_BASE_URL=https://yourdomain.com
FIREBASE_AUTH_ENABLED=true
```

### 4. Deploy
```bash
docker compose -f docker-compose.hybrid.yml down
docker compose -f docker-compose.hybrid.yml up -d
docker compose -f docker-compose.hybrid.yml ps
```

### 5. Verify Production
```bash
curl https://yourdomain.com/health
curl https://yourdomain.com/billing/status/system | jq '.status'
```

---

## 📊 Admin Dashboard

Access at: **http://localhost:5173/stripe-admin.html**

Shows:
- ✓ Overall configuration status
- ✓ Stripe setup percentage
- ✓ Feature enablement
- ✓ Environment (test/production)
- ✓ Missing configuration items
- ✓ Next steps recommendations

Tabs:
- **Validation** - System checks
- **Setup Guide** - Run automated setup
- **Organizations** - Look up org billing

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| `STRIPE_AUTOMATION_IMPLEMENTATION.md` | Complete guide |
| `docs/STRIPE_ONBOARDING_WORKFLOW.md` | Workflow phases |
| `STRIPE_WEBHOOK_TESTING_GUIDE.md` | Webhook testing |
| `STRIPE_QUICK_START.md` | This file |
| `scripts/setup-stripe-automated.sh` | Automation script |

---

## 🔧 Troubleshooting

### "Stripe CLI not found"
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://downloads.stripe.com/stripe-cli/v1.x.x/stripe_linux_x86_64.tar.gz
tar -xzf stripe_linux_x86_64.tar.gz && sudo mv stripe /usr/local/bin/
```

### "Price IDs not set"
```bash
cat .stripe-proof/stripe-config.txt
# Copy tier, product_id, price_id values
# Manually add to .env if needed
```

### "Webhook not processing"
```bash
# Verify webhook secret
grep STRIPE_WEBHOOK_SECRET .env

# Check API logs
docker logs chamberofcommerceai-api-1 | grep webhook

# Restart API
docker compose restart api
```

### "Organization not found"
```bash
# Create org first
curl -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test"}'
```

---

## ✨ Key Features

✅ **One-Command Setup** - Single script configures everything
✅ **Zero Configuration** - Auto-detects environment and adapts
✅ **Proof of Implementation** - Audit trail and validation artifacts
✅ **Admin Dashboard** - Real-time monitoring and control
✅ **Context-Aware** - Guides you through each step
✅ **Production Ready** - Validation for test and live modes
✅ **Complete Isolation** - Per-organization billing
✅ **Automatic Tiers** - Free tier automatic assignment

---

## 🎯 Success = When All ✓ Green

- ✓ Setup script completes without errors
- ✓ `.stripe-proof/` directory contains artifacts
- ✓ `grep STRIPE_ .env` shows all variables
- ✓ Admin dashboard shows 100% configuration
- ✓ E2E test flow shows tier enforcement working
- ✓ Free tier blocks meeting creation (402)
- ✓ Webhook processes payment and upgrades tier

---

## 📋 Quick Reference Commands

```bash
# Setup
./scripts/setup-stripe-automated.sh

# Verify
curl http://localhost:4001/billing/status/system
curl http://localhost:4001/billing/status/validation

# Test org
curl -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test"}'

# View proof
cat .stripe-proof/SETUP_SUMMARY.md

# Admin dashboard
open http://localhost:5173/stripe-admin.html
```

---

**Time Required:** 15 minutes
**Difficulty:** ⭐ Very Easy
**Status:** ✅ Production Ready

**Start now:** `./scripts/setup-stripe-automated.sh`
