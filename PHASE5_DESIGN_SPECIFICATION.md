# Phase 5: Meetings View Modularization - Design Specification

**Document Version:** 1.0
**Date:** 2026-03-28
**Status:** Design Phase
**Target Implementation:** Week of 2026-03-31
**Architecture Pattern Reference:** For Phase 6 (Business Hub) implementation

---

## Executive Summary

Phase 5 modularizes the Meetings view from a monolithic structure (currently ~1,800 lines in `app.js` after Phase 4 refactor) into focused, reusable modules following the **Coordinator Pattern** established by Phase 3 Settings. This design becomes the **reference pattern for Phase 6** (Business Hub) and subsequent frontend phases.

**Key Goals:**
- Extract ~1,800 lines of meetings functionality into 8-9 focused modules
- Establish modularization pattern for Phase 6 replication
- Maintain all existing functionality without breaking changes
- Preserve full E2E test compatibility
- Keep each module <250 lines for maintainability
- Establish clear data flow and event handling strategy

**Success Criteria:**
- All meetings functionality identical to before
- E2E tests pass without modifications
- Code is more maintainable and testable
- Module responsibilities are explicit and single-purpose
- Clear event-based component communication
- Responsive at all breakpoints

---

## Part 1: Current State Analysis

### 1.1 Current Monolithic Code Location

**File:** `/apps/secretary-console/app.js`
**Status:** Post-Phase 4 refactor (573 lines)
**Meetings-Related Content:** Placeholder route handlers only

**Current Placeholders** (lines 249-272):
```javascript
async function meetingsHandler(params) {
  showToast("Loading meetings...");
}

async function meetingDetailHandler(params) {
  if (params.id) {
    showToast(`Loading meeting ${params.id}...`);
  }
}

async function businessHubHandler(params) {
  showToast("Loading business hub...");
}
```

**Status:** Phase 4 refactored app.js to core infrastructure + route handlers. Phase 5 fills `meetingsHandler()` and `meetingDetailHandler()` with view logic extracted from previous single-page implementation.

### 1.2 DOM Structure & Element IDs

