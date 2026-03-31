/**
 * Kiosk Chat Widget - Embedded Floating Component
 *
 * Provides an optional embedded chat bubble that floats in the bottom-right corner
 * of the application, allowing users to access the AI Kiosk from any page.
 *
 * Features:
 * - Non-intrusive bubble (60×60px) that minimizes to when closed
 * - Expandable window (380×500px desktop, responsive mobile)
 * - Session persistence (in-memory during app session)
 * - Tier gating (Pro+ with kiosk_addon)
 * - Feature flag control (kiosk_widget_embed)
 * - Lazy loading of KioskChat component
 * - Full keyboard navigation and accessibility
 * - Dark mode support
 *
 * Usage:
 *   import { initKioskWidget } from './components/kiosk-widget.js';
 *   initKioskWidget({ container: document.body, onError: (e) => console.error(e) });
 */

import { request } from "../core/api.js";
import { getCurrentUser } from "../core/auth.js";
import { getCurrentRoute } from "../core/router.js";
import { showToast } from "../core/toast.js";
import { initKioskChat } from "../views/kiosk/kiosk-chat.js";

/**
 * Widget instance state (one per app session)
 */
let widgetInstance = null;

/**
 * Initialize the kiosk widget
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container to append widget to (usually document.body)
 * @param {Function} [options.onInitialized] - Callback when widget is ready
 * @param {Function} [options.onError] - Callback when widget encounters error
 * @returns {Object} Widget API with public methods
 */
export function initKioskWidget(options = {}) {
  const { container = document.body, onInitialized, onError } = options;

  // Prevent duplicate initialization
  if (widgetInstance) {
    console.warn("[KioskWidget] Widget already initialized");
    return widgetInstance.api;
  }

  // Create widget instance
  const instance = new KioskWidget(container);

  // Initialize widget with checks
  (async () => {
    try {
      await instance.initialize();
      if (onInitialized) onInitialized();
    } catch (error) {
      console.error("[KioskWidget] Initialization failed:", error);
      if (onError) onError(error);
    }
  })();

  // Store reference and return public API
  widgetInstance = instance;
  return instance.api;
}

/**
 * KioskWidget class - Internal implementation
 */
class KioskWidget {
  constructor(container) {
    this.container = container;
    this.shell = null;
    this.bubble = null;
    this.window = null;
    this.state = {
      isVisible: false,
      isExpanded: false,
      sessionId: this.generateSessionId(),
      messageHistory: [],
      kioskChat: null,
      lastMessageTime: null,
      errorCount: 0,
      unreadCount: 0,
      tierDroppedWarning: false
    };

    // Public API
    this.api = {
      minimize: () => this.minimize(),
      close: () => this.close(),
      isExpanded: () => this.state.isExpanded,
      isVisible: () => this.state.isVisible
    };
  }

