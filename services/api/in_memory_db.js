import { MeetingStatus } from "../../packages/shared/status.js";
import { nextId } from "../../packages/shared/ids.js";
import { loadBusinessStore, persistBusinessStore } from "./business_store.js";

export function createInMemoryDb(options = {}) {
  const now = options.now ?? (() => new Date());
  const businessStorePath = options.businessStorePath ?? null;
  const config = {
    retentionDays: options.retentionDays ?? 60,
    maxFileSizeMb: options.maxFileSizeMb ?? 500,
    maxDurationSeconds: options.maxDurationSeconds ?? 4 * 60 * 60
  };

  const db = {
    config,
    now,
    meetings: new Map(),
    audioSources: new Map(),
    transcriptSegments: new Map(),
    speakers: new Map(),
    motions: new Map(),
    actionItems: new Map(),
    draftMinutes: new Map(),
    publicSummary: new Map(),
    geoProfiles: new Map(),
    geoContentBriefs: new Map(),
    businessListings: new Map(),
    businessReviews: new Map(),
    businessQuotes: new Map(),
    businessVersions: new Map(),
    businessSyncRuns: new Map(),
    auditLog: [],
    inviteAuthorizedSenders: new Set(["admin@acme.com"]),
    invites: [],
    memberships: new Map(),
    motionConfig: {
      enabled: false,
      workspaceId: "",
      defaultProjectId: "",
      defaultLinkTemplate: "",
      apiKey: ""
    },
    geoMetrics: {
      profile_refreshed: 0,
      content_generated: 0
    },
    requestMetrics: {
      requests_total: 0,
      errors_total: 0
    },
    businessStorePath
  };

  seedBusinessListings(db);
  hydrateBusinessListings(db);
  ensureBusinessVersionHistory(db);
  persistBusinessStore(db);

  return db;
}

export function getConfig(db) {
  return { ...db.config };
}

export function updateConfig(db, patch) {
  db.config = { ...db.config, ...patch };
  return getConfig(db);
}

export function createMeeting(db, data) {
  validateMeetingInput(data);
  const tags = normalizeTags(data.tags);
  const id = nextId("meeting");
  const meeting = {
    id,
    date: data.date,
    start_time: data.start_time,
    end_time: data.end_time ?? null,
    location: data.location,
    chair_name: data.chair_name ?? null,
    secretary_name: data.secretary_name ?? null,
    tags,
    status: MeetingStatus.CREATED,
    no_motions: false,
    no_action_items: false,
    no_adjournment_time: false,
    created_at: db.now().toISOString(),
    updated_at: db.now().toISOString()
  };
  db.meetings.set(id, meeting);
  return meeting;
}

export function listMeetings(db) {
  return Array.from(db.meetings.values());
}

export function getMeeting(db, meetingId) {
  return db.meetings.get(meetingId) ?? null;
}

export function updateMeeting(db, meetingId, patch) {
  const meeting = requireMeeting(db, meetingId);
  const updated = {
    ...meeting,
    ...patch,
    tags: patch.tags ? normalizeTags(patch.tags) : meeting.tags,
    updated_at: db.now().toISOString()
  };
  db.meetings.set(meetingId, updated);
  return updated;
}

export function registerAudioSource(db, meetingId, data) {
  const meeting = requireMeeting(db, meetingId);
  validateAudioSourceInput(db, data);
  const id = nextId("audio");
  const source = {
    id,
    meeting_id: meetingId,
    type: data.type,
    participant_id: data.participant_id ?? null,
    file_uri: data.file_uri,
    duration_seconds: data.duration_seconds,
    created_at: db.now().toISOString()
  };
  db.audioSources.set(id, source);
  db.meetings.set(meetingId, {
    ...meeting,
    status: MeetingStatus.UPLOADED,
    updated_at: db.now().toISOString()
  });
  return source;
}

export function listAudioSources(db, meetingId) {
  return Array.from(db.audioSources.values()).filter((source) => source.meeting_id === meetingId);
}

export function setTranscriptSegments(db, meetingId, segments) {
  db.transcriptSegments.set(meetingId, segments);
}

export function setSpeakers(db, meetingId, speakers) {
  db.speakers.set(meetingId, speakers);
}

export function setMotions(db, meetingId, motions) {
  db.motions.set(meetingId, motions);
}


export function setActionItems(db, meetingId, items) {
  db.actionItems.set(meetingId, items);
}

export function getDraftMinutes(db, meetingId) {
  return db.draftMinutes.get(meetingId) ?? null;
}

export function setDraftMinutes(db, meetingId, draft) {
  db.draftMinutes.set(meetingId, draft);
}

export function getPublicSummary(db, meetingId) {
  return db.publicSummary.get(meetingId) ?? null;
}

export function setPublicSummary(db, meetingId, summary) {
  db.publicSummary.set(meetingId, summary);
}

export function addAuditLog(db, entry) {
  db.auditLog.push({ ...entry, id: nextId("audit"), timestamp: db.now().toISOString() });
}

export function listAuditLog(db, meetingId) {
  return db.auditLog.filter((entry) => entry.meeting_id === meetingId);
}

function validateMeetingInput(data) {
  const missing = [];
  if (!data.date) missing.push("date");
  if (!data.start_time) missing.push("start_time");
  if (!data.location) missing.push("location");
  if (missing.length > 0) {
    const error = new Error(`Missing required meeting fields: ${missing.join(", ")}`);
    error.status = 422;
    throw error;
  }
}

