/**
 * Action Items Tab Component - Phase 5
 *
 * Manages action items assigned during meetings.
 * Features:
 * - List action items with status
 * - Add/edit/delete items
 * - Mark complete
 * - Import/export CSV
 * - Filter and sort
 */

import { fetchWithAuth, request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { formatDate, escapeHtml } from "../utils/format.js";

// State
let currentActionItems = [];
let currentMeetingId = null;

// Module-level handler for closing action row menus on outside clicks
let closeMenuHandler = null;

// Module-level tracker for open modal
let openModal = null;

/**
 * Render action items tab content
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} meeting - Meeting data
 */
export async function render(container, meeting) {
  currentMeetingId = meeting.id;
  container.className = "action-items-tab";
  container.innerHTML = "";

  try {
    // Fetch action items
    const response = await request(`/meetings/${meeting.id}/actions`, "GET");
    currentActionItems = response?.data || response || [];

    // Create toolbar
    const toolbar = createToolbar(meeting.id);
    container.appendChild(toolbar);

    // Create items list
    const listContainer = document.createElement("div");
    listContainer.className = "actions-list-container";
    container.appendChild(listContainer);

    renderActionsList(listContainer, currentActionItems);

    // Wire handlers
    const addBtn = toolbar.querySelector(".btn-add-action");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const modal = createAddActionModal(meeting.id, () => {
          refreshActionsList(listContainer);
        });
        document.body.appendChild(modal);
        modal.classList.add("visible");
      });
    }

    const importBtn = toolbar.querySelector(".btn-import-csv");
    if (importBtn) {
      importBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv";
        input.addEventListener("change", async (e) => {
          if (e.target.files?.[0]) {
            await importCsv(meeting.id, e.target.files[0], listContainer);
          }
        });
        input.click();
      });
    }

    const exportBtn = toolbar.querySelector(".btn-export-csv");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        exportCsv(currentActionItems);
      });
    }
  } catch (error) {
    showToast(`Failed to load action items: ${error.message}`, { type: "error" });
    console.error("[Actions] Render error:", error);
    container.innerHTML = `<p class="error">Failed to load action items</p>`;
  }
}

/**
 * Create toolbar with action buttons
 * @param {String} meetingId - Meeting ID
 * @returns {HTMLElement} Toolbar element
 */
function createToolbar(meetingId) {
  const toolbar = document.createElement("div");
  toolbar.className = "actions-toolbar";
  toolbar.setAttribute("role", "toolbar");

  toolbar.innerHTML = `
    <div class="surface-primary-actions">
      <button class="btn btn-primary btn-add-action">➕ Add Item</button>
    </div>
    <div class="surface-secondary-actions">
      <button class="btn btn-secondary btn-import-csv">📥 Import CSV</button>
      <button class="btn btn-secondary btn-export-csv">📤 Export CSV</button>
    </div>
  `;

  return toolbar;
}

/**
 * Render action items list
 * @param {HTMLElement} container - List container
 * @param {Array} items - Action items
 */
