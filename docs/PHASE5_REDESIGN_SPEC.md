# Phase 5 Redesign Specification: Full-Page Meetings Layout

**Version:** 1.0
**Date:** March 28, 2026
**Status:** Design Complete
**Scope:** Complete redesign of Phase 5 meetings view from 2-pane compressed layout to full-page list and detail views

---

## Executive Summary

Phase 5 currently uses a 2-pane squeezed layout (30% list / 70% detail) that compresses all content and creates poor user experience. This redesign moves to a full-page architecture with two distinct pages:

- **#/meetings** → Full-width list view (clean, scannable, spacious)
- **#/meetings/:id** → Full-width detail view with horizontal tabs (proper breathing room)

Benefits:
- **Readability**: Content no longer cramped into narrow panes
- **Usability**: Natural full-screen interaction model
- **Scalability**: Easy to add features without space constraints
- **Mobile**: Naturally stacks to single column
- **Performance**: Lazy-load detail views and tabs

---

## 1. Current State Analysis

### 1.1 What Phase 5 Currently Does

The Phase 5 implementation is in:
- `/apps/secretary-console/views/meetings/meetings-view.js` (coordinator)
- `/apps/secretary-console/views/meetings/meeting-list.js` (list pane, 30%)
- `/apps/secretary-console/views/meetings/meeting-detail.js` (detail pane, 70%)
- `/apps/secretary-console/views/meetings/meeting-detail-header.js` (header metadata)
- `/apps/secretary-console/views/meetings/tabs/*.js` (5 tab modules)

**Current Architecture:**
```
meetingsHandler()
  ├─ Creates <div class="meetings-layout"> (2-col)
  ├─ Renders list pane: <div class="meeting-list-pane"> (30%)
  │  ├─ Header: title + create button + refresh
  │  ├─ Search input
  │  ├─ Filter dropdown (status)
  │  └─ Meeting table (location, date, status, attendees)
  │
  └─ If :id provided, renders detail pane: <div class="meeting-detail-pane"> (70%)
     ├─ Header: location, date, status badge, metadata rows
     ├─ Tab bar: [Minutes] [Actions] [Motions] [Audit] [Summary]
     └─ Tab panels: lazy-loaded on first click

API Routes:
- GET /meetings → list all meetings
- GET /meetings/:id → get single meeting detail
```

**Tab Modules (reusable, will be kept):**
- `minutes-tab.js` - Editor for meeting notes
- `action-items-tab.js` - Task management
- `motions-tab.js` - Voting records
- `audit-tab.js` - Change log
- `public-summary-tab.js` - Shareable summary

### 1.2 Problems with 2-Pane Layout

1. **Horizontal space squeeze**: List pane (30%) too narrow for readable content
2. **Vertical constraint**: Detail pane (70%) tabs squeezed, hard to read content
3. **Inflexible growth**: Can't add features without redesigning layout
4. **Bad mobile experience**: Two-column layout breaks on tablet/mobile
5. **Cognitive overload**: User sees both list and detail simultaneously
6. **Scrolling hell**: Nested scroll areas (list scrolls, detail scrolls)
7. **Table rendering**: Meeting list table columns cut off or too small
8. **Editor constraint**: Minutes editor has no breathing room
9. **Action items**: Filtered/sorted items hard to manage in narrow pane
10. **Audio upload**: Audio section invisible or cut off

### 1.3 What Needs to Change

**Remove 2-pane constraint:**
- Delete `meetings-layout` class (2-col flexbox)
- Delete `meeting-list-pane` (30% width)
- Delete `meeting-detail-pane` (70% width)

**Create full-page views:**
- List page: `/meetings` route → full-width, scrollable, single pane
- Detail page: `/meetings/:id` route → full-width, tabs below header
- Navigation: list row click → navigate to `/meetings/:id`
- Back navigation: breadcrumb or back button → navigate to `/meetings`

**Reuse existing code:**
- Keep all 5 tab modules as-is (they work great)
- Keep API contracts unchanged
- Keep event-driven coordinator pattern
- Keep search/filter logic
- Keep existing test IDs for E2E tests

---

## 2. Full-Page Meeting List View (`#/meetings`)

### 2.1 Layout & Composition

```
┌─────────────────────────────────────────────────────────┐
│ CAM Operations Workspace                    ⚙️ Auth Status  │
├─────────────────────────────────────────────────────────┤
│ Sidebar │                                               │
├─────────┴──────────────────────────────────────────────┤
│                                                         │
│  Meetings                                [+ New Meeting] │
│                                                         │
│  Search... [🔍]          Status: [All ▼]  Sort: [Date ▼]│
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Location    │ Date      │ Status    │ Attendees │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ City Hall   │ Mar 28    │ Scheduled │ 12        │◄──┼─ Click → #/meetings/uuid
│  │ County Court│ Mar 26    │ Approved  │ 8         │  │
│  │ Town Square │ Mar 20    │ Archived  │ 15        │  │
│  │ Assembly    │ Mar 15    │ In Prog.. │ 6         │  │
│  │ ...         │ ...       │ ...       │ ...       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [← Previous] Page 1 of 3 [Next →]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Header Section

**Elements:**
- Page title: "Meetings" (large, h1)
- Create button: "+ New Meeting" (top right)
- Refresh button: "⟳" (icon button)
- Clear filters link: "Clear all" (visible only when filters active)

**HTML Structure:**
```html
<div class="meetings-list-header">
  <div class="header-title">
    <h1>Meetings</h1>
    <span class="meeting-count" id="meetingCount">0 meetings</span>
  </div>
  <div class="header-actions">
    <button class="btn btn-primary" id="createMeetingBtn">
      + New Meeting
    </button>
    <button class="btn-icon" id="refreshBtn" title="Refresh">⟳</button>
  </div>
