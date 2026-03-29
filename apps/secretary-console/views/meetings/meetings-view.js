/**
 * Meetings Route Handler - Phase 5
 *
 * Coordinator that orchestrates the meetings list and detail views.
 * Implements the Coordinator Pattern:
 * - Manages routing between list and detail views
 * - Loads meetings data via API
 * - Wires component communication via custom events
 * - Handles cleanup on route change
 *
 * Route: /meetings and /meetings/:id
 */

import { request } from "../../core/api.js";
import { navigate } from "../../core/router.js";
import { showToast } from "../../core/toast.js";
import { createMeetingList, renderMeetingsList } from "./meeting-list.js";
import {
  createMeetingDetail,
  renderMeetingDetail,
  cleanup as cleanupMeetingDetail
} from "./meeting-detail.js";
import { attachPaneSplitter } from "../common/pane-splitter.js";
import {
  filterMeetingsByShowcaseCity,
  getSelectedShowcaseCity,
  setSelectedShowcaseCity
} from "../common/showcase-city-context.js";

// State management
let currentMeetings = [];
let currentMeeting = null;
let allMeetings = [];
let listContainer = null;
let detailContainer = null;
let unsubscribers = [];
let removePaneSplitter = null;

/**
 * Route handler for /meetings and /meetings/:id
 * Orchestrates list + detail rendering with custom event coordination
 *
 * @param {Object} params - Route parameters (may include id)
 * @param {Object} context - Router context
 */
export async function meetingsHandler(params, context) {
  // 1. Get/create main container
  const container = document.getElementById("meetingsView");
  if (!container) {
    console.error("Meeting view container not found");
    return;
  }

  // Clear previous content
  container.innerHTML = "";
  unsubscribers = [];

  // 2. Create layout (2-col desktop, stacked mobile)
  const layout = document.createElement("div");
  layout.className = "meetings-layout";
  layout.setAttribute("role", "main");

  // 3. Create list pane
  listContainer = createMeetingList();
  layout.appendChild(listContainer);

  const splitter = document.createElement("div");
  splitter.className = "pane-splitter";
  splitter.setAttribute("role", "separator");
  splitter.setAttribute("aria-orientation", "vertical");
  splitter.setAttribute("aria-label", "Resize meetings list panel");
  layout.appendChild(splitter);

  // 4. Load meetings list
  try {
    showToast("Loading meetings...");
    const response = await request("/meetings", "GET");
    allMeetings = response.data || response || [];
    currentMeetings = filterMeetingsByShowcaseCity(allMeetings, getSelectedShowcaseCity());
    renderMeetingsList(listContainer, currentMeetings, params.id);
    showToast("Meetings loaded");
  } catch (error) {
    showToast(`Failed to load meetings: ${error.message}`, { type: "error" });
    console.error("[Meetings] API error:", error);
    renderMeetingsList(listContainer, [], params.id);
  }

  // 5. Create detail pane if :id provided or will be created on selection
  if (params.id) {
    try {
      showToast("Loading meeting detail...");
      const response = await request(`/meetings/${params.id}`, "GET");
      currentMeeting = response.data || response;

      detailContainer = createMeetingDetail(currentMeeting);
      layout.appendChild(detailContainer);
      renderMeetingDetail(detailContainer, currentMeeting, "minutes");

      showToast("Meeting loaded");
    } catch (error) {
      showToast(`Failed to load meeting: ${error.message}`, { type: "error" });
      console.error("[Meeting Detail] API error:", error);
    }
  }

  container.appendChild(layout);
  removePaneSplitter = attachPaneSplitter(layout, {
    storageKey: "camMeetingsListWidth",
    variableName: "--meetings-list-width",
    defaultWidth: 360,
    minWidth: 320,
    maxWidth: 520
  });

  // 6. Wire list→detail communication
  const listUnsubscriber = listenForMeetingSelected(layout);
  unsubscribers.push(listUnsubscriber);

  // 7. Wire refresh listener
  const refreshUnsubscriber = listenForRefreshRequested(layout);
  unsubscribers.push(refreshUnsubscriber);

  const cityUnsubscriber = listenForShowcaseCityChanged(layout);
  unsubscribers.push(cityUnsubscriber);

  // 8. Cleanup on route change
  context?.onCleanup?.(() => {
    cleanup();
  });
}

/**
 * Listen for meeting-selected event from list
 * Navigate to /meetings/:id
 *
 * @param {HTMLElement} layout - Layout container
 * @returns {Function} Unsubscriber function
 */
function listenForMeetingSelected(layout) {
  const handler = (event) => {
    if (event.detail?.id) {
      navigate(`/meetings/${event.detail.id}`);
    }
  };

  layout.addEventListener("meeting-selected", handler);

  return () => {
    layout.removeEventListener("meeting-selected", handler);
  };
}

/**
 * Listen for refresh-requested event from list
 * Reload meetings data
 *
 * @param {HTMLElement} layout - Layout container
 * @returns {Function} Unsubscriber function
 */
function listenForRefreshRequested(layout) {
  const handler = async () => {
    try {
      showToast("Refreshing meetings...");
      const response = await request("/meetings", "GET");
      allMeetings = response.data || response || [];
      currentMeetings = filterMeetingsByShowcaseCity(allMeetings, getSelectedShowcaseCity());
      renderMeetingsList(listContainer, currentMeetings);
      showToast("Meetings refreshed");
    } catch (error) {
      showToast(`Failed to refresh: ${error.message}`, { type: "error" });
    }
  };

  layout.addEventListener("refresh-requested", handler);

  return () => {
    layout.removeEventListener("refresh-requested", handler);
  };
}

function listenForShowcaseCityChanged(layout) {
  const handler = (event) => {
    const selectedCity = setSelectedShowcaseCity(event.detail?.cityId);
    currentMeetings = filterMeetingsByShowcaseCity(allMeetings, selectedCity);
    renderMeetingsList(listContainer, currentMeetings);
    showToast(`Meetings scoped to ${selectedCity.label}`);
  };

  layout.addEventListener("showcase-city-changed", handler);

  return () => {
    layout.removeEventListener("showcase-city-changed", handler);
  };
}

/**
 * Clean up resources on unmount
 */
function cleanup() {
  // Clean up meeting detail (tab modules, etc.)
  cleanupMeetingDetail();

  // Remove all event listeners
  unsubscribers.forEach((unsub) => {
    try {
      unsub();
    } catch (error) {
      console.error("[Meetings Cleanup] Error:", error);
    }
  });
  unsubscribers = [];

  // Clear state
  currentMeetings = [];
  currentMeeting = null;
  allMeetings = [];
  listContainer = null;
  detailContainer = null;
  removePaneSplitter?.();
  removePaneSplitter = null;
}