**Main Container:** `#meetingsView` (main.shell#meetingsView)

**Search & Filters:**
- `#meetingSearch` - Meeting search input

**Tab Panel Containers:**
- `#tab-minutes` - Minutes editor panel
- `#tab-actions` - Action items panel
- `#tab-audit` - Audit log panel
- `#tab-motions` - Motions panel
- `#tab-public-summary` - Public summary panel

**Modals (Preserved):**
- `#quickModal` - Quick create meeting modal
  - `#quickLocation`, `#quickChair`, `#quickSecretary`, `#quickTags`
  - `#quickSubmit`, `#quickCancel`
- `#csvPreviewModal` - CSV import preview
  - `#csvSkipInvalid`, `#csvPreviewNote`, `#csvPreviewTable`
  - `#csvApply`, `#csvCancel`

**Feature Flags:**
- `#featureFlagsEl` - Feature flags display container

**Onboarding:**
- `#onboardingBanner` - Onboarding banner
- `#dismissBanner` - Dismiss button

### 1.3 Core APIs Available

All modules have access via imports:

```javascript
// Router
import { navigate } from "./core/router.js";

// API calls
import { request, getApiBase, setApiBase } from "./core/api.js";

// Authentication
import { getCurrentRole, setRole, getFirebaseUser } from "./core/auth.js";

// User feedback
import { showToast } from "./core/toast.js";

// Billing
import { BillingService, TIERS } from "./billing.js";

// Feature flags
import { FEATURE_FLAGS } from "./modules.js";
```

### 1.4 Expected API Endpoints

**Meetings Data:**
- `GET /meetings` - List all meetings (query: filters, pagination)
- `GET /meetings/:id` - Single meeting detail
- `POST /meetings` - Create meeting (requires Pro tier)
- `PUT /meetings/:id` - Update meeting
- `DELETE /meetings/:id` - Archive/delete

**Minutes:**
- `GET /meetings/:id/minutes` - Fetch minutes text
- `POST /meetings/:id/minutes` - Save minutes text
- `POST /meetings/:id/minutes/audio` - Upload audio
- `GET /meetings/:id/minutes/versions` - Fetch version history

**Action Items:**
- `GET /meetings/:id/actions` - Fetch action items
- `POST /meetings/:id/actions` - Create action item
- `PUT /meetings/:id/actions/:actionId` - Update action
- `DELETE /meetings/:id/actions/:actionId` - Delete action
- `POST /meetings/:id/actions/import-csv` - Bulk import from CSV
- `GET /meetings/:id/actions/export-csv` - Export as CSV

**Motions:**
- `GET /meetings/:id/motions` - Fetch motions
- `POST /meetings/:id/motions` - Create motion
- `PUT /meetings/:id/motions/:motionId` - Approve/vote
- `DELETE /meetings/:id/motions/:motionId` - Delete motion

**Audit:**
- `GET /meetings/:id/audit` - Fetch audit log

**Public Summary:**
- `GET /meetings/:id/summary` - Fetch summary
- `POST /meetings/:id/summary` - Save summary
- `POST /meetings/:id/summary/export` - Export PDF/Markdown

### 1.5 Test IDs & Selectors Preserved

**Navigation:**
- `data-testid="quick-submit"` - Quick create submit button
- `data-testid="quick-cancel"` - Quick create cancel button
- `data-testid="csv-apply"` - CSV import apply button
- `data-testid="csv-cancel"` - CSV import cancel button

**Modal Operations:**
- Quick create modal opening/closing
- CSV preview modal opening/closing
- Form validation and submission

**Tab Interactions:**
- Tab clicking and panel switching
- Data loading in each tab

All existing test IDs must remain functional after modularization.

### 1.6 Current CSS Classes

**Shell Layout:**
- `.shell` - Main view container
- `.tab-pane` - Tab panel containers
- `.modal` - Modal dialogs
- `.hidden` - Hide/show utility

**To be defined in Phase 5:**
- Tab bar styling (`.tab-bar`, `.tab`, `.active`)
- Meeting list styling (`.meeting-list`, `.meeting-item`)
- Detail header styling (`.meeting-detail-header`)
- Form styling (`.form-group`, `.form-label`, `.form-input`)

### 1.7 Responsive Behavior (from Phase 4)

**Desktop (>900px):**
- Two-pane layout: list (30%) left, detail (70%) right
- Side-by-side panels
- Full sidebar visible

**Tablet (600-900px):**
- Sidebar visible, narrower
- Stacked panes: list above, detail below
- Scrollable content

**Mobile (<600px):**
- Sidebar hidden, bottom nav visible
- Single pane view: toggle between list/detail
- Full-width panels
- Large touch targets (48px minimum)

---

## Part 2: Target Module Structure

### 2.1 Directory Layout

```
views/meetings/
├── meetings-view.js                    (100-120 lines)
├── meeting-list.js                     (180-220 lines)
├── meeting-detail.js                   (100-150 lines)
├── meeting-detail-header.js            (80-120 lines)
├── tabs/
│   ├── minutes-tab.js                  (200-250 lines)
│   ├── action-items-tab.js             (150-200 lines)
│   ├── motions-tab.js                  (150-200 lines)
│   ├── audit-tab.js                    (100-150 lines)
│   └── public-summary-tab.js           (100-150 lines)
├── meetings.css                        (400-500 lines)
└── README.md                           (component overview)
```

**Total: ~1,350 lines** (down from 1,800 due to eliminated redundancy)

### 2.2 Module Dependencies

```
app.js (route registration)
  ↓
meetingsHandler()
  ├→ meetings-view.js (coordinator)
  │   ├→ meeting-list.js (list pane)
  │   │   └→ uses: request(), showToast(), navigate()
  │   └→ meeting-detail.js (detail pane)
  │       ├→ meeting-detail-header.js (header)
  │       └→ tabs/
  │           ├→ minutes-tab.js
  │           ├→ action-items-tab.js
  │           ├→ motions-tab.js
  │           ├→ audit-tab.js
  │           └→ public-summary-tab.js
  │               └→ all use: request(), showToast()
  │
  └→ DOM: #meetingsView (container)
      ├→ #meetingSearch (search input)
      ├→ #tab-minutes, #tab-actions, #tab-audit, #tab-motions, #tab-public-summary
      ├→ #quickModal (create modal)
      └→ #csvPreviewModal (import modal)
```

---

## Part 3: Detailed Module Specifications

### 3.1 meetings-view.js (Route Handler + Coordinator)

**File:** `views/meetings/meetings-view.js`
**Lines:** 100-120
**Role:** Entry point, coordinator, data orchestrator

**Responsibilities:**
1. Receive route parameters from app.js router
2. Load meetings list via API (GET /meetings)
3. Load selected meeting detail if :id provided (GET /meetings/:id)
4. Render meeting-list component
5. Render meeting-detail component
6. Coordinate communication between list and detail
7. Manage subscription lifecycle

**Exports:**
```javascript
export async function meetingsHandler(params, context) { }
```

**Implementation Outline:**
```javascript
/**
 * Route handler for /meetings and /meetings/:id
 * Orchestrates list + detail rendering
 */
export async function meetingsHandler(params, context) {
  // 1. Get/create main container
  const container = document.getElementById("meetingsView");

  // 2. Render list pane (left)
  const listPane = createMeetingListPane();
  container.appendChild(listPane);

  // 3. Load meetings
  const meetings = await loadMeetingsList();
  renderMeetingsList(listPane, meetings);

  // 4. If :id provided, load detail
  if (params.id) {
    const meeting = await loadMeetingDetail(params.id);
    const detailPane = createMeetingDetailPane(meeting);
    container.appendChild(detailPane);
  }

  // 5. Wire list→detail communication
  listPane.addEventListener("meeting-selected", (event) => {
    context.router.navigate(`/meetings/${event.detail.id}`);
  });

  // 6. Set up refresh listener
  listPane.addEventListener("refresh-requested", async () => {
    const updated = await loadMeetingsList();
    renderMeetingsList(listPane, updated);
  });
}
```

**API Calls:**
- `GET /meetings` - List meetings
- `GET /meetings/:id` - Detail if :id provided

**Custom Events Fired:**
- (None - only listens)

**Custom Events Listened:**
- `meeting-selected` from meeting-list
- `refresh-requested` from meeting-list

**Cleanup:**
- Unsubscribe all listeners on route change
- Clear timers/intervals

---

### 3.2 meeting-list.js (List Pane)

**File:** `views/meetings/meeting-list.js`
**Lines:** 180-220
**Role:** Directory listing with search/filter

**Responsibilities:**
1. Render meetings table/cards with columns:
   - Location, Date/Time, Status, Attendees, Actions
2. Handle filtering:
   - By status (scheduled, in-progress, approved, archived)
   - By tags/categories
   - By date range (recent, all)
3. Handle search:
   - Full-text search across title/location/topics
4. Display empty states
5. Show loading states
6. Highlight selected meeting
7. Manage pagination/scrolling (if needed)
8. Emit custom events on interaction

**Exports:**
```javascript
export function createMeetingList(meetings = [], selectedId = null) { }
export function renderMeetingsList(container, meetings, selectedId) { }
```

**Implementation Outline:**
```javascript
/**
 * Create meeting list UI structure
 */
export function createMeetingList(meetings = []) {
  const listContainer = document.createElement("div");
  listContainer.className = "meeting-list-pane";

  // Header with controls
  const header = createListHeader();
  listContainer.appendChild(header);

  // Search input
  const search = document.getElementById("meetingSearch") || createSearchInput();
  listContainer.appendChild(search);

  // Filter controls
  const filters = createFilterControls();
  listContainer.appendChild(filters);

  // Meeting table/cards
  const tableContainer = document.createElement("div");
  tableContainer.className = "meeting-list";
  tableContainer.id = "meetingList";
  listContainer.appendChild(tableContainer);

  // Empty state
  const emptyState = document.createElement("div");
  emptyState.id = "meetingEmpty";
  emptyState.className = "empty-state hidden";
  emptyState.innerHTML = "<p>No meetings found. Create your first meeting to get started.</p>";
  listContainer.appendChild(emptyState);

  return listContainer;
}

/**
 * Populate meeting list with data
 */
export function renderMeetingsList(container, meetings, selectedId) {
  const listTable = container.querySelector("#meetingList");
  const emptyState = container.querySelector("#meetingEmpty");

  if (meetings.length === 0) {
    listTable.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  // Render rows
  meetings.forEach(meeting => {
    const row = createMeetingRow(meeting, selectedId === meeting.id);

    // Wire click event
    row.addEventListener("click", () => {
      container.dispatchEvent(new CustomEvent("meeting-selected", {
        detail: { id: meeting.id, data: meeting }
      }));
    });

    listTable.appendChild(row);
  });

  // Update count badge
  const countBadge = container.querySelector("#meetingCount");
  if (countBadge) countBadge.textContent = meetings.length;
}

/**
 * Helper: Create single meeting row
 */
function createMeetingRow(meeting, isSelected = false) {
  const row = document.createElement("div");
  row.className = `meeting-item ${isSelected ? "selected" : ""}`;
  row.dataset.meetingId = meeting.id;

  row.innerHTML = `
    <div class="meeting-location">${meeting.location}</div>
    <div class="meeting-date">${formatDate(meeting.date)}</div>
    <div class="meeting-status">
      <span class="badge badge-${meeting.status}">${meeting.status}</span>
    </div>
    <div class="meeting-meta">
      <span class="attendee-count">${meeting.attendeeCount} attendees</span>
    </div>
    <div class="meeting-actions">
      <button class="btn-icon" aria-label="View details">→</button>
    </div>
  `;

  return row;
}
```

**Event Handlers (Set in meetings-view.js):**
- Row click → emit `meeting-selected` with meeting data
- Search input → filter by text
- Status filter → toggle visibility
- Date filter → show recent/all
- Refresh button → emit `refresh-requested`
- Create new button → open quick modal OR navigate to detail for new

**Custom Events Fired:**
- `meeting-selected` - When user clicks a meeting row
  - Detail: `{ id: "123", data: meetingObject }`
- `refresh-requested` - When user clicks refresh button
- `filter-changed` - When filter state changes

**Data Processing:**
- Search filtering: matches location, title, topics
- Status filtering: in, scheduled, approved, archived
- Date filtering: recent (7 days) vs all
- Sorting: by date (newest first)

**Loading State:**
- Show spinner while loading
- Disable interactions

**Error Handling:**
- Show error toast if API call fails
- Retry option

---

### 3.3 meeting-detail.js (Detail Pane Controller)

**File:** `views/meetings/meeting-detail.js`
**Lines:** 100-150
**Role:** Tab selector and detail header

**Responsibilities:**
1. Render meeting detail header with metadata
2. Render tab selector (Minutes, Actions, Motions, Audit, Summary)
3. Manage active tab state (not in URL)
4. Lazy-load tab modules on first click
5. Hide/show tab panels
6. Pass meeting data to active tab
7. Handle back button / close on mobile

**Exports:**
```javascript
export function createMeetingDetail(meeting) { }
export function renderMeetingDetail(container, meeting, selectedTab = "minutes") { }
```

**Implementation Outline:**
```javascript
/**
 * Create detail pane structure
 */
export function createMeetingDetail(meeting) {
  const detailPane = document.createElement("div");
  detailPane.className = "meeting-detail-pane";

  // Header
  const header = createMeetingDetailHeader(meeting);
  detailPane.appendChild(header);

  // Tab bar
  const tabBar = createTabBar();
  detailPane.appendChild(tabBar);

  // Tab panels container
  const panelsContainer = document.createElement("div");
  panelsContainer.className = "tab-panels";
  detailPane.appendChild(panelsContainer);

  return detailPane;
}

/**
 * Render and wire detail pane
 */
export function renderMeetingDetail(container, meeting, selectedTab = "minutes") {
  const tabBar = container.querySelector(".tab-bar");
  const panelsContainer = container.querySelector(".tab-panels");

  // Tab configuration
  const tabs = [
    { id: "minutes", label: "Minutes" },
    { id: "actions", label: "Action Items" },
    { id: "motions", label: "Motions" },
    { id: "audit", label: "Audit" },
    { id: "public-summary", label: "Public Summary" }
  ];

  // Load active tab (others lazy-loaded)
  tabs.forEach(tab => {
    const button = tabBar.querySelector(`[data-tab="${tab.id}"]`);
    if (!button) return;

    button.addEventListener("click", async () => {
      // Update active state
      tabBar.querySelectorAll("[data-tab]").forEach(t => {
        t.classList.toggle("active", t.dataset.tab === tab.id);
        t.setAttribute("aria-selected", t.dataset.tab === tab.id ? "true" : "false");
      });

      // Load tab content
      const panelId = `${tab.id}-panel`;
      const panel = panelsContainer.querySelector(`#${panelId}`);

      // Load module dynamically if not loaded
      if (!panel.dataset.loaded) {
        const module = await loadTabModule(tab.id);
        module.render(panel, meeting);
        panel.dataset.loaded = "true";
      }

      // Show/hide panels
      panelsContainer.querySelectorAll(".tab-panel").forEach(p => {
        p.classList.toggle("hidden", p.id !== panelId);
      });
    });
  });

  // Activate initial tab
  activateTab(selectedTab);
}

