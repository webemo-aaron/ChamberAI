/**
 * Sidebar navigation component for ChamberAI Secretary Console
 *
 * Responsibilities:
 * - Render sidebar navigation with 6 links
 * - Handle role-based visibility (guest, secretary, admin)
 * - Handle tier-based visibility (Council tier for AI Kiosk)
 * - Active state styling based on current route
 * - Footer with user info and logout button
 * - Mobile: bottom tab bar instead of sidebar
 * - Keyboard navigation (Tab, Escape)
 */

import { navigate, getCurrentRoute, onRouteChange } from "../core/router.js";
import { getCurrentRole, getCurrentUser, signOut } from "../core/auth.js";
import { showToast } from "../core/toast.js";

/**
 * Navigation link configuration with role/tier gating
 */
const navigationLinks = [
  {
    icon: "📋",
    label: "Meetings",
    route: "#/meetings",
    minRole: "guest",
    tieredFeature: false,
    testId: "sidebar-link-meetings"
  },
  {
    icon: "🏢",
    label: "Business Hub",
    route: "#/business-hub",
    minRole: "guest",
    tieredFeature: false,
    testId: "sidebar-link-business-hub"
  },
  {
    icon: "⚙️",
    label: "Settings",
    route: "#/settings",
    minRole: "guest",
    tieredFeature: false,
    testId: "sidebar-link-settings"
  },
  {
    icon: "💳",
    label: "Billing",
    route: "#/billing",
    minRole: "secretary",
    tieredFeature: false,
    testId: "sidebar-link-billing",
    cssClass: "billing-link"
  },
  {
    icon: "👑",
    label: "Admin",
    route: "#/admin",
    minRole: "admin",
    tieredFeature: false,
    testId: "sidebar-link-admin",
    cssClass: "admin-link"
  },
  {
    icon: "🤖",
    label: "AI Kiosk",
    route: "#/kiosk",
    minRole: "secretary",
    tieredFeature: true,
    requiredTier: "Council",
    testId: "sidebar-link-kiosk",
    cssClass: "kiosk-link"
  }
];

/**
 * Role hierarchy for visibility checks
 * Lower index = lower privilege
 */
const roleHierarchy = {
  "guest": 0,
  "viewer": 1,
  "secretary": 2,
  "admin": 3
};

/**
 * Check if role meets minimum requirement
 * @param {string} userRole - Current user role
 * @param {string} minRole - Minimum required role
 * @returns {boolean}
 */
function roleMeetsRequirement(userRole, minRole) {
  const userLevel = roleHierarchy[userRole] ?? -1;
  const minLevel = roleHierarchy[minRole] ?? 0;
  return userLevel >= minLevel;
}

/**
 * Get user's subscription tier from localStorage
 * @returns {string} Tier name (e.g., "Council", "Pro", "Free")
 */
function getUserTier() {
  // TODO: Integrate with billing.js once billing state is centralized
  // For now, check localStorage (set by billing service on auth)
  return localStorage.getItem("camUserTier") || "Free";
}

/**
 * Check if user meets tier requirement
 * @param {string} userTier - User's current tier
 * @param {string} requiredTier - Required tier
 * @returns {boolean}
 */
function tierMeetsRequirement(userTier, requiredTier) {
  const tierHierarchy = {
    "Free": 0,
    "Pro": 1,
    "Council": 2
  };
  const userLevel = tierHierarchy[userTier] ?? 0;
  const minLevel = tierHierarchy[requiredTier] ?? 0;
  return userLevel >= minLevel;
}

/**
 * Check if a link should be visible for the current user
 * @param {Object} link - Link configuration
 * @param {string} userRole - Current user role
 * @returns {boolean}
 */
function isLinkVisible(link, userRole) {
  // Check role requirement
  if (!roleMeetsRequirement(userRole, link.minRole)) {
    return false;
  }

  // Check tier requirement if applicable
  if (link.tieredFeature) {
    const tier = getUserTier();
    if (!tierMeetsRequirement(tier, link.requiredTier)) {
      return false;
    }
  }

  return true;
}

/**
 * Get current path from route
 * @returns {string} Path without hash (e.g., "/meetings")
 */
function getCurrentPath() {
  const route = getCurrentRoute();
  return route.path || "/meetings";
}

/**
 * Update active state for all sidebar links
 */
