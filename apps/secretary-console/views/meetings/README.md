# Meetings View Module - Phase 5

## Overview

The meetings view implements a **modularized, tabbed interface** for managing meetings and their associated data (minutes, action items, motions, audit logs, public summaries).

This module establishes the **Coordinator Pattern** that serves as the reference architecture for Phase 6 (Business Hub) and subsequent frontend phases.

## Architecture

### Coordinator Pattern

The meetings view uses a **Coordinator Pattern** for component communication:

```
meetingsHandler()          ← Route handler in app.js
    ↓
meetings-view.js           ← Coordinator (orchestrates list + detail)
    ├→ meeting-list.js     ← List pane (renders meetings directory)
    │   └→ Custom Events:
    │       - "meeting-selected" → navigate to /meetings/:id
    │       - "refresh-requested" → reload list
    │
    └→ meeting-detail.js   ← Detail pane (tab manager)
        ├→ meeting-detail-header.js
        └→ tabs/
            ├→ minutes-tab.js
            ├→ action-items-tab.js
            ├→ motions-tab.js
            ├→ audit-tab.js
            └→ public-summary-tab.js
```

### Custom Events

Components communicate via **custom events** rather than direct callbacks:

| Event | Source | Listener | Payload |
|-------|--------|----------|---------|
| `meeting-selected` | meeting-list | meetings-view | `{ id, data }` |
| `refresh-requested` | meeting-list | meetings-view | (none) |
| `create-meeting` | meeting-list | (future) | (none) |

This decoupling allows:
- Loose coupling between components
- Easy testing (can spy on events)
- Extensibility (new listeners can be added without modifying sources)

## Module Details

### Core Modules

#### 1. **meetings-view.js** (111 lines)
**Role:** Coordinator and route handler

**Responsibilities:**
- Route handler for `/meetings` and `/meetings/:id`
- Load meetings list from API
- Load meeting detail if `:id` provided
- Create list and detail panes
- Wire custom event listeners
- Manage cleanup on route change

**API Calls:**
- `GET /meetings` - Fetch meetings list
- `GET /meetings/:id` - Fetch single meeting detail

**Exports:**
```javascript
export async function meetingsHandler(params, context) { }
```

#### 2. **meeting-list.js** (220 lines)
**Role:** Meetings directory with search/filter

**Features:**
- Search by location, topic
- Filter by status (scheduled, in-progress, approved, archived)
- Sort by date (newest first)
- Highlight selected meeting
- Responsive table view (scrollable on mobile)
- Empty state handling

**Functions:**
```javascript
export function createMeetingList() { }
export function renderMeetingsList(container, meetings, selectedId) { }
```

**Custom Events Fired:**
- `meeting-selected` - When row clicked
- `refresh-requested` - When refresh button clicked
- `create-meeting` - When + New Meeting button clicked

#### 3. **meeting-detail.js** (180 lines)
**Role:** Detail pane controller with tab manager

**Features:**
- Render meeting detail header
- Tab selector (Minutes, Actions, Motions, Audit, Summary)
- Lazy-load tab modules on first click
- Track active tab in local state
- Keyboard navigation (arrow keys)

**Functions:**
```javascript
export function createMeetingDetail(meeting) { }
export function renderMeetingDetail(container, meeting, selectedTab) { }
export function getActiveTab() { }
export function updateMeeting(meeting) { }
```

**Lazy Loading:**
- Tab modules loaded on first click (not on initial render)
- Modules cached after first load
- Reduces initial page load time

#### 4. **meeting-detail-header.js** (120 lines)
**Role:** Meeting metadata and action buttons

**Displays:**
- Meeting location and status
- Date, time, chair, secretary
- Tags and attendee count
- Action buttons (Export, More)

**Functions:**
```javascript
export function createMeetingDetailHeader(meeting) { }
export function updateMeetingDetailHeader(container, meeting) { }
```

### Tab Modules

#### 5. **minutes-tab.js** (245 lines)
**Features:**
- Edit/save meeting minutes
- Audio upload (drag-drop + file input)
- Transcription status display
- Version history (read-only)
- Export options (PDF, Markdown)
- Auto-save every 30 seconds
- Word count display

