/**
 * Minutes Tab Component - Phase 5
 *
 * Minutes editor with audio upload support.
 * Features:
 * - Edit/save minutes text
 * - Audio upload (drag-drop or file input)
 * - Transcription status display
 * - Version history (read-only)
 * - Export options (PDF, Markdown)
 * - Auto-save every 30 seconds
 * - Word count display
 */

import { fetchWithAuth, request } from "../../../core/api.js";
import { showToast } from "../../../core/toast.js";
import { formatDate, escapeHtml } from "../../common/format.js";

// State
let currentMeetingId = null;
let autoSaveTimer = null;

/**
 * Render minutes tab content
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} meeting - Meeting data
 */
export async function render(container, meeting) {
  currentMeetingId = meeting.id;
  container.className = "minutes-tab";
  container.innerHTML = "";

  try {
    // 1. Fetch current minutes
    let minutesText = "";
    try {
      const response = await request(`/meetings/${meeting.id}/minutes`, "GET");
      minutesText = response?.text || response?.data?.text || "";
    } catch (error) {
      console.debug("[Minutes] No existing minutes:", error.message);
    }

    // 2. Create editor
    const editor = createMinutesEditor(minutesText);
    container.appendChild(editor);

    // 3. Create audio upload zone
    const audioZone = createAudioUploadZone();
    container.appendChild(audioZone);

    // 4. Fetch and display version history
    try {
      const response = await request(`/meetings/${meeting.id}/minutes/versions`, "GET");
      const versions = response?.data || response || [];
      if (versions.length > 0) {
        const history = createVersionHistory(versions);
        container.appendChild(history);
      }
    } catch (error) {
      console.debug("[Minutes] No version history:", error.message);
    }

    // 5. Wire save button
    const saveBtn = editor.querySelector(".btn-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const textarea = editor.querySelector("textarea");
        if (textarea) {
          await saveMinutes(meeting.id, textarea.value);
        }
      });
    }

    // 6. Wire auto-save on blur
    const textarea = editor.querySelector("textarea");
    if (textarea) {
      textarea.addEventListener("blur", () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(async () => {
          await autoSaveMinutes(meeting.id, textarea.value);
        }, 30000);
      });

      textarea.addEventListener("focus", () => {
        clearTimeout(autoSaveTimer);
      });
    }

    // 7. Wire audio upload
    if (audioZone) {
      audioZone.addEventListener("files-selected", async (event) => {
        if (event.detail?.file) {
          await uploadAudio(meeting.id, event.detail.file, audioZone, textarea);
        }
      });
    }
  } catch (error) {
    showToast(`Failed to load minutes: ${error.message}`, { type: "error" });
    console.error("[Minutes] Render error:", error);
    container.innerHTML = `<p class="error">Failed to load minutes editor</p>`;
  }
}

/**
 * Create minutes editor component
 * @param {String} initialText - Initial minutes text
 * @returns {HTMLElement} Editor container
 */
function createMinutesEditor(initialText = "") {
  const container = document.createElement("div");
  container.className = "minutes-editor";

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.innerHTML = `
    <div class="surface-primary-actions">
      <button class="btn btn-primary btn-save" title="Save minutes">💾 Save Minutes</button>
    </div>
    <div class="surface-secondary-actions">
      <button class="btn btn-ghost btn-preview" title="Preview">👁 Preview</button>
    </div>
  `;
  container.appendChild(toolbar);

  // Editor textarea
  const textarea = document.createElement("textarea");
  textarea.id = "minutesContent";
  textarea.className = "editor-input";
  textarea.placeholder = "Enter meeting minutes here...";
  textarea.value = initialText;
  textarea.setAttribute("spellcheck", "true");
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
 * Create audio upload zone with drag-drop
 * @returns {HTMLElement} Upload zone container
 */
function createAudioUploadZone() {
  const zone = document.createElement("div");
  zone.className = "audio-upload-zone";
  zone.setAttribute("role", "region");
  zone.setAttribute("aria-label", "Audio upload area");

  const zoneContent = document.createElement("div");
  zoneContent.className = "zone-content";
  zoneContent.innerHTML = `
    <p class="zone-title">📁 Upload Meeting Audio</p>
    <p class="zone-text">Drop audio file here or click to select</p>
    <p class="zone-formats">Supports: MP3, WAV, M4A, OGG (max 100MB)</p>
  `;
  zone.appendChild(zoneContent);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "audio/*";
  fileInput.style.display = "none";
  zone.appendChild(fileInput);

  const statusDiv = document.createElement("div");
  statusDiv.className = "transcription-status hidden";
  statusDiv.setAttribute("role", "status");
  statusDiv.setAttribute("aria-live", "polite");
  statusDiv.innerHTML = `
    <span class="spinner"></span>
    <span>Transcribing audio...</span>
  `;
  zone.appendChild(statusDiv);

  // Click to select
  zoneContent.addEventListener("click", () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener("change", (event) => {
    if (event.target.files?.length > 0) {
      const file = event.target.files[0];
      // Validate file size (100MB)
      if (file.size > 100 * 1024 * 1024) {
        showToast("File too large (max 100MB)", { type: "error" });
        return;
      }

      zone.dispatchEvent(
        new CustomEvent("files-selected", {
          detail: { file },
          bubbles: true
        })
      );
    }
  });

  // Drag and drop
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("dragover");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("dragover");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");

    const files = e.dataTransfer?.files;
    if (files?.length > 0) {
      const file = files[0];
      if (file.size > 100 * 1024 * 1024) {
        showToast("File too large (max 100MB)", { type: "error" });
        return;
      }

      zone.dispatchEvent(
        new CustomEvent("files-selected", {
          detail: { file },
          bubbles: true
        })
      );
    }
  });

  return zone;
}

