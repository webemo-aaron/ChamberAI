/**
 * Quotes Tab Component
 *
 * Manages quote requests and history:
 * - Quote request form (service needed, budget, timeline)
 * - Quote submission
 * - Quote history list with status tracking
 * - Status tracking (pending, quoted, accepted, rejected)
 * - View/respond to quotes
 * - Responsive form layout
 *
 * Exported function: render(container, options)
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { getCurrentRole } from "../../../core/auth.js";
import { escapeHtml, formatDate } from "../../common/format.js";

/**
 * Module-level state for closeMenuHandler
 */
let closeMenuHandler = null;

/**
 * Render quotes tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function render(container, options = {}) {
  const { business = {} } = options;
  const role = getCurrentRole();

  // State
  const state = {
    quotes: [],
    loading: true,
    error: null,
    notice: null,
    pendingAction: "",
    showForm: false,
    formData: {
      serviceNeeded: "",
      budget: "",
      timeline: "",
      description: ""
    }
  };

  loadQuotes();

  /**
   * Load quotes from API
   */
  async function loadQuotes() {
    state.loading = true;
    state.error = null;
    render();

    try {
      const response = await request(`/business-listings/${business.id}/quotes`, "GET", null, {
        suppressAlert: true
      });
      if (!response || response.error) {
        throw new Error(response?.error || "Failed to load quotes");
      }
      state.quotes = response?.data || response || [];
      state.notice = null;
    } catch (error) {
      console.error("Failed to load quotes:", error);
      state.error = "Verify the API base or backend readiness, then retry.";
      showToast("Failed to load quotes", "error");
    } finally {
      state.loading = false;
      render();
    }
  }

  /**
   * Handle form input
   */
  function handleFormInput(event) {
    const { name, value } = event.target;
    state.formData[name] = value;
  }

  /**
   * Toggle form visibility
   */
  function toggleForm() {
    state.showForm = !state.showForm;
    state.notice = null;
    render();
  }

  /**
   * Submit quote request
   */
  async function handleSubmitQuote() {
    const { serviceNeeded, budget, timeline } = state.formData;

    if (!serviceNeeded?.trim()) {
      showToast("Please describe the service needed", "error");
      return;
    }

    if (!budget?.trim()) {
      showToast("Please enter a budget", "error");
      return;
    }

    if (!timeline?.trim()) {
      showToast("Please specify a timeline", "error");
      return;
    }

    try {
      state.pendingAction = "submit";
      state.notice = {
        tone: "info",
        title: "Submitting Quote Request",
        message: "Sending the request to the business workflow."
      };
      render();

      const response = await request(`/business-listings/${business.id}/quotes`, "POST", {
        serviceNeeded,
        budget,
        timeline,
        description: state.formData.description
      });
      if (!response || response.error) {
        throw new Error(response?.error || "Failed to submit quote request");
      }

      showToast("Quote request submitted successfully");
      state.showForm = false;
      state.pendingAction = "";
      state.notice = {
        tone: "success",
        title: "Quote Request Sent",
        message: "The request is now part of the business history for this record."
      };
      state.formData = {
        serviceNeeded: "",
        budget: "",
        timeline: "",
        description: ""
      };
      loadQuotes();
    } catch (error) {
      console.error("Failed to submit quote request:", error);
      state.pendingAction = "";
      state.notice = {
        tone: "warning",
        title: "Quote Request Unavailable",
        message: "The request could not be submitted. Check connectivity and try again."
      };
      render();
      showToast("Failed to submit quote request", "error");
    }
  }

  /**
   * Handle quote status update
   */
  async function handleUpdateQuoteStatus(quoteId, newStatus) {
    try {
      state.pendingAction = `status-${quoteId}`;
      state.notice = {
        tone: "info",
        title: "Updating Quote",
        message: `Applying the ${newStatus} decision to this quote request.`
      };
      render();

      const response = await request(`/business-listings/${business.id}/quotes/${quoteId}`, "PUT", {
        status: newStatus
      });
      if (!response || response.error) {
        throw new Error(response?.error || "Failed to update quote status");
      }

      showToast(`Quote ${newStatus} successfully`);
      state.pendingAction = "";
      state.notice = {
        tone: "success",
        title: "Quote Updated",
        message: `The quote is now marked as ${newStatus}.`
      };
      loadQuotes();
    } catch (error) {
      console.error("Failed to update quote status:", error);
      state.pendingAction = "";
      state.notice = {
        tone: "warning",
        title: "Quote Update Failed",
        message: "The quote status could not be changed. Retry when the backend is available."
      };
      render();
      showToast("Failed to update quote status", "error");
    }
  }

  /**
   * Render the quotes tab
   */
  function render() {
    container.innerHTML = `
      <div class="quotes-tab-content">
        <!-- Quote Request Form Toggle -->
        <div class="quotes-header">
          <div>
            <h3>Quote Requests</h3>
            <p class="quotes-subtitle">Track requests, decisions, and vendor responses for this business.</p>
          </div>
          <div class="quotes-header-actions">
            <div class="surface-primary-actions">
              <button
                class="btn ${state.showForm ? "ghost" : ""}"
                id="toggleFormBtn"
                ${state.pendingAction ? "disabled" : ""}
              >
                ${state.showForm ? "✕ Cancel" : "+ Request Quote"}
              </button>
            </div>
            <div class="surface-secondary-actions">
              <button
                class="btn ghost"
                id="refreshQuotesBtn"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        ${
          state.notice
            ? `
              <div
                class="quotes-notice quotes-notice--${state.notice.tone}"
                role="${state.notice.tone === "warning" ? "alert" : "status"}"
                aria-live="${state.notice.tone === "warning" ? "assertive" : "polite"}"
              >
                <strong>${state.notice.title}</strong>
                <p>${state.notice.message}</p>
              </div>
            `
            : ""
        }

        <!-- Quote Request Form -->
        ${
          state.showForm
            ? `
          <div class="quote-form-container">
            <form id="quoteForm" class="quote-form">
              <div class="form-group">
                <label for="serviceNeeded" class="form-label">
                  Service Needed <span class="required">*</span>
                </label>
                <textarea
                  id="serviceNeeded"
                  name="serviceNeeded"
                  class="form-control"
                  placeholder="Describe the service you need..."
                  rows="3"
                  required
                >${state.formData.serviceNeeded}</textarea>
              </div>

              <div class="form-group">
                <label for="budget" class="form-label">
                  Budget <span class="required">*</span>
                </label>
                <input
                  id="budget"
                  type="text"
                  name="budget"
                  class="form-control"
                  placeholder="e.g., $500-$1000"
                  value="${state.formData.budget}"
                  required
                />
              </div>

              <div class="form-group">
                <label for="timeline" class="form-label">
                  Timeline <span class="required">*</span>
                </label>
                <input
                  id="timeline"
                  type="text"
                  name="timeline"
                  class="form-control"
                  placeholder="e.g., ASAP, 2 weeks, etc."
                  value="${state.formData.timeline}"
                  required
                />
              </div>

              <div class="form-group">
                <label for="description" class="form-label">Additional Details</label>
                <textarea
                  id="description"
                  name="description"
                  class="form-control"
                  placeholder="Any additional information..."
                  rows="3"
                >${state.formData.description}</textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="btn" id="submitQuoteBtn">
                  ${state.pendingAction === "submit" ? "Sending..." : "Send Quote Request"}
                </button>
                <button type="button" class="btn ghost" id="cancelFormBtn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        `
            : ""
        }

        <!-- Quotes List -->
        <div class="quotes-list">
          ${renderQuotesList()}
        </div>
      </div>
    `;

    // Attach event listeners
    const toggleBtn = container.querySelector("#toggleFormBtn");
    const submitBtn = container.querySelector("#submitQuoteBtn");
    const cancelBtn = container.querySelector("#cancelFormBtn");
    const refreshBtn = container.querySelector("#refreshQuotesBtn");

    if (toggleBtn) toggleBtn.addEventListener("click", toggleForm);
    if (submitBtn) submitBtn.addEventListener("click", handleSubmitQuote);
    if (cancelBtn) cancelBtn.addEventListener("click", toggleForm);
    if (refreshBtn) refreshBtn.addEventListener("click", loadQuotes);

    container.querySelectorAll("[data-retry-quotes]").forEach((button) => {
      button.addEventListener("click", loadQuotes);
    });

    container.querySelectorAll("[data-open-quote-form]").forEach((button) => {
      button.addEventListener("click", () => {
        state.showForm = true;
        render();
      });
    });

    // Attach form input listeners
    container.querySelectorAll(".quote-form [name]").forEach((input) => {
      input.addEventListener("input", handleFormInput);
    });

    // Attach quote action handlers
    container.querySelectorAll(".quote-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const quoteId = btn.dataset.quoteId;
        const status = btn.dataset.status;
        handleUpdateQuoteStatus(quoteId, status);
      });
    });

    container.querySelectorAll('[data-action="toggle-menu"]').forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const menu = btn.parentElement?.querySelector(".quote-row-menu-panel");
        if (menu) {
          menu.classList.toggle("hidden");
          btn.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
        }
      });
      btn.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          const menu = btn.parentElement?.querySelector(".quote-row-menu-panel");
          if (menu && !menu.classList.contains("hidden")) {
            menu.classList.add("hidden");
            btn.setAttribute("aria-expanded", "false");
            btn.focus();
          }
        }
      });
    });

    // Wire closeMenuHandler for outside-click dismissal
    if (!closeMenuHandler) {
      closeMenuHandler = (event) => {
        if (!event.target.closest(".quote-row-menu")) {
          container.querySelectorAll(".quote-row-menu-panel:not(.hidden)").forEach((panel) => {
            panel.classList.add("hidden");
            panel.closest(".quote-row-menu")
              ?.querySelector('[data-action="toggle-menu"]')
              ?.setAttribute("aria-expanded", "false");
          });
        }
      };
      document.addEventListener("click", closeMenuHandler);
    }
  }

  /**
   * Render quotes list
   */
  function renderQuotesList() {
    if (state.loading) {
      return '<div class="loading-message" role="status" aria-live="polite">Loading quotes...</div>';
    }

    if (state.error) {
      return `
        <div class="error-message" role="alert">
          <strong>Unable to load quotes</strong>
          <p>${state.error}</p>
          <button type="button" class="btn ghost" data-retry-quotes>Retry</button>
        </div>
      `;
    }

    if (state.quotes.length === 0) {
      return `
        <div class="empty-message" role="status" aria-live="polite">
          <strong>No quotes yet</strong>
          <p>Request a quote to start a vendor conversation for this business.</p>
          <button type="button" class="btn ghost" data-open-quote-form>Request Quote</button>
        </div>
      `;
    }

    return state.quotes
      .map(
        (quote) => `
      <div class="quote-card" data-quote-id="${quote.id}">
        <div class="quote-header">
          <h4 class="quote-service">${escapeHtml(quote.serviceNeeded)}</h4>
          <span class="quote-status status-${quote.status}">
            ${formatStatus(quote.status)}
          </span>
        </div>

        <div class="quote-details">
          <div class="detail-row">
            <span class="detail-label">Budget:</span>
            <span class="detail-value">${escapeHtml(quote.budget)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Timeline:</span>
            <span class="detail-value">${escapeHtml(quote.timeline)}</span>
          </div>
          ${
            quote.description
              ? `
            <div class="detail-row full">
              <span class="detail-label">Details:</span>
              <p class="detail-value">${escapeHtml(quote.description)}</p>
            </div>
          `
              : ""
          }
        </div>

        <div class="quote-date">
          Requested: ${formatDate(quote.createdAt)}
          ${quote.respondedAt ? ` • Responded: ${formatDate(quote.respondedAt)}` : ""}
        </div>

        ${
          quote.response
            ? `
          <div class="quote-response">
            <h5>Business Response</h5>
            <p>${escapeHtml(quote.response)}</p>
          </div>
        `
            : ""
        }

        ${
          quote.status === "pending"
            ? `
          <div class="quote-actions">
            <button
              class="btn ghost quote-action-btn"
              data-quote-id="${quote.id}"
              data-status="accepted"
              ${state.pendingAction === `status-${quote.id}` ? "disabled" : ""}
            >
              ✓ Accept
            </button>
            <div class="quote-row-menu">
              <button
                class="btn ghost btn-row-menu"
                data-quote-id="${quote.id}"
                data-action="toggle-menu"
                aria-label="More quote actions"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                ⋯
              </button>
              <div class="quote-row-menu-panel hidden" role="menu">
                <button
                  class="btn ghost quote-action-btn"
                  data-quote-id="${quote.id}"
                  data-status="rejected"
                  role="menuitem"
                  ${state.pendingAction === `status-${quote.id}` ? "disabled" : ""}
                >
                  ✕ Decline
                </button>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `
      )
      .join("");
  }
}

/**
 * Format quote status
 */
function formatStatus(status) {
  const labels = {
    pending: "⏳ Pending",
    quoted: "📋 Quoted",
    accepted: "✓ Accepted",
    rejected: "✕ Rejected"
  };
  return labels[status] || status;
}

/**
 * Cleanup function
 * Called by business-detail.js on route change or business change.
 * @export
 */
export function cleanup() {
  if (closeMenuHandler) {
    document.removeEventListener("click", closeMenuHandler);
    closeMenuHandler = null;
  }
}
