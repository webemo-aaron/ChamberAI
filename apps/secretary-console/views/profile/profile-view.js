import { getCurrentRole, getCurrentUser, setRole } from "../../core/auth.js";
import { getEffectiveTier } from "../../billing.js";
import { showToast } from "../../core/toast.js";

export function profileHandler() {
  const container = document.getElementById("utilityView");
  if (!container) {
    return;
  }

  const user = getCurrentUser();
  const tier = getEffectiveTier();

  container.innerHTML = `
    <div class="utility-page" role="main">
      <section class="panel utility-hero">
        <span class="utility-eyebrow">Account</span>
        <h1>Profile</h1>
        <p>Identity, role, and operator context for this ChamberAI workspace.</p>
      </section>

      <section class="panel utility-spotlight">
        <div class="utility-spotlight-copy">
          <span class="utility-spotlight-eyebrow">Operator Identity</span>
          <h2>${user.displayName || user.email || "Chamber Operator"}</h2>
          <p>The active identity used for board operations, member support, and dashboard personalization.</p>
        </div>
        <div class="utility-pill-row">
          <span class="utility-pill">${getCurrentRole() || "guest"} role</span>
          <span class="utility-pill">${tier} tier</span>
        </div>
      </section>

      <section class="utility-grid utility-grid--account">
        <article class="panel utility-card">
          <h2>Identity</h2>
          <p>Update the operator name shown across the ChamberAI workspace.</p>
          <form id="profileForm" class="utility-form">
            <label class="utility-form-group">
              <span>Display name</span>
              <input id="profileDisplayName" class="utility-form-input" type="text" placeholder="Alex Secretary" />
            </label>
            <label class="utility-form-group">
              <span>Email</span>
              <input class="utility-form-input" type="email" value="${user.email || ""}" readonly />
            </label>
            <label class="utility-form-group">
              <span>Role</span>
              <input class="utility-form-input" type="text" value="${getCurrentRole() || "guest"}" readonly />
            </label>
            <div class="utility-action-row">
              <button type="submit" class="utility-action">Save Profile</button>
            </div>
          </form>
        </article>

        <article class="panel utility-card">
          <h2>Workspace Context</h2>
          <p>Current identity attributes used throughout the console.</p>
          <div class="utility-metric-row">
            <div class="utility-metric">
              <span>Display</span>
              <strong id="profileDisplayMetric">${user.displayName || "Not set"}</strong>
            </div>
            <div class="utility-metric">
              <span>Email</span>
              <strong>${user.email || "guest@chamberai.local"}</strong>
            </div>
            <div class="utility-metric">
              <span>Tier</span>
              <strong>${tier}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  `;

  const displayNameInput = document.getElementById("profileDisplayName");
  const form = document.getElementById("profileForm");
  const displayMetric = document.getElementById("profileDisplayMetric");

  displayNameInput.value = user.displayName || "";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const displayName = displayNameInput.value.trim();
    setRole(getCurrentRole() || "guest", user.email || "", displayName);
    displayMetric.textContent = displayName || "Not set";
    showToast("Profile updated");
  });
}