/**
 * Create version history component
 * @param {Array} versions - Version history data
 * @returns {HTMLElement} History container
 */
function createVersionHistory(versions = []) {
  const container = document.createElement("div");
  container.className = "version-history";

  const title = document.createElement("h3");
  title.className = "history-title";
  title.textContent = "Version History";
  container.appendChild(title);

  const list = document.createElement("div");
  list.className = "history-list";
  list.setAttribute("role", "list");

  versions.forEach((version, index) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.setAttribute("role", "listitem");

    const date = formatDate(version.timestamp);
    const author = version.author || "Unknown";
    const preview = (version.text || "").substring(0, 50) + "...";

    item.innerHTML = `
      <div class="history-date">${date}</div>
      <div class="history-author">${escapeHtml(author)}</div>
      <div class="history-preview">${escapeHtml(preview)}</div>
    `;

    list.appendChild(item);
  });

  container.appendChild(list);
  return container;
}

/**
 * Save minutes to API
 * @param {String} meetingId - Meeting ID
 * @param {String} text - Minutes text
 */
async function saveMinutes(meetingId, text) {
  try {
    showToast("Saving minutes...");
    await request(`/meetings/${meetingId}/minutes`, "POST", { text });
    showToast("Minutes saved");
  } catch (error) {
    showToast(`Failed to save: ${error.message}`, { type: "error" });
    console.error("[Minutes] Save error:", error);
  }
}

/**
 * Auto-save minutes without user feedback
 * @param {String} meetingId - Meeting ID
 * @param {String} text - Minutes text
 */
async function autoSaveMinutes(meetingId, text) {
  try {
    await request(`/meetings/${meetingId}/minutes`, "POST", { text });
  } catch (error) {
    console.debug("[Minutes] Auto-save failed:", error.message);
  }
}

/**
 * Upload audio file
 * @param {String} meetingId - Meeting ID
 * @param {File} file - Audio file
 * @param {HTMLElement} zone - Upload zone element
 * @param {HTMLElement} textarea - Minutes textarea (to append transcription)
 */
async function uploadAudio(meetingId, file, zone, textarea) {
  const statusDiv = zone.querySelector(".transcription-status");
  const zoneContent = zone.querySelector(".zone-content");

  try {
    if (zoneContent) zoneContent.classList.add("hidden");
    if (statusDiv) statusDiv.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", file);

    showToast("Uploading audio...");

    const response = await fetchWithAuth(`/meetings/${meetingId}/minutes/audio`, {
      method: "POST",
      body: formData
    }, {
      suppressAlert: true
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    showToast("Audio uploaded and transcription in progress");

    // If transcription is included, append to textarea
    if (data.transcription && textarea) {
      const existing = textarea.value;
      textarea.value = existing + "\n\n[Transcription]\n" + data.transcription;
    }
  } catch (error) {
    showToast(`Upload failed: ${error.message}`, { type: "error" });
    console.error("[Minutes] Upload error:", error);
  } finally {
    if (statusDiv) statusDiv.classList.add("hidden");
    if (zoneContent) zoneContent.classList.remove("hidden");
  }
}

/**
 * Cleanup function — cancels auto-save timer and resets module state.
 * Called by meeting-detail.js on route change or meeting change.
 * @export
 */
export function cleanup() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  currentMeetingId = null;
}

