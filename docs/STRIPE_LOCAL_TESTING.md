# Stripe Local Testing Guide

Complete guide for testing the Stripe billing integration locally using the Stripe CLI.

## Prerequisites

### 1. Stripe CLI Installation

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux (Ubuntu/Debian):**
```bash
cd /tmp
curl https://files.stripe.com/stripe-cli/releases/latest/linux/x86_64/stripe_linux_x86_64.tar.gz -o stripe.tar.gz
tar -xvf stripe.tar.gz
sudo mv stripe /usr/local/bin/
stripe version
```

**Windows:**
```bash
choco install stripe
```

Verify installation:
```bash
stripe version
```

### 2. ChamberAI Running Locally

```bash
# Terminal 1: Start Docker services
cd /path/to/ChamberAI
docker compose up -d

# Verify services are healthy
docker compose ps

# Tail logs to watch for issues
docker compose logs -f api worker
```

### 3. Mock Token Setup

Add mock auth tokens to your `.env` for testing:

```bash
FIREBASE_AUTH_MOCK_TOKENS='
{
  "test-admin": {
    "uid": "user-admin-1",
    "email": "admin@chamber.local",
    "role": "admin"
  },
  "test-secretary": {
    "uid": "user-sec-1",
    "email": "secretary@chamber.local",
    "role": "secretary"
  }
}
'
```

Then restart the API:
```bash
docker compose restart api
```

---

## Step 1: Login to Stripe

```bash
stripe login
```

This will:
1. Open a browser window
2. Ask you to authenticate with your Stripe account
3. Provide an API key for the CLI

---

## Step 2: Create Test Products & Prices

Create the three pricing tiers in your Stripe test account:

```bash
# Create Pro product
PRO_PRODUCT_ID=$(stripe products create \
  --name "ChamberAI Pro" \
  --description "Unlimited meetings + AI minutes" \
  --type service \
  --format json | jq -r '.id')

echo "Pro Product ID: $PRO_PRODUCT_ID"

# Create Council product
COUNCIL_PRODUCT_ID=$(stripe products create \
  --name "ChamberAI Council" \
  --description "DOCX export + analytics + API" \
  --type service \
  --format json | jq -r '.id')

echo "Council Product ID: $COUNCIL_PRODUCT_ID"

# Create Network product
NETWORK_PRODUCT_ID=$(stripe products create \
  --name "ChamberAI Network" \
  --description "Multi-chamber + enterprise" \
  --type service \
  --format json | jq -r '.id')

echo "Network Product ID: $NETWORK_PRODUCT_ID"
```

### Create Prices

```bash
# Pro price: $9/month
PRO_PRICE=$(stripe prices create \
  --product "$PRO_PRODUCT_ID" \
  --unit-amount 900 \
  --currency usd \
  --recurring interval=month \
  --format json | jq -r '.id')

echo "Pro Price ID: $PRO_PRICE"

# Council price: $149/month
COUNCIL_PRICE=$(stripe prices create \
  --product "$COUNCIL_PRODUCT_ID" \
  --unit-amount 14900 \
  --currency usd \
  --recurring interval=month \
  --format json | jq -r '.id')

echo "Council Price ID: $COUNCIL_PRICE"

# Network price: $399/month
NETWORK_PRICE=$(stripe prices create \
  --product "$NETWORK_PRODUCT_ID" \
  --unit-amount 39900 \
  --currency usd \
  --recurring interval=month \
  --format json | jq -r '.id')

echo "Network Price ID: $NETWORK_PRICE"
```

### Save Price IDs to .env

Add to your `.env`:
```bash
STRIPE_PRICE_PRO=price_...        # from PRO_PRICE
STRIPE_PRICE_COUNCIL=price_...    # from COUNCIL_PRICE
STRIPE_PRICE_NETWORK=price_...    # from NETWORK_PRICE
```

Restart API:
```bash
docker compose restart api
```

---

## Step 3: Start Webhook Listener

In a new terminal, start the Stripe CLI webhook listener:

```bash
stripe listen --forward-to http://localhost:4001/billing/webhook \
  --events "checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_failed"
```

**Output will show:**
```
> Ready! Your webhook signing secret is: whsec_1234567890...
```

**Add webhook secret to .env:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890...
```

Restart API:
```bash
docker compose restart api
```

Keep this terminal open for webhook testing.

---

## Step 4: Test the Complete Flow

### 4.1 Create an Organization

```bash
curl -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Test Chamber",
    "slug": "local-test"
  }' | jq .

# Response:
# {
#   "orgId": "org_...",
#   "name": "Local Test Chamber",
#   "slug": "local-test"
# }

# Save orgId for next steps
ORG_ID="org_..."
```

### 4.2 Check Billing Status (Free Tier)

```bash
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer test-admin" | jq .

# Response:
# {
#   "tier": "free",
#   "validUntil": null,
#   "status": "active"
# }
```

### 4.3 Create Checkout Session

```bash
curl -X POST http://localhost:4001/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin" \
  -d '{"tier": "council"}' | jq .

