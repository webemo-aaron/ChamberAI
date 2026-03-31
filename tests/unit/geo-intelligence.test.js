import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeScopeType,
  makeGeoDocId,
  buildGeoProfile,
  buildGeoContentBrief,
  findMeetingsForScope
} from "../../services/api-firebase/src/services/geo_intelligence.js";

test("normalizeScopeType accepts zip_code/city/town and rejects others", () => {
  assert.equal(normalizeScopeType("zip_code"), "zip_code");
  assert.equal(normalizeScopeType("CITY"), "city");
  assert.equal(normalizeScopeType(" town "), "town");
  assert.throws(() => normalizeScopeType("county"), /scopeType must be one of/);
});

test("makeGeoDocId creates deterministic firestore-safe key", () => {
  const id = makeGeoDocId("city", "Bethel, ME");
  assert.equal(id, "city__bethel_me");
});

test("findMeetingsForScope matches location and tags", () => {
  const meetings = [
    { location: "Bethel", tags: ["tourism"] },
    { location: "Portland", tags: ["bethel-network"] },
    { location: "Auburn", tags: ["finance"] }
  ];
  const matched = findMeetingsForScope(meetings, "bethel");
  assert.equal(matched.length, 2);
});

test("buildGeoProfile computes scores and inferred tags", () => {
  const profile = buildGeoProfile({
    scopeType: "city",
    scopeId: "Bethel",
    existingDetails: ["Tourism", "Downtown retail"],
    meetings: [
      { location: "Bethel", tags: ["tourism", "member"] },
      { location: "Bethel", tags: ["retention", "budget"] }
    ],
    nowIso: "2026-02-28T00:00:00.000Z"
  });

  assert.equal(profile.scope_type, "city");
  assert.equal(profile.scope_id, "Bethel");
  assert.equal(profile.updated_at, "2026-02-28T00:00:00.000Z");
  assert.ok(profile.business_density_score > 0);
  assert.ok(profile.ai_readiness_score > 0);
  assert.ok(profile.demand_gap_tags.includes("visitor_messaging"));
});

test("buildGeoProfile derives category, density, and narrative signals from chamber context", () => {
  const profile = buildGeoProfile({
    scopeType: "town",
    scopeId: "Bethel",
    existingDetails: [
      "Businesses in Bethel, ME: 3",
      "Top business categories: Hospitality, Outdoor Recreation, Retail",
      "Meeting topics: tourism, member, events",
      "Recent meeting footprint: 4"
    ],
    meetings: [
      { location: "Bethel Chamber Hall", tags: ["tourism", "member"] },
      { location: "Bethel", tags: ["events", "budget"] }
    ],
    nowIso: "2026-02-28T00:00:00.000Z"
  });

  assert.deepEqual(profile.signals.top_categories, ["hospitality", "outdoor recreation", "retail"]);
  assert.equal(profile.signals.meeting_density, "active");
  assert.equal(profile.signals.narrative_theme, "tourism");
  assert.ok(profile.demand_gap_tags.includes("visitor_messaging"));
  assert.deepEqual(profile.provider_supply_tags, ["hospitality", "outdoor recreation", "retail"]);
});

test("buildGeoProfile favors stronger regional growth signals over a single tourism-adjacent category", () => {
  const profile = buildGeoProfile({
    scopeType: "city",
    scopeId: "Bangor",
    scopeLabel: "Bangor, ME",
    existingDetails: [
      "Businesses in Bangor, ME: 3",
      "Top business categories: Marketing, Professional Services, Hospitality",
      "Meeting topics: regional, growth, employers",
      "Recent meeting footprint: 3"
    ],
    meetings: [
      { location: "Bangor Civic Center", tags: ["regional", "growth"] },
      { location: "Bangor", tags: ["employers", "regional"] }
    ],
    nowIso: "2026-02-28T00:00:00.000Z"
  });

  assert.equal(profile.signals.narrative_theme, "growth");
});

test("buildGeoContentBrief returns localized summary and use cases", () => {
  const brief = buildGeoContentBrief({
    profile: {
      id: "geo_1",
      scope_type: "city",
      scope_id: "Bethel",
      scope_label: "Bethel",
      demand_gap_tags: ["lead_follow_up", "appointment_scheduling"]
    },
    nowIso: "2026-02-28T00:00:00.000Z"
  });

  assert.equal(brief.scope_type, "city");
  assert.equal(brief.scope_id, "Bethel");
  assert.equal(brief.generated_at, "2026-02-28T00:00:00.000Z");
  assert.ok(brief.opportunity_summary.includes("Bethel"));
  assert.equal(brief.top_use_cases.length, 2);
});

test("buildGeoContentBrief reflects narrative theme and business mix in summary copy", () => {
  const brief = buildGeoContentBrief({
    profile: {
      id: "geo_2",
      scope_type: "town",
      scope_id: "Bethel",
      scope_label: "Bethel, ME",
      demand_gap_tags: ["visitor_messaging", "crm_nurture", "review_response"],
      signals: {
        top_categories: ["hospitality", "outdoor recreation"],
        meeting_density: "active",
        narrative_theme: "tourism"
      }
    },
    nowIso: "2026-02-28T00:00:00.000Z"
  });

  assert.ok(brief.opportunity_summary.includes("tourism-led"));
  assert.ok(brief.opportunity_summary.includes("hospitality and outdoor recreation"));
  assert.ok(brief.outreach_draft.includes("Bethel, ME"));
  assert.ok(brief.outreach_draft.includes("visitor-ready"));
  assert.deepEqual(brief.top_use_cases, [
    "Visitor Messaging Assistant",
    "CRM Nurture Workflow",
    "Review Response Copilot"
  ]);
});