  /**
   * Initialize widget with feature flag and tier checks
   */
  async initialize() {
    // Check 1: Feature flag
    if (!this.isFeatureFlagEnabled()) {
      console.debug("[KioskWidget] Feature flag kiosk_widget_embed not enabled");
      return;
    }

    // Check 2: Tier eligibility
    const tierStatus = await this.checkTierEligibility();
    if (!tierStatus.eligible) {
      console.debug(
        "[KioskWidget] User tier not eligible:",
        tierStatus.tier,
        tierStatus.reason
      );
      return;
    }

    // Check 3: Hide widget on kiosk routes
    const currentRoute = getCurrentRoute();
    if (currentRoute && (currentRoute.path === "/kiosk" || currentRoute.path === "/kiosk-config")) {
      console.debug("[KioskWidget] Hiding widget on kiosk routes");
      return;
    }

    // All checks passed - render widget
    this.state.isVisible = true;
    this.render();
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureFlagEnabled() {
    try {
      const flagsJson = localStorage.getItem("camFeatureFlags");
      if (!flagsJson) return false;
      const flags = JSON.parse(flagsJson);
      return flags.kiosk_widget_embed === true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user's tier is eligible for widget
   */
  async checkTierEligibility() {
    try {
      const user = getCurrentUser();
      if (!user || !user.email) {
        return { eligible: false, tier: "guest", reason: "Not authenticated" };
      }

      // Get billing status from API
      const status = await request("/billing/status", "GET", null, {
        suppressAlert: true
      });

      const proOrHigher = ["pro", "council", "network"].includes(status.tier);
      const hasAddon = status.addons && status.addons.includes("kiosk_addon");

      return {
        eligible: proOrHigher && hasAddon,
        tier: status.tier,
        reason: !proOrHigher ? "Tier too low" : "Missing kiosk_addon",
        status
      };
    } catch (error) {
      console.debug("[KioskWidget] Tier check failed:", error.message);
      return { eligible: false, tier: "unknown", reason: error.message };
    }
  }

  /**
   * Render widget DOM structure
   */
  render() {
    // Create widget shell
    this.shell = document.createElement("div");
    this.shell.className = "kiosk-widget-shell";
    this.shell.setAttribute("data-widget-id", "kiosk-bubble");

    // Create bubble component
    this.bubble = document.createElement("div");
    this.bubble.className = "kiosk-bubble";
    this.bubble.id = "kioskBubble";
    this.bubble.role = "button";
    this.bubble.tabIndex = 0;
    this.bubble.setAttribute("aria-label", "Chat with AI Assistant");
    this.bubble.innerHTML = `
      <span class="bubble-icon">💬</span>
      <span class="bubble-badge" style="display: none;">1</span>
      <span class="bubble-online-indicator"></span>
    `;

    // Create expanded window (initially hidden)
    this.window = document.createElement("div");
    this.window.className = "kiosk-widget-window";
    this.window.id = "kioskWindow";
    this.window.role = "dialog";
    this.window.setAttribute("aria-labelledby", "windowTitle");
    this.window.style.display = "none";

    // Window header
    const header = document.createElement("div");
    header.className = "widget-window-header";
    header.innerHTML = `
      <h3 id="windowTitle" class="widget-title">Chamber Assistant</h3>
      <div class="widget-controls">
        <button class="widget-minimize-btn" aria-label="Minimize chat" title="Minimize">−</button>
        <button class="widget-close-btn" aria-label="Close chat" title="Close">✕</button>
      </div>
    `;

    // Chat container (KioskChat renders here)
    const chatContainer = document.createElement("div");
    chatContainer.className = "widget-chat-container";
    chatContainer.id = "widgetChatContainer";

    // Assemble window
    this.window.appendChild(header);
    this.window.appendChild(chatContainer);

    // Assemble shell
    this.shell.appendChild(this.bubble);
    this.shell.appendChild(this.window);

    // Add to DOM
    this.container.appendChild(this.shell);

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to bubble and window controls
   */
  attachEventListeners() {
    // Bubble click - expand window
    this.bubble.addEventListener("click", (e) => {
      e.stopPropagation();
      this.expand();
    });

    // Bubble keyboard - enter/space to expand
    this.bubble.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.expand();
      }
    });

    // Minimize button
    const minimizeBtn = this.window.querySelector(".widget-minimize-btn");
    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.minimize();
      });
    }

    // Close button
    const closeBtn = this.window.querySelector(".widget-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    // Click outside window - minimize
    document.addEventListener("click", (e) => {
      if (
        this.state.isExpanded &&
        !this.window.contains(e.target) &&
        !this.bubble.contains(e.target)
      ) {
        this.minimize();
      }
    });

    // Escape key - minimize
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.state.isExpanded) {
        this.minimize();
      }
    });
  }

  /**
   * Expand bubble to full window
   */
  expand() {
    if (this.state.isExpanded) return;

    // Show window
    this.window.style.display = "flex";
    this.state.isExpanded = true;

    // Lazy load KioskChat on first expansion
    if (!this.state.kioskChat) {
      this.initializeKioskChat();
    }

    // Update bubble state
    this.bubble.setAttribute("aria-expanded", "true");
    this.window.setAttribute("aria-hidden", "false");
  }

  /**
   * Initialize KioskChat component (lazy load on first expand)
   */
  initializeKioskChat() {
    const chatContainer = document.getElementById("widgetChatContainer");
    if (!chatContainer || this.state.kioskChat) return;

    try {
      // Initialize KioskChat with widget session
      this.state.kioskChat = initKioskChat(chatContainer, {
        isPrivateMode: false,
        kioskConfig: {}
      });
    } catch (error) {
      console.error("[KioskWidget] Failed to initialize KioskChat:", error);
      showToast("Failed to load chat interface", "error");
    }
  }

  /**
   * Minimize window to bubble (preserve session)
   */
  minimize() {
    if (!this.state.isExpanded) return;

    // Hide window
    this.window.style.display = "none";
    this.state.isExpanded = false;

    // Update bubble state
    this.bubble.setAttribute("aria-expanded", "false");
    this.window.setAttribute("aria-hidden", "true");

    // Focus bubble for keyboard navigation
    this.bubble.focus();
  }

  /**
   * Close widget and clear session
   */
  close() {
    // Clear message history
    this.state.messageHistory = [];
    this.state.kioskChat = null;
    this.state.tierDroppedWarning = false;

    // Remove widget from DOM
    if (this.shell && this.shell.parentNode) {
      this.shell.parentNode.removeChild(this.shell);
    }

    // Update visibility
    this.state.isVisible = false;
    this.state.isExpanded = false;
  }

  /**
   * Check if user's tier has expired (during conversation)
   */
  async checkTierStatus() {
    try {
      const status = await request("/billing/status", "GET", null, {
        suppressAlert: true
      });
      const proOrHigher = ["pro", "council", "network"].includes(status.tier);
      const hasAddon = status.addons && status.addons.includes("kiosk_addon");

      if (!proOrHigher || !hasAddon) {
        if (!this.state.tierDroppedWarning) {
          this.state.tierDroppedWarning = true;
          showToast("Your kiosk access has expired", "warning");
        }
        return false;
      }

      return true;
    } catch (error) {
      console.debug("[KioskWidget] Tier check during session failed:", error);
      return true; // Assume valid if check fails
    }
  }

  /**
   * Generate a unique session ID for this widget session
   */
  generateSessionId() {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
