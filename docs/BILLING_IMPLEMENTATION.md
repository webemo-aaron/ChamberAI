# ChamberAI Billing Implementation Guide

## Summary

The complete premium billing system and **monetized 4-tier pricing model** has been implemented (commits c1067ca + a82144a + updated for Pro at $9/mo).

**Key change**: Meetings and AI minutes now require **Pro tier ($29/mo minimum)** to ensure infrastructure costs are covered.

**Status**: ✅ Code-ready. Requires Stripe account setup and environment configuration before deployment.

---

## Tier Pricing (New)

| Tier | Price | Meetings | AI Minutes | Key Feature | Target |
|------|-------|----------|-----------|-------------|--------|
| Free | $0 | Demo only | — | Evaluation only | Trial users |
| **Pro** | **$29/mo** | **Unlimited** | **✓** | Volume engine | All real users |
| Council | $149/mo | Unlimited | ✓ Advanced | DOCX + analytics | Premium buyers |
| Network | $399/mo | Unlimited | ✓ Advanced | Multi-chamber | Enterprise |

---

## What Was Built

### 1. Stripe Billing Integration ✅
- **Checkout endpoint**: `POST /billing/checkout` - Initiates Stripe Checkout session
- **Status endpoint**: `GET /billing/status` - Returns current subscription tier
- **Portal endpoint**: `POST /billing/portal` - Redirects to Stripe customer portal
- **Webhook handler**: `POST /billing/webhook` - Processes Stripe events (subscription.created, .updated, .deleted)

### 2. Tier Enforcement Middleware ✅
- **requireTier(tier)** - Express middleware that gates features by subscription level
- Returns 402 (Payment Required) if user doesn't have required tier
- Compares tier levels (free < pro < council < network)
- Applied to: POST /meetings (requires Pro), export (requires Council), analytics (requires Council)

### 3. Meeting Recording Gate (NEW) ✅
- **`POST /meetings`** now requires `requireTier("pro")`
- Free tier users cannot create real meetings (returns 402)
- Free tier is evaluation-only (demo data provided)
- Automatic conversion trigger: "You've tried the demo. Create your first real meeting → $29/mo"

### 4. Premium Features (Code-Ready) ✅

#### DOCX Export (Council+ tier)
- **Route**: `POST /meetings/:id/export?format=docx`
- **Output**: Word document with meeting header, motions table, action items, signature line
- **Gating**: Returns 402 if tier < council
- **Package**: Uses `docx` library (pure JavaScript, no dependencies)

#### Governance Compliance Report (Pro+ tier)
- **Route**: `GET /meetings/:id/governance-report`
- **Returns**: Compliance score (0-100%), checklist status, flags
- **Checks**: Quorum, motions, actions, approval timing, overdue items
- **Gating**: Returns 402 if tier < pro

#### Board Analytics (Council+ tier)
- **Route**: `GET /analytics/board`
- **Returns**: Aggregate metrics across all meetings
- **Metrics**: Approval time, action completion rate, attendance, motions/meeting, owner stats
- **Gating**: Returns 402 if tier < council

### 4. Marketing Documentation ✅
- **PREMIUM_TIER_STRATEGY.md** - 4-tier model, ICP, unit economics, GTM strategy
- **PREMIUM_SALES_PLAYBOOK.md** - Discovery script, demo flow, objection handling, email sequences
- **SALES_COPY.md** - Updated with premium tier positioning and benefits

---

## Tier Model

```
Free (0)
├─ Unlimited meetings
├─ 1 team member
├─ AI minutes
├─ PDF/Markdown export
└─ No credit card required

Pro ($29/month) ← Volume engine
├─ Everything in Free +
├─ 5 team members
├─ Governance compliance report (monthly scorecard)
├─ Zapier integration
└─ Email support

Council ($149/month) ← PROFITABILITY ENGINE
├─ Everything in Pro +
├─ 25 team members
├─ DOCX export (Word format, audit-ready)
├─ Board effectiveness analytics
├─ API access
├─ 99.9% SLA
└─ Email + chat support

Network ($399/month) ← Enterprise
├─ Everything in Council +
├─ Unlimited team members
├─ Multi-chamber support
├─ 99.99% SLA
├─ Dedicated account manager
└─ Custom integrations
```

