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
 * Exported function: initQuotesTab(container, options)
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { getCurrentRole } from "../../../core/auth.js";

/**
 * Initialize quotes tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function initQuotesTab(container, options = {}) {
  const { business = {} } = options;
  const role = getCurrentRole();

  // State
  const state = {
    quotes: [],
    loading: true,
    error: null,
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
      const response = await request("GET", `/api/business-listings/${business.id}/quotes`);
      state.quotes = response.data || [];
    } catch (error) {
      console.error("Failed to load quotes:", error);
      state.error = "Failed to load quotes";
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
      await request("POST", `/api/business-listings/${business.id}/quotes`, {
        serviceNeeded,
        budget,
        timeline,
        description: state.formData.description
      });

      showToast("Quote request submitted successfully");
      state.showForm = false;
      state.formData = {
        serviceNeeded: "",
        budget: "",
        timeline: "",
        description: ""
      };
      loadQuotes();
    } catch (error) {
      console.error("Failed to submit quote request:", error);
      showToast("Failed to submit quote request", "error");
    }
  }

  /**
   * Handle quote status update
   */
  async function handleUpdateQuoteStatus(quoteId, newStatus) {
    try {
      await request("PUT", `/api/business-listings/${business.id}/quotes/${quoteId}`, {
        status: newStatus
      });
      showToast(`Quote ${newStatus} successfully`);
      loadQuotes();
    } catch (error) {
      console.error("Failed to update quote status:", error);
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
          <h3>Quote Requests</h3>
          <button
            class="btn ${state.showForm ? "ghost" : ""}"
            id="toggleFormBtn"
          >
            ${state.showForm ? "✕ Cancel" : "+ Request Quote"}
          </button>
        </div>

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
                  Send Quote Request
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

    if (toggleBtn) toggleBtn.addEventListener("click", toggleForm);
    if (submitBtn) submitBtn.addEventListener("click", handleSubmitQuote);
    if (cancelBtn) cancelBtn.addEventListener("click", toggleForm);

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
  }

  /**
   * Render quotes list
   */
  function renderQuotesList() {
    if (state.loading) {
      return '<div class="loading-message">Loading quotes...</div>';
    }

    if (state.error) {
      return `<div class="error-message">${state.error}</div>`;
    }

    if (state.quotes.length === 0) {
      return '<div class="empty-message">No quotes yet. Request a quote to get started!</div>';
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
            >
              ✓ Accept
            </button>
            <button
              class="btn ghost quote-action-btn"
              data-quote-id="${quote.id}"
              data-status="rejected"
            >
              ✕ Decline
            </button>
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
 * Format date
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
