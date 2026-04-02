/**
 * AI Kiosk View Handler
 *
 * Renders the public/private kiosk interface for chamber members
 * to ask questions about meetings, motions, and action items.
 *
 * Features:
 * - Public/private mode detection
 * - Mode-specific banners
 * - Chat widget initialization
 * - Logout button (private mode only)
 * - Responsive full-screen layout
 *
 * Route: /kiosk
 */

import { request } from "../../core/api.js";
import { getCurrentRole, signOut } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";
import { initKioskChat } from "./kiosk-chat.js";

function getKioskMountContainer() {
  const utilityView = document.getElementById("utilityView");
  if (utilityView) {
    const shellMains = document.querySelectorAll("main.shell");
    shellMains.forEach((main) => main.classList.add("hidden"));
    utilityView.classList.remove("hidden");
    return utilityView;
  }

  return document.querySelector("main") || document.body;
}

function renderKioskUnavailable({ title, description, currentRole }) {
  const mainContent = getKioskMountContainer();
  const nextRoute = currentRole === "admin" ? "/kiosk-config" : "/dashboard";
  const nextLabel = currentRole === "admin" ? "Open Kiosk Settings" : "Back to Dashboard";

  mainContent.innerHTML = `
    <section class="kiosk-page" role="main">
      <div class="panel utility-hero">
        <span class="utility-eyebrow">AI Engagement</span>
        <h1>${title}</h1>
        <p>${description}</p>
        <div class="utility-action-row">
          <button type="button" class="utility-action" data-kiosk-next-route="${nextRoute}">${nextLabel}</button>
        </div>
      </div>
    </section>
  `;

  const cta = mainContent.querySelector("[data-kiosk-next-route]");
  if (cta) {
    cta.addEventListener("click", () => navigate(nextRoute));
  }
}

/**
 * Main kiosk view handler
 * @param {Object} params - Route parameters
 * @param {Object} context - Router context
 */
export async function kioskHandler(params, context) {
  try {
    const currentRole = getCurrentRole();

    // Load kiosk configuration
    let kioskConfig;
    try {
      kioskConfig = await request("/api/kiosk/config", "GET");
    } catch (error) {
      showToast("Failed to load kiosk configuration", "error");
      console.error("Failed to load kiosk config:", error);
      renderKioskUnavailable({
        title: "Kiosk Configuration Unavailable",
        description: "The kiosk service could not load configuration for this workspace.",
        currentRole
      });
      return;
    }

    // Check if kiosk is enabled
    if (!kioskConfig.enabled) {
      showToast("AI Kiosk is not enabled for this organization");
      renderKioskUnavailable({
        title: "Kiosk Is Disabled",
        description: "Enable public or private kiosk mode to use AI engagement.",
        currentRole
      });
      return;
    }

    // Detect current mode based on auth state
    const isPrivateMode = currentRole === "admin" && kioskConfig.privateModeEnabled;
    const isPublicMode = kioskConfig.publicModeEnabled && !isPrivateMode;

    if (!isPrivateMode && !isPublicMode) {
      showToast("Kiosk mode not available for this organization");
      renderKioskUnavailable({
        title: "No Kiosk Mode Is Enabled",
        description: "Ask an admin to enable public mode or private admin mode for kiosk access.",
        currentRole
      });
      return;
    }

    // Render kiosk page
    const kioskPage = document.createElement("div");
    kioskPage.className = "kiosk-page";
    kioskPage.setAttribute("role", "main");

    // Create header with mode banner and logout
    const header = document.createElement("div");
    header.className = "kiosk-header";
    header.innerHTML = `
      <div class="kiosk-mode-banner ${isPrivateMode ? 'private' : 'public'}">
        <span class="mode-label">${isPrivateMode ? '🔒 Private Mode' : '🌐 Public Mode'}</span>
        ${isPrivateMode ? '<span class="mode-description">Internal access to all organizational data</span>' : '<span class="mode-description">Public access to published information</span>'}
      </div>
      ${isPrivateMode ? `<button class="kiosk-logout-btn" aria-label="Logout">Logout</button>` : ''}
    `;

    // Create main chat container
    const chatContainer = document.createElement("div");
    chatContainer.className = "kiosk-chat-container";
    chatContainer.id = "kioskChatContainer";

    kioskPage.appendChild(header);
    kioskPage.appendChild(chatContainer);

    // Get main content area
    const mainContent = getKioskMountContainer();
    mainContent.innerHTML = "";
    mainContent.appendChild(kioskPage);

    // Initialize chat widget
    initKioskChat(chatContainer, {
      isPrivateMode,
      kioskConfig
    });

    // Set up logout button handler (private mode only)
    if (isPrivateMode) {
      const logoutBtn = header.querySelector(".kiosk-logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await signOut();
          } catch (error) {
            console.debug("Kiosk logout warning:", error.message);
          }
          showToast("Logged out from kiosk");
          navigate("/login");
        });
      }
    }
  } catch (error) {
    console.error("Kiosk handler error:", error);
    showToast("Failed to initialize kiosk", "error");
  }
}