</div>
```

### 2.3 Search & Filter Controls

**Search Box:**
- Full-width input at top
- Placeholder: "Search by location, topic, chair..."
- Debounced client-side search (300ms)
- Real-time results update

**Filter Controls:**
- Status dropdown: All, Scheduled, In Progress, Approved, Archived
- Date range selector (optional, future phase)
- Location filter (optional, future phase)
- Active filter badges with X to clear

**HTML Structure:**
```html
<div class="meetings-search-filter">
  <div class="search-container">
    <input
      type="text"
      id="meetingSearch"
      class="search-input"
      placeholder="Search by location, topic, chair..."
      aria-label="Search meetings"
    />
    <span class="search-icon">🔍</span>
  </div>

  <div class="filter-controls">
    <div class="filter-group">
      <label for="statusFilter">Status:</label>
      <select id="statusFilter" class="filter-select">
        <option value="all">All</option>
        <option value="scheduled">Scheduled</option>
        <option value="in-progress">In Progress</option>
        <option value="approved">Approved</option>
        <option value="archived">Archived</option>
      </select>
    </div>

    <div class="filter-badges" id="filterBadges">
      <!-- Active filters displayed as removable badges -->
      <!-- Example: <span class="badge-filter">Status: Scheduled ✕</span> -->
    </div>

    <button class="btn-text" id="clearFiltersBtn">Clear all</button>
  </div>
</div>
```

### 2.4 Meetings Table/Card View

**Display Modes (togglable):**
1. **Table View** (default, desktop)
   - Clean columns: Location | Date | Status | Attendees | Actions
   - Full width, readable
   - Hover effect on rows
   - Click row to navigate

2. **Card View** (mobile/compact)
   - Each meeting as a card
   - Location, date, status, attendees visible
   - Click card to navigate

**Table Structure (Full Width):**
```html
<div class="meetings-table-wrapper">
  <div class="table-row header">
    <div class="col-location">Location</div>
    <div class="col-date">Date/Time</div>
    <div class="col-status">Status</div>
    <div class="col-attendees">Attendees</div>
    <div class="col-actions">Actions</div>
  </div>

  <div class="table-row meeting" data-meeting-id="uuid">
    <div class="col-location">
      <span class="meeting-location">City Hall</span>
    </div>
    <div class="col-date">
      <span class="meeting-date">Mar 28, 2:00 PM</span>
    </div>
    <div class="col-status">
      <span class="badge badge-scheduled">Scheduled</span>
    </div>
    <div class="col-attendees">12</div>
    <div class="col-actions">
      <button class="btn-icon" title="View">→</button>
    </div>
  </div>

  <!-- More rows... -->
</div>
```

**Column Specifications:**

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| Location | 25% | Meeting location (city/hall name) | Yes |
| Date/Time | 20% | Formatted date + time | Yes |
| Status | 15% | Badge (scheduled, in-progress, approved, archived) | Yes |
| Attendees | 15% | Number of attendees | Yes |
| Actions | 25% | View detail button, quick actions | No |

### 2.5 Pagination

**Options:**
1. Limit: 50 meetings per page
2. Display: "Showing 1-50 of 234 meetings"
3. Controls: [← Previous] Page 1 of 5 [Next →]
4. Alternative: Infinite scroll (load more on scroll)

**HTML Structure:**
```html
<div class="meetings-pagination">
  <span class="pagination-info">Showing 1-50 of 234 meetings</span>
  <div class="pagination-controls">
    <button class="btn-secondary" id="prevPageBtn">← Previous</button>
    <span class="page-indicator">Page 1 of 5</span>
    <button class="btn-secondary" id="nextPageBtn">Next →</button>
  </div>
</div>
```

### 2.6 Empty State

**When no meetings exist:**
```html
<div class="empty-state">
  <div class="empty-icon">📋</div>
  <h2>No meetings yet</h2>
  <p>Create your first meeting to get started.</p>
  <button class="btn btn-primary" id="createMeetingBtn">
    + Create Meeting
  </button>
</div>
```

### 2.7 Navigation Flow

**User Actions:**
1. User navigates to `#/meetings`
2. Page loads meeting list
3. User searches/filters (real-time update)
4. User clicks row → navigate to `#/meetings/:id`
5. User clicks back/breadcrumb → navigate to `#/meetings`

**Events:**
- `meeting-selected` → trigger navigation to detail
- `refresh-requested` → reload list
- `create-meeting` → open create form (Phase X)

---

## 3. Full-Page Meeting Detail View (`#/meetings/:id`)

### 3.1 Layout & Composition

```
┌─────────────────────────────────────────────────────────┐
│ CAM Operations Workspace                    ⚙️ Auth Status  │
├─────────────────────────────────────────────────────────┤
│ Sidebar │                                               │
├─────────┴──────────────────────────────────────────────┤
│                                                         │
│ [← Meetings] / City Hall                     [Edit] [⋮] │
│                                                         │
│ Date: Mar 28, 2024  │  Time: 2:00 PM  │  Status: Sch.. │
│ Chair: John Doe     │  Secretary: Jane Smith            │
│ Attendees: 12       │  Tags: [Budget] [Planning]        │
│                                                         │
│ [Minutes] [Actions] [Motions] [Audit] [Summary]         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ─ Tab Content (Full Width) ─                          │
│                                                         │
│  Meeting Minutes for City Hall                          │
│                                                         │
│  [Audio Upload] [Transcript] [AI Draft] [⤓ Import]    │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ Comprehensive meeting notes with full editor  │   │
│  │ space. Line-by-line minutes with timestamps.  │   │
│  │                                                │   │
│  │ Multiple paragraphs, proper formatting.       │   │
│  │ No horizontal scroll needed. Full width!      │   │
│  │                                                │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  [Save] [Version History] [Export as PDF]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Header Section

**Metadata Display:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [← Meetings] / City Hall       [Edit] [Share] [⋮]   │
│                                                         │
│  📅 Mar 28, 2024 2:00 PM        Status: Scheduled      │
│  👤 Chair: John Doe             Secretary: Jane Smith  │
│  👥 Attendees: 12               Tags: [Budget] [Plan]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**HTML Structure:**
```html
<div class="meeting-detail-header">
  <!-- Back Navigation -->
  <div class="breadcrumb">
    <button class="btn-text" id="backToListBtn">← Meetings</button>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-current" id="meetingLocation">
      City Hall
    </span>
  </div>

  <!-- Title Row -->
  <div class="header-title-row">
    <h1 id="meetingTitle">City Hall Meeting</h1>
    <div class="header-actions">
      <button class="btn btn-secondary" id="editBtn">Edit</button>
      <button class="btn btn-secondary" id="shareBtn">Share</button>
      <button class="btn-icon" id="moreActionsBtn">⋮</button>
    </div>
  </div>

  <!-- Metadata Grid (2 rows x 3 columns) -->
  <div class="metadata-grid">
    <div class="metadata-item">
      <span class="meta-label">📅 Date</span>
      <span class="meta-value" id="meetingDate">Mar 28, 2024</span>
    </div>
    <div class="metadata-item">
      <span class="meta-label">🕐 Time</span>
      <span class="meta-value" id="meetingTime">2:00 PM</span>
    </div>
    <div class="metadata-item">
      <span class="meta-label">📊 Status</span>
      <span class="meta-value">
        <span class="badge badge-scheduled" id="meetingStatus">
          Scheduled
        </span>
      </span>
    </div>
    <div class="metadata-item">
      <span class="meta-label">👤 Chair</span>
      <span class="meta-value" id="meetingChair">John Doe</span>
    </div>
    <div class="metadata-item">
      <span class="meta-label">📝 Secretary</span>
      <span class="meta-value" id="meetingSecretary">Jane Smith</span>
    </div>
    <div class="metadata-item">
      <span class="meta-label">👥 Attendees</span>
      <span class="meta-value" id="attendeeCount">12</span>
    </div>
  </div>

  <!-- Tags -->
  <div class="metadata-item full-width">
    <span class="meta-label">🏷️ Tags</span>
    <div class="tag-list" id="meetingTags">
      <span class="tag">Budget</span>
      <span class="tag">Planning</span>
    </div>
  </div>