function renderActionsList(container, items = []) {
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No action items yet.</p>
        <p>Click "Add Item" to create one.</p>
      </div>
    `;
    return;
  }

  const table = document.createElement("div");
  table.className = "actions-table";
  table.setAttribute("role", "table");

  // Header
  const header = document.createElement("div");
  header.className = "table-header";
  header.setAttribute("role", "row");
  header.innerHTML = `
    <div class="col-description" role="columnheader">Description</div>
    <div class="col-assignee" role="columnheader">Assigned To</div>
    <div class="col-due" role="columnheader">Due Date</div>
    <div class="col-status" role="columnheader">Status</div>
    <div class="col-actions" role="columnheader">Actions</div>
  `;
  table.appendChild(header);

  // Rows
  items.forEach((item) => {
    const row = createActionRow(item);
    table.appendChild(row);
  });

  container.appendChild(table);
}

/**
 * Create single action item row
 * @param {Object} item - Action item data
 * @returns {HTMLElement} Row element
 */
function createActionRow(item) {
  const row = document.createElement("div");
  row.className = "action-item-row";
  row.setAttribute("role", "row");

  const dueDate = item.dueDate ? formatDate(item.dueDate) : "No date";
  const status = item.status || "not-started";

  row.innerHTML = `
    <div class="col-description" data-label="Description">${escapeHtml(item.description || "")}</div>
    <div class="col-assignee" data-label="Assigned To">${escapeHtml(item.assignee || "Unassigned")}</div>
    <div class="col-due" data-label="Due Date">${dueDate}</div>
    <div class="col-status" data-label="Status">
      <span class="status-badge status-${status}">${status}</span>
    </div>
    <div class="col-actions" data-label="Actions">
      <button class="btn-icon btn-edit" title="Edit">✎</button>
      <div class="row-action-menu">
        <button class="btn-icon btn-row-menu" title="More actions" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">⋯</button>
        <div class="row-action-menu-panel hidden" role="menu">
          <button class="row-action-menu-item btn-delete" title="Delete" role="menuitem">🗑 Delete</button>
        </div>
      </div>
    </div>
  `;

  // Wire edit/delete buttons
  const editBtn = row.querySelector(".btn-edit");
  const deleteBtn = row.querySelector(".btn-delete");
  const menuBtn = row.querySelector(".btn-row-menu");
  const menuPanel = row.querySelector(".row-action-menu-panel");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const modal = createEditActionModal(item, () => {
        // Refresh after edit
        refreshActionsList(row.parentElement);
      });
      document.body.appendChild(modal);
      modal.classList.add("visible");
    });
  }

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      menuPanel.classList.toggle("hidden");
      menuBtn.setAttribute("aria-expanded", String(!menuPanel.classList.contains("hidden")));
    });

    // Register module-level handler to close menus on outside clicks (once per tab lifecycle)
    if (!closeMenuHandler) {
      closeMenuHandler = (event) => {
        // Close any open menus if clicked outside their rows
        document.querySelectorAll(".row-action-menu-panel:not(.hidden)").forEach((panel) => {
          const rowContainer = panel.closest(".action-item-row");
          if (rowContainer && !rowContainer.contains(event.target)) {
            panel.classList.add("hidden");
            const btn = panel.closest(".row-action-menu")?.querySelector(".btn-row-menu");
            if (btn) btn.setAttribute("aria-expanded", "false");
          }
        });
      };
      document.addEventListener("click", closeMenuHandler);
    }
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (confirm(`Delete action: "${item.description}"?`)) {
        try {
          await request(
            `/meetings/${item.meetingId}/actions/${item.id}`,
            "DELETE"
          );
          showToast("Action item deleted");
          refreshActionsList(row.parentElement);
        } catch (error) {
          showToast(`Delete failed: ${error.message}`, { type: "error" });
        }
      }
    });
  }

  return row;
}

/**
 * Create add action modal
 * @param {String} meetingId - Meeting ID
 * @param {Function} onSuccess - Success callback
 * @returns {HTMLElement} Modal element
 */
function createAddActionModal(meetingId, onSuccess) {
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Add Action Item</h2>
        <button class="btn-close">✕</button>
      </div>
      <div class="modal-body">
        <form class="action-form">
          <div class="form-group">
            <label for="actionDescription" class="form-label">Description</label>
            <input
              type="text"
              id="actionDescription"
              class="form-input"
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div class="form-group">
            <label for="actionAssignee" class="form-label">Assigned To</label>
            <input
              type="text"
              id="actionAssignee"
              class="form-input"
              placeholder="Person's name"
            />
          </div>
          <div class="form-group">
            <label for="actionDue" class="form-label">Due Date</label>
            <input
              type="date"
              id="actionDue"
              class="form-input"
            />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-cancel" data-testid="quick-cancel">Cancel</button>
        <button class="btn btn-primary btn-save" data-testid="quick-submit">Save</button>
      </div>
    </div>
  `;

  const form = modal.querySelector(".action-form");
  const saveBtn = modal.querySelector(".btn-save");
  const cancelBtn = modal.querySelector(".btn-cancel");
  const closeBtn = modal.querySelector(".btn-close");

  // Define closeModal first so escapeHandler can reference it
  const closeModal = () => {
    modal.remove();
    openModal = null;
    document.removeEventListener("keydown", escapeHandler);
  };

  // Define escapeHandler with reference to closeModal
  const escapeHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };

  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  // Wire backdrop click to close
  modal.querySelector(".modal-overlay").addEventListener("click", closeModal);

  // Wire Escape key to close
  document.addEventListener("keydown", escapeHandler);

  saveBtn.addEventListener("click", async () => {
    const description = modal.querySelector("#actionDescription").value.trim();
    const assignee = modal.querySelector("#actionAssignee").value.trim();
    const dueDate = modal.querySelector("#actionDue").value;

    if (!description) {
      showToast("Description is required", { type: "error" });
      return;
    }

    try {
      await request(`/meetings/${meetingId}/actions`, "POST", {
        description,
        assignee,
        dueDate,
        status: "not-started"
      });
      showToast("Action item added");
      closeModal();
      onSuccess?.();
    } catch (error) {
      showToast(`Failed to add: ${error.message}`, { type: "error" });
    }
  });

  // Track modal globally for cleanup
  openModal = modal;
  return modal;
}

/**
 * Create edit action modal
 * @param {Object} item - Action item to edit
 * @param {Function} onSuccess - Success callback
 * @returns {HTMLElement} Modal element
 */
