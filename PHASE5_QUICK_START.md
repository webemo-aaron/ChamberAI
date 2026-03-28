# Phase 5: Meetings View Modularization - Quick Start Guide

**Date:** 2026-03-28
**Status:** Design Complete ✅
**Implementation Target:** 2026-03-31+
**Estimated Duration:** 2-3 weeks

---

## 📄 Documents Overview

### 1. PHASE5_DESIGN_SPECIFICATION.md (2,403 lines) ⭐ PRIMARY
**Complete design document with:**
- Current state analysis
- Target module structure
- Detailed spec for all 9 modules
- Data flow & event architecture
- CSS architecture & responsive design
- Implementation sequencing
- Testing strategy
- Success criteria
- Phase 6 reference pattern

**Use this for:** Implementation decisions, architecture questions, module details

### 2. PHASE5_DESIGN_SUMMARY.md (351 lines) ⭐ EXECUTIVE OVERVIEW
**High-level summary with:**
- Module architecture diagram
- Design highlights (5 key decisions)
- Modularization pattern
- Testing strategy
- Phase 6 reference
- Success criteria checklist
- Next steps

**Use this for:** Presentations, quick review, understanding overall strategy

### 3. PHASE5_ROUTE_HANDLERS.md (279 lines)
**Previous planning document with:**
- Route handler structure
- Available utilities
- Current placeholder implementations
- Testing checklist

**Use this for:** Context, historical decisions

---

## 🚀 Quick Start for Implementers

### Prerequisites
- Phase 1-4 complete (core modules, navigation, settings)
- Node.js with npm installed
- Familiar with Phase 3 Settings modularization pattern

### Step 1: Review Architecture (30 min)
1. Read PHASE5_DESIGN_SUMMARY.md
2. Review the module breakdown
3. Understand Coordinator Pattern from settings-view.js

### Step 2: Deep Dive into Modules (2 hours)
1. Read PHASE5_DESIGN_SPECIFICATION.md sections 3 (each module spec)
2. Review implementation outlines for each module
3. Take notes on API endpoints for your module

### Step 3: Set Up Files (30 min)
```bash
# Create module structure
mkdir -p apps/secretary-console/views/meetings/tabs

# Create module files (empty, will fill)
touch apps/secretary-console/views/meetings/meetings-view.js
touch apps/secretary-console/views/meetings/meeting-list.js
touch apps/secretary-console/views/meetings/meeting-detail.js
touch apps/secretary-console/views/meetings/meeting-detail-header.js
touch apps/secretary-console/views/meetings/tabs/minutes-tab.js
touch apps/secretary-console/views/meetings/tabs/action-items-tab.js
touch apps/secretary-console/views/meetings/tabs/motions-tab.js
touch apps/secretary-console/views/meetings/tabs/audit-tab.js
touch apps/secretary-console/views/meetings/tabs/public-summary-tab.js
touch apps/secretary-console/views/meetings/meetings.css
touch apps/secretary-console/views/meetings/README.md
```

### Step 4: Implement Modules (Follow Phases)

#### Phase 5a: meeting-list.js
**Duration:** 2-3 days
1. Copy implementation outline from spec (section 3.2)
2. Implement createMeetingList()
3. Implement renderMeetingsList()
4. Wire event listeners
5. Test with mock data

#### Phase 5b: Detail Structure
**Duration:** 2-3 days
1. Implement meeting-detail.js (section 3.3)
2. Implement meeting-detail-header.js (section 3.4)
3. Wire tab switching
4. Test tab activation

#### Phase 5c: Tab Modules (Parallel)
**Duration:** 3-4 days (can parallelize 2-3 developers)
1. minutes-tab.js (section 3.5)
2. action-items-tab.js (section 3.6)
3. motions-tab.js (section 3.7)
4. audit-tab.js (section 3.8)
5. public-summary-tab.js (section 3.9)

#### Phase 5d: Integration
**Duration:** 1-2 days
1. Create meetings-view.js coordinator (section 3.1)
2. Wire list → detail communication
3. Test full flow

#### Phase 5e: Styling
**Duration:** 1-2 days
1. Create meetings.css (section 5)
2. Implement responsive layout
3. Dark theme consistency

#### Phase 5f: Testing & Validation
**Duration:** 2-3 days
1. Unit tests (jest)
2. E2E tests (playwright)
3. Responsive testing
4. Accessibility audit

---

## 📋 Module Checklist

### meetings-view.js (100-120 lines)
Route handler + coordinator
- [ ] Import all dependencies
- [ ] Export meetingsHandler()
- [ ] Load meetings from API
- [ ] Load meeting detail if :id
- [ ] Create and append list pane
- [ ] Create and append detail pane (if :id)
- [ ] Wire meeting-selected event
- [ ] Wire refresh-requested event
- [ ] Clean up on unmount

