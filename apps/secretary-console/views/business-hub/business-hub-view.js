/**
 * Business Hub View Handler
 *
 * Route handler for the business hub feature. Coordinates:
 * - Loading business list and detail data
 * - Managing list/detail view state
 * - Handling business selection events
 * - Initializing and managing tab state
 * - Route navigation (back button behavior)
 *
 * Route: /business-hub, /business-hub/:id
 */

import { request } from "../../core/api.js";
import { getCurrentRole } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";
import { initBusinessList } from "./business-list.js";
import { createBusinessDetail, renderBusinessDetail, cleanup as cleanupBusinessDetail } from "./business-detail.js";
import {
  getSelectedShowcaseCity,
  filterBusinessesByShowcaseCity,
  setSelectedShowcaseCity
} from "../common/showcase-city-context.js";
import { attachPaneSplitter } from "../common/pane-splitter.js";

/**
 * Module-level state
 */
let allBusinesses = [];
let currentBusiness = null;
let listPane = null;
let detailPane = null;
let unsubscribers = [];
let removePaneSplitter = null;

/**
 * Main business hub view handler
 * @param {Object} params - Route parameters (may include {id: businessId})
 * @param {Object} context - Router context
 */
export async function businessHubHandler(params, context) {
  const role = getCurrentRole();
  if (!role) {
    navigate("/login");
    return;
  }

  try {
    // Get container
    const container = document.getElementById("businessHubView");
    if (!container) {
      console.error("businessHubView container not found");
      return;
    }

    container.classList.remove("hidden");
    container.innerHTML = "";

    // Create main layout container
    const mainLayout = document.createElement("div");
    mainLayout.className = "business-hub-layout";
    mainLayout.setAttribute("role", "main");

    // Create list pane
    listPane = document.createElement("div");
    listPane.className = "business-hub-list-pane";
    listPane.id = "businessListPane";

    // Create detail pane
    detailPane = document.createElement("div");
    detailPane.className = "business-hub-detail-pane";
    detailPane.id = "businessDetailPane";

    mainLayout.appendChild(listPane);
    const splitter = document.createElement("div");
    splitter.className = "pane-splitter";
    splitter.setAttribute("role", "separator");
    splitter.setAttribute("aria-orientation", "vertical");
    splitter.setAttribute("aria-label", "Resize business list panel");
    mainLayout.appendChild(splitter);
    mainLayout.appendChild(detailPane);
    container.appendChild(mainLayout);
    removePaneSplitter = attachPaneSplitter(mainLayout, {
      storageKey: "camBusinessListWidth",
      variableName: "--business-list-width",
      defaultWidth: 380,
      minWidth: 320,
      maxWidth: 560
    });

    // Initialize business list
    initBusinessList(listPane, {
      selectedBusinessId: params.id || null,
      onSelectBusiness: handleSelectBusiness,
      onBusinessesLoaded: (businesses) => {
        allBusinesses = businesses;

        if (
          params.id &&
          !businesses.some((business) => String(business.id) === String(params.id))
        ) {
          currentBusiness = null;
          renderDetailEmptyState(
            detailPane,
            "Business not found",
            "The selected business is no longer available in this workspace."
          );
        }
      }
    });

    // Initialize business detail (empty initially)
    renderDetailEmptyState(
      detailPane,
      "Select a business",
      `Choose a business from ${getSelectedShowcaseCity().label} to manage visibility, reviews, quotes, relationships, and communications.`
    );

    // Wire showcase city changed listener
    unsubscribers.push(listenForShowcaseCityChanged(mainLayout));

    // If ID in URL, load that business
    if (params.id) {
      await handleSelectBusiness(params.id);
    }

    // Wire cleanup on route change
    context?.onCleanup?.(() => cleanup());
  } catch (error) {
    console.error("Business hub handler error:", error);
    showToast("Failed to initialize business hub", "error");
  }

  // Handle business selection from list
  async function handleSelectBusiness(businessId) {
    try {
      renderDetailLoadingState(detailPane);

      // Load business detail
      const response = await request(`/business-listings/${businessId}`, "GET", null, {
        suppressAlert: true
      });
      if (!response || response.error) {
        throw new Error(response?.error || "Business detail unavailable");
      }
      currentBusiness = response;

      // Update URL
      navigate(`/business-hub/${businessId}`);

      // Create and render detail with new business
      if (detailPane && currentBusiness) {
        const detailContainer = createBusinessDetail(currentBusiness);
        detailPane.innerHTML = "";
        detailPane.appendChild(detailContainer);

        renderBusinessDetail(
          detailContainer,
          currentBusiness,
          "profile",
          () => {}, // onTabChange
          (updatedBusiness) => {
            currentBusiness = updatedBusiness;
          }
        );
      }
    } catch (error) {
      console.error("Failed to load business detail:", error);
      renderDetailErrorState(detailPane, () => handleSelectBusiness(businessId));
      showToast("Failed to load business details", "error");
    }
  }
}

/**
 * Listen for showcase city changes
 */
function listenForShowcaseCityChanged(layout) {
  const handler = (event) => {
    const cityId = event.detail?.cityId;
    if (cityId) {
      const selectedCity = setSelectedShowcaseCity(cityId);
      // Filter businesses in the coordinator's state
      // Note: business-list handles its own re-render
      showToast(`Businesses scoped to ${selectedCity.label}`);
    }
  };
  layout.addEventListener("showcase-city-changed", handler);
  return () => layout.removeEventListener("showcase-city-changed", handler);
}

/**
 * Cleanup function for route change
 */
function cleanup() {
  cleanupBusinessDetail();
  unsubscribers.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Error during unsubscriber cleanup:", e);
    }
  });
  unsubscribers = [];
  allBusinesses = [];
  currentBusiness = null;
  listPane = null;
  detailPane = null;
  if (removePaneSplitter) {
    removePaneSplitter();
    removePaneSplitter = null;
  }
}

function renderDetailLoadingState(container) {
  container.innerHTML = `
    <div class="business-detail-empty business-detail-state">
      <div>
        <strong>Loading business details...</strong>
        <p>Pulling the latest visibility, relationship, and chamber-support context.</p>
      </div>
    </div>
  `;
}

function renderDetailEmptyState(container, title, message) {
  container.innerHTML = `
    <div class="business-detail-empty business-detail-state">
      <div>
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
    </div>
  `;
}

function renderDetailErrorState(container, onRetry) {
  container.innerHTML = `
    <div class="business-detail-empty business-detail-state business-detail-state--error">
      <div>
        <strong>Unable to load business details</strong>
        <p>Verify the API base or retry the business detail request.</p>
        <button type="button" id="retryBusinessDetailBtn" class="btn ghost">Retry</button>
      </div>
    </div>
  `;

  container.querySelector("#retryBusinessDetailBtn")?.addEventListener("click", onRetry);
}
