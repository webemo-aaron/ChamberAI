# Phase 5 Redesign - Quick Start Guide

**Date:** March 28, 2026
**For:** Frontend Development Team
**Duration:** 6-7 days implementation + testing

---

## One-Page Overview

**Goal:** Transform Phase 5 from compressed 2-pane layout to clean, full-page list and detail views.

```
BEFORE:                          AFTER:
┌──────────────────────────┐    List Page (#/meetings):
│ Meetings | Detail + Tabs │    ┌─ Full-width list ─────┐
│  (30%)    │   (70%)      │    │ Location | Date | ... │
│           │ Squeezed!    │    └───────────────────────┘
└──────────────────────────┘
                                Detail Page (#/meetings/:id):
                                ┌─ Full-width detail ──┐
                                │ [← Meetings] / City   │
                                │ [Minutes] [Actions]..│
                                │ Full-width content    │
                                └──────────────────────┘
```

---

## Phase Breakdown

### Phase 5a: List View (Days 1-2)
**File:** `meeting-list-view.js` (new)

**What it does:**
- Load meetings from API
- Render full-width table/cards
- Search & filter (real-time)
- Pagination (50 items/page)
- Click row → navigate to detail

**Test IDs to keep:**
- `#meetingSearch`, `#statusFilter`, `#createMeetingBtn`, `#refreshBtn`

**CSS:** Add `.meetings-list-view`, `.search-input`, `.table-row`, `.meeting-card` to styles.css

### Phase 5b: Detail View (Days 2-3)
**File:** `meeting-detail-view.js` (new)

**What it does:**
- Load single meeting from API
- Render header with metadata grid
- Render 5 horizontal tabs
- Lazy-load tab content (reuse existing tab modules)
- Back button → navigate to list

**Test IDs to keep:**
- `#backToListBtn`, `.detail-tab`, `.detail-panel`

**CSS:** Add `.meeting-detail-view`, `.detail-tab-bar`, `.detail-panel` to styles.css

### Phase 5c: Routing (Day 3)
**Files to update:** `router.js`, `index.html`, `app.js`

**What to do:**
- Route `#/meetings` → `meetingListHandler`
- Route `#/meetings/:id` → `meetingDetailHandler`
- Keep `#meetingsView` container
- Remove 2-pane structure from HTML

### Phase 5d: Responsive & Polish (Days 4-5)
**Breakpoints:**
- Desktop (>900px): Table view, 3-col metadata
- Tablet (600-900px): Card view, 2-col metadata
- Mobile (<600px): Card view, 1-col metadata

**What to do:**
- Test all breakpoints
- Add media queries (provided in spec section 9)
- Polish animations (tab switching, page transitions)
- Accessibility review

### Phase 5e: Testing (Days 5-6)
**Test categories:**
- Unit: search, filter, pagination, tab switching
- E2E: full workflow (list → click → detail → back)
- Responsive: all three breakpoints
- Regression: all 5 tabs still work

---

## File Changes Summary

### NEW FILES (2)
```
apps/secretary-console/views/meetings/meeting-list-view.js
apps/secretary-console/views/meetings/meeting-detail-view.js
```

### MODIFIED FILES (4)
```
apps/secretary-console/styles.css              (+390 lines of CSS)
apps/secretary-console/core/router.js          (add 2 routes)
apps/secretary-console/index.html              (remove 2-pane div)
apps/secretary-console/app.js                  (import new handlers)
```

### UNCHANGED FILES (keep as-is)
```
apps/secretary-console/views/meetings/tabs/*.js (all 5 tabs work as-is)
apps/secretary-console/views/meetings/meeting-detail-header.js (reuse)
services/api-firebase/src/routes/meetings.js   (same API)
```

---

## Key Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| List load | <2s | 4G speed, 50 meetings |
| Detail load | <1s | Cached API response |
| Tab switch | Instant | <200ms |
| Mobile: no scroll | 100% | Width ≤ 100vw |
| Readability | 45-100 chars/line | Optimal reading width |
| Responsive tested | 3 breakpoints | 1920px, 800px, 400px |

