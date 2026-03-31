/**
 * Public Summary Tab Component - Phase 5
 *
 * Manages public-facing meeting summary.
 * Features:
 * - Edit summary text
 * - AI draft generation (feature-flagged)
 * - Preview mode
 * - Export (PDF, Markdown, plain text)
 * - Word count
 * - Share link button
 */

import { request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { buildMeetingSummaryDraft } from "../meeting-workflow-utils.js";
import { escapeHtml } from "../../common/format.js";

// State
let currentMeetingId = null;
let currentSummary = "";

/**
 * Render public summary tab content
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} meeting - Meeting data
 */
export async function render(container, meeting) {
  currentMeetingId = meeting.id;
  container.className = "public-summary-tab";
  container.innerHTML = "";

  try {
    // Fetch current summary
    let summaryText = "";
    try {
      const response = await request(`/meetings/${meeting.id}/summary`, "GET");
      summaryText = response?.text || response?.data?.text || "";
    } catch (error) {
      console.debug("[Summary] No existing summary:", error.message);
    }

    currentSummary = summaryText;

    // Create editor
    const editor = createSummaryEditor(summaryText);
    container.appendChild(editor);

    // Create toolbar
    const toolbar = createSummaryToolbar();
    container.appendChild(toolbar);

    // Wire handlers
    const saveBtn = editor.querySelector(".btn-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const textarea = editor.querySelector("textarea");
        if (textarea) {
          await saveSummary(meeting.id, textarea.value);
        }
      });
    }

    const draftBtn = toolbar.querySelector(".btn-draft");
    if (draftBtn) {
      draftBtn.addEventListener("click", async () => {
        const textarea = editor.querySelector("textarea");
        if (!textarea) {
          return;
        }

        let minutesText = "";
        try {
          const response = await request(`/meetings/${meeting.id}/minutes`, "GET", null, {
            suppressAlert: true
          });
          minutesText = response?.text || response?.data?.text || "";
        } catch (error) {
          console.debug("[Summary] Minutes unavailable for draft:", error.message);
        }

        const draft = buildMeetingSummaryDraft(meeting, minutesText);
        textarea.value = draft;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        showToast("Draft summary generated from meeting context");
      });
    }

    const exportBtn = toolbar.querySelector(".btn-export");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const textarea = editor.querySelector("textarea");
        if (textarea) {
          showExportMenu(toolbar, textarea.value);
        }
      });
    }

    const shareBtn = toolbar.querySelector(".btn-share");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        const url = `${window.location.origin}/meeting/${meeting.id}/summary`;
        copyToClipboard(url, "Share link copied");
      });
    }
  } catch (error) {
    showToast(`Failed to load summary: ${error.message}`, { type: "error" });
    console.error("[Summary] Render error:", error);
    container.innerHTML = `<p class="error">Failed to load summary</p>`;
  }
}

/**
 * Create summary editor component
 * @param {String} initialText - Initial summary text
 * @returns {HTMLElement} Editor container
 */
function createSummaryEditor(initialText = "") {
  const container = document.createElement("div");
  container.className = "summary-editor";

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.innerHTML = `
    <button class="btn btn-primary btn-save" title="Save summary">💾 Save</button>
    <button class="btn btn-ghost btn-preview" title="Preview">👁 Preview</button>
  `;
  container.appendChild(toolbar);

  // Editor textarea
  const textarea = document.createElement("textarea");
  textarea.id = "summaryContent";
  textarea.className = "editor-input";
  textarea.placeholder = "Write a public summary of this meeting...";
  textarea.value = initialText;
  textarea.setAttribute("spellcheck", "true");
  textarea.setAttribute("aria-label", "Meeting summary");
  container.appendChild(textarea);

  // Word count
  const wordCount = document.createElement("div");
  wordCount.className = "word-count";
  wordCount.setAttribute("aria-live", "polite");

  const updateWordCount = () => {
    const words = textarea.value.trim().split(/\s+/).filter((w) => w.length > 0).length;
    wordCount.textContent = `${words} words`;
  };

  updateWordCount();
  textarea.addEventListener("input", updateWordCount);
  container.appendChild(wordCount);

  return container;
}

