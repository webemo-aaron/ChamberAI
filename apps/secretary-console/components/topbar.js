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

  if (!apiBaseInput || !saveApiBaseBtn) {
    console.warn("Topbar API config elements not found");
    return;
  }

  // Initialize API base input with current value
  const currentApiBase = getApiBase();
  if (currentApiBase) {
    apiBaseInput.value = currentApiBase;
  }

  // Popover open/close handlers
  if (apiConfigBtn && apiPopover) {
    // Open popover
    apiConfigBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      apiPopover.classList.remove("hidden");
      apiBaseInput.focus();
    });

    // Close popover on outside click
    document.addEventListener("click", (e) => {
      if (!apiPopover.contains(e.target) && e.target !== apiConfigBtn) {
        apiPopover.classList.add("hidden");
      }
    });

    // Close popover on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !apiPopover.classList.contains("hidden")) {
        apiPopover.classList.add("hidden");
      }
    });

    // Prevent closing when clicking inside popover
    apiPopover.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Save API base
  saveApiBaseBtn.addEventListener("click", () => {
    const value = apiBaseInput.value.trim();
    if (value) {
      localStorage.setItem("camApiBase", value);
      setApiBase(value);
      // Close popover
      if (apiPopover) {
        apiPopover.classList.add("hidden");
      }
    }
  });

  // Allow Enter key to save
  apiBaseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      saveApiBaseBtn.click();
    }
  });
}
