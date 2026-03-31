import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("firebase business listings route supports stable imported ids and merge updates", () => {
  const routeSource = read("services/api-firebase/src/routes/business_listings.js");

  assert.match(routeSource, /if \(!String\(req\.body\.zip_code \?\? req\.body\.zip \?\? ""\)\.trim\(\)\) \{/);
  assert.match(routeSource, /const requestedId = String\(req\.body\.id \?\? ""\)\.trim\(\);/);
  assert.match(routeSource, /const id = requestedId \|\| makeId\("biz"\);/);
  assert.match(routeSource, /await businessRef\.set\(business, \{ merge: true \}\);/);
  assert.match(routeSource, /res\.status\(existingDoc\?\.exists \? 200 : 201\)\.json\(business\);/);
  assert.match(routeSource, /source: req\.body\.source \?\? existingData\.source \?\? null,/);
});

test("firebase review and quote routes support stable imported ids and merge updates", () => {
  const reviewRoute = read("services/api-firebase/src/routes/review_workflow.js");
  const quoteRoute = read("services/api-firebase/src/routes/quotes.js");

  assert.match(reviewRoute, /function normalizeReviewRecord\(record = \{\}\) \{/);
  assert.match(reviewRoute, /author: reviewerName,/);
  assert.match(reviewRoute, /text: reviewText,/);
  assert.match(reviewRoute, /createdAt,/);
  assert.match(reviewRoute, /const reviews = snapshot\.docs\.map\(\(doc\) => normalizeReviewRecord\(doc\.data\(\)\)\)/);
  assert.match(reviewRoute, /const requestedId = String\(req\.body\.id \?\? ""\)\.trim\(\);/);
  assert.match(reviewRoute, /const reviewId = requestedId \|\| makeId\("review"\);/);
  assert.match(reviewRoute, /await reviewRef\.set\(review, \{ merge: true \}\);/);
  assert.match(reviewRoute, /res\.status\(existingDoc\?\.exists \? 200 : 201\)\.json\(review\);/);

  assert.match(quoteRoute, /function normalizeQuoteRecord\(record = \{\}\) \{/);
  assert.match(quoteRoute, /function normalizeTimestampValue\(value\) \{/);
  assert.match(quoteRoute, /if \(typeof value\._seconds === "number"\) \{/);
  assert.match(quoteRoute, /serviceNeeded,/);
  assert.match(quoteRoute, /createdAt,/);
  assert.match(quoteRoute, /const quotes = snapshot\.docs\.map\(\(doc\) => normalizeQuoteRecord\(doc\.data\(\)\)\)/);
  assert.match(quoteRoute, /const requestedId = String\(req\.body\.id \?\? ""\)\.trim\(\);/);
  assert.match(quoteRoute, /const quoteId = requestedId \|\| makeId\("quote"\);/);
  assert.match(quoteRoute, /await quoteRef\.set\(quote, \{ merge: true \}\);/);
  assert.match(quoteRoute, /res\.status\(existingDoc\?\.exists \? 200 : 201\)\.json\(quote\);/);
});
