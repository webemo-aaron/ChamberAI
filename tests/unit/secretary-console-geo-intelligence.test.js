import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGeoIntelligenceModel,
  normalizeGeoCollection
} from "../../apps/secretary-console/views/geo-intelligence/geo-intelligence-model.js";
import {
  buildGeoExistingDetails,
  buildGeoInputContext
} from "../../apps/secretary-console/views/geo-intelligence/geo-intelligence-context.js";

test("geo intelligence model builds a city-scoped operating workspace", () => {
  const selectedCity = {
    id: "bethel-me",
    label: "Bethel, ME",
    scopeId: "Bethel",
    scopeType: "town",
    tag: "bethel"
  };

  const model = buildGeoIntelligenceModel({
    selectedCity,
    profiles: [
      {
        id: "geo_1",
        scope_type: "town",
        scope_id: "Bethel",
        scope_label: "Bethel, ME",
        business_density_score: 61,
        ai_readiness_score: 73,
        demand_gap_tags: ["visitor_messaging", "review_response"],
        provider_supply_tags: ["tourism", "automation_setup"],
        updated_at: "2026-03-28T12:00:00.000Z"
      }
    ],
    briefs: [
      {
        id: "brief_1",
        geo_profile_id: "geo_1",
        scope_type: "town",
        scope_id: "Bethel",
        top_use_cases: ["Visitor Messaging Assistant", "Review Response Copilot"],
        opportunity_summary: "Bethel has strong tourism-driven demand for AI support.",
        outreach_draft: "Invite Bethel businesses into a visitor-readiness sprint.",
        generated_at: "2026-03-28T13:00:00.000Z"
      }
    ],
    inputContext: {
      businessCount: 2,
      meetingCount: 2,
      businessNames: ["Mountain View Lodge", "Trailhead Outfitters"],
      categories: ["Hospitality", "Outdoor Recreation"],
      meetingTopics: ["tourism", "member", "events"],
      existingDetails: [
        "Businesses in Bethel, ME: 2",
        "Top business categories: Hospitality, Outdoor Recreation",
        "Meeting topics: tourism, member, events",
        "Recent meeting footprint: 2"
      ]
    },
    uiState: { pendingAction: "", notice: null }
  });

  assert.equal(model.title, "Geo Intelligence");
  assert.equal(model.scope.label, "Bethel, ME");
  assert.equal(model.spotlight.title, "Bethel, ME");
  assert.equal(model.cards[0].title, "Territory Profile");
  assert.equal(model.cards[0].metrics[1].value, "73");
  assert.equal(model.cards[0].actions[0].action, "refresh-profile");
  assert.equal(model.cards[0].actions[1].action, "generate-brief");
  assert.deepEqual(model.cards[1].list, ["visitor_messaging", "review_response"]);
  assert.equal(model.cards[3].title, "Profile Inputs");
  assert.deepEqual(model.cards[3].metrics.map((metric) => metric.value), ["2", "2"]);
  assert.deepEqual(model.cards[3].list, [
    "Businesses sampled: Mountain View Lodge, Trailhead Outfitters",
    "Top categories: Hospitality, Outdoor Recreation",
    "Meeting topics sampled: tourism, member, events"
  ]);
  assert.deepEqual(
    model.cards[3].actions.map((action) => ({ label: action.label, route: action.route })),
    [
      { label: "Open Bethel Businesses", route: "/business-hub" },
      { label: "Open Bethel Meetings", route: "/meetings" }
    ]
  );
  assert.deepEqual(model.cards[4].list, ["Visitor Messaging Assistant", "Review Response Copilot"]);
});

test("geo intelligence model requires a single showcase city for write actions", () => {
  const model = buildGeoIntelligenceModel({
    selectedCity: {
      id: "all",
      label: "All Showcase Cities",
      scopeId: "",
      scopeType: "",
      tag: ""
    },
    profiles: [],
    briefs: [],
    uiState: { pendingAction: "", notice: null }
  });

  assert.equal(model.scope.isActionable, false);
  assert.equal(model.cards[0].actions.every((action) => action.disabled), true);
  assert.match(model.notice?.message ?? "", /select a showcase city/i);
});

test("normalize geo collection accepts api list payloads and arrays", () => {
  assert.deepEqual(
    normalizeGeoCollection({ items: [{ id: "geo_1" }] }),
    [{ id: "geo_1" }]
  );
  assert.deepEqual(
    normalizeGeoCollection([{ id: "geo_2" }]),
    [{ id: "geo_2" }]
  );
  assert.deepEqual(normalizeGeoCollection({ error: "nope" }), []);
});

test("geo intelligence derives existing details from showcase businesses and meetings", () => {
  const context = buildGeoInputContext({
    selectedCity: {
      id: "bethel-me",
      label: "Bethel, ME",
      scopeId: "Bethel",
      scopeType: "town",
      tag: "bethel"
    },
    businesses: [
      { name: "Mountain View Lodge", category: "Hospitality", city: "Bethel", geo_scope_id: "Bethel" },
      { name: "Trailhead Outfitters", category: "Outdoor Recreation", city: "Bethel", geo_scope_id: "Bethel" }
    ],
    meetings: [
      { id: "m1", location: "Bethel", tags: ["tourism", "member"] },
      { id: "m2", location: "Bethel Chamber", tags: ["events", "bethel"] }
    ]
  });

  assert.deepEqual(context.existingDetails, [
    "Businesses in Bethel, ME: 2",
    "Top business categories: Hospitality, Outdoor Recreation",
    "Meeting topics: tourism, member, events",
    "Recent meeting footprint: 2"
  ]);
  assert.deepEqual(context.businessNames, ["Mountain View Lodge", "Trailhead Outfitters"]);
  assert.deepEqual(context.categories, ["Hospitality", "Outdoor Recreation"]);
  assert.deepEqual(context.meetingTopics, ["tourism", "member", "events"]);
  assert.equal(context.businessCount, 2);
  assert.equal(context.meetingCount, 2);
});

test("geo intelligence existing details helper preserves current payload shape", () => {
  const details = buildGeoExistingDetails({
    selectedCity: {
      id: "bethel-me",
      label: "Bethel, ME",
      scopeId: "Bethel",
      scopeType: "town",
      tag: "bethel"
    },
    businesses: [
      { name: "Mountain View Lodge", category: "Hospitality", city: "Bethel", geo_scope_id: "Bethel" },
      { name: "Trailhead Outfitters", category: "Outdoor Recreation", city: "Bethel", geo_scope_id: "Bethel" }
    ],
    meetings: [
      { id: "m1", location: "Bethel", tags: ["tourism", "member"] },
      { id: "m2", location: "Bethel Chamber", tags: ["events", "bethel"] }
    ]
  });

  assert.deepEqual(details, [
    "Businesses in Bethel, ME: 2",
    "Top business categories: Hospitality, Outdoor Recreation",
    "Meeting topics: tourism, member, events",
    "Recent meeting footprint: 2"
  ]);
});