---

## How to Set Up

### Step 1: Install Dependencies
```bash
cd services/api-firebase
npm install stripe docx
```

### Step 2: Create Stripe Account & Products

```bash
# Install Stripe CLI (if not present)
npm install -g stripe

# Login to your Stripe account
stripe login

# View your test secret key
stripe config --list
# Output: sk_test_...

# Create products (once per account)
stripe products create \
  --name="ChamberAI Pro" \
  --description="5 team members, governance reports"

stripe products create \
  --name="ChamberAI Council" \
  --description="25 members, DOCX export, analytics, API"

stripe products create \
  --name="ChamberAI Network" \
  --description="Unlimited members, multi-chamber"

# Create prices for each product
# (Replace <product-id> with actual IDs from products above)
stripe prices create \
  --product=<pro-product-id> \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month

stripe prices create \
  --product=<council-product-id> \
  --unit-amount=14900 \
  --currency=usd \
  --recurring[interval]=month

stripe prices create \
  --product=<network-product-id> \
  --unit-amount=39900 \
  --currency=usd \
  --recurring[interval]=month
```

### Step 3: Configure Environment Variables

Create/update `.env`:

```env
# Stripe API Keys (from stripe config --list)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Will get this from webhook setup

# Stripe Price IDs (from products created above)
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_COUNCIL=price_...
STRIPE_PRICE_NETWORK=price_...

# Your app's base URL (for Stripe redirect URLs)
APP_BASE_URL=http://localhost:5173  # dev
# APP_BASE_URL=https://yourdomain.com  # production
```

### Step 4: Set Up Webhook Handler (for local development)

```bash
# In another terminal, forward webhooks to your local API
stripe listen --forward-to localhost:4001/billing/webhook

# Output will show:
# Ready! Your webhook signing secret is: whsec_...
# Add this to STRIPE_WEBHOOK_SECRET in .env
```

### Step 5: Test Billing Flow

```bash
# Start API service
npm run dev

# In another terminal, test checkout endpoint
curl -X POST http://localhost:4001/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"tier":"council"}'

# Expected response:
# {"url": "https://checkout.stripe.com/pay/..."}

# Test status endpoint
curl http://localhost:4001/billing/status \
  -H "Authorization: Bearer test-token"

# Expected response (default):
# {"tier":"free","stripeCustomerId":null,"validUntil":null,"status":"active"}
```

---

## How Subscription Tier Is Stored

**Location**: Firestore `settings` document (key: "system")

**Structure**:
```json
{
  "subscription": {
    "tier": "council",
    "stripeCustomerId": "cus_...",
    "stripeSubscriptionId": "sub_...",
    "validUntil": "2025-04-05T12:00:00Z",
    "status": "active"
  },
  "updated_at": "Timestamp"
}
```

**Default** (if not set): `tier: "free"`

---

## API Endpoints

### Billing Routes

#### `POST /billing/checkout`
Create a Stripe Checkout session.

**Auth**: Requires `requireRole("admin")`

**Body**:
```json
{
  "tier": "pro|council|network"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/pay/cs_live_..."
}
```

**Errors**:
- 400: Invalid tier
- 500: Missing price ID in environment

---

#### `GET /billing/status`
Get current subscription status.

**Auth**: Public (no auth required, but requires valid Firebase token in practice)

**Response**:
```json
{
  "tier": "free|pro|council|network",
  "stripeCustomerId": "cus_...",
  "validUntil": "2025-04-05T12:00:00Z",
  "status": "active"
}
```

---

