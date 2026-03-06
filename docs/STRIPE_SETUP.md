# Stripe Billing Setup Guide

This guide covers the one-time setup required to enable Stripe billing for ChamberAI's multi-tiered subscription model.

## Overview

ChamberAI uses Stripe to manage three subscription tiers:
- **Pro**: $9/month - Unlimited meetings + AI minutes
- **Council**: $149/month - DOCX export + analytics dashboard + API access
- **Network**: $399/month - Multi-chamber management + Enterprise support

## Prerequisites

- Stripe account (https://stripe.com)
- Stripe CLI installed (https://stripe.com/docs/stripe-cli)
- Access to your ChamberAI deployment environment variables

## Step 1: Create Products in Stripe Dashboard

1. Go to **Stripe Dashboard** → **Products**
2. Click **Add product** and create three products:

### Product 1: ChamberAI Pro
- Name: `ChamberAI Pro`
- Description: `Unlimited meetings, real-time AI minutes, advanced search`
- Type: `Service`
- Click **Create product**

### Product 2: ChamberAI Council
- Name: `ChamberAI Council`
- Description: `Everything in Pro, plus DOCX export, analytics dashboard, API access`
- Type: `Service`
- Click **Create product**

### Product 3: ChamberAI Network
- Name: `ChamberAI Network`
- Description: `Everything in Council, plus multi-chamber management, SSO, priority support`
- Type: `Service`
- Click **Create product**

## Step 2: Create Prices for Each Product

For each product, add a recurring price:

### Pro Price
1. Go to **Products** → **ChamberAI Pro**
2. Click **Add price**
3. Set:
   - Billing period: `Monthly`
   - Price: `$9.00 USD`
   - Click **Create price**
4. **Note the price ID** (format: `price_...`) - you'll need this for `.env`

### Council Price
1. Go to **Products** → **ChamberAI Council**
2. Click **Add price**
3. Set:
   - Billing period: `Monthly`
   - Price: `$149.00 USD`
   - Click **Create price**
4. **Note the price ID**

### Network Price
1. Go to **Products** → **ChamberAI Network**
2. Click **Add price**
3. Set:
   - Billing period: `Monthly`
   - Price: `$399.00 USD`
   - Click **Create price**
4. **Note the price ID**

## Step 3: Configure Webhook Endpoint

Webhooks allow Stripe to notify your API when payment events occur (checkout complete, subscription updated, payment failed, etc).

### Using Stripe CLI (Local Development)

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Start the webhook listener
stripe listen --forward-to http://localhost:4001/billing/webhook \
  --events "checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_failed"

# The CLI will display your signing secret:
# whsec_... (copy this to your .env STRIPE_WEBHOOK_SECRET)
```

### Production Deployment

For production, you need to register a webhook endpoint in Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set:
   - Endpoint URL: `https://your-api-domain.com/billing/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
4. Click **Create endpoint**
5. **Note the signing secret** (format: `whsec_...`)
6. Add to your `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Step 4: Get Your API Keys

1. Go to **Developers** → **API Keys**
2. You'll see:
   - Publishable key: `pk_test_...` or `pk_live_...`
   - Secret key: `sk_test_...` or `sk_live_...`
3. For development: use `sk_test_...` key
4. For production: use `sk_live_...` key

## Step 5: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Stripe API credentials
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)

# Webhook signing secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs for each tier (from Step 2)
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_COUNCIL=price_...
STRIPE_PRICE_NETWORK=price_...

# Base URL for checkout success/cancel redirects
APP_BASE_URL=http://localhost:5173 (or your production domain)

# Multi-tenancy
DEFAULT_ORG_ID=default
```

## Step 6: Configure Stripe Customer Portal (Production)

The Customer Portal allows users to manage their subscriptions (view invoices, update payment method, cancel).

1. Go to **Settings** → **Branding and appearance**
2. Customize:
   - Logo
   - Brand colors
   - Business name/address

3. Go to **Settings** → **Customer Portal**
4. Enable features:
   - ☑ Subscriptions (update/manage)
   - ☑ Billing history (view invoices)
   - ☑ Update payment method
4. Set return URL: `https://your-app-domain.com/billing/portal-return`

## Testing the Integration

### Test Payment with Stripe Test Cards

Use these test card numbers:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

CVV: any 3 digits
Expiry: any future date

### Local Development Flow

1. Start Docker Compose:
   ```bash
   docker compose up -d
   ```

2. In another terminal, start Stripe webhook listener:
   ```bash
   stripe listen --forward-to http://localhost:4001/billing/webhook \
     --events "checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_failed"
   ```

3. Test checkout flow:
   ```bash
   curl -X POST http://localhost:4001/billing/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer test-token" \
     -d '{"tier":"council"}'

   # Returns: {"url": "https://checkout.stripe.com/..."}
   # Open this URL in browser and complete test payment
   ```

4. Verify webhook received:
   ```bash
   # Should see in Stripe CLI output:
   # > checkout.session.completed [evt_...]

   # Verify subscription was created:
   curl http://localhost:4001/billing/status \
     -H "Authorization: Bearer test-token"

   # Returns: {"tier":"council","validUntil":"...","status":"active"}
   ```

### Test Payment Failed Handler

```bash
# Fire test payment_failed event
stripe trigger invoice.payment_failed

# Verify subscription status updated to past_due
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer test-token"

# Should show: {"tier":"council","validUntil":"...","status":"past_due"}
```

## Endpoints Reference

### POST /billing/checkout
Create Stripe Checkout session for a tier upgrade

```bash
curl -X POST http://localhost:4001/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <auth-token>" \
  -d '{"tier":"pro"}' # or "council" or "network"

# Response: {"url": "https://checkout.stripe.com/..."}
```

### GET /billing/status
Get current organization's subscription status (requires auth)

```bash
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer <auth-token>"

# Response: {
#   "tier": "council",
#   "validUntil": "2026-04-05T12:34:56.789Z",
#   "status": "active"
# }
```

### POST /billing/portal
Create Stripe Customer Portal session for managing subscription

```bash
curl -X POST http://localhost:4001/billing/portal \
  -H "Authorization: Bearer <auth-token>"

# Response: {"url": "https://billing.stripe.com/..."}
```

### POST /billing/webhook
Receive webhook events from Stripe (no auth required, signature verified)

Called automatically by Stripe when:
- Checkout session completes
- Subscription is updated
- Subscription is canceled
- Invoice payment fails

## Troubleshooting

### "Price ID not configured" error
- Verify `STRIPE_PRICE_*` env vars are set correctly
- Check that prices exist in Stripe Dashboard
- Restart your API service after updating `.env`

### "Invalid webhook signature" error
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Make sure you're using the webhook signing secret, not the API secret key

### Webhook not triggering locally
- Ensure `stripe listen` command is running
- Check that forwarding URL is correct (`http://localhost:4001/billing/webhook`)
- Verify firewall isn't blocking webhook delivery

### Customer not created in Stripe
- Check API logs for errors during checkout
- Verify `STRIPE_SECRET_KEY` is valid and has correct permissions
- Check that the organization exists in Firestore

## Production Checklist

Before deploying to production:

- [ ] Switch to `sk_live_...` API key in production `.env`
- [ ] Update webhook endpoint to production domain
- [ ] Test with live Stripe keys in staging environment
- [ ] Configure Customer Portal branding
- [ ] Set up Stripe email notifications (failed payments, etc)
- [ ] Document your billing support process
- [ ] Create runbook for common issues (payment failures, refunds)
- [ ] Test invoice generation and email delivery
- [ ] Verify all three tiers work end-to-end
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up Stripe alerts (Radar, etc) if needed

## Support

For Stripe API issues, see: https://stripe.com/docs/api
For webhook troubleshooting: https://stripe.com/docs/webhooks
For test cards and sandbox: https://stripe.com/docs/testing