# Response:
# {
#   "url": "https://checkout.stripe.com/..."
# }

# Save the URL for next step
CHECKOUT_URL="https://checkout.stripe.com/..."
```

### 4.4 Complete Payment in Browser

1. Open the checkout URL in your browser
2. Use Stripe test card: `4242 4242 4242 4242`
3. Email: `admin@chamber.local`
4. Expiry: Any future date (e.g., 12/25)
5. CVV: Any 3 digits (e.g., 123)
6. Click **Pay** or **Subscribe**

### 4.5 Watch Webhook in CLI

In the webhook listener terminal, you'll see:
```
> checkout.session.completed [evt_1234567890...]
```

### 4.6 Verify Subscription Created

Check billing status again:
```bash
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer test-admin" | jq .

# Response should now show:
# {
#   "tier": "council",
#   "validUntil": "2026-04-05T12:00:00.000Z",
#   "status": "active"
# }
```

### 4.7 Verify Meeting Creation Now Works

```bash
curl -X POST http://localhost:4001/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin" \
  -d '{
    "name": "Council Meeting",
    "date": "2026-03-10",
    "body": "Minutes body",
    "members": ["member@test.com"]
  }' | jq .

# Should return 201 Created (no 402 Payment Required)
```

---

## Step 5: Test Edge Cases

### Test: Payment Failure Handler

```bash
# In webhook listener terminal, trigger payment_failed event:
stripe trigger invoice.payment_failed

# In another terminal, check subscription status:
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer test-admin" | jq .

# Status should now show: "past_due"
```

### Test: Subscription Update

```bash
# Trigger subscription update event:
stripe trigger customer.subscription.updated

# Verify webhook received in listener terminal
```

### Test: Subscription Cancellation

```bash
# Trigger cancellation:
stripe trigger customer.subscription.deleted

# Verify status changes back to "free"
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer test-admin" | jq .
```

### Test: Org Isolation

```bash
# Create second organization
curl -X POST http://localhost:4001/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"Org 2","slug":"org-2"}' | jq .

# Get billing status with different token
# Should show free tier for org 2 (separate subscription)
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer test-secretary" | jq .
```

### Test: Declined Card

```bash
# Use Stripe declined card in checkout: 4000 0000 0000 0002
# Should fail payment and trigger invoice.payment_failed webhook
# Check status becomes "past_due"
```

---

## Step 6: Run Automated Validation

```bash
# Make the validation script executable
chmod +x tests/validation/multi_tenancy_validation.sh

# Run tests
./tests/validation/multi_tenancy_validation.sh http://localhost:4001

# Output will show:
# ✓ Passed: X
# ✗ Failed: Y
# ⊘ Skipped: Z
```

---

## Debugging Guide

### Check API Logs

```bash
docker compose logs api -f
```

Look for:
- `Subscription created: tier=...`
- `Payment failed: invoice=...`
- Any errors in `subscription` object

### Check Webhook Delivery

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click on your local test endpoint
3. View **Events** tab for delivery attempts
4. Click event to see request/response

### Stripe CLI Debug Mode

```bash
stripe listen --forward-to http://localhost:4001/billing/webhook \
  --events "checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_failed" \
  --api-key sk_test_...
```

### Common Issues

**"Price ID not configured" error:**
```bash
# Verify env vars are set
echo $STRIPE_PRICE_PRO
echo $STRIPE_PRICE_COUNCIL
echo $STRIPE_PRICE_NETWORK

# If empty, add to .env and restart:
docker compose restart api
```

**"Webhook signature verification failed":**
```bash
# Verify webhook secret is correct
echo $STRIPE_WEBHOOK_SECRET

# Should match the value shown when stripe listen started
# If wrong, restart listener and update .env
```

**"No Stripe customer found":**
```bash
# Verify organization exists in Firestore
# Check docker logs:
docker compose logs api | grep "customer="
```

**"Invalid checkout URL":**
```bash
# Make sure checkout endpoint returns URL starting with https://checkout.stripe.com
curl -X POST http://localhost:4001/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin" \
  -d '{"tier":"pro"}' | jq .

# Should see: "url": "https://checkout.stripe.com/..."
```

---

## Test Cards

Use these cards in the Stripe test checkout:

### Success
- **Card:** 4242 4242 4242 4242
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **ZIP:** Any 5 digits

### Decline
- **Card:** 4000 0000 0000 0002
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Result:** Payment declined

### 3D Secure (requires password)
- **Card:** 4000 0025 0000 3155
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Password:** Any value

---

## Next: E2E Testing

After manual testing, run the E2E test suite:

```bash
npm test -- --testPathPattern=billing
```

This will run automated tests that:
- Create organizations
- Verify tier gating
- Test checkout flow
- Verify webhooks update subscriptions
- Test org isolation

---

## Reference

- Stripe Testing Docs: https://stripe.com/docs/testing
- Stripe CLI Reference: https://stripe.com/docs/stripe-cli
- Webhook Events: https://stripe.com/docs/webhooks/event-types
- Test Data: https://stripe.com/docs/testing#cards