### meeting-list.js (180-220 lines)
Directory listing
- [ ] createMeetingList() function
- [ ] renderMeetingsList() function
- [ ] createListHeader() helper
- [ ] createSearchInput() helper
- [ ] createFilterControls() helper
- [ ] createMeetingRow() helper
- [ ] Format date helper
- [ ] Fire meeting-selected event
- [ ] Fire refresh-requested event
- [ ] Handle empty state
- [ ] Handle loading state
- [ ] Responsive CSS classes

### meeting-detail.js (100-150 lines)
Tab selector + detail coordinator
- [ ] createMeetingDetail() function
- [ ] renderMeetingDetail() function
- [ ] createTabBar() helper with 5 tabs
- [ ] setupTabSwitching() logic
- [ ] loadTabModule() lazy-loader
- [ ] activateTab() function
- [ ] Hide/show tab panels
- [ ] Track active tab state
- [ ] Responsive tab layout

### meeting-detail-header.js (80-120 lines)
Metadata + action buttons
- [ ] createMeetingDetailHeader() function
- [ ] updateMeetingDetailHeader() function
- [ ] Display location, date, status
- [ ] Display chair, secretary, attendees
- [ ] Display tags
- [ ] Export button
- [ ] Edit button (admin only)
- [ ] Delete button (admin only)
- [ ] More actions menu

### minutes-tab.js (200-250 lines)
Minutes editor + audio
- [ ] render() export
- [ ] Fetch current minutes
- [ ] Create editor component
- [ ] Create audio upload zone
- [ ] Fetch version history
- [ ] Wire save button
- [ ] Wire audio upload
- [ ] Auto-save on blur
- [ ] Show transcription progress
- [ ] Collaborative editing status

### action-items-tab.js (150-200 lines)
Action items CRUD + CSV
- [ ] render() export
- [ ] Fetch action items
- [ ] Create list with items
- [ ] Create toolbar (add, import, export)
- [ ] Create status buttons
- [ ] Wire delete button
- [ ] Wire status update
- [ ] CSV export function
- [ ] CSV import modal
- [ ] Handle empty state

### motions-tab.js (150-200 lines)
Motions + approval workflow
- [ ] render() export
- [ ] Fetch motions
- [ ] Create motions list
- [ ] Create toolbar (add, export)
- [ ] Wire approve button (admin)
- [ ] Wire vote buttons
- [ ] Wire delete button (admin)
- [ ] Show approval status badge
- [ ] Show vote counts
- [ ] Display final result

### audit-tab.js (100-150 lines)
Audit log (read-only)
- [ ] render() export
- [ ] Fetch audit log
- [ ] Create log table
- [ ] Create filter controls
- [ ] Wire filter changes
- [ ] Format timestamps
- [ ] Show changes (before/after)
- [ ] Reverse chronological order
- [ ] Handle empty state

### public-summary-tab.js (100-150 lines)
Summary editor + export
- [ ] render() export
- [ ] Fetch current summary
- [ ] Create editor component
- [ ] Create toolbar (save, preview, export, AI draft)
- [ ] Wire save button
- [ ] Wire export button (PDF, Markdown, text)
- [ ] Wire preview toggle
- [ ] Wire AI draft (if feature-flagged)
- [ ] Show word count
- [ ] Markdown rendering

### meetings.css (400-500 lines)
Layout + responsive styling
- [ ] Container & layout (100 lines)
- [ ] List pane styling (100 lines)
- [ ] Detail pane styling (100 lines)
- [ ] Tab styling (50 lines)
- [ ] Form & modal styling (50 lines)
- [ ] Responsive media queries (100 lines)
- [ ] Dark theme consistency
- [ ] Accessibility (contrast, focus states)

### Test Files
- [ ] tests/meetings-view.test.js (unit tests, jest)
- [ ] tests/meetings.e2e.js (E2E tests, playwright)

---

## 🔗 Key Implementation References

### Coordinator Pattern (from Phase 3 Settings)
**File:** `apps/secretary-console/views/settings/settings-view.js`
- Shows how to render page + coordinate tabs
- Shows how to load data, populate panels, wire buttons
- Phase 5 meetings-view.js uses identical structure

### Tab Switching Pattern
**File:** `apps/secretary-console/views/settings/settings-view.js` (lines 138-172)
- Shows how to wire tab activation
- Shows how to show/hide panels
- Phase 5 meeting-detail.js uses identical logic

### API Integration Pattern
**File:** `apps/secretary-console/core/api.js`
- Shows request() wrapper usage
- Shows error handling with showToast()
- All tabs use this pattern

