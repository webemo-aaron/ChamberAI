import { initFirestore } from "../db/firestore.js";
import { orgCollection, resolveOrgId } from "../db/orgFirestore.js";

const isDirectExecution =
  import.meta.url === new URL(process.argv[1], "file:").href;

export function buildMeetingDuplicateGroups(meetings, namespace) {
  const groups = new Map();

  for (const meeting of meetings) {
    const tags = Array.isArray(meeting.tags)
      ? meeting.tags.map((tag) => String(tag).trim().toLowerCase())
      : [];
    if (!tags.includes(String(namespace).trim().toLowerCase())) {
      continue;
    }

    const key = String(meeting.location ?? "").trim().toLowerCase();
    if (!key) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(meeting);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

export function buildGeoBriefDuplicateGroups(briefs) {
  const groups = new Map();

  for (const brief of briefs) {
    const key = String(brief.geo_profile_id ?? `${brief.scope_type}:${brief.scope_id}`)
      .trim()
      .toLowerCase();
    if (!key) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(brief);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

function compareRecency(left, right, timestampField) {
  const leftValue = normalizeTimestamp(left[timestampField]);
  const rightValue = normalizeTimestamp(right[timestampField]);
  if (leftValue !== rightValue) {
    return rightValue - leftValue;
  }
  return String(right.id ?? "").localeCompare(String(left.id ?? ""));
}

function normalizeTimestamp(value) {
  if (!value) return 0;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === "object") {
    const seconds = Number(value._seconds ?? value.seconds ?? 0);
    const nanos = Number(value._nanoseconds ?? value.nanoseconds ?? 0);
    return seconds * 1000 + Math.floor(nanos / 1_000_000);
  }
  return 0;
}

async function main() {
  const namespace = String(process.env.SHOWCASE_NAMESPACE ?? "showcase-prod-v1").trim();
  const orgId = resolveOrgId(process.env.SHOWCASE_ORG_ID);
  const db = initFirestore();

  const meetingsCollection = orgCollection(db, orgId, "meetings");
  const briefsCollection = orgCollection(db, orgId, "geoContentBriefs");

  const [meetingsSnap, briefsSnap] = await Promise.all([
    meetingsCollection.get(),
    briefsCollection.get()
  ]);

  const meetings = meetingsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter(Boolean);
  const briefs = briefsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })).filter(Boolean);

  const meetingGroups = buildMeetingDuplicateGroups(meetings, namespace);
  const briefGroups = buildGeoBriefDuplicateGroups(briefs);

  const batch = db.batch();
  const deletedMeetings = [];
  const deletedBriefs = [];

  for (const group of meetingGroups) {
    const sorted = [...group].sort((left, right) => compareRecency(left, right, "updated_at"));
    const [, ...duplicates] = sorted;
    for (const duplicate of duplicates) {
      batch.delete(meetingsCollection.doc(duplicate.id));
      deletedMeetings.push({
        id: duplicate.id,
        location: duplicate.location
      });
    }
  }

  for (const group of briefGroups) {
    const sorted = [...group].sort((left, right) => compareRecency(left, right, "generated_at"));
    const [, ...duplicates] = sorted;
    for (const duplicate of duplicates) {
      batch.delete(briefsCollection.doc(duplicate.id));
      deletedBriefs.push({
        id: duplicate.id,
        scope_type: duplicate.scope_type,
        scope_id: duplicate.scope_id
      });
    }
  }

  if (deletedMeetings.length > 0 || deletedBriefs.length > 0) {
    await batch.commit();
  }

  console.log(
    JSON.stringify(
      {
        org_id: orgId,
        namespace,
        deleted_meetings: deletedMeetings.length,
        deleted_geo_briefs: deletedBriefs.length,
        meeting_locations: deletedMeetings.map((item) => item.location),
        geo_brief_scopes: deletedBriefs.map((item) => `${item.scope_type}:${item.scope_id}`)
      },
      null,
      2
    )
  );
}

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
