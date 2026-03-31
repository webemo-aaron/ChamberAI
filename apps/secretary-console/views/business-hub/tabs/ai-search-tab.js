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
 * Exported function: render(container, options)
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { navigate } from "../../../core/router.js";
import { escapeHtml, formatDate } from "../../common/format.js";

/**
 * Render AI search tab
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 */
export function render(container, options = {}) {
  const { business = {} } = options;

  // State
  const state = {
    relatedMeetings: [],
    relatedBusinesses: [],
    loading: true,
    error: null,
    notice: null,
    searchCompleted: false
  };

  loadRelatedContent();

  /**
   * Load related content from AI search
   */
  async function loadRelatedContent() {
    state.loading = true;
    state.error = null;
    state.notice = {
      tone: "info",
      title: "Refreshing AI Context",
      message: "Scanning indexed meetings and related signals for this business."
    };
    renderView();

    try {
      // Search for meetings mentioning this business
      const meetingsResponse = await request(
        `/api/ai-search/business?businessId=${business.id}`,
        "GET",
        null,
        { suppressAlert: true }
      );
      if (!meetingsResponse || meetingsResponse.error) {
        throw new Error(meetingsResponse?.error || "AI search unavailable");
      }
      state.relatedMeetings = meetingsResponse.data || meetingsResponse || [];
      state.searchCompleted = true;
      state.notice = {
        tone: "success",
        title: "AI Search Updated",
        message:
          state.relatedMeetings.length > 0
            ? `Found ${state.relatedMeetings.length} related meeting records for this business.`
            : "No indexed meeting mentions were found for this business yet."
      };
    } catch (error) {
      console.error("Failed to load related content:", error);
      state.error = "Verify the API base or AI index readiness, then retry.";
      state.notice = {
        tone: "warning",
        title: "AI Search Unavailable",
        message: "The related-meetings index could not be reached for this business."
      };
      showToast("AI search unavailable", "error");
    } finally {
      state.loading = false;
      renderView();
    }
  }

  /**
   * Handle meeting click
   */
  function handleMeetingClick(meetingId) {
    navigate(`/meetings/${meetingId}`);
  }

  /**
   * Render the AI search tab view
   */
  function renderView() {
    container.innerHTML = `
      <div class="ai-search-tab-content">
        <div class="ai-search-header">
          <div>
            <h3>AI Search</h3>
            <p class="ai-search-subtitle">Find meetings where this business was discussed, mentioned, or surfaced by relevance ranking.</p>
          </div>
          <button class="btn ghost" id="refreshAiSearchBtn" ${state.loading ? "disabled" : ""}>
            Refresh
          </button>
        </div>
        ${
          state.notice
            ? `
              <div
                class="ai-search-notice ai-search-notice--${state.notice.tone}"
                role="${state.notice.tone === "warning" ? "alert" : "status"}"
                aria-live="${state.notice.tone === "warning" ? "assertive" : "polite"}"
              >
                <strong>${state.notice.title}</strong>
                <p>${state.notice.message}</p>
              </div>
            `
            : ""
        }
        ${renderContent()}
      </div>
    `;

    // Attach event listeners
    container.querySelector("#refreshAiSearchBtn")?.addEventListener("click", loadRelatedContent);
    container.querySelectorAll("[data-retry-ai-search]").forEach((button) => {
      button.addEventListener("click", loadRelatedContent);
    });

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
        <div class="ai-search-loading" role="status" aria-live="polite">
          <p>Searching for related meetings...</p>
          <div class="loading-spinner"></div>
        </div>
      `;
    }

    if (state.error) {
      return `
        <div class="ai-search-error" role="alert">
          <strong>Unable to run AI search</strong>
          <p>${escapeHtml(state.error)}</p>
          <button type="button" class="btn ghost" data-retry-ai-search>Retry</button>
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
            <div class="empty-state" role="status" aria-live="polite">
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
 * Format relevance score (0-1 to percentage)
 */
function formatRelevance(score) {
  if (typeof score !== "number") return "N/A";
  const percentage = Math.round(score * 100);
  return `${percentage}%`;
}

/**
 * Cleanup function — no-op for this tab
 * Called by business-detail.js on route change or business change.
 * @export
 */
export function cleanup() {
  // No document listeners, no open modals, no async state
}
