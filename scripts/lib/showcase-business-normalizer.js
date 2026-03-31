export function normalizeShowcaseBusinessRecord(record = {}, options = {}) {
  const cityName = String(options.cityName ?? "").trim();
  const scopeType = String(options.scopeType ?? "city").trim();
  const scopeId = String(options.scopeId ?? "").trim();
  const namespace = String(options.namespace ?? "showcase").trim();
  const businessName = String(record.business_name ?? record.name ?? "").trim();
  const city = String(record.city ?? extractCity(cityName)).trim();
  const state = String(record.state ?? extractState(cityName) ?? "ME").trim();
  const category = String(record.category ?? "Business Services").trim();
  const description = String(record.description ?? "").trim();

  return {
    id: `${namespace}-${slugify(scopeId || city || businessName)}-${slugify(record.source_id || businessName)}`,
    name: businessName,
    category,
    businessType: inferBusinessType(category, description),
    rating: Number(record.rating ?? 4.5),
    reviewCount: Number(record.review_count ?? record.reviewCount ?? 0),
    description,
    phone: String(record.phone ?? "").trim(),
    email: String(record.email ?? "").trim(),
    website: String(record.website ?? "").trim(),
    address: String(record.street_address ?? record.address ?? "").trim(),
    city,
    state,
    zip: String(record.zip ?? record.zip_code ?? "").trim(),
    geo_scope_type: scopeType,
    geo_scope_id: scopeId || city,
    ai_search_enabled: true,
    tags: buildTags({ city, scopeId, category, namespace }),
    source: {
      source_id: String(record.source_id ?? "").trim(),
      city_name: cityName,
      namespace,
      source_url: String(record.source_url ?? "").trim()
    }
  };
}

export function buildShowcaseReviewSeeds(record = {}, options = {}, business = {}) {
  const provided = Array.isArray(record.reviews) ? record.reviews : null;
  const sourceId = String(record.source_id ?? business.id ?? "").trim();

  const seeds = provided ?? [
    {
      seed_index: 1,
      platform: "Google",
      rating: 5,
      reviewer_name: defaultReviewerName(0),
      review_text: `${business.name} made it easier for our ${extractCity(options.cityName)} plans to move quickly and kept communication clear from start to finish.`
    },
    {
      seed_index: 2,
      platform: "Facebook",
      rating: 4,
      reviewer_name: defaultReviewerName(1),
      review_text: `${business.name} is a dependable ${String(record.category ?? business.category ?? "business service").toLowerCase()} partner for chamber-focused coordination and follow-through.`
    }
  ];

  return seeds.map((seed, index) => {
    const reviewIndex = index + 1;
    const id = seed.id
      ? String(seed.id).trim()
      : `${options.namespace}-${slugify(options.scopeId || business.city || business.name)}-${slugify(sourceId)}-review-${reviewIndex}`;
    const reviewerName = String(seed.reviewer_name ?? seed.author ?? defaultReviewerName(index)).trim();
    const reviewText = String(seed.review_text ?? seed.text ?? "").trim();
    const createdAt = String(seed.createdAt ?? seed.review_date ?? seededIsoDate(reviewIndex)).trim();

    return {
      id,
      business_id: business.id,
      platform: String(seed.platform ?? "Google").trim(),
      rating: Number(seed.rating ?? 5),
      reviewer_name: reviewerName,
      author: reviewerName,
      review_text: reviewText,
      text: reviewText,
      review_date: createdAt,
      createdAt,
      response: String(seed.response ?? "").trim(),
      response_text: String(seed.response ?? "").trim(),
      response_draft: String(seed.response_draft ?? "").trim(),
      response_status: String(seed.response_status ?? "draft").trim()
    };
  });
}