</div>
```

### 3.3 Tab Bar

**Design:**
- Horizontal tab bar below header
- Active tab: bottom border + accent color
- Tab labels: Minutes, Actions, Motions, Audit, Summary
- Click → switch content smoothly
- Scrollable on mobile if needed

**HTML Structure:**
```html
<div class="detail-tab-bar" role="tablist" aria-label="Meeting details">
  <button
    class="detail-tab active"
    id="tab-minutes"
    role="tab"
    aria-selected="true"
    aria-controls="minutes-panel"
    data-tab="minutes"
  >
    Minutes
  </button>
  <button
    class="detail-tab"
    id="tab-actions"
    role="tab"
    aria-selected="false"
    aria-controls="actions-panel"
    data-tab="actions"
  >
    Actions
  </button>
  <button
    class="detail-tab"
    id="tab-motions"
    role="tab"
    aria-selected="false"
    aria-controls="motions-panel"
    data-tab="motions"
  >
    Motions
  </button>
  <button
    class="detail-tab"
    id="tab-audit"
    role="tab"
    aria-selected="false"
    aria-controls="audit-panel"
    data-tab="audit"
  >
    Audit
  </button>
  <button
    class="detail-tab"
    id="tab-summary"
    role="tab"
    aria-selected="false"
    aria-controls="summary-panel"
    data-tab="public-summary"
  >
    Summary
  </button>
</div>
```

### 3.4 Tab Content Area

**Layout:**
- Full-width scrollable region
- Each tab panel takes 100% width
- No horizontal scroll
- Lazy load tab content on first view

**HTML Structure:**
```html
<div class="detail-panels-container">
  <div
    class="detail-panel active"
    id="minutes-panel"
    role="tabpanel"
    aria-labelledby="tab-minutes"
    data-tab="minutes"
    data-loaded="false"
  >
    <!-- Content loaded by minutes-tab.js -->
  </div>

  <div
    class="detail-panel hidden"
    id="actions-panel"
    role="tabpanel"
    aria-labelledby="tab-actions"
    data-tab="actions"
    data-loaded="false"
  >
    <!-- Content loaded by action-items-tab.js -->
  </div>

  <div
    class="detail-panel hidden"
    id="motions-panel"
    role="tabpanel"
    aria-labelledby="tab-motions"
    data-tab="motions"
    data-loaded="false"
  >
    <!-- Content loaded by motions-tab.js -->
  </div>

  <div
    class="detail-panel hidden"
    id="audit-panel"
    role="tabpanel"
    aria-labelledby="tab-audit"
    data-tab="audit"
    data-loaded="false"
  >
    <!-- Content loaded by audit-tab.js -->
  </div>

  <div
    class="detail-panel hidden"
    id="summary-panel"
    role="tabpanel"
    aria-labelledby="tab-summary"
    data-tab="public-summary"
    data-loaded="false"
  >
    <!-- Content loaded by public-summary-tab.js -->
  </div>
</div>
```

### 3.5 Tab Content Details

Each tab content area spans full width (no pane constraint).

#### Minutes Tab
- Full-width editor textarea
- Audio upload section (visible, not cramped)
- Transcription display
- AI draft button
- Version history
- Save/Cancel buttons

#### Actions Tab
- Full-width action items table
- Columns: Task | Owner | Due Date | Status | Priority
- Import/Export buttons (visible)
- Filter/Sort controls (not cramped)
- Add action item button

#### Motions Tab
- Full-width motion list
- Card or table view
- Each motion: description, proposer, status, vote count
- Voting controls (not squeezed)
- Add motion button

#### Audit Tab
- Full-width audit log table
- Columns: Timestamp | User | Action | Details
- Readable text
- Filter/search log
- Export log option

#### Summary Tab
- Full-width markdown editor
- Public-facing summary
- Export options (PDF, Markdown, HTML)
- Read-only preview toggle

### 3.6 Navigation

**Back Navigation:**
- Breadcrumb: "[← Meetings] / City Hall"
- Click "← Meetings" → navigate to `#/meetings`
- Preserves scroll position in list (browser native)

**Navigation Between Meetings (Future Enhancement):**
```html
<div class="meeting-nav">
  <button class="btn-secondary" id="prevMeetingBtn">← Previous</button>
  <span id="meetingCounter">3 of 10</span>
  <button class="btn-secondary" id="nextMeetingBtn">Next →</button>
</div>
```