#### `POST /billing/portal`
Redirect to Stripe Customer Portal (manage subscription).

**Auth**: Requires `requireRole("admin")`

**Response**:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

**Errors**:
- 400: No active Stripe subscription found

---

#### `POST /billing/webhook`
Stripe webhook handler (public, no auth).

**Headers**: `stripe-signature: <signature>`

**Body**: Raw Stripe event

**Processes**:
- `checkout.session.completed` → Create subscription in settings
- `customer.subscription.updated` → Update subscription status
- `customer.subscription.deleted` → Revert to free tier

**Response**: `{"received": true}`

---

### Feature Gates

#### `POST /meetings/:id/export?format=docx`
Export meeting minutes as DOCX (Word format).

**Auth**: Requires `requireRole("admin", "secretary")`

**Tier**: Requires council+ (returns 402 if tier < council)

**Response** (binary):
- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Body: Word document binary

---

#### `GET /meetings/:id/governance-report`
Get governance compliance report for a meeting.

**Auth**: Requires auth (but no role check)

**Tier**: Requires pro+ (returns 402 if tier < pro)

**Response**:
```json
{
  "meeting_id": "mtg_...",
  "meeting_date": "2025-03-05",
  "compliance_score": 87,
  "checks": {
    "quorum_recorded": true,
    "all_motions_have_outcome": true,
    "all_actions_have_owner": true,
    "all_actions_have_due_date": false,
    "minutes_approved": true,
    "public_summary_published": false
  },
  "flags": [
    {
      "type": "missing_seconder",
      "message": "Some motions missing seconder information",
      "severity": "warning"
    }
  ],
  "summary": {
    "motions_total": 5,
    "motions_passed": 4,
    "actions_total": 8,
    "actions_completed": 6,
    "actions_overdue": 1
  }
}
```

---

#### `GET /analytics/board`
Get board effectiveness metrics (aggregate across meetings).

**Auth**: Requires auth

**Tier**: Requires council+ (returns 402 if tier < council)

**Response**:
```json
{
  "meetings_total": 12,
  "average_time_to_approval_days": 3.2,
  "action_item_completion_rate": 87,
  "average_meeting_attendance": 18.5,
  "motions_per_meeting_avg": 4.2,
  "most_active_action_owners": [
    {"owner": "john@chamber.org", "actions": 12},
    {"owner": "mary@chamber.org", "actions": 10}
  ],
  "meeting_frequency_days": 7,
  "data_points": {
    "approval_samples": 11,
    "action_items_total": 50,
    "attendance_samples": 12,
    "motions_total": 50
  }
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Run `npm run test:unit` (should still be 46/46 passing)
- [ ] Verify no regressions from new code

### Integration Tests
- [ ] Create checkout session via `/billing/checkout`
- [ ] Verify redirect URL is valid Stripe Checkout
- [ ] Check `/billing/status` returns free tier (default)
- [ ] Call `/meetings/:id/governance-report` (should return 402 for free user)
- [ ] Call `/analytics/board` (should return 402 for free user)
- [ ] Call `/meetings/:id/export?format=docx` for free user (should return 402)

### Stripe Webhook Testing
- [ ] Start webhook listener: `stripe listen --forward-to localhost:4001/billing/webhook`
- [ ] Trigger test event: `stripe trigger checkout.session.completed`
- [ ] Verify Firestore settings document updated with subscription
- [ ] Check audit logs recorded BILLING_SUBSCRIPTION_CREATED event

### E2E Flow (Full Cycle)
1. User signs up for free tier
2. User clicks "Upgrade to Council" button
3. Redirected to Stripe Checkout
4. Complete test payment (use Stripe test card 4242 4242 4242 4242)
5. Webhook fires → subscription.created
6. Settings updated in Firestore (tier = "council")
7. User can now export as DOCX
8. User can see board analytics
9. User accesses `/billing/status` → returns "council" tier

---

## Frontend Integration (Next Steps)

The backend is complete. Frontend will need:

1. **Billing page** (`/billing`)
   - Show current tier + `/billing/status` call
   - Tier cards with "Upgrade" buttons
   - Link to portal (POST `/billing/portal`)

2. **Checkout flow**
   - POST `/billing/checkout` → get Stripe URL
   - Redirect `window.location = url`
   - Handle success/cancel redirects

3. **Feature gates**
   - Check `tier` from `/billing/status`
   - Show 402 error if accessing gated features
   - Disable DOCX export button for free/pro users
   - Hide analytics for < council tier

4. **Success page** (`/billing/success`)
   - Confirm subscription was created
   - Refresh `/billing/status` to verify tier updated

---

## Deployment Checklist

### Before Production Deployment

- [ ] Create Stripe account (live keys, not test)
- [ ] Create live products & prices in Stripe
- [ ] Set `STRIPE_SECRET_KEY` to live key (sk_live_...)
- [ ] Set `STRIPE_WEBHOOK_SECRET` to live key (whsec_...)
- [ ] Verify `APP_BASE_URL` is correct (https://yourdomain.com)
- [ ] Set up webhook forwarding in Stripe dashboard (not via CLI)
- [ ] Test full flow with live Stripe account
- [ ] Document billing operations runbook for support team

### Stripe Webhook Setup (Production)

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/billing/webhook`
4. Events: Select `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy signing secret → set `STRIPE_WEBHOOK_SECRET`

---

## Profitability Metrics (Expected)

### Council Tier Unit Economics
```
Monthly revenue:        $149/mo
Infrastructure cost:    ~$8
Payment processing:     ~$4.62
Support overhead:       ~$45
Gross margin:           ~61% ($91.38/customer)

