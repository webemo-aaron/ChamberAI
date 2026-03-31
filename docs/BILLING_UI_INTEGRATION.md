# Billing UI Integration Guide

Guide for integrating the billing UI components into the Operations Workspace.

## Overview

The billing module provides:
- **BillingService** - API calls for billing operations
- **UI Components** - Pre-built components for tier display, upgrades, status
- **Tier Configuration** - Centralized tier definitions and feature gating
- **Styling** - Complete CSS for billing UI

## Files

- `billing.js` - Core module with BillingService and components
- `billing.css` - Complete styling for all billing UI elements

## Quick Start

### 1. Import the Billing Module

```javascript
import {
  BillingService,
  TIERS,
  createTierBadge,
  createBillingStatus,
  createUpgradeModal,
  hasTierFeature
} from "./billing.js";
```

### 2. Initialize BillingService

```javascript
const billingService = new BillingService(
  apiBaseUrl,     // e.g., "http://localhost:4001"
  authToken       // Bearer token from auth
);
```

### 3. Load Billing Status

```javascript
async function loadBillingStatus() {
  try {
    const status = await billingService.getStatus();
    console.log("Current tier:", status.tier);
    console.log("Valid until:", status.validUntil);
    console.log("Status:", status.status);

    // Display billing status widget
    const widget = createBillingStatus(status, onManageClick);
    document.getElementById("billing-status-container").appendChild(widget);
  } catch (error) {
    console.error("Failed to load billing status:", error);
  }
}
```

### 4. Add Upgrade UI

```javascript
function showUpgradeModal() {
  const modal = createUpgradeModal(currentTier, async (selectedTier) => {
    try {
      const { url } = await billingService.createCheckoutSession(selectedTier);
      window.location.href = url; // Redirect to Stripe checkout
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  });
  document.body.appendChild(modal);
}
```

### 5. Manage Portal Access

```javascript
async function openBillingPortal() {
  try {
    const { url } = await billingService.createPortalSession();
    window.open(url, "_blank");
  } catch (error) {
    console.error("Portal failed:", error);
  }
}
```

## Component Usage Examples

### Tier Badge

Display user's current tier:

```javascript
const badge = createTierBadge("council", true); // true = is current
container.appendChild(badge);
```

**CSS class:** `tier-badge tier-council`

### Billing Status Widget

Show current subscription and renewal date:

```javascript
const status = await billingService.getStatus();
const widget = createBillingStatus(status, () => {
  openBillingPortal();
});
container.appendChild(widget);
```

**Features:**
- Shows tier name and renewal date
- "Past Due" warning if payment failed
- "Manage Subscription" button

### Upgrade Modal

Show all available tiers for upgrade:

```javascript
const modal = createUpgradeModal("pro", async (tier) => {
  const { url } = await billingService.createCheckoutSession(tier);
  window.location.href = url;
});
document.body.appendChild(modal);
modal.addEventListener("close", () => modal.remove());
```

**Features:**
- Grid of tier cards
- Shows features for each tier
- Modal overlay for focus
- Close button and overlay dismiss

### Tier Enforcement Notice

Show when user tries to access premium feature:

```javascript
const notice = createTierEnforcementNotice(
  "council",           // required tier
  "DOCX Export",       // feature name
  () => showUpgradeModal()  // upgrade callback
);
featureContainer.appendChild(notice);
```

## Feature Gating

Use `hasTierFeature()` to gate features:

```javascript
if (hasTierFeature(currentTier, "docx_export")) {
  // Show DOCX export button
  showExportDocxButton();
} else {
  // Show enforcement notice
  const notice = createTierEnforcementNotice(
    "council",
    "DOCX Export",
    showUpgradeModal
  );
  container.appendChild(notice);
}
```

**Available features:**
- `docx_export` - DOCX file export (Council+)
- `analytics` - Analytics dashboard (Council+)
- `api` - REST API access (Council+)
- `unlimited_meetings` - Unlimited meetings (Pro+)
- `ai_minutes` - AI-powered minutes (Pro+)

## Tier Configuration

Access tier details:

```javascript
const tierConfig = TIERS["council"];
console.log(tierConfig.name);        // "Council"
console.log(tierConfig.price);       // "$149"
console.log(tierConfig.features);    // [...features]
console.log(tierConfig.canUpgrade);  // true
```

**Tier structure:**
```javascript
{
  name: "Council",
  price: "$149",
  period: "/month",
  features: [...],
  canUpgrade: true,
  upgradeTo: "network"  // next upgrade tier
}
```

## Error Handling

All API methods throw errors on failure:

```javascript
try {
  const { url } = await billingService.createCheckoutSession("council");
} catch (error) {
  console.error("Checkout error:", error.message);
  // Show error message to user
  showError(`Failed to start checkout: ${error.message}`);
}
```

