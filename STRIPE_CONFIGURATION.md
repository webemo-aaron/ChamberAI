# Stripe Configuration Guide

**Status**: To be completed after Hetzner deployment
**Timeline**: 30-60 minutes total
**Blocker**: No — deploy first without Stripe, configure anytime

---

## Overview

This guide walks through setting up Stripe billing for ChamberAI after your Hetzner deployment is live. You do **not** need to do this before deploying.

### What You'll Create
- 3 Stripe Products (Pro, Council, Network)
- 4 Stripe Prices (Pro monthly, Council monthly, Council annual, Network monthly)
- 1 Webhook endpoint (for subscription updates)

### Final Pricing
| Tier | Billing | Price | Env Var |
|------|---------|-------|---------|
| Free | N/A | $0 | (no var needed) |
| Pro | Monthly | $29/mo | `STRIPE_PRICE_PRO` |
| Council | Monthly | $149/mo | `STRIPE_PRICE_COUNCIL` |
| Council | Annual | $1,430/yr | `STRIPE_PRICE_COUNCIL_ANNUAL` |
| Network | Monthly | $399/mo | `STRIPE_PRICE_NETWORK` |

---

## Prerequisites

- [ ] Hetzner deployment is running
- [ ] API endpoint is responding (e.g., https://api.yourdomain.com/health)
- [ ] Stripe account created (https://stripe.com/start)
- [ ] Stripe API keys ready (Dashboard → Developers → API Keys)

---

## Phase 1: Create Products & Prices (15 min)

### Option A: Automated Script (Recommended)

If the server has Stripe CLI installed:

```bash
ssh root@46.224.10.3
cd /opt/chamberai

# Create all products and prices automatically
./scripts/setup-stripe-automated.sh --api-key sk_live_YOUR_KEY
```

This script:
1. Authenticates with Stripe CLI
2. Creates all 3 products
3. Creates all 4 prices
4. Outputs price IDs to `.stripe-proof/stripe-config.txt`

**Save the output** — you'll need the price IDs.

### Option B: Manual via Stripe Dashboard (Recommended for First-Time)

Go to: https://dashboard.stripe.com/products

#### Create Product 1: ChamberAI Pro

1. Click **"+ Add product"**
2. Set name: `ChamberAI Pro`
3. Set description: `Unlimited meetings, governance reports, Zapier integration`
4. Leave other fields blank, click **"Save product"**
5. Click **"Add price"**
6. Set type: **Recurring**
7. Set price: **$29 USD**
8. Set billing period: **Monthly**
9. Click **"Save price"**
10. **Save the price ID** (format: `price_1234567890...`)

#### Create Product 2: ChamberAI Council

1. Click **"+ Add product"**
2. Set name: `ChamberAI Council`
3. Set description: `25 team members, DOCX export, board analytics, API access, 99.9% SLA`
4. Click **"Save product"**
5. Click **"Add price"** (monthly)
6. Set type: **Recurring**
7. Set price: **$149 USD**
8. Set billing period: **Monthly**
9. Click **"Save price"**
10. **Save the price ID** (`STRIPE_PRICE_COUNCIL`)
11. Click **"Add price"** (annual)
12. Set type: **Recurring**
13. Set price: **$1,430 USD**
14. Set billing period: **Yearly**
15. Click **"Save price"**
16. **Save the price ID** (`STRIPE_PRICE_COUNCIL_ANNUAL`)

#### Create Product 3: ChamberAI Network

1. Click **"+ Add product"**
2. Set name: `ChamberAI Network`
3. Set description: `Unlimited members, multi-chamber support, 99.99% SLA, dedicated account manager`
4. Click **"Save product"**
5. Click **"Add price"**
6. Set type: **Recurring**
7. Set price: **$399 USD**
8. Set billing period: **Monthly**
9. Click **"Save price"**
10. **Save the price ID** (`STRIPE_PRICE_NETWORK`)

---

## Phase 2: Register Webhook (10 min)

### 2a. Get API Keys

Go to: https://dashboard.stripe.com/developers/api-keys

You'll see:
- **Publishable key**: `pk_live_...` (not needed now, used by frontend later)
- **Secret key**: `sk_live_...` (needed for environment)

**Copy the Secret Key** — you'll need it in the next step.

### 2b. Register Webhook Endpoint

1. Go to: https://dashboard.stripe.com/developers/webhooks
2. Click **"+ Add endpoint"**
3. Set URL: `https://api.yourdomain.com/billing/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. You'll see a signing secret: `whsec_...`
7. **Copy this secret** — you'll need it in the next step

---

## Phase 3: Update Server Environment (5 min)

### 3a. SSH to Server
```bash
ssh -i ~/.ssh/id_rsa root@46.224.10.3
cd /opt/chamberai
```

### 3b. Edit .env.hybrid
```bash
nano .env.hybrid
```

Update Stripe section with your values:
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_PRICE_PRO=price_1234567890...
STRIPE_PRICE_COUNCIL=price_0987654321...
STRIPE_PRICE_COUNCIL_ANNUAL=price_5555555555...
STRIPE_PRICE_NETWORK=price_9999999999...
```

Also update:
```bash
# Change demo mode to false (enforce Pro tier requirement)
DEMO_MODE=false
```

**Save**: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3c. Redeploy Stack
```bash
./scripts/deploy_hybrid_vps.sh .env.hybrid
```

This will restart all containers with new Stripe environment variables.

Wait 2-3 minutes for services to come back up.

---

## Phase 4: Verify Configuration (5 min)

### 4a. Check Stripe Status
```bash
curl https://api.yourdomain.com/billing/status/system | jq .
```

Expected response:
```json
{
  "configured": true,
  "key_type": "live",
  "prices_configured": true,
  "webhook_configured": true,
  "missing_config": {
    "secret_key": false,
    "webhook_secret": false,
    "price_pro": false,
    "price_council": false,
    "price_network": false
  }
}
```

✅ All `false` values = **Stripe is fully configured**

### 4b. Test Checkout Flow (Test Mode First)

**IMPORTANT**: Test with Stripe **test keys first** before using live keys.

1. In Stripe Dashboard, switch to **"Test mode"** (toggle at top)
2. Get test **Secret key** (starts with `sk_test_`)
3. Create test **prices** in test mode
4. Update `.env.hybrid` with test keys
5. Redeploy and test

Test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any expiry: `12/34`
- Any CVC: `123`

### 4c. Manual Checkout Test

```bash
curl -X POST https://api.yourdomain.com/billing/checkout \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "pro"}'
```

Expected response:
```json
{
  "url": "https://checkout.stripe.com/pay/cs_live_..."
}
```

Open this URL in browser → complete test payment with test card → webhook should fire

### 4d. Verify Webhook Received

In Stripe Dashboard → Developers → Webhooks → Find your endpoint:
- Click to expand
- Scroll to **"Events"** section
- Should see `checkout.session.completed` with status ✅ **200 OK**

### 4e. Check Firestore Updated

After webhook fires, check that org subscription was updated:

```bash
# From your frontend, check /billing/status endpoint
curl https://api.yourdomain.com/billing/status \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

Expected (for test):
```json
{
  "tier": "pro",
  "validUntil": "2026-04-22T...",
  "status": "active"
}
```

---

## Phase 5: Go Live (Test → Live Keys)

Once testing is complete:

### 5a. Switch to Live Keys in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/developers/api-keys
2. Copy **Live Secret key** (starts with `sk_live_`)
3. Copy **Live Webhook signing secret** (for webhook endpoint in live mode)

### 5b. Update Server .env.hybrid

```bash
ssh root@46.224.10.3
cd /opt/chamberai
nano .env.hybrid
```

Replace test keys with live keys:
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
# Price IDs stay the same (they work in both test and live)
```

**Important**: Make sure DEMO_MODE=false (enforce paid tier)

### 5c. Redeploy with Live Keys

```bash
./scripts/deploy_hybrid_vps.sh .env.hybrid
```

### 5d. Final Verification

```bash
curl https://api.yourdomain.com/billing/status/system | jq .
```

Should show:
```json
{
  "configured": true,
  "key_type": "live",  ← Now says "live" instead of "test"
  "prices_configured": true,
  ...
}
```

---

## Production Checklist

Before allowing paying customers:

- [ ] Stripe is in **Live mode** (not Test)
- [ ] API keys are `sk_live_*` (not `sk_test_*`)
- [ ] Webhook endpoint is registered and responding
- [ ] Test payment works end-to-end
- [ ] Subscription tier updates in Firestore after payment
- [ ] DEMO_MODE=false (enforce Pro tier)
- [ ] Pro tier gating works (`POST /meetings` requires Pro)
- [ ] DOCX export requires Council tier
- [ ] Analytics requires Council tier
- [ ] Users can upgrade via `POST /billing/checkout`
- [ ] Users can manage subscription via `POST /billing/portal`
- [ ] Failed payments trigger `invoice.payment_failed` webhook
- [ ] Subscriptions can be canceled (reverts to free tier)

---

## What Happens After Configuration

### User Flow (Paid Tier)
1. User signs up with email → defaults to **Free tier**
2. User tries to create meeting → **gets 402 Payment Required**
3. UI shows upgrade button → calls `POST /billing/checkout?tier=pro`
4. Redirected to Stripe Checkout
5. Completes payment with card
6. Stripe fires `checkout.session.completed` webhook
7. ChamberAI backend updates org tier to **"pro"** in Firestore
8. User can now create meetings ✅

### Features by Tier (After Configuration)
| Feature | Free | Pro | Council | Network |
|---------|------|-----|---------|---------|
| Create meetings | ❌ | ✅ | ✅ | ✅ |
| Create motions | ✅ | ✅ | ✅ | ✅ |
| Export PDF/Markdown | ✅ | ✅ | ✅ | ✅ |
| **Export DOCX** | ❌ | ❌ | ✅ | ✅ |
| **Board analytics** | ❌ | ❌ | ✅ | ✅ |
| **API access** | ❌ | ❌ | ✅ | ✅ |
| Team members | 1 | 5 | 25 | ∞ |
| SLA | None | None | 99.9% | 99.99% |

---

## Monitoring & Support

### Key Metrics to Watch
- **Successful payments**: Stripe Dashboard → Payments
- **Failed payments**: Stripe Dashboard → Disputes
- **Webhook success rate**: Stripe Dashboard → Webhooks → Your endpoint → Events
- **API error rate**: Server logs → `docker logs chamberofcommerceai-api-1`

### Common Issues

**Problem**: Checkout button doesn't work
→ Check `STRIPE_SECRET_KEY` is set and valid
→ Check `STRIPE_PRICE_PRO` is set and valid

**Problem**: Webhook not firing
→ Check webhook URL is accessible from internet
→ Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
→ Check firewall allows HTTPS (port 443)

**Problem**: Subscription not updating in Firestore
→ Check webhook delivery in Stripe Dashboard
→ Check server logs: `docker logs chamberofcommerceai-api-1 | grep webhook`
→ Verify `orgId` in webhook matches Firestore doc

**Problem**: "Payment required" even after paying
→ Check webhook was delivered (Stripe Dashboard)
→ Check `/billing/status` endpoint returns updated tier
→ Clear browser cache and try again

---

## Security Notes

- **Secret keys**: Never commit to git, only in `.env.hybrid` (not in git)
- **Webhook secret**: Used to verify webhooks are from Stripe
- **Test vs Live**: Always test with test keys before going live
- **PCI compliance**: Stripe handles all payment data, you don't see card numbers
- **Webhook signature verification**: Automatically verified by `stripe.webhooks.constructEvent()`

---

## Disabling Stripe (Reverting to Demo Mode)

If you need to disable billing:

```bash
nano .env.hybrid
# Set:
DEMO_MODE=true
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_COUNCIL=
STRIPE_PRICE_NETWORK=

./scripts/deploy_hybrid_vps.sh .env.hybrid
```

This reverts to demo mode — free tier can create unlimited meetings.

---

## Next Steps

After Stripe is configured and live:

1. **Promote Council tier**
   - Market DOCX export + analytics
   - Target chambers with audit requirements

2. **Monitor churn**
   - Email users before billing date
   - Offer discounts to at-risk customers

3. **Expand use cases**
   - Add more paid features (SSO, integrations)
   - Upsell Network tier to multi-chamber orgs

4. **Optimize pricing**
   - Monitor conversion rates
   - A/B test pricing (3-month trials)

---

**Questions?** Refer to:
- Stripe docs: https://docs.stripe.com/billing/checkout
- API endpoints: `docs/API.md`
- Backend code: `services/api-firebase/src/routes/billing.js`
