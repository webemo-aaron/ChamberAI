# E2E Multi-Tenancy Testing Guide

Guide for updating E2E tests to work with the new multi-tenant architecture.

## Overview

The multi-tenant implementation changes how data is scoped in Firestore:
- **Before:** Data in top-level collections (`/meetings/`, `/motions/`, etc)
- **After:** Data in org-scoped subcollections (`/organizations/{orgId}/meetings/`, etc)

E2E tests must be updated to reflect this new data structure.

## Key Changes

### 1. Auth Token Configuration

Each test needs an org-specific auth token. Add to test setup:

```javascript
// Before: Single global token
const testToken = "test-token";

// After: Org-specific tokens
const tokens = {
  org1: "test-token-org1",
  org2: "test-token-org2"
};
```

If using `FIREBASE_AUTH_MOCK_TOKENS`, update the format:

```bash
FIREBASE_AUTH_MOCK_TOKENS='
{
  "test-admin-org1": {
    "uid": "user-admin-org1",
    "email": "admin@org1.local",
    "role": "admin",
    "orgId": "org1"
  },
  "test-admin-org2": {
    "uid": "user-admin-org2",
    "email": "admin@org2.local",
    "role": "admin",
    "orgId": "org2"
  }
}
'
```

### 2. Test Data Setup

Update test fixtures to create organizations first:

```javascript
// Setup function
async function setupTestOrg(name, slug) {
  const response = await fetch(`${API_BASE}/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug })
  });
  const { orgId } = await response.json();
  return orgId;
}

// In test setup
beforeEach(async () => {
  testOrgId = await setupTestOrg("Test Org", "test-org");
  testToken = "test-token-for-org";  // Token with orgId claim
});
```

### 3. Firestore Data Verification

When checking Firestore data, use org-scoped paths:

```javascript
// Before: Check top-level collection
const meetingDoc = await db.collection("meetings").doc(meetingId).get();

// After: Check org-scoped collection
const meetingDoc = await db
  .collection("organizations")
  .doc(testOrgId)
  .collection("meetings")
  .doc(meetingId)
  .get();
```

Helper function:

```javascript
async function getOrgData(orgId, collectionName, docId) {
  const db = admin.firestore();
  return db
    .collection("organizations")
    .doc(orgId)
    .collection(collectionName)
    .doc(docId)
    .get();
}

// Usage
const meeting = await getOrgData(testOrgId, "meetings", meetingId);
expect(meeting.exists).toBe(true);
```

## Test Scenarios

### Scenario 1: Org Isolation

Verify that data in one org is not visible in another:

```javascript
describe("Multi-tenancy: Data Isolation", () => {
  let org1, org2, token1, token2;

  beforeEach(async () => {
    // Create two organizations
    const res1 = await setupTestOrg("Org 1", "org1");
    const res2 = await setupTestOrg("Org 2", "org2");
    org1 = res1.orgId;
    org2 = res2.orgId;
    token1 = "token-org1";  // Has orgId: org1
    token2 = "token-org2";  // Has orgId: org2
  });

  test("Meeting in org1 not visible to org2", async () => {
    // Create meeting in org1
    const meetingRes = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        name: "Org1 Meeting",
        date: "2026-03-10",
        body: "Test",
        members: ["member@org1.local"]
      })
    });
    const { id: meetingId } = await meetingRes.json();

    // Try to fetch from org2 - should get empty list
    const listRes = await fetch(`${API_BASE}/meetings`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const { meetings } = await listRes.json();

    expect(meetings).toHaveLength(0);
    expect(meetings.find(m => m.id === meetingId)).toBeUndefined();
  });

  test("Org1 data persists independently", async () => {
    // Create in org1
    const createRes = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        name: "Meeting 1",
        date: "2026-03-10",
        body: "Test",
        members: ["member@test.com"]
      })
    });
    const meeting1 = await createRes.json();

    // Create different data in org2
    const createRes2 = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`
      },
      body: JSON.stringify({
        name: "Meeting 2",
        date: "2026-03-11",
        body: "Different",
        members: ["other@test.com"]
      })
    });
    const meeting2 = await createRes2.json();

    // Verify org1 still has only its meeting
    const listRes1 = await fetch(`${API_BASE}/meetings`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const { meetings: meetings1 } = await listRes1.json();
    expect(meetings1).toHaveLength(1);
    expect(meetings1[0].name).toBe("Meeting 1");
  });
});
```