---

## Implementation Checklist

### Phase 5a Checklist
- [ ] Create `meeting-list-view.js`
- [ ] API call: GET `/meetings?limit=50&offset=0`
- [ ] Render list header (title, create button, refresh)
- [ ] Render search box (debounced 300ms)
- [ ] Render status filter dropdown
- [ ] Render meeting table/cards
- [ ] Render pagination controls
- [ ] Handle row click → emit meeting-selected event
- [ ] Add CSS classes to styles.css
- [ ] Unit test: search, filter, pagination

### Phase 5b Checklist
- [ ] Create `meeting-detail-view.js`
- [ ] API call: GET `/meetings/:id`
- [ ] Render detail header (breadcrumb, title, metadata grid)
- [ ] Render horizontal tab bar (5 tabs)
- [ ] Create tab panels container
- [ ] Handle tab click → lazy load content
- [ ] Reuse all 5 existing tab modules
- [ ] Back button → navigate to list
- [ ] Add CSS classes to styles.css
- [ ] Unit test: tab switching, lazy loading

### Phase 5c Checklist
- [ ] Update router.js: add `#/meetings` and `#/meetings/:id` routes
- [ ] Update app.js: import new handlers
- [ ] Update index.html: remove hardcoded 2-pane divs
- [ ] Test navigation: list → detail → back

### Phase 5d Checklist
- [ ] Test desktop (1920px): table view, 3-col metadata
- [ ] Test tablet (800px): card view, 2-col metadata
- [ ] Test mobile (400px): card view, 1-col metadata
- [ ] Add media queries to styles.css
- [ ] Test no horizontal scrolling at any size
- [ ] Polish tab switching animation (fade-in 200ms)
- [ ] Accessibility: ARIA labels, keyboard nav, color contrast

### Phase 5e Checklist
- [ ] Unit: search filters meetings
- [ ] Unit: status filter works
- [ ] Unit: pagination navigation
- [ ] Unit: tab click switches active tab
- [ ] Unit: lazy loading loads tab content
- [ ] E2E: navigate to #/meetings → see list
- [ ] E2E: search for "City Hall" → filtered
- [ ] E2E: click row → navigate to #/meetings/:id
- [ ] E2E: see meeting metadata
- [ ] E2E: click "Actions" tab → content loads
- [ ] E2E: click back → navigate to #/meetings
- [ ] Responsive: all 3 breakpoints tested
- [ ] Regression: all 5 tabs render content
- [ ] Regression: test IDs preserved
- [ ] No console errors

---

## CSS Quick Reference

**All CSS classes needed (copy from spec section 9):**

```css
/* Layout */
.meetings-list-view
.meeting-detail-view

/* List View */
.meetings-list-header
.meetings-search-filter
.search-input
.filter-select
.filter-badges
.badge-filter
.meetings-table-wrapper
.table-row
.meetings-card-view
.meeting-card
.meetings-pagination

/* Detail View */
.meeting-detail-header
.breadcrumb
.metadata-grid
.metadata-item
.detail-tab-bar
.detail-tab
.detail-panels-container
.detail-panel

/* States */
.active
.hidden
.selected
```

**Total CSS addition:** ~390 lines to styles.css (section 9 of spec)

---

## API Contracts (No Changes)

### GET /meetings
```json
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
      "tags": ["Budget"]
    }
  ],
  "total": 234,
  "limit": 50,
  "offset": 0
}
```

### GET /meetings/:id
```json
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
    "tags": ["Budget"],
    "minutes": { ... },
    "actionItems": [ ... ],
    "motions": [ ... ],
    "audit": [ ... ],
    "summary": { ... }
  }
}
```

---

## Testing Commands (Example)

```bash
# Unit test: search
npm test -- meeting-list-view.spec.js

# E2E test: full workflow
npx playwright test --grep "meetings-workflow"

# Responsive test
npx playwright test --headed --device="iPhone 12"

# Accessibility
npx jest --testPathPattern=accessibility

# All tests
npm test
```

---

