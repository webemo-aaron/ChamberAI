import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildAnalyticsRouteConfig,
  buildBillingRouteConfig,
  buildUtilityRouteConfig
} from "../../apps/secretary-console/views/common/utility-config.js";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("billing route exposes tier-aware plan and admin actions", () => {
  const config = buildBillingRouteConfig(
    {
      role: "admin",
      tier: "Council",
      liveTier: "Council",
      tierPreview: "",
      email: "admin@acme.com"
    },
    {
      tier: "Council",
      status: "Active",
      validUntil: "2026-12-31T00:00:00.000Z"
    }
  );

  assert.equal(config.title, "Billing");
  assert.equal(config.spotlight.title, "Council plan");
  assert.ok(config.cards.some((card) => card.title === "Tier Sandbox"));
  assert.ok(config.cards.some((card) => card.title === "Current Plan"));
  assert.ok(
    config.cards.some((card) =>
      card.actions?.some((action) => action.action === "portal")
    )
  );
  assert.ok(
    config.cards.some((card) =>
      card.actions?.some((action) => action.action === "checkout" && action.value === "network")
    )
  );
});

test("billing route exposes inline notice and disabled actions while pending", () => {
  const config = buildBillingRouteConfig(
    {
      role: "admin",
      tier: "Council",
      liveTier: "Council",
      tierPreview: "",
      email: "admin@acme.com"
    },
    {
      tier: "Council",
      status: "Active",
      validUntil: null
    },
    {
      pendingAction: "portal",
      notice: {
        tone: "info",
        title: "Opening Billing Portal",
        message: "Preparing your Stripe billing session."
      }
    }
  );

  assert.equal(config.notice?.title, "Opening Billing Portal");
  const actionCard = config.cards.find((card) =>
    card.actions?.some((action) => action.action === "portal")
  );
  assert.ok(actionCard);
  assert.equal(
    actionCard.actions.some((action) => action.action === "portal" && action.disabled),
    true
  );
});

test("billing route exposes tier preview state for demo testing", () => {
  const config = buildBillingRouteConfig(
    {
      role: "admin",
      tier: "Pro",
      liveTier: "Network",
      tierPreview: "Pro",
      email: "admin@acme.com"
    },
    {
      tier: "Network",
      status: "Active",
      validUntil: null
    }
  );

  const sandboxCard = config.cards.find((card) => card.title === "Tier Sandbox");
  assert.ok(sandboxCard);
  assert.deepEqual(
    sandboxCard.metrics.map((metric) => `${metric.label}:${metric.value}`),
    ["Live Tier:Network", "Preview:Pro", "Effective Tier:Pro"]
  );
  assert.ok(
    sandboxCard.actions.some((action) => action.action === "preview-tier" && action.value === "network")
  );
});

test("utility billing fallback still exposes admin actions for static route consumers", () => {
  const config = buildUtilityRouteConfig("/billing", {
    role: "admin",
    tier: "Council",
    email: "admin@acme.com"
  });

  assert.ok(
    config.cards.some((card) =>
      card.actions?.some((action) => action.href === "./stripe-admin.html")
    )
  );
});

test("profile and preferences routes expose account-facing workspace actions", () => {
  const profile = buildUtilityRouteConfig("/profile", {
    role: "secretary",
    tier: "Pro",
    email: "secretary@acme.com"
  });
  const preferences = buildUtilityRouteConfig("/preferences", {
    role: "secretary",
    tier: "Pro",
    email: "secretary@acme.com"
  });

  assert.equal(profile.spotlight.title, "secretary@acme.com");
  assert.deepEqual(
    profile.cards[1].actions.map((action) => action.route),
    ["/dashboard", "/preferences"]
  );
  assert.deepEqual(
    preferences.cards[0].metrics.map((metric) => metric.label),
    ["Landing", "Review Mode", "Notifications"]
  );
});