### Modal Management
**File:** `apps/secretary-console/app.js` (lines 341-390)
- Shows openModal() / closeModal() usage
- Shows focus trapping
- Tab modules use for CSV preview

### Toast Feedback
**File:** `apps/secretary-console/core/toast.js`
- Show success: `showToast("Message")`
- Show error: `showToast("Message", { type: "error" })`
- All async operations show toast

---

## ✅ Testing Checklist

### Unit Tests (Jest)
```bash
npm test -- tests/meetings-view.test.js
```
- [ ] All modules render with mock data
- [ ] Events fire with correct payload
- [ ] API calls made with correct params
- [ ] Error handling works
- [ ] Empty states display

### E2E Tests (Playwright)
```bash
npm run test:e2e
```
- [ ] Navigate to /meetings - list loads
- [ ] Click meeting - navigates to /meetings/:id
- [ ] Click tab - panel switches
- [ ] Fill form - submission works
- [ ] Filter works - list updates
- [ ] Search works - results filter
- [ ] Responsive on mobile - toggle works
- [ ] All existing test IDs work

### Manual Testing
- [ ] Desktop (>900px) - list + detail side-by-side
- [ ] Tablet (600-900px) - stacked layout
- [ ] Mobile (<600px) - toggle between list/detail
- [ ] Keyboard nav - Tab, arrow keys work
- [ ] Screen reader - ARIA labels work
- [ ] Dark mode - colors readable

---

## 📊 Estimated Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 5a | meeting-list.js | 2-3 days | ⏳ Todo |
| 5b | Detail modules | 2-3 days | ⏳ Todo |
| 5c | Tab modules (parallel) | 3-4 days | ⏳ Todo |
| 5d | Integration | 1-2 days | ⏳ Todo |
| 5e | Styling & CSS | 1-2 days | ⏳ Todo |
| 5f | Testing & validation | 2-3 days | ⏳ Todo |
| **Total** | **All phases** | **2-3 weeks** | **⏳ In planning** |

**Parallel work:** Tabs (5c) can be done by 2-3 developers simultaneously

---

## 🔗 Related Documents

**Phase 5 Specific:**
- PHASE5_DESIGN_SPECIFICATION.md (primary reference)
- PHASE5_DESIGN_SUMMARY.md (executive overview)
- PHASE5_ROUTE_HANDLERS.md (historical context)

**Architecture References:**
- views/settings/settings-view.js (tabbed pattern reference)
- core/router.js (route handling)
- core/api.js (API integration)
- core/auth.js (authentication)
- core/toast.js (user feedback)

**Phase 6 Will Use:**
- This entire specification as template
- Same coordinator pattern
- Same tab switching logic
- Same API integration approach
- Same CSS architecture

---

## 🎯 Success Criteria

At completion of Phase 5, you'll have:

✅ **9 modules** (meetings-view, list, detail, header, 5 tabs)
✅ **~1,350 lines** of code (maintainable, <250 per module)
✅ **100% functionality** (identical to before, just organized)
✅ **E2E test compatibility** (all existing tests pass)
✅ **Responsive design** (desktop, tablet, mobile)
✅ **Accessibility** (WCAG 2.1 AA)
✅ **Full documentation** (JSDoc, README, tests)
✅ **Phase 6 ready** (pattern established for replication)

---

## ❓ FAQ

**Q: Can I start before design is fully approved?**
A: Yes! The spec is comprehensive. Start with meeting-list.js while awaiting formal approval.

**Q: Can tabs be done in parallel?**
A: Yes! 5 tab modules can be split among 2-3 developers. They're independent.

**Q: Do I need to change app.js?**
A: Minimally. Just import meetingsHandler and it's already wired.

**Q: Will E2E tests break?**
A: No. All element IDs are preserved. Tests should pass unchanged.

**Q: What if API endpoints are different?**
A: Update the endpoint names in the spec. Pattern stays the same.

**Q: Can I use a different naming convention?**
A: Please don't. Consistency across Phase 6+ is important.

**Q: How do I test locally?**
A: Use `npm run dev` for local dev, `npm test` for unit tests, `npm run test:e2e` for E2E.

---

## 📞 Contact & Questions

For questions during implementation:
1. Check PHASE5_DESIGN_SPECIFICATION.md section 3 (module details)
2. Review settings-view.js for pattern reference
3. Check core modules for API usage
4. Escalate architectural questions to team lead

---

## Next Action

1. **Review** this Quick Start (15 minutes)
2. **Read** PHASE5_DESIGN_SUMMARY.md (30 minutes)
3. **Deep dive** PHASE5_DESIGN_SPECIFICATION.md sections 3+ (2 hours)
4. **Setup** file structure
5. **Start** with meeting-list.js

**Begin implementation:** 2026-03-31

**Target completion:** 2026-04-21

Good luck! 🚀

