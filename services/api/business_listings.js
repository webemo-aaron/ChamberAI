import { persistBusinessStore } from "./business_store.js";

export function listBusinessListings(db) {
  return Array.from(db.businessListings.values());
}

export function createBusinessListing(db, input = {}) {
  const existing = db.businessListings.get(String(input.id ?? "").trim()) ?? null;
  const now = db.now().toISOString();
  const syncRunId = String(input.source?.sync_run_id ?? "").trim();
  const iteration = Number(input.source?.iteration ?? 0) || null;

  const record = {
    id: String(input.id ?? "").trim(),
    name: String(input.name ?? "").trim(),
    category: String(input.category ?? "Business Services").trim(),
    businessType: String(input.businessType ?? "vendor").trim(),
    rating: Number(input.rating ?? 4.5),
    reviewCount: Number(input.reviewCount ?? 0),
    description: String(input.description ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    email: String(input.email ?? "").trim(),
    website: String(input.website ?? "").trim(),
    address: String(input.address ?? "").trim(),
    city: String(input.city ?? "").trim(),
    state: String(input.state ?? "ME").trim(),
    zip: String(input.zip ?? "").trim(),
    geo_scope_type: String(input.geo_scope_type ?? "city").trim(),
    geo_scope_id: String(input.geo_scope_id ?? input.city ?? "").trim(),
    ai_search_enabled: Boolean(input.ai_search_enabled),
    tags: Array.isArray(input.tags) ? input.tags : [],
    source: input.source ?? null
  };

  if (!record.id) {
    throw new Error("Business id is required");
  }
  if (!record.name) {
    throw new Error("Business name is required");
  }

  const nextVersion = existing ? computeNextVersion(existing, record) : 1;
  const persistedRecord = {
    ...existing,
    ...record,
    version: nextVersion,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    last_sync_run_id: syncRunId || (existing?.last_sync_run_id ?? null),
    last_iteration: iteration ?? existing?.last_iteration ?? null
  };

  db.businessListings.set(record.id, persistedRecord);
  if (!db.businessReviews.has(record.id)) {
    db.businessReviews.set(record.id, []);
  }
  if (!db.businessQuotes.has(record.id)) {
    db.businessQuotes.set(record.id, []);
  }
  appendBusinessVersion(db, persistedRecord, syncRunId, iteration, existing);
  persistBusinessStore(db);
  return persistedRecord;
}

export function getBusinessListing(db, businessId) {
  return db.businessListings.get(businessId) ?? null;
}

export function updateBusinessListing(db, businessId, patch = {}) {
  const existing = requireBusiness(db, businessId);
  const now = db.now().toISOString();
  const updated = {
    ...existing,
    ...patch,
    version: existing.version ?? 1,
    updated_at: now
  };
  db.businessListings.set(businessId, updated);
  appendBusinessVersion(db, updated, null, null, existing, true);
  persistBusinessStore(db);
  return updated;
}

export function listBusinessReviews(db, businessId) {
  requireBusiness(db, businessId);
  return db.businessReviews.get(businessId) ?? [];
}

export function createBusinessReview(db, businessId, input = {}) {
  requireBusiness(db, businessId);
  const reviews = db.businessReviews.get(businessId) ?? [];
  const existing = reviews.find((entry) => entry.id === input.id);
  const createdAt = String(input.createdAt ?? input.review_date ?? db.now().toISOString());
  const reviewerName = String(input.reviewer_name ?? input.author ?? "").trim();
  const reviewText = String(input.review_text ?? input.text ?? "").trim();
  const review = {
    ...existing,
    id: input.id ?? `review_${businessId}_${reviews.length + 1}`,
    business_id: businessId,
    platform: String(input.platform ?? existing?.platform ?? "Google").trim(),
    rating: Number(input.rating ?? existing?.rating ?? 5),
    reviewer_name: reviewerName,
    author: reviewerName,
    review_text: reviewText,
    text: reviewText,
    review_date: createdAt,
    createdAt,
    response: String(input.response ?? existing?.response ?? "").trim(),
    response_text: String(input.response_text ?? input.response ?? existing?.response_text ?? "").trim(),
    response_draft: String(input.response_draft ?? existing?.response_draft ?? "").trim(),
    response_status: String(input.response_status ?? existing?.response_status ?? "draft").trim()
  };

  if (existing) {
    Object.assign(existing, review);
  } else {
    reviews.push(review);
  }
  db.businessReviews.set(businessId, reviews);
  persistBusinessStore(db);
  return review;
}

export function draftBusinessReviewResponse(db, businessId, reviewId, input = {}) {
  requireBusiness(db, businessId);
  const reviews = db.businessReviews.get(businessId) ?? [];
  const review = reviews.find((entry) => entry.id === reviewId);
  if (!review) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  review.response = String(input.response ?? "").trim();
  review.response_draft = review.response;
  review.response_status = "draft";
  persistBusinessStore(db);
  return review;
}

export function deleteBusinessReview(db, businessId, reviewId) {
  requireBusiness(db, businessId);
  const reviews = db.businessReviews.get(businessId) ?? [];
  const nextReviews = reviews.filter((entry) => entry.id !== reviewId);
  db.businessReviews.set(businessId, nextReviews);
  persistBusinessStore(db);
  return { ok: true, id: reviewId };
}

export function listBusinessQuotes(db, businessId) {
  requireBusiness(db, businessId);
  return db.businessQuotes.get(businessId) ?? [];
}

export function listBusinessVersions(db, businessId) {
  requireBusiness(db, businessId);
  return db.businessVersions.get(businessId) ?? [];
}

export function listBusinessSyncRuns(db) {
  return Array.from(db.businessSyncRuns.values()).sort((left, right) => {
    return String(right.created_at ?? "").localeCompare(String(left.created_at ?? ""));
  });
}

export function createBusinessQuote(db, businessId, input = {}) {
  requireBusiness(db, businessId);
  const quotes = db.businessQuotes.get(businessId) ?? [];
  const existing = quotes.find((entry) => entry.id === input.id);
  const title = String(input.title ?? input.serviceNeeded ?? "").trim();
  const createdAt = String(input.createdAt ?? input.created_at ?? db.now().toISOString());
  const totalUsd = Number(input.total_usd ?? input.total ?? 0);
  const quote = {
    ...existing,
    id: input.id ?? `quote_${businessId}_${quotes.length + 1}`,
    business_id: businessId,
    title,
    serviceNeeded: String(input.serviceNeeded ?? title).trim(),
    description: String(input.description ?? "").trim(),
    service_class: input.service_class ?? "quick_win_automation",
    total_usd: totalUsd,
    total: totalUsd,
    budget: String(input.budget ?? existing?.budget ?? "").trim(),
    timeline: String(input.timeline ?? existing?.timeline ?? "").trim(),
    contact_name: String(input.contact_name ?? "").trim(),
    contact_email: String(input.contact_email ?? "").trim(),
    status: input.status ?? existing?.status ?? "draft",
    createdAt,
    created_at: createdAt,
    respondedAt: String(input.respondedAt ?? existing?.respondedAt ?? "").trim(),
    response: String(input.response ?? existing?.response ?? "").trim()
  };

  if (existing) {
    Object.assign(existing, quote);
  } else {
    quotes.push(quote);
  }
  db.businessQuotes.set(businessId, quotes);
  persistBusinessStore(db);
  return quote;
}

export function updateBusinessQuote(db, businessId, quoteId, patch = {}) {
  requireBusiness(db, businessId);
  const quotes = db.businessQuotes.get(businessId) ?? [];
  const quote = quotes.find((entry) => entry.id === quoteId);
  if (!quote) {
    throw new Error(`Quote not found: ${quoteId}`);
  }

  Object.assign(quote, patch);
  if (patch.total_usd !== undefined || patch.total !== undefined) {
    quote.total_usd = Number(patch.total_usd ?? patch.total ?? quote.total_usd);
    quote.total = quote.total_usd;
  }
  persistBusinessStore(db);
  return quote;
}

function requireBusiness(db, businessId) {
  const business = db.businessListings.get(businessId);
  if (!business) {
    throw new Error(`Business not found: ${businessId}`);
  }
  return business;
}

function appendBusinessVersion(db, record, syncRunId, iteration, previousRecord, allowVersionIncrement = true) {
  const history = db.businessVersions.get(record.id) ?? [];
  const changed = hasMaterialChange(previousRecord, record);
  const snapshotVersion =
    previousRecord && changed && allowVersionIncrement
      ? Number(previousRecord.version ?? 1) + 1
      : Number(previousRecord?.version ?? record.version ?? 1);

  record.version = snapshotVersion;
  if (!previousRecord || changed) {
    history.push({
      version: snapshotVersion,
      captured_at: record.updated_at,
      sync_run_id: syncRunId || (record.last_sync_run_id ?? null),
      iteration: iteration ?? record.last_iteration ?? null,
      record: structuredClone({
        ...record,
        version: snapshotVersion
      })
    });
  }

  db.businessVersions.set(record.id, history);

  if (syncRunId) {
    const existingRun = db.businessSyncRuns.get(syncRunId);
    db.businessSyncRuns.set(syncRunId, {
      id: syncRunId,
      iteration: iteration ?? existingRun?.iteration ?? null,
      city: record.city,
      scope_type: record.geo_scope_type,
      scope_id: record.geo_scope_id,
      business_ids: dedupe([...(existingRun?.business_ids ?? []), record.id]),
      created_at: existingRun?.created_at ?? record.updated_at,
      updated_at: record.updated_at
    });
  }
}

function computeNextVersion(existing, nextRecord) {
  if (!existing) {
    return 1;
  }
  return hasMaterialChange(existing, nextRecord) ? Number(existing.version ?? 1) + 1 : Number(existing.version ?? 1);
}

function hasMaterialChange(existing, nextRecord) {
  if (!existing) {
    return true;
  }

  const comparableExisting = sanitizeComparable(existing);
  const comparableNext = sanitizeComparable(nextRecord);
  return JSON.stringify(comparableExisting) !== JSON.stringify(comparableNext);
}

function sanitizeComparable(record) {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    businessType: record.businessType,
    rating: record.rating,
    reviewCount: record.reviewCount,
    description: record.description,
    phone: record.phone,
    email: record.email,
    website: record.website,
    address: record.address,
    city: record.city,
    state: record.state,
    zip: record.zip,
    geo_scope_type: record.geo_scope_type,
    geo_scope_id: record.geo_scope_id,
    ai_search_enabled: record.ai_search_enabled,
    tags: Array.isArray(record.tags) ? [...record.tags] : [],
    source: record.source ?? null
  };
}

function dedupe(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
