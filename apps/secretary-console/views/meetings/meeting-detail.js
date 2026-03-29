/**
 * Meeting Detail Component - Phase 5
 *
 * Manages the detail view with tabbed interface.
 * Renders header, tab bar, and lazy-loads tab content.
 *
 * Tabs:
 * - Minutes: Editor for meeting notes
 * - Action Items: Task tracking
 * - Motions: Voting records
 * - Audit: Change log
 * - Public Summary: Shareable summary
 *
 * Tab modules are lazy-loaded on first click for performance.
 */

import { createMeetingDetailHeader, updateMeetingDetailHeader } from "./meeting-detail-header.js";

// State
const loadedModules = new Map();
let currentMeeting = null;
let activeTab = "minutes";

/**
 * Create meeting detail pane structure
 * @param {Object} meeting - Meeting data
 * @returns {HTMLElement} Detail pane container
 */
export function createMeetingDetail(meeting) {
  currentMeeting = meeting;

  const detailPane = document.createElement("div");
  detailPane.className = "meeting-detail-pane";
  detailPane.setAttribute("role", "region");
  detailPane.setAttribute("aria-label", `Meeting details for ${meeting.location}`);

  // Header
  const header = createMeetingDetailHeader(meeting);
  detailPane.appendChild(header);

  // Tab bar
  const tabBar = createTabBar();
  detailPane.appendChild(tabBar);

  // Tab panels container
  const panelsContainer = document.createElement("div");
  panelsContainer.className = "detail-panels";
  panelsContainer.setAttribute("role", "tabpanel");

  // Create empty panels (will be populated on tab click)
  const tabs = [
    { id: "minutes", label: "Minutes" },
    { id: "actions", label: "Actions" },
    { id: "motions", label: "Motions" },
    { id: "audit", label: "Audit" },
    { id: "public-summary", label: "Summary" }
  ];

  tabs.forEach((tab) => {
    const panel = document.createElement("div");
    panel.id = `${tab.id}-panel`;
    panel.className = `detail-panel ${tab.id === "minutes" ? "active" : "hidden"}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `tab-${tab.id}`);
    panel.dataset.tab = tab.id;
    panel.dataset.loaded = "false";
    panelsContainer.appendChild(panel);
  });

  detailPane.appendChild(panelsContainer);

  return detailPane;
}

/**
 * Render and wire the detail pane
 * @param {HTMLElement} container - Detail pane container
 * @param {Object} meeting - Meeting data
 * @param {String} selectedTab - Initially active tab (default: minutes)
 */
export function renderMeetingDetail(container, meeting, selectedTab = "minutes") {
  currentMeeting = meeting;
  activeTab = selectedTab;

  const tabBar = container.querySelector(".detail-tab-bar");
  const panelsContainer = container.querySelector(".detail-panels");

  if (!tabBar || !panelsContainer) {
    console.error("[Meeting Detail] Tab bar or panels container not found");
    return;
  }

  const tabs = [
    { id: "minutes", label: "Minutes" },
    { id: "actions", label: "Actions" },
    { id: "motions", label: "Motions" },
    { id: "audit", label: "Audit" },
    { id: "public-summary", label: "Summary" }
  ];

  // Wire tab buttons
  tabs.forEach((tab) => {
    const button = tabBar.querySelector(`[data-tab="${tab.id}"]`);
    if (!button) return;

    button.addEventListener("click", async () => {
      await switchTab(tab.id, container);
    });

    // Keyboard support (arrow keys)
    button.addEventListener("keydown", (e) => {
      const allTabs = Array.from(tabBar.querySelectorAll("[data-tab]"));
      const currentIndex = allTabs.indexOf(button);

      if (e.key === "ArrowRight" && currentIndex < allTabs.length - 1) {
        e.preventDefault();
        allTabs[currentIndex + 1].focus();
        allTabs[currentIndex + 1].click();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        allTabs[currentIndex - 1].focus();
        allTabs[currentIndex - 1].click();
      }
    });
  });

  container.addEventListener("meeting-tab-requested", async (event) => {
    const requestedTab = event.detail?.tabId;
    if (requestedTab) {
      await switchTab(requestedTab, container);
    }
  });

  // Load initial tab
  switchTab(selectedTab, container);
}

/**
 * Switch to a different tab
 * Lazy-loads the tab module on first access
 * @param {String} tabId - Tab identifier
 * @param {HTMLElement} container - Detail pane container
 */
async function switchTab(tabId, container) {
  const tabBar = container.querySelector(".detail-tab-bar");
  const panelsContainer = container.querySelector(".detail-panels");

  if (!tabBar || !panelsContainer) return;

  // Update tab active states
  tabBar.querySelectorAll("[data-tab]").forEach((btn) => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.tabIndex = isActive ? 0 : -1;
  });

  // Update panel visibility
  panelsContainer.querySelectorAll(".detail-panel").forEach((panel) => {
    const isActive = panel.dataset.tab === tabId;
    panel.classList.toggle("hidden", !isActive);
    panel.classList.toggle("active", isActive);
  });

  // Load tab content if not loaded
  const panel = panelsContainer.querySelector(`#${tabId}-panel`);
  if (panel && panel.dataset.loaded === "false") {
    try {
      const module = await loadTabModule(tabId);
      if (module?.render) {
        panel.innerHTML = ""; // Clear any loading state
        await module.render(panel, currentMeeting);
        panel.dataset.loaded = "true";
      }
    } catch (error) {
      console.error(`[Tab ${tabId}] Failed to load:`, error);
      panel.innerHTML = `<p class="error">Failed to load ${tabId} tab: ${error.message}</p>`;
    }
  }

  activeTab = tabId;
}

/**
 * Create tab bar with buttons
 * @returns {HTMLElement} Tab bar element
 */
function createTabBar() {
  const tabBar = document.createElement("div");
  tabBar.className = "detail-tab-bar";
  tabBar.setAttribute("role", "tablist");
  tabBar.setAttribute("aria-label", "Meeting tabs");

  const tabs = [
    { id: "minutes", label: "Minutes", icon: "📝" },
    { id: "actions", label: "Actions", icon: "✓" },
    { id: "motions", label: "Motions", icon: "🗳" },
    { id: "audit", label: "Audit", icon: "📋" },
    { id: "public-summary", label: "Summary", icon: "📄" }
  ];

  tabs.forEach((tab, index) => {
    const button = document.createElement("button");
    button.className = `detail-tab ${index === 0 ? "active" : ""}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    button.setAttribute("aria-controls", `${tab.id}-panel`);
    button.setAttribute("data-tab", tab.id);
    button.tabIndex = index === 0 ? 0 : -1;
    button.title = tab.label;
    button.innerHTML = `<span class="tab-icon">${tab.icon}</span><span class="tab-label">${tab.label}</span>`;
    tabBar.appendChild(button);
  });

  return tabBar;
}

/**
 * Lazy-load tab module
 * Modules are cached after first load
 * @param {String} tabId - Tab identifier
 * @returns {Promise<Object>} Module with render function
 */
async function loadTabModule(tabId) {
  if (loadedModules.has(tabId)) {
    return loadedModules.get(tabId);
  }

  const modules = {
    minutes: () => import("./tabs/minutes-tab.js"),
    actions: () => import("./tabs/action-items-tab.js"),
    motions: () => import("./tabs/motions-tab.js"),
    audit: () => import("./tabs/audit-tab.js"),
    "public-summary": () => import("./tabs/public-summary-tab.js")
  };

  if (!modules[tabId]) {
    throw new Error(`Unknown tab: ${tabId}`);
  }

  const module = await modules[tabId]();
  loadedModules.set(tabId, module);
  return module;
}

/**
 * Get current active tab
 * @returns {String} Active tab ID
 */
export function getActiveTab() {
  return activeTab;
}

/**
 * Update meeting data (for when meeting is updated)
 * @param {Object} meeting - Updated meeting data
 */
export function updateMeeting(meeting) {
  // If the meeting changed, clean up loaded modules and force re-render
  if (currentMeeting?.id !== meeting?.id) {
    // Call cleanup on all loaded tab modules
    for (const [, mod] of loadedModules) {
      mod.cleanup?.();
    }
    // Clear the module cache
    loadedModules.clear();
    // Reset data-loaded attributes so tabs re-render when switched
    const container = document.querySelector(".meeting-detail-pane");
    if (container) {
      container.querySelectorAll(".detail-panel[data-loaded]").forEach((panel) => {
        panel.setAttribute("data-loaded", "false");
      });
    }
  }

  currentMeeting = meeting;
  const container = document.querySelector(".meeting-detail-pane");
  if (container) {
    updateMeetingDetailHeader(container, meeting);
  }
}

/**
 * Cleanup function — calls cleanup on all loaded tab modules and clears state.
 * Called by meetings-view.js during route teardown.
 * @export
 */
export function cleanup() {
  // Call cleanup on all loaded tab modules
  for (const [, mod] of loadedModules) {
    mod.cleanup?.();
  }
  // Clear the module cache
  loadedModules.clear();
  currentMeeting = null;
  activeTab = "minutes";
}
