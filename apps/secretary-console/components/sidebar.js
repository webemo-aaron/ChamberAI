/**
 * Sidebar navigation component for ChamberAI Operations Workspace
 *
 * Responsibilities:
 * - Render semantic navigation groups
 * - Apply role and tier-based visibility
 * - Keep active state synchronized with the router
 * - Provide a simplified mobile bottom nav
 * - Surface user identity and tier in the footer
 */

import { navigate, getCurrentRoute, onRouteChange } from "../core/router.js";
import {
  getCurrentRole,
  getCurrentUser,
  onAuthStateChange,
  signOut
} from "../core/auth.js";
import { clearTierPreview, getEffectiveTier } from "../billing.js";
import { showToast } from "../core/toast.js";
import {
  getMobileNavigationItems,
  getNavigationSections
} from "./sidebar-config.js";
import { getSelectedShowcaseCity } from "../views/common/showcase-city-context.js";

function getUserTier() {
  return getEffectiveTier();
}

function getCurrentPath() {
  return getCurrentRoute().path || "/dashboard";
}

function isMobileViewport() {
  return window.innerWidth < 768;
}

function isRouteItemActive(route, currentPath) {
  if (!route) {
    return false;
  }

  if (route === currentPath) {
    return true;
  }

  if (route === "/meetings" && currentPath.startsWith("/meetings/")) {
    return true;
  }

  if (route === "/business-hub" && currentPath.startsWith("/business-hub/")) {
    return true;
  }

  return false;
}

function createSectionMarkup(sections, currentPath) {
  return sections
    .map(
      (section) => `
        <li class="sidebar-section" data-section="${section.id}">
          <div class="sidebar-section-header">
            <div class="sidebar-section-title">${section.label}</div>
            <p class="sidebar-section-description">${section.description}</p>
          </div>
          <div class="sidebar-section-links">
            ${section.items
              .map((item) => {
                const activeClass =
                  item.route && isRouteItemActive(item.route, currentPath)
                    ? " active"
                    : "";
                const cssClass = item.cssClass ? ` ${item.cssClass}` : "";

                if (item.action === "logout") {
                  return `
                    <button
                      type="button"
                      class="sidebar-link${activeClass}${cssClass}"
                      data-action="${item.action}"
                      data-testid="${item.testId}"
                    >
                      <span class="sidebar-icon">${item.icon}</span>
                      <span class="sidebar-label">${item.label}</span>
                      ${
                        item.badge
                          ? `<span class="sidebar-badge">${item.badge}</span>`
                          : ""
                      }
                    </button>
                  `;
                }

                if (item.href) {
                  return `
                    <a
                      href="${item.href}"
                      class="sidebar-link${activeClass}${cssClass}"
                      data-external-href="${item.href}"
                      data-testid="${item.testId}"
                    >
                      <span class="sidebar-icon">${item.icon}</span>
                      <span class="sidebar-label">${item.label}</span>
                      ${
                        item.badge
                          ? `<span class="sidebar-badge">${item.badge}</span>`
                          : ""
                      }
                    </a>
                  `;
                }

                return `
                  <a
                    href="#${item.route}"
                    class="sidebar-link${activeClass}${cssClass}"
                    data-route="${item.route}"
                    data-testid="${item.testId}"
                  >
                    <span class="sidebar-icon">${item.icon}</span>
                    <span class="sidebar-label">${item.label}</span>
                    ${
                      item.badge
                        ? `<span class="sidebar-badge">${item.badge}</span>`
                        : ""
                    }
                  </a>
                `;
              })
              .join("")}
          </div>
        </li>
      `
    )
    .join("");
}

function createBottomNavMarkup(items, currentPath) {
  return items
    .map((item) => {
      const activeClass = isRouteItemActive(item.route, currentPath)
        ? " active"
        : "";
      const testId = item.testId.replace("sidebar", "bottom-nav");

      return `
        <a
          href="#${item.route}"
          class="bottom-nav-link${activeClass}"
          data-route="${item.route}"
          data-testid="${testId}"
          title="${item.label}"
        >
          <span class="bottom-icon">${item.icon}</span>
          <span class="bottom-label">${item.label}</span>
        </a>
      `;
    })
    .join("");
}

async function handleLogout() {
  try {
    await signOut();
  } catch (error) {
    console.debug("Sidebar logout warning:", error.message);
  }

  localStorage.removeItem("camUserTier");
  clearTierPreview();
  navigate("/login");
  showToast("Logged out");
}

function updateCityPill(city) {
  const header = document.querySelector("#sidebar .sidebar-header");
  if (!header) return;
  header.innerHTML = `<span class="sidebar-city-pill">${city.label}</span>`;
}

function bindNavigationEvents(root) {
  root.querySelectorAll("[data-route]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(element.dataset.route);
    });
  });

  root.querySelectorAll("[data-action='logout']").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      handleLogout();
    });
  });
}

export function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const sidebarNav = document.getElementById("sidebarNav");
  const sidebarFooter = document.getElementById("sidebarFooter");
  const bottomNav = document.getElementById("bottomNav");
  const bottomNavLinks = document.getElementById("bottomNavLinks");

  if (!sidebar || !sidebarNav || !sidebarFooter || !bottomNavLinks) {
    console.warn("Sidebar DOM structure not found");
    return;
  }

  function render() {
    const role = getCurrentRole() || "guest";
    const tier = getUserTier();
    const currentPath = getCurrentPath();
    const user = getCurrentUser();
    const sections = getNavigationSections({ role, tier });
    const mobileItems = getMobileNavigationItems({ role, tier });

    sidebarNav.innerHTML = createSectionMarkup(sections, currentPath);
    bottomNavLinks.innerHTML = createBottomNavMarkup(mobileItems, currentPath);

    sidebarFooter.innerHTML = `
      <div class="user-info">
        <div class="user-avatar">${(user.displayName || user.email || "C").slice(0, 1).toUpperCase()}</div>
        <div class="user-details">
          <div class="user-email" id="sidebarUserEmail">${user.email || "guest@chamberai.local"}</div>
          <div class="user-role" id="sidebarUserRole">${role}</div>
          <div class="user-tier" id="sidebarUserTier">${tier} tier</div>
        </div>
      </div>
    `;

    bindNavigationEvents(sidebarNav);
    bindNavigationEvents(bottomNavLinks);
    handleResize();
  }

  function updateActiveStates() {
    const currentPath = getCurrentPath();
    document
      .querySelectorAll(".sidebar-link[data-route], .bottom-nav-link[data-route]")
      .forEach((element) => {
        const isActive = isRouteItemActive(element.dataset.route, currentPath);
        element.classList.toggle("active", isActive);
        if (isActive) {
          element.setAttribute("aria-current", "page");
        } else {
          element.removeAttribute("aria-current");
        }
      });
  }

  function handleResize() {
    const isMobile = isMobileViewport();
    sidebar.style.display = isMobile ? "none" : "flex";
    bottomNav.style.display = isMobile ? "flex" : "none";
  }

  render();
  updateActiveStates();
  updateCityPill(getSelectedShowcaseCity());

  onRouteChange(() => {
    updateActiveStates();
  });

  onAuthStateChange(() => {
    render();
    updateActiveStates();
  });

  window.addEventListener("chamberai:city-changed", (e) => {
    updateCityPill(e.detail.city);
  });
  window.addEventListener("storage", render);
  window.addEventListener("resize", handleResize);
}