function updateActiveStates() {
  const currentPath = getCurrentPath();
  const links = document.querySelectorAll(".sidebar-link");

  links.forEach(link => {
    const href = link.getAttribute("href");
    // Remove hash and query for comparison
    const linkPath = href ? href.replace(/^#/, "") : "";
    const isActive = linkPath === currentPath ||
                     (linkPath.startsWith(currentPath) && currentPath !== "/");

    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/**
 * Update visibility of navigation links based on current user role
 */
function updateLinkVisibility() {
  const role = getCurrentRole() || "guest";

  navigationLinks.forEach(link => {
    const selector = `[data-testid="${link.testId}"]`;
    const element = document.querySelector(selector);

    if (element) {
      const shouldShow = isLinkVisible(link, role);
      element.style.display = shouldShow ? "flex" : "none";

      // Also update bottom nav version
      const bottomSelector = selector.replace("sidebar", "bottom-nav");
      const bottomElement = document.querySelector(bottomSelector);
      if (bottomElement) {
        bottomElement.style.display = shouldShow ? "flex" : "none";
      }
    }
  });
}

/**
 * Update sidebar footer with current user info
 */
function updateUserInfo() {
  const user = getCurrentUser();
  const emailEl = document.getElementById("sidebarUserEmail");
  const roleEl = document.getElementById("sidebarUserRole");

  if (emailEl) {
    emailEl.textContent = user.email || "user@domain.com";
  }

  if (roleEl) {
    const roleText = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : "Guest";
    roleEl.textContent = roleText;
  }
}

/**
 * Handle logout button click
 */
function handleLogout() {
  // Clear localStorage
  localStorage.removeItem("camRole");
  localStorage.removeItem("camEmail");
  localStorage.removeItem("camDisplayName");
  localStorage.removeItem("camUserTier");

  // Call auth sign out
  if (typeof signOut === "function") {
    signOut().catch(err => {
      console.debug("Sign out error:", err.message);
      // Continue even if sign out fails
    });
  }

  // Navigate to login
  navigate("#/login");
  showToast("Logged out");
}

/**
 * Detect if viewport is mobile
 * @returns {boolean}
 */
function isMobileViewport() {
  return window.innerWidth < 768;
}

/**
 * Handle bottom nav link click (mobile)
 * @param {MouseEvent} event
 */
function handleBottomNavClick(event) {
  const link = event.target.closest(".bottom-nav-link");
  if (!link) return;

  const href = link.getAttribute("href");
  if (href) {
    navigate(href);
  }
}

/**
 * Handle sidebar link click
 * @param {MouseEvent} event
 */
function handleSidebarLinkClick(event) {
  const link = event.target.closest(".sidebar-link");
  if (!link) return;

  const href = link.getAttribute("href");
  if (href) {
    navigate(href);
  }
}

/**
 * Initialize sidebar component
 * Sets up DOM, event listeners, and state synchronization
 */
export function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const sidebarNav = document.getElementById("sidebarNav");
  const sidebarFooter = document.getElementById("sidebarFooter");
  const sidebarLogout = document.getElementById("sidebarLogout");
  const bottomNav = document.getElementById("bottomNav");
  const bottomNavLinks = document.getElementById("bottomNavLinks");

  if (!sidebar || !sidebarNav || !sidebarFooter) {
    console.warn("Sidebar DOM structure not found");
    return;
  }

  // Populate sidebar navigation links
  sidebarNav.innerHTML = navigationLinks
    .map(link => {
      const cssClass = link.cssClass ? ` ${link.cssClass}` : "";
      const hidden = link.minRole === "admin" ? " style=\"display: none;\"" : "";
      return `
        <a href="${link.route}" class="sidebar-link${cssClass}"
           data-testid="${link.testId}"${hidden}
           role="link" tabindex="0">
          <span class="sidebar-icon">${link.icon}</span>
          <span class="sidebar-label">${link.label}</span>
        </a>
      `;
    })
    .join("");

  // Set up sidebar footer
  if (sidebarFooter) {
    sidebarFooter.innerHTML = `
      <div class="user-info">
        <div class="user-avatar"></div>
        <div class="user-details">
          <div class="user-email" id="sidebarUserEmail">user@domain.com</div>
          <div class="user-role" id="sidebarUserRole">Guest</div>
        </div>
      </div>
      <button id="sidebarLogout" class="btn-logout" data-testid="sidebar-logout">
        <span class="logout-icon">🚪</span>
        <span class="logout-label">Logout</span>
      </button>
    `;
  }

  // Populate bottom nav (mobile)
  if (bottomNav && bottomNavLinks) {
    bottomNavLinks.innerHTML = navigationLinks
      .map(link => {
        const cssClass = link.cssClass ? ` bottom-${link.cssClass}` : "";
        const testId = link.testId.replace("sidebar", "bottom-nav");
        const hidden = link.minRole === "admin" ? " style=\"display: none;\"" : "";
        return `
          <a href="${link.route}" class="bottom-nav-link${cssClass}"
             data-testid="${testId}"${hidden}
             role="link" title="${link.label}">
            <span class="bottom-icon">${link.icon}</span>
          </a>
        `;
      })
      .join("");
  }

  // Set up event listeners for sidebar links
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  sidebarLinks.forEach(link => {
    link.addEventListener("click", handleSidebarLinkClick);
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSidebarLinkClick(e);
      }
    });
  });

  // Set up event listeners for bottom nav
  const bottomNavElements = document.querySelectorAll(".bottom-nav-link");
  bottomNavElements.forEach(link => {
    link.addEventListener("click", handleBottomNavClick);
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleBottomNavClick(e);
      }
    });
  });

  // Set up logout button
  const logoutBtn = document.getElementById("sidebarLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Update initial state
  updateUserInfo();
  updateLinkVisibility();
  updateActiveStates();

  // Listen for route changes and update active states
  onRouteChange(() => {
    updateActiveStates();
  });

  // Listen for auth state changes and update sidebar
  // We'll check for changes to role/email in localStorage
  const checkAuthChanges = setInterval(() => {
    const currentRole = getCurrentRole();
    const currentEmail = localStorage.getItem("camEmail");

    if (currentRole) {
      updateUserInfo();
      updateLinkVisibility();
    }
  }, 1000);

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    clearInterval(checkAuthChanges);
  });

  // Responsive: hide/show sidebar and bottom nav
  function handleResize() {
    const isMobile = isMobileViewport();

    if (sidebar) {
      sidebar.style.display = isMobile ? "none" : "flex";
    }

    if (bottomNav) {
      bottomNav.style.display = isMobile ? "flex" : "none";
    }
  }

  // Initial responsive check
  handleResize();

  // Listen to resize events
  window.addEventListener("resize", handleResize);
}
