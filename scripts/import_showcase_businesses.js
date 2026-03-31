#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildShowcaseQuoteSeeds,
  buildShowcaseReviewSeeds,
  normalizeShowcaseBusinessRecord
} from "./lib/showcase-business-normalizer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawRoot = path.resolve(__dirname, "../data/showcase/raw");

const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:4010";
const SHOWCASE_NAMESPACE = process.env.SHOWCASE_NAMESPACE ?? "showcase";
const DRY_RUN = process.env.DRY_RUN === "true";
const SHOWCASE_AUTH_TOKEN = process.env.SHOWCASE_AUTH_TOKEN ?? "demo-token";
const SHOWCASE_AUTH_EMAIL = process.env.SHOWCASE_AUTH_EMAIL ?? "admin@acme.com";
const inputArgs = process.argv.slice(2);
const syncRunId = process.env.SHOWCASE_SYNC_RUN_ID ?? `sync_${SHOWCASE_NAMESPACE}_${Date.now()}`;
const iteration = Number(process.env.SHOWCASE_ITERATION ?? "1");

async function main() {
  const files = resolveInputFiles(inputArgs);
  if (files.length === 0) {
    throw new Error(`No raw capture files found under ${rawRoot}`);
  }

  const summary = [];

  for (const filePath of files) {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const records = Array.isArray(payload.businesses)
      ? payload.businesses
      : Array.isArray(payload.records)
        ? payload.records
        : [];
    const cityName = String(payload.city_name ?? payload.cityName ?? payload.city ?? "").trim();
    const scopeType = String(payload.scope_type ?? payload.scopeType ?? "city").trim();
    const scopeId = String(payload.scope_id ?? payload.scopeId ?? cityName.split(",")[0] ?? "").trim();
    const namespace = String(payload.namespace ?? SHOWCASE_NAMESPACE).trim();

    let imported = 0;
    let reviewsImported = 0;
    let quotesImported = 0;
    for (const record of records) {
      const normalized = normalizeShowcaseBusinessRecord(record, {
        cityName,
        scopeType,
        scopeId,
        namespace
      });
      normalized.source = {
        ...(normalized.source ?? {}),
        sync_run_id: syncRunId,
        iteration
      };
      const business = await upsertBusinessListing(normalized);
      const reviews = buildShowcaseReviewSeeds(record, {
        cityName,
        scopeType,
        scopeId,
        namespace
      }, business);
      const quotes = buildShowcaseQuoteSeeds(record, {
        cityName,
        scopeType,
        scopeId,
        namespace
      }, business);

      for (const review of reviews) {
        await upsertBusinessReview(business.id, review);
        reviewsImported += 1;
      }

      for (const quote of quotes) {
        await upsertBusinessQuote(business.id, quote);
        quotesImported += 1;
      }

      imported += 1;
    }

    summary.push({
      file: path.relative(process.cwd(), filePath),
      city_name: cityName,
      scope_type: scopeType,
      scope_id: scopeId,
      imported,
      reviews_imported: reviewsImported,
      quotes_imported: quotesImported
    });
  }

  console.log(
    JSON.stringify(
      {
        api_base: API_BASE,
        namespace: SHOWCASE_NAMESPACE,
        sync_run_id: syncRunId,
        iteration,
        files: summary
      },
      null,
      2
    )
  );
}

async function upsertBusinessListing(record) {
  if (DRY_RUN) {
    return { ok: true, id: record.id };
  }

  const response = await fetch(`${API_BASE}/business-listings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SHOWCASE_AUTH_TOKEN}`,
      "x-demo-email": SHOWCASE_AUTH_EMAIL,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(record)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`POST /business-listings failed: ${data.error ?? response.status}`);
  }
  return data;
}

async function upsertBusinessReview(businessId, record) {
  if (DRY_RUN) {
    return { ok: true, id: record.id };
  }

  const response = await fetch(`${API_BASE}/business-listings/${businessId}/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SHOWCASE_AUTH_TOKEN}`,
      "x-demo-email": SHOWCASE_AUTH_EMAIL,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(record)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`POST /business-listings/${businessId}/reviews failed: ${data.error ?? response.status}`);
  }
  return data;
}

async function upsertBusinessQuote(businessId, record) {
  if (DRY_RUN) {
    return { ok: true, id: record.id };
  }

  const response = await fetch(`${API_BASE}/business-listings/${businessId}/quotes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SHOWCASE_AUTH_TOKEN}`,
      "x-demo-email": SHOWCASE_AUTH_EMAIL,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(record)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`POST /business-listings/${businessId}/quotes failed: ${data.error ?? response.status}`);
  }
  return data;
}

function resolveInputFiles(args) {
  if (args.length === 0) {
    return listRawFiles(rawRoot);
  }

  return args.flatMap((entry) => {
    const resolved = path.resolve(process.cwd(), entry);
    if (!fs.existsSync(resolved)) {
      return [];
    }
    if (fs.statSync(resolved).isDirectory()) {
      return listRawFiles(resolved);
    }
    return [resolved];
  });
}

function listRawFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listRawFiles(target));
      continue;
    }
    if (entry.isFile() && entry.name === "businesses.json") {
      files.push(target);
    }
  }

  return files.sort();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
