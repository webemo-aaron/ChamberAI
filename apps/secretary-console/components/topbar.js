/**
 * Topbar component for ChamberAI Secretary Console
 *
 * Responsibilities:
 * - Render simplified topbar with brand mark and title
 * - Handle API config popover (below icon button)
 * - Close popover on outside click, Escape, Save, or Close button
 * - Preserve existing API config logic
 */

import { getApiBase, setApiBase } from "../core/api.js";

/**
 * Initialize topbar component
 * Sets up API config popover with save/cancel handlers
 */
export function initTopbar() {
  const apiBaseInput = document.getElementById("apiBase");
  const saveApiBaseBtn = document.getElementById("saveApiBase");
  const apiConfigBtn = document.getElementById("apiConfigBtn");
  const apiPopover = document.getElementById("apiPopover");
  const closeApiPopoverBtn = document.getElementById("closeApiPopover");
  let returnFocusTarget = null;

  if (!apiBaseInput || !saveApiBaseBtn) {
    console.warn("Topbar API config elements not found");
    return;
  }

  // Initialize API base input with current value
  const currentApiBase = getApiBase();
  if (currentApiBase) {
    apiBaseInput.value = currentApiBase;
  }

  function closePopover() {
    if (apiPopover) {
      apiPopover.classList.add("hidden");
    }
    if (apiConfigBtn) {
      apiConfigBtn.setAttribute("aria-expanded", "false");
    }
    if (returnFocusTarget && typeof returnFocusTarget.focus === "function") {
      returnFocusTarget.focus();
    }
  }

  function openPopover() {
    returnFocusTarget = document.activeElement;
    if (apiPopover) {
      apiPopover.classList.remove("hidden");
    }
    if (apiConfigBtn) {
      apiConfigBtn.setAttribute("aria-expanded", "true");
    }
    apiBaseInput.focus();
  }

  // Popover open/close handlers
  if (apiConfigBtn && apiPopover) {
    // Open popover
    apiConfigBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (apiPopover.classList.contains("hidden")) {
        openPopover();
      } else {
        closePopover();
      }
    });

    // Close popover on outside click
    document.addEventListener("click", (e) => {
      if (!apiPopover.contains(e.target) && e.target !== apiConfigBtn) {
        closePopover();
      }
    });

    // Close popover on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !apiPopover.classList.contains("hidden")) {
        closePopover();
      }
    });

    apiPopover.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || apiPopover.classList.contains("hidden")) {
        return;
      }

      const focusables = Array.from(
        apiPopover.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Prevent closing when clicking inside popover
    apiPopover.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    closeApiPopoverBtn?.addEventListener("click", () => {
      closePopover();
    });
  }

  // Save API base
  saveApiBaseBtn.addEventListener("click", () => {
    const value = apiBaseInput.value.trim();
    if (value) {
      localStorage.setItem("camApiBase", value);
      setApiBase(value);
      closePopover();
    }
  });

  // Allow Enter key to save
  apiBaseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      saveApiBaseBtn.click();
    }
  });
}
