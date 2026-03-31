/**
 * Billing Module for Secretary Console
 * Handles subscription management, tier display, and upgrade flows
 */

const TIER_STORAGE_KEY = "camUserTier";
const TIER_PREVIEW_KEY = "camTierPreview";
const VALID_TIERS = ["Free", "Pro", "Council", "Network"];

export function normalizeTierLabel(tier = "Free") {
  const normalized = String(tier || "Free").trim().toLowerCase();
  if (normalized === "pro") return "Pro";
  if (normalized === "council") return "Council";
  if (normalized === "network") return "Network";
  return "Free";
}

export function getStoredTier() {
  return normalizeTierLabel(localStorage.getItem(TIER_STORAGE_KEY) || "Free");
}

export function setStoredTier(tier) {
  localStorage.setItem(TIER_STORAGE_KEY, normalizeTierLabel(tier));
}

export function getTierPreview() {
  const preview = localStorage.getItem(TIER_PREVIEW_KEY);
  return preview ? normalizeTierLabel(preview) : "";
}

export function setTierPreview(tier) {
  const normalized = normalizeTierLabel(tier);
  if (!VALID_TIERS.includes(normalized)) {
    return;
  }
  localStorage.setItem(TIER_PREVIEW_KEY, normalized);
}

export function clearTierPreview() {
  localStorage.removeItem(TIER_PREVIEW_KEY);
}

export function getEffectiveTier(liveTier = "") {
  return getTierPreview() || normalizeTierLabel(liveTier || getStoredTier());
}

export class BillingService {
  constructor(apiBase, authToken) {
    this.apiBase = apiBase;
    this.authToken = authToken;
  }

  /**
   * Get current subscription status
   * @returns {Promise<{tier: string, validUntil: string|null, status: string}>}
   */
  async getStatus() {
    const response = await fetch(`${this.apiBase}/billing/status`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    if (!response.ok) throw new Error(`Status check failed: ${response.statusText}`);
    return response.json();
  }

  /**
   * Create checkout session for tier upgrade
   * @param {string} tier - 'pro', 'council', or 'network'
   * @returns {Promise<{url: string}>}
   */
  async createCheckoutSession(tier) {
    const response = await fetch(`${this.apiBase}/billing/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`
      },
      body: JSON.stringify({ tier })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Checkout failed");
    }
    return response.json();
  }

