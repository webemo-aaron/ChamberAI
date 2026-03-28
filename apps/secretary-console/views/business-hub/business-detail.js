/**
 * Business Detail Component
 *
 * Renders the business detail view with:
 * - Business name, rating, contact info (header)
 * - Tab selector (Profile, Geographic, Reviews, Quotes, AI Search)
 * - Tab panel container for active tab content
 * - Lazy-loads tab modules on first activation
 * - Handles tab switching logic
 *
 * Exported function: initBusinessDetail(container, options)
 */

import { initProfileTab } from "./tabs/profile-tab.js";
import { initGeographicTab } from "./tabs/geographic-tab.js";
import { initReviewsTab } from "./tabs/reviews-tab.js";
import { initQuotesTab } from "./tabs/quotes-tab.js";
import { initAiSearchTab } from "./tabs/ai-search-tab.js";

const TAB_KEYS = ["profile", "geographic", "reviews", "quotes", "ai-search"];
const TAB_LABELS = {
  profile: "Profile",
  geographic: "Geographic",
  reviews: "Reviews",
  quotes: "Quotes",
  "ai-search": "AI Search"
};

/**
 * Initialize business detail component
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Object} options.business - Business data object
 * @param {string} options.activeTab - Initially active tab (default: "profile")
 * @param {Function} options.onTabChange - Callback when tab changes
 */
export function initBusinessDetail(container, options = {}) {
  const { business = null, activeTab = "profile", onTabChange = () => {} } = options;

  // If no business, show empty state
  if (!business) {
    container.innerHTML = `
      <div class="business-detail-empty">
        <p>Select a business to view details</p>
      </div>
    `;
    return;
  }

  // State
  const state = {
    business,
    activeTab,
    loadedTabs: new Set() // Track which tabs have been initialized
  };

  // Tab initializers
  const tabInitializers = {
    profile: initProfileTab,
    geographic: initGeographicTab,
    reviews: initReviewsTab,
    quotes: initQuotesTab,
    "ai-search": initAiSearchTab
  };

  render();

  /**
   * Handle tab activation
   */
  function handleTabClick(tabKey) {
    if (state.activeTab === tabKey) return; // Already active

    state.activeTab = tabKey;
    onTabChange(tabKey);
    render();
  }

  /**
   * Render detail view
   */
  function render() {
    container.innerHTML = `
      <div class="business-detail-wrapper">
        <!-- Header -->
        <div class="business-detail-header">
          <div class="business-header-info">
            <h2 class="business-name">${state.business.name}</h2>
            <div class="business-header-meta">
              ${
                state.business.category
                  ? `<span class="biz-category-pill">${state.business.category}</span>`
                  : ""
              }
              ${
                state.business.rating
                  ? `<span class="business-rating">⭐ ${state.business.rating.toFixed(1)}</span>`
                  : ""
              }
            </div>
          </div>
          <div class="business-header-actions">
            <button
              class="btn ghost"
              id="bizBackBtn"
              aria-label="Back to list"
              title="Back to list"
            >
              ← Back
            </button>
          </div>
        </div>

        <!-- Tab Bar -->
        <div class="business-tab-bar" role="tablist" aria-label="Business information tabs">
          ${TAB_KEYS.map(
            (key) => `
            <button
              class="tab ${state.activeTab === key ? "active" : ""}"
              data-tab="${key}"
              role="tab"
              aria-selected="${state.activeTab === key}"
              aria-controls="tab-${key}"
              tabindex="${state.activeTab === key ? 0 : -1}"
            >
              ${TAB_LABELS[key]}
            </button>
          `
          ).join("")}
        </div>

        <!-- Tab Panels -->
        <div class="business-tab-panels">
          ${TAB_KEYS.map(
            (key) => `
            <div
              id="tab-${key}"
              class="business-tab-panel ${state.activeTab === key ? "active" : ""}"
              role="tabpanel"
              aria-labelledby="tab-${key}"
              style="display: ${state.activeTab === key ? "block" : "none"}"
            >
              <!-- Content rendered by tab module -->
            </div>
          `
          ).join("")}
        </div>
      </div>
    `;

    // Attach tab click handlers
    container.querySelectorAll(".business-tab-bar .tab").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabKey = btn.dataset.tab;
        handleTabClick(tabKey);
      });
    });

    // Attach back button handler
    const backBtn = container.querySelector("#bizBackBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        // Navigation handled by parent (business-hub-view)
        // Just clear selected ID by navigating to list-only view
        window.history.back();
      });
    }

    // Load active tab content
    loadTabContent(state.activeTab);
  }

  /**
   * Load tab content (lazy-load)
   */
  function loadTabContent(tabKey) {
    const panel = container.querySelector(`#tab-${tabKey}`);
    if (!panel) return;

    // Only load once
    if (state.loadedTabs.has(tabKey)) {
      return;
    }

    state.loadedTabs.add(tabKey);

    // Get initializer and render
    const initializer = tabInitializers[tabKey];
    if (initializer) {
      initializer(panel, { business: state.business });
    }
  }
}
