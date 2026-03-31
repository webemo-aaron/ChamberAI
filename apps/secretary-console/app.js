/**
 * ChamberAI Secretary Console - Main Entry Point
 *
 * Responsibilities:
 * - Initialize core modules (router, auth, toast, API)
 * - Restore user session and API configuration from localStorage
 * - Register all routes with placeholder handlers
 * - Set up shell chrome event handlers (topbar, nav, auth modals)
 * - Manage modal lifecycle and focus trapping
 *
 * View rendering logic is delegated to handler functions (Phase 5).
 * All state except shell chrome is managed by core modules.
 */

import {
  initRouter,
  registerRoute,
  navigate,
  onRouteChange
} from "./core/router.js";
import { request, setApiBase, getApiBase, detectDefaultApiBase } from "./core/api.js";
import {
  getCurrentRole,
  setRole,
  initFirebaseAuth,
  applyRolePermissions,
  onAuthStateChange,
  getFirebaseUser
} from "./core/auth.js";
import { showToast, initToast } from "./core/toast.js";
import { loadSettings, saveSettings } from "./settings.js";
import { FEATURE_FLAGS, defaultFlags } from "./modules.js";
import { loginHandler } from "./views/login/login.js";
import { settingsHandler } from "./views/settings/settings-view.js";
import { kioskHandler } from "./views/kiosk/kiosk-view.js";
import { kioskConfigHandler } from "./views/kiosk/kiosk-config.js";
import { businessHubHandler } from "./views/business-hub/business-hub-view.js";
import { meetingsHandler } from "./views/meetings/meetings-view.js";
import { dashboardHandler } from "./views/dashboard/dashboard-view.js";
import { analyticsHandler } from "./views/analytics/analytics-view.js";
import { billingHandler } from "./views/billing/billing-view.js";
import { geoIntelligenceHandler } from "./views/geo-intelligence/geo-intelligence-view.js";
import { profileHandler } from "./views/profile/profile-view.js";
import { preferencesHandler } from "./views/preferences/preferences-view.js";
import { renderUtilityView } from "./views/common/utility-view.js";
import { buildUtilityRouteConfig } from "./views/common/utility-config.js";
import { getEffectiveTier } from "./billing.js";
import { stripeAdminHandler, productsAdminHandler } from "./views/admin/admin-route-handlers.js";
import { initKioskWidget } from "./components/kiosk-widget.js";
import { initSidebar } from "./components/sidebar.js";
import { initTopbar } from "./components/topbar.js";
import {
  getDefaultRouteForRole,
  getNavigationTitle
} from "./components/sidebar-config.js";

// ============================================================================
// DOM Element References (Shell Chrome Only)
// ============================================================================

// Helper to safely get elements with warning on missing
function getElement(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`DOM element not found: #${id} (will be available in Phase 5)`);
  return el;
}

// API Configuration
const apiBaseInput = document.getElementById("apiBase");
const saveApiBaseBtn = document.getElementById("saveApiBase");

// Authentication
const loginModal = document.getElementById("loginModal");
const modalLoginEmail = document.getElementById("modalLoginEmail");
const modalLoginRole = document.getElementById("modalLoginRole");
const modalLoginSubmit = document.getElementById("modalLoginSubmit");
const modalLoginGoogle = document.getElementById("modalLoginGoogle");
const logoutBtn = document.getElementById("logout");
const roleBadge = document.getElementById("roleBadge");
const authCycleStatus = document.getElementById("authCycleStatus");

// Navigation
const viewMeetingsBtn = document.getElementById("viewMeetingsBtn");
const viewBusinessHubBtn = document.getElementById("viewBusinessHubBtn");
const viewKioskBtn = document.getElementById("viewKioskBtn");
const meetingsView = document.getElementById("meetingsView");
const businessHubView = document.getElementById("businessHubView");
const dashboardView = document.getElementById("dashboardView");
const utilityView = document.getElementById("utilityView");