  /**
   * Create billing portal session
   * @returns {Promise<{url: string}>}
   */
  async createPortalSession() {
    const response = await fetch(`${this.apiBase}/billing/portal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    if (!response.ok) throw new Error("Portal session failed");
    return response.json();
  }
}

/**
 * Tier Configuration
 */
export const TIERS = {
  free: {
    name: "Free",
    price: "$0",
    period: "Forever",
    features: [
      "Up to 3 meetings/month",
      "Basic meeting notes",
      "Action item tracking",
      "CSV export"
    ],
    canUpgrade: true
  },
  pro: {
    name: "Pro",
    price: "$9",
    period: "/month",
    features: [
      "Unlimited meetings",
      "Real-time AI minutes",
      "Advanced search",
      "PDF + Markdown export",
      "Audit logs",
      "Priority support"
    ],
    canUpgrade: true,
    upgradeTo: "council"
  },
  council: {
    name: "Council",
    price: "$149",
    period: "/month",
    features: [
      "Everything in Pro",
      "DOCX export",
      "Board analytics dashboard",
      "REST API access",
      "Custom branding",
      "Dedicated support"
    ],
    canUpgrade: true,
    upgradeTo: "network"
  },
  network: {
    name: "Network",
    price: "$399",
    period: "/month",
    features: [
      "Everything in Council",
      "Multi-chamber management",
      "SSO / SAML",
      "Advanced analytics",
      "Custom integrations",
      "Enterprise support"
    ],
    current: true
  }
};

/**
 * Create a tier badge component
 * @param {string} tier - 'free', 'pro', 'council', 'network'
 * @param {boolean} isCurrent - whether this is the current tier
 * @returns {HTMLElement}
 */
export function createTierBadge(tier, isCurrent = false) {
  const badge = document.createElement("span");
  badge.className = `tier-badge tier-${tier}`;
  if (isCurrent) badge.classList.add("current");

  const tierConfig = TIERS[tier];
  badge.textContent = tierConfig.name.toUpperCase();
  badge.title = `${tierConfig.name} Tier`;

  return badge;
}

/**
 * Create a tier card for upgrade UI
 * @param {string} tier - 'free', 'pro', 'council', 'network'
 * @param {function} onUpgrade - callback when upgrade clicked
 * @returns {HTMLElement}
 */
export function createTierCard(tier, onUpgrade) {
  const tierConfig = TIERS[tier];
  const card = document.createElement("div");
  card.className = `tier-card tier-${tier}`;
  if (tierConfig.current) card.classList.add("current");

  card.innerHTML = `
    <div class="tier-card-header">
      <h3>${tierConfig.name}</h3>
      <div class="tier-price">
        <span class="price">${tierConfig.price}</span>
        <span class="period">${tierConfig.period}</span>
      </div>
    </div>
    <ul class="tier-features">
      ${tierConfig.features.map((f) => `<li>${f}</li>`).join("")}
    </ul>
    <div class="tier-card-footer">
      ${
        tierConfig.current
          ? '<button class="btn btn-secondary" disabled>Current Plan</button>'
          : tierConfig.canUpgrade
            ? `<button class="btn btn-primary upgrade-btn" data-tier="${tier}">Upgrade Now</button>`
            : ""
      }
    </div>
  `;

  const upgradeBtn = card.querySelector(".upgrade-btn");
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", () => onUpgrade(tier));
  }

  return card;
}

/**
 * Create billing status widget
 * @param {Object} status - {tier, validUntil, status}
 * @param {function} onManageClick - callback for manage button
 * @returns {HTMLElement}
 */
export function createBillingStatus(status, onManageClick) {
  const widget = document.createElement("div");
  widget.className = `billing-status tier-${status.tier}`;

  const tierConfig = TIERS[status.tier];
  const validUntilText = status.validUntil
    ? new Date(status.validUntil).toLocaleDateString()
    : "Indefinite";

  widget.innerHTML = `
    <div class="billing-status-content">
      <div class="status-tier">
        <span class="label">Current Plan:</span>
        <strong>${tierConfig.name}</strong>
      </div>
      <div class="status-renewal">
        <span class="label">Renewal Date:</span>
        <span class="date">${validUntilText}</span>
      </div>
      ${
        status.status === "past_due"
          ? `<div class="status-warning">⚠ Payment Due</div>`
          : ""
      }
    </div>
    <button class="btn btn-secondary manage-btn">Manage Subscription</button>
  `;

  const manageBtn = widget.querySelector(".manage-btn");
  if (manageBtn) {
    manageBtn.addEventListener("click", onManageClick);
  }

  return widget;
}

/**
 * Create an upgrade modal
 * @param {string} currentTier - current tier
 * @param {function} onUpgrade - callback with selected tier
 * @returns {HTMLElement}
 */
export function createUpgradeModal(currentTier, onUpgrade) {
  const modal = document.createElement("div");
  modal.className = "modal upgrade-modal";
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Upgrade Your Plan</h2>
        <button class="modal-close" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <div class="tier-grid">
          <!-- Tier cards will be inserted here -->
        </div>
      </div>
    </div>
  `;

  const tierGrid = modal.querySelector(".tier-grid");
  const closeBtn = modal.querySelector(".modal-close");

  // Add tier cards
  const tiers = Object.entries(TIERS).filter(
    ([key]) => key !== currentTier && key !== "free"
  );
  tiers.forEach(([key, config]) => {
    if (!config.current) {
      const card = createTierCard(key, (tier) => {
        onUpgrade(tier);
        modal.remove();
      });
      tierGrid.appendChild(card);
    }
  });

  // Close modal
  closeBtn.addEventListener("click", () => modal.remove());
  modal.querySelector(".modal-overlay").addEventListener("click", () => modal.remove());

  // Prevent modal close on card click
  modal.querySelector(".modal-content").addEventListener("click", (e) => {
    e.stopPropagation();
  });

  return modal;
}

/**
 * Create tier enforcement notice (when feature requires higher tier)
 * @param {string} requiredTier - minimum tier for feature
 * @param {string} featureName - name of the feature
 * @param {function} onUpgrade - callback to upgrade
 * @returns {HTMLElement}
 */
export function createTierEnforcementNotice(requiredTier, featureName, onUpgrade) {
  const notice = document.createElement("div");
  notice.className = `tier-enforcement-notice tier-${requiredTier}`;

  const tierConfig = TIERS[requiredTier];
  notice.innerHTML = `
    <div class="notice-icon">🔒</div>
    <div class="notice-content">
      <h4>Premium Feature</h4>
      <p><strong>${featureName}</strong> requires <strong>${tierConfig.name}</strong> tier or higher.</p>
      <p class="notice-price">Just ${tierConfig.price}${tierConfig.period}</p>
    </div>
    <button class="btn btn-primary upgrade-btn">Upgrade Now</button>
  `;

  notice.querySelector(".upgrade-btn").addEventListener("click", () => {
    onUpgrade(requiredTier);
  });

  return notice;
}

/**
 * Format tier display with color coding
 * @param {string} tier - tier name
 * @returns {string} - CSS class name for styling
 */
export function getTierClassName(tier) {
  return `tier-${tier}`;
}

/**
 * Check if tier has feature
 * @param {string} tier - current tier
 * @param {string} feature - feature to check ('docx_export', 'analytics', 'api', etc)
 * @returns {boolean}
 */
export function hasTierFeature(tier, feature) {
  const tierHierarchy = { free: 0, pro: 1, council: 2, network: 3 };
  const features = {
    docx_export: 2, // council and above
    analytics: 2, // council and above
    api: 2, // council and above
    unlimited_meetings: 1, // pro and above
    ai_minutes: 1 // pro and above
  };

  const tierLevel = tierHierarchy[tier] || 0;
  const requiredLevel = features[feature] || 99;

  return tierLevel >= requiredLevel;
}