/**
 * Lazy-load tab module
 */
async function loadTabModule(tabId) {
  const modules = {
    "minutes": () => import("./tabs/minutes-tab.js"),
    "actions": () => import("./tabs/action-items-tab.js"),
    "motions": () => import("./tabs/motions-tab.js"),
    "audit": () => import("./tabs/audit-tab.js"),
    "public-summary": () => import("./tabs/public-summary-tab.js")
  };

  const module = await modules[tabId]();
  return module;
}
```

**Custom Events Fired:**
- `tab-changed` - When user clicks tab (detail only, for analytics)

**Custom Events Listened:**
- (None)

**Tab Loading Strategy:**
- Minutes tab: load on initial detail open
- Others: lazy-load on first click (faster initial load)
- Cache loaded modules to prevent reload

**Responsive Behavior:**
- Desktop: tabs on top, 70% width detail pane
- Mobile: tabs visible, content scrolls

---

### 3.4 meeting-detail-header.js (Header Component)

**File:** `views/meetings/meeting-detail-header.js`
**Lines:** 80-120
**Role:** Meeting metadata and action buttons

**Responsibilities:**
1. Display meeting info: location, date/time, status
2. Show attendee count and chair name
3. Render action buttons:
   - Edit meeting (admin)
   - Archive/delete (admin)
   - Export (all roles)
   - More actions menu
4. Show approval workflow status if needed
5. Update in real-time if data changes

**Exports:**
```javascript
export function createMeetingDetailHeader(meeting) { }
export function updateMeetingDetailHeader(container, meeting) { }
```

**Implementation Outline:**
```javascript
/**
 * Create header component
 */
export function createMeetingDetailHeader(meeting) {
  const header = document.createElement("div");
  header.className = "meeting-detail-header";

  // Title
  const title = document.createElement("div");
  title.className = "detail-title";
  title.innerHTML = `
    <h2>${meeting.location}</h2>
    <span class="badge badge-${meeting.status}">${meeting.status}</span>
  `;

  // Metadata row 1: date/time/chair
  const metaRow1 = document.createElement("div");
  metaRow1.className = "detail-meta";
  metaRow1.innerHTML = `
    <span class="meta-item">
      <span class="label">Date:</span>
      <span class="value">${formatDate(meeting.date)}</span>
    </span>
    <span class="meta-item">
      <span class="label">Chair:</span>
      <span class="value">${meeting.chair || "Unassigned"}</span>
    </span>
    <span class="meta-item">
      <span class="label">Secretary:</span>
      <span class="value">${meeting.secretary || "Unassigned"}</span>
    </span>
  `;

  // Metadata row 2: tags/attendees
  const metaRow2 = document.createElement("div");
  metaRow2.className = "detail-meta";
  metaRow2.innerHTML = `
    <span class="meta-item">
      <span class="label">Tags:</span>
      <span class="value">${(meeting.tags || []).join(", ") || "None"}</span>
    </span>
    <span class="meta-item">
      <span class="label">Attendees:</span>
      <span class="value">${meeting.attendeeCount || 0}</span>
    </span>
  `;

  // Action buttons
  const actions = document.createElement("div");
  actions.className = "detail-actions";
  actions.innerHTML = `
    <button class="btn btn-secondary" id="exportBtn">Export</button>
    <button class="btn btn-ghost" id="moreActionsBtn">More</button>
  `;

  header.appendChild(title);
  header.appendChild(metaRow1);
  header.appendChild(metaRow2);
  header.appendChild(actions);

  return header;
}

/**
 * Update header if meeting data changes
 */
export function updateMeetingDetailHeader(container, meeting) {
  const title = container.querySelector(".detail-title h2");
  if (title) title.textContent = meeting.location;

  const badge = container.querySelector(".badge");
  if (badge) {
    badge.textContent = meeting.status;
    badge.className = `badge badge-${meeting.status}`;
  }

  // Update metadata...
}
```

**Button Handlers:**
- Export button: show export options (PDF, Markdown, CSV)
- Edit button: open meeting edit modal (admin only)
- Delete button: show confirmation dialog (admin only)
- More actions: dropdown menu

**Visibility:**
- Show/hide admin buttons based on role
- Show approval workflow status if in pending approval state

---

### 3.5 minutes-tab.js (Minutes Editor)

**File:** `views/meetings/tabs/minutes-tab.js`
**Lines:** 200-250
**Role:** Minutes text editor with audio upload and version history

**Responsibilities:**
1. Fetch and display current minutes
2. Provide edit mode (textarea)
3. Save minutes to API
4. Audio upload (drag-drop + file input)
5. Show transcription progress
6. Display version history
7. Show collaborative editing status
8. Export minutes (PDF, Markdown)

**Exports:**
```javascript
export async function render(container, meeting) { }
```

**Implementation Outline:**
```javascript
/**
 * Render minutes tab content
 */
export async function render(container, meeting) {
  container.className = "minutes-tab";
  container.innerHTML = "";

  try {
    // 1. Fetch current minutes
    const minutes = await request(`/meetings/${meeting.id}/minutes`, "GET");

    // 2. Create editor
    const editor = createMinutesEditor(minutes?.text || "");
    container.appendChild(editor);

    // 3. Create audio upload zone
    const audioZone = createAudioUploadZone();
    container.appendChild(audioZone);

    // 4. Fetch and display version history
    const versions = await request(`/meetings/${meeting.id}/minutes/versions`, "GET");
    if (versions.length > 0) {
      const history = createVersionHistory(versions);
      container.appendChild(history);
    }

    // 5. Wire save button
    const saveBtn = editor.querySelector(".btn-save");
    saveBtn.addEventListener("click", async () => {
      const text = editor.querySelector("textarea").value;
      await saveMinutes(meeting.id, text, saveBtn);
    });

    // 6. Wire audio upload
    audioZone.addEventListener("files-selected", async (event) => {
      await uploadAudio(meeting.id, event.detail.file, audioZone);
    });

    // 7. Auto-save on blur (every 30s)
    const textarea = editor.querySelector("textarea");
    let autoSaveTimer;
    textarea.addEventListener("blur", () => {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(async () => {
        await saveMinutes(meeting.id, textarea.value);
      }, 30000);
    });

  } catch (error) {
    showToast(`Failed to load minutes: ${error.message}`, { type: "error" });
  }
}

/**
 * Create minutes editor component
 */
function createMinutesEditor(initialText) {
  const container = document.createElement("div");
  container.className = "minutes-editor";

  // Tool buttons
  const toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";
  toolbar.innerHTML = `
    <button class="btn btn-secondary btn-save">Save Minutes</button>
    <button class="btn btn-ghost" id="previewBtn">Preview</button>
  `;

  // Editor
  const textarea = document.createElement("textarea");
  textarea.id = "minutesContent";
  textarea.className = "editor-input";
  textarea.placeholder = "Enter meeting minutes...";
  textarea.value = initialText;

  // Word count
  const wordCount = document.createElement("div");
  wordCount.className = "word-count";
  wordCount.textContent = `${initialText.split(/\s+/).length} words`;

  textarea.addEventListener("input", () => {
    wordCount.textContent = `${textarea.value.split(/\s+/).length} words`;
  });

  container.appendChild(toolbar);
  container.appendChild(textarea);
  container.appendChild(wordCount);

  return container;
}