// Tab Management (Phase 5: tabs and panels will be populated with content)
const tabs = Array.from(document.querySelectorAll(".tab-bar .tab[role='tab']"));
const tabMinutes = getElement("tab-minutes");
const tabActions = getElement("tab-actions");
const tabAudit = getElement("tab-audit");
const tabMotions = getElement("tab-motions");
const tabPublicSummary = getElement("tab-public-summary");
const tabPanelsByKey = {
  minutes: tabMinutes,
  actions: tabActions,
  audit: tabAudit,
  motions: tabMotions,
  "public-summary": tabPublicSummary
};

// Modals
const quickModal = document.getElementById("quickModal");
const csvPreviewModal = document.getElementById("csvPreviewModal");

// Onboarding (Phase 5: content and handlers)
const onboardingBanner = getElement("onboardingBanner");
const dismissBanner = getElement("dismissBanner");

// Search & Filters (Phase 5: event handlers)
const meetingSearch = getElement("meetingSearch");

// Feature Flags Display (Phase 5: populated by flags module)
const featureFlagsEl = getElement("featureFlagsEl");

// ============================================================================
// Shell Chrome State
// ============================================================================

/** Modal behavior configuration for focus trapping */
const modalBehavior = new Map([
  [loginModal, { initialFocus: modalLoginGoogle, closeOnEscape: false, closeOnBackdrop: false }],
  [quickModal, { initialFocus: quickModal.querySelector("button"), closeOnEscape: true, closeOnBackdrop: true }],
  [csvPreviewModal, { initialFocus: csvPreviewModal.querySelector("button"), closeOnEscape: true, closeOnBackdrop: true }]
]);

let activeModal = null;
let modalReturnFocus = null;

function getTransientContainers() {
  return [
    document.getElementById("loginPageContainer"),
    document.getElementById("settingsPageContainer")
  ].filter(Boolean);
}

function hideAllViews() {
  [dashboardView, meetingsView, businessHubView, utilityView].forEach((view) => {
    if (view) {
      view.classList.add("hidden");
    }
  });

  getTransientContainers().forEach((container) => {
    container.classList.add("hidden");
    container.innerHTML = "";
  });
}

function activateView(view) {
  hideAllViews();
  if (view) {
    view.classList.remove("hidden");
  }
}

function updatePageTitle(path) {
  const brandTitle = document.querySelector(".brand-title");
  const brandSub = document.querySelector(".brand-sub");
  if (brandTitle) {
    brandTitle.textContent = "ChamberAI";
  }
  if (brandSub) {
    brandSub.textContent = getNavigationTitle(path);
  }
}

function renderUtilityRoute(config) {
  activateView(utilityView);
  renderUtilityView(utilityView, config);
}