/**
 * Create summary toolbar
 * @returns {HTMLElement} Toolbar element
 */
function createSummaryToolbar() {
  const toolbar = document.createElement("div");
  toolbar.className = "summary-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Summary actions");

  toolbar.innerHTML = `
    <div class="surface-primary-actions">
      <button class="btn btn-secondary btn-draft" title="Generate AI draft">✨ AI Draft</button>
    </div>
    <div class="surface-secondary-actions">
      <button class="btn btn-secondary btn-export" title="Export summary">📥 Export</button>
      <button class="btn btn-secondary btn-share" title="Copy share link">🔗 Share</button>
    </div>
  `;

  return toolbar;
}

/**
 * Show export menu
 * @param {HTMLElement} toolbar - Toolbar element
 * @param {String} content - Content to export
 */
function showExportMenu(toolbar, content) {
  const menu = document.createElement("div");
  menu.className = "export-menu";
  menu.setAttribute("role", "menu");

  menu.innerHTML = `
    <button class="menu-item" data-format="txt">📄 Plain Text</button>
    <button class="menu-item" data-format="md">📝 Markdown</button>
    <button class="menu-item" data-format="pdf">📕 PDF</button>
  `;

  menu.querySelector('[data-format="txt"]').addEventListener("click", () => {
    exportAs(content, "txt");
    menu.remove();
  });

  menu.querySelector('[data-format="md"]').addEventListener("click", () => {
    exportAs(content, "md");
    menu.remove();
  });

  menu.querySelector('[data-format="pdf"]').addEventListener("click", () => {
    exportAs(content, "pdf");
    menu.remove();
  });

  // Close on outside click
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && !toolbar.contains(e.target)) {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    }
  };

  document.addEventListener("click", closeMenu);
  toolbar.appendChild(menu);
}

/**
 * Export content in specified format
 * @param {String} content - Content to export
 * @param {String} format - Export format (txt, md, pdf)
 */
function exportAs(content, format) {
  try {
    let blob;
    let filename;

    switch (format) {
      case "txt":
        blob = new Blob([content], { type: "text/plain" });
        filename = "meeting-summary.txt";
        break;
      case "md":
        blob = new Blob([content], { type: "text/markdown" });
        filename = "meeting-summary.md";
        break;
      case "pdf":
        // For PDF, we'd need a library like jsPDF
        // For now, just use print
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
          <html>
            <head>
              <title>Meeting Summary</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                h1 { color: #333; }
                p { margin-bottom: 10px; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>Meeting Summary</h1>
              <p>${escapeHtml(content)}</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        showToast("PDF export via print dialog");
        return;
      default:
        return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Summary exported as ${format.toUpperCase()}`);
  } catch (error) {
    showToast(`Export failed: ${error.message}`, { type: "error" });
  }
}

/**
 * Save summary to API
 * @param {String} meetingId - Meeting ID
 * @param {String} text - Summary text
 */
async function saveSummary(meetingId, text) {
  try {
    showToast("Saving summary...");
    await request(`/meetings/${meetingId}/summary`, "POST", { text });
    currentSummary = text;
    showToast("Summary saved");
  } catch (error) {
    showToast(`Failed to save: ${error.message}`, { type: "error" });
    console.error("[Summary] Save error:", error);
  }
}

/**
 * Copy text to clipboard
 * @param {String} text - Text to copy
 * @param {String} message - Success message
 */
function copyToClipboard(text, message = "Copied to clipboard") {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast(message);
    })
    .catch((error) => {
      console.error("[Summary] Copy failed:", error);
      showToast("Failed to copy", { type: "error" });
    });
}

/**
 * Cleanup function — resets module-level state.
 * Called by meeting-detail.js on route change or meeting change.
 * @export
 */
export function cleanup() {
  currentMeetingId = null;
  currentSummary = "";
}