### Scenario 2: Tier Enforcement Across Orgs

Verify tier gating works per-organization:

```javascript
describe("Multi-tenancy: Tier Enforcement", () => {
  let org1, org2, adminToken, proToken;

  beforeEach(async () => {
    const res1 = await setupTestOrg("Admin Org", "admin-org");
    const res2 = await setupTestOrg("Pro Org", "pro-org");
    org1 = res1.orgId;
    org2 = res2.orgId;
    adminToken = "admin-token";   // Free tier
    proToken = "pro-token";       // Pro tier
  });

  test("Free tier org cannot create meetings", async () => {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: "Test",
        date: "2026-03-10",
        body: "Test",
        members: ["test@local"]
      })
    });
    expect(res.status).toBe(402); // Payment required
  });

  test("Pro tier org can create meetings", async () => {
    // First update org to pro tier (simulated)
    await updateOrgTier(org2, "pro");

    const res = await fetch(`${API_BASE}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${proToken}`
      },
      body: JSON.stringify({
        name: "Pro Meeting",
        date: "2026-03-10",
        body: "Test",
        members: ["test@local"]
      })
    });
    expect(res.status).toBe(201);
  });
});
```

### Scenario 3: Billing Status Per-Org

Verify billing status is organization-specific:

```javascript
describe("Multi-tenancy: Billing Status", () => {
  let org1, org2, token1, token2;

  beforeEach(async () => {
    const res1 = await setupTestOrg("Billing Org 1", "billing1");
    const res2 = await setupTestOrg("Billing Org 2", "billing2");
    org1 = res1.orgId;
    org2 = res2.orgId;
    token1 = "token-org1";
    token2 = "token-org2";
  });

  test("Org1 and Org2 have independent billing status", async () => {
    // Get status for org1 (should be free)
    const status1 = await fetch(`${API_BASE}/billing/status`, {
      headers: { Authorization: `Bearer ${token1}` }
    }).then(r => r.json());
    expect(status1.tier).toBe("free");

    // Simulate org2 upgrade to pro
    await updateOrgTier(org2, "pro");

    // Get status for org2 (should be pro)
    const status2 = await fetch(`${API_BASE}/billing/status`, {
      headers: { Authorization: `Bearer ${token2}` }
    }).then(r => r.json());
    expect(status2.tier).toBe("pro");

    // Verify org1 is still free
    const status1Again = await fetch(`${API_BASE}/billing/status`, {
      headers: { Authorization: `Bearer ${token1}` }
    }).then(r => r.json());
    expect(status1Again.tier).toBe("free");
  });
});
```

### Scenario 4: Webhooks Update Correct Org

Verify webhook events update the correct organization:

```javascript
describe("Multi-tenancy: Webhook Handling", () => {
  let org1, org2;

  beforeEach(async () => {
    const res1 = await setupTestOrg("Webhook Org 1", "webhook1");
    const res2 = await setupTestOrg("Webhook Org 2", "webhook2");
    org1 = res1.orgId;
    org2 = res2.orgId;
  });

  test("Webhook updates only target org subscription", async () => {
    // Get org1's customer ID
    const org1Doc = await getOrgDocument(org1);
    const customer1 = org1Doc.stripeCustomerId;

    // Fire webhook for org1
    const webhookPayload = {
      type: "checkout.session.completed",
      data: {
        object: {
          customer: customer1,
          subscription: "sub_123",
          metadata: { orgId: org1 }
        }
      }
    };

    // Send webhook
    await sendWebhook(webhookPayload);

    // Verify org1 updated
    const org1Settings = await getOrgData(org1, "settings", "system");
    expect(org1Settings.data().subscription.tier).toBe("council");

    // Verify org2 NOT updated (still free)
    const org2Settings = await getOrgData(org2, "settings", "system");
    expect(org2Settings.data().subscription.tier).toBe("free");
  });
});
```

## Test Utilities

Helper functions for multi-tenant tests:

