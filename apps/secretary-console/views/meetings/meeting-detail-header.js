/**
 * Meeting Detail Header Component - Phase 5
 *
 * Displays meeting metadata and action buttons.
 * Shows: location, date, time, status, attendees, chair, secretary
 * Actions: export, edit, delete (admin only)
 */

import { showToast } from "../../core/api.js";

/**
 * Create meeting detail header
 * @param {Object} meeting - Meeting data
 * @returns {HTMLElement} Header element
 */
export function createMeetingDetailHeader(meeting) {
  const header = document.createElement("div");
  header.className = "meeting-detail-header";
  header.setAttribute("role", "region");
  header.setAttribute("aria-label", "Meeting information");

  // Main title with status
  const title = document.createElement("div");
  title.className = "detail-title";
  title.innerHTML = `
    <div class="title-content">
      <h1>${escapeHtml(meeting.location || "Untitled Meeting")}</h1>
      <span class="badge badge-${meeting.status || "scheduled"}">
        ${meeting.status || "scheduled"}
      </span>
    </div>
  `;
  header.appendChild(title);

  // Metadata row 1: Date, Time, Chair
  const metaRow1 = document.createElement("div");
  metaRow1.className = "detail-meta";
  metaRow1.innerHTML = `
    <span class="meta-item">
      <span class="meta-label">Date:</span>
      <span class="meta-value">${formatDate(meeting.date)}</span>
    </span>
    <span class="meta-item">
      <span class="meta-label">Chair:</span>
      <span class="meta-value">${escapeHtml(meeting.chair || "Unassigned")}</span>
    </span>
    <span class="meta-item">
      <span class="meta-label">Secretary:</span>
      <span class="meta-value">${escapeHtml(meeting.secretary || "Unassigned")}</span>
    </span>
  `;
  header.appendChild(metaRow1);

  // Metadata row 2: Tags, Attendees
  const metaRow2 = document.createElement("div");
  metaRow2.className = "detail-meta";

  const tags = (meeting.tags || []).length > 0
    ? meeting.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")
    : "<span class=\"meta-empty\">None</span>";

  metaRow2.innerHTML = `
    <span class="meta-item">
      <span class="meta-label">Tags:</span>
      <span class="meta-value">${tags}</span>
    </span>
    <span class="meta-item">
      <span class="meta-label">Attendees:</span>
      <span class="meta-value">${meeting.attendeeCount || 0}</span>
    </span>
  `;
  header.appendChild(metaRow2);

  // Action buttons
  const actions = document.createElement("div");
  actions.className = "detail-actions";
  actions.setAttribute("role", "toolbar");
  actions.setAttribute("aria-label", "Meeting actions");
  actions.innerHTML = `
    <button class="btn btn-secondary" id="exportMeetingBtn" title="Export meeting">
      📥 Export
    </button>
    <button class="btn btn-ghost" id="moreActionsBtn" title="More options">
      ⋯ More
    </button>
  `;
  header.appendChild(actions);

  // Wire action handlers
  setupHeaderHandlers(header, meeting);

  return header;
}

/**
 * Update header content when meeting changes
 * @param {HTMLElement} container - Header container or parent
 * @param {Object} meeting - Updated meeting data
 */
export function updateMeetingDetailHeader(container, meeting) {
  const header = container.querySelector(".meeting-detail-header") || container;

  // Update title
  const titleH1 = header.querySelector(".detail-title h1");
  if (titleH1) {
    titleH1.textContent = meeting.location || "Untitled Meeting";
  }

  // Update status badge
  const badge = header.querySelector(".badge");
  if (badge) {
    badge.textContent = meeting.status || "scheduled";
    badge.className = `badge badge-${meeting.status || "scheduled"}`;
  }

  // Update metadata
  const metaItems = header.querySelectorAll(".meta-value");
  if (metaItems.length >= 3) {
    metaItems[0].textContent = formatDate(meeting.date);
    metaItems[1].textContent = meeting.chair || "Unassigned";
    metaItems[2].textContent = meeting.secretary || "Unassigned";
  }

  if (metaItems.length >= 5) {
    const tags = (meeting.tags || []).length > 0
      ? meeting.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")
      : "<span class=\"meta-empty\">None</span>";
    metaItems[3].innerHTML = tags;
    metaItems[4].textContent = meeting.attendeeCount || 0;
  }
}

/**
 * Set up event handlers for header actions
 * @param {HTMLElement} header - Header element
 * @param {Object} meeting - Meeting data
 */
function setupHeaderHandlers(header, meeting) {
  const exportBtn = header.querySelector("#exportMeetingBtn");
  const moreBtn = header.querySelector("#moreActionsBtn");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      showToast("Export feature coming soon");
      // TODO: Implement export modal
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      showToast("More actions menu coming soon");
      // TODO: Implement more actions menu
    });
  }
}

/**
 * Helper: Format date for display
 * @param {String} dateStr - ISO date string
 * @returns {String} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return "No date";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Helper: Escape HTML special characters
 * @param {String} text - Text to escape
 * @returns {String} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