---

## 4. Responsive Design Strategy

### 4.1 Breakpoints

| Breakpoint | Size | Layout |
|-----------|------|--------|
| Desktop | >900px | Full-width, table view, 3-col metadata grid |
| Tablet | 600-900px | Full-width, card view option, 2-col metadata grid |
| Mobile | <600px | Full-width, card view, 1-col metadata stack |

### 4.2 Desktop (>900px)

**List View:**
```
┌─────────────────────────────────────┐
│ Meetings        [+ New] [Refresh]   │
│ Search...  Status: [All ▼]          │
│ ┌─────────────────────────────────┐ │
│ │ Location │ Date │ Status │ Att... │
│ ├─────────────────────────────────┤ │
│ │ City Hall│ 3/28 │ Sched. │ 12    │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Detail View:**
```
┌─────────────────────────────────────┐
│ [← Meetings] / City Hall  [Edit]   │
│ Date: 3/28 │ Chair: John │ Status  │
│ [Minutes] [Actions] [Motions]...    │
│ ┌─────────────────────────────────┐ │
│ │ Full-width tab content...        │ │
│ │ No horizontal scroll needed      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4.3 Tablet (600-900px)

**List View:**
```
┌────────────────────────────┐
│ Meetings    [+ New]        │
│ Search...  Status: [All ▼] │
│ ┌──────────────────────┐   │
│ │ City Hall    3/28    │   │
│ │ Scheduled   12 attend│   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │ County Court 3/26    │   │
│ │ Approved     8 attend│   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

**Detail View:**
```
┌────────────────────────────┐
│ [← Meetings] / City Hall   │
│ Date: 3/28 | Chair: John   │
│ [Minutes] [Actions] ...    │
│ ┌──────────────────────┐   │
│ │ Tab content, stacked │   │
│ │ 100% width           │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

### 4.4 Mobile (<600px)

**List View:**
```
┌──────────────┐
│ Meetings     │
│ [+ New]      │
│ Search...    │
│ Status: [...] │
│ ┌────────────┐│
│ │ City Hall  ││
│ │ 3/28 12 att││
│ │ Scheduled  ││
│ └────────────┘│
│ ┌────────────┐│
│ │ County Crt ││
│ │ 3/26 8 att ││
│ │ Approved   ││
│ └────────────┘│
└──────────────┘
```

**Detail View:**
```
┌──────────────┐
│ [← Meetings] │
│ City Hall    │
│ 3/28 | Sched │
│ Chair: John  │
│ [Min][Act]..│
│ [Motions]    │
│ (scrollable) │
├──────────────┤
│ Tab content  │
│ Full width   │
│ Scrolls vert │
│ only         │
└──────────────┘
```

### 4.5 CSS Media Queries

```css
/* Desktop (>900px) */
@media (min-width: 901px) {
  .meetings-table-wrapper { display: block; }
  .meetings-card-view { display: none; }
  .metadata-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Tablet (600-900px) */
@media (max-width: 900px) and (min-width: 601px) {
  .meetings-table-wrapper { display: none; }
  .meetings-card-view { display: grid; grid-template-columns: repeat(2, 1fr); }
  .metadata-grid { grid-template-columns: repeat(2, 1fr); }
  .detail-tab-bar { flex-wrap: wrap; }
}

/* Mobile (<600px) */
@media (max-width: 600px) {
  .meetings-table-wrapper { display: none; }
  .meetings-card-view { display: grid; grid-template-columns: 1fr; }
  .metadata-grid { grid-template-columns: 1fr; }
  .detail-tab-bar { overflow-x: auto; flex-wrap: nowrap; }
  .detail-tab { flex-shrink: 0; }
}
```

---

## 5. Search & Filter Implementation

### 5.1 Search Strategy

**Client-Side Search:**
- Debounced input (300ms)
- Searches: location, chair, secretary, tags, topic
- Highlights matches in results
- No backend call needed

```javascript
function performSearch(term) {
  const lowerTerm = term.toLowerCase();
  const filtered = currentMeetings.filter(meeting =>
    meeting.location.toLowerCase().includes(lowerTerm) ||
    meeting.chair.toLowerCase().includes(lowerTerm) ||
    meeting.secretary.toLowerCase().includes(lowerTerm) ||
    (meeting.tags || []).some(t => t.toLowerCase().includes(lowerTerm))
  );
  return filtered;
}
```

**Debounce Implementation:**
```javascript
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const results = performSearch(e.target.value);
    renderMeetingsList(results);
  }, 300);
});
```

### 5.2 Filter Strategy

**Status Filter:**
- Select dropdown with options: All, Scheduled, In Progress, Approved, Archived
- Updates results in real-time
- Combines with search (AND logic)

```javascript
function applyFilters(meetings, filters) {
  let result = meetings;

  if (filters.status !== 'all') {
    result = result.filter(m => m.status === filters.status);
  }

  if (filters.search) {
    result = result.filter(m =>
      m.location.toLowerCase().includes(filters.search)
    );
  }

  return result;
}
```

**Filter Persistence:**
- Save filter state to localStorage
- Restore on page load
- "Clear all" button removes all filters

### 5.3 Filter UI

**Active Filter Badges:**
```html
<div class="filter-badges" id="filterBadges">
  <span class="badge-filter">
    Status: Scheduled
    <button class="badge-remove" data-filter="status">✕</button>
  </span>
  <span class="badge-filter">
    Chair: John Doe
    <button class="badge-remove" data-filter="chair">✕</button>
  </span>
</div>
```

---

## 6. Tab Switching & Performance

### 6.1 Tab Switching UX

**Click Tab → Instant Switch:**
1. User clicks "Actions" tab
2. Remove `active` class from "Minutes" tab
3. Add `active` class to "Actions" tab
4. Switch panel visibility (active/hidden)
5. Check if content loaded (`data-loaded="false"`)
6. If not loaded, call tab module to render content
7. Set `data-loaded="true"`

**Smooth Transitions:**
```css
.detail-panel {
  transition: opacity 0.2s ease-in-out;
}

.detail-panel.hidden {
  display: none;
  opacity: 0;
  pointer-events: none;
}

.detail-panel.active {
  display: block;
  opacity: 1;
  pointer-events: auto;
}
```

