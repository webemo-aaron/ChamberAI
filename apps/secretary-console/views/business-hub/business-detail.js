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
 * Exported functions: createBusinessDetail, renderBusinessDetail, cleanup
 */

import { navigate } from "../../core/router.js";
import {
  inferShowcaseCityFromBusiness,
  setSelectedShowcaseCity
} from "../common/showcase-city-context.js";

const TAB_KEYS = ["profile", "geographic", "reviews", "quotes", "ai-search"];
const TAB_LABELS = {
  profile: "Profile",
  geographic: "Geographic",
  reviews: "Reviews",
  quotes: "Quotes",
  "ai-search": "AI Search"
};

/**
 * Module-level state
 */
const loadedModules = new Map();
let currentBusiness = null;
let activeTab = "profile";

/**
 * Create business detail DOM structure
 * @param {Object} business - Business data object
 * @returns {HTMLElement} Container element
 */
export function createBusinessDetail(business) {
  const container = document.createElement("div");
  if (!business) {
    container.innerHTML = `
      <div class="business-detail-empty">
        <p>Select a business to view details</p>
      </div>
    `;
    return container;
  }

  container.innerHTML = `
    <div class="business-detail-wrapper">
      <!-- Header -->
      <div class="business-detail-header">
        <div class="business-header-info">
          <span class="business-detail-eyebrow">Business Workspace</span>
          <h2 class="business-name">${business.name}</h2>
          <p class="business-header-lede">
            ${business.description || "Member profile, service context, and chamber response workflow."}
          </p>
          <div class="business-header-meta">
            ${
              business.category
                ? `<span class="biz-category-pill">${business.category}</span>`
                : ""
            }
            ${
              business.rating
                ? `<span class="business-rating">⭐ ${business.rating.toFixed(1)}</span>`
                : ""
            }
          </div>
        </div>
        <div class="business-header-actions">
          <button
            class="btn btn-secondary"
            id="bizGeoBtn"
            aria-label="Open Geo Intelligence"
            title="Open Geo Intelligence"
          >
            Geo Intelligence
          </button>
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

      <div class="business-summary-strip">
        <article class="business-summary-card">
          <span class="business-summary-label">Location</span>
          <strong>${business.city || "Unknown city"}, ${business.state || "ME"}</strong>
        </article>
        <article class="business-summary-card">
          <span class="business-summary-label">Contact</span>
          <strong>${business.phone || "No phone listed"}</strong>
        </article>
        <article class="business-summary-card">
          <span class="business-summary-label">Digital</span>
          <strong>${business.website || business.email || "No web presence listed"}</strong>
        </article>
      </div>

      <!-- Tab Bar -->
      <div class="business-tab-bar" role="tablist" aria-label="Business information tabs">
        ${TAB_KEYS.map(
          (key) => `
          <button
            class="tab"
            data-tab="${key}"
            role="tab"
            aria-selected="false"
            aria-controls="tab-${key}"
            tabindex="-1"
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
            class="business-tab-panel hidden"
            role="tabpanel"
            aria-labelledby="tab-${key}"
            data-loaded="false"
          >
            <!-- Content rendered by tab module -->
          </div>
        `
        ).join("")}
      </div>
    </div>
  `;

  return container;
}

/**
 * Render business detail and wire event handlers
 * @param {HTMLElement} container - Container element
 * @param {Object} business - Business data object
 * @param {string} selectedTab - Initially active tab (default: "profile")
 * @param {Function} onTabChange - Callback when tab changes
 * @param {Function} onBusinessUpdated - Callback when business is updated
 */