Break-even point:       6 Council customers
Year 1 target:          100 Council customers
Year 1 ARR:             ~$178,800 (Council) + ~$15,600 (Pro) = $194,400
Year 1 Gross profit:    ~$116,640
```

### Customer Acquisition Cost (CAC) Targets
- Free → Pro: $30 (organic)
- Cold email → Council: $300-500 (3-month payback)
- Landing page → Council: $80-150
- Overall portfolio CAC: <$400

### LTV:CAC Ratio
- Pro: 29:1 (excellent but lower LTV)
- Council: 9:1 (excellent, profit engine)
- Network: 7.6:1 (good)

---

## Monitoring & Alerts

Once deployed, monitor:

1. **Stripe webhook success rate** - Should be >99%
2. **Failed checkouts** - Track in Stripe dashboard
3. **Subscription churn** - Measure monthly
4. **Payment disputes/chargebacks** - Zero tolerance
5. **API error rate on `/billing/*` endpoints** - Should be <0.1%

---

## Support Procedures

### "I can't export to DOCX"
→ Check `/billing/status`, verify tier >= council
→ If free/pro, send upgrade link: `POST /billing/checkout?tier=council`

### "My subscription disappeared"
→ Check Stripe webhook logs for `subscription.deleted` event
→ Verify webhook signature secret matches
→ Manually update settings if needed

### "Webhook isn't working"
→ Check Stripe dashboard → Developers → Webhooks → Event deliveries
→ Verify endpoint URL and signing secret
→ Re-trigger test event

---

## Next Steps

1. **Immediate**: Install dependencies, set up Stripe account, configure environment
2. **This week**: Test full checkout + webhook flow with test Stripe account
3. **Next week**: Integrate billing UI in frontend (tier display, upgrade buttons)
4. **Before launch**: Run full E2E flow, document support procedures, train team

**Status**: All backend code is committed and ready. Frontend integration is blocked until frontend team starts work.

---

**Questions?** Refer to:
- PREMIUM_TIER_STRATEGY.md for business context
- PREMIUM_SALES_PLAYBOOK.md for customer-facing messaging
- Stripe documentation: https://docs.stripe.com/billing/checkout
