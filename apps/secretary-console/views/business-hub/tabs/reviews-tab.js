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
 * Exported function: initReviewsTab(container, options)
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { getCurrentRole } from "../../../core/auth.js";

/**
 * Initialize reviews tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function initReviewsTab(container, options = {}) {
  const { business = {} } = options;
  const role = getCurrentRole();
  const isAdmin = role === "admin";

  // State
  const state = {
    reviews: [],
    filteredReviews: [],
    loading: true,
    error: null,
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
      const response = await request("GET", `/api/business-listings/${business.id}/reviews`);
      state.reviews = response.data || [];
      applyFiltersAndSort();
    } catch (error) {
      console.error("Failed to load reviews:", error);
      state.error = "Failed to load reviews";
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
      await request("POST", `/api/business-listings/${business.id}/reviews/${state.selectedReviewId}/draft-response`, {
        response: responseText
      });
      showToast("Response submitted successfully");
      state.selectedReviewId = null;
      render();
      loadReviews(); // Reload to show response
    } catch (error) {
      console.error("Failed to submit response:", error);
      showToast("Failed to submit response", "error");
    }
  }

  /**
   * Handle delete review
   */
  async function handleDeleteReview(reviewId) {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await request("DELETE", `/api/business-listings/${business.id}/reviews/${reviewId}`);
      showToast("Review deleted successfully");
      loadReviews();
    } catch (error) {
      console.error("Failed to delete review:", error);
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

    if (filterSelect) filterSelect.addEventListener("change", handleFilterChange);
    if (sortSelect) sortSelect.addEventListener("change", handleSortChange);

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
  }

  /**
   * Render list content
   */
  function renderContent() {
    if (state.loading) {
      return '<div class="loading-message">Loading reviews...</div>';
    }

    if (state.error) {
      return `<div class="error-message">${state.error}</div>`;
    }

    if (state.filteredReviews.length === 0) {
      return '<div class="empty-message">No reviews yet</div>';
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
              >
                💬 Draft Response
              </button>
            `
                : ""
            }
            <button
              class="btn ghost review-action-btn"
              data-review-id="${review.id}"
              data-action="delete"
            >
              🗑️ Delete
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
          <button class="btn" id="submitResponseBtn">Submit Response</button>
          <button class="btn ghost" id="cancelResponseBtn">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const submitBtn = modal.querySelector("#submitResponseBtn");
    const cancelBtn = modal.querySelector("#cancelResponseBtn");

    submitBtn.addEventListener("click", async () => {
      await handleSubmitResponse();
      modal.remove();
    });

    cancelBtn.addEventListener("click", () => {
      state.selectedReviewId = null;
      modal.remove();
    });

    // Focus on textarea
    setTimeout(() => {
      modal.querySelector("#responseText").focus();
    }, 0);
  }
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
