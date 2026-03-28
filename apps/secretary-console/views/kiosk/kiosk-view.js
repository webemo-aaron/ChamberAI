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
import { getCurrentRole } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";
import { initKioskChat } from "./kiosk-chat.js";

/**
 * Main kiosk view handler
 * @param {Object} params - Route parameters
 * @param {Object} context - Router context
 */
export async function kioskHandler(params, context) {
  try {
    // Load kiosk configuration
    let kioskConfig;
    try {
      kioskConfig = await request("GET", "/api/kiosk/config");
    } catch (error) {
      showToast("Failed to load kiosk configuration", "error");
      console.error("Failed to load kiosk config:", error);
      navigate("/meetings");
      return;
    }

    // Check if kiosk is enabled
    if (!kioskConfig.enabled) {
      showToast("AI Kiosk is not enabled for this organization");
      navigate("/meetings");
      return;
    }

    // Detect current mode based on auth state
    const currentRole = getCurrentRole();
    const isPrivateMode = currentRole === "admin" && kioskConfig.privateModeEnabled;
    const isPublicMode = kioskConfig.publicModeEnabled && !isPrivateMode;

    if (!isPrivateMode && !isPublicMode) {
      showToast("Kiosk mode not available for this organization");
      navigate("/meetings");
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
    const mainContent = document.querySelector("main") || document.body;
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
        logoutBtn.addEventListener("click", () => {
          localStorage.removeItem("camRole");
          localStorage.removeItem("camEmail");
          localStorage.removeItem("camDisplayName");
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