export function buildShowcaseQuoteSeeds(record = {}, options = {}, business = {}) {
  const provided = Array.isArray(record.quotes) ? record.quotes : null;
  const sourceId = String(record.source_id ?? business.id ?? "").trim();
  const category = String(record.category ?? business.category ?? "Business Services").trim();

  const seeds = provided ?? [
    {
      seed_index: 1,
      title: defaultQuoteTitle(category),
      description: `Requested by the ${extractCity(options.cityName)} showcase workflow to demonstrate vendor coordination for ${business.name}.`,
      budget: defaultBudget(category),
      timeline: defaultTimeline(category),
      contact_name: defaultReviewerName(2),
      contact_email: business.email || "showcase@mahoosuc.ai",
      total_usd: defaultTotal(category)
    }
  ];

  return seeds.map((seed, index) => {
    const quoteIndex = index + 1;
    const id = seed.id
      ? String(seed.id).trim()
      : `${options.namespace}-${slugify(options.scopeId || business.city || business.name)}-${slugify(sourceId)}-quote-${quoteIndex}`;
    const title = String(seed.title ?? seed.serviceNeeded ?? defaultQuoteTitle(category)).trim();
    const createdAt = String(seed.createdAt ?? seed.created_at ?? seededIsoDate(quoteIndex)).trim();
    const totalUsd = Number(seed.total_usd ?? seed.total ?? defaultTotal(category));

    return {
      id,
      business_id: business.id,
      title,
      serviceNeeded: title,
      description: String(seed.description ?? "").trim(),
      service_class: String(seed.service_class ?? "quick_win_automation").trim(),
      services: Array.isArray(seed.services) ? seed.services : [],
      total_usd: totalUsd,
      total: totalUsd,
      budget: String(seed.budget ?? defaultBudget(category)).trim(),
      timeline: String(seed.timeline ?? defaultTimeline(category)).trim(),
      contact_name: String(seed.contact_name ?? defaultReviewerName(2)).trim(),
      contact_email: String(seed.contact_email ?? business.email ?? "showcase@mahoosuc.ai").trim(),
      status: String(seed.status ?? "pending").trim(),
      createdAt,
      created_at: createdAt,
      respondedAt: String(seed.respondedAt ?? seed.responded_at ?? "").trim(),
      sent_at: String(seed.sent_at ?? "").trim(),
      response: String(seed.response ?? "").trim()
    };
  });
}

function inferBusinessType(category, description) {
  const text = `${category} ${description}`.toLowerCase();
  if (text.includes("chamber") || text.includes("alliance") || text.includes("association")) {
    return "partner";
  }
  if (
    text.includes("advisor") ||
    text.includes("services") ||
    text.includes("consult") ||
    text.includes("guide") ||
    text.includes("professional") ||
    text.includes("outdoor") ||
    text.includes("recreation")
  ) {
    return "service_provider";
  }
  return "vendor";
}

function buildTags({ city, scopeId, category, namespace }) {
  return [city, scopeId, category, namespace]
    .map((value) => slugify(value))
    .filter(Boolean);
}

function extractCity(cityName) {
  return cityName.split(",")[0]?.trim() ?? "";
}

function extractState(cityName) {
  return cityName.split(",")[1]?.trim() ?? "";
}

function defaultReviewerName(index) {
  return ["Jordan Smith", "Taylor Brooks", "Avery Lane", "Casey Morgan"][index] ?? "Chamber Member";
}

function defaultQuoteTitle(category) {
  const lower = String(category).toLowerCase();
  if (lower.includes("hospitality") || lower.includes("visitor")) {
    return "Visitor Intake Workflow";
  }
  if (lower.includes("health")) {
    return "Patient Inquiry Follow-Up";
  }
  if (lower.includes("retail")) {
    return "Customer Promotion Sprint";
  }
  return "Chamber Workflow Sprint";
}

function defaultBudget(category) {
  const lower = String(category).toLowerCase();
  if (lower.includes("professional") || lower.includes("real estate")) {
    return "$2,500-$4,000";
  }
  if (lower.includes("hospitality") || lower.includes("visitor")) {
    return "$1,500-$3,000";
  }
  return "$1,200-$2,400";
}

function defaultTimeline(category) {
  const lower = String(category).toLowerCase();
  if (lower.includes("health") || lower.includes("professional")) {
    return "Within 30 days";
  }
  return "Within 2 weeks";
}

function defaultTotal(category) {
  const lower = String(category).toLowerCase();
  if (lower.includes("professional") || lower.includes("real estate")) {
    return 3200;
  }
  if (lower.includes("hospitality") || lower.includes("visitor")) {
    return 2200;
  }
  return 1800;
}

function seededIsoDate(index) {
  return `2026-03-${String(10 + index).padStart(2, "0")}T15:00:00.000Z`;
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
