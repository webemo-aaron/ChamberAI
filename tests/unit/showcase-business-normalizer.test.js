import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildShowcaseQuoteSeeds,
  buildShowcaseReviewSeeds,
  normalizeShowcaseBusinessRecord
} from "../../scripts/lib/showcase-business-normalizer.js";

test("normalizer converts raw chamber records into business hub seed shape", () => {
  const normalized = normalizeShowcaseBusinessRecord(
    {
      source_id: "portland-001",
      business_name: "Harbor Bistro",
      category: "Restaurants",
      description: "Waterfront dining and seasonal events.",
      street_address: "123 Wharf St",
      city: "Portland",
      state: "ME",
      zip: "04101",
      phone: "207-555-1111",
      email: "info@harborbistro.example",
      website: "https://harborbistro.example"
    },
    {
      cityName: "Portland, ME",
      scopeType: "city",
      scopeId: "Portland",
      namespace: "showcase-test"
    }
  );

  assert.equal(normalized.name, "Harbor Bistro");
  assert.equal(normalized.category, "Restaurants");
  assert.equal(normalized.city, "Portland");
  assert.equal(normalized.state, "ME");
  assert.equal(normalized.geo_scope_type, "city");
  assert.equal(normalized.geo_scope_id, "Portland");
  assert.equal(normalized.ai_search_enabled, true);
  assert.ok(normalized.id.includes("showcase-test"));
  assert.ok(Array.isArray(normalized.tags));
  assert.ok(normalized.tags.includes("portland"));
});

test("normalizer derives business type and preserves source provenance", () => {
  const normalized = normalizeShowcaseBusinessRecord(
    {
      source_id: "bethel-004",
      business_name: "Mountain Guides",
      category: "Outdoor Recreation",
      description: "",
      street_address: "9 Main St",
      city: "Bethel",
      state: "ME",
      zip: "04217",
      phone: "",
      website: ""
    },
    {
      cityName: "Bethel, ME",
      scopeType: "town",
      scopeId: "Bethel",
      namespace: "showcase-bethel"
    }
  );

  assert.equal(normalized.businessType, "service_provider");
  assert.equal(normalized.source.source_id, "bethel-004");
  assert.equal(normalized.source.city_name, "Bethel, ME");
  assert.equal(normalized.source.namespace, "showcase-bethel");
});

test("normalizer builds deterministic review seeds for imported businesses", () => {
  const business = normalizeShowcaseBusinessRecord(
    {
      source_id: "bethel-001",
      business_name: "Mountain View Lodging Co.",
      category: "Hospitality",
      description: "Boutique lodging and visitor concierge support for four-season guests in Bethel.",
      street_address: "17 Broad Street",
      city: "Bethel",
      state: "ME",
      zip: "04217",
      phone: "207-555-5101",
      email: "stay@mountainviewlodging.example",
      website: "https://mountainviewlodging.example"
    },
    {
      cityName: "Bethel, ME",
      scopeType: "town",
      scopeId: "Bethel",
      namespace: "showcase-live"
    }
  );

  const reviews = buildShowcaseReviewSeeds(
    {
      source_id: "bethel-001",
      business_name: "Mountain View Lodging Co.",
      category: "Hospitality"
    },
    {
      cityName: "Bethel, ME",
      scopeType: "town",
      scopeId: "Bethel",
      namespace: "showcase-live"
    },
    business
  );

  assert.equal(reviews.length, 2);
  assert.equal(reviews[0].business_id, business.id);
  assert.match(reviews[0].id, /^showcase-live-bethel-bethel-001-review-1$/);
  assert.equal(reviews[0].author, reviews[0].reviewer_name);
  assert.equal(reviews[0].text, reviews[0].review_text);
  assert.ok(reviews[0].review_text.includes("Mountain View Lodging Co."));
});

test("normalizer builds deterministic quote seeds for imported businesses", () => {
  const business = normalizeShowcaseBusinessRecord(
    {
      source_id: "york-003",
      business_name: "Cape Neddick Visitor Services",
      category: "Visitor Services",
      description: "Local referral, itinerary, and guest question support for York-area visitor traffic.",
      street_address: "18 Route 1",
      city: "York",
      state: "ME",
      zip: "03909",
      phone: "207-555-8103",
      email: "info@capeneddickvisitor.example",
      website: "https://capeneddickvisitor.example"
    },
    {
      cityName: "York, ME",
      scopeType: "town",
      scopeId: "York",
      namespace: "showcase-live"
    }
  );

  const quotes = buildShowcaseQuoteSeeds(
    {
      source_id: "york-003",
      business_name: "Cape Neddick Visitor Services",
      category: "Visitor Services"
    },
    {
      cityName: "York, ME",
      scopeType: "town",
      scopeId: "York",
      namespace: "showcase-live"
    },
    business
  );

  assert.equal(quotes.length, 1);
  assert.equal(quotes[0].business_id, business.id);
  assert.match(quotes[0].id, /^showcase-live-york-york-003-quote-1$/);
  assert.equal(quotes[0].title, quotes[0].serviceNeeded);
  assert.equal(quotes[0].created_at, quotes[0].createdAt);
  assert.equal(quotes[0].status, "pending");
});
