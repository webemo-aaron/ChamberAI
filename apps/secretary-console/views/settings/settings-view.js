/**
 * Settings Route Handler - Phase 3
 *
 * Provides a tabbed settings interface for:
 * - Feature flags management
 * - Retention & limits configuration
 * - Email invitations
 * - Motion integration settings
 *
 * Route: /settings
 */

import { request, showToast } from "../../core/api.js";
import { getCurrentRole } from "../../core/auth.js";
import { navigate } from "../../core/router.js";
import { renderFeatureFlags } from "./feature-flags.js";
import { renderRetentionTab } from "./retention-tab.js";
import { renderInviteTab } from "./invite-tab.js";
import { renderMotionIntegrationTab } from "./motion-integration-tab.js";

/**
 * Create the settings container with tabbed interface
 * @returns {HTMLElement} The settings page container
 */
function renderSettingsPage() {
  // Main settings container
  const settingsPage = document.createElement("div");
  settingsPage.className = "settings-page";
  settingsPage.setAttribute("role", "main");

  // Header section
  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("h1");
  title.className = "settings-title";
  title.textContent = "Settings";

  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent = "Manage feature flags, retention policies, invitations, and integrations";

  header.appendChild(title);
  header.appendChild(description);

  // Tab navigation bar
  const tabBar = document.createElement("div");
  tabBar.className = "settings-tab-bar";
  tabBar.setAttribute("role", "tablist");

  const tabs = [
    { id: "feature-flags", label: "Feature Flags" },
    { id: "retention", label: "Retention & Limits" },
    { id: "invites", label: "Invitations" },
    { id: "motion", label: "Motion Integration" }
  ];

  tabs.forEach((tab, index) => {
    const tabButton = document.createElement("button");
    tabButton.className = "settings-tab";
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-selected", index === 0 ? "true" : "false");
    tabButton.setAttribute("aria-controls", `${tab.id}-panel`);
    tabButton.dataset.tab = tab.id;
    tabButton.tabIndex = index === 0 ? 0 : -1;
    tabButton.textContent = tab.label;
    tabBar.appendChild(tabButton);
  });

  // Tab panels container
  const panelsContainer = document.createElement("div");
  panelsContainer.className = "settings-panels";

  // Feature Flags Panel
  const featureFlagsPanel = document.createElement("div");
  featureFlagsPanel.id = "feature-flags-panel";
  featureFlagsPanel.className = "settings-panel active";
  featureFlagsPanel.setAttribute("role", "tabpanel");
  featureFlagsPanel.setAttribute("aria-labelledby", "feature-flags");

  // Retention Panel
  const retentionPanel = document.createElement("div");
  retentionPanel.id = "retention-panel";
  retentionPanel.className = "settings-panel";
  retentionPanel.setAttribute("role", "tabpanel");
  retentionPanel.setAttribute("aria-labelledby", "retention");

  // Invites Panel
  const invitesPanel = document.createElement("div");
  invitesPanel.id = "invites-panel";
  invitesPanel.className = "settings-panel";
  invitesPanel.setAttribute("role", "tabpanel");
  invitesPanel.setAttribute("aria-labelledby", "invites");

  // Motion Panel
  const motionPanel = document.createElement("div");
  motionPanel.id = "motion-panel";
  motionPanel.className = "settings-panel";
  motionPanel.setAttribute("role", "tabpanel");
  motionPanel.setAttribute("aria-labelledby", "motion");

  panelsContainer.appendChild(featureFlagsPanel);
  panelsContainer.appendChild(retentionPanel);
  panelsContainer.appendChild(invitesPanel);
  panelsContainer.appendChild(motionPanel);

  // Save button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "settings-actions";

  const saveBtn = document.createElement("button");
  saveBtn.id = "saveSettingsBtn";
  saveBtn.className = "btn btn-primary";
  saveBtn.type = "button";
  saveBtn.textContent = "Save Settings";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-ghost";
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";

  buttonContainer.appendChild(saveBtn);
  buttonContainer.appendChild(cancelBtn);

  // Assemble page
  settingsPage.appendChild(header);
  settingsPage.appendChild(tabBar);
  settingsPage.appendChild(panelsContainer);
  settingsPage.appendChild(buttonContainer);

  return settingsPage;
}

/**
 * Set up tab switching logic
 * @param {HTMLElement} container - Settings page container
 */
function setupTabSwitching(container) {
  const tabs = container.querySelectorAll(".settings-tab");
  const panels = container.querySelectorAll(".settings-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;

      // Update tab active state
      tabs.forEach((t) => {
        const isActive = t.dataset.tab === tabId;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", isActive ? "true" : "false");
        t.tabIndex = isActive ? 0 : -1;
      });

      // Update panel visibility
      panels.forEach((panel) => {
        const panelId = panel.id.replace("-panel", "");
        panel.classList.toggle("active", panelId === tabId);
      });
    });

    // Allow arrow key navigation
    tab.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const currentIndex = Array.from(tabs).indexOf(tab);
        const nextIndex = event.key === "ArrowRight" ? currentIndex + 1 : currentIndex - 1;
        const nextTab = tabs[nextIndex % tabs.length];
        if (nextTab) nextTab.click();
      }
    });
  });
}