## Known Constraints & Future Work

**In Scope for Phase 5:**
- List view with pagination
- Detail view with 5 tabs
- Search & basic filter (status)
- Responsive at 3 breakpoints
- Back navigation (breadcrumb)

**Out of Scope (Future Phases):**
- Create/edit meeting forms (Phase 7-8)
- Date range filter (optional enhancement)
- Meeting duplication
- Bulk actions
- Advanced search
- Custom columns
- Favorites/bookmarks

---

## Quick Wins (Optional Enhancements)

If ahead of schedule, consider:

1. **Previous/Next buttons** in detail header (navigate between meetings without returning to list)
2. **Deep linking** with tab support: `#/meetings/:id?tab=actions`
3. **Filter persistence** in localStorage
4. **Empty state** with helpful message when no meetings
5. **Keyboard shortcuts**: `/` to focus search, `Esc` to go back
6. **Print-friendly CSS** for meeting detail view

---

## Success Looks Like

When complete, you should have:

✅ Full-page list view (no pane squeezing)
✅ Full-page detail view (proper tab layout)
✅ Real-time search & filter
✅ Responsive at all breakpoints (no horizontal scroll)
✅ All 5 tabs working (lazy-loaded)
✅ Back navigation working
✅ <2s list load, instant tab switch
✅ All existing tests passing
✅ Zero console errors
✅ Better UX than before (more breathing room)

---

## Debug Tips

**List not showing?**
- Check API response in Network tab
- Verify `.table-row` or `.meeting-card` CSS is applied
- Check console for errors

**Detail not loading?**
- Check `GET /meetings/:id` API call
- Verify route parameter `:id` is being passed
- Check `.meeting-detail-header` CSS is applied

**Tabs not switching?**
- Check `.detail-tab.active` class is toggling
- Verify `.detail-panel.active` class is toggling
- Check `.hidden` class is being applied correctly
- Verify tab click handlers are wired

**Mobile broken?**
- Check media queries in styles.css
- Verify `.meetings-card-view` is showing on mobile
- Check `.detail-tab-bar` overflow-x: auto is applied
- Test in real device (not just DevTools)

**Accessibility issues?**
- Run axe devtools
- Check role="tablist", role="tabpanel"
- Verify aria-selected, aria-controls on tabs
- Test keyboard navigation (Tab, Enter)

---

## Resources

**Full Specification:**
`/mnt/devdata/repos/ChamberAI/docs/PHASE5_REDESIGN_SPEC.md`

**Existing Phase 5 Code:**
- `/apps/secretary-console/views/meetings/meetings-view.js`
- `/apps/secretary-console/views/meetings/meeting-list.js`
- `/apps/secretary-console/views/meetings/meeting-detail.js`
- `/apps/secretary-console/views/meetings/tabs/*.js`

**Design System:**
- Colors: CSS variables in styles.css (--accent, --bg, --ink, etc.)
- Typography: var(--font-display), var(--font-ui)
- Spacing: multiples of 4px (8, 12, 16, 20, 24px)
- Border radius: var(--radius) = 18px

---

## Timeline Summary

| Days | Phase | Owner | Status |
|------|-------|-------|--------|
| 1-2 | 5a: List view | Frontend | → Start here |
| 2-3 | 5b: Detail view | Frontend | Depends on 5a |
| 3 | 5c: Routing | Frontend | Depends on 5a+5b |
| 4-5 | 5d: Responsive | Frontend | Parallel with 5c |
| 5-6 | 5e: Testing | QA+Frontend | Last 2 days |

**Total:** 6-7 days from start to merged PR

---

## Questions?

Refer to the full specification: `/mnt/devdata/repos/ChamberAI/docs/PHASE5_REDESIGN_SPEC.md`

Key sections:
- **What to build:** Section 2-4 (Current state + List + Detail)
- **How it looks:** Section 5 (Responsive design)
- **How to code it:** Section 9 (CSS architecture)
- **How to test it:** Section 13 (Testing checklist)
- **How long:** Section 14 (Timeline)

---

**Good luck! 🚀**
