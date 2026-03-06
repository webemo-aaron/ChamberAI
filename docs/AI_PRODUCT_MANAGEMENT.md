# AI-Directed Product Management & Stripe Integration

**Version:** 1.0
**Date:** 2026-03-06
**Status:** ✅ PRODUCTION READY

---

## Overview

Automated, AI-directed product lifecycle management with real-time Stripe integration. When products/offerings are created in ChamberAI, corresponding Stripe products and prices are automatically generated for immediate monetization.

**Key Features:**
- ✅ One-API product creation with automatic Stripe sync
- ✅ Batch product operations
- ✅ Per-organization product catalogs
- ✅ Multiple pricing tiers (monthly/annual)
- ✅ Real-time Stripe synchronization
- ✅ Product analytics & subscription tracking
- ✅ Soft delete with archiving
- ✅ Role-based access control (admin only)

---

## Architecture

### Components

1. **Stripe Product Manager** (`services/api-firebase/src/services/stripe-product-manager.js`)
   - Core service handling Stripe API interactions
   - Product/price creation, updates, analytics
   - Batch operations and syncing

2. **Products API** (`services/api-firebase/src/routes/products.js`)
   - REST endpoints for product management
   - Organization-scoped product catalogs
   - Role-based access control

3. **Role-Based Access Control** (`services/api-firebase/src/middleware/requireRole.js`)
   - New middleware for role enforcement
   - Admin-only product management
   - Membership-based role checking

### Data Flow

```
Platform Admin
  ↓
POST /products
  ↓
[Products API Route]
  ↓
[Stripe Product Manager]
  ↓
Stripe API: Create Product + Price
  ↓
[Store metadata locally]
  ↓
Response: {stripeProductId, stripePriceId, ...}
  ↓
Product ready for tenant checkout
```

---

## API Endpoints

### Product Management

#### **POST /products**
Create a new product with automatic Stripe integration

**Request:**
```bash
curl -X POST http://localhost:4001/products \
  -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_..." \
  -H "Content-Type: application/json" \
  -d {
    "name": "Premium Reports",
    "description": "Advanced governance and compliance reports",
    "monthlyPrice": 29.99,
    "tier": "pro",
    "category": "addon",
    "metadata": {
      "feature_flag": "premium_reports_v1",
      "default": true
    }
  }
```

**Response:**
```json
{
  "productId": "prod_local_1234",
  "stripeProductId": "prod_abc123xyz",
  "stripePriceId": "price_abc123xyz",
  "product": {
    "name": "Premium Reports",
    "description": "Advanced governance and compliance reports",
    "monthlyPrice": 29.99,
    "tier": "pro",
    "category": "addon",
    "status": "active"
  }
}
```

---

#### **GET /products**
List all active products for organization

**Request:**
```bash
curl -H "Authorization: Bearer token" \
  -H "X-Org-Id: org_..." \
  http://localhost:4001/products
```

**Response:**
```json
{
  "count": 3,
  "products": [
    {
      "id": "prod_local_1234",
      "name": "Premium Reports",
      "monthlyPrice": 29.99,
      "stripeProductId": "prod_abc123",
      "stripePriceId": "price_abc123",
      "status": "active",
      "created_at": "2026-03-06T..."
    }
  ]
}
```

---

#### **GET /products/:productId**
Get product details with Stripe analytics

**Request:**
```bash
curl -H "Authorization: Bearer token" \
  -H "X-Org-Id: org_..." \
  http://localhost:4001/products/prod_local_1234
```

**Response:**
```json
{
  "id": "prod_local_1234",
  "name": "Premium Reports",
  "monthlyPrice": 29.99,
  "stripeProductId": "prod_abc123",
  "stripePriceId": "price_abc123",
  "status": "active",
  "analytics": {
    "product": {
      "id": "prod_abc123",
      "name": "Premium Reports",
      "active": true,
      "metadata": { ... }
    },
    "subscriptions": {
      "count": 2,
      "details": [
        {
          "id": "sub_xyz",
          "status": "active",
          "current_period_end": 1742620800
        }
      ]
    }
  }
}
```

---

#### **PATCH /products/:productId**
Update product name, description, or metadata

**Request:**
```bash
curl -X PATCH http://localhost:4001/products/prod_local_1234 \
  -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_..." \
  -H "Content-Type: application/json" \
  -d {
    "name": "Advanced Governance Reports",
    "description": "New description",
    "metadata": {
      "feature_flag": "premium_reports_v2"
    }
  }
```

**Response:**
```json
{
  "status": "updated",
  "productId": "prod_local_1234"
}
```

---

#### **POST /products/:productId/prices**
Add additional pricing tier (e.g., annual billing)

**Request:**
```bash
curl -X POST http://localhost:4001/products/prod_local_1234/prices \
  -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_..." \
  -H "Content-Type: application/json" \
  -d {
    "amount": 299.99,
    "interval": "year"
  }
```

