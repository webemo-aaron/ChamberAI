# Phase 6 REDESIGN: Quick Reference Guide

**Status:** Design Complete ✅
**Document:** PHASE_6_REDESIGN_FULL_PAGES.md (2,601 lines)
**Timeline:** 6-7 days total (1d design, 4-5d impl, 1-2d testing)

---

## The Problem (Current 2-Pane Layout)

```
┌──────────────────┬──────────────────────────┐
│ List (30%)       │ Detail (70%) - CRAMPED   │
│                  │                          │
│ Business names   │ Tabs squeezed            │
│ truncated        │ Content compressed       │
│ Cards cramped    │ Maps too small           │
│ Hard to scan     │ Forms hard to use        │
└──────────────────┴──────────────────────────┘

Issues:
- Poor discovery (can't see many businesses)
- Cramped detail view
- Awkward navigation (side-by-side confusing)
- Mobile broken (list hidden)
```

## The Solution (Full-Page Redesign)

```
#/business-hub
┌────────────────────────────────────┐
│ Business Hub Directory (Full Page) │
│                                    │
│ [Search] [Filters]                 │
│                                    │
│ [Card 1] [Card 2] [Card 3]         │
│ [Card 4] [Card 5] [Card 6]         │
│ [Card 7] [Card 8] [Card 9]         │
│                                    │
│ ← Prev  [1] [2] [3]  Next →        │
└────────────────────────────────────┘

#/business-hub/:id
┌────────────────────────────────────┐
│ [← Back] Business Name             │
│ ✓ Verified Member ⭐ 4.8           │
│                                    │
│ [Profile] [Geographic] [Reviews]   │
│ [Quotes] [AI Search]               │
│                                    │
│ ── Full-Width Tab Content ──       │
│                                    │
│ ABOUT                              │
│ Long description, hours, contact,  │
│ social media - everything readable │
└────────────────────────────────────┘
```

**Benefits:**
- Full-width scanning (3-col desktop, 2-col tablet, 1-col mobile)
- Spacious, breathing detail view
- Natural navigation (list → detail → list)
- Strong "Verified Member" badge visibility
- Better mobile experience
- Better discovery

---

## Key Architectural Changes

### Routes
| Old | New |
|-----|-----|
| `#/business-hub[/:id]` | `#/business-hub` (list) |
| Single handler | `#/business-hub/:id` (detail) |
| | Two separate handlers |

### Files Created (NEW)
- `business-list-view.js` - Full-page directory coordinator
- `business-detail-view.js` - Full-page detail coordinator

### Files Deprecated (OLD)
- `business-hub-view.js` - Old coordinator (mark as deprecated)
- `business-list.js` - Old pane component (mark as deprecated)
- `business-detail.js` - Old pane component (mark as deprecated)

### Files Reused (NO CHANGES)
- `tabs/profile-tab.js`
- `tabs/geographic-tab.js`
- `tabs/reviews-tab.js`
- `tabs/quotes-tab.js`
- `tabs/ai-search-tab.js`

---

## Business Hub Filter Strategy

**Rule:** Show ONLY businesses that are **APPROVED** AND **VALIDATED**

```javascript
GET /api/business-listings?approved=true&validated=true

Filter logic:
- status === "approved" (chamber approval)
- validation_status === "validated" (information verified)
- Show all others in Geo Intelligence (not Business Hub)
```

**Verified Member Badge:**
```
✓ Verified Member
- Green background (#e4f0ed)
- Shows on all cards & detail header
- Trust signal for users
```

---

## List View Specification

### Layout (Full-Page)
```
┌─────────────────────────────────────┐
│ Business Hub Directory              │
│ ✓ All verified by the Chamber       │
│                                     │
│ [🔍 Search]  [Filters ▼] [Cards/Table]
│                                     │
│ [Category] [Location] [Rating] [Clear]
│ Active: Technology, Boston ✕        │
│                                     │
│ [Card 1]      [Card 2]      [Card 3]
│ [Card 4]      [Card 5]      [Card 6]
│ [Card 7]      [Card 8]      [Card 9]
│                                     │
│ ← Prev [1] [2] [3] Next →           │
│ [+ Add Business] (admin)            │
└─────────────────────────────────────┘
```

### Search
- Input: "Search by business name, category, or location..."
- Debounce: 300ms
- Searches: name, category, city, description

### Filters
- **Category** (multi-select dropdown)
- **Location** (multi-select dropdown)
- **Service Area** (single select)
- **Minimum Rating** (single select: 4+, 3+, all)
- **Clear All** button
- Persistence: sessionStorage