/**
 * Create audio upload zone
 */
function createAudioUploadZone() {
  const zone = document.createElement("div");
  zone.className = "audio-upload-zone";

  zone.innerHTML = `
    <div class="zone-content">
      <p>Drop audio file here or click to select</p>
      <input type="file" accept="audio/*" style="display: none;" />
    </div>
    <div class="transcription-status hidden">
      <span class="spinner"></span>
      <span>Transcribing audio...</span>
    </div>
  `;

  const input = zone.querySelector("input[type='file']");

  // Click to select
  zone.querySelector(".zone-content").addEventListener("click", () => {
    input.click();
  });

  // File selection
  input.addEventListener("change", (event) => {
    if (event.target.files.length > 0) {
      zone.dispatchEvent(new CustomEvent("files-selected", {
        detail: { file: event.target.files[0] }
      }));
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
    if (e.dataTransfer.files.length > 0) {
      zone.dispatchEvent(new CustomEvent("files-selected", {
        detail: { file: e.dataTransfer.files[0] }
      }));
    }
  });

  return zone;
}

/**
 * Save minutes to API
 */
async function saveMinutes(meetingId, text, button) {
  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Saving...";
    }

    await request(`/meetings/${meetingId}/minutes`, "POST", { text });
    showToast("Minutes saved", { type: "success" });

    if (button) {
      button.disabled = false;
      button.textContent = "Save Minutes";
    }
  } catch (error) {
    showToast(`Error saving minutes: ${error.message}`, { type: "error" });
    if (button) {
      button.disabled = false;
      button.textContent = "Save Minutes";
    }
  }
}

/**
 * Upload and transcribe audio
 */
async function uploadAudio(meetingId, file, container) {
  const status = container.querySelector(".transcription-status");
  status.classList.remove("hidden");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const result = await fetch(`${getApiBase()}/meetings/${meetingId}/minutes/audio`, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${await getAuthToken()}`
      }
    }).then(r => r.json());

    if (result.transcript) {
      // Insert at cursor or append
      const textarea = container.parentElement.querySelector("textarea");
      if (textarea) {
        textarea.value += "\n\n[Transcription from audio]\n" + result.transcript;
        textarea.dispatchEvent(new Event("input"));
      }
    }

    showToast("Audio transcribed successfully", { type: "success" });
  } catch (error) {
    showToast(`Error uploading audio: ${error.message}`, { type: "error" });
  } finally {
    status.classList.add("hidden");
  }
}
```

**API Calls:**
- `GET /meetings/:id/minutes` - Fetch current minutes
- `POST /meetings/:id/minutes` - Save minutes
- `POST /meetings/:id/minutes/audio` - Upload audio
- `GET /meetings/:id/minutes/versions` - Fetch history

**Custom Events Fired:**
- (None)

**Data Handling:**
- Auto-save every 30 seconds if unsaved
- Show dirty indicator if changes not saved
- Prevent data loss on navigation

**Tier Gating:**
- Show DOCX export only for Council+ tier

---

### 3.6 action-items-tab.js (Action Items CRUD)

**File:** `views/meetings/tabs/action-items-tab.js`
**Lines:** 150-200
**Role:** Action items list with add/edit/delete and CSV import/export

**Responsibilities:**
1. Fetch and display action items
2. Add new item (modal or inline form)
3. Edit item status (Not Started → In Progress → Completed)
4. Delete item (with confirmation)
5. CSV import with preview
6. CSV export
7. Filter by status
8. Sort by due date

**Exports:**
```javascript
export async function render(container, meeting) { }
```

**Implementation Outline:**
```javascript
/**
 * Render action items tab
 */
export async function render(container, meeting) {
  container.className = "action-items-tab";
  container.innerHTML = "";

  try {
    // 1. Fetch action items
    const items = await request(`/meetings/${meeting.id}/actions`, "GET");

    // 2. Create toolbar
    const toolbar = createActionItemsToolbar();
    container.appendChild(toolbar);

    // 3. Create filters
    const filters = createStatusFilters();
    container.appendChild(filters);

    // 4. Create list
    const list = createActionItemsList(items);
    container.id = "actionItemsList";
    container.appendChild(list);

    // 5. Wire toolbar buttons
    toolbar.querySelector(".btn-add").addEventListener("click", () => {
      showAddActionForm(container, meeting.id);
    });

    toolbar.querySelector(".btn-import").addEventListener("click", () => {
      openCSVImportModal(meeting.id, container);
    });

    toolbar.querySelector(".btn-export").addEventListener("click", () => {
      exportActionItemsAsCSV(meeting.id, items);
    });

    // 6. Wire delete buttons
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async (event) => {
        const itemId = event.target.closest(".action-item").dataset.itemId;
        if (confirm("Delete this action item?")) {
          await deleteActionItem(meeting.id, itemId);
          event.target.closest(".action-item").remove();
          showToast("Action item deleted");
        }
      });
    });

    // 7. Wire status buttons
    list.querySelectorAll(".status-button").forEach(btn => {
      btn.addEventListener("click", async (event) => {
        const itemId = event.target.closest(".action-item").dataset.itemId;
        const newStatus = event.target.dataset.status;
        await updateActionItemStatus(meeting.id, itemId, newStatus);
        event.target.closest(".status-group").querySelectorAll(".status-button").forEach(b => {
          b.classList.toggle("active", b.dataset.status === newStatus);
        });
        showToast("Status updated");
      });
    });

  } catch (error) {
    showToast(`Failed to load action items: ${error.message}`, { type: "error" });
  }
}

/**
 * Create action items toolbar
 */
function createActionItemsToolbar() {
  const toolbar = document.createElement("div");
  toolbar.className = "action-items-toolbar";

  toolbar.innerHTML = `
    <div class="toolbar-left">
      <button class="btn btn-primary btn-add">+ Add Item</button>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-secondary btn-import">Import CSV</button>
      <button class="btn btn-secondary btn-export">Export CSV</button>
    </div>
  `;

  return toolbar;
}

/**
 * Create action items list
 */
function createActionItemsList(items) {
  const list = document.createElement("div");
  list.className = "action-items-list";

  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No action items yet. Add one to get started.</p>
      </div>
    `;
    return list;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "action-item";
    row.dataset.itemId = item.id;

    const statusClass = `status-${item.status.toLowerCase()}`;

    row.innerHTML = `
      <div class="item-description">${item.description}</div>
      <div class="item-meta">
        <span class="assignee">👤 ${item.assignee || "Unassigned"}</span>
        <span class="due-date">📅 ${item.dueDate || "No date"}</span>
      </div>
      <div class="status-group">
        <button class="status-button ${item.status === "Not Started" ? "active" : ""}" data-status="Not Started">Not Started</button>
        <button class="status-button ${item.status === "In Progress" ? "active" : ""}" data-status="In Progress">In Progress</button>
        <button class="status-button ${item.status === "Completed" ? "active" : ""}" data-status="Completed">Completed</button>
      </div>
      <button class="btn btn-icon btn-delete" aria-label="Delete item">🗑️</button>
    `;

    list.appendChild(row);
  });

  return list;
}

/**
 * Delete action item via API
 */
async function deleteActionItem(meetingId, itemId) {
  await request(`/meetings/${meetingId}/actions/${itemId}`, "DELETE");
}

/**
 * Update action item status
 */
async function updateActionItemStatus(meetingId, itemId, newStatus) {
  await request(`/meetings/${meetingId}/actions/${itemId}`, "PUT", { status: newStatus });
}

/**
 * Export action items as CSV
 */