**Response:**
```json
{
  "stripePriceId": "price_annual_123",
  "amount": 299.99,
  "interval": "year",
  "status": "active"
}
```

---

#### **DELETE /products/:productId**
Archive product (soft delete)

**Request:**
```bash
curl -X DELETE http://localhost:4001/products/prod_local_1234 \
  -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_..."
```

**Response:**
```json
{
  "status": "archived",
  "productId": "prod_local_1234"
}
```

---

### Batch Operations

#### **POST /products/batch/create**
Create multiple products in one request

**Request:**
```bash
curl -X POST http://localhost:4001/products/batch/create \
  -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_..." \
  -H "Content-Type: application/json" \
  -d {
    "products": [
      {
        "name": "Product 1",
        "description": "Desc 1",
        "monthlyPrice": 9.99,
        "tier": "pro"
      },
      {
        "name": "Product 2",
        "description": "Desc 2",
        "monthlyPrice": 19.99,
        "tier": "council"
      }
    ]
  }
```

**Response:**
```json
{
  "created": 2,
  "failed": 0,
  "results": [
    {
      "localId": "prod_local_1",
      "stripeProductId": "prod_stripe_1"
    },
    {
      "localId": "prod_local_2",
      "stripeProductId": "prod_stripe_2"
    }
  ],
  "errors": []
}
```

---

#### **POST /products/sync**
Sync all local products to Stripe (reconciliation)

**Request:**
```bash
curl -X POST http://localhost:4001/products/sync \
  -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_..."
```

**Response:**
```json
{
  "synced": 3,
  "created": 2,
  "errors": 0,
  "details": {
    "synced": ["prod_local_1", "prod_local_2"],
    "created": [
      {
        "localId": "prod_local_3",
        "stripeProductId": "prod_stripe_3",
        "stripePriceId": "price_stripe_3"
      }
    ],
    "errors": []
  }
}
```

---

#### **GET /products/stripe/all**
View all AI-created products in Stripe (admin dashboard)

**Request:**
```bash
curl -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_..." \
  http://localhost:4001/products/stripe/all
```

**Response:**
```json
{
  "count": 5,
  "products": [
    {
      "id": "prod_abc123",
      "name": "Premium Reports",
      "description": "Advanced governance reports",
      "active": true,
      "metadata": {
        "tier": "pro",
        "category": "addon",
        "created_via": "ai_product_manager"
      },
      "analytics": {
        "product": { ... },
        "subscriptions": {
          "count": 2,
          "details": [ ... ]
        }
      }
    }
  ]
}
```

---

## Use Cases

### Use Case 1: Launch New Premium Feature

**Scenario:** Chamber wants to offer "Advanced Analytics"

```bash
# Step 1: Create product
curl -X POST http://localhost:4001/products \
  -H "Authorization: Bearer admin-token" \
  -H "X-Org-Id: org_chamber_1" \
  -H "Content-Type: application/json" \
  -d {
    "name": "Advanced Analytics",
    "description": "Real-time board metrics and trends",
    "monthlyPrice": 19.99,
    "tier": "council",
    "category": "feature",
    "metadata": {
      "feature_flag": "advanced_analytics",
      "launch_date": "2026-03-15"
    }
  }
```

**Result:**
- ✅ Stripe product created (`prod_abc123`)
- ✅ Monthly price created (`price_abc123`)
- ✅ Local metadata stored with feature flag
- ✅ Product immediately available for tenant checkout

### Use Case 2: Multi-Tier Pricing

**Scenario:** Offer same product at different price points

```bash
# Step 1: Create base product
curl -X POST http://localhost:4001/products \
  -d { "name": "API Access", "monthlyPrice": 49.99, ... }

# Step 2: Add annual pricing
curl -X POST http://localhost:4001/products/prod_local_1/prices \
  -d { "amount": 499.99, "interval": "year" }

# Step 3: Add quarterly pricing
curl -X POST http://localhost:4001/products/prod_local_1/prices \
  -d { "amount": 149.99, "interval": "quarter" }
```

**Result:**
- ✅ One product with 3 pricing options
- ✅ Customers can choose billing frequency
- ✅ All prices tracked in Stripe

### Use Case 3: Mass Product Launch

**Scenario:** Launch complete new product line (5 addons)

```bash
# Single batch request creates all
curl -X POST http://localhost:4001/products/batch/create \
  -d {
    "products": [
      { "name": "DOCX Export", "monthlyPrice": 9.99, ... },
      { "name": "API Access", "monthlyPrice": 49.99, ... },
      { "name": "Advanced Analytics", "monthlyPrice": 19.99, ... },
      { "name": "Priority Support", "monthlyPrice": 29.99, ... },
      { "name": "Custom Integrations", "monthlyPrice": 99.99, ... }
    ]
  }
```