/**
 * Load current settings from API and populate all tabs
 * @async
 * @returns {Promise<Object>} Settings object
 */
async function loadSettings() {
  try {
    const response = await request("/settings", "GET");
    return response || {};
  } catch (error) {
    console.error("Failed to load settings:", error);
    showToast("Failed to load settings", { type: "error" });
    return {};
  }
}

/**
 * Collect all tab values and save to API
 * @async
 * @param {HTMLElement} container - Settings page container
 * @returns {Promise<boolean>} True if save succeeded
 */
async function saveAllSettings(container) {
  try {
    // Collect values from each tab
    const featureFlagsPanel = container.querySelector("#feature-flags-panel");
    const retentionPanel = container.querySelector("#retention-panel");
    const invitesPanel = container.querySelector("#invites-panel");
    const motionPanel = container.querySelector("#motion-panel");

    // Gather settings from each tab's collect function
    const settings = {};

    // Feature flags
    const flagCheckboxes = featureFlagsPanel.querySelectorAll("input[type='checkbox']");
    flagCheckboxes.forEach((checkbox) => {
      settings[checkbox.id] = checkbox.checked;
    });

    // Retention & limits
    const retentionInputs = retentionPanel.querySelectorAll("input[type='number'], input[type='text']");
    retentionInputs.forEach((input) => {
      if (input.id) {
        settings[input.id] = input.type === "number" ? parseInt(input.value, 10) : input.value;
      }
    });

    // Invitations
    const inviteInputs = invitesPanel.querySelectorAll("input[type='text'], input[type='email'], textarea");
    inviteInputs.forEach((input) => {
      if (input.id) {
        settings[input.id] = input.value;
      }
    });

    // Motion integration
    const motionInputs = motionPanel.querySelectorAll("input[type='text'], input[type='checkbox']");
    motionInputs.forEach((input) => {
      if (input.id) {
        settings[input.id] = input.type === "checkbox" ? input.checked : input.value;
      }
    });

    // Save to API
    await request("/settings", "PUT", settings);
    showToast("Settings saved successfully", { type: "success" });
    return true;
  } catch (error) {
    console.error("Failed to save settings:", error);
    showToast("Failed to save settings", { type: "error" });
    return false;
  }
}

/**
 * Main settings route handler
 * Called by router when navigating to /settings
 * @async
 * @param {Object} params - Route parameters (empty for /settings)
 * @param {Object} context - Router context with navigate function
 */
export async function settingsHandler(params, context) {
  // Check authentication
  if (!getCurrentRole()) {
    context.router.navigate("/login");
    return;
  }

  // Get main containers
  const meetingsView = document.getElementById("meetingsView");
  const businessHubView = document.getElementById("businessHubView");

  // Hide both main views
  if (meetingsView) meetingsView.classList.add("hidden");
  if (businessHubView) businessHubView.classList.add("hidden");

  // Get or create settings container
  let settingsContainer = document.getElementById("settingsPageContainer");
  if (!settingsContainer) {
    settingsContainer = document.createElement("div");
    settingsContainer.id = "settingsPageContainer";
    document.body.insertBefore(settingsContainer, document.querySelector(".shell"));
  }

  // Render settings page
  settingsContainer.innerHTML = "";
  const settingsPage = renderSettingsPage();
  settingsContainer.appendChild(settingsPage);

  // Set up tab switching
  setupTabSwitching(settingsContainer);

  // Load and populate settings
  const currentSettings = await loadSettings();

  // Populate feature flags tab
  const featureFlagsPanel = settingsContainer.querySelector("#feature-flags-panel");
  renderFeatureFlags(featureFlagsPanel, currentSettings);

  // Populate retention tab
  const retentionPanel = settingsContainer.querySelector("#retention-panel");
  renderRetentionTab(retentionPanel, currentSettings);

  // Populate invites tab
  const invitesPanel = settingsContainer.querySelector("#invites-panel");
  renderInviteTab(invitesPanel, currentSettings);

  // Populate motion integration tab
  const motionPanel = settingsContainer.querySelector("#motion-panel");
  renderMotionIntegrationTab(motionPanel, currentSettings);

  // Set up event handlers
  const saveBtn = settingsContainer.querySelector("#saveSettingsBtn");
  const cancelBtn = settingsContainer.querySelector(".btn-ghost");

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const success = await saveAllSettings(settingsContainer);
      if (success) {
        setTimeout(() => {
          context.router.navigate("/meetings");
        }, 500);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      context.router.navigate("/meetings");
    });
  }

  showToast("Settings loaded", { type: "info" });
}
