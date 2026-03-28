
## Phase 6 REDESIGN: Business Hub as Full Pages

- **Document:** `PHASE_6_REDESIGN_FULL_PAGES.md` (2,601 lines)
- **Quick Reference:** `PHASE_6_REDESIGN_QUICK_REF.md`
- **Status:** Design Phase Complete ✅
- **Timeline:** 6-7 days (1d design, 4-5d implementation, 1-2d testing)

### What's Changing
Redesign Business Hub from cramped 2-pane layout (30% list / 70% detail) into spacious full-page experience:

- **List View** (`#/business-hub`) - Full-width directory with search, filter, 3-column card grid
- **Detail View** (`#/business-hub/:id`) - Full-page business profile with 5 tabs of information

### Key Features
- ✓ Shows ONLY approved and validated businesses
- ✓ Prominent "Verified Member" badge for trust
- ✓ Full-width content area (no cramping)
- ✓ Natural responsive stacking (3-col desktop, 2-col tablet, 1-col mobile)
- ✓ Previous/Next navigation between businesses
- ✓ Reuses all existing tab components (no duplication)
- ✓ Maintains same API contract
- ✓ Cleaner navigation (list → detail → back to list)

### Files
**New:**
- `business-list-view.js` - Full-page directory handler
- `business-detail-view.js` - Full-page detail handler

**Deprecated:**
- `business-hub-view.js` - Old coordinator
- `business-list.js` - Old pane component
- `business-detail.js` - Old pane component

**Updated:**
- `business-hub.css` - Full-page styles
- `app.js` - New routes

**Reused (No Changes):**
- All 5 tab modules (profile, geographic, reviews, quotes, ai-search)

### Implementation Sequence
1. **Setup** (1d): Create files, update routing, refactor CSS
2. **List View** (2d): Search, filter, card grid, pagination
3. **Detail View** (2-3d): Header, tabs, navigation
4. **Testing** (1-2d): Unit, E2E, visual tests

See full spec for complete architecture, mockups, API integration, and testing checklist.

