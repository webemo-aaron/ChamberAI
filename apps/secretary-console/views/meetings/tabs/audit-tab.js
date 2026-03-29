/**
 * Audit Tab Component - Phase 5
 *
 * Displays read-only audit trail of meeting changes.
 * Features:
 * - Chronological log of actions
 * - User and timestamp information
 * - Change details (what changed)
 * - Filter by action type
 * - Filter by user
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { formatDate, escapeHtml } from "../utils/format.js";

// State
let auditLog = [];
let filteredLog = [];

/**
 * Render audit tab content
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} meeting - Meeting data
 */
export async function render(container, meeting) {
  container.className = "audit-tab";
  container.innerHTML = "";

  try {
    // Fetch audit log
    const response = await request(`/meetings/${meeting.id}/audit`, "GET");
    auditLog = response?.data || response || [];
    filteredLog = auditLog;

    // Create filters
    const filterBar = createFilterBar();
    container.appendChild(filterBar);

    // Create log container
    const logContainer = document.createElement("div");
    logContainer.className = "audit-log";
    logContainer.setAttribute("role", "region");
    logContainer.setAttribute("aria-label", "Audit log");
    container.appendChild(logContainer);

    renderAuditLog(logContainer, filteredLog);

    // Wire filter handlers
    const actionFilter = filterBar.querySelector("#actionFilter");
    const userFilter = filterBar.querySelector("#userFilter");

    if (actionFilter) {
      actionFilter.addEventListener("change", () => {
        applyFilters(filterBar, logContainer);
      });
    }

    if (userFilter) {
      userFilter.addEventListener("change", () => {
        applyFilters(filterBar, logContainer);
      });
    }
  } catch (error) {
    showToast(`Failed to load audit log: ${error.message}`, { type: "error" });
    console.error("[Audit] Render error:", error);
    container.innerHTML = `<p class="error">Failed to load audit log</p>`;
  }
}

/**
 * Create filter bar
 * @returns {HTMLElement} Filter bar element
 */
function createFilterBar() {
  const filterBar = document.createElement("div");
  filterBar.className = "audit-filters";
  filterBar.setAttribute("role", "group");
  filterBar.setAttribute("aria-label", "Filter audit log");

  filterBar.innerHTML = `
    <div class="filter-group">
      <label for="actionFilter" class="filter-label">Action:</label>
      <select id="actionFilter" class="filter-select">
        <option value="">All Actions</option>
        <option value="created">Created</option>
        <option value="updated">Updated</option>
        <option value="approved">Approved</option>
        <option value="archived">Archived</option>
        <option value="deleted">Deleted</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="userFilter" class="filter-label">User:</label>
      <select id="userFilter" class="filter-select">
        <option value="">All Users</option>
      </select>
    </div>
  `;

  // Populate user filter
  const users = new Set(auditLog.map((entry) => entry.user).filter(Boolean));
  const userSelect = filterBar.querySelector("#userFilter");
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user;
    option.textContent = user;
    userSelect.appendChild(option);
  });

  return filterBar;
}

/**
 * Render audit log entries
 * @param {HTMLElement} container - Log container
 * @param {Array} entries - Audit entries
 */
function renderAuditLog(container, entries = []) {
  container.innerHTML = "";

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No audit log entries found.</p>
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "audit-list";
  list.setAttribute("role", "list");

  // Sort by timestamp (newest first)
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  sorted.forEach((entry) => {
    const item = createAuditEntry(entry);
    list.appendChild(item);
  });

  container.appendChild(list);
}

/**
 * Create single audit entry
 * @param {Object} entry - Audit entry data
 * @returns {HTMLElement} Entry element
 */
function createAuditEntry(entry) {
  const item = document.createElement("div");
  item.className = "audit-entry";
  item.setAttribute("role", "listitem");

  const timestamp = formatDate(entry.timestamp);
  const action = entry.action || "unknown";
  const user = entry.user || "System";
  const changes = formatChanges(entry.changes);

  item.innerHTML = `
    <div class="entry-header">
      <span class="entry-action action-${action}">${action}</span>
      <span class="entry-timestamp">${timestamp}</span>
    </div>
    <div class="entry-user">
      <span class="user-label">By:</span>
      <span class="user-name">${escapeHtml(user)}</span>
    </div>
    ${
      changes
        ? `
      <div class="entry-changes">
        <span class="changes-label">Changes:</span>
        <div class="changes-detail">${changes}</div>
      </div>
    `
        : ""
    }
  `;

  return item;
}

/**
 * Format change details for display
 * @param {Object|String} changes - Change data
 * @returns {String} Formatted HTML
 */
function formatChanges(changes) {
  if (!changes) return "";

  if (typeof changes === "string") {
    return escapeHtml(changes);
  }

  if (typeof changes === "object") {
    const entries = Object.entries(changes);
    if (entries.length === 0) return "";

    const html = entries
      .map(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          if (value.from !== undefined && value.to !== undefined) {
            return `<div class="change-item">${escapeHtml(key)}: ${escapeHtml(
              String(value.from)
            )} → ${escapeHtml(String(value.to))}</div>`;
          }
        }
        return `<div class="change-item">${escapeHtml(key)}: ${escapeHtml(
          String(value)
        )}</div>`;
      })
      .join("");

    return html;
  }

  return "";
}

/**
 * Apply filters to audit log
 * @param {HTMLElement} filterBar - Filter bar element
 * @param {HTMLElement} logContainer - Log container
 */
function applyFilters(filterBar, logContainer) {
  const actionFilter = filterBar.querySelector("#actionFilter").value;
  const userFilter = filterBar.querySelector("#userFilter").value;

  filteredLog = auditLog.filter((entry) => {
    const actionMatch = !actionFilter || entry.action === actionFilter;
    const userMatch = !userFilter || entry.user === userFilter;
    return actionMatch && userMatch;
  });

  renderAuditLog(logContainer, filteredLog);
}

