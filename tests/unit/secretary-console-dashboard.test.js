import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDashboardModel } from "../../apps/secretary-console/views/dashboard/dashboard-model.js";

test("dashboard model exposes the eight phase 0 sections", () => {
  const model = buildDashboardModel({
    role: "admin",
    tier: "Council",
    displayName: "Alex",
    meetings: [{ id: "m1" }, { id: "m2" }],
    businesses: [{ id: "b1" }],
    activity: [{ id: "a1" }],
    analytics: { completionRate: 92, aiInteractions: 14, actionItemsOpen: 3 }
  });

  assert.equal(model.welcome.title, "Welcome back, Alex");
  assert.equal(model.workspaceLanes.length, 3);
  assert.equal(model.stats.length, 4);
  assert.equal(model.quickActions.length, 5);
  assert.equal(model.featureCards.length, 4);
  assert.ok(model.activityFeed);
  assert.ok(model.calendar);
  assert.ok(model.analyticsSummary);
  assert.ok(model.emptyState);
});

test("dashboard role gating hides premium/admin actions for lower tiers", () => {
  const model = buildDashboardModel({
    role: "guest",
    tier: "Free",
    displayName: "",
    meetings: [],
    businesses: [],
    activity: [],
    analytics: { completionRate: 0, aiInteractions: 0, actionItemsOpen: 0 }
  });

  assert.equal(
    model.featureCards.some((card) => card.id === "kiosk"),
    false
  );
  assert.equal(
    model.quickActions.some((action) => action.route === "/billing"),
    false
  );
  assert.deepEqual(
    model.workspaceLanes.map((lane) => lane.id),
    ["intelligence", "operations"]
  );
  assert.equal(model.emptyState.isVisible, true);
});

test("dashboard model carries showcase city context for live demo switching", () => {
  const model = buildDashboardModel({
    role: "admin",
    tier: "Council",
    displayName: "Alex",
    meetings: [],
    businesses: [],
    activity: [],
    analytics: { completionRate: 0, aiInteractions: 0, actionItemsOpen: 0 },
    showcaseCity: "Bethel, ME",
    showcaseCityId: "bethel-me"
  });

  assert.equal(model.welcome.showcaseCity, "Bethel, ME");
  assert.equal(model.welcome.showcaseCityId, "bethel-me");
  assert.equal(model.cityFocus.kicker, "Bethel Seasonal Economy");
  assert.equal(model.cityFocus.primaryCta.route, "/business-hub");
  assert.equal(model.cityFocus.primaryCta.label, "Open Bethel Businesses");
  assert.equal(model.navigationLinks.feature.label, "Open Bethel Member Hub");
  assert.equal(model.navigationLinks.calendar.route, "/meetings");
});

test("dashboard model exposes route metadata for primary drill-down surfaces", () => {
  const model = buildDashboardModel({
    role: "admin",
    tier: "Council",
    displayName: "Alex",
    meetings: [{ id: "meet-1", date: "Apr 8", location: "York Planning Board" }],
    businesses: [{ id: "biz-1" }],
    activity: [],
    analytics: { completionRate: 92, aiInteractions: 14, actionItemsOpen: 3 }
  });

  assert.deepEqual(
    model.stats.map((stat) => stat.route),
    ["/meetings", "/business-hub", "/business-hub", "/analytics"]
  );
  assert.deepEqual(
    model.workspaceLanes.map((lane) => ({ id: lane.id, route: lane.route, actionLabel: lane.actionLabel })),
    [
      { id: "intelligence", route: "/dashboard", actionLabel: "Open Overview" },
      { id: "operations", route: "/operations", actionLabel: "Open Operations" },
      { id: "admin", route: "/admin/stripe", actionLabel: "Open Admin" }
    ]
  );
  assert.equal(model.calendar[0].route, "/meetings/meet-1");
});

test("dashboard stats adapt helper copy to the selected showcase city", () => {
  const model = buildDashboardModel({
    role: "admin",
    tier: "Council",
    displayName: "Alex",
    meetings: [{ id: "meet-1" }, { id: "meet-2" }],
    businesses: [{ id: "biz-1" }, { id: "biz-2" }, { id: "biz-3" }],
    activity: [],
    analytics: { completionRate: 88, aiInteractions: 9, actionItemsOpen: 4 },
    showcaseCity: "Scarborough, ME",
    showcaseCityId: "scarborough-me"
  });

  assert.deepEqual(
    model.stats.map((stat) => stat.helper),
    [
      "Scarborough operations in motion",
      "Scarborough businesses in spotlight",
      "Scarborough relationship follow-up pending",
      "Scarborough communication assists"
    ]
  );
});
