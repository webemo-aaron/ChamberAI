/**
 * Simple toast notification system for displaying temporary messages.
 * Supports multiple types (info, success, error, warning) with auto-hide functionality.
 */

// Toast container element reference
let toastContainer = null;

// Currently visible toast element
let currentToastElement = null;

// Timeout ID for auto-hiding the current toast
let hideTimeoutId = null;

/**
 * CSS styles for toast notifications.
 * Injected into the page on initialization.
 * @constant
 * @private
 */
const TOAST_STYLES = `
  #toast {
    position: fixed;
    bottom: 24px;
    left: 24px;
    max-width: 400px;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: toastSlideIn 0.3s ease-out;
    word-wrap: break-word;
    word-break: break-word;
  }

  #toast.toast-info {
    background-color: #e3f2fd;
    color: #1976d2;
    border-left: 4px solid #1976d2;
  }

  #toast.toast-success {
    background-color: #e8f5e9;
    color: #388e3c;
    border-left: 4px solid #388e3c;
  }

  #toast.toast-error {
    background-color: #ffebee;
    color: #d32f2f;
    border-left: 4px solid #d32f2f;
  }

  #toast.toast-warning {
    background-color: #fff3e0;
    color: #f57c00;
    border-left: 4px solid #f57c00;
  }

  #toast.toast-hide {
    animation: toastSlideOut 0.3s ease-in forwards;
  }

  @keyframes toastSlideIn {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes toastSlideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }

  @media (max-width: 600px) {
    #toast {
      left: 12px;
      right: 12px;
      max-width: none;
      bottom: 12px;
    }
  }
`;

/**
 * Injects toast CSS into the page if not already present.
 * @private
 */
function injectStyles() {
  const styleId = 'toast-styles';

  // Check if styles already exist
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = TOAST_STYLES;
  document.head.appendChild(style);
}

/**
 * Initializes the toast system by creating the container element and injecting styles.
 * Should be called once when the application starts.
 * @returns {HTMLElement} The toast container element
 */
export function initToast() {
  // Inject CSS styles
  injectStyles();

  // Check if toast element already exists
  let existing = document.getElementById('toast');
  if (existing) {
    toastContainer = existing;
    return toastContainer;
  }

  // Create and append toast container
  const container = document.createElement('div');
  container.id = 'toast';
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);

  toastContainer = container;
  return container;
}

/**
 * Hides the currently visible toast with animation.
 * @private
 */
function hideCurrentToast() {
  if (!currentToastElement) return;

  // Clear any pending hide timeout
  if (hideTimeoutId) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }

  // Add hide animation class
  currentToastElement.classList.add('toast-hide');

  // Remove element after animation completes
  const removeDelay = 300; // Match animation duration
  hideTimeoutId = setTimeout(() => {
    if (currentToastElement && currentToastElement.parentNode) {
      currentToastElement.parentNode.removeChild(currentToastElement);
    }
    currentToastElement = null;
    hideTimeoutId = null;
  }, removeDelay);
}

/**
 * Displays a toast notification message.
 * Only one toast is visible at a time; new toasts replace existing ones.
 * @param {string} message - The message to display
 * @param {Object} options - Display options
 * @param {string} options.type - Toast type: 'info', 'success', 'error', or 'warning' (default: 'info')
 * @param {number} options.duration - How long to show the toast in milliseconds (default: 2200)
 * @returns {void}
 */
export function showToast(message, options = {}) {
  // Validate inputs
  if (typeof message !== 'string') {
    console.error('[Toast] Message must be a string');
    return;
  }

  // Ensure toast is initialized
  if (!toastContainer) {
    initToast();
  }

  // Extract options with defaults
  const type = options.type || 'info';
  const duration = options.duration !== undefined ? options.duration : 2200;

  // Validate type
  const validTypes = ['info', 'success', 'error', 'warning'];
  if (!validTypes.includes(type)) {
    console.warn(`[Toast] Invalid type "${type}", using "info"`);
  }

  // Hide any existing toast
  if (currentToastElement) {
    hideCurrentToast();
  }

  // Create new toast element
  const toastElement = document.createElement('div');
  toastElement.className = `toast-${type}`;
  toastElement.textContent = message;

  // Add to container
  toastContainer.appendChild(toastElement);
  currentToastElement = toastElement;

  // Trigger reflow to ensure animation plays (required for CSS animations)
  // eslint-disable-next-line no-unused-expressions
  toastElement.offsetHeight;

  // Auto-hide after duration
  if (duration > 0) {
    if (hideTimeoutId) {
      clearTimeout(hideTimeoutId);
    }

    hideTimeoutId = setTimeout(() => {
      hideCurrentToast();
    }, duration);
  }
}

/**
 * Hides the currently visible toast immediately.
 * Useful for programmatic dismissal.
 * @returns {void}
 */
export function hideToast() {
  hideCurrentToast();
}
