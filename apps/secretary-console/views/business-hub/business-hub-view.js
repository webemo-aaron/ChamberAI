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
import { initBusinessDetail } from "./business-detail.js";

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
    const listPane = document.createElement("div");
    listPane.className = "business-hub-list-pane";
    listPane.id = "businessListPane";

    // Create detail pane
    const detailPane = document.createElement("div");
    detailPane.className = "business-hub-detail-pane";
    detailPane.id = "businessDetailPane";

    mainLayout.appendChild(listPane);
    mainLayout.appendChild(detailPane);
    container.appendChild(mainLayout);

    // Coordinator state
    const state = {
      selectedBusinessId: params.id || null,
      activeTab: "profile",
      businesses: [],
      currentBusiness: null,
      loading: false,
      error: null
    };

    // Initialize business list
    initBusinessList(listPane, {
      onSelectBusiness: handleSelectBusiness
    });

    // Initialize business detail (empty initially)
    initBusinessDetail(detailPane, {
      onTabChange: (tabKey) => {
        state.activeTab = tabKey;
      }
    });

    // If ID in URL, load that business
    if (params.id) {
      await handleSelectBusiness(params.id);
    }

    // Handle business selection from list
    async function handleSelectBusiness(businessId) {
      try {
        state.selectedBusinessId = businessId;
        state.activeTab = "profile";

        // Load business detail
        const response = await request("GET", `/api/business-listings/${businessId}`);
        state.currentBusiness = response;

        // Update URL
        navigate(`/business-hub/${businessId}`);

        // Update detail pane with new business
        const detailEl = document.getElementById("businessDetailPane");
        if (detailEl && state.currentBusiness) {
          detailEl.innerHTML = "";
          initBusinessDetail(detailEl, {
            business: state.currentBusiness,
            activeTab: state.activeTab,
            onTabChange: (tabKey) => {
              state.activeTab = tabKey;
            }
          });
        }
      } catch (error) {
        console.error("Failed to load business detail:", error);
        showToast("Failed to load business details", "error");
      }
    }

    // Clean up on unmount
    return () => {
      container.classList.add("hidden");
      container.innerHTML = "";
    };
  } catch (error) {
    console.error("Business hub handler error:", error);
    showToast("Failed to initialize business hub", "error");
  }
}