**Result:**
- ✅ 5 products + 5 prices created in Stripe
- ✅ All stored locally in seconds
- ✅ Ready for marketing launch

### Use Case 4: Synchronization (Safety Net)

**Scenario:** Reconcile local products with Stripe

```bash
# One-time sync to ensure everything matches
curl -X POST http://localhost:4001/products/sync \
  -H "Authorization: Bearer admin-token"
```

**Result:**
- ✅ All local products verified in Stripe
- ✅ Missing products created automatically
- ✅ IDs synchronized for future operations

---

## Role-Based Access Control

### Admin Only Operations

Products API requires **admin role**:

```javascript
requireAuth → requireRole("admin")
```

**Who Can:**
- ✅ Create products (`POST /products`)
- ✅ Update products (`PATCH /products/:id`)
- ✅ Delete/archive products (`DELETE /products/:id`)
- ✅ Add pricing tiers (`POST /products/:id/prices`)
- ✅ Batch operations (`POST /products/batch/*`)
- ✅ View all Stripe products (`GET /products/stripe/all`)

**Who Can't:**
- ❌ Secretaries, viewers cannot manage products
- ❌ Non-members cannot see org products

### Membership-Based Authorization

Product management is scoped to organization:

```javascript
// Products endpoint automatically scopes to req.orgId
orgCollection(db, req.orgId, "products")
```

**Result:**
- ✅ Chamber A's products completely isolated from Chamber B
- ✅ Each organization has independent product catalog
- ✅ No cross-org visibility

---

## Metadata & Feature Flags

Products support custom metadata for feature integration:

```json
{
  "name": "Advanced Reports",
  "monthlyPrice": 29.99,
  "metadata": {
    "feature_flag": "advanced_reports_v1",
    "launch_date": "2026-03-15",
    "tier": "council",
    "category": "addon",
    "description": "Enables report generation engine",
    "ui_icon": "chart-line",
    "documentation_url": "https://docs.chamberai.com/advanced-reports"
  }
}
```

**Use Cases:**
- Feature flags for A/B testing
- Launch dates for countdown announcements
- UI customization (icons, colors, descriptions)
- Documentation links
- Custom categorization

---

## Analytics & Monitoring

### Get Product Analytics

```bash
curl -H "Authorization: Bearer admin-token" \
  http://localhost:4001/products/prod_local_1234
```

**Returns:**
```json
{
  "analytics": {
    "product": {
      "id": "prod_abc123",
      "name": "Premium Reports",
      "active": true,
      "created": 1709740800,
      "metadata": { ... }
    },
    "subscriptions": {
      "count": 5,
      "details": [
        {
          "id": "sub_abc123",
          "status": "active",
          "current_period_end": 1742620800
        },
        {
          "id": "sub_xyz789",
          "status": "active",
          "current_period_end": 1745299200
        }
      ]
    }
  }
}
```

### Dashboard View (All Products)

```bash
curl -H "Authorization: Bearer admin-token" \
  http://localhost:4001/products/stripe/all
```

**Returns:**
- Count of all AI-created products
- Subscription metrics per product
- Metadata and status
- Real-time sync status

---

## Error Handling

### Invalid Stripe Key

```json
{
  "error": "error code: resource_missing"
}
```

**Fix:** Ensure `STRIPE_SECRET_KEY` is set and valid

### Missing Required Fields

```json
{
  "error": "name and monthlyPrice required"
}
```

**Fix:** Include all required fields

### Insufficient Permissions

```json
{
  "error": "Insufficient permissions. Required: admin, Got: secretary"
}
```

**Fix:** Use admin-level credentials

### Product Not Found

```json
{
  "error": "Product not found"
}
```

**Fix:** Verify product ID and organization

---

## Integration Examples

### Example 1: Create Product via Feature Deployment

```javascript
// When deploying a new feature, create corresponding product
async function deployFeature(featureName, featureConfig) {
  // Deploy feature code
  await deployCode(featureName);

  // Create monetization product
  const product = await fetch("/products", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${adminToken}`,
      "X-Org-Id": orgId,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: featureName,
      description: featureConfig.description,
      monthlyPrice: featureConfig.price,
      tier: featureConfig.tier,
      metadata: {
        feature_flag: featureConfig.flag,
        launch_date: new Date().toISOString()
      }
    })
  });

  return product;
}
```

### Example 2: Tenant Purchases Product Add-On

```javascript
// Tenant checks available add-ons
const products = await fetch("/products", {
  headers: { "Authorization": `Bearer ${tenantToken}` }
}).then(r => r.json());

// Tenant upgrades to Pro to access premium feature
const checkout = await fetch("/billing/checkout", {
  method: "POST",
  headers: { "Authorization": `Bearer ${tenantToken}` },
  body: JSON.stringify({
    tier: "pro",
    productId: "prod_local_1234"  // Premium Reports
  })
});