### 6.2 Lazy Loading Strategy

**Load on First Click:**
```javascript
function handleTabClick(tabId) {
  const panel = document.getElementById(`${tabId}-panel`);

  if (panel.dataset.loaded === 'false') {
    // Load tab content
    loadTabContent(tabId, currentMeeting);
    panel.dataset.loaded = 'true';
  }

  // Switch active tab
  switchTab(tabId);
}
```

**Tab Module Interface:**
```javascript
// Each tab module exports this function
export async function loadTabContent(container, meeting) {
  // Render tab content into container
}
```

### 6.3 Performance Notes

- **Minutes Tab:** Loaded first (auto-open)
- **Other Tabs:** Loaded on first click
- **Cache:** Keep loaded tabs in memory
- **Re-render:** Only if meeting data changes
- **Memory:** Unload tabs when detail view unmounts

---

## 7. API Integration

### 7.1 No Backend Changes Required

**Current API Contracts (unchanged):**
```
GET /meetings → { data: [...] }
GET /meetings/:id → { data: {...} }
POST /meetings → create
PUT /meetings/:id → update
DELETE /meetings/:id → delete
```

**New Usage Pattern:**
1. List view: GET /meetings (limit=50, offset=0)
2. Detail view: GET /meetings/:id (single meeting)
3. Tab content: Uses existing data from step 2
4. Same endpoints, different layout

### 7.2 Pagination Strategy

**Option 1: Offset/Limit (Implemented)**
```
GET /meetings?limit=50&offset=0 → first 50
GET /meetings?limit=50&offset=50 → next 50
```

**Option 2: Infinite Scroll (Future)**
```
GET /meetings?limit=50&offset=0 → first 50
Scroll → GET /meetings?limit=50&offset=50 → append to list
```

### 7.3 Loading States

**List View:**
```javascript
async function loadMeetingsList() {
  try {
    showToast("Loading meetings...");
    const response = await request("/meetings?limit=50&offset=0", "GET");
    renderList(response.data);
    showToast("Meetings loaded");
  } catch (error) {
    showToast(`Error: ${error.message}`, { type: "error" });
  }
}
```

**Detail View:**
```javascript
async function loadMeetingDetail(id) {
  try {
    showToast("Loading meeting...");
    const response = await request(`/meetings/${id}`, "GET");
    currentMeeting = response.data;
    renderDetail(currentMeeting);
    showToast("Meeting loaded");
  } catch (error) {
    showToast(`Error: ${error.message}`, { type: "error" });
  }
}
```

---

## 8. CSS Architecture

### 8.1 New CSS Classes

**Layout Classes:**
```css
.meetings-list-view { /* Full-page list container */ }
.meeting-detail-view { /* Full-page detail container */ }

.meetings-list-header { /* Header: title + actions */ }
.meetings-search-filter { /* Search + filter controls */ }
.meetings-table-wrapper { /* Table container */ }
.meetings-card-view { /* Card grid (mobile) */ }
.meetings-pagination { /* Pagination controls */ }

.meeting-detail-header { /* Header: metadata */ }
.metadata-grid { /* 3-column metadata layout */ }
.detail-tab-bar { /* Horizontal tab bar */ }
.detail-panels-container { /* Tab panels wrapper */ }
.detail-panel { /* Individual tab content */ }
```

**State Classes:**
```css
.active { /* Active tab/row */ }
.hidden { /* Hidden tab/element */ }
.selected { /* Selected meeting row */ }
```

### 8.2 CSS Structure (styles.css)

**Add to existing styles.css:**
```css
/* ===== PHASE 5 REDESIGN: FULL-PAGE LAYOUT ===== */

/* 1. List View Container */
.meetings-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
}

/* 2. List Header */
.meetings-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #d0c7bb;
}

.header-title {
  flex: 1;
}

.header-title h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.meeting-count {
  font-size: 14px;
  color: var(--muted);
  margin-left: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 3. Search & Filter */
.meetings-search-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 12px 16px 12px 40px;
  font-size: 14px;
  border: 1px solid #d0c7bb;
  border-radius: 12px;
  background: var(--panel);
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 16px;
  color: var(--muted);
}

.filter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d0c7bb;
  border-radius: 8px;
  background: var(--panel);
  font-size: 14px;
  cursor: pointer;
}

.filter-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--pill);
  border-radius: 8px;
  font-size: 13px;
}

.badge-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

/* 4. Table View */
.meetings-table-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid #d0c7bb;
  border-radius: 12px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 25% 20% 15% 15% 25%;
  padding: 16px;
  align-items: center;
  border-bottom: 1px solid #d0c7bb;
}

.table-row.header {
  background: var(--pill);
  font-weight: 600;
  border-bottom: 2px solid #d0c7bb;
}

.table-row.meeting {
  cursor: pointer;
  transition: background 0.2s;
}

.table-row.meeting:hover {
  background: var(--pill);
}

.table-row.meeting.selected {
  background: rgba(10, 93, 82, 0.05);
}

.col-location, .col-date, .col-status, .col-attendees, .col-actions {
  font-size: 14px;
}

.col-location {
  font-weight: 500;
}

/* 5. Card View (Mobile) */
.meetings-card-view {
  display: none;
  gap: 12px;
}

.meeting-card {
  padding: 16px;
  background: var(--panel);
  border: 1px solid #d0c7bb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.meeting-card:hover {
  box-shadow: var(--shadow);
}

.card-location {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
}

.card-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 13px;
  color: var(--muted);
}

/* 6. Pagination */
.meetings-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid #d0c7bb;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 7. Detail View Container */
.meeting-detail-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
}

/* 8. Detail Header */
.meeting-detail-header {
  padding-bottom: 20px;
  border-bottom: 1px solid #d0c7bb;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}

.breadcrumb-sep {
  color: var(--muted);
}

.header-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title-row h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadata-item.full-width {
  grid-column: 1 / -1;
}

.meta-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--muted);
}

.meta-value {
  font-size: 14px;
  font-weight: 500;
}

.tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 9. Tab Bar */
.detail-tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #d0c7bb;
  overflow-x: auto;
}

.detail-tab {
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
  transition: all 0.2s;
  white-space: nowrap;
}

.detail-tab:hover {
  color: var(--ink);
}

.detail-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* 10. Tab Panels */
.detail-panels-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.detail-panel {
  display: none;
  padding: 20px 0;
  font-size: 14px;
}

.detail-panel.active {
  display: block;
  animation: fadeIn 0.2s ease-in-out;
}

.detail-panel.hidden {
  display: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 11. Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 24px;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.empty-state p {
  color: var(--muted);
  margin: 0 0 20px 0;
}

/* ===== RESPONSIVE DESIGN ===== */

/* Tablet (600-900px) */
@media (max-width: 900px) {
  .table-row {
    grid-template-columns: 30% 30% 40%;
  }

  .col-date, .col-attendees {
    display: none;
  }

  .metadata-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    align-self: flex-end;
  }
}

/* Mobile (<600px) */
@media (max-width: 600px) {
  .meetings-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    align-self: flex-end;
    width: 100%;
    justify-content: flex-end;
  }

  .meetings-table-wrapper {
    display: none;
  }

  .meetings-card-view {
    display: grid;
    grid-template-columns: 1fr;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    width: 100%;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .detail-tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .detail-tab {
    font-size: 13px;
    padding: 10px 16px;
  }

  .table-row {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .col-status, .col-attendees {
    display: none;
  }
}
```