### Sort
- Name (A-Z)
- Name (Z-A)
- Highest Rated
- Lowest Rated
- Newest Added
- Closest First

### View Toggle
- Cards (default) - 3-col grid desktop, 2-col tablet, 1-col mobile
- Table - Sortable columns

### Card Content
```
┌─────────────────────┐
│   [Image 160px]     │
├─────────────────────┤
│ Category  ✓ Verified│
│ Business Name       │
│ ⭐ 4.8 (42 reviews) │
│ Brief description   │
│ 📍 Boston, MA       │
│ Serves: MA, NH, VT  │
│ [View Details →]    │
└─────────────────────┘
```

### Pagination
- Page size: 50 businesses per page
- Show: "Showing 1-50 of 150"
- Buttons: ← Previous | Next →
- Disabled when at boundary

---

## Detail View Specification

### Header
```
[← Back to Directory]  [< Prev] [Next >]

[Image]  Business Name
200px    Category Badge | ✓ Verified Member
         ⭐ 4.8 (42 reviews)
         Description/tagline

         [Contact] [Website] [Share] [Save]
```

### Tabs (Sticky)
```
[Profile] [Geographic] [Reviews] [Quotes] [AI Search]
```

### Tab Content (Full-Width)

**Profile:**
- About section (full description)
- Contact info (phone, email, website, copy buttons)
- Address block
- Hours of operation (daily breakdown)
- Social media links

**Geographic:**
- Location card
- Full-size map embed (400px height)
- Service area details
- Coordinates (lat/long)
- "View on Geo Intelligence" link

**Reviews:**
- Review form
- Review list with responses

**Quotes:**
- Quote request form
- Quote history with status

**AI Search:**
- Related meetings
- AI insights

---

## Responsive Breakpoints

| Breakpoint | List Grid | Detail Header | Tabs | Notes |
|------------|-----------|---------------|------|-------|
| >1200px | 3 columns | 2-col image+info | Horizontal scroll | Desktop full |
| 800-1200px | 2 columns | 2-col image+info | Horizontal scroll | Tablet optimized |
| <800px | 1 column | Full-width stacked | Scrollable chips | Mobile optimized |

---

## API Integration

### Endpoints

```
GET /api/business-listings?approved=true&validated=true
  - Query: search, category, location, limit, offset
  - Returns: Array of business objects

GET /api/business-listings/:id
  - Returns: Single business with all details

GET /api/business-listings/:id/reviews
  - Returns: Review array

POST /quotes
  - Request quote

POST /business-listings (admin only)
  - Create business

PUT /business-listings/:id (admin only)
  - Update business
```

### Sample Response
```json
{
  "id": "biz_abc123",
  "name": "ABC Corporation",
  "category": "Technology",
  "status": "approved",
  "validation_status": "validated",
  "rating": 4.8,
  "review_count": 42,
  "description": "...",
  "address": "123 Main St",
  "city": "Boston",
  "state": "MA",
  "phone": "(617) 555-1234",
  "email": "info@abc.com",
  "website": "https://abc.com",
  "image_url": "...",
  "service_area_type": "statewide",
  "hours": [...],
  "social_links": [...]
}
```

---

## Implementation Sequence

### Phase 1: Setup (1 day)
1. Create `business-list-view.js`
2. Create `business-detail-view.js`
3. Update app router for new routes
4. Update CSS (remove 2-pane grid, add full-page styles)

### Phase 2: List View (2 days)
1. Load & filter businesses (approved + validated only)
2. Search functionality (debounced)
3. Filter controls (multi-select)
4. Card grid (responsive 3-2-1 cols)
5. Pagination (50 per page)
6. Sorting

### Phase 3: Detail View (2-3 days)
1. Header with image + info
2. Verified badge display
3. Tab system with lazy-loading
4. Navigation (back, prev, next)
5. Cross-nav to Geo Intelligence

### Phase 4: Testing (1-2 days)
1. Unit tests (search, filter, pagination)
2. E2E tests (navigation, responsive)
3. Visual polish & edge cases

---

## Testing Checklist (Key Items)

### Unit Tests
- [ ] Search filters correctly
- [ ] Filters by approval + validation status only
- [ ] Sort options work
- [ ] Pagination navigates correctly
- [ ] Previous/Next buttons work and disable at boundaries
- [ ] Tab lazy-loading works
- [ ] Filter state persists in sessionStorage

### E2E Tests
- [ ] #/business-hub → list renders
- [ ] 3-col grid on desktop, 2-col on tablet, 1-col on mobile
- [ ] Click card → #/business-hub/:id
- [ ] Back button → #/business-hub
- [ ] Previous/Next navigate between businesses
- [ ] "View on Geo Intelligence" works
- [ ] All tabs load correct content
- [ ] Verified badge visible on cards & header

