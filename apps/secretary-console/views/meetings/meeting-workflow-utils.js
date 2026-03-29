import { formatDate } from "./utils/format.js";

export function buildMeetingSummaryDraft(meeting = {}, minutesText = "") {
  const parts = [];
  const location = meeting.location || "this meeting";
  const dateText = formatDate(meeting.date, { weekday: "short" }) || "No date scheduled";
  const chair = meeting.chair || "the chair";
  const attendeeCount = meeting.attendeeCount || 0;

  parts.push(
    `The ${location} session on ${dateText} was led by ${chair} with ${attendeeCount} attendee${attendeeCount === 1 ? "" : "s"} recorded.`
  );

  if (Array.isArray(meeting.tags) && meeting.tags.length > 0) {
    parts.push(`Primary topics included ${meeting.tags.join(", ")}.`);
  }

  const cleanedMinutes = String(minutesText || "").trim();
  if (cleanedMinutes) {
    const excerpt = cleanedMinutes.split(/\n+/).slice(0, 2).join(" ").trim();
    if (excerpt) {
      parts.push(`Discussion summary: ${excerpt}`);
    }
  } else {
    parts.push(
      "Discussion focused on chamber operations, board decisions, and member-service follow-through."
    );
  }

  parts.push(
    "Next steps and approved actions should be reviewed before publishing this summary externally."
  );

  return parts.join("\n\n");
}

export function buildMeetingExportText(meeting = {}) {
  const lines = [
    `Meeting: ${meeting.location || "Untitled Meeting"}`,
    `Date: ${formatDate(meeting.date, { weekday: "short" })}`,
    `Status: ${meeting.status || "scheduled"}`,
    `Chair: ${meeting.chair || "Unassigned"}`,
    `Secretary: ${meeting.secretary || "Unassigned"}`,
    `Attendees: ${meeting.attendeeCount || 0}`,
    `Tags: ${(meeting.tags || []).join(", ") || "None"}`
  ];

  return lines.join("\n");
}