---

## 9. Implementation Sequence

### Phase 5a: List View (Days 1-2)

**Files to Create:**
1. `meeting-list-view.js` - Full-page list coordinator
   - Load meetings via API
   - Render list header (title + create + refresh)
   - Render search + filter controls
   - Render meeting table/cards
   - Handle row click → navigate to detail
   - Implement search/filter logic

2. Add CSS classes to `styles.css`
   - `.meetings-list-view`
   - `.meetings-list-header`
   - `.search-input`, `.filter-select`, `.filter-badges`
   - `.table-row`, `.meeting-card`

**Test IDs to Preserve:**
- `#meetingSearch` - search input
- `#statusFilter` - status dropdown
- `#createMeetingBtn` - new meeting button
- `.table-row` or `.meeting-card` - each row/card
- `#refreshBtn` - refresh button

### Phase 5b: Detail View (Days 2-3)

**Files to Create:**
1. `meeting-detail-view.js` - Full-page detail coordinator
   - Load meeting via API
   - Render detail header (breadcrumb + title + metadata)
   - Render horizontal tab bar
   - Create tab panels container
   - Handle tab click → load content if needed
   - Reuse existing tab modules (no changes)

2. Add CSS classes to `styles.css`
   - `.meeting-detail-view`
   - `.meeting-detail-header`, `.breadcrumb`
   - `.metadata-grid`, `.metadata-item`
   - `.detail-tab-bar`, `.detail-tab`
   - `.detail-panels-container`, `.detail-panel`

**Test IDs to Preserve:**
- `#backToListBtn` - back to list button
- `.detail-tab` - tab buttons
- `.detail-panel` - tab panels
- `#editBtn`, `#shareBtn` - action buttons

### Phase 5c: Routing (Day 3)

**Files to Modify:**
1. `index.html`
   - Change `#meetingsView` container to support full-page
   - Keep container, remove inline 2-pane structure

2. `core/router.js`
   - Update routes:
     - `#/meetings` → `meetingListHandler`
     - `#/meetings/:id` → `meetingDetailHandler`
   - May need to remove `meetings-view.js` coordinator

3. `app.js`
   - Register new routes
   - Import new coordinators

### Phase 5d: Responsive & Polish (Days 4-5)

**Tasks:**
1. Test responsive at all breakpoints (desktop, tablet, mobile)
2. Implement mobile card view
3. Add animations (tab switching, page transitions)
4. Polish styling (spacing, colors, borders)
5. Accessibility review (ARIA labels, semantic HTML)
6. Performance testing (lazy load tabs, pagination)

### Phase 5e: Testing (Day 5-6)

**Unit Tests:**
- List view: search, filter, pagination
- Detail view: tab switching, lazy loading
- Navigation: list → detail → list

**E2E Tests:**
- Navigate to #/meetings → see list
- Click meeting → navigate to #/meetings/:id
- Click back → navigate to #/meetings
- Click tab → content loads
- Search updates list

**Regression Tests:**
- All 5 tabs still work
- Existing test IDs preserved
- API endpoints unchanged

---

## 10. Comparison: Before vs After

### BEFORE: 2-Pane Compressed Layout

```
┌─────────────────────────────────────────────────────────┐
│ CAM Operations Workspace                    ⚙️ Auth Status  │
├─────────────────────────────────────────────────────────┤
│ Sidebar │                                               │
├─────────┴──────────────────────────────────────────────┤
│                                                         │
│  Meetings │ Selected Meeting (Detail) + 5 Tabs        │
│  List     │                                             │
│  (30%)    │ 📍 City Hall | 3/28 | ✓ Approved          │
│           │ Chair: John | Secretary: Jane              │
│  ┌──────┐ │ [Minutes] [Actions] [Motions] [Audit] ... │
│  │City  │ │ ┌──────────────────────────────────────┐  │
│  │Hall  │ │ │ _____ Minutes Editor _____           │  │
│  │3/28  │ │ │ [Hard to read, squeezed, scroll...]  │  │
│  │✓Sch..│ │ │ [Can't see full content]             │  │
│  ├──────┤ │ │ [Audio upload cut off]               │  │
│  │County│ │ │ [Version history hidden]             │  │
│  │Court │ │ └──────────────────────────────────────┘  │
│  │3/26  │ │ [Save] [Export]                          │
│  │✓App..│ │                                           │
│  └──────┘ │ (70%, cramped)                             │
│           │                                             │
│ (scroll)  │ (scroll)                                    │
│           │                                             │
└─────────────────────────────────────────────────────────┘
```

