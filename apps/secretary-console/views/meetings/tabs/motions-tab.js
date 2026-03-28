/**
 * Motions Tab Component - Phase 5
 *
 * Manages motions and voting records.
 * Features:
 * - List motions with vote counts
 * - Create new motion
 * - Approve/vote on motions
 * - View vote results
 * - Delete motion
 * - Export results
 */

import { request, showToast } from "../../../core/api.js";

// State
let currentMotions = [];
let currentMeetingId = null;

/**
 * Render motions tab content
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} meeting - Meeting data
 */
export async function render(container, meeting) {
  currentMeetingId = meeting.id;
  container.className = "motions-tab";
  container.innerHTML = "";

  try {
    // Fetch motions
    const response = await request(`/meetings/${meeting.id}/motions`, "GET");
    currentMotions = response?.data || response || [];

    // Create toolbar
    const toolbar = createMotionToolbar();
    container.appendChild(toolbar);

    // Create motions list
    const listContainer = document.createElement("div");
    listContainer.className = "motions-list-container";
    container.appendChild(listContainer);

    renderMotionsList(listContainer, currentMotions);

    // Wire create button
    const createBtn = toolbar.querySelector(".btn-create-motion");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        const modal = createMotionModal(meeting.id, () => {
          refreshMotionsList(listContainer);
        });
        document.body.appendChild(modal);
        modal.classList.add("visible");
      });
    }
  } catch (error) {
    showToast(`Failed to load motions: ${error.message}`, { type: "error" });
    console.error("[Motions] Render error:", error);
    container.innerHTML = `<p class="error">Failed to load motions</p>`;
  }
}

/**
 * Create motion toolbar
 * @returns {HTMLElement} Toolbar element
 */
