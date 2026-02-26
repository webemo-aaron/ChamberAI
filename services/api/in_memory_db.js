import { MeetingStatus } from "../../packages/shared/status.js";
import { nextId } from "../../packages/shared/ids.js";

export function createInMemoryDb(options = {}) {
  const now = options.now ?? (() => new Date());
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
    }
  };

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
    throw new Error(`Missing required meeting fields: ${missing.join(", ")}`);
  }
}

function validateAudioSourceInput(db, data) {
  if (!data.type) throw new Error("Audio source type required");
  if (!data.file_uri) throw new Error("Audio source file_uri required");
  if (typeof data.duration_seconds !== "number") throw new Error("Audio source duration_seconds required");
  if (!data.file_uri.endsWith(".mp3") && !data.file_uri.endsWith(".wav")) {
    throw new Error("Unsupported audio format");
  }
  if (data.duration_seconds > db.config.maxDurationSeconds) {
    throw new Error("Audio duration exceeds maximum");
  }
}

function requireMeeting(db, meetingId) {
  const meeting = db.meetings.get(meetingId);
  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
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
