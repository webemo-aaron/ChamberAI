#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const API_BASE = process.env.API_BASE ?? "https://api.chamberai.mahoosuc.ai";
const SHOWCASE_AUTH_TOKEN = process.env.SHOWCASE_AUTH_TOKEN ?? "demo-token";
const SHOWCASE_AUTH_EMAIL = process.env.SHOWCASE_AUTH_EMAIL ?? "admin@mahoosuc.solutions";
const INPUT_FILE = process.env.INPUT_FILE ?? "artifacts/validated-business-payload.json";
const TARGET_NAMESPACE = process.env.SHOWCASE_NAMESPACE ?? "showcase-live";

async function main() {
  const resolved = path.resolve(process.cwd(), INPUT_FILE);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Input file not found: ${resolved}`);
  }

  const payload = JSON.parse(fs.readFileSync(resolved, "utf8"));
  if (!Array.isArray(payload)) {
    throw new Error("Expected an array payload in validated business file.");
  }

  const summary = {
    api_base: API_BASE,
    input_file: resolved,
    target_namespace: TARGET_NAMESPACE,
    total_records: payload.length,
    businesses: 0,
    reviews: 0,
    quotes: 0,
    errors: []
  };

  for (const entry of payload) {
    const business = remapBusiness(entry.business);
    const businessResp = await post("/business-listings", business);
    if (!businessResp.ok) {
      summary.errors.push({
        stage: "business",
        id: business?.id ?? "",
        status: businessResp.status,
        error: businessResp.body?.error ?? businessResp.body
      });
      continue;
    }
    summary.businesses += 1;

    for (const review of Array.isArray(entry.reviews) ? entry.reviews : []) {
      const remapped = remapChildRecord(review, business.id);
      const reviewResp = await post(`/business-listings/${business.id}/reviews`, remapped);
      if (!reviewResp.ok) {
        summary.errors.push({
          stage: "review",
          id: remapped?.id ?? "",
          business_id: business.id,
          status: reviewResp.status,
          error: reviewResp.body?.error ?? reviewResp.body
        });
        continue;
      }
      summary.reviews += 1;
    }

    for (const quote of Array.isArray(entry.quotes) ? entry.quotes : []) {
      const remapped = remapChildRecord(quote, business.id);
      const quoteResp = await post(`/business-listings/${business.id}/quotes`, remapped);
      if (!quoteResp.ok) {
        summary.errors.push({
          stage: "quote",
          id: remapped?.id ?? "",
          business_id: business.id,
          status: quoteResp.status,
          error: quoteResp.body?.error ?? quoteResp.body
        });
        continue;
      }
      summary.quotes += 1;
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exit(1);
  }
}

async function post(route, data) {
  const response = await fetch(`${API_BASE}${route}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SHOWCASE_AUTH_TOKEN}`,
      "x-demo-email": SHOWCASE_AUTH_EMAIL,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  return { ok: response.ok, status: response.status, body };
}

function remapBusiness(input) {
  const business = { ...(input ?? {}) };
  const nextId = remapId(String(business.id ?? ""));
  business.id = nextId;
  business.tags = remapTags(business.tags);
  business.source = {
    ...(business.source ?? {}),
    namespace: TARGET_NAMESPACE
  };
  return business;
}

function remapChildRecord(input, businessId) {
  const record = { ...(input ?? {}) };
  record.business_id = businessId;
  if (record.id) {
    record.id = remapId(String(record.id));
  }
  return record;
}

function remapId(id) {
  if (!id) return `${TARGET_NAMESPACE}-${Date.now()}`;
  if (/^showcase-[^-]+-/i.test(id)) {
    return id.replace(/^showcase-[^-]+-/i, `${TARGET_NAMESPACE}-`);
  }
  if (id.startsWith(`${TARGET_NAMESPACE}-`)) {
    return id;
  }
  return `${TARGET_NAMESPACE}-${id}`;
}

function remapTags(tags) {
  if (!Array.isArray(tags)) return [TARGET_NAMESPACE];
  return tags.map((tag) => (String(tag).startsWith("showcase-") ? TARGET_NAMESPACE : tag));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