function createMotionToolbar() {
  const toolbar = document.createElement("div");
  toolbar.className = "motions-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.innerHTML = `
    <button class="btn btn-primary btn-create-motion">🗳 Create Motion</button>
  `;
  return toolbar;
}

/**
 * Render motions list
 * @param {HTMLElement} container - List container
 * @param {Array} motions - Motions data
 */
function renderMotionsList(container, motions = []) {
  container.innerHTML = "";

  if (motions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No motions yet.</p>
        <p>Click "Create Motion" to get started.</p>
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "motions-list";
  list.setAttribute("role", "list");

  motions.forEach((motion) => {
    const item = createMotionItem(motion);
    list.appendChild(item);
  });

  container.appendChild(list);
}

/**
 * Create single motion item
 * @param {Object} motion - Motion data
 * @returns {HTMLElement} Motion item element
 */
function createMotionItem(motion) {
  const item = document.createElement("div");
  item.className = "motion-item";
  item.setAttribute("role", "listitem");

  const status = motion.status || "pending";
  const yesVotes = motion.votes?.yes || 0;
  const noVotes = motion.votes?.no || 0;
  const abstainVotes = motion.votes?.abstain || 0;
  const notVoted = motion.votes?.notVoted || 0;
  const result = motion.result || "pending";

  item.innerHTML = `
    <div class="motion-header">
      <h4 class="motion-text">${escapeHtml(motion.text || "")}</h4>
      <span class="status-badge status-${status}">${status}</span>
    </div>
    <div class="motion-meta">
      <span class="meta-item">
        <span class="label">Mover:</span>
        <span>${escapeHtml(motion.mover || "")}</span>
      </span>
      <span class="meta-item">
        <span class="label">Seconder:</span>
        <span>${escapeHtml(motion.seconder || "")}</span>
      </span>
    </div>
    <div class="motion-votes">
      <div class="vote-count">👍 Yes: ${yesVotes}</div>
      <div class="vote-count">👎 No: ${noVotes}</div>
      <div class="vote-count">🤷 Abstain: ${abstainVotes}</div>
      <div class="vote-count">❓ Not Voted: ${notVoted}</div>
    </div>
    <div class="motion-result">
      Result: <span class="result-badge result-${result}">${result}</span>
    </div>
    <div class="motion-actions">
      ${status === "pending" ? `
        <button class="btn-vote btn-yes" title="Vote yes">👍</button>
        <button class="btn-vote btn-no" title="Vote no">👎</button>
        <button class="btn-vote btn-abstain" title="Abstain">🤷</button>
      ` : ""}
      <button class="btn-icon btn-delete" title="Delete">🗑</button>
    </div>
  `;

  // Wire vote buttons
  const voteButtons = item.querySelectorAll(".btn-vote");
  voteButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const voteType = btn.classList.contains("btn-yes")
        ? "yes"
        : btn.classList.contains("btn-no")
          ? "no"
          : "abstain";

      try {
        await request(`/meetings/${motion.meetingId}/motions/${motion.id}`, "PUT", {
          vote: voteType
        });
        showToast("Vote recorded");
        refreshMotionsList(item.parentElement);
      } catch (error) {
        showToast(`Vote failed: ${error.message}`, { type: "error" });
      }
    });
  });

  // Wire delete button
  const deleteBtn = item.querySelector(".btn-delete");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (confirm(`Delete motion: "${motion.text}"?`)) {
        try {
          await request(
            `/meetings/${motion.meetingId}/motions/${motion.id}`,
            "DELETE"
          );
          showToast("Motion deleted");
          refreshMotionsList(item.parentElement);
        } catch (error) {
          showToast(`Delete failed: ${error.message}`, { type: "error" });
        }
      }
    });
  }

  return item;
}

/**
 * Create motion modal
 * @param {String} meetingId - Meeting ID
 * @param {Function} onSuccess - Success callback
 * @returns {HTMLElement} Modal element
 */
function createMotionModal(meetingId, onSuccess) {
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Create Motion</h2>
        <button class="btn-close">✕</button>
      </div>
      <div class="modal-body">
        <form class="motion-form">
          <div class="form-group">
            <label for="motionText" class="form-label">Motion Text</label>
            <textarea
              id="motionText"
              class="form-textarea"
              placeholder="What is being proposed?"
              required
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="motionMover" class="form-label">Mover</label>
            <input
              type="text"
              id="motionMover"
              class="form-input"
              placeholder="Person moving the motion"
            />
          </div>
          <div class="form-group">
            <label for="motionSeconder" class="form-label">Seconder</label>
            <input
              type="text"
              id="motionSeconder"
              class="form-input"
              placeholder="Person seconding the motion"
            />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-cancel">Cancel</button>
        <button class="btn btn-primary btn-save">Create</button>
      </div>
    </div>
  `;

  const saveBtn = modal.querySelector(".btn-save");
  const cancelBtn = modal.querySelector(".btn-cancel");
  const closeBtn = modal.querySelector(".btn-close");

  const closeModal = () => {
    modal.remove();
  };

  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  saveBtn.addEventListener("click", async () => {
    const text = modal.querySelector("#motionText").value.trim();
    const mover = modal.querySelector("#motionMover").value.trim();
    const seconder = modal.querySelector("#motionSeconder").value.trim();

    if (!text) {
      showToast("Motion text is required", { type: "error" });
      return;
    }

    try {
      await request(`/meetings/${meetingId}/motions`, "POST", {
        text,
        mover,
        seconder,
        status: "pending"
      });
      showToast("Motion created");
      closeModal();
      onSuccess?.();
    } catch (error) {
      showToast(`Create failed: ${error.message}`, { type: "error" });
    }
  });

  return modal;
}

/**
 * Refresh motions list
 * @param {HTMLElement} container - List container
 */
async function refreshMotionsList(container) {
  try {
    const response = await request(`/meetings/${currentMeetingId}/motions`, "GET");
    currentMotions = response?.data || response || [];
    renderMotionsList(container, currentMotions);
  } catch (error) {
    showToast(`Refresh failed: ${error.message}`, { type: "error" });
  }
}

/**
 * Helper: Escape HTML
 * @param {String} text - Text to escape
 * @returns {String} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
