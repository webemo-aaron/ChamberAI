/**
 * Format utilities for shared use across meetings and business-hub views
 *
 * Shared formatting functions used across views, tabs, and headers.
 * Eliminates duplication (was previously copy-pasted into 8 files).
 */

/**
 * Format ISO date string for display
 * @param {String} dateStr - ISO date string
 * @param {Object} options - Intl.DateTimeFormat options (default: month/day/year/hour/minute)
 * @returns {String} Formatted date or "Invalid date" if parsing fails
 */
export function formatDate(dateStr, options = {}) {
  const defaultOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };

  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", { ...defaultOptions, ...options });
  } catch {
    return "Invalid date";
  }
}

/**
 * Escape HTML special characters using the browser's DOM parser
 * @param {String} text - Text to escape
 * @returns {String} HTML-escaped text
 */
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
