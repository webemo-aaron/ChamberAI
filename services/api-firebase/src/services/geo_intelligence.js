import { makeId } from "../utils/ids.js";

const SCOPE_TYPES = new Set(["zip_code", "city", "town"]);

export function normalizeScopeType(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!SCOPE_TYPES.has(normalized)) {
    throw new Error("scopeType must be one of: zip_code, city, town.");
  }
  return normalized;
}

export function normalizeScopeId(value) {
  return String(value ?? "").trim();
}

export function normalizeDetails(details) {
  if (!Array.isArray(details)) return [];
  return details.map((item) => String(item).trim()).filter(Boolean);
}

export function makeGeoDocId(scopeType, scopeId) {
  const safeId = normalizeScopeId(scopeId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${scopeType}__${safeId || "default"}`;
}

export function summarizeTopTags(meetings) {
  const counts = new Map();
  meetings.forEach((meeting) => {
    (meeting.tags ?? []).forEach((tag) => {
      const clean = String(tag).trim().toLowerCase();
      if (!clean) return;
      counts.set(clean, (counts.get(clean) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

export function findMeetingsForScope(meetings, scopeId) {
  const needle = normalizeScopeId(scopeId).toLowerCase();
  if (!needle) return [];
  return meetings.filter((meeting) => {
    const location = String(meeting.location ?? "").toLowerCase();
    const tags = Array.isArray(meeting.tags) ? meeting.tags.map((tag) => String(tag).toLowerCase()) : [];
    if (location.includes(needle)) return true;
    return tags.some((tag) => tag.includes(needle));
  });
}

export function inferDemandGapTags(topTags) {
  const defaults = ["lead_follow_up", "appointment_scheduling", "review_response"];
  if (!topTags || topTags.length === 0) return defaults;
  const inferred = new Set(defaults);
  topTags.forEach((tag) => {
    if (tag.includes("tourism") || tag.includes("events")) inferred.add("visitor_messaging");
    if (tag.includes("finance") || tag.includes("budget")) inferred.add("proposal_automation");
    if (tag.includes("retention") || tag.includes("member")) inferred.add("crm_nurture");
  });
  return Array.from(inferred).slice(0, 5);
}

export function inferProviderSupplyTags(existingDetails, topCategories = []) {
  if (!existingDetails.length && topCategories.length === 0) {
    return ["automation_setup", "operations_enablement"];
  }

  const normalizedCategories = topCategories.map((category) => category.toLowerCase()).filter(Boolean);
  if (normalizedCategories.length > 0) {
    return Array.from(new Set(normalizedCategories)).slice(0, 6);
  }
  const tokens = existingDetails
    .flatMap((line) => line.toLowerCase().split(/[^a-z0-9]+/g))
    .filter(Boolean)
    .filter((token) => !["businesses", "business", "meeting", "meetings", "recent", "footprint", "top", "categories", "topics", "in", "me"].includes(token))
    .filter((token) => !/^\d+$/.test(token));

  return Array.from(new Set([...normalizedCategories, ...tokens])).slice(0, 6);
}

export function extractTopCategories(existingDetails) {
  const line = existingDetails.find((entry) => entry.toLowerCase().startsWith("top business categories:"));
  if (!line) {
    return [];
  }

  const raw = line.split(":").slice(1).join(":");
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 3);
}

export function extractMeetingFootprint(existingDetails) {
  const line = existingDetails.find((entry) => entry.toLowerCase().startsWith("recent meeting footprint:"));
  if (!line) {
    return 0;
  }

  const numeric = Number.parseInt(line.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function inferMeetingDensity(meetingCount, meetingFootprint) {
  const combined = Number(meetingCount || 0) + Number(meetingFootprint || 0);
  if (combined >= 5) return "active";
  if (combined >= 2) return "emerging";
  return "light";
}

export function inferNarrativeTheme(topTags, topCategories, scopeLabel = "") {
  const scores = {
    tourism: 0,
    civic: 0,
    growth: 0,
    operations: 0
  };

  const themeMatchers = {
    tourism: /(tourism|visitor|hospitality|outdoor recreation|events|destination|restaurants|lodging|coastal|ski)/,
    civic: /(government|civic|policy|budget|finance|municipal|council)/,
    growth: /(growth|service|services|professional|regional|marketing|real estate|employers|business services|healthcare)/,
    operations: /(operations|workflow|automation|intake|scheduling|member services)/
  };

  const scoreTokens = (values, weight) => {
    values.forEach((value) => {
      const token = String(value ?? "").toLowerCase();
      Object.entries(themeMatchers).forEach(([theme, matcher]) => {
        if (matcher.test(token)) {
          scores[theme] += weight;
        }
      });
    });
  };

  scoreTokens(topTags, 3);
  scoreTokens(topCategories, 1);
  scoreTokens([scopeLabel], 1);

  const ranked = Object.entries(scores)
    .sort((left, right) => right[1] - left[1] || themePriority(left[0]) - themePriority(right[0]));

  return ranked[0][1] > 0 ? ranked[0][0] : "operations";
}

function themePriority(theme) {
  return {
    civic: 0,
    growth: 1,
    tourism: 2,
    operations: 3
  }[theme] ?? 4;
}

export function inferTopUseCases(profile) {
  const map = {
    lead_follow_up: "Lead Response Automation",
    appointment_scheduling: "Appointment Flow Automation",
    review_response: "Review Response Copilot",
    visitor_messaging: "Visitor Messaging Assistant",
    proposal_automation: "Proposal Drafting Assistant",
    crm_nurture: "CRM Nurture Workflow"
  };
  const named = (profile.demand_gap_tags ?? []).map((tag) => map[tag]).filter(Boolean);
  const fallback = ["Lead Response Automation", "Appointment Flow Automation", "Review Response Copilot"];
  return (named.length > 0 ? named : fallback).slice(0, 3);
}

export function buildGeoProfile(input = {}) {
  const scopeType = normalizeScopeType(input.scopeType);
  const scopeId = normalizeScopeId(input.scopeId);
  if (!scopeId) throw new Error("scopeId is required.");

  const existingDetails = normalizeDetails(input.existingDetails);
  const meetings = Array.isArray(input.meetings) ? input.meetings : [];
  const matchingMeetings = findMeetingsForScope(meetings, scopeId);
  const topTags = summarizeTopTags(matchingMeetings);
  const nowIso = String(input.nowIso ?? new Date().toISOString());
  const topCategories = extractTopCategories(existingDetails);
  const meetingFootprint = extractMeetingFootprint(existingDetails);
  const meetingDensity = inferMeetingDensity(matchingMeetings.length, meetingFootprint);
  const narrativeTheme = inferNarrativeTheme(topTags, topCategories, input.scopeLabel ?? scopeId);

  const businessDensityScore = clampScore(existingDetails.length * 12 + matchingMeetings.length * 8);
  const aiReadinessScore = clampScore(20 + existingDetails.length * 10 + topTags.length * 6);

  return {
    id: input.id ?? makeId("geo"),
    scope_type: scopeType,
    scope_id: scopeId,
    scope_label: String(input.scopeLabel ?? scopeId),
    signals: {
      meeting_count: matchingMeetings.length,
      existing_detail_count: existingDetails.length,
      top_tags: topTags,
      top_categories: topCategories,
      meeting_density: meetingDensity,
      narrative_theme: narrativeTheme
    },
    business_density_score: businessDensityScore,
    ai_readiness_score: aiReadinessScore,
    demand_gap_tags: inferDemandGapTags(topTags),
    provider_supply_tags: inferProviderSupplyTags(existingDetails, topCategories),
    updated_at: nowIso
  };
}

export function buildGeoContentBrief(input = {}) {
  const profile = input.profile;
  if (!profile || !profile.id) {
    throw new Error("profile is required.");
  }
  const nowIso = String(input.nowIso ?? new Date().toISOString());
  const topUseCases = inferTopUseCases(profile);
  const scopeLabel = profile.scope_label || profile.scope_id;
  const narrativeTheme = profile.signals?.narrative_theme || "operations";
  const topCategories = profile.signals?.top_categories || [];
  const narrativeLead =
    narrativeTheme === "tourism"
      ? "tourism-led"
      : narrativeTheme === "civic"
        ? "civic-operations"
        : narrativeTheme === "growth"
          ? "growth-oriented"
          : "operations-led";
  const categoryPhrase =
    topCategories.length > 0
      ? ` across ${topCategories.join(" and ")}`
      : "";

  return {
    id: makeId("geo_brief"),
    geo_profile_id: profile.id,
    scope_type: profile.scope_type,
    scope_id: profile.scope_id,
    top_use_cases: topUseCases,
    opportunity_summary: `${scopeLabel} (${profile.scope_type}) shows ${narrativeLead} opportunity${categoryPhrase} for quick-win AI projects in ${topUseCases
      .slice(0, 2)
      .join(" and ")}.`,
    outreach_draft: `Local business owners in ${scopeLabel} (${profile.scope_type}) can become more visitor-ready and operationally responsive by launching chamber-guided AI workflows now. Reply to join the next implementation sprint.`,
    generated_at: nowIso
  };
}

function clampScore(value) {
  const rounded = Math.round(Number(value) || 0);
  return Math.max(0, Math.min(100, rounded));
}