**Problems:**
- List: too narrow, text wrapped, hard to scan
- Detail: tabs cramped horizontally, editor textarea too narrow
- No breathing room anywhere
- Mobile: breaks (two columns stacked)
- Cognitive load: seeing both simultaneously

### AFTER: Full-Page Clean Layout

**List Page (#/meetings):**
```
┌─────────────────────────────────────────────────────────┐
│ CAM Operations Workspace                    ⚙️ Auth Status  │
├─────────────────────────────────────────────────────────┤
│ Sidebar │                                               │
├─────────┴──────────────────────────────────────────────┤
│                                                         │
│  Meetings                                 [+ New Meeting]│
│  Search... [🔍]     Status: [All ▼]                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Location    │ Date    │ Status   │ Attendees │    │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ City Hall   │ Mar 28  │ Scheduled│ 12       │ → │ │
│  │ County Court│ Mar 26  │ Approved │ 8        │ → │ │
│  │ Town Square │ Mar 20  │ Archived │ 15       │ → │ │
│  │ Assembly    │ Mar 15  │ In Prog..│ 6        │ → │ │
│  │ ...         │ ...     │ ...      │ ...      │ → │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [← Previous] Page 1 of 3 [Next →]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Detail Page (#/meetings/:id):**
```
┌─────────────────────────────────────────────────────────┐
│ CAM Operations Workspace                    ⚙️ Auth Status  │
├─────────────────────────────────────────────────────────┤
│ Sidebar │                                               │
├─────────┴──────────────────────────────────────────────┤
│                                                         │
│  [← Meetings] / City Hall                   [Edit] [⋮] │
│                                                         │
│  📅 Date: Mar 28, 2024      🕐 Time: 2:00 PM          │
│  👤 Chair: John Doe          📝 Secretary: Jane Smith   │
│  👥 Attendees: 12            🏷️ Tags: [Budget] [Plan]  │
│                                                         │
│  [Minutes] [Actions] [Motions] [Audit] [Summary]        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Meeting Minutes for City Hall                          │
│                                                         │
│  [Upload Audio] [View Transcript] [🤖 Draft] [⤓ Import]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ The meeting was called to order at 2:00 PM by │   │
│  │ Chair John Doe. All members were present.      │   │
│  │                                                 │   │
│  │ First item on agenda: Budget Review            │   │
│  │ Committee chair provided overview of proposed  │   │
│  │ budget allocations for fiscal year 2024-2025.  │   │
│  │                                                 │   │
│  │ Discussion points:                              │   │
│  │ - Proposed increase in operations by 5%        │   │
│  │ - Capital expenditures for new infrastructure  │   │
│  │ - Contingency reserves                         │   │
│  │                                                 │   │
│  │ Motion to approve budget: PASSED               │   │
│  │ Votes: 11 yes, 1 abstain                       │   │
│  │                                                 │   │
│  │ (Full editor with complete breathing room) │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Save Changes] [Version History] [Export as PDF]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- List: full-width, readable columns, scannable
- Detail: tabs at top, content below, full screen for editing
- Breathing room: plenty of white space
- Mobile: naturally stacks (one column)
- Focus: one task at a time (list or detail, not both)

---

## 11. API Contracts (Unchanged)

### List Endpoint
```
GET /meetings?limit=50&offset=0

Response:
{
  "data": [
    {
      "id": "uuid",
      "location": "City Hall",
      "date": "2024-03-28",
      "time": "14:00",
      "status": "scheduled",
      "chair": "John Doe",
      "secretary": "Jane Smith",
      "attendeeCount": 12,
      "tags": ["Budget", "Planning"]
    },
    ...
  ],
  "total": 234,
  "limit": 50,
  "offset": 0
}
```

### Detail Endpoint
```
GET /meetings/:id

Response:
{
  "data": {
    "id": "uuid",
    "location": "City Hall",
    "date": "2024-03-28",
    "time": "14:00",
    "status": "scheduled",
    "chair": "John Doe",
    "secretary": "Jane Smith",
    "attendeeCount": 12,
    "tags": ["Budget", "Planning"],
    "minutes": { ... },
    "actionItems": [ ... ],
    "motions": [ ... ],
    "audit": [ ... ],
    "summary": { ... }
  }
}
```

---

## 12. Testing Checklist

### Unit Tests

**List View:**
- [ ] Load meetings from API
- [ ] Render meeting table with correct columns
- [ ] Search filters meetings in real-time
- [ ] Status filter updates results
- [ ] Pagination controls work
- [ ] Row click emits meeting-selected event
- [ ] Create button visible and clickable

**Detail View:**
- [ ] Load meeting from API
- [ ] Render header with metadata
- [ ] Render all 5 tab buttons
- [ ] Minutes tab loads on init
- [ ] Tab click switches active tab
- [ ] Other tabs lazy load on first click
- [ ] Back button navigates to list
- [ ] Edit/Share/More buttons visible

**Navigation:**
- [ ] #/meetings → list view
- [ ] Click row → #/meetings/:id
- [ ] Back button → #/meetings
- [ ] Direct link #/meetings/uuid → detail view

### E2E Tests

- [ ] Navigate to #/meetings, see list
- [ ] Search for "City Hall", see filtered results
- [ ] Filter by status "Approved", see 1 result
- [ ] Click meeting row, navigate to detail page
- [ ] See meeting metadata in header
- [ ] Click "Actions" tab, content loads
- [ ] Click back button, return to list
- [ ] List still shows previous filter

### Responsive Tests

- [ ] Desktop (1920px): table view, 3-col metadata
- [ ] Tablet (800px): card view, 2-col metadata
- [ ] Mobile (400px): card view, 1-col metadata
- [ ] Mobile: horizontal tab bar scrollable
- [ ] Mobile: no horizontal scrolling on detail

### Regression Tests

- [ ] All 5 tabs still render content
- [ ] Existing test IDs still work
- [ ] API endpoints return same data
- [ ] No console errors
- [ ] Accessibility: tab order, ARIA labels

---

## 13. Success Criteria

**Functional:**
- [ ] Full-page list view loads and renders 50 meetings
- [ ] Full-page detail view loads and renders meeting
- [ ] Search/filter work in real-time
- [ ] All 5 tabs load content (lazy loaded)
- [ ] Navigation between list and detail works
- [ ] Back button/breadcrumb return to list
- [ ] No horizontal scrolling on any viewport