**Common errors:**
- "Invalid tier" - tier not in ['pro', 'council', 'network']
- "Price ID not configured" - Stripe not set up
- "No active Stripe subscription" - user on free tier (for portal)

## CSS Styling

All components use BEM-style CSS classes. Customize by overriding:

```css
/* Change tier colors */
.tier-badge.tier-council {
  background-color: #YOUR_COLOR;
}

/* Change button styling */
.btn-primary {
  background-color: #YOUR_COLOR;
}

/* Change tier card colors */
.tier-card.tier-council {
  border-color: #YOUR_COLOR;
}
```

## Full Integration Example

Complete example showing billing setup in a React/Vanilla JS app:

```javascript
// Initialize
const billingService = new BillingService(
  "http://localhost:4001",
  authToken
);

// Load status on page load
async function initBilling() {
  try {
    const status = await billingService.getStatus();

    // 1. Show tier badge in header
    const badge = createTierBadge(status.tier, true);
    document.getElementById("header-tier").appendChild(badge);

    // 2. Show billing widget in settings
    const widget = createBillingStatus(status, async () => {
      const { url } = await billingService.createPortalSession();
      window.open(url, "_blank");
    });
    document.getElementById("billing-widget").appendChild(widget);

    // 3. Gate features based on tier
    if (!hasTierFeature(status.tier, "docx_export")) {
      const notice = createTierEnforcementNotice(
        "council",
        "DOCX Export",
        () => showUpgradeModal(status.tier)
      );
      document.getElementById("export-docx").appendChild(notice);
    }

  } catch (error) {
    console.error("Billing initialization failed:", error);
  }
}

// Show upgrade modal
function showUpgradeModal(currentTier) {
  const modal = createUpgradeModal(currentTier, async (tier) => {
    try {
      const { url } = await billingService.createCheckoutSession(tier);
      window.location.href = url;
    } catch (error) {
      console.error("Checkout failed:", error);
      showError(`Failed to start checkout: ${error.message}`);
    }
  });
  document.body.appendChild(modal);
}

// On page load
document.addEventListener("DOMContentLoaded", initBilling);
```

## Integration Points

### Navigation/Header
- Show tier badge
- Link to billing settings
- Show payment status

### Settings Page
- Billing status widget
- Current tier display
- Manage subscription button
- Upgrade options

### Feature Pages
- Gate premium features with enforcement notices
- Show upgrade prompt on denied access
- Display tier requirements

### Export/Download
- Show DOCX export only for Council+
- Gate analytics for Council+
- Hide advanced API features for free/pro

## Testing

### Unit Tests (Vitest/Jest)

```javascript
import { hasTierFeature, TIERS } from "./billing.js";

describe("billing", () => {
  test("hasTierFeature checks tier levels", () => {
    expect(hasTierFeature("free", "unlimited_meetings")).toBe(false);
    expect(hasTierFeature("pro", "unlimited_meetings")).toBe(true);
    expect(hasTierFeature("council", "docx_export")).toBe(true);
  });

  test("TIERS has all required fields", () => {
    Object.values(TIERS).forEach((tier) => {
      expect(tier.name).toBeDefined();
      expect(tier.price).toBeDefined();
      expect(tier.features).toBeInstanceOf(Array);
    });
  });
});
```

### Integration Tests

```javascript
describe("BillingService", () => {
  let service;

  beforeEach(() => {
    service = new BillingService("http://localhost:4001", "test-token");
  });

  test("getStatus returns subscription info", async () => {
    const status = await service.getStatus();
    expect(status).toHaveProperty("tier");
    expect(status).toHaveProperty("validUntil");
    expect(status).toHaveProperty("status");
  });

  test("createCheckoutSession returns Stripe URL", async () => {
    const { url } = await service.createCheckoutSession("council");
    expect(url).toMatch(/https:\/\/checkout\.stripe\.com/);
  });
});
```

## Troubleshooting

### Components not displaying

1. Check CSS is imported:
   ```html
   <link rel="stylesheet" href="billing.css">
   ```

2. Check module is imported:
   ```javascript
   import { createTierBadge } from "./billing.js";
   ```

3. Check container element exists:
   ```javascript
   const container = document.getElementById("billing-status");
   if (!container) console.error("Container not found");
   ```

### API errors

1. **401 Unauthorized** - Check auth token is valid
2. **402 Payment Required** - User's tier doesn't allow feature
3. **404 Not Found** - Check API base URL is correct
4. **CORS error** - API not configured for your domain

### Stripe checkout not opening

1. Verify `STRIPE_SECRET_KEY` is set on API
2. Check `STRIPE_PRICE_*` env vars are configured
3. Verify user's org exists in Firestore
4. Check browser console for specific error

## Support

See also:
- `STRIPE_SETUP.md` - Stripe configuration
- `STRIPE_LOCAL_TESTING.md` - Local testing with Stripe CLI
- `docs/BILLING_IMPLEMENTATION.md` - Backend implementation details
