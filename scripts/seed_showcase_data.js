#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, "../data/showcase/cities.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:4010";
const SHOWCASE_NAMESPACE = process.env.SHOWCASE_NAMESPACE ?? `showcase-${Date.now()}`;
const SHOWCASE_WAVE = process.env.SHOWCASE_WAVE ?? "first";
const SHOWCASE_CITIES = parseList(process.env.SHOWCASE_CITIES ?? "");
const SHOWCASE_SLUGS = parseList(process.env.SHOWCASE_SLUGS ?? "");
const DRY_RUN = process.env.DRY_RUN === "true";
const SHOWCASE_AUTH_TOKEN = process.env.SHOWCASE_AUTH_TOKEN ?? "demo-token";
const SHOWCASE_AUTH_EMAIL = process.env.SHOWCASE_AUTH_EMAIL ?? "admin@acme.com";

const selectedCities = selectCities();

async function main() {
  if (selectedCities.length === 0) {
    throw new Error("No showcase cities selected.");
  }

  const summary = [];

  for (const city of selectedCities) {
    const cityResult = {
      city: city.name,
      meetings: [],
      geo_profile_id: null,
      geo_brief_id: null
    };

    for (const scenario of city.meeting_scenarios) {
      const meeting = await createMeeting(city, scenario);
      cityResult.meetings.push(meeting.id);

      await updateDraftMinutes(meeting.id, scenario.minutes);
      await updateActionItems(meeting.id, scenario.action_items);
      await updateMotions(meeting.id, scenario.motions);
      await finalizeMeeting(meeting.id);
      await updatePublicSummary(meeting.id, scenario, city);
      await publishPublicSummary(meeting.id);
    }

    const profile = await scanGeoProfile(city);
    const brief = await generateGeoBrief(city);
    cityResult.geo_profile_id = profile.id;
    cityResult.geo_brief_id = brief.id;
    summary.push(cityResult);
  }

  console.log(
    JSON.stringify(
      {
        api_base: API_BASE,
        namespace: SHOWCASE_NAMESPACE,
        cities_seeded: selectedCities.map((city) => city.name),
        summary
      },
      null,
      2
    )
  );
}

function selectCities() {
  if (SHOWCASE_SLUGS.length > 0) {
    const bySlug = new Map(manifest.cities.map((city) => [city.slug.toLowerCase(), city]));
    return SHOWCASE_SLUGS
      .map((slug) => bySlug.get(slug.toLowerCase()))
      .filter(Boolean);
  }

  const requestedNames =
    SHOWCASE_CITIES.length > 0
      ? SHOWCASE_CITIES
      : SHOWCASE_WAVE === "all"
        ? manifest.cities.map((city) => city.name)
        : manifest.first_wave;

  const byName = new Map(manifest.cities.map((city) => [city.name.toLowerCase(), city]));
  return requestedNames
    .map((name) => byName.get(name.toLowerCase()))
    .filter(Boolean);
}

async function createMeeting(city, scenario) {
  return requestJson("/meetings", {
    method: "POST",
    body: {
      date: "2026-04-01",
      start_time: "09:00",
      end_time: null,
      location: `${scenario.location} [${SHOWCASE_NAMESPACE}]`,
      chair_name: scenario.chair_name,
      secretary_name: scenario.secretary_name,
      tags: [...scenario.tags, city.scope_id.toLowerCase(), city.slug, SHOWCASE_NAMESPACE]
    }
  });
}

async function updateDraftMinutes(meetingId, content) {
  return requestJson(`/meetings/${meetingId}/draft-minutes`, {
    method: "PUT",
    body: {
      content: `${content}\n\nNamespace: ${SHOWCASE_NAMESPACE}`
    }
  });
}

async function updateActionItems(meetingId, items) {
  return requestJson(`/meetings/${meetingId}/action-items`, {
    method: "PUT",
    body: { items }
  });
}

async function updateMotions(meetingId, motions) {
  return requestJson(`/meetings/${meetingId}/motions`, {
    method: "PUT",
    body: { motions }
  });
}

async function finalizeMeeting(meetingId) {
  await requestJson(`/meetings/${meetingId}`, {
    method: "PUT",
    body: { end_time: "10:30" }
  });
  return requestJson(`/meetings/${meetingId}/approve`, {
    method: "POST",
    body: {}
  });
}

async function updatePublicSummary(meetingId, scenario, city) {
  return requestJson(`/meetings/${meetingId}/public-summary`, {
    method: "PUT",
    body: {
      content: scenario.public_summary,
      fields: {
        title: `${city.chamber_label} Summary`,
        city: city.name,
        namespace: SHOWCASE_NAMESPACE
      },
      checklist: {
        no_confidential: true,
        names_approved: true,
        motions_reviewed: true,
        actions_reviewed: true,
        chair_approved: true
      }
    }
  });
}

async function publishPublicSummary(meetingId) {
  return requestJson(`/meetings/${meetingId}/public-summary/publish`, {
    method: "POST",
    body: {}
  });
}

async function scanGeoProfile(city) {
  return requestJson("/geo-profiles/scan", {
    method: "POST",
    body: {
      scopeType: city.scope_type,
      scopeId: city.scope_id,
      scopeLabel: city.name,
      existingDetails: city.geo_existing_details
    }
  });
}

async function generateGeoBrief(city) {
  return requestJson("/geo-content-briefs/generate", {
    method: "POST",
    body: {
      scopeType: city.scope_type,
      scopeId: city.scope_id,
      scopeLabel: city.name,
      existingDetails: city.geo_existing_details
    }
  });
}

async function requestJson(route, { method = "GET", body = null } = {}) {
  if (DRY_RUN) {
    return {
      id: `${route.replace(/[^a-z0-9]+/gi, "_")}_${Date.now()}`
    };
  }

  const response = await fetch(`${API_BASE}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${SHOWCASE_AUTH_TOKEN}`,
      "x-demo-email": SHOWCASE_AUTH_EMAIL,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${method} ${route} failed: ${data.error ?? response.status}`);
  }
  return data;
}

function parseList(value) {
  const raw = String(value);
  const delimiter = raw.includes(";") ? ";" : ",";
  return raw
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