test("engagement and campaigns routes expose cross-linked growth workflows", () => {
  const engagement = buildUtilityRouteConfig("/engagement", {
    role: "secretary",
    tier: "Council",
    email: "secretary@acme.com"
  });
  const campaigns = buildUtilityRouteConfig("/campaigns", {
    role: "secretary",
    tier: "Council",
    email: "secretary@acme.com"
  });

  assert.equal(engagement.title, "Engagement");
  assert.equal(campaigns.title, "Campaigns");
  assert.ok(
    engagement.cards.some((card) =>
      card.actions?.some((action) => action.route === "/campaigns")
    )
  );
  assert.ok(
    campaigns.cards.some((card) =>
      card.actions?.some((action) => action.route === "/engagement")
    )
  );
});

test("analytics route exposes live metrics, refresh action, and notices", () => {
  const config = buildAnalyticsRouteConfig(
    {
      role: "admin",
      tier: "Council",
      email: "admin@acme.com"
    },
    {
      completionRate: 91,
      aiInteractions: 17,
      actionItemsOpen: 4,
      approvalPace: "2.1d",
      draftCount: "8",
      coverage: "Broad"
    },
    {
      pendingAction: "",
      notice: {
        tone: "success",
        title: "Analytics Live",
        message: "Board metrics are current for this workspace."
      }
    }
  );

  assert.equal(config.notice?.title, "Analytics Live");
  assert.equal(config.cards[0].metrics[0].value, "91%");
  assert.ok(
    config.cards[2].actions.some((action) => action.action === "refresh")
  );
});

test("analytics route shows billing fallback for free tier workspaces", () => {
  const config = buildAnalyticsRouteConfig(
    {
      role: "guest",
      tier: "Free",
      email: "guest@acme.com"
    },
    {
      completionRate: 0,
      aiInteractions: 0,
      actionItemsOpen: 0
    },
    {
      pendingAction: "",
      notice: {
        tone: "info",
        title: "Analytics Available on Council Tier",
        message: "Open Billing to review access."
      }
    }
  );

  assert.equal(config.notice?.title, "Analytics Available on Council Tier");
  assert.ok(
    config.cards[2].actions.some((action) => action.route === "/billing")
  );
  assert.equal(
    config.cards[2].actions.some((action) => action.action === "refresh"),
    false
  );
});