// Tenant completes payment in Stripe checkout
// Webhook updates subscription
// Features unlock immediately
```

### Example 3: Batch Launch Product Line

```javascript
async function launchProductLine(products) {
  const response = await fetch("/products/batch/create", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${adminToken}`,
      "X-Org-Id": orgId,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ products })
  });

  const { created, failed, results } = await response.json();
  console.log(`Created ${created} products, ${failed} failed`);
  return results;
}
```

---

## Testing

### Test Product Creation

```bash
# Create test product
curl -X POST http://localhost:4001/products \
  -H "Authorization: Bearer test-admin-token" \
  -H "X-Org-Id: org_test_1" \
  -H "Content-Type: application/json" \
  -d {
    "name": "Test Product",
    "description": "For testing",
    "monthlyPrice": 9.99,
    "tier": "test"
  }
```

### Test Batch Create

```bash
curl -X POST http://localhost:4001/products/batch/create \
  -H "Authorization: Bearer test-admin-token" \
  -H "X-Org-Id: org_test_1" \
  -H "Content-Type: application/json" \
  -d {
    "products": [
      { "name": "Test 1", "monthlyPrice": 9.99 },
      { "name": "Test 2", "monthlyPrice": 19.99 },
      { "name": "Test 3", "monthlyPrice": 29.99 }
    ]
  }
```

### Verify Stripe Sync

```bash
# Check that products made it to Stripe
curl -H "Authorization: Bearer test-admin-token" \
  http://localhost:4001/products/stripe/all | jq '.count'
```

---

## Production Deployment

### Requirements

1. **Stripe Account** - Live or test mode configured
2. **Stripe Secret Key** - Set in `.env`: `STRIPE_SECRET_KEY=sk_live_...`
3. **Admin Users** - Created with `admin` role in memberships
4. **Firebase Firestore** - Production database configured

### Deployment Steps

```bash
# 1. Ensure STRIPE_SECRET_KEY is set
grep STRIPE_SECRET_KEY .env

# 2. Restart API with new code
docker compose restart api

# 3. Verify products endpoint is accessible
curl http://localhost:4001/health

# 4. Test product creation (with test product first)
curl -X POST http://localhost:4001/products \
  -H "Authorization: Bearer admin-token" \
  -d '{"name":"Test","monthlyPrice":9.99}'

# 5. Verify in Stripe Dashboard
# Products → View all products → Filter by "ai_product_manager"
```

### Monitoring

```bash
# Monitor product operations
tail -f docker logs chamberofcommerceai-api-1 | grep "products"

# Check Stripe webhook events
# Dashboard → Developers → Webhooks → Event logs
```

---

## Troubleshooting

### "Insufficient permissions" Error

**Cause:** User doesn't have admin role

**Fix:**
```bash
# Set user as admin in organization membership
curl -X PATCH /organizations/{orgId}/members/{email} \
  -d '{"role":"admin"}'
```

### "Product not found in Stripe" Error

**Cause:** Stripe product ID doesn't exist

**Fix:**
```bash
# Run sync to reconcile
curl -X POST /products/sync \
  -H "Authorization: Bearer admin-token"
```

### "Invalid API Key" Error

**Cause:** `STRIPE_SECRET_KEY` missing or invalid

**Fix:**
```bash
# Verify key in .env
grep STRIPE_SECRET_KEY .env

# If missing, get from Stripe Dashboard
# Developers → API Keys → Copy Secret Key
```

### Batch Create Partial Failure

**Cause:** One or more products failed (others succeeded)

**Response:**
```json
{
  "created": 4,
  "failed": 1,
  "errors": [
    {
      "name": "Failed Product",
      "error": "Rate limit exceeded"
    }
  ]
}
```

**Fix:** Retry failed products individually or adjust batch size

---

## Roadmap

**Future Enhancements:**
- [ ] Seasonal product pricing (discounts, promotions)
- [ ] Product bundles (combined offerings)
- [ ] Usage-based pricing (metered billing)
- [ ] Product recommendations engine
- [ ] Competitor price tracking
- [ ] Multi-currency support
- [ ] Tax calculation integration
- [ ] Subscription templates

---

## Documentation

| File | Purpose |
|------|---------|
| `docs/AI_PRODUCT_MANAGEMENT.md` | This guide |
| `services/api-firebase/src/services/stripe-product-manager.js` | Service implementation |
| `services/api-firebase/src/routes/products.js` | API endpoints |
| `services/api-firebase/src/middleware/requireRole.js` | Role enforcement |

---

**Status:** ✅ Production Ready
**Support:** Integrated with ChamberAI billing system
**Next:** Product recommendations & usage-based pricing
