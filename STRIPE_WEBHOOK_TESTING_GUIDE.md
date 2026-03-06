# Stripe Webhook Testing Guide

## Overview

ChamberAI's Stripe billing implementation includes comprehensive webhook handling for:
- `checkout.session.completed` - Upgrade to Pro/Council/Network tier
- `customer.subscription.updated` - Renew or modify subscription
- `customer.subscription.deleted` - Downgrade to free tier
- `invoice.payment_failed` - Mark subscription as past_due

## Local Testing (Development)

### Prerequisites

- Docker services running (`docker compose up -d`)
- API available at `http://localhost:4001`
- Test credentials configured

### Test Mode Webhook Bypass

For local testing without Stripe CLI, the webhook endpoint supports test mode bypass:

**Webhook secret in .env:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_local_test_secret  # or any key containing "test"
```

**Test webhook signature:**
```bash
-H "Stripe-Signature: t=1234567890,v1=mock_signature"
```

When both conditions are met, webhook signature verification is skipped for easier local testing.

### Complete E2E Test Flow

```bash
#!/bin/bash

API="http://localhost:4001"

# 1. Create organization
ORG_ID=$(curl -s -X POST $API/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Org","slug":"test-org"}' | jq -r '.orgId')
echo "Created org: $ORG_ID"

# 2. Verify free tier (should block meetings)
curl -s -X POST $API/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  -d '{"name":"Test","date":"2026-03-10","body":"test","members":[]}'
# Expected: 402 Payment Required

# 3. Get billing status
curl -s -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  $API/billing/status | jq .
# Expected: tier: "free"

# 4. Simulate checkout webhook (Pro upgrade)
curl -s -X POST $API/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=mock_signature" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_1234567890",
        "customer": "cus_test_stripe_customer",
        "subscription": "sub_test_pro_1234567890",
        "metadata": {"orgId": "'$ORG_ID'"}
      }
    }
  }' | jq .

# 5. Verify Pro tier (meetings should work)
curl -s -X POST $API/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  -d '{"name":"Pro Meeting","date":"2026-03-10","body":"test","members":[]}'
# Expected: 201 Created with meeting ID

# 6. Simulate payment failed webhook
curl -s -X POST $API/billing/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=mock_signature" \
  -d '{
    "type": "invoice.payment_failed",
    "data": {
      "object": {
        "id": "in_test_failed",
        "customer": "cus_test_stripe_customer",
        "subscription": "sub_test_pro_1234567890"
      }
    }
  }' | jq .

# 7. Verify past_due status
curl -s -H "Authorization: Bearer test-token-org1" \
  -H "X-Org-Id: $ORG_ID" \
  $API/billing/status | jq .
# Expected: status: "past_due"
```

## Production Testing with Real Stripe Account

### Setup

1. **Create Stripe Account**
   ```bash
   # Go to https://dashboard.stripe.com
   # Create products for Pro, Council, Network tiers
   # Create price IDs for monthly subscriptions
   ```

2. **Configure Environment Variables**
   ```bash
   # In production .env:
   STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
   STRIPE_WEBHOOK_SECRET=whsec_live_... # from Stripe Dashboard
   STRIPE_PRICE_PRO=price_...
   STRIPE_PRICE_COUNCIL=price_...
   STRIPE_PRICE_NETWORK=price_...
   ```

3. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   wget https://downloads.stripe.com/stripe-cli/v1.x.x/stripe_linux_x86_64.tar.gz
   tar -xzf stripe_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin
   ```

4. **Authenticate Stripe CLI**
   ```bash
   stripe login
   ```

5. **Forward Webhooks to Local API**
   ```bash
   stripe listen --forward-to http://localhost:4001/billing/webhook \
     --events checkout.session.completed,customer.subscription.updated,\
   customer.subscription.deleted,invoice.payment_failed
   ```

6. **Get Webhook Secret**
   Copy the `whsec_...` value from the `stripe listen` output and add to `.env`

### Test Real Payment Flow

1. **Create checkout session**
   ```bash
   curl -s -X POST http://localhost:4001/billing/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -H "X-Org-Id: ORG_ID" \
     -d '{"tier":"pro"}' | jq '.url'
   ```

2. **Open Stripe Checkout**
   - Click the URL from step 1
   - Use test card: `4242 4242 4242 4242`
   - Any expiry date in future
   - Any 3-digit CVC

3. **Webhook Processing**
   - `stripe listen` will show incoming webhook
   - Check API logs for webhook processing
   - Verify organization tier upgraded in Firestore

4. **Verify Tier Upgrade**
   ```bash
   curl -s -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -H "X-Org-Id: ORG_ID" \
     http://localhost:4001/billing/status | jq .
   ```

## Test Cards

| Scenario | Card Number | Exp Date | CVC |
|----------|-------------|----------|-----|
| Success | 4242 4242 4242 4242 | Any future | Any 3-digit |
| Declined | 4000 0000 0000 0002 | Any future | Any 3-digit |
| Expired | 4000 0000 0000 0069 | Any past | Any 3-digit |
| 3D Secure | 4000 0000 0000 3220 | Any future | Any 3-digit |

## Debugging

### Check Webhook Logs
```bash
# View recent API logs
docker logs chamberofcommerceai-api-1 | grep -i webhook

# Check Firestore data
# Go to organizations/{orgId}/settings/system
# Verify subscription.tier and subscription.status fields
```

### Common Issues

**"Invalid webhook signature"**
- Verify STRIPE_WEBHOOK_SECRET is correct
- In test mode, ensure signature header is exactly: `t=1234567890,v1=mock_signature`
- Restart API after env changes

**"Price ID not configured"**
- Check STRIPE_PRICE_PRO, STRIPE_PRICE_COUNCIL, STRIPE_PRICE_NETWORK are set
- Verify price IDs exist in Stripe account
- Restart API

**"Organization not found"**
- Verify orgId exists in request metadata
- Check organization document in Firestore
- Ensure org was created before webhook

**Webhook not being processed**
- Verify webhook endpoint is receiving requests (check Docker logs)
- Check JSON format in webhook payload
- For Stripe CLI: verify `--forward-to` URL is correct

## Architecture Notes

### Request Flow
1. Frontend → `/billing/checkout` → Creates Stripe session
2. User completes payment in Stripe Checkout
3. Stripe → `/billing/webhook` → Webhook event received
4. Webhook handler → Updates `organizations/{orgId}/settings/system`
5. Frontend detects tier change → Unlocks premium features

### Webhook Signature Verification
- Production: Uses `stripe.webhooks.constructEvent()` for full signature verification
- Development: Supports test mode bypass for easier local testing
- Raw body required: Webhook endpoint uses `express.raw()` middleware

### Per-Organization Subscriptions
- Each organization has own Stripe customer ID
- Each organization stores subscription in own `settings/system` doc
- Complete isolation between orgs

## Next Steps

1. **Set up Stripe account** (if not already done)
2. **Configure live API keys** (for production deployment)
3. **Run production webhook tests** with real Stripe
4. **Set up monitoring** for failed webhooks
5. **Configure retry policies** in Stripe Dashboard
6. **Enable email notifications** for payment failures

---

For more information:
- Stripe API Docs: https://stripe.com/docs/api
- Webhook Events: https://stripe.com/docs/api/events/types
- Test Cards: https://stripe.com/docs/testing