function renderNamedUtilityRoute(route) {
  renderUtilityRoute(
    buildUtilityRouteConfig(route, {
      role: getCurrentRole(),
      tier: getEffectiveTier(),
      email: localStorage.getItem("camEmail") || "guest@chamberai.local"
    })
  );
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Main application initialization
 */
async function initializeApp() {
  // 1. Initialize toast for user feedback
  initToast();

  // 2. Restore API base from localStorage
  const savedApiBase = localStorage.getItem("camApiBase");
  if (savedApiBase) {
    setApiBase(savedApiBase);
    apiBaseInput.value = savedApiBase;
  } else {
    const inferredApiBase = detectDefaultApiBase();
    setApiBase(inferredApiBase);
    apiBaseInput.value = inferredApiBase;
  }

  // 3. Restore onboarding banner state (Phase 5: element added)
  if (onboardingBanner && localStorage.getItem("camOnboardingDismissed") === "true") {
    onboardingBanner.style.display = "none";
  }

  // 4. Initialize Firebase auth
  try {
    if (window.CHAMBERAI_FIREBASE_CONFIG) {
      await initFirebaseAuth(window.CHAMBERAI_FIREBASE_CONFIG);
    }
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
  }

  // 5. Restore user session from localStorage
  const savedRole = localStorage.getItem("camRole");
  if (savedRole) {
    setRole(
      savedRole,
      localStorage.getItem("camEmail") || "user@example.com",
      localStorage.getItem("camDisplayName") || ""
    );
    updateAuthDisplay();
    closeModal(loginModal);
  }

  // 5b. Load and apply organization branding (Phase 10)
  try {
    const config = await request("/api/kiosk/public-config").catch(() => null);
    if (config?.branding?.logoUrl) {
      const logo = document.querySelector("#topbar-logo");
      if (logo) logo.setAttribute("src", config.branding.logoUrl);
    }
    if (config?.branding?.displayName) {
      document.title = `${config.branding.displayName} — Chamber AI`;
    }
  } catch (error) {
    console.debug("Branding config unavailable:", error.message);
  }

  // 6. Register all routes with auth guard
  registerRoute("/", () => {
    navigate(getDefaultRouteForRole(getCurrentRole() || "guest"), {
      replace: true
    });
  });
  registerRoute("/login", (params, context) => {
    hideAllViews();
    loginHandler(params, context);
  });
  registerRoute("/dashboard", async (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(dashboardView);
    await dashboardHandler(params, context);
  });
  registerRoute("/meetings", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(meetingsView);
    meetingsHandler(params, context);
  });
  registerRoute("/meetings/:id", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(meetingsView);
    meetingsHandler(params, context);
  });
  registerRoute("/business-hub", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(businessHubView);
    businessHubHandler(params, context);
  });
  registerRoute("/business-hub/:id", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(businessHubView);
    businessHubHandler(params, context);
  });
  registerRoute("/settings", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(utilityView);
    settingsHandler(params, context);
  });
  registerRoute("/analytics", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(utilityView);
    analyticsHandler(params, context);
  });
  registerRoute("/billing", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(utilityView);
    billingHandler(params, context);
  });
  registerRoute("/geo-intelligence", () => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(utilityView);
    geoIntelligenceHandler();
  });
  registerRoute("/profile", () => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(utilityView);
    profileHandler();
  });
  registerRoute("/preferences", () => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    activateView(utilityView);
    preferencesHandler();
  });
  registerRoute("/kiosk", (params, context) => {
    if (!getCurrentRole()) {
      navigate("/login");
      return;
    }
    kioskHandler(params, context);
  });
  registerRoute("/kiosk-config", (params, context) => {
    if (getCurrentRole() !== "admin") {
      showToast("Kiosk configuration requires admin access", "error");
      navigate("/meetings");
      return;
    }
    kioskConfigHandler(params, context);
  });
  registerRoute("/admin/stripe", stripeAdminHandler);
  registerRoute("/admin/products", productsAdminHandler);

  // 7. Set up navigation button handlers and visibility
  if (viewKioskBtn) {
    viewKioskBtn.addEventListener("click", () => {
      navigate("/kiosk");
    });
  }

  // Show kiosk button only for admins
  onRouteChange(() => {
    if (viewKioskBtn) {
      const role = getCurrentRole();
      viewKioskBtn.style.display = role === "admin" ? "block" : "none";
    }
  });

  // 8. Set up auth state listener
  onAuthStateChange((user) => {
    updateAuthDisplay();
  });

  // 9. Initialize sidebar and topbar (Phase 4)
  initSidebar();
  initTopbar();
  onRouteChange((route) => {
    updatePageTitle(route.path);
  });

  // 10. Initialize kiosk widget (Phase 9c)
  // Widget handles its own feature flag and tier checks
  initKioskWidget({
    container: document.body,
    onError: (error) => {
      console.debug("[App] Widget initialization error:", error.message);
      // Non-blocking error - widget fails gracefully
    }
  });

  // 11. Show ready toast
  initRouter();
  showToast("ChamberAI ready");
}