**API Calls:**
- `GET /meetings/:id/minutes`
- `POST /meetings/:id/minutes`
- `POST /meetings/:id/minutes/audio`
- `GET /meetings/:id/minutes/versions`

#### 6. **action-items-tab.js** (350 lines)
**Features:**
- List action items with status badges
- Add/edit/delete items with modals
- Mark complete
- Import/export CSV
- Filter and sort by due date
- Status tracking (not-started, in-progress, completed)

**API Calls:**
- `GET /meetings/:id/actions`
- `POST /meetings/:id/actions`
- `PUT /meetings/:id/actions/:actionId`
- `DELETE /meetings/:id/actions/:actionId`
- `POST /meetings/:id/actions/import-csv`
- `GET /meetings/:id/actions/export-csv`

#### 7. **motions-tab.js** (260 lines)
**Features:**
- List motions with voting records
- Create motion with mover/seconder
- Vote on pending motions (Yes/No/Abstain)
- View vote results and counts
- Delete motion with confirmation
- Status tracking (pending, passed, failed)

**API Calls:**
- `GET /meetings/:id/motions`
- `POST /meetings/:id/motions`
- `PUT /meetings/:id/motions/:motionId` (vote)
- `DELETE /meetings/:id/motions/:motionId`

#### 8. **audit-tab.js** (210 lines)
**Features:**
- Chronological audit trail (read-only)
- Actions: created, updated, approved, archived, deleted
- User and timestamp information
- Change details (what changed)
- Filter by action type
- Filter by user
- Newest entries first

**API Calls:**
- `GET /meetings/:id/audit`

#### 9. **public-summary-tab.js** (265 lines)
**Features:**
- Edit public-facing summary
- AI draft generation (feature-flagged, TODO)
- Preview mode
- Export (PDF, Markdown, plain text)
- Word count display
- Share link button
- Copy to clipboard

**API Calls:**
- `GET /meetings/:id/summary`
- `POST /meetings/:id/summary`
- `POST /meetings/:id/summary/export`

### Styling

#### 10. **meetings.css** (950 lines)
**Coverage:**
- Responsive grid layout (30/70 split on desktop, stacked on mobile)
- List pane (search, filter, table)
- Detail pane (header, tab bar, panels)
- Tab content styling (editors, lists, forms)
- Modal styling (add item, edit, etc.)
- Buttons and form controls
- **4 responsive breakpoints:**
  - 1024px (tablet) - Sidebar narrower, stacked layout
  - 768px (mobile) - Single column, tab icons only
  - 480px (extra small) - Simplified layouts, larger touch targets

## Responsive Design

### Desktop (>1024px)
- **Layout:** 30% list pane, 70% detail pane (side-by-side)
- **List:** Full table with all columns visible
- **Detail:** Full tab labels visible
- **Navigation:** Sidebar visible

### Tablet (768px - 1024px)
- **Layout:** Single column, toggle between list/detail
- **List:** 2-column table (location + date)
- **Detail:** Tab icons only (labels hidden)
- **Navigation:** Sidebar narrower

### Mobile (<768px)
- **Layout:** Single column, full-width panels
- **List:** Single-column layout with data-labels
- **Modals:** 95% width
- **Navigation:** Bottom nav visible, sidebar hidden
- **Touch targets:** Minimum 48px

## Integration Points

### With app.js

```javascript
import { meetingsHandler } from "./views/meetings/meetings-view.js";

// In route registration:
registerRoute("/meetings", (params, context) => {
  meetingsHandler(params, context);
});

registerRoute("/meetings/:id", (params, context) => {
  meetingsHandler(params, context);
});
```

### CSS Import

Add to `index.html` or `app.css`:
```html
<link rel="stylesheet" href="./views/meetings/meetings.css" />
```

### Expected DOM Elements

The coordinator expects these elements in HTML:
- `#meetingsView` - Main container for meetings interface
- (Other modals and elements created dynamically)