### Visual Tests
- [ ] Business names readable
- [ ] Verified badge prominent
- [ ] No horizontal scroll on any device
- [ ] Tab content full-width (not cramped)
- [ ] Maps, forms readable
- [ ] Dark theme colors correct

---

## Success Criteria (MVP)

✅ **Functional**
- Directory shows ONLY approved + validated businesses
- Full-page list and detail views work
- All 5 tabs work (reuse existing)
- Search, filter, sort, paginate
- Previous/Next navigation

✅ **UX/Design**
- 3-2-1 responsive grid
- No horizontal scroll
- Verified badge visible & prominent
- Better than 2-pane version

✅ **Technical**
- Same API contract
- Reuse existing tab components
- No breaking changes
- <2s load time
- Zero console errors

---

## Files Affected

### New Files
```
docs/PHASE_6_REDESIGN_FULL_PAGES.md (this spec - 2,601 lines)
docs/PHASE_6_REDESIGN_QUICK_REF.md (this quick ref)
apps/secretary-console/views/business-hub/business-list-view.js (NEW)
apps/secretary-console/views/business-hub/business-detail-view.js (NEW)
```

### Modified Files
```
apps/secretary-console/app.js (add 2 new routes)
apps/secretary-console/views/business-hub/business-hub.css (update styles)
tests/playwright/business_hub.spec.mjs (update tests)
tests/unit/business-listings.test.js (add tests)
```

### Deprecated Files
```
apps/secretary-console/views/business-hub/business-hub-view.js (DEPRECATED)
apps/secretary-console/views/business-hub/business-list.js (DEPRECATED)
apps/secretary-console/views/business-hub/business-detail.js (DEPRECATED)
```

---

## Key Implementation Notes

1. **Filter API:** Add support for `?approved=true&validated=true` query params
2. **Verified Badge:** Display only when BOTH status=approved AND validation_status=validated
3. **Previous/Next:** Maintain filtered/sorted list in state, navigate through results
4. **Lazy Loading:** Images via data-src, tabs only on click
5. **Mobile:** Keep horizontal tab scroll (or use dropdown)
6. **Dark Theme:** Verify all colors work in both themes
7. **Session State:** Save filters to sessionStorage
8. **Error Handling:** Show toasts on API errors, empty state when no results
9. **Accessibility:** Focus states, ARIA labels on all interactive elements
10. **Git:** Deprecate old files, don't delete

---

## Quick Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              App Router (app.js)                     │
│  #/business-hub → businessListViewHandler           │
│  #/business-hub/:id → businessDetailViewHandler     │
└─────────────────────────────────────────────────────┘
         ↓                              ↓
┌───────────────────────────┐   ┌───────────────────────────┐
│ business-list-view.js     │   │ business-detail-view.js   │
│                           │   │                           │
│ - Load businesses         │   │ - Load single business    │
│ - Filter (approved+val)   │   │ - Render header           │
│ - Search (debounce)       │   │ - Manage tabs             │
│ - Card grid (3-2-1)       │   │ - Prev/Next nav           │
│ - Pagination (50/page)    │   │ - Reuse tab modules       │
│ - Sort options            │   │ - Geo Intelligence link   │
│ - View toggle (card/tbl)  │   │                           │
└───────────────────────────┘   └───────────────────────────┘
         ↓                              ↓
    business-hub.css (updated full-page styles)
         ↓                              ↓
    ┌──────────────────────────────────────┐
    │  Existing Tab Modules (No Changes)   │
    │  - profile-tab.js                    │
    │  - geographic-tab.js                 │
    │  - reviews-tab.js                    │
    │  - quotes-tab.js                     │
    │  - ai-search-tab.js                  │
    └──────────────────────────────────────┘
```

---

## Next Steps

1. **Review:** Share spec with team
2. **Estimate:** Break into tasks, assign owners
3. **Implement:** Follow Phase 1-4 sequence
4. **Test:** Run full test suite
5. **Launch:** Deploy & monitor

---

**Quick Links:**
- Full Spec: `/docs/PHASE_6_REDESIGN_FULL_PAGES.md`
- Current Code: `/apps/secretary-console/views/business-hub/`
- API: `/services/api-firebase/src/routes/business_listings.js`
- CSS: `/apps/secretary-console/views/business-hub/business-hub.css`

---

**Document Version:** 1.0
**Status:** Ready for Implementation
**Created:** 2026-03-28
