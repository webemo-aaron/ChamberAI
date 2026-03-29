/**
 * Meeting Row Component
 *
 * Renders a single meeting row in the list table.
 * Extracted from meeting-list.js for reusability and testability.
 *
 * Emits meeting-selected event on click/Enter.
 * Preserves data-meeting-id attribute for E2E tests.
 */

import { formatDate, escapeHtml } from "../utils/format.js";

/**
 * Create a single meeting row element
 * @param {Object} meeting - Meeting data
 * @param {String} meeting.id - Unique meeting ID
 * @param {String} meeting.location - Meeting location
 * @param {String} meeting.date - ISO date string
 * @param {String} meeting.status - Meeting status (scheduled, in-progress, approved, archived)
 * @param {Number} meeting.attendeeCount - Number of attendees
 * @param {String} meeting.topic - Meeting topic (optional)
 * @param {Boolean} isSelected - Whether this row is currently selected
 * @returns {HTMLElement} Row element with click/keyboard handlers
 */
export function createMeetingRow(meeting, isSelected = false) {
  const row = document.createElement("div");
  row.className = `meeting-item ${isSelected ? "selected" : ""}`;
  row.setAttribute("role", "row");
  row.setAttribute("tabindex", "0");
  row.dataset.meetingId = meeting.id;

  const location = meeting.location || "Untitled";
  const date = formatDate(meeting.date || new Date().toISOString());
  const status = meeting.status || "scheduled";
  const attendees = meeting.attendeeCount || 0;

  row.innerHTML = `
    <div class="col-location" data-label="Location">${escapeHtml(location)}</div>
    <div class="col-date" data-label="Date/Time">${escapeHtml(date)}</div>
    <div class="col-status" data-label="Status">
      <span class="badge badge-${status}">${status}</span>
    </div>
    <div class="col-attendees" data-label="Attendees">${attendees}</div>
  `;

  // Keyboard accessibility: Enter or Space triggers selection
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      row.click();
    }
  });

  return row;
}