**Performance:**
- [ ] List loads <2s on 4G
- [ ] Detail loads <1s on 4G (with cached API)
- [ ] Tab switch instant (<200ms)
- [ ] Tab content lazy loads <500ms
- [ ] No layout shift when content loads
- [ ] Pagination doesn't block UI

**UX:**
- [ ] Full-width content readable (>45 chars/line, <100 chars)
- [ ] Spacing consistent (20px, 12px rhythm)
- [ ] Hover states clear
- [ ] Active states highlighted
- [ ] Empty state shows helpful message
- [ ] Loading states clear

**Accessibility:**
- [ ] ARIA labels on all buttons
- [ ] Tab order logical
- [ ] Semantic HTML (nav, main, section, article)
- [ ] Color contrast ≥4.5:1
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

**Technical:**
- [ ] No console errors
- [ ] Existing test IDs preserved
- [ ] API contracts unchanged
- [ ] CSS classes follow naming convention
- [ ] Code comments explain layout decisions
- [ ] Responsive media queries in styles.css

---

## 14. Timeline & Effort

| Phase | Task | Days | Owner |
|-------|------|------|-------|
| 5a | List view coordinator + rendering | 2 | Frontend |
| 5b | Detail view coordinator + tabs | 2 | Frontend |
| 5c | Routing + app integration | 1 | Frontend |
| 5d | Responsive + polish + animations | 1-2 | Frontend |
| 5e | Testing + E2E | 1-2 | QA + Frontend |
| **Total** | **Full Phase 5 Redesign** | **6-7 days** | |

---

## 15. Appendix: ASCII Diagrams

### Mobile: List View
```
┌──────────────────┐
│ CAM Console      │
├──────────────────┤
│ Meetings [+ New] │
│                  │
│ Search...        │
│ Status: [All ▼]  │
│                  │
│ ┌──────────────┐ │
│ │ City Hall    │ │
│ │ 3/28 Sched   │ │
│ │ 12 attendees │ │
│ └──────────────┘ │
│                  │
│ ┌──────────────┐ │
│ │ County Court │ │
│ │ 3/26 Approv. │ │
│ │ 8 attendees  │ │
│ └──────────────┘ │
│                  │
└──────────────────┘
```

### Mobile: Detail View
```
┌──────────────────┐
│ [← Meetings]     │
│ City Hall        │
│                  │
│ 3/28 | Scheduled │
│ Chair: John      │
│ 12 attendees     │
│                  │
│ [Min][Act][Mot]  │
│ (→ scrollable)   │
│                  │
├──────────────────┤
│                  │
│ Minutes editor   │
│ with full width  │
│ text area for    │
│ comprehensive    │
│ meeting notes.   │
│                  │
│ [Save] [Export]  │
│                  │
└──────────────────┘
```

### Tablet: List View
```
┌─────────────────────────────────┐
│ Meetings              [+ New]    │
│ Search...   Status: [All ▼]      │
│ ┌───────────────────────────────┐│
│ │ City Hall         3/28         ││
│ │ Scheduled         12 attendees ││
│ └───────────────────────────────┘│
│ ┌───────────────────────────────┐│
│ │ County Court      3/26         ││
│ │ Approved          8 attendees  ││
│ └───────────────────────────────┘│
│ ┌───────────────────────────────┐│
│ │ Town Square       3/20         ││
│ │ Archived          15 attendees ││
│ └───────────────────────────────┘│
└─────────────────────────────────┘
```

### Tablet: Detail View
```
┌─────────────────────────────────┐
│ [← Meetings] / City Hall [Edit] │
│                                 │
│ Date: 3/28      Chair: John    │
│ Attendees: 12   Status: Sched.. │
│                                 │
│ [Minutes] [Actions] [Motions]   │
│ [Audit] [Summary]               │
│                                 │
├─────────────────────────────────┤
│                                 │
│ ─ Minutes Editor (Full Width) ─ │
│                                 │
│ ┌───────────────────────────────┐│
│ │ Comprehensive meeting minutes ││
│ │ with proper spacing and       ││
│ │ readable font size.           ││
│ │                               ││
│ │ Full-width content without    ││
│ │ horizontal scrolling.         ││
│ │                               ││
│ └───────────────────────────────┘│
│                                 │
│ [Save] [Export] [Version Hist]  │
│                                 │
└─────────────────────────────────┘
```

---

## 16. Migration Notes

### From Current Phase 5

**Keep:**
- All 5 tab modules (minutes, actions, motions, audit, summary)
- Tab loading logic (lazy load on first click)
- API contracts (GET /meetings, GET /meetings/:id)
- Test IDs in list and detail components
- Event-driven communication pattern

**Remove:**
- `meetings-layout` 2-column flexbox
- `meeting-list-pane` 30% width constraint
- `meeting-detail-pane` 70% width constraint
- Side-by-side rendering in `meetings-view.js`

**Add:**
- `meetings-list-view.js` - full-page list coordinator
- `meeting-detail-view.js` - full-page detail coordinator
- Full-page CSS classes to `styles.css`
- Responsive media queries for tablet/mobile
- Tab bar styling (horizontal tabs)
- Breadcrumb navigation

**No Backend Changes:**
- Same API endpoints
- Same data contracts
- Same database schema
- Same auth/role checks

---

## Summary

This specification provides a complete redesign of Phase 5 to move from a cramped 2-pane layout to clean, full-page list and detail views. The design maintains all existing functionality (5 tabs, search, filter, pagination) while dramatically improving UX through:

1. **Full-width content** - No more squeezed panes
2. **Responsive mobile** - Natural single-column layout
3. **Better readability** - Proper line length, font size, spacing
4. **Focus-based interaction** - One task at a time (list or detail)
5. **Scalable architecture** - Easy to add features without space constraints

**Timeline: 6-7 days** (2 days list, 2 days detail, 1 day routing, 1-2 days responsive, 1-2 days testing)

**Zero breaking changes** to API, tests, or existing components.

