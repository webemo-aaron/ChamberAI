/**
 * Meeting Detail Header Component - Phase 5
 *
 * Displays meeting metadata and action buttons.
 * Shows: location, date, time, status, attendees, chair, secretary
 * Actions: export, edit, delete (admin only)
 */

import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";
import { buildMeetingExportText } from "./meeting-workflow-utils.js";
import {
  inferShowcaseCityFromMeeting,
  setSelectedShowcaseCity
} from "../common/showcase-city-context.js";
import { formatDate, escapeHtml } from "./utils/format.js";

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
      <span class="detail-eyebrow">Meeting Workspace</span>
      <h1>${escapeHtml(meeting.location || "Untitled Meeting")}</h1>
      <span class="badge badge-${meeting.status || "scheduled"}">
        ${meeting.status || "scheduled"}
      </span>
    </div>
  `;
  header.appendChild(title);

  const tags = (meeting.tags || []).length > 0
    ? meeting.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")
    : "<span class=\"meta-empty\">None</span>";

  const summaryGrid = document.createElement("div");
  summaryGrid.className = "detail-summary-grid";
  summaryGrid.innerHTML = `
    <article class="detail-meta-card">
      <span class="meta-label">Session</span>
      <span class="meta-value">${formatDate(meeting.date, { weekday: "short" })}</span>
    </article>
    <article class="detail-meta-card">
      <span class="meta-label">Leadership</span>
      <span class="meta-value">${escapeHtml(meeting.chair || "Unassigned")}</span>
      <span class="meta-subvalue">Secretary: ${escapeHtml(meeting.secretary || "Unassigned")}</span>
    </article>
    <article class="detail-meta-card">
      <span class="meta-label">Participation</span>
      <span class="meta-value">${meeting.attendeeCount || 0} attendees</span>
      <span class="meta-subvalue">Tracked for approvals & follow-through</span>
    </article>
    <article class="detail-meta-card">
      <span class="meta-label">Tags</span>
      <span class="meta-value">${tags}</span>
    </article>
  `;
  header.appendChild(summaryGrid);

  // Action buttons
  const actions = document.createElement("div");
  actions.className = "detail-actions";
  actions.setAttribute("role", "toolbar");
  actions.setAttribute("aria-label", "Meeting actions");
  actions.innerHTML = `
    <button class="btn btn-secondary" id="exportMeetingBtn" title="Export meeting">
      📥 Export
    </button>
    <button class="btn btn-secondary" id="geoMeetingBtn" title="Open Geo Intelligence">
      Geo Intelligence
    </button>
    <button class="btn btn-ghost" id="moreActionsBtn" title="More options">
      ⋯ More
    </button>
    <div class="detail-action-menu hidden" id="meetingActionMenu" role="menu" aria-label="Meeting actions menu">
      <button class="detail-action-menu-item" data-action="copy-link" role="menuitem">Copy Meeting Link</button>
      <button class="detail-action-menu-item" data-action="open-summary" role="menuitem">Open Summary Tab</button>
    </div>
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
  const geoBtn = header.querySelector("#geoMeetingBtn");
  const moreBtn = header.querySelector("#moreActionsBtn");
  const actionMenu = header.querySelector("#meetingActionMenu");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const content = buildMeetingExportText(meeting);
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(meeting.location || "meeting").replace(/\s+/g, "-").toLowerCase()}-snapshot.txt`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Meeting snapshot exported");
    });
  }

  if (moreBtn && actionMenu) {
    moreBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      actionMenu.classList.toggle("hidden");
    });

    actionMenu.querySelector('[data-action="copy-link"]')?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/meetings/${meeting.id}`);
        showToast("Meeting link copied");
      } catch (error) {
        showToast("Failed to copy meeting link", { type: "error" });
      }
      actionMenu.classList.add("hidden");
    });

    actionMenu.querySelector('[data-action="open-summary"]')?.addEventListener("click", () => {
      header.dispatchEvent(
        new CustomEvent("meeting-tab-requested", {
          bubbles: true,
          detail: { tabId: "public-summary" }
        })
      );
      actionMenu.classList.add("hidden");
    });

    document.addEventListener(
      "click",
      (event) => {
        if (!header.contains(event.target)) {
          actionMenu.classList.add("hidden");
        }
      },
      { once: true }
    );
  }

  if (geoBtn) {
    geoBtn.addEventListener("click", () => {
      const inferredCity = inferShowcaseCityFromMeeting(meeting);
      if (inferredCity) {
        setSelectedShowcaseCity(inferredCity.id);
      }
      navigate("/geo-intelligence");
    });
  }
}

