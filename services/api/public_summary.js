import { getPublicSummary, setPublicSummary } from "./in_memory_db.js";

export function updatePublicSummary(db, meetingId, payload = {}) {
  const existing = getPublicSummary(db, meetingId);
  const summary = {
    meeting_id: meetingId,
    content: payload.content ?? "",
    fields: payload.fields ?? {},
    checklist: payload.checklist ?? {},
    published_at: existing?.published_at ?? null,
    published_by: existing?.published_by ?? null,
    updated_at: db.now().toISOString()
  };
  setPublicSummary(db, meetingId, summary);
  return getPublicSummary(db, meetingId);
}

export function generatePublicSummary(db, meetingId) {
  const meeting = db.meetings.get(meetingId);
  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
  }

  const motions = db.motions.get(meetingId) ?? [];
  const actionItems = db.actionItems.get(meetingId) ?? [];
  const location = meeting.location ?? "the meeting location";
  const chair = meeting.chair_name ?? "the Chair";

  const fields = {
    title: `Public summary for ${meeting.date}`,
    highlights: motions.length > 0 ? `Motions recorded: ${motions.length}.` : "No formal motions recorded.",
    impact: `Meeting held at ${location}.`,
    motions: motions.length > 0 ? "Motions reviewed and documented." : "No motions recorded.",
    actions: actionItems.length > 0 ? `Action items captured: ${actionItems.length}.` : "No action items recorded.",
    attendance: chair ? `Facilitated by ${chair}.` : "",
    call_to_action: "Minutes are available upon request.",
    notes: ""
  };
  const content = [
    fields.title,
    fields.highlights,
    fields.impact,
    fields.motions,
    fields.actions,
    fields.attendance,
    fields.call_to_action,
    fields.notes
  ]
    .map((text) => String(text).trim())
    .filter(Boolean)
    .join("\n\n");

  return updatePublicSummary(db, meetingId, {
    content,
    fields,
    checklist: {
      no_confidential: false,
      names_approved: false,
      motions_reviewed: false,
      actions_reviewed: false,
      chair_approved: false
    }
  });
}

export function publishPublicSummary(db, meetingId, actor = "user") {
  const summary = getPublicSummary(db, meetingId);
  if (!summary) {
    throw new Error("Public summary not found");
  }
  const checklist = summary.checklist ?? {};
  const ready =
    checklist.no_confidential &&
    checklist.names_approved &&
    checklist.motions_reviewed &&
    checklist.actions_reviewed &&
    checklist.chair_approved;
  if (!ready) {
    const error = new Error("Publish blocked by incomplete checklist");
    error.status = 400;
    throw error;
  }
  const updated = {
    ...summary,
    published_at: db.now().toISOString(),
    published_by: actor,
    updated_at: db.now().toISOString()
  };
  setPublicSummary(db, meetingId, updated);
  return getPublicSummary(db, meetingId);
}