test("billing handler accepts context parameter and wires onCleanup", () => {
  const billingJs = read(
    "apps/secretary-console/views/billing/billing-view.js"
  );

  assert.match(billingJs, /export async function billingHandler\(params, context\)/);
  assert.match(billingJs, /context\?\.onCleanup\?\.\(\(\) => \{/);
});

test("analytics handler accepts context parameter and wires onCleanup", () => {
  const analyticsJs = read(
    "apps/secretary-console/views/analytics/analytics-view.js"
  );

  assert.match(analyticsJs, /export async function analyticsHandler\(params, context\)/);
  assert.match(analyticsJs, /context\?\.onCleanup\?\.\(\(\) => \{/);
});

test("dashboard handler accepts context parameter, extracts render, and wires onCleanup", () => {
  const dashboardJs = read(
    "apps/secretary-console/views/dashboard/dashboard-view.js"
  );

  assert.match(dashboardJs, /export async function dashboardHandler\(params, context\)/);
  assert.match(dashboardJs, /async function render\(\)/);
  assert.match(dashboardJs, /context\?\.onCleanup\?\.\(\(\) => \{/);
});

test("dashboard city change handler no longer recursively calls dashboardHandler", () => {
  const dashboardJs = read(
    "apps/secretary-console/views/dashboard/dashboard-view.js"
  );

  assert.doesNotMatch(dashboardJs, /addEventListener\("change".*\n\s*await dashboardHandler\(\)/s);
  assert.match(dashboardJs, /addEventListener\("change".*render\(\)/s);
});

test("app registers engagement and campaigns utility routes", () => {
  const appJs = read("apps/secretary-console/app.js");

  assert.match(appJs, /registerRoute\("\/engagement"/);
  assert.match(appJs, /registerRoute\("\/campaigns"/);
  assert.match(appJs, /renderNamedUtilityRoute\("\/engagement"\)/);
  assert.match(appJs, /renderNamedUtilityRoute\("\/campaigns"\)/);
});

test("settings-view includes Organization Profile tab (Phase 10)", () => {
  const settingsJs = read(
    "apps/secretary-console/views/settings/settings-view.js"
  );

  // Verify org-profile-tab import
  assert.match(settingsJs, /import.*buildOrgProfilePanel.*org-profile-tab/);

  // Verify tab in list
  assert.match(settingsJs, /org-profile.*Organization/);

  // Verify panel creation
  assert.match(settingsJs, /buildOrgProfilePanel\(\)/);
});

test("org-profile-tab exports form handlers and initialization", () => {
  const orgProfileJs = read(
    "apps/secretary-console/views/settings/org-profile-tab.js"
  );

  // Verify exports
  assert.match(orgProfileJs, /export function buildOrgProfilePanel/);
  assert.match(orgProfileJs, /export function initializeOrgProfile/);
  assert.match(orgProfileJs, /export function serializeOrgProfile/);
  assert.match(orgProfileJs, /export function setupOrgProfileHandlers/);

  // Verify form fields
  assert.match(orgProfileJs, /orgDisplayNameInput/);
  assert.match(orgProfileJs, /orgLogoUrlInput/);
  assert.match(orgProfileJs, /orgKioskPromptInput/);
  assert.match(orgProfileJs, /orgProfileSaveBtn/);
});

test("kiosk.js wires subdomain resolver and public-config endpoint", () => {
  const kioskJs = read(
    "services/api-firebase/src/routes/kiosk.js"
  );

  // Verify import
  assert.match(kioskJs, /import.*resolvePublicOrg.*auth/);

  // Verify endpoint
  assert.match(kioskJs, /router\.get.*\/api\/kiosk\/public-config.*resolvePublicOrg/);

  // Verify it returns branding
  assert.match(kioskJs, /req\.publicOrgId/);
  assert.match(kioskJs, /branding.*orgDoc\.data/);
});

test("auth.js has resolvePublicOrg middleware for subdomain resolution", () => {
  const authJs = read(
    "services/api-firebase/src/middleware/auth.js"
  );

  // Verify function exists
  assert.match(authJs, /export async function resolvePublicOrg/);

  // Verify subdomain parsing
  assert.match(authJs, /host.*split.*\..*\[0\]/);

  // Verify Firestore lookup
  assert.match(authJs, /collection\("subdomains"\)/);

  // Verify sets publicOrgId
  assert.match(authJs, /req\.publicOrgId/);
});

test("settings route includes org-profile endpoints", () => {
  const settingsJs = read(
    "services/api-firebase/src/routes/settings.js"
  );

  // Verify GET org-profile
  assert.match(settingsJs, /router\.get\("\/api\/settings\/org-profile".*requireAuth/);

  // Verify PATCH org-profile
  assert.match(settingsJs, /router\.patch\("\/api\/settings\/org-profile".*requireAuth.*requireRole\("admin"\)/);

  // Verify branding fields
  assert.match(settingsJs, /displayName/);
  assert.match(settingsJs, /logoUrl/);
  assert.match(settingsJs, /kioskSystemPromptOverride/);

  // Verify orgRef usage
  assert.match(settingsJs, /orgRef\(db, orgId\)/);
});

test("app.js loads and applies branding on init (Phase 10)", () => {
  const appJs = read(
    "apps/secretary-console/app.js"
  );

  // Verify branding fetch after auth
  assert.match(appJs, /request.*\/api\/kiosk\/public-config/);

  // Verify logo update
  assert.match(appJs, /topbar-logo[\s\S]*setAttribute/);

  // Verify title update
  assert.match(appJs, /document\.title.*displayName/);
});
