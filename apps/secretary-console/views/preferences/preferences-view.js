import { navigate } from "../../core/router.js";
import { showToast } from "../../core/toast.js";

const PREFERENCE_KEYS = {
  landing: "camPreferenceLanding",
  reviewMode: "camPreferenceReviewMode",
  notifications: "camPreferenceNotifications"
};

export function getSavedPreferences() {
  return {
    landing: localStorage.getItem(PREFERENCE_KEYS.landing) || "/dashboard",
    reviewMode: localStorage.getItem(PREFERENCE_KEYS.reviewMode) || "Operational",
    notifications: localStorage.getItem(PREFERENCE_KEYS.notifications) || "Focused"
  };
}

export function getPreferredLandingRoute() {
  return getSavedPreferences().landing;
}

export function preferencesHandler() {
  const container = document.getElementById("utilityView");
  if (!container) {
    return;
  }

  const preferences = getSavedPreferences();

  container.innerHTML = `
    <div class="utility-page" role="main">
      <section class="panel utility-hero">
        <span class="utility-eyebrow">Account</span>
        <h1>Preferences</h1>
        <p>Personal workspace behavior, landing defaults, and focused operating habits.</p>
      </section>

      <section class="panel utility-spotlight">
        <div class="utility-spotlight-copy">
          <span class="utility-spotlight-eyebrow">Operator Defaults</span>
          <h2>Workspace Preferences</h2>
          <p>Set the routes and behaviors the console should prefer when you return to work.</p>
        </div>
        <div class="utility-pill-row">
          <span class="utility-pill">${preferences.reviewMode} review</span>
          <span class="utility-pill">${preferences.notifications} notifications</span>
        </div>
      </section>

      <section class="utility-grid utility-grid--account">
        <article class="panel utility-card">
          <h2>Workspace Defaults</h2>
          <p>Choose how ChamberAI should open and how your weekly review loop should feel.</p>
          <form id="preferencesForm" class="utility-form">
            <label class="utility-form-group">
              <span>Landing route</span>
              <select id="preferenceLanding" class="utility-form-input">
                <option value="/dashboard">Dashboard</option>
                <option value="/meetings">Meetings</option>
                <option value="/business-hub">Business Hub</option>
                <option value="/analytics">Analytics</option>
                <option value="/billing">Billing</option>
                <option value="/settings">Settings</option>
              </select>
            </label>
            <label class="utility-form-group">
              <span>Review mode</span>
              <select id="preferenceReviewMode" class="utility-form-input">
                <option value="Operational">Operational</option>
                <option value="Compliance">Compliance</option>
                <option value="Executive">Executive</option>
              </select>
            </label>
            <label class="utility-form-group">
              <span>Notification profile</span>
              <select id="preferenceNotifications" class="utility-form-input">
                <option value="Focused">Focused</option>
                <option value="Balanced">Balanced</option>
                <option value="Verbose">Verbose</option>
              </select>
            </label>
            <div class="utility-action-row">
              <button type="submit" class="utility-action">Save Preferences</button>
              <button type="button" id="resetPreferences" class="utility-action">Reset</button>
            </div>
          </form>
        </article>

        <article class="panel utility-card">
          <h2>What This Changes</h2>
          <p>These settings apply immediately inside the operations workspace.</p>
          <div class="utility-metric-row">
            <div class="utility-metric">
              <span>Next landing</span>
              <strong id="preferenceLandingMetric">${preferences.landing.replace("/", "") || "dashboard"}</strong>
            </div>
            <div class="utility-metric">
              <span>Review style</span>
              <strong id="preferenceReviewMetric">${preferences.reviewMode}</strong>
            </div>
            <div class="utility-metric">
              <span>Notifications</span>
              <strong id="preferenceNotificationMetric">${preferences.notifications}</strong>
            </div>
          </div>
          <div class="utility-action-row">
            <button type="button" id="openPreferredRoute" class="utility-action">Open Preferred Route</button>
          </div>
        </article>
      </section>
    </div>
  `;

  const landingInput = document.getElementById("preferenceLanding");
  const reviewModeInput = document.getElementById("preferenceReviewMode");
  const notificationsInput = document.getElementById("preferenceNotifications");
  const form = document.getElementById("preferencesForm");
  const resetButton = document.getElementById("resetPreferences");
  const openPreferredRoute = document.getElementById("openPreferredRoute");

  landingInput.value = preferences.landing;
  reviewModeInput.value = preferences.reviewMode;
  notificationsInput.value = preferences.notifications;

  function updateMetrics() {
    document.getElementById("preferenceLandingMetric").textContent =
      landingInput.value.replace("/", "") || "dashboard";
    document.getElementById("preferenceReviewMetric").textContent =
      reviewModeInput.value;
    document.getElementById("preferenceNotificationMetric").textContent =
      notificationsInput.value;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem(PREFERENCE_KEYS.landing, landingInput.value);
    localStorage.setItem(PREFERENCE_KEYS.reviewMode, reviewModeInput.value);
    localStorage.setItem(PREFERENCE_KEYS.notifications, notificationsInput.value);
    updateMetrics();
    showToast("Preferences saved");
  });

  resetButton.addEventListener("click", () => {
    localStorage.removeItem(PREFERENCE_KEYS.landing);
    localStorage.removeItem(PREFERENCE_KEYS.reviewMode);
    localStorage.removeItem(PREFERENCE_KEYS.notifications);
    landingInput.value = "/dashboard";
    reviewModeInput.value = "Operational";
    notificationsInput.value = "Focused";
    updateMetrics();
    showToast("Preferences reset");
  });

  openPreferredRoute.addEventListener("click", () => {
    navigate(landingInput.value);
  });
}