function createEditActionModal(item, onSuccess) {
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Action Item</h2>
        <button class="btn-close">✕</button>
      </div>
      <div class="modal-body">
        <form class="action-form">
          <div class="form-group">
            <label for="actionDescription" class="form-label">Description</label>
            <input
              type="text"
              id="actionDescription"
              class="form-input"
              value="${escapeHtml(item.description || "")}"
              required
            />
          </div>
          <div class="form-group">
            <label for="actionAssignee" class="form-label">Assigned To</label>
            <input
              type="text"
              id="actionAssignee"
              class="form-input"
              value="${escapeHtml(item.assignee || "")}"
            />
          </div>
          <div class="form-group">
            <label for="actionDue" class="form-label">Due Date</label>
            <input
              type="date"
              id="actionDue"
              class="form-input"
              value="${item.dueDate ? item.dueDate.split("T")[0] : ""}"
            />
          </div>
          <div class="form-group">
            <label for="actionStatus" class="form-label">Status</label>
            <select id="actionStatus" class="form-select">
              <option value="not-started" ${item.status === "not-started" ? "selected" : ""}>Not Started</option>
              <option value="in-progress" ${item.status === "in-progress" ? "selected" : ""}>In Progress</option>
              <option value="completed" ${item.status === "completed" ? "selected" : ""}>Completed</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-cancel" data-testid="quick-cancel">Cancel</button>
        <button class="btn btn-primary btn-save" data-testid="quick-submit">Save</button>
      </div>
    </div>
  `;

  const saveBtn = modal.querySelector(".btn-save");
  const cancelBtn = modal.querySelector(".btn-cancel");
  const closeBtn = modal.querySelector(".btn-close");

  // Define closeModal first so escapeHandler can reference it
  const closeModal = () => {
    modal.remove();
    openModal = null;
    document.removeEventListener("keydown", escapeHandler);
  };

  // Define escapeHandler with reference to closeModal
  const escapeHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };

  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  // Wire backdrop click to close
  modal.querySelector(".modal-overlay").addEventListener("click", closeModal);

  // Wire Escape key to close
  document.addEventListener("keydown", escapeHandler);

  saveBtn.addEventListener("click", async () => {
    const description = modal.querySelector("#actionDescription").value.trim();
    const assignee = modal.querySelector("#actionAssignee").value.trim();
    const dueDate = modal.querySelector("#actionDue").value;
    const status = modal.querySelector("#actionStatus").value;

    if (!description) {
      showToast("Description is required", { type: "error" });
      return;
    }

    try {
      await request(
        `/meetings/${item.meetingId}/actions/${item.id}`,
        "PUT",
        {
          description,
          assignee,
          dueDate,
          status
        }
      );
      showToast("Action item updated");
      closeModal();
      onSuccess?.();
    } catch (error) {
      showToast(`Update failed: ${error.message}`, { type: "error" });
    }
  });

  // Track modal globally for cleanup
  openModal = modal;
  return modal;
}

/**
 * Refresh action items list
 * @param {HTMLElement} container - List container
 */
async function refreshActionsList(container) {
  try {
    const response = await request(`/meetings/${currentMeetingId}/actions`, "GET");
    currentActionItems = response?.data || response || [];
    renderActionsList(container, currentActionItems);
  } catch (error) {
    showToast(`Refresh failed: ${error.message}`, { type: "error" });
  }
}

/**
 * Import CSV file
 * @param {String} meetingId - Meeting ID
 * @param {File} file - CSV file
 * @param {HTMLElement} container - List container
 */
async function importCsv(meetingId, file, container) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithAuth(`/meetings/${meetingId}/actions/import-csv`, {
      method: "POST",
      body: formData
    }, {
      suppressAlert: true
    });

    if (!response.ok) throw new Error("Import failed");

    showToast("Action items imported");
    refreshActionsList(container);
  } catch (error) {
    showToast(`Import failed: ${error.message}`, { type: "error" });
  }
}

/**
 * Export action items as CSV
 * @param {Array} items - Action items
 */
function exportCsv(items) {
  if (items.length === 0) {
    showToast("No items to export", { type: "error" });
    return;
  }

  const headers = ["Description", "Assigned To", "Due Date", "Status"];
  const rows = items.map((item) => [
    item.description || "",
    item.assignee || "",
    item.dueDate ? formatDate(item.dueDate) : "",
    item.status || ""
  ]);

  const csv =
    [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "action-items.csv";
  a.click();
  URL.revokeObjectURL(url);

  showToast("Action items exported");
}

/**
 * Cleanup function — removes the module-level document click listener and resets state.
 * Called by meeting-detail.js on route change or meeting change.
 * @export
 */
export function cleanup() {
  if (openModal) {
    openModal.remove();
    openModal = null;
  }
  if (closeMenuHandler) {
    document.removeEventListener("click", closeMenuHandler);
    closeMenuHandler = null;
  }
  currentActionItems = [];
  currentMeetingId = null;
}

