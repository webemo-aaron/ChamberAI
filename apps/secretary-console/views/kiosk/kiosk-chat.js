/**
 * Kiosk Chat Widget Component
 *
 * Renders an interactive chat interface for the AI kiosk with:
 * - Message list with user/AI bubbles
 * - Input field with submit button
 * - Typing indicator while waiting
 * - Follow-up suggestion buttons
 * - Error handling with toast notifications
 * - Accessible form controls and ARIA labels
 *
 * Exported function: initKioskChat(container, options)
 */

import { request } from "../../core/api.js";
import { showToast } from "../../core/toast.js";

/**
 * Initialize kiosk chat widget
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} options - Configuration options
 * @param {boolean} options.isPrivateMode - Whether running in private mode
 * @param {Object} options.kioskConfig - Kiosk configuration from backend
 */
export function initKioskChat(container, options = {}) {
  const { isPrivateMode = false, kioskConfig = {} } = options;

  // State
  const state = {
    isLoading: false,
    messages: [],
    currentFollowUps: []
  };

  // Render initial UI
  renderChatUI();

  /**
   * Render the chat interface
   */
  function renderChatUI() {
    container.innerHTML = `
      <div class="kiosk-chat-wrapper">
        <div class="kiosk-chat-messages" id="chatMessages" role="log" aria-live="polite" aria-label="Chat messages">
          <div class="kiosk-welcome">
            <h2>Welcome to Chamber Assistant</h2>
            <p>Ask me about meetings, motions, action items, and organizational governance.</p>
          </div>
        </div>

        <div class="kiosk-chat-input-area">
          <form class="kiosk-chat-form" id="chatForm" aria-label="Send message">
            <div class="kiosk-input-wrapper">
              <input
                type="text"
                id="chatInput"
                class="kiosk-chat-input"
                placeholder="Ask a question..."
                aria-label="Message input"
                autocomplete="off"
              />
              <button
                type="submit"
                class="kiosk-send-btn"
                aria-label="Send message"
              >
                <span class="send-icon">→</span>
              </button>
            </div>
          </form>

          <div class="kiosk-follow-ups" id="followUpsContainer" style="display: none;">
            <p class="follow-ups-label">Suggested follow-ups:</p>
            <div class="follow-ups-list" id="followUpsList"></div>
          </div>
        </div>
      </div>
    `;

    // Get DOM references
    const messagesEl = document.getElementById("chatMessages");
    const inputEl = document.getElementById("chatInput");
    const formEl = document.getElementById("chatForm");
    const followUpsContainerEl = document.getElementById("followUpsContainer");
    const followUpsListEl = document.getElementById("followUpsList");

    // Set up event listeners
    formEl.addEventListener("submit", handleSubmit);

    /**
     * Handle form submission
     */
    async function handleSubmit(event) {
      event.preventDefault();

      const message = inputEl.value.trim();
      if (!message) return;

      // Clear input
      inputEl.value = "";
      state.isLoading = true;
      state.currentFollowUps = [];

      // Hide follow-ups
      followUpsContainerEl.style.display = "none";

      // Add user message to display
      addMessage({
        role: "user",
        content: message
      });

      // Show typing indicator
      showTypingIndicator();

      try {
        // Send message to API
        const response = await request("/api/kiosk/chat", "POST", {
          message
        });

        // Remove typing indicator
        removeTypingIndicator();

        // Add AI response
        addMessage({
          role: "assistant",
          content: response.response,
          metadata: response.metadata
        });

        // Store and show follow-ups
        if (response.followUps && response.followUps.length > 0) {
          state.currentFollowUps = response.followUps;
          renderFollowUps(response.followUps);
        }
      } catch (error) {
        console.error("Chat error:", error);
        removeTypingIndicator();

        // Show error message
        const errorMsg = error.message || "Failed to get response";
        showToast(`Chat error: ${errorMsg}`, "error");

        // Add error message to chat
        addMessage({
          role: "system",
          content: `Error: ${errorMsg}`
        });
      } finally {
        state.isLoading = false;
        // Refocus input
        setTimeout(() => inputEl.focus(), 100);
      }
    }

    /**
     * Add message to chat display
     * @param {Object} msg - Message object
     * @param {string} msg.role - 'user', 'assistant', or 'system'
     * @param {string} msg.content - Message content
     * @param {Object} [msg.metadata] - Optional metadata (tokens, model, etc.)
     */
    function addMessage(msg) {
      state.messages.push(msg);

      const messageEl = document.createElement("div");
      messageEl.className = `kiosk-message kiosk-message-${msg.role}`;

      if (msg.role === "user") {
        messageEl.innerHTML = `
          <div class="message-bubble user-bubble">
            <p>${escapeHtml(msg.content)}</p>
          </div>
        `;
      } else if (msg.role === "assistant") {
        const metadataHtml = msg.metadata
          ? `<span class="message-metadata">${msg.metadata.model || "Claude"}</span>`
          : "";

        messageEl.innerHTML = `
          <div class="message-bubble assistant-bubble">
            <div class="message-content">${escapeHtml(msg.content)}</div>
            ${metadataHtml}
          </div>
        `;
      } else if (msg.role === "system") {
        messageEl.innerHTML = `
          <div class="message-bubble system-bubble">
            <p>${escapeHtml(msg.content)}</p>
          </div>
        `;
      }

      messagesEl.appendChild(messageEl);

      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, 0);
    }

    /**
     * Show typing indicator
     */
    function showTypingIndicator() {
      const typingEl = document.createElement("div");
      typingEl.className = "kiosk-message kiosk-message-typing";
      typingEl.id = "typingIndicator";
      typingEl.innerHTML = `
        <div class="message-bubble assistant-bubble">
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
      messagesEl.appendChild(typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    /**
     * Remove typing indicator
     */
    function removeTypingIndicator() {
      const typingEl = document.getElementById("typingIndicator");
      if (typingEl) {
        typingEl.remove();
      }
    }

    /**
     * Render follow-up suggestions
     * @param {string[]} followUps - Array of follow-up suggestions
     */
    function renderFollowUps(followUps) {
      followUpsListEl.innerHTML = "";

      followUps.forEach((suggestion) => {
        const btn = document.createElement("button");
        btn.className = "follow-up-btn";
        btn.textContent = suggestion;
        btn.setAttribute("type", "button");
        btn.setAttribute("aria-label", `Follow-up: ${suggestion}`);

        btn.addEventListener("click", () => {
          inputEl.value = suggestion;
          inputEl.focus();
          formEl.dispatchEvent(new Event("submit"));
        });

        followUpsListEl.appendChild(btn);
      });

      followUpsContainerEl.style.display = "block";
    }
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
