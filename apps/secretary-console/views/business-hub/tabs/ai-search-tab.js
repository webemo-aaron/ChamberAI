/**
 * AI Search Tab Component
 *
 * Displays meetings and content related to a business:
 * - AI-powered search for relevant meetings
 * - Related meetings list with relevance scores
 * - Click meeting to navigate to meeting detail
 * - Show count of related items
 * - Relevance indicators
 *
 * Exported function: initAiSearchTab(container, options)
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { navigate } from "../../../core/router.js";

/**
 * Initialize AI search tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function initAiSearchTab(container, options = {}) {
  const { business = {} } = options;

  // State
  const state = {
    relatedMeetings: [],
    relatedBusinesses: [],
    loading: true,
    error: null,
    searchCompleted: false
  };

  loadRelatedContent();

  /**
   * Load related content from AI search
   */
  async function loadRelatedContent() {
    state.loading = true;
    state.error = null;
    render();

    try {
      // Search for meetings mentioning this business
      const meetingsResponse = await request(
        "GET",
        `/api/ai-search/business?businessId=${business.id}`
      );
      state.relatedMeetings = meetingsResponse.data || [];
      state.searchCompleted = true;
    } catch (error) {
      console.error("Failed to load related content:", error);
      state.error = "Failed to search related content";
      // Don't show error toast - this is optional feature
    } finally {
      state.loading = false;
      render();
    }
  }

  /**
   * Handle meeting click
   */
  function handleMeetingClick(meetingId) {
    navigate(`/meetings/${meetingId}`);
  }

  /**
   * Render the AI search tab
   */
  function render() {
    container.innerHTML = `
      <div class="ai-search-tab-content">
        ${renderContent()}
      </div>
    `;

    // Attach event listeners
    container.querySelectorAll(".related-meeting-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const meetingId = link.dataset.meetingId;
        handleMeetingClick(meetingId);
      });
    });
  }

  /**
   * Render tab content
   */
  function renderContent() {
    if (state.loading) {
      return `
        <div class="ai-search-loading">
          <p>Searching for related meetings...</p>
          <div class="loading-spinner"></div>
        </div>
      `;
    }

    if (state.error) {
      return `
        <div class="ai-search-error">
          <p>${escapeHtml(state.error)}</p>
        </div>
      `;
    }

    return `
      <div class="ai-search-results">
        <!-- Related Meetings Section -->
        ${
          state.relatedMeetings.length > 0
            ? `
          <section class="ai-search-section">
            <h3>Related Meetings (${state.relatedMeetings.length})</h3>
            <p class="section-description">
              Meetings where ${escapeHtml(business.name)} was mentioned or discussed
            </p>
            <div class="related-meetings-list">
              ${state.relatedMeetings
                .map(
                  (meeting, index) => `
                <article class="related-meeting-item" data-index="${index}">
                  <a
                    href="#/meetings/${meeting.id}"
                    class="related-meeting-link"
                    data-meeting-id="${meeting.id}"
                  >
                    <div class="meeting-info">
                      <h4 class="meeting-title">${escapeHtml(meeting.title)}</h4>
                      <p class="meeting-date">${formatDate(meeting.date)}</p>
                      ${
                        meeting.location
                          ? `<p class="meeting-location">📍 ${escapeHtml(meeting.location)}</p>`
                          : ""
                      }
                    </div>
                    ${
                      meeting.relevanceScore
                        ? `
                      <div class="relevance-badge">
                        <span class="relevance-label">Relevance</span>
                        <span class="relevance-score">${formatRelevance(meeting.relevanceScore)}</span>
                      </div>
                    `
                        : ""
                    }
                  </a>
                </article>
              `
                )
                .join("")}
            </div>
          </section>
        `
            : `
          <section class="ai-search-section">
            <div class="empty-state">
              <p class="empty-title">No related meetings found</p>
              <p class="empty-description">
                This business hasn't been mentioned in any meetings yet
              </p>
            </div>
          </section>
        `
        }

        <!-- AI Insights -->
        <section class="ai-search-section">
          <h3>AI Insights</h3>
          <div class="ai-insights">
            <div class="insight-card">
              <span class="insight-label">Business mentions:</span>
              <span class="insight-value">${state.relatedMeetings.length}</span>
            </div>
            ${
              state.relatedMeetings.length > 0
                ? `
              <div class="insight-card">
                <span class="insight-label">Last mentioned:</span>
                <span class="insight-value">
                  ${formatDate(state.relatedMeetings[0].date)}
                </span>
              </div>
            `
                : ""
            }
          </div>
        </section>

        <!-- Help Section -->
        <section class="ai-search-section">
          <h3>About this search</h3>
          <div class="search-help">
            <p>
              The AI Search feature automatically finds meetings where this business
              was discussed or mentioned. This helps you understand the business's
              involvement in governance activities.
            </p>
            <p class="help-hint">
              💡 Tip: Meetings are indexed automatically. Check back later if no
              results appear for a newly added business.
            </p>
          </div>
        </section>
      </div>
    `;
  }
}

/**
 * Format date
 */
function formatDate(dateStr) {
  if (!dateStr) return "Unknown date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Format relevance score (0-1 to percentage)
 */
function formatRelevance(score) {
  if (typeof score !== "number") return "N/A";
  const percentage = Math.round(score * 100);
  return `${percentage}%`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
