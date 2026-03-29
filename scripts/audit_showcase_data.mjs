#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const manifestPath = path.join(APP_ROOT, "data/showcase/cities.json");

const API_BASE = process.env.API_BASE ?? "https://api.chamberai.mahoosuc.ai";
const namespace = process.env.SHOWCASE_NAMESPACE ?? "showcase-live";
const minMeetings = Number(process.env.SHOWCASE_MIN_MEETINGS ?? "1");
const minBusinesses = Number(process.env.SHOWCASE_MIN_BUSINESSES ?? "1");
const minReviews = Number(process.env.SHOWCASE_MIN_REVIEWS ?? "1");
const minQuotes = Number(process.env.SHOWCASE_MIN_QUOTES ?? "1");
const minGeoProfiles = Number(process.env.SHOWCASE_MIN_GEO_PROFILES ?? "1");
const minGeoBriefs = Number(process.env.SHOWCASE_MIN_GEO_BRIEFS ?? "1");

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const cities = Array.isArray(manifest.cities) ? manifest.cities : [];
  if (cities.length === 0) {
    throw new Error(`No showcase cities found in ${manifestPath}`);
  }

  const [allMeetings, allBusinesses] = await Promise.all([
    fetchJson("/meetings?limit=200"),
    fetchJson("/business-listings?limit=200")
  ]);

  const meetings = Array.isArray(allMeetings?.data) ? allMeetings.data : Array.isArray(allMeetings) ? allMeetings : [];
  const businesses = Array.isArray(allBusinesses?.data) ? allBusinesses.data : Array.isArray(allBusinesses) ? allBusinesses : [];

  const summary = [];
  const failures = [];

  for (const city of cities) {
    const cityName = String(city.name ?? "").trim();
    const scopeType = String(city.scope_type ?? "city").trim();
    const scopeId = String(city.scope_id ?? cityName.split(",")[0] ?? "").trim();
    const slug = String(city.slug ?? "").trim();
    const cityMeetings = meetings.filter((meeting) => matchesMeeting(meeting, scopeId, cityName));
    const cityBusinesses = businesses.filter((business) => matchesBusiness(business, scopeId, cityName, namespace));

    let reviewCount = 0;
    let quoteCount = 0;
    for (const business of cityBusinesses) {
      const [reviews, quotes] = await Promise.all([
        fetchJson(`/business-listings/${business.id}/reviews`),
        fetchJson(`/business-listings/${business.id}/quotes`)
      ]);
      reviewCount += Array.isArray(reviews) ? reviews.length : 0;
      quoteCount += Array.isArray(quotes) ? quotes.length : 0;
    }

    const [profiles, briefs] = await Promise.all([
      fetchJson(`/geo-profiles?scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(scopeId)}&limit=20`),
      fetchJson(`/geo-content-briefs?scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(scopeId)}&limit=20`)
    ]);

    const cityProfiles = extractItems(profiles);
    const cityBriefs = extractItems(briefs);

    const record = {
      city: cityName,
      slug,
      meetings: cityMeetings.length,
      businesses: cityBusinesses.length,
      reviews: reviewCount,
      quotes: quoteCount,
      geo_profiles: cityProfiles.length,
      geo_briefs: cityBriefs.length
    };
    summary.push(record);

    if (record.meetings < minMeetings) failures.push(`${cityName}: meetings ${record.meetings} < ${minMeetings}`);
    if (record.businesses < minBusinesses) failures.push(`${cityName}: businesses ${record.businesses} < ${minBusinesses}`);
    if (record.reviews < minReviews) failures.push(`${cityName}: reviews ${record.reviews} < ${minReviews}`);
    if (record.quotes < minQuotes) failures.push(`${cityName}: quotes ${record.quotes} < ${minQuotes}`);
    if (record.geo_profiles < minGeoProfiles) failures.push(`${cityName}: geo_profiles ${record.geo_profiles} < ${minGeoProfiles}`);
    if (record.geo_briefs < minGeoBriefs) failures.push(`${cityName}: geo_briefs ${record.geo_briefs} < ${minGeoBriefs}`);
  }

  const unexpectedBusinesses = businesses.filter((business) => {
    const id = String(business.id ?? "");
    return id === "auth_probe" || (id && !id.startsWith(namespace));
  });

  const output = {
    api_base: API_BASE,
    namespace,
    thresholds: {
      minMeetings,
      minBusinesses,
      minReviews,
      minQuotes,
      minGeoProfiles,
      minGeoBriefs
    },
    cities: summary,
    unexpected_businesses: unexpectedBusinesses.map((business) => ({
      id: business.id,
      name: business.name,
      city: business.city
    })),
    ok: failures.length === 0 && unexpectedBusinesses.length === 0,
    failures: [
      ...failures,
      ...unexpectedBusinesses.map((business) => `unexpected business: ${business.id}`)
    ]
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.ok) {
    process.exit(1);
  }
}

function matchesMeeting(meeting, scopeId, cityName) {
  const haystack = [
    meeting.scopeId,
    meeting.scope_id,
    meeting.scopeLabel,
    meeting.scope_label,
    meeting.city,
    meeting.location,
    meeting.title,
    ...(Array.isArray(meeting.tags) ? meeting.tags : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(String(scopeId).toLowerCase()) || haystack.includes(String(cityName).toLowerCase());
}

function matchesBusiness(business, scopeId, cityName, namespace) {
  const id = String(business.id ?? "");
  const city = String(business.city ?? "").toLowerCase();
  const scope = String(business.geo_scope_id ?? "").toLowerCase();
  const normalizedScope = String(scopeId).toLowerCase();
  const normalizedCity = String(cityName.split(",")[0] ?? "").toLowerCase();
  return (
    id.startsWith(namespace) &&
    (city === normalizedCity || scope === normalizedScope)
  );
}

async function fetchJson(pathname) {
  const response = await fetch(`${API_BASE}${pathname}`);
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed: ${response.status}`);
  }
  return response.json();
}

function extractItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