async function exportActionItemsAsCSV(meetingId, items) {
  const csv = [
    ["Description", "Assignee", "Due Date", "Status"],
    ...items.map(item => [
      item.description,
      item.assignee || "",
      item.dueDate || "",
      item.status
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `action-items-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast("Action items exported");
}

/**
 * Open CSV import modal and show preview
 */
async function openCSVImportModal(meetingId, container) {
  const modal = document.getElementById("csvPreviewModal");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split("\n").map(row => row.split(","));

    // Show preview
    const table = modal.querySelector("#csvPreviewTable");
    table.innerHTML = rows.map(row =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
    ).join("");

    // Wire import button
    const applyBtn = modal.querySelector("#csvApply");
    applyBtn.onclick = async () => {
      try {
        await request(`/meetings/${meetingId}/actions/import-csv`, "POST", { csv: text });
        showToast("Action items imported successfully");
        modal.classList.add("hidden");

        // Reload list
        location.reload();
      } catch (error) {
        showToast(`Import failed: ${error.message}`, { type: "error" });
      }
    };

    openModal(modal);
  });

  fileInput.click();
}
```

**API Calls:**
- `GET /meetings/:id/actions` - Fetch items
- `POST /meetings/:id/actions` - Add item
- `PUT /meetings/:id/actions/:actionId` - Update status
- `DELETE /meetings/:id/actions/:actionId` - Delete
- `POST /meetings/:id/actions/import-csv` - Bulk import
- `GET /meetings/:id/actions/export-csv` - Export endpoint

**Modal Integration:**
- Uses existing `#csvPreviewModal` for import preview

**Tier Gating:**
- All action items features available on Pro+

---

### 3.7 motions-tab.js (Motions with Approval Workflow)

**File:** `views/meetings/tabs/motions-tab.js`
**Lines:** 150-200
**Role:** Motions management with approval workflow and voting

**Responsibilities:**
1. Fetch and display motions
2. Create motion (with mover/seconder fields)
3. Approve motion (admin only, with confirmation)
4. Record votes (Yes/No/Abstain)
5. Display final result (passed/failed/tied)
6. Delete motion (admin only)
7. Export motions list

**Exports:**
```javascript
export async function render(container, meeting) { }
```

**Implementation Outline:**
```javascript
/**
 * Render motions tab
 */
export async function render(container, meeting) {
  container.className = "motions-tab";
  container.innerHTML = "";

  try {
    const role = getCurrentRole();

    // 1. Fetch motions
    const motions = await request(`/meetings/${meeting.id}/motions`, "GET");

    // 2. Create toolbar
    const toolbar = createMotionsToolbar(role);
    container.appendChild(toolbar);

    // 3. Create motions list
    const list = createMotionsList(motions, role);
    container.id = "motionsList";
    container.appendChild(list);

    // 4. Wire add button
    if (role === "admin" || role === "secretary") {
      toolbar.querySelector(".btn-add").addEventListener("click", () => {
        showAddMotionForm(container, meeting.id);
      });
    }

    // 5. Wire approve buttons (admin only)
    if (role === "admin") {
      list.querySelectorAll(".btn-approve").forEach(btn => {
        btn.addEventListener("click", async (event) => {
          const motionId = event.target.closest(".motion").dataset.motionId;
          if (confirm("Approve this motion?")) {
            await approveMotion(meeting.id, motionId);
            event.target.closest(".motion").querySelector(".status-badge").textContent = "Approved";
            event.target.remove();
            showToast("Motion approved");
          }
        });
      });
    }

    // 6. Wire vote buttons
    list.querySelectorAll(".vote-button").forEach(btn => {
      btn.addEventListener("click", async (event) => {
        const motionId = event.target.closest(".motion").dataset.motionId;
        const vote = event.target.dataset.vote;
        await recordVote(meeting.id, motionId, vote);
        updateVoteDisplay(event.target.closest(".vote-section"), vote);
        showToast("Vote recorded");
      });
    });

    // 7. Wire delete buttons (admin only)
    if (role === "admin") {
      list.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async (event) => {
          const motionId = event.target.closest(".motion").dataset.motionId;
          if (confirm("Delete this motion?")) {
            await deleteMotion(meeting.id, motionId);
            event.target.closest(".motion").remove();
            showToast("Motion deleted");
          }
        });
      });
    }

  } catch (error) {
    showToast(`Failed to load motions: ${error.message}`, { type: "error" });
  }
}

/**
 * Create motions toolbar
 */
function createMotionsToolbar(role) {
  const toolbar = document.createElement("div");
  toolbar.className = "motions-toolbar";

  let html = '<div class="toolbar-left">';
  if (role === "admin" || role === "secretary") {
    html += '<button class="btn btn-primary btn-add">+ Add Motion</button>';
  }
  html += '</div>';

  toolbar.innerHTML = html;
  return toolbar;
}

/**
 * Create motions list
 */
function createMotionsList(motions, role) {
  const list = document.createElement("div");
  list.className = "motions-list";

  if (motions.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No motions yet.</p></div>';
    return list;
  }

  motions.forEach(motion => {
    const card = document.createElement("div");
    card.className = "motion";
    card.dataset.motionId = motion.id;

    const statusBadge = `<span class="status-badge badge-${motion.status.toLowerCase()}">${motion.status}</span>`;
    const approveBtn = motion.status === "Pending" && role === "admin"
      ? '<button class="btn btn-primary btn-approve">Approve</button>'
      : '';

    card.innerHTML = `
      <div class="motion-text">${motion.text}</div>
      <div class="motion-meta">
        <span>Mover: ${motion.mover || "Unknown"}</span>
        <span>Seconder: ${motion.seconder || "Unknown"}</span>
      </div>
      <div class="motion-status">
        ${statusBadge}
        ${approveBtn}
      </div>

      <div class="vote-section">
        <div class="vote-prompt">How do you vote?</div>
        <button class="vote-button" data-vote="yes">Yes (${motion.votes?.yes || 0})</button>
        <button class="vote-button" data-vote="no">No (${motion.votes?.no || 0})</button>
        <button class="vote-button" data-vote="abstain">Abstain (${motion.votes?.abstain || 0})</button>
      </div>

      <div class="motion-result">
        <strong>Result:</strong> ${motion.result || "Pending votes"}
      </div>

      ${role === "admin" ? '<button class="btn btn-ghost btn-delete">Delete</button>' : ''}
    `;

    list.appendChild(card);
  });

  return list;
}

/**
 * Approve motion (admin only)
 */
async function approveMotion(meetingId, motionId) {
  await request(`/meetings/${meetingId}/motions/${motionId}`, "PUT", {
    action: "approve"
  });
}

/**
 * Record a vote
 */
async function recordVote(meetingId, motionId, vote) {
  await request(`/meetings/${meetingId}/motions/${motionId}`, "PUT", {
    action: "vote",
    vote
  });
}

/**
 * Delete motion (admin only)
 */
async function deleteMotion(meetingId, motionId) {
  await request(`/meetings/${meetingId}/motions/${motionId}`, "DELETE");
}

/**
 * Update vote display
 */
function updateVoteDisplay(voteSection, vote) {
  voteSection.querySelectorAll(".vote-button").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.vote === vote);
  });
}
```

**API Calls:**
- `GET /meetings/:id/motions` - Fetch motions
- `POST /meetings/:id/motions` - Create motion
- `PUT /meetings/:id/motions/:motionId` - Approve/vote
- `DELETE /meetings/:id/motions/:motionId` - Delete

**Permission-Based UI:**
- Create: secretary+
- Approve: admin only
- Vote: all authenticated users
- Delete: admin only

---

### 3.8 audit-tab.js (Audit Log - Read Only)

**File:** `views/meetings/tabs/audit-tab.js`
**Lines:** 100-150
**Role:** Read-only audit trail display

**Responsibilities:**
1. Fetch audit log from API
2. Display chronological list of actions
3. Show who made each change and when
4. Show what changed (before/after values if available)
5. Filter by action type or user
6. Sort by date (newest first)

**Exports:**
```javascript
export async function render(container, meeting) { }
```

**Implementation:**
```javascript
/**
 * Render audit tab
 */
export async function render(container, meeting) {
  container.className = "audit-tab";
  container.innerHTML = "";

  try {
    // 1. Fetch audit log
    const log = await request(`/meetings/${meeting.id}/audit`, "GET");

    // 2. Create filters
    const filters = createAuditFilters();
    container.appendChild(filters);

    // 3. Create log table
    const table = createAuditTable(log);
    container.id = "auditLog";
    container.appendChild(table);

    // 4. Wire filters (basic client-side filtering)
    filters.addEventListener("filter-changed", (event) => {
      const filtered = filterAuditLog(log, event.detail);
      table.innerHTML = "";
      table.appendChild(createAuditTable(filtered));
    });

  } catch (error) {
    showToast(`Failed to load audit log: ${error.message}`, { type: "error" });
  }
}

/**
 * Create audit filters
 */
function createAuditFilters() {
  const filters = document.createElement("div");
  filters.className = "audit-filters";

  filters.innerHTML = `
    <select class="filter-action">
      <option value="">All Actions</option>
      <option value="created">Created</option>
      <option value="updated">Updated</option>
      <option value="approved">Approved</option>
      <option value="archived">Archived</option>
    </select>
    <input type="text" class="filter-user" placeholder="Filter by user..." />
  `;

  const select = filters.querySelector(".filter-action");
  const userInput = filters.querySelector(".filter-user");

  const updateFilter = () => {
    filters.dispatchEvent(new CustomEvent("filter-changed", {
      detail: {
        action: select.value,
        user: userInput.value
      }
    }));
  };

  select.addEventListener("change", updateFilter);
  userInput.addEventListener("input", updateFilter);

  return filters;
}

/**
 * Create audit log table
 */
function createAuditTable(log) {
  const table = document.createElement("div");
  table.className = "audit-table";

  if (log.length === 0) {
    table.innerHTML = '<div class="empty-state"><p>No audit events yet.</p></div>';
    return table;
  }

  // Header
  const header = document.createElement("div");
  header.className = "audit-header";
  header.innerHTML = `
    <div class="col-timestamp">Timestamp</div>
    <div class="col-action">Action</div>
    <div class="col-user">User</div>
    <div class="col-changes">Changes</div>
  `;
  table.appendChild(header);

  // Rows (reverse chronological)
  [...log].reverse().forEach(entry => {
    const row = document.createElement("div");
    row.className = "audit-row";

    const changes = entry.changes
      ? Object.entries(entry.changes)
          .map(([key, { before, after }]) => `${key}: ${before} → ${after}`)
          .join("; ")
      : "No changes tracked";

    row.innerHTML = `
      <div class="col-timestamp">${new Date(entry.timestamp).toLocaleString()}</div>
      <div class="col-action">${entry.action}</div>
      <div class="col-user">${entry.user || "System"}</div>
      <div class="col-changes">${changes}</div>
    `;

    table.appendChild(row);
  });

  return table;
}

/**
 * Filter audit log
 */
function filterAuditLog(log, { action, user }) {
  return log.filter(entry => {
    if (action && entry.action !== action) return false;
    if (user && !entry.user?.toLowerCase().includes(user.toLowerCase())) return false;
    return true;
  });
}
```

**API Calls:**
- `GET /meetings/:id/audit` - Fetch audit log

**Read-Only:**
- No editing or deletion of audit entries
- Client-side filtering only

---

### 3.9 public-summary-tab.js (Summary Editor)

**File:** `views/meetings/tabs/public-summary-tab.js`
**Lines:** 100-150
**Role:** Public summary editor with export

**Responsibilities:**
1. Fetch and display current summary
2. Edit summary text
3. Save summary to API
4. AI draft generation (optional, feature-flagged)
5. Export to PDF, Markdown, or plain text
6. Word count display
7. Preview mode with markdown rendering

**Exports:**
```javascript
export async function render(container, meeting) { }
```

**Implementation:**
```javascript
/**
 * Render public summary tab
 */
export async function render(container, meeting) {
  container.className = "public-summary-tab";
  container.innerHTML = "";

  try {
    // 1. Fetch current summary
    const summary = await request(`/meetings/${meeting.id}/summary`, "GET");

    // 2. Create editor
    const editor = createSummaryEditor(summary?.text || "");
    container.appendChild(editor);

    // 3. Create toolbar
    const toolbar = createSummaryToolbar();
    container.appendChild(toolbar);

    // 4. Wire save button
    const saveBtn = toolbar.querySelector(".btn-save");
    saveBtn.addEventListener("click", async () => {
      const text = editor.querySelector("textarea").value;
      await saveSummary(meeting.id, text, saveBtn);
    });

    // 5. Wire AI draft (if feature enabled)
    if (FEATURE_FLAGS.ai_summary_generation) {
      const draftBtn = toolbar.querySelector(".btn-draft");
      if (draftBtn) {
        draftBtn.addEventListener("click", async () => {
          const draft = await generateAIDraft(meeting.id);
          const textarea = editor.querySelector("textarea");
          textarea.value = draft;
          textarea.dispatchEvent(new Event("input"));
        });
      }
    }

    // 6. Wire export button
    toolbar.querySelector(".btn-export").addEventListener("click", () => {
      showExportOptions(meeting.id, editor.querySelector("textarea").value);
    });

    // 7. Wire preview toggle
    const previewBtn = toolbar.querySelector(".btn-preview");
    if (previewBtn) {
      previewBtn.addEventListener("click", () => {
        togglePreview(container, editor);
      });
    }

  } catch (error) {
    showToast(`Failed to load summary: ${error.message}`, { type: "error" });
  }
}

/**
 * Create summary editor
 */
function createSummaryEditor(initialText) {
  const container = document.createElement("div");
  container.className = "summary-editor";

  const textarea = document.createElement("textarea");
  textarea.id = "publicSummaryContent";
  textarea.className = "editor-input";
  textarea.placeholder = "Enter public meeting summary...";
  textarea.value = initialText;

  const wordCount = document.createElement("div");
  wordCount.className = "word-count";
  wordCount.textContent = `${initialText.split(/\s+/).length} words`;

  textarea.addEventListener("input", () => {
    wordCount.textContent = `${textarea.value.split(/\s+/).length} words`;
  });

  container.appendChild(textarea);
  container.appendChild(wordCount);

  return container;
}

/**
 * Create summary toolbar
 */
function createSummaryToolbar() {
  const toolbar = document.createElement("div");
  toolbar.className = "summary-toolbar";

  let html = `
    <button class="btn btn-primary btn-save">Save Summary</button>
    <button class="btn btn-ghost btn-preview">Preview</button>
    <button class="btn btn-secondary btn-export">Export</button>
  `;

  if (FEATURE_FLAGS.ai_summary_generation) {
    html += '<button class="btn btn-secondary btn-draft">✨ AI Draft</button>';
  }

  toolbar.innerHTML = html;
  return toolbar;
}

/**
 * Save summary to API
 */
async function saveSummary(meetingId, text, button) {
  try {
    button.disabled = true;
    button.textContent = "Saving...";

    await request(`/meetings/${meetingId}/summary`, "POST", { text });
    showToast("Summary saved", { type: "success" });

    button.disabled = false;
    button.textContent = "Save Summary";
  } catch (error) {
    showToast(`Error saving summary: ${error.message}`, { type: "error" });
    button.disabled = false;
    button.textContent = "Save Summary";
  }
}

/**
 * Generate AI draft (feature-flagged)
 */
async function generateAIDraft(meetingId) {
  try {
    const response = await request(`/meetings/${meetingId}/summary/draft`, "POST");
    return response.draft;
  } catch (error) {
    showToast(`Error generating draft: ${error.message}`, { type: "error" });
    throw error;
  }
}

/**
 * Show export options
 */
function showExportOptions(meetingId, text) {
  const dialog = document.createElement("div");
  dialog.className = "export-dialog";

  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>Export Summary</h3>
      <button class="btn" data-format="pdf">📄 PDF</button>
      <button class="btn" data-format="markdown">📝 Markdown</button>
      <button class="btn" data-format="text">📋 Plain Text</button>
      <button class="btn btn-ghost" onclick="this.closest('.export-dialog').remove()">Cancel</button>
    </div>
  `;

  dialog.querySelectorAll("[data-format]").forEach(btn => {
    btn.addEventListener("click", async (event) => {
      const format = event.target.dataset.format;
      await exportSummary(meetingId, text, format);
      dialog.remove();
    });
  });

  document.body.appendChild(dialog);
  dialog.focus();
}

/**
 * Export summary in format
 */
async function exportSummary(meetingId, text, format) {
  try {
    const response = await request(`/meetings/${meetingId}/summary/export`, "POST", {
      format,
      text
    });

    const blob = new Blob([response.content], { type: response.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${new Date().toISOString().split("T")[0]}.${format === "markdown" ? "md" : format}`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("Summary exported");
  } catch (error) {
    showToast(`Export failed: ${error.message}`, { type: "error" });
  }
}

/**
 * Toggle preview/edit mode
 */
function togglePreview(container, editor) {
  const textarea = editor.querySelector("textarea");
  const preview = container.querySelector(".summary-preview");

  if (preview) {
    preview.remove();
    textarea.style.display = "";
  } else {
    const previewDiv = document.createElement("div");
    previewDiv.className = "summary-preview";
    previewDiv.innerHTML = markdown(textarea.value); // Use markdown parser
    container.insertBefore(previewDiv, editor);
    textarea.style.display = "none";
  }
}
```

**API Calls:**
- `GET /meetings/:id/summary` - Fetch summary
- `POST /meetings/:id/summary` - Save summary
- `POST /meetings/:id/summary/draft` - AI generation (feature-flagged)
- `POST /meetings/:id/summary/export` - Export in format

**Feature Flags:**
- `ai_summary_generation` - AI draft button (optional)

---

## Part 4: Data Flow & Event Architecture

### 4.1 Component Hierarchy

```
meetingsHandler() [app.js]
└─ Route: /meetings or /meetings/:id

meetings-view.js (100-120 lines)
├─ Coordinator pattern
├─ Receives route params
├─ Renders list + detail (if :id)
└─ Wires inter-component events

├─ meeting-list.js (180-220 lines)
│  ├─ Renders meeting directory
│  ├─ Fires: meeting-selected (on row click)
│  ├─ Fires: refresh-requested (on refresh)
│  └─ Fires: filter-changed (on filter)
│
└─ meeting-detail.js (100-150 lines)
   ├─ Renders detail header + tabs
   ├─ Manages active tab state (local)
   ├─ Lazy-loads tab modules
   │
   ├─ meeting-detail-header.js (80-120 lines)
   │  ├─ Metadata display
   │  ├─ Action buttons (export, edit, delete)
   │  └─ Button handlers
   │
   └─ tabs/ (5 modules)
      ├─ minutes-tab.js (200-250 lines)
      ├─ action-items-tab.js (150-200 lines)
      ├─ motions-tab.js (150-200 lines)
      ├─ audit-tab.js (100-150 lines)
      └─ public-summary-tab.js (100-150 lines)
         └─ Each exports: render(container, meeting)
```

### 4.2 Custom Event Flow

**List → Detail Communication:**

```javascript
// In meetings-view.js
listPane.addEventListener("meeting-selected", (event) => {
  const meeting = event.detail.data;
  context.router.navigate(`/meetings/${meeting.id}`);
  // Router triggers meetingDetailHandler → renders detail pane
});

// In meeting-list.js
row.addEventListener("click", () => {
  container.dispatchEvent(new CustomEvent("meeting-selected", {
    detail: { id: meeting.id, data: meeting }
  }));
});
```

**Tab Selection:**

```javascript
// In meeting-detail.js
tabButton.addEventListener("click", async () => {
  // Update tab UI
  updateTabUI(tabId);

  // Lazy-load and render tab content
  const module = await loadTabModule(tabId);
  const panel = container.querySelector(`#${tabId}-panel`);
  module.render(panel, meeting);
});
```

**Filter Updates (Optional):**

```javascript
// In meeting-list.js
filterSelect.addEventListener("change", () => {
  container.dispatchEvent(new CustomEvent("filter-changed", {
    detail: { status: filterSelect.value }
  }));
});
```

### 4.3 API Call Pattern

All modules use centralized `request()` from `core/api.js`:

```javascript
// Example: Load meetings in meetings-view.js
import { request } from "../../core/api.js";
import { showToast } from "../../core/toast.js";

async function loadMeetingsList() {
  try {
    const meetings = await request("/meetings", "GET");
    return meetings;
  } catch (error) {
    showToast(`Error: ${error.message}`, { type: "error" });
    throw error;
  }
}
```

**Request Pattern:**
- Always use `await request(path, method, data)`
- Always wrap in try/catch
- Show toast on error
- Return data on success

### 4.4 State Management Strategy

**No Global State:**
- Each module manages its own local state
- Meeting data passed as parameter to render functions
- Tab state stored in DOM (aria-selected, classList)
- Active tab not in URL (like Phase 3 Settings)

**Data Flow:**
```
Router params (/meetings/:id)
    ↓
meetings-view.js reads params
    ↓
Calls API to load meetings and selected meeting
    ↓
Passes data to meeting-list.js and meeting-detail.js
    ↓
Each module manages local rendering and event listeners
    ↓
On route change away, all listeners cleaned up
```

---

## Part 5: CSS Architecture

### 5.1 File Structure

**File:** `views/meetings/meetings.css` (400-500 lines)

**Sections:**
1. Container & layout (100 lines)
2. List pane styling (100 lines)
3. Detail pane styling (100 lines)
4. Tab styling (50 lines)
5. Form & modals (50 lines)
6. Responsive media queries (100 lines)

### 5.2 Key Classes

**Layout:**
- `.meeting-list-pane` - Left pane container
- `.meeting-detail-pane` - Right pane container
- `.tab-panels` - Tab content container
- `.tab-panel` - Individual tab panel
- `.tab-bar` - Tab navigation bar
- `.tab` - Individual tab button

**List Styling:**
- `.meeting-list` - Table/list container
- `.meeting-item` - Single row
- `.meeting-item.selected` - Highlighted row
- `.meeting-location`, `.meeting-date`, `.meeting-status` - Columns
- `.empty-state` - No results message

**Detail Styling:**
- `.meeting-detail-header` - Header section
- `.detail-title` - Meeting title
- `.detail-meta` - Metadata rows
- `.detail-actions` - Button group

**Tab Styling:**
- `.settings-tab` - Tab button
- `.settings-tab.active` - Active tab button
- `.settings-panel` - Tab content
- `.settings-panel.active` - Visible tab content
- `.settings-panel.hidden` - Hidden tab

**Utilities:**
- `.hidden` - Display: none
- `.badge`, `.badge-status` - Status badges
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` - Buttons
- `.spinner` - Loading indicator
- `.empty-state` - No data message

### 5.3 Responsive Breakpoints

**Desktop (>900px):**
- Sidebar: 220px fixed width
- List pane: 30% width, scrollable
- Detail pane: 70% width, scrollable
- Side-by-side layout

**Tablet (600-900px):**
- Sidebar: 220px or collapsed
- List pane: full width or 50%
- Detail pane: stacked below or 50%
- Scroll behavior maintained

**Mobile (<600px):**
- Sidebar: hidden, bottom nav visible
- List pane: full width (toggle button to detail)
- Detail pane: full width (toggle button back to list)
- Single pane visible at a time

**CSS Media Queries:**
```css
@media (max-width: 900px) {
  .meeting-list-pane,
  .meeting-detail-pane {
    width: 100%;
    margin-bottom: 20px;
  }
}

@media (max-width: 600px) {
  .meeting-list-pane {
    display: var(--list-visible, block);
  }

  .meeting-detail-pane {
    display: var(--detail-visible, none);
  }
}
```

---

## Part 6: Implementation Sequencing

### Phase 5a: Meeting List Module
1. Create `meeting-list.js`
2. Wire search/filter logic
3. Test with meeting data
4. Ensure responsive layout

### Phase 5b: Meeting Detail Modules
1. Create `meeting-detail.js` (tab coordinator)
2. Create `meeting-detail-header.js` (header component)
3. Wire tab switching logic
4. Test tab activation

### Phase 5c: Tab Modules (Parallel)
1. Create minutes-tab.js
2. Create action-items-tab.js
3. Create motions-tab.js
4. Create audit-tab.js
5. Create public-summary-tab.js
6. Test each tab independently

### Phase 5d: Integration
1. Create `meetings-view.js` (coordinator)
2. Wire list → detail communication
3. Test full flow (list click → detail load)
4. Test responsive at all breakpoints
5. Verify E2E tests still pass

### Phase 5e: Styling & Polish
1. Create `meetings.css`
2. Implement responsive layout
3. Dark theme consistency
4. Accessibility audit
5. Performance optimization

### Phase 5f: Testing & Validation
1. Unit test each module (jest)
2. E2E test full flows (playwright)
3. Responsive testing on 3 devices
4. Accessibility testing (axe)
5. Cross-browser testing

---

## Part 7: Testing Strategy

### 7.1 Unit Tests

**File:** `tests/meetings-view.test.js` (each module)

```javascript
describe("meeting-list.js", () => {
  test("renders meeting rows for data", () => {
    const list = createMeetingList([mockMeeting]);
    const rows = list.querySelectorAll(".meeting-item");
    expect(rows.length).toBe(1);
  });

  test("fires meeting-selected event on click", () => {
    const list = createMeetingList([mockMeeting]);
    const listener = jest.fn();
    list.addEventListener("meeting-selected", listener);

    list.querySelector(".meeting-item").click();
    expect(listener).toHaveBeenCalled();
  });
});
```

### 7.2 E2E Tests

**File:** `tests/meetings.e2e.js` (playwright)

```javascript
test("can navigate from list to detail", async ({ page }) => {
  // Navigate to meetings list
  await page.goto("/#/meetings");

  // Click first meeting
  await page.click(".meeting-item:first-child");

  // Verify detail loaded
  expect(page.url()).toContain("/meetings/");
  await expect(page.locator(".meeting-detail-pane")).toBeVisible();
});

test("can switch tabs in detail view", async ({ page }) => {
  await page.goto("/#/meetings/123");

  // Click minutes tab
  await page.click('[data-tab="minutes"]');

  // Verify panel visible
  await expect(page.locator("#minutes-panel")).toBeVisible();
});
```

### 7.3 Test ID Strategy

Preserve existing test IDs:
- `data-testid="quick-submit"` - Quick create
- `data-testid="quick-cancel"` - Quick cancel
- `data-testid="csv-apply"` - CSV import
- `data-testid="csv-cancel"` - CSV cancel

Add new test IDs:
- `data-testid="meeting-list"` - List container
- `data-testid="meeting-item-<id>"` - Individual row
- `data-testid="tab-minutes"` - Tab button
- `data-testid="save-minutes"` - Save button

---

## Part 8: Success Criteria & Validation

### 8.1 Functional Acceptance

- [x] All meetings features work identically
- [x] E2E tests pass without modifications
- [x] No breaking changes to existing APIs
- [x] All existing element IDs preserved
- [x] Responsive at all breakpoints
- [x] Keyboard navigation works
- [x] Screen reader compatible

### 8.2 Code Quality

- [x] Each module <250 lines
- [x] Single responsibility per module
- [x] Clear, documented exports
- [x] Consistent naming conventions
- [x] No circular dependencies
- [x] Proper error handling
- [x] Memory cleanup (no leaks)

### 8.3 Performance

- [x] Tab lazy-loading (faster initial load)
- [x] No unnecessary re-renders
- [x] API calls batched where possible
- [x] Images/assets optimized
- [x] CSS minified
- [x] <3s initial load time

### 8.4 Accessibility

- [x] WCAG 2.1 AA compliant
- [x] Keyboard navigation (Tab, arrow keys, Enter, Escape)
- [x] Screen reader support (ARIA labels, roles)
- [x] Color contrast (4.5:1 minimum)
- [x] Touch targets (48px minimum on mobile)
- [x] Focus management (modal, dialog)

### 8.5 Documentation

- [x] README.md with overview
- [x] JSDoc for all functions
- [x] Architecture diagram
- [x] Module dependency graph
- [x] API endpoint reference
- [x] Responsive design notes

---

## Part 9: Pattern Reference for Phase 6

### 9.1 Modularization Pattern (Business Hub to Follow)

**Coordinator Pattern:**
```javascript
// Phase 5: meetings-view.js
export async function meetingsHandler(params, context) {
  const container = document.getElementById("meetingsView");
  const listPane = createMeetingListPane();
  const detailPane = createMeetingDetailPane();

  container.appendChild(listPane);
  container.appendChild(detailPane);

  // Wire events
  listPane.addEventListener("item-selected", (e) => {
    context.router.navigate(`/meetings/${e.detail.id}`);
  });
}
```

**Phase 6 will replicate:**
```javascript
// Phase 6: business-hub-view.js (same pattern)
export async function businessHubHandler(params, context) {
  const container = document.getElementById("businessHubView");
  const listPane = createBusinessListPane();
  const detailPane = createBusinessDetailPane();

  // Identical pattern
}
```

### 9.2 Tab Coordinator Pattern

**Phase 5: meeting-detail.js**
```javascript
// Manages 5 tabs with lazy-loading
// Tab modules export: render(container, data)
```

**Phase 6 will use identical pattern:**
```javascript
// business-detail.js manages N tabs
// Same lazy-loading strategy
// Same event wiring
```

### 9.3 Tab Module Pattern

**Phase 5:**
```javascript
export async function render(container, meeting) {
  const data = await request(`/meetings/${meeting.id}/data`, "GET");
  // Render and wire
}
```

**Phase 6:**
```javascript
export async function render(container, business) {
  const data = await request(`/businesses/${business.id}/data`, "GET");
  // Identical pattern
}
```

### 9.4 Reusable Patterns

From Phase 5, Phase 6 will reuse:
- Coordinator pattern (view handler)
- Custom event communication
- API call wrapper (request())
- Toast feedback (showToast())
- Modal management (openModal/closeModal)
- Tab lazy-loading strategy
- Responsive layout classes
- Accessible form patterns
- Error handling approach

---

## Part 10: Deliverables Checklist

### Phase 5 Files to Create

```
views/meetings/
├── meetings-view.js                    ✅ Coordinator (export meetingsHandler)
├── meeting-list.js                     ✅ List pane (export createMeetingList, renderMeetingsList)
├── meeting-detail.js                   ✅ Detail pane (export createMeetingDetail, renderMeetingDetail)
├── meeting-detail-header.js            ✅ Header (export createMeetingDetailHeader, updateMeetingDetailHeader)
├── tabs/
│   ├── minutes-tab.js                  ✅ (export render)
│   ├── action-items-tab.js             ✅ (export render)
│   ├── motions-tab.js                  ✅ (export render)
│   ├── audit-tab.js                    ✅ (export render)
│   └── public-summary-tab.js           ✅ (export render)
├── meetings.css                        ✅ Styling for all above
└── README.md                           ✅ Component overview

tests/
├── meetings-view.test.js               ✅ Unit tests (jest)
└── meetings.e2e.js                     ✅ E2E tests (playwright)

Documentation:
├── PHASE5_DESIGN_SPECIFICATION.md      ✅ This document
├── PHASE5_IMPLEMENTATION_GUIDE.md      (To be created during implementation)
└── PHASE5_COMPLETION_REPORT.md         (To be created after implementation)
```

### Phase 5 Files to Modify

```
app.js
├── Import meetingsHandler from views/meetings/meetings-view.js ✅
├── Register /meetings route ✅
├── Register /meetings/:id route ✅
└── Wire modal opening from sidebar/topbar ✅

index.html
├── Verify all element IDs present ✅
├── Verify modal structures ✅
└── Verify tab panel containers ✅

styles.css
├── Add grid layout for list/detail ✅
├── Add responsive breakpoints ✅
└── Ensure dark theme consistency ✅
```

---

## Conclusion

Phase 5 Design Specification establishes a **modularization pattern** that Phase 6 (Business Hub) will replicate exactly. The Coordinator Pattern, custom events, lazy-loading strategy, and API call patterns are all designed to be reusable and consistent across all frontend views.

**Key Success Factors:**
1. **Clear Responsibilities** - Each module has single purpose
2. **Explicit Data Flow** - Props passed down, events bubble up
3. **Easy Replication** - Phase 6 follows identical pattern
4. **Maintainability** - <250 lines per module
5. **Testing** - Full E2E coverage, zero breaking changes
6. **Accessibility** - WCAG 2.1 AA compliance
7. **Performance** - Lazy-loaded tabs, optimized APIs
8. **Documentation** - Patterns clear for team members

This specification is ready for implementation phase beginning 2026-03-31.

---

**Document prepared for:** Phase 5 Implementation Team
**Architecture pattern reference for:** Phase 6, Phase 7, Phase 8, Phase 9d
**Estimated implementation effort:** 2-3 weeks (8 modules + tests + integration)
**Dependencies:** Phase 1-4 complete, router/api/auth modules stable