export function renderBusinessDetail(
  container,
  business,
  selectedTab = "profile",
  onTabChange = () => {},
  onBusinessUpdated = () => {}
) {
  currentBusiness = business;
  activeTab = selectedTab;

  // Update tab states
  container.querySelectorAll(".business-tab-bar .tab").forEach((btn) => {
    const tabKey = btn.dataset.tab;
    const isActive = tabKey === selectedTab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
    btn.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  container.querySelectorAll(".business-tab-panel").forEach((panel) => {
    const tabKey = panel.id.replace("tab-", "");
    const isActive = tabKey === selectedTab;
    panel.classList.toggle("hidden", !isActive);
    panel.classList.toggle("active", isActive);
  });

  // Attach tab click handlers
  container.querySelectorAll(".business-tab-bar .tab").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const tabKey = btn.dataset.tab;
      if (activeTab === tabKey) return; // Already active

      activeTab = tabKey;
      onTabChange(tabKey);

      // Update tab states
      container.querySelectorAll(".business-tab-bar .tab").forEach((b) => {
        const isActive = b.dataset.tab === tabKey;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-selected", String(isActive));
        b.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      container.querySelectorAll(".business-tab-panel").forEach((panel) => {
        const panelTabKey = panel.id.replace("tab-", "");
        const isActive = panelTabKey === tabKey;
        panel.classList.toggle("hidden", !isActive);
        panel.classList.toggle("active", isActive);
      });

      await switchTab(tabKey, container, onBusinessUpdated);
    });
  });

  // Attach back button handler
  const backBtn = container.querySelector("#bizBackBtn");
  const geoBtn = container.querySelector("#bizGeoBtn");
  if (geoBtn) {
    geoBtn.addEventListener("click", () => {
      const inferredCity = inferShowcaseCityFromBusiness(currentBusiness);
      if (inferredCity) {
        setSelectedShowcaseCity(inferredCity.id);
      }
      navigate("/geo-intelligence");
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  // Load active tab content
  switchTab(selectedTab, container, onBusinessUpdated);
}

/**
 * Switch to tab and load module if needed
 * @param {string} tabId - Tab ID
 * @param {HTMLElement} container - Container element
 * @param {Function} onBusinessUpdated - Callback when business is updated
 */
async function switchTab(tabId, container, onBusinessUpdated) {
  const panel = container.querySelector(`#tab-${tabId}`);
  if (!panel) return;

  // Check if already loaded
  if (panel.dataset.loaded === "true") {
    return;
  }

  // Load module and render
  const module = await loadTabModule(tabId);
  if (module && module.render) {
    module.render(panel, {
      business: currentBusiness,
      onBusinessUpdated: (updated) => {
        currentBusiness = updated;
        onBusinessUpdated(updated);
      }
    });
    panel.dataset.loaded = "true";
  }
}

/**
 * Load tab module dynamically with caching
 * @param {string} tabId - Tab ID
 * @returns {Promise<Object>} Module with render and cleanup functions
 */
async function loadTabModule(tabId) {
  if (loadedModules.has(tabId)) {
    return loadedModules.get(tabId);
  }

  try {
    let module;
    switch (tabId) {
      case "profile":
        module = await import("./tabs/profile-tab.js");
        break;
      case "geographic":
        module = await import("./tabs/geographic-tab.js");
        break;
      case "reviews":
        module = await import("./tabs/reviews-tab.js");
        break;
      case "quotes":
        module = await import("./tabs/quotes-tab.js");
        break;
      case "ai-search":
        module = await import("./tabs/ai-search-tab.js");
        break;
      default:
        return null;
    }
    loadedModules.set(tabId, module);
    return module;
  } catch (error) {
    console.error(`Failed to load tab module: ${tabId}`, error);
    return null;
  }
}

/**
 * Cleanup function
 * Called by business-hub-view.js on route change or business change.
 * @export
 */
export function cleanup() {
  // Call cleanup on all loaded modules
  loadedModules.forEach((module) => {
    if (module.cleanup) {
      try {
        module.cleanup();
      } catch (e) {
        console.error("Error during module cleanup:", e);
      }
    }
  });
  loadedModules.clear();
  currentBusiness = null;
  activeTab = "profile";
}
