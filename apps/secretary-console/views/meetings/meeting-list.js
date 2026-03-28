/**
 * Meeting List Component - Phase 5
 *
 * Renders a searchable, filterable list of meetings.
 * Emits meeting-selected event when user clicks a row.
 * Supports search, filtering by status, and responsive layout.
 *
 * Features:
 * - Search by location, topic
 * - Filter by status (scheduled, in-progress, approved, archived)
 * - Sort by date
 * - Highlight selected meeting
 * - Responsive table view (scrollable on mobile)
 */

import { showToast } from "../../core/api.js";

// State
let filteredMeetings = [];
let searchTerm = "";
let statusFilter = "all";
let selectedMeetingId = null;

/**
 * Create meeting list UI structure
 * @returns {HTMLElement} List container
 */
export function createMeetingList() {
  const listContainer = document.createElement("div");
  listContainer.className = "meeting-list-pane";
  listContainer.setAttribute("role", "region");
  listContainer.setAttribute("aria-label", "Meetings directory");

  // Header with title and actions
  const header = document.createElement("div");
  header.className = "list-header";
  header.innerHTML = `
    <div class="list-title-section">
      <h2 class="list-title">Meetings</h2>
      <span class="meeting-count" id="meetingCount">0</span>
    </div>
    <div class="list-actions">
      <button class="btn btn-primary" id="createMeetingBtn">+ New Meeting</button>
      <button class="btn-icon" id="refreshBtn" title="Refresh list">⟳</button>
    </div>
  `;
  listContainer.appendChild(header);

  // Search input
  const searchContainer = document.createElement("div");
  searchContainer.className = "search-container";
  searchContainer.innerHTML = `
    <input
      type="text"
      id="meetingSearch"
      class="search-input"
      placeholder="Search meetings..."
      aria-label="Search meetings by location or topic"
    />
  `;
  listContainer.appendChild(searchContainer);

  // Filter controls
  const filterContainer = document.createElement("div");
  filterContainer.className = "filter-container";
  filterContainer.setAttribute("role", "group");
  filterContainer.setAttribute("aria-label", "Filter meetings");
  filterContainer.innerHTML = `
    <div class="filter-group">
      <label for="statusFilter" class="filter-label">Status:</label>
      <select id="statusFilter" class="filter-select" aria-label="Filter by status">
        <option value="all">All</option>
        <option value="scheduled">Scheduled</option>
        <option value="in-progress">In Progress</option>
        <option value="approved">Approved</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  `;
  listContainer.appendChild(filterContainer);

  // Meeting table container
  const tableContainer = document.createElement("div");
  tableContainer.className = "meeting-table-wrapper";
  tableContainer.setAttribute("role", "table");

  // Table header
  const header_row = document.createElement("div");
  header_row.className = "table-header";
  header_row.setAttribute("role", "row");
  header_row.innerHTML = `
    <div class="col-location" role="columnheader">Location</div>
    <div class="col-date" role="columnheader">Date/Time</div>
    <div class="col-status" role="columnheader">Status</div>
    <div class="col-attendees" role="columnheader">Attendees</div>
  `;
  tableContainer.appendChild(header_row);

  // Meeting list
  const meetingList = document.createElement("div");
  meetingList.className = "meeting-list";
  meetingList.id = "meetingList";
  tableContainer.appendChild(meetingList);

  listContainer.appendChild(tableContainer);

  // Empty state
  const emptyState = document.createElement("div");
  emptyState.id = "meetingEmpty";
  emptyState.className = "empty-state hidden";
  emptyState.setAttribute("role", "status");
  emptyState.innerHTML = `
    <p>No meetings found.</p>
    <p>Create your first meeting to get started.</p>
  `;
  listContainer.appendChild(emptyState);

  // Wire search and filter handlers
  setupListHandlers(listContainer);

  return listContainer;
}

/**
 * Populate meeting list with data and handle search/filter
 * @param {HTMLElement} container - List container
 * @param {Array} meetings - Meeting data
 * @param {String} selectedId - Currently selected meeting ID
 */
export function renderMeetingsList(container, meetings = [], selectedId = null) {
  selectedMeetingId = selectedId;
  filteredMeetings = meetings;

  const listTable = container.querySelector("#meetingList");
  const emptyState = container.querySelector("#meetingEmpty");
  const countBadge = container.querySelector("#meetingCount");

  if (!listTable) return;

  // Show empty state if no meetings
  if (meetings.length === 0) {
    listTable.innerHTML = "";
    emptyState?.classList.remove("hidden");
    if (countBadge) countBadge.textContent = "0";
    return;
  }

  emptyState?.classList.add("hidden");

  // Render meeting rows
  listTable.innerHTML = "";
  meetings.forEach((meeting) => {
    const row = createMeetingRow(meeting, selectedId === meeting.id);

    row.addEventListener("click", () => {
      // Update visual selection
      container.querySelectorAll(".meeting-item").forEach((item) => {
        item.classList.remove("selected");
      });
      row.classList.add("selected");
      selectedMeetingId = meeting.id;

      // Emit custom event
      container.dispatchEvent(
        new CustomEvent("meeting-selected", {
          detail: { id: meeting.id, data: meeting },
          bubbles: true
        })
      );
    });

    listTable.appendChild(row);
  });

  // Update count badge
  if (countBadge) countBadge.textContent = meetings.length;
}

/**
 * Create single meeting row
 * @param {Object} meeting - Meeting data
 * @param {Boolean} isSelected - Is this meeting selected
 * @returns {HTMLElement} Row element
 */
function createMeetingRow(meeting, isSelected = false) {
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

  // Keyboard accessibility
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      row.click();
    }
  });

  return row;
}

/**
 * Set up event handlers for search, filter, create, refresh
 * @param {HTMLElement} container - List container
 */
function setupListHandlers(container) {
  const searchInput = container.querySelector("#meetingSearch");
  const statusFilter = container.querySelector("#statusFilter");
  const createBtn = container.querySelector("#createMeetingBtn");
  const refreshBtn = container.querySelector("#refreshBtn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase();
      applyFilters(container);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      statusFilter.value = e.target.value;
      applyFilters(container);
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", () => {
      container.dispatchEvent(
        new CustomEvent("create-meeting", {
          detail: {},
          bubbles: true
        })
      );
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      container.dispatchEvent(
        new CustomEvent("refresh-requested", {
          bubbles: true
        })
      );
    });
  }
}

/**
 * Apply search and filter to meetings
 * @param {HTMLElement} container - List container
 */
function applyFilters(container) {
  let filtered = filteredMeetings;

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter((meeting) => {
      const location = (meeting.location || "").toLowerCase();
      const topic = (meeting.topic || "").toLowerCase();
      return location.includes(searchTerm) || topic.includes(searchTerm);
    });
  }

  // Apply status filter
  const statusSelect = container.querySelector("#statusFilter");
  if (statusSelect && statusSelect.value !== "all") {
    filtered = filtered.filter((m) => m.status === statusSelect.value);
  }

  // Re-render list
  renderMeetingsList(container, filtered, selectedMeetingId);
}

/**
 * Helper: Format date for display
 * @param {String} dateStr - ISO date string
 * @returns {String} Formatted date
 */
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
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