```javascript
/**
 * Get organization document from Firestore
 */
async function getOrgDocument(orgId) {
  const db = admin.firestore();
  const doc = await db.collection("organizations").doc(orgId).get();
  return doc.data();
}

/**
 * Get org-scoped data
 */
async function getOrgData(orgId, collectionName, docId) {
  const db = admin.firestore();
  const doc = await db
    .collection("organizations")
    .doc(orgId)
    .collection(collectionName)
    .doc(docId)
    .get();
  return doc;
}

/**
 * Update org tier (for testing)
 */
async function updateOrgTier(orgId, tier) {
  const db = admin.firestore();
  await db
    .collection("organizations")
    .doc(orgId)
    .collection("settings")
    .doc("system")
    .set(
      { subscription: { tier, updated_at: admin.firestore.FieldValue.serverTimestamp() } },
      { merge: true }
    );
}

/**
 * Create test organization
 */
async function setupTestOrg(name, slug) {
  const response = await fetch(`${API_BASE}/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug })
  });
  if (!response.ok) throw new Error("Org creation failed");
  return response.json();
}

/**
 * Create test data in org
 */
async function createOrgData(orgId, token, collectionName, data) {
  // For POST endpoints
  const response = await fetch(`${API_BASE}/${collectionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`Creation failed: ${response.statusText}`);
  return response.json();
}

/**
 * Simulate webhook delivery
 */
async function sendWebhook(payload) {
  // This depends on your test setup
  // You might call stripe cli or mock the webhook directly
  const response = await fetch(`${API_BASE}/billing/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": mockSignature(payload)
    },
    body: JSON.stringify(payload)
  });
  return response;
}
```

## Pytest/Vitest Template

Complete test template:

```javascript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import admin from "firebase-admin";

const API_BASE = process.env.API_BASE || "http://localhost:4001";
let testOrg1Id, testOrg2Id, token1, token2;

describe("Multi-Tenancy E2E", () => {
  beforeEach(async () => {
    // Create test orgs
    const org1Res = await setupTestOrg("Test Org 1", "test-org-1");
    const org2Res = await setupTestOrg("Test Org 2", "test-org-2");
    testOrg1Id = org1Res.orgId;
    testOrg2Id = org2Res.orgId;

    // Set up tokens with orgId claims
    token1 = "test-token-org1";
    token2 = "test-token-org2";
  });

  afterEach(async () => {
    // Clean up test data
    const db = admin.firestore();
    await db.collection("organizations").doc(testOrg1Id).delete();
    await db.collection("organizations").doc(testOrg2Id).delete();
  });

  it("should isolate data between organizations", async () => {
    // Test isolation
  });

  it("should enforce tier limits per organization", async () => {
    // Test tier enforcement
  });

  it("should update correct org on webhook", async () => {
    // Test webhook isolation
  });
});
```

## Migration Checklist

- [ ] Update test fixtures to create orgs first
- [ ] Add orgId to auth mock tokens
- [ ] Update Firestore data path references
- [ ] Add org isolation tests
- [ ] Add cross-org interference tests
- [ ] Update webhook test mocks
- [ ] Update tier enforcement tests
- [ ] Create test utility helpers
- [ ] Run full test suite
- [ ] Verify all tests pass

## Running Tests

```bash
# Run all E2E tests
npm test -- --testPathPattern=e2e

# Run multi-tenancy specific tests
npm test -- --testPathPattern="e2e.*multi"

# Run with coverage
npm test -- --coverage --testPathPattern=e2e

# Run in watch mode
npm test -- --watch --testPathPattern=e2e
```

## Common Issues

### "orgId not found in request"
- Verify auth token includes orgId claim
- Check FIREBASE_AUTH_MOCK_TOKENS format
- Verify orgId is being extracted in auth middleware

### "Collection not found" (Firestore error)
- Verify using org-scoped paths: `organizations/{orgId}/collection`
- Ensure org document exists
- Check Firestore rules allow the operation

### "Data appears in wrong org"
- Verify token.orgId matches org being tested
- Check endpoint is using req.orgId for queries
- Verify no cached data from previous tests

## Resources

- `IMPLEMENTATION_SUMMARY.md` - Architecture overview
- `docs/STRIPE_SETUP.md` - Stripe test cards and setup
- `docs/STRIPE_LOCAL_TESTING.md` - Local testing guide
- Multi-tenant design pattern: Check backend code in `src/routes/`