// ============================================================================
// Shell Chrome Event Handlers
// ============================================================================

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container to search
 * @returns {HTMLElement[]} Array of focusable elements
 */
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )
  ).filter((element) => !element.hasAttribute("hidden") && !element.closest(".hidden"));
}

/**
 * Handle keyboard navigation within modal (Tab and Escape)
 * @param {KeyboardEvent} event
 */
function handleModalKeydown(event) {
  if (!activeModal) return;

  const config = modalBehavior.get(activeModal) ?? {};

  // Handle Escape key
  if (event.key === "Escape" && config.closeOnEscape) {
    event.preventDefault();
    closeModal(activeModal);
    return;
  }

  // Handle Tab key for focus trapping
  if (event.key !== "Tab") return;

  const focusables = getFocusableElements(activeModal);
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const current = document.activeElement;

  // Trap focus when tabbing backward from first element
  if (event.shiftKey && current === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  // Trap focus when tabbing forward from last element
  if (!event.shiftKey && current === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Open a modal with focus management
 * @param {HTMLElement} modal - Modal element to open
 * @param {Object} options - Configuration options
 * @param {HTMLElement} [options.returnFocus] - Element to focus when modal closes
 * @param {HTMLElement} [options.initialFocus] - Element to focus when modal opens
 */
function openModal(modal, options = {}) {
  if (!modal) return;

  // Close existing modal if different
  if (activeModal && activeModal !== modal) {
    closeModal(activeModal, { restoreFocus: false });
  }

  const config = modalBehavior.get(modal) ?? {};
  activeModal = modal;
  modalReturnFocus = options.returnFocus ?? document.activeElement;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  const initialTarget = options.initialFocus ?? config.initialFocus;
  requestAnimationFrame(() => {
    if (initialTarget && typeof initialTarget.focus === "function") {
      initialTarget.focus();
      return;
    }

    const focusables = getFocusableElements(modal);
    if (focusables[0]) focusables[0].focus();
  });
}

/**
 * Close a modal with optional focus restoration
 * @param {HTMLElement} modal - Modal element to close
 * @param {Object} options - Configuration options
 * @param {boolean} [options.restoreFocus=true] - Whether to restore focus
 */
function closeModal(modal, options = {}) {
  if (!modal) return;

  const restoreFocus = options.restoreFocus !== false;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  if (activeModal === modal) {
    activeModal = null;
  }

  if (restoreFocus && modalReturnFocus && typeof modalReturnFocus.focus === "function") {
    modalReturnFocus.focus();
  }

  modalReturnFocus = null;
}

/**
 * Activate a tab and show its panel
 * @param {HTMLElement} tab - Tab element to activate
 * @param {Object} options - Configuration options
 * @param {boolean} [options.focus=false] - Whether to focus the tab
 */
function activateTab(tab, options = {}) {
  if (!tab || tab.classList.contains("hidden")) return;

  const shouldFocus = Boolean(options.focus);

  tabs.forEach((candidate) => {
    const isActive = candidate === tab;
    candidate.classList.toggle("active", isActive);
    candidate.setAttribute("aria-selected", isActive ? "true" : "false");
    candidate.tabIndex = isActive ? 0 : -1;

    const target = candidate.dataset.tab;
    const panel = tabPanelsByKey[target];
    if (panel) panel.classList.toggle("hidden", !isActive);
  });

  if (shouldFocus) tab.focus();
}

/**
 * Activate a tab by key
 * @param {string} key - Tab data-tab key
 * @param {Object} options - Configuration options
 */
function activateTabByKey(key, options = {}) {
  const targetTab = tabs.find((candidate) => candidate.dataset.tab === key);
  if (!targetTab) return;
  activateTab(targetTab, options);
}

/**
 * Update auth display elements
 */
function updateAuthDisplay() {
  const role = getCurrentRole();

  if (role) {
    const roleText = role.charAt(0).toUpperCase() + role.slice(1);
    roleBadge.textContent = `Role: ${roleText}`;
    loginModal.classList.add("hidden");
    loginModal.setAttribute("aria-hidden", "true");
  } else {
    roleBadge.textContent = "Role: Guest";
    loginModal.classList.remove("hidden");
    loginModal.setAttribute("aria-hidden", "false");
  }

  if (authCycleStatus) {
    authCycleStatus.textContent = role ? `Authenticated as ${role}` : "Not authenticated";
  }
}

// ============================================================================
// Event Listeners - Shell Chrome
// ============================================================================

// Modal keyboard handling
document.addEventListener("keydown", handleModalKeydown, true);

// API Base Save Button
saveApiBaseBtn.addEventListener("click", () => {
  const value = apiBaseInput.value.trim();
  if (value) {
    localStorage.setItem("camApiBase", value);
    setApiBase(value);
    showToast("API base updated");
  } else {
    showToast("Please enter a valid API base URL");
  }
});

// Login Form Submission (Manual)
modalLoginSubmit.addEventListener("click", () => {
  const email = modalLoginEmail.value.trim() || "user@example.com";
  const role = modalLoginRole.value || "secretary";

  localStorage.setItem("camRole", role);
  localStorage.setItem("camEmail", email);
  localStorage.setItem("camDisplayName", "");

  setRole(role, email, "");
  updateAuthDisplay();
  closeModal(loginModal);
  showToast(`Signed in as ${role}`);
});

// Login Form Submission (Google)
modalLoginGoogle.addEventListener("click", async () => {
  try {
    const user = getFirebaseUser();
    if (!user) {
      showToast("Google authentication not configured");
      return;
    }

    const role = modalLoginRole.value || localStorage.getItem("camRole") || "secretary";
    const email = user.email || modalLoginEmail.value.trim() || "user@example.com";
    const displayName = user.displayName || "";

    localStorage.setItem("camRole", role);
    localStorage.setItem("camEmail", email);
    localStorage.setItem("camDisplayName", displayName);

    setRole(role, email, displayName);
    updateAuthDisplay();
    closeModal(loginModal);
    showToast("Signed in with Google");
  } catch (error) {
    console.error("Google sign-in failed:", error);
    showToast("Google sign-in failed");
  }
});

// Logout Button
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("camRole");
  localStorage.removeItem("camEmail");
  localStorage.removeItem("camDisplayName");

  setRole("guest", "", "");
  applyRolePermissions("guest");
  updateAuthDisplay();
  openModal(loginModal, { returnFocus: logoutBtn });

  showToast("Signed out");
});

// Dismiss Onboarding Banner (Phase 5)
if (dismissBanner) {
  dismissBanner.addEventListener("click", () => {
    localStorage.setItem("camOnboardingDismissed", "true");
    if (onboardingBanner) onboardingBanner.style.display = "none";
  });
}

// Modal Backdrop Click Handlers
quickModal.addEventListener("click", (event) => {
  if (event.target === quickModal && modalBehavior.get(quickModal)?.closeOnBackdrop) {
    closeModal(quickModal);
  }
});

csvPreviewModal.addEventListener("click", (event) => {
  if (event.target === csvPreviewModal && modalBehavior.get(csvPreviewModal)?.closeOnBackdrop) {
    closeModal(csvPreviewModal);
  }
});

// Search Keyboard Shortcut (Phase 5)
document.addEventListener("keydown", (event) => {
  if (activeModal) return;
  if (!meetingSearch) return;

  // '/' key to focus search
  if (event.key === "/") {
    event.preventDefault();
    meetingSearch.focus();
  }

  // 'Escape' key to blur search
  if (event.key === "Escape" && document.activeElement === meetingSearch) {
    meetingSearch.value = "";
    meetingSearch.blur();
  }
});

// ============================================================================
// Lifecycle
// ============================================================================

// Start app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