## Testing

### E2E Test IDs Preserved

All existing test IDs work unchanged:
- `data-testid="quick-submit"` - Quick create submit
- `data-testid="quick-cancel"` - Quick create cancel
- `data-testid="csv-apply"` - CSV import apply
- `data-testid="csv-cancel"` - CSV import cancel

### Test Patterns

**Unit Testing (per module):**
```javascript
import { createMeetingList, renderMeetingsList } from "./meeting-list.js";

// Test rendering with empty list
const container = document.createElement("div");
const list = createMeetingList();
container.appendChild(list);
renderMeetingsList(list, []);
// Assert empty state shown
```

**E2E Testing:**
```javascript
// Navigate to meetings
await page.goto("/meetings");

// Click a meeting
await page.click("[data-meeting-id='123']");

// Assert detail loaded
await page.waitForSelector(".meeting-detail-header");
```

**Custom Event Testing:**
```javascript
const container = document.createElement("div");
const list = createMeetingList();

let eventFired = false;
list.addEventListener("meeting-selected", (e) => {
  eventFired = true;
});

// Simulate click
const row = list.querySelector(".meeting-item");
row.click();

// Assert event fired
assert(eventFired);
```

## Performance Optimizations

1. **Lazy Tab Loading**
   - Tab modules not loaded until first click
   - Reduces initial bundle size
   - Modules cached after load

2. **Search/Filter Optimization**
   - Client-side filtering (no API calls)
   - Debouncing can be added if needed
   - Current API returns all meetings

3. **Minimal Re-renders**
   - DOM updates only when necessary
   - Event-driven architecture prevents cascading renders

4. **CSS Optimization**
   - Single CSS file (~950 lines)
   - No external dependencies
   - Responsive design with minimal media queries

## Memory Management

**Cleanup on Route Change:**
```javascript
export async function meetingsHandler(params, context) {
  // ... setup code ...

  // Cleanup function registered with router
  context?.onCleanup?.(() => {
    cleanup();
  });
}

function cleanup() {
  // Remove all event listeners
  unsubscribers.forEach(unsub => unsub());
  // Clear state
  currentMeetings = [];
  currentMeeting = null;
}
```

**Per-Module Cleanup:**
- Auto-save timers cleared on blur/tab switch
- Event listeners removed in cleanup functions
- Modal elements removed from DOM after close

## Error Handling

**API Error Handling:**
```javascript
try {
  const response = await request("/meetings", "GET");
  currentMeetings = response.data || response || [];
} catch (error) {
  showToast(`Failed to load meetings: ${error.message}`, { type: "error" });
  renderMeetingsList(listContainer, [], params.id);
}
```

**User Feedback:**
- Toast notifications for all async operations
- Error messages in modals
- Empty states for no data
- Loading spinners during fetch

## Future Enhancements

1. **Real-time Collaboration**
   - WebSocket integration for live updates
   - Concurrent editing indicators
   - Conflict resolution

2. **Advanced Search**
   - Full-text search across all fields
   - Filter by attendee
   - Date range filtering

3. **AI Features**
   - Auto-generate meeting summary (draft button in summary tab)
   - Automatic action item extraction
   - Meeting insights and analytics

4. **Export Enhancements**
   - PDF export with formatting
   - Word document export
   - Calendar integration

5. **Integrations**
   - Slack notifications
   - Email summaries
   - Calendar sync

## Code Standards

- **No external dependencies** (vanilla ES6+)
- **Comments only for complex logic** (code is self-documenting)
- **Consistent naming:** camelCase for functions/variables, kebab-case for CSS classes
- **Error handling on all async operations**
- **Memory cleanup** (event listeners removed, timers cleared)
- **Accessibility built-in** (semantic HTML, ARIA labels, keyboard navigation)
- **Mobile-first responsive approach**

## References

- [Coordinator Pattern](https://www.patterns.dev/posts/coordinator/)
- [Custom Events API](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [Lazy Loading Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Phase 5 Design Specification](../../../PHASE5_DESIGN_SPECIFICATION.md)
