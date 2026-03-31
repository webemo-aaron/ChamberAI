/**
 * Reviews Tab Component
 *
 * Displays and manages business reviews:
 * - List of customer reviews with ratings and text
 * - Review metadata (author, date)
 * - Filter by rating
 * - Sort by date
 * - AI response drafting workflow (admin only)
 * - Response modal for composing replies
 * - Delete review functionality (admin only)
 *
 * Exported function: render(container, options)
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { getCurrentRole } from "../../../core/auth.js";
import { escapeHtml, formatDate } from "../../common/format.js";

/**
 * Module-level state for openModal and closeMenuHandler
 */
let openModal = null;
let closeMenuHandler = null;

/**
 * Render reviews tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function render(container, options = {}) {
  const { business = {} } = options;
  const role = getCurrentRole();
  const isAdmin = role === "admin";

  // State
  const state = {
    reviews: [],
    filteredReviews: [],
    loading: true,
    error: null,
    notice: null,
    pendingAction: "",
    filterRating: null,
    sortBy: "date_desc", // date_desc, date_asc, rating_high, rating_low
    selectedReviewId: null
  };

  loadReviews();

  /**
   * Load reviews from API
   */
  async function loadReviews() {
    state.loading = true;
    state.error = null;
    render();

    try {
      const response = await request(`/business-listings/${business.id}/reviews`, "GET", null, {
        suppressAlert: true
      });
      if (!response || response.error) {
        throw new Error(response?.error || "Failed to load reviews");
      }
      state.reviews = response?.data || response || [];
      state.notice = null;
      applyFiltersAndSort();
    } catch (error) {
      console.error("Failed to load reviews:", error);
      state.error = "Verify the API base or backend readiness, then retry.";
      showToast("Failed to load reviews", "error");
    } finally {
      state.loading = false;
      render();
    }
  }

  /**
   * Apply filters and sorting
   */
  function applyFiltersAndSort() {
    let result = [...state.reviews];

    // Apply rating filter
    if (state.filterRating) {
      result = result.filter((review) => review.rating === parseInt(state.filterRating));
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      switch (state.sortBy) {
        case "date_desc":
          return dateB - dateA;
        case "date_asc":
          return dateA - dateB;
        case "rating_high":
          return (b.rating || 0) - (a.rating || 0);
        case "rating_low":
          return (a.rating || 0) - (b.rating || 0);
        default:
          return dateB - dateA;
      }
    });

    state.filteredReviews = result;
    render();
  }

  /**
   * Handle filter change
   */
  function handleFilterChange(event) {
    state.filterRating = event.target.value || null;
    applyFiltersAndSort();
  }

  /**
   * Handle sort change
   */
  function handleSortChange(event) {
    state.sortBy = event.target.value;
    applyFiltersAndSort();
  }

  /**
   * Handle draft response
   */
  function handleDraftResponse(reviewId) {
    state.selectedReviewId = reviewId;
    state.notice = null;
    renderResponseModal();
  }

  /**
   * Submit response
   */
  async function handleSubmitResponse() {
    const responseText = document.querySelector("#responseText")?.value;
    if (!responseText?.trim()) {
      showToast("Please enter a response", "error");
      return;
    }

    try {
      state.pendingAction = `response-${state.selectedReviewId}`;
      state.notice = {
        tone: "info",
        title: "Submitting Response",
        message: "Sending the drafted response to the review workflow."
      };
      render();

      const response = await request(`/business-listings/${business.id}/reviews/${state.selectedReviewId}/draft-response`, "POST", {
        response: responseText
      });
      if (!response || response.error) {
        throw new Error(response?.error || "Failed to submit response");
      }

      showToast("Response submitted successfully");
      state.pendingAction = "";
      state.notice = {
        tone: "success",
        title: "Response Submitted",
        message: "The review response has been recorded for this business."
      };
      state.selectedReviewId = null;
      render();
      loadReviews(); // Reload to show response
    } catch (error) {
      console.error("Failed to submit response:", error);
      state.pendingAction = "";
      state.notice = {
        tone: "warning",
        title: "Response Unavailable",
        message: "The response could not be submitted. Retry when the backend is available."
      };
      render();
      showToast("Failed to submit response", "error");
    }
  }

  /**
   * Handle delete review
   */
  async function handleDeleteReview(reviewId) {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      state.pendingAction = `delete-${reviewId}`;
      state.notice = {
        tone: "info",
        title: "Deleting Review",
        message: "Removing the selected review from the business record."
      };
      render();

      const response = await request(`/business-listings/${business.id}/reviews/${reviewId}`, "DELETE");
      if (response && response.error) {
        throw new Error(response.error);
      }

      showToast("Review deleted successfully");
      state.pendingAction = "";
      state.notice = {
        tone: "success",
        title: "Review Deleted",
        message: "The selected review has been removed."
      };
      loadReviews();
    } catch (error) {
      console.error("Failed to delete review:", error);
      state.pendingAction = "";
      state.notice = {
        tone: "warning",
        title: "Delete Failed",
        message: "The review could not be deleted. Retry when the reviews backend is available."
      };
      render();
      showToast("Failed to delete review", "error");
    }
  }

  /**
   * Render the reviews list
   */
  function render() {
    container.innerHTML = `
      <div class="reviews-tab-content">
        <!-- Controls -->
        <div class="reviews-header">
          <div>
            <h3>Reviews</h3>
            <p class="reviews-subtitle">Track public feedback and respond with chamber-approved messaging.</p>
          </div>
          <div class="surface-primary-actions">
            <button class="btn ghost" id="refreshReviewsBtn" ${state.pendingAction ? "disabled" : ""}>
              Refresh
            </button>
          </div>
        </div>

        ${
          state.notice
            ? `
              <div
                class="reviews-notice reviews-notice--${state.notice.tone}"
                role="${state.notice.tone === "warning" ? "alert" : "status"}"
                aria-live="${state.notice.tone === "warning" ? "assertive" : "polite"}"
              >
                <strong>${state.notice.title}</strong>
                <p>${state.notice.message}</p>
              </div>
            `
            : ""
        }

        <div class="reviews-controls">
          <div class="control-group">
            <label for="reviewFilterRating" class="control-label">Rating:</label>
            <select
              id="reviewFilterRating"
              class="filter-select"
              aria-label="Filter by rating"
            >
              <option value="">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
              <option value="2">⭐⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </select>
          </div>

          <div class="control-group">
            <label for="reviewSortBy" class="control-label">Sort:</label>
            <select
              id="reviewSortBy"
              class="filter-select"
              aria-label="Sort reviews"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="rating_high">Highest Rating</option>
              <option value="rating_low">Lowest Rating</option>
            </select>
          </div>
        </div>

        <!-- Reviews List -->
        <div class="reviews-list">
          ${renderContent()}
        </div>
      </div>
    `;

    // Attach event listeners
    const filterSelect = container.querySelector("#reviewFilterRating");
    const sortSelect = container.querySelector("#reviewSortBy");
    const refreshBtn = container.querySelector("#refreshReviewsBtn");

    if (filterSelect) filterSelect.addEventListener("change", handleFilterChange);
    if (sortSelect) sortSelect.addEventListener("change", handleSortChange);
    if (refreshBtn) refreshBtn.addEventListener("click", loadReviews);

    container.querySelectorAll("[data-retry-reviews]").forEach((button) => {
      button.addEventListener("click", loadReviews);
    });

    // Attach review action handlers
    container.querySelectorAll(".review-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const reviewId = btn.dataset.reviewId;
        const action = btn.dataset.action;

        if (action === "response") {
          handleDraftResponse(reviewId);
        } else if (action === "delete") {
          handleDeleteReview(reviewId);
        }
      });
    });

    container.querySelectorAll('[data-action="toggle-menu"]').forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const menu = btn.parentElement?.querySelector(".review-row-menu-panel");
        if (menu) {
          menu.classList.toggle("hidden");
          btn.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
        }
      });
      btn.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          const menu = btn.parentElement?.querySelector(".review-row-menu-panel");
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
        if (!event.target.closest(".review-row-menu")) {
          container.querySelectorAll(".review-row-menu-panel:not(.hidden)").forEach((panel) => {
            panel.classList.add("hidden");
            panel.closest(".review-row-menu")
              ?.querySelector('[data-action="toggle-menu"]')
              ?.setAttribute("aria-expanded", "false");
          });
        }
      };
      document.addEventListener("click", closeMenuHandler);
    }
  }

  /**
   * Render list content
   */
  function renderContent() {
    if (state.loading) {
      return '<div class="loading-message" role="status" aria-live="polite">Loading reviews...</div>';
    }

    if (state.error) {
      return `
        <div class="error-message" role="alert">
          <strong>Unable to load reviews</strong>
          <p>${state.error}</p>
          <button type="button" class="btn ghost" data-retry-reviews>Retry</button>
        </div>
      `;
    }

    if (state.filteredReviews.length === 0) {
      return `
        <div class="empty-message">
          <strong>No reviews yet</strong>
          <p>Customer feedback will appear here when reviews are available for this business.</p>
        </div>
      `;
    }

    return state.filteredReviews
      .map(
        (review) => `
      <div class="review-card" data-review-id="${review.id}">
        <div class="review-header">
          <div class="review-rating">
            ${Array(5)
              .fill(0)
              .map(
                (_, i) =>
                  `<span class="star ${i < review.rating ? "filled" : ""}">★</span>`
              )
              .join("")}
            <span class="rating-text">${review.rating}/5</span>
          </div>
          <div class="review-meta">
            <span class="review-author">${escapeHtml(review.author || "Anonymous")}</span>
            <span class="review-date">${formatDate(review.createdAt)}</span>
          </div>
        </div>

        <p class="review-text">${escapeHtml(review.text || "")}</p>

        ${
          review.response
            ? `
          <div class="review-response-draft">
            <h4>Business Response</h4>
            <p>${escapeHtml(review.response)}</p>
          </div>
        `
            : ""
        }

        ${
          isAdmin
            ? `
          <div class="review-actions">
            ${
              !review.response
                ? `
              <button
                class="btn ghost review-action-btn"
                data-review-id="${review.id}"
                data-action="response"
                ${state.pendingAction === `response-${review.id}` ? "disabled" : ""}
              >
                💬 Draft Response
              </button>
            `
                : ""
            }
            <div class="review-row-menu">
              <button
                class="btn ghost btn-row-menu"
                data-review-id="${review.id}"
                data-action="toggle-menu"
                aria-label="More review actions"
                aria-haspopup="menu"
                aria-expanded="false"
              >
                ⋯
              </button>
              <div class="review-row-menu-panel hidden" role="menu">
                <button
                  class="btn ghost review-action-btn"
                  data-review-id="${review.id}"
                  data-action="delete"
                  role="menuitem"
                  ${state.pendingAction === `delete-${review.id}` ? "disabled" : ""}
                >
                  🗑️ Delete
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

  /**
   * Render response modal
   */
  function renderResponseModal() {
    const review = state.reviews.find((r) => r.id === state.selectedReviewId);
    if (!review) return;

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Draft Response</h3>
        <div class="modal-body">
          <p class="review-being-responded">
            Responding to ${escapeHtml(review.author || "Anonymous")}'s review:
          </p>
          <p class="review-quote">"${escapeHtml(review.text || "")}"</p>
          <textarea
            id="responseText"
            class="response-textarea"
            placeholder="Type your response here..."
            rows="6"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn" id="submitResponseBtn">${state.pendingAction ? "Submitting..." : "Submit Response"}</button>
          <button class="btn ghost" id="cancelResponseBtn">Cancel</button>
        </div>
      </div>
    `;

    openModal = modal;
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      openModal = null;
      state.selectedReviewId = null;
    };

    const submitBtn = modal.querySelector("#submitResponseBtn");
    const cancelBtn = modal.querySelector("#cancelResponseBtn");

    submitBtn.addEventListener("click", async () => {
      await handleSubmitResponse();
      closeModal();
    });

    cancelBtn.addEventListener("click", closeModal);

    // Backdrop click dismissal
    modal.querySelector(".modal-overlay")?.addEventListener("click", closeModal);

    // Escape key dismissal
    const escapeHandler = (event) => {
      if (event.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    // Focus on textarea
    setTimeout(() => {
      modal.querySelector("#responseText").focus();
    }, 0);
  }
}

/**
 * Cleanup function
 * Called by business-detail.js on route change or business change.
 * @export
 */
export function cleanup() {
  openModal?.remove();
  openModal = null;
  if (closeMenuHandler) {
    document.removeEventListener("click", closeMenuHandler);
    closeMenuHandler = null;
  }
}
