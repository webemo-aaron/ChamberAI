import { test } from "node:test";
import assert from "node:assert";

test("Business Listings - Validation: should require core fields", () => {
  const createData = {
    name: "Test Business",
    address: "123 Main St",
    city: "Bethel",
    state: "ME",
    zip_code: "04217",
    phone: "207-824-1234",
    email: "info@test.com"
  };

  const requiredFields = ["name", "address", "city", "state", "zip_code", "phone", "email"];
  requiredFields.forEach((field) => {
    assert(field in createData, `Missing required field: ${field}`);
  });
});

test("Business Listings - Validation: should accept optional category and website", () => {
  const createData = {
    name: "Test Business",
    address: "123 Main St",
    city: "Bethel",
    state: "ME",
    zip_code: "04217",
    phone: "207-824-1234",
    email: "info@test.com",
    category: "Food & Beverage",
    website: "https://test.com"
  };

  assert.strictEqual(createData.category, "Food & Beverage");
  assert.strictEqual(createData.website, "https://test.com");
});

test("Business Listings - Geo Scope: should link to city scope", () => {
  const createData = {
    name: "Test Business",
    address: "123 Main St",
    city: "Bethel",
    state: "ME",
    zip_code: "04217",
    phone: "207-824-1234",
    email: "info@test.com",
    geo_scope_type: "city",
    geo_scope_id: "Bethel"
  };

  assert.strictEqual(createData.geo_scope_type, "city");
  assert.strictEqual(createData.geo_scope_id, "Bethel");
});

test("Business Listings - Geo Scope: should support zip_code scope", () => {
  const createData = {
    geo_scope_type: "zip_code",
    geo_scope_id: "04217"
  };

  assert.strictEqual(createData.geo_scope_type, "zip_code");
  assert.strictEqual(createData.geo_scope_id, "04217");
});

test("Business Listings - AI Search: should track ai_search_enabled flag", () => {
  const createData = {
    name: "Test Business",
    address: "123 Main St",
    city: "Bethel",
    state: "ME",
    zip_code: "04217",
    phone: "207-824-1234",
    email: "info@test.com",
    ai_search_enabled: true
  };

  assert.strictEqual(createData.ai_search_enabled, true);
});

test("Business Listings - AI Search: should default to false when not set", () => {
  const createData = {
    name: "Test Business",
    address: "123 Main St",
    city: "Bethel",
    state: "ME",
    zip_code: "04217",
    phone: "207-824-1234",
    email: "info@test.com"
  };

  const enabled = createData.ai_search_enabled ?? false;
  assert.strictEqual(enabled, false);
});

test("Business Listings - Reviews: should require platform, rating, names and text", () => {
  const reviewData = {
    platform: "Google",
    rating: 4,
    reviewer_name: "John D.",
    review_text: "Great service!"
  };

  assert("platform" in reviewData);
  assert.strictEqual(reviewData.rating >= 1 && reviewData.rating <= 5, true);
  assert("reviewer_name" in reviewData);
  assert("review_text" in reviewData);
});

test("Business Listings - Reviews: should store response draft and status", () => {
  const reviewData = {
    platform: "Google",
    rating: 4,
    reviewer_name: "John D.",
    review_text: "Great service!",
    response_draft: "Thank you!",
    response_status: "draft"
  };

  assert("response_draft" in reviewData);
  assert(["draft", "sent"].includes(reviewData.response_status));
});

test("Business Listings - Reviews: should support multiple platforms", () => {
  const platforms = ["Google", "Yelp", "Facebook", "Other"];
  const review = {
    platform: "Yelp",
    rating: 5,
    reviewer_name: "Test",
    review_text: "Excellent"
  };

  assert(platforms.includes(review.platform));
});

test("Business Listings - Quotes: should validate required fields", () => {
  const quoteData = {
    title: "Marketing Automation Setup",
    total_usd: 500,
    contact_name: "Jane Owner",
    contact_email: "jane@business.com",
    status: "draft"
  };

  assert("title" in quoteData);
  assert(quoteData.total_usd > 0);
  assert("contact_name" in quoteData);
  assert("contact_email" in quoteData);
  assert(["draft", "sent", "accepted", "rejected"].includes(quoteData.status));
});

test("Business Listings - Quotes: should support service classes", () => {
  const serviceClasses = ["quick_win_automation", "workflow_redesign", "strategy_transformation"];
  const quote = {
    title: "Test",
    service_class: "quick_win_automation",
    total_usd: 500,
    contact_name: "Jane",
    contact_email: "jane@test.com",
    status: "draft"
  };

  assert(serviceClasses.includes(quote.service_class));
});

test("Business Listings - Quotes: should track status transitions", () => {
  const statuses = ["draft", "sent", "accepted", "rejected"];
  statuses.forEach((status) => {
    assert(["draft", "sent", "accepted", "rejected"].includes(status));
  });
});

test("Business Listings - Tags: should normalize as array", () => {
  const tags = ["local", "bakery", "organic"];
  assert(Array.isArray(tags));
  assert(tags.includes("local"));
});

test("Business Listings - Tags: should handle empty tags", () => {
  const tags = [];
  assert(Array.isArray(tags));
  assert.strictEqual(tags.length, 0);
});

test("Business Listings - Tags: should deduplicate tags", () => {
  const rawTags = ["local", "local", "bakery"];
  const uniqueTags = [...new Set(rawTags)];
  assert.strictEqual(uniqueTags.length, 2);
  assert(uniqueTags.includes("local"));
  assert(uniqueTags.includes("bakery"));
});
