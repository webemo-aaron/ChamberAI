import fs from "node:fs";
import path from "node:path";

export function loadBusinessStore(businessStorePath, fallbackState = {}) {
  if (!businessStorePath || !fs.existsSync(businessStorePath)) {
    return cloneBusinessState(fallbackState);
  }

  const payload = JSON.parse(fs.readFileSync(businessStorePath, "utf8"));
  return normalizeBusinessState(payload, fallbackState);
}

export function persistBusinessStore(db) {
  const businessStorePath = db.businessStorePath;
  if (!businessStorePath) {
    return;
  }

  const payload = {
    listings: Array.from(db.businessListings.values()),
    reviews: Object.fromEntries(db.businessReviews.entries()),
    quotes: Object.fromEntries(db.businessQuotes.entries()),
    versions: Object.fromEntries(db.businessVersions.entries()),
    sync_runs: Array.from(db.businessSyncRuns.values()),
    updated_at: db.now().toISOString()
  };

  fs.mkdirSync(path.dirname(businessStorePath), { recursive: true });
  fs.writeFileSync(businessStorePath, JSON.stringify(payload, null, 2));
}

function normalizeBusinessState(payload = {}, fallbackState = {}) {
  const normalized = cloneBusinessState(fallbackState);
  const listings = Array.isArray(payload.listings) ? payload.listings : [];
  const reviews = isObject(payload.reviews) ? payload.reviews : {};
  const quotes = isObject(payload.quotes) ? payload.quotes : {};
  const versions = isObject(payload.versions) ? payload.versions : {};
  const syncRuns = Array.isArray(payload.sync_runs) ? payload.sync_runs : [];

  for (const listing of listings) {
    if (!listing?.id) {
      continue;
    }
    normalized.listings.set(listing.id, listing);
    normalized.reviews.set(listing.id, Array.isArray(reviews[listing.id]) ? reviews[listing.id] : []);
    normalized.quotes.set(listing.id, Array.isArray(quotes[listing.id]) ? quotes[listing.id] : []);
    normalized.versions.set(listing.id, Array.isArray(versions[listing.id]) ? versions[listing.id] : []);
  }

  for (const syncRun of syncRuns) {
    if (syncRun?.id) {
      normalized.syncRuns.set(syncRun.id, syncRun);
    }
  }

  return normalized;
}

function cloneBusinessState(fallbackState = {}) {
  const listings = fallbackState.listings instanceof Map ? fallbackState.listings : new Map();
  const reviews = fallbackState.reviews instanceof Map ? fallbackState.reviews : new Map();
  const quotes = fallbackState.quotes instanceof Map ? fallbackState.quotes : new Map();
  const versions = fallbackState.versions instanceof Map ? fallbackState.versions : new Map();
  const syncRuns = fallbackState.syncRuns instanceof Map ? fallbackState.syncRuns : new Map();

  return {
    listings: new Map(Array.from(listings.entries(), ([key, value]) => [key, { ...value }])),
    reviews: new Map(Array.from(reviews.entries(), ([key, value]) => [key, Array.isArray(value) ? value.map((entry) => ({ ...entry })) : []])),
    quotes: new Map(Array.from(quotes.entries(), ([key, value]) => [key, Array.isArray(value) ? value.map((entry) => ({ ...entry })) : []])),
    versions: new Map(Array.from(versions.entries(), ([key, value]) => [key, Array.isArray(value) ? value.map((entry) => ({ ...entry })) : []])),
    syncRuns: new Map(Array.from(syncRuns.entries(), ([key, value]) => [key, { ...value }]))
  };
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