function validateAudioSourceInput(db, data) {
  if (!data.type) {
    const error = new Error("Audio source type required");
    error.status = 422;
    throw error;
  }
  if (!data.file_uri) {
    const error = new Error("Audio source file_uri required");
    error.status = 422;
    throw error;
  }
  if (typeof data.duration_seconds !== "number") {
    const error = new Error("Audio source duration_seconds required");
    error.status = 422;
    throw error;
  }
  if (!data.file_uri.endsWith(".mp3") && !data.file_uri.endsWith(".wav")) {
    const error = new Error("Unsupported audio format");
    error.status = 422;
    throw error;
  }
  if (data.duration_seconds > db.config.maxDurationSeconds) {
    const error = new Error("Audio duration exceeds maximum");
    error.status = 422;
    throw error;
  }
}

function requireMeeting(db, meetingId) {
  const meeting = db.meetings.get(meetingId);
  if (!meeting) {
    const error = new Error(`Meeting not found: ${meetingId}`);
    error.status = 404;
    throw error;
  }
  return meeting;
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function seedBusinessListings(db) {
  const seeded = [
    {
      id: "biz_portland_1",
      name: "Harbor Light Hospitality",
      category: "Hospitality",
      businessType: "service_provider",
      rating: 4.8,
      reviewCount: 12,
      description: "Visitor-facing hospitality group serving downtown Portland operators.",
      phone: "207-555-0101",
      email: "hello@harborlight.example",
      website: "https://harborlight.example",
      address: "100 Commercial St",
      city: "Portland",
      state: "ME",
      zip: "04101",
      geo_scope_type: "city",
      geo_scope_id: "Portland",
      ai_search_enabled: true,
      tags: ["hospitality", "tourism", "portland"]
    },
    {
      id: "biz_bangor_1",
      name: "Bangor Regional Advisors",
      category: "Professional Services",
      businessType: "partner",
      rating: 4.6,
      reviewCount: 8,
      description: "Regional growth and operations advisory firm supporting Bangor businesses.",
      phone: "207-555-0130",
      email: "team@bangorregional.example",
      website: "https://bangorregional.example",
      address: "250 Main St",
      city: "Bangor",
      state: "ME",
      zip: "04401",
      geo_scope_type: "city",
      geo_scope_id: "Bangor",
      ai_search_enabled: true,
      tags: ["bangor", "operations", "growth"]
    },
    {
      id: "biz_augusta_1",
      name: "Capitol Civic Solutions",
      category: "Civic Services",
      businessType: "vendor",
      rating: 4.7,
      reviewCount: 6,
      description: "Process and communications support for civic and chamber operations.",
      phone: "207-555-0142",
      email: "support@capitolcivic.example",
      website: "https://capitolcivic.example",
      address: "12 State St",
      city: "Augusta",
      state: "ME",
      zip: "04330",
      geo_scope_type: "city",
      geo_scope_id: "Augusta",
      ai_search_enabled: true,
      tags: ["augusta", "civic", "government"]
    },
    {
      id: "biz_scarborough_1",
      name: "Pine Point Service Group",
      category: "Business Services",
      businessType: "service_provider",
      rating: 4.5,
      reviewCount: 10,
      description: "Service-business support operator focused on Scarborough growth corridors.",
      phone: "207-555-0160",
      email: "hello@pinepoint.example",
      website: "https://pinepoint.example",
      address: "550 Route 1",
      city: "Scarborough",
      state: "ME",
      zip: "04074",
      geo_scope_type: "town",
      geo_scope_id: "Scarborough",
      ai_search_enabled: true,
      tags: ["scarborough", "services", "retention"]
    }
  ];

  for (const listing of seeded) {
    db.businessListings.set(listing.id, listing);
    db.businessReviews.set(listing.id, [
      {
        id: `review_${listing.id}_1`,
        business_id: listing.id,
        platform: "Google",
        author: "Jordan Smith",
        reviewer_name: "Jordan Smith",
        rating: 5,
        text: `${listing.name} helped our team move faster on member communications.`,
        review_text: `${listing.name} helped our team move faster on member communications.`,
        createdAt: db.now().toISOString(),
        response: ""
      }
    ]);
    db.businessQuotes.set(listing.id, [
      {
        id: `quote_${listing.id}_1`,
        business_id: listing.id,
        title: "Chamber Workflow Sprint",
        service_class: "quick_win_automation",
        total_usd: 1800,
        total: 1800,
        contact_name: "Taylor Brooks",
        contact_email: "taylor@example.com",
        status: "draft",
        created_at: db.now().toISOString()
      }
    ]);
  }
}

function hydrateBusinessListings(db) {
  const store = loadBusinessStore(db.businessStorePath, {
    listings: db.businessListings,
    reviews: db.businessReviews,
      quotes: db.businessQuotes
      ,
      versions: db.businessVersions,
      syncRuns: db.businessSyncRuns
    });

  db.businessListings = store.listings;
  db.businessReviews = store.reviews;
  db.businessQuotes = store.quotes;
  db.businessVersions = store.versions;
  db.businessSyncRuns = store.syncRuns;
}

function ensureBusinessVersionHistory(db) {
  for (const business of db.businessListings.values()) {
    if (!db.businessVersions.has(business.id) || db.businessVersions.get(business.id).length === 0) {
      db.businessVersions.set(business.id, [
        {
          version: Number(business.version ?? 1),
          captured_at: business.updated_at ?? db.now().toISOString(),
          sync_run_id: business.last_sync_run_id ?? null,
          iteration: business.last_iteration ?? null,
          record: { ...business, version: Number(business.version ?? 1) }
        }
      ]);
    }
  }
}
