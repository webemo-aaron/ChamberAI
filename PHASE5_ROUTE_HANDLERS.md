# Phase 5: Route Handler Implementation Guide

## Overview

The new `app.js` entry point (493 lines) is ready for Phase 5 view handler population. Three route handlers have placeholder implementations that will be filled with view rendering logic.

**File:** `apps/secretary-console/app.js` (lines 152-180)

## Route Handler Structure

Each route handler follows this pattern:

```javascript
/**
 * Handle [view] route
 * @param {Object} params - Route parameters (e.g., { id: "123" })
 */
async function handlerName(params) {
  // Phase 5: Move [view] rendering here
  showToast("Loading [view]...");
}
```

### Available in Handlers

All route handlers have access to:

```javascript
// Core utilities
getCurrentRole()              // Returns current user role
setRole(role, email, name)   // Update user role
navigate(route)               // Change route
request(path, method, data)   // Make API calls
showToast(message)           // Show user feedback

// Modules
getApiBase()                 // Get API endpoint
onAuthStateChange(handler)   // Listen for auth changes
loadSettings(request)        // Load user settings
saveSettings(request, patch) // Save user settings
BillingService               // Subscription management

// DOM Elements (via global refs)
loginModal                   // Auth modal
meetingSearch               // Search input
openModal(modal, options)    // Show modal
closeModal(modal, options)   // Hide modal
```

## Route Handlers to Implement

### 1. meetingsHandler (Line 160-165)

**Route:** `/meetings`

**Current Implementation:**
```javascript
async function meetingsHandler(params) {
  // Phase 5: Move meeting list rendering here
  showToast("Loading meetings...");
}
```

**From Old App.js, Move:**
- `loadMeetings()` - Fetch meetings from API
- `renderMeetings()` - Render meeting list
- Meeting list event listeners:
  - Refresh button (#refreshMeetings)
  - Quick create button (#quickCreate)
  - Create button (#createBtn)
  - Meeting card click handlers
  - Search & filter interactions
  - Tag chips, status filter, recent filter

**UI Elements to Manage:**
- #meetingList (container)
- #meetingEmpty (no results message)
- #meetingCount (count badge)
- #meetingStatus (status display)
- #meetingMeta (metadata panel)
- #newMeetingError (error message)
- #tagChips (tag filter chips)
- #statusFilter (status dropdown)
- #recentFilter (time filter)
- #meetingSearch (search input)
- #advancedSearchQuery (advanced search)
- #clearFilters (reset button)

**Expected Behavior:**
- Load meetings on route entry or refresh
- Display list with pagination/scrolling
- Filter by tags, status, date
- Search by title/location
- Show empty state if no meetings
- Show count and metadata
- Handle quick create modal

### 2. meetingDetailHandler (Line 167-173)

**Route:** `/meetings/:id`

**Current Implementation:**
```javascript
async function meetingDetailHandler(params) {
  // Phase 5: Move meeting detail rendering here
  if (params.id) {
    showToast(`Loading meeting ${params.id}...`);
  }
}
```

**From Old App.js, Move:**
- `selectMeeting(id)` - Load meeting details
- `renderMeetingDetail()` - Render detail panel
- All tab panel handlers:
  - Minutes tab: renderMinutes, saveMinutes, minutesAutosave
  - Actions tab: renderActionItems, addActionItem, deleteActionItem
  - Audit tab: renderAuditLog
  - Motions tab: renderMotions, addMotion, deleteMotion
  - Public Summary tab: renderPublicSummary, generatePublicSummary

**UI Elements to Manage:**
- #metaEndTime, #metaTags (metadata)
- #flagNoMotions, #flagNoActionItems, #flagNoAdjournment (flags)
- #saveMeta (metadata save button)
- #minutesContent (minutes editor)
- #saveMinutesBtn (save minutes)
- #collabStatus (collaboration status)
- #versionHistoryList (version history)
- #actionItemsList (actions list)
- #addActionBtn (add action)
- #motionsList (motions list)
- #addMotionBtn (add motion)
- #exportPdf, #exportDocx, #exportMinutesMd (export buttons)
- #publicSummaryTitle, #publicSummaryHighlights, etc. (summary fields)
- #savePublicSummary (save summary)
- #generatePublicSummary (AI generation)
- #publishPublicSummary (publish)

**Expected Behavior:**
- Load meeting by ID from API
- Display tabs (minutes, actions, audit, motions, public summary)
- Handle collaborative editing with sync
- Show version history and rollback
- Manage approval workflows
- Export to multiple formats
- Generate public summaries
- Track changes in audit log

### 3. businessHubHandler (Line 175-180)

**Route:** `/business-hub`

**Current Implementation:**
```javascript
async function businessHubHandler(params) {
  // Phase 5: Move business hub rendering here
  showToast("Loading business hub...");
}
```

**From Old App.js, Move:**
- `renderBusinessHub()` - Render hub view
- `loadBusinessListings()` - Fetch listings
- Business hub event listeners:
  - View toggle (map/list)
  - Directory display
  - Detail panel interactions
  - Business card modals

**UI Elements to Manage:**
- Business hub view container
- Business listing cards
- Detail panel with tabs
- Map view (if implemented)
- Search & filter (geo scope, type)
- Modals (business details, quote requests)

**Expected Behavior:**
- Display business directory
- Support map/list view toggle
- Filter by location/category
- Show business details on click
- Handle quote requests
- Track engagement metrics

## Implementation Strategy

### Phase 5a: meetingsHandler
1. Move `loadMeetings()` and `renderMeetings()` into handler
2. Register all event listeners inside handler
3. Test with existing UI elements
4. Verify meeting list renders and updates

### Phase 5b: meetingDetailHandler
1. Move detail view and tab renderers into handler
2. Register tab activation handlers
3. Move minutes editing (with collaborative sync)
4. Move action/motion management
5. Move export functionality
6. Test full detail flow

### Phase 5c: businessHubHandler
1. Move business hub rendering
2. Move business listing display
3. Test with existing business data

## Testing Checklist

For each handler:

```javascript
[ ] Handler receives route params correctly
[ ] API calls succeed with showToast feedback
[ ] UI elements render without errors
[ ] All event listeners attached
[ ] Navigation works (navigate() calls)
[ ] Modals open/close properly
[ ] Auth state honored (role-based display)
[ ] E2E tests pass (element selectors work)
[ ] Error handling for API failures
[ ] Graceful degradation for missing elements
```

## localStorage Keys Used

These keys persist across sessions and should be preserved:

- `camApiBase` - API endpoint
- `camRole` - User role
- `camEmail` - User email
- `camDisplayName` - User display name
- `camOnboardingDismissed` - Banner state

## Common Patterns

### Load Data with Feedback
```javascript
async function meetingsHandler(params) {
  showToast("Loading meetings...");
  try {
    const meetings = await request("/meetings", "GET");
    // render...
  } catch (error) {
    showToast(`Error: ${error.message}`, { type: "error" });
  }
}
```

### Check Permissions
```javascript
const role = getCurrentRole();
if (role === "admin" || role === "secretary") {
  // Show admin controls
}
```

### Open Modal
```javascript
openModal(loginModal, {
  returnFocus: createBtn,
  initialFocus: loginEmail
});
```

### Change Route
```javascript
function selectMeeting(id) {
  navigate(`/meetings/${id}`);
}
```

## Notes

- All view state should be local to handlers (no global state)
- Use request() for all API calls (it handles auth headers)
- Always show toast feedback for async operations
- Preserve all existing DOM element IDs for backward compatibility
- Test E2E tests still pass with new handler structure
