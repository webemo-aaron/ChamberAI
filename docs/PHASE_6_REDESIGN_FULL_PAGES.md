# Phase 6 REDESIGN: Business Hub as Full Pages

**Document Type:** Design Specification
**Version:** 1.0
**Status:** Design Phase Complete
**Target:** ChamberAI Secretary Console
**Timeline:** 6-7 days (design 1d, implementation 4-5d, testing 1-2d)
**Created:** 2026-03-28

---

## Executive Summary

This document redesigns Phase 6 (Business Hub) from a cramped 2-pane layout (30% list / 70% detail) into a full-page architecture with two distinct views:

1. **Business Directory** (`#/business-hub`) - Full-width list with search, filter, and discovery
2. **Business Profile** (`#/business-hub/:id`) - Full-page detail view with 5 tabs of information

**Key Principle:** Business Hub shows ONLY approved and validated businesses (moved from Geo Intelligence which shows ALL locations for analysis).

**Benefits:**
- Full-screen directory scanning with better visibility
- Cleaner separation of concerns (list view vs. detail view)
- Intuitive mobile stacking (one full page at a time)
- Stronger verification badge prominence ("Verified Member")
- More breathing room for content and interactions
- Better discovery experience with full-width cards

---

## Part 1: Current State Analysis

### Current Implementation (2-Pane Layout)

The existing Phase 6 uses a constrained grid layout:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Business Hub                               │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                          │
│   Business List      │    Business Detail + Tabs (squeezed)     │
│   (30% width)        │    (70% width)                           │
│                      │                                          │
│  [Search box]        │  [Business Name]                         │
│  [Filters]           │  [Category | Rating]                     │
│                      │                                          │
│  [Card 1]   X        │  [Profile] [Geographic] [Reviews]...     │
│  [Card 2]           │                                          │
│  [Card 3]           │  ┌─ TAB CONTENT (cramped) ───┐           │
│  [Card 4]           │  │                            │           │
│  [Card 5]           │  │ Contact info, hours, about │           │
│  [Card 6]           │  │ (everything scrolled,      │           │
│                      │  │ cramped, hard to scan)     │           │
│  ↓ scroll            │  └────────────────────────────┘           │
└──────────────────────┴──────────────────────────────────────────┘
```

**Files Involved:**
- `/apps/secretary-console/views/business-hub/business-hub-view.js` - Main coordinator
- `/apps/secretary-console/views/business-hub/business-list.js` - List pane component
- `/apps/secretary-console/views/business-hub/business-detail.js` - Detail pane component (with 5 tabs)
- `/apps/secretary-console/views/business-hub/business-hub.css` - All styling (line 19-26: grid layout)

**Current Architecture:**
- Single route handler: `/business-hub` (optionally with `/:id`)
- State management in coordinator (`business-hub-view.js`)
- List and detail rendered side-by-side in fixed grid
- Tab switching happens in-pane (70% width constraint)

### Problems with 2-Pane Layout

1. **List Visibility:** Business names truncated, categories cramped, ratings hard to read
2. **Discovery Poor:** Can't see multiple businesses at once for comparison
3. **Detail Too Cramped:** Tab content squeezed into 70% width
   - Profile section max-width: 600px (line 303 CSS) still feels cramped in 70%
   - Maps, long addresses, review text all squished
   - Forms feel cramped (quote request, review response)
4. **Mobile Broken:** At <768px, list hidden entirely, detail fills screen
5. **Navigation Awkward:** Must click card → see detail → back button to return to list
6. **Tab Switching Jarring:** All 5 tabs visible, takes horizontal space
7. **Filter UI Cramped:** Only 2-column filter controls (line 80 CSS)

### What Needs to Change

**Old:** Single coordinator with two panes fighting for space
**New:** Two separate full-page views with clean navigation between them

**Old:** Route structure: `/business-hub[/:id]`
**New:** Route structure:
- `#/business-hub` → Full-page directory list
- `#/business-hub/:id` → Full-page business detail

**Old:** Business list and detail rendered simultaneously
**New:** Page transitions (user navigates from list to detail, back again)

**Old:** Show ALL businesses (Geo Intelligence, approved/unapproved)
**New:** Business Hub shows ONLY approved + validated businesses

---

## Part 2: Business Hub Filter Strategy

### Approval & Validation Status

**Business Hub Visibility Rule:**
```
Show ONLY businesses where:
  status === "approved" AND
  validation_status === "validated"
```

**Status Field Meanings:**
- `status`: Chamber approval workflow
  - `draft` - Not submitted
  - `pending_approval` - Awaiting chamber review
  - `approved` - Approved by chamber
  - `rejected` - Rejected by chamber
  - `inactive` - Previously approved, now inactive

- `validation_status`: Information verification
  - `unvalidated` - Not verified yet
  - `validating` - In progress
  - `validated` - Verified correct
  - `needs_update` - Info outdated, needs revalidation

**API Filter Applied:**
```javascript
// GET /api/business-listings?approved=true&validated=true
// Or implement server-side filter:
GET /api/business-listings?filter=approved,validated

// Server response (business_listings.js lines 42-81):
// Filter results to: status=approved AND validation_status=validated
```

### Verified Member Badge

All businesses shown in Business Hub receive a prominent badge:

```
┌─────────────────────────┐
│  [Logo/Image]           │
│  Business Name          │
│  ✓ Verified Member      │  ← Green checkmark + text
│  ⭐⭐⭐⭐⭐ 4.8 (23)      │
│  Description...         │
└─────────────────────────┘
```

**Badge Styling:**
- Color: Green (#0a5d52 or accent color)
- Icon: ✓ (unicode 2713)
- Text: "Verified Member"
- Size: Small, prominent (13-14px font)
- Appears on: Directory cards + detail header

**Trust Communication:**
- Tagline: "All businesses shown have been verified by the Chamber"
- Shown once at top of directory list
- Reassures users all listings are vetted

### Filter Out Strategy

Businesses NOT shown in Business Hub:
- Status != "approved" (drafts, pending, rejected, inactive)
- Validation != "validated" (unvalidated, validating, needs_update)
- Marked as "inactive"
- Explicitly hidden by admin

**Purpose Split:**
- **Business Hub:** Curated, verified directory (public-facing feel)
- **Geo Intelligence:** ALL locations for analysis (board/admin tool)
- **Admin Management:** All businesses (edit/moderate/approve)

---

## Part 3: Full-Page Business Directory List

### URL & Navigation
```
Route: #/business-hub
Handler: businessListViewHandler (replaces businessHubHandler)
Full-width: Yes (100% viewport width)
Scrollable: Yes (content area)
```

### Page Structure

```
┌────────────────────────────────────────────────────────────────┐
│  Business Hub Directory                                        │
│                                                                │
│  All businesses shown have been verified by the Chamber ✓     │
│                                                                │
│  [🔍 Search: ________________]  [Filters ▼] [View: ⬚ ⬚]       │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Business Card 1]      [Business Card 2]      [Business 3]   │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────┐  │
│  │  [Image]         │   │  [Image]         │   │ [Image]  │  │
│  │  Name: ABC Corp  │   │  Name: XYZ Svc   │   │ Name:    │  │
│  │  Category: Tech  │   │  Category: Plumb │   │ Category │  │
│  │  ✓ Verified      │   │  ✓ Verified      │   │ ✓ Verif  │  │
│  │  ⭐⭐⭐⭐⭐ 4.8  │   │  ⭐⭐⭐⭐ 4.2   │   │ ⭐⭐⭐⭐  │  │
│  │  Tagline here    │   │  Tagline here    │   │ Tagline  │  │
│  │  📍 Boston, MA   │   │  📍 Boston, MA   │   │ 📍 Bost  │  │
│  │  →               │   │  →               │   │ →        │  │
│  └──────────────────┘   └──────────────────┘   └──────────┘  │
│                                                                │
│  [Business Card 4]      [Business Card 5]      [Business 6]   │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────┐  │
│  │ ...              │   │ ...              │   │ ...      │  │
│  └──────────────────┘   └──────────────────┘   └──────────┘  │
│                                                                │
│  ← Previous  [1] [2] [3]  Next →                              │
│                                                                │
│                       [+ Add Business]  (admin only)           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Header Section

**Title & Description:**
```html
<header class="business-list-header">
  <div class="list-title-section">
    <h1>Business Hub Directory</h1>
    <p class="trust-message">
      ✓ All businesses shown have been verified by the Chamber
    </p>
  </div>
</header>
```

**Styling:**
- Title: h1, 28px, bold
- Trust message: 13px, muted color, with checkmark icon
- Padding: 24px (desktop), 16px (mobile)
- Background: Subtle gradient or solid (match theme)

### Search & Filter Controls

**Search Box:**
```html
<div class="list-search-section">
  <div class="search-wrapper">
    <input
      type="text"
      id="businessSearch"
      class="search-input-large"
      placeholder="Search by business name, category, or location..."
      aria-label="Search businesses"
      data-testid="business-search-input"
    />
    <span class="search-icon">🔍</span>
  </div>
</div>
```

**Styling:**
- Full width of container
- Larger input (32px height, 14px font)
- Debounced input handler (<300ms)
- Icon styling subtle
- Clear button appears when text entered

**Filter Controls:**
```html
<div class="list-filter-section">
  <div class="filter-bar">
    <div class="filter-group">
      <label for="categoryFilter">Category</label>
      <select id="categoryFilter" class="filter-select">
        <option value="">All Categories</option>
        <option value="tech">Technology</option>
        <option value="plumbing">Plumbing & HVAC</option>
        <option value="legal">Legal Services</option>
        <!-- dynamically populated from businesses -->
      </select>
    </div>

    <div class="filter-group">
      <label for="locationFilter">Location</label>
      <select id="locationFilter" class="filter-select">
        <option value="">All Locations</option>
        <option value="boston">Boston, MA</option>
        <option value="cambridge">Cambridge, MA</option>
        <!-- dynamically populated -->
      </select>
    </div>

    <div class="filter-group">
      <label for="serviceAreaFilter">Service Area</label>
      <select id="serviceAreaFilter" class="filter-select">
        <option value="">All Areas</option>
        <option value="local">Local Only</option>
        <option value="statewide">Statewide</option>
        <option value="regional">Regional</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="ratingFilter">Minimum Rating</label>
      <select id="ratingFilter" class="filter-select">
        <option value="">All Ratings</option>
        <option value="4">4+ Stars</option>
        <option value="3">3+ Stars</option>
        <option value="all">All Ratings</option>
      </select>
    </div>

    <button class="filter-button" id="clearFilters">Clear All</button>
  </div>

  <div class="active-filters">
    <!-- Shows selected filters as removable pills -->
    <span class="filter-pill">Technology <button>✕</button></span>
    <span class="filter-pill">Boston <button>✕</button></span>
  </div>
</div>
```

**Styling:**
- Filter bar: Flexbox, wrapping on tablet/mobile
- Each filter group: 1 label + 1 select
- Clear All button: Ghost style, visible only when filters active
- Active filters section: Shows as pills (badges with X button)
- On desktop: 4 filters + clear button in row
- On tablet (>600px): 2x2 grid
- On mobile (<600px): Stack vertically

**Sort Options:**
```html
<div class="list-sort-section">
  <label for="sortBy">Sort:</label>
  <select id="sortBy" class="sort-select">
    <option value="name_asc">Name (A-Z)</option>
    <option value="name_desc">Name (Z-A)</option>
    <option value="rating_desc">Highest Rated</option>
    <option value="rating_asc">Lowest Rated</option>
    <option value="newest">Newest Added</option>
    <option value="proximity">Closest First</option>
  </select>
</div>
```

**View Toggle:**
```html
<div class="list-view-toggle">
  <button class="view-btn active" data-view="cards" title="Card view">
    ⬚ ⬚  Cards
  </button>
  <button class="view-btn" data-view="table" title="Table view">
    ≡  Table
  </button>
</div>
```

### Business Card Layout (Default Card View)

**Card Grid:**
- Desktop (>1200px): 3 columns
- Tablet (800-1200px): 2 columns
- Mobile (<800px): 1 column
- Gap: 16px between cards
- Padding: 24px (desktop), 16px (mobile)

**Individual Card:**
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │       Business Image          │  │ (height: 160px)
│  │      (fallback: icon)         │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  Business Name Here                 │
│  Category Tag         ✓ Verified    │
│                                     │
│  ⭐ 4.8 (42 reviews)               │
│                                     │
│  Brief description or tagline       │
│  that shows up to 2 lines...        │
│                                     │
│  📍 Boston, MA                      │
│  Serves: MA, NH, VT               │
│                                     │
│  [View Details →]                  │
└─────────────────────────────────────┘
```

**Card Content:**
```html
<div class="business-card" data-business-id="${business.id}">
  <!-- Image Section -->
  <div class="card-image-section">
    <img
      src="${business.image_url || '/img/business-placeholder.svg'}"
      alt="${business.name}"
      class="card-image"
    />
    <div class="card-image-overlay">
      <!-- Hover effect, optional -->
    </div>
  </div>

  <!-- Info Section -->
  <div class="card-content">
    <!-- Category & Verified Badge -->
    <div class="card-meta">
      <span class="card-category">${business.category}</span>
      <span class="verified-badge">✓ Verified</span>
    </div>

    <!-- Business Name -->
    <h3 class="card-name">${business.name}</h3>

    <!-- Rating -->
    <div class="card-rating">
      ${renderStars(business.rating)}
      <span class="rating-text">${business.rating.toFixed(1)}</span>
      <span class="rating-count">(${business.review_count} reviews)</span>
    </div>

    <!-- Description/Tagline -->
    <p class="card-description">${business.description}</p>

    <!-- Location & Service Area -->
    <div class="card-location">
      <span class="location-icon">📍</span>
      <span>${business.city}, ${business.state}</span>
    </div>

    <div class="card-service-area">
      Serves: ${business.service_area_display}
    </div>

    <!-- Call to Action -->
    <button class="card-action-button" data-business-id="${business.id}">
      View Details →
    </button>
  </div>
</div>
```

**Styling:**
```css
.business-card {
  background: var(--panel);
  border: 1px solid #e6dbcd;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.business-card:hover {
  box-shadow: 0 8px 24px rgba(10, 93, 82, 0.12);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.card-image-section {
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, #f5f0e8 0%, #e6dbcd 100%);
  overflow: hidden;
  position: relative;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-category {
  display: inline-block;
  background: #e4f0ed;
  color: #0a5d52;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #0a5d52;
  background: #e4f0ed;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.verified-badge::before {
  content: "✓";
  font-weight: 700;
}

.card-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.card-rating .star {
  font-size: 14px;
  color: #e0e0e0;
}

.card-rating .star.filled {
  color: #ffc107;
}

.card-rating .rating-text {
  font-weight: 600;
  color: var(--text);
}

.card-rating .rating-count {
  color: var(--muted);
  font-size: 12px;
}

.card-description {
  margin: 4px 0 0 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.card-service-area {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}

.card-action-button {
  margin-top: auto;
  padding: 8px 12px;
  background: #e4f0ed;
  color: #0a5d52;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.card-action-button:hover {
  background: #d0e8e3;
  transform: translateX(2px);
}

.card-action-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Table View (Alternative)

**When user clicks "Table" toggle:**

```
┌──────────────────────────────────────────────────────────────────┐
│ Name              │ Category      │ Rating │ Location  │ Service  │
├──────────────────────────────────────────────────────────────────┤
│ ABC Corporation   │ Technology    │ 4.8 ⭐ │ Boston,   │ MA, NH   │
│ ✓ Verified       │               │        │ MA        │          │
│ XYZ Services     │ Plumbing      │ 4.2 ⭐ │ Cambridge │ MA       │
│ ✓ Verified       │               │        │ , MA      │          │
│ ...              │               │        │           │          │
└──────────────────────────────────────────────────────────────────┘
```

**Styling:**
```css
.business-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel);
}

.business-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e6dbcd;
  background: var(--bg);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted);
}

.business-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e6dbcd;
  font-size: 13px;
}

.business-table tr:hover {
  background: rgba(10, 93, 82, 0.02);
  cursor: pointer;
}

.business-table .name-cell {
  font-weight: 600;
  color: var(--accent);
}

.business-table .verified-cell {
  font-size: 12px;
  color: var(--muted);
}
```

### Pagination

**At bottom of list (if >50 businesses):**

```html
<div class="list-pagination">
  <button class="pagination-button" id="prevPage" aria-label="Previous page">
    ← Previous
  </button>

  <div class="pagination-info">
    Showing <span id="pageStart">1</span>-<span id="pageEnd">50</span>
    of <span id="pageTotal">150</span>
  </div>

  <button class="pagination-button" id="nextPage" aria-label="Next page">
    Next →
  </button>
</div>
```

**Styling:**
```css
.list-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-top: 1px solid #e6dbcd;
  margin-top: 24px;
}

.pagination-button {
  padding: 8px 16px;
  background: var(--panel);
  border: 1px solid #e6dbcd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background: #e4f0ed;
  border-color: var(--accent);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  color: var(--muted);
}
```

### Admin Button

**"Add Business" button (admin only, top-right):**

```html
<button class="btn-add-business" id="addBusinessBtn" aria-label="Add new business">
  + Add Business
</button>
```

Positioned fixed or sticky in top-right of header.

---

## Part 4: Full-Page Business Detail View

### URL & Navigation
```
Route: #/business-hub/:id
Handler: businessDetailViewHandler
Full-width: Yes (100% viewport width)
Scrollable: Yes (content area)
Previous/Next: Navigation buttons between businesses
```

### Page Structure

```
┌────────────────────────────────────────────────────────────────┐
│  [← Back to Directory]                   [< Prev] [Next >]     │
│                                                                │
│  ┌──────────┐  Business Name                                  │
│  │          │  Category Badge    ⭐ 4.8 (42)                 │
│  │ Business │  ✓ Verified Member                             │
│  │  Image   │                                                │
│  │          │  [Contact] [Website] [Share] [Save]            │
│  └──────────┘                                                │
│                                                                │
│  [Profile] [Geographic] [Reviews] [Quotes] [AI Search]        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ── Profile Tab Content (Full Width, Scrollable) ──           │
│                                                                │
│  ABOUT                                  CONTACT               │
│  Long description...                    Phone: (617) 555-1234  │
│  ...multiple paragraphs...              Email: info@abc.com    │
│                                         Website: abc.com       │
│  HOURS OF OPERATION                                           │
│  Monday - Friday: 9am - 5pm              SOCIAL                │
│  Saturday: 10am - 3pm                    🔗 LinkedIn            │
│  Sunday: Closed                          🔗 Facebook            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Header Section

**Back Button & Navigation:**
```html
<div class="detail-header-top">
  <button class="back-button" id="backBtn" aria-label="Back to directory">
    ← Back to Directory
  </button>

  <div class="detail-nav-buttons">
    <button class="nav-button" id="prevBusinessBtn" aria-label="Previous business">
      < Previous
    </button>
    <button class="nav-button" id="nextBusinessBtn" aria-label="Next business">
      Next >
    </button>
  </div>
</div>
```

**Business Header Info:**
```html
<div class="detail-header-main">
  <div class="detail-header-left">
    <div class="business-detail-image">
      <img
        src="${business.image_url || '/img/business-placeholder.svg'}"
        alt="${business.name}"
        class="detail-image"
      />
    </div>
  </div>

  <div class="detail-header-right">
    <h1 class="detail-business-name">${business.name}</h1>

    <div class="detail-header-badges">
      <span class="detail-category-badge">${business.category}</span>
      <span class="detail-verified-badge">✓ Verified Member</span>
    </div>

    <div class="detail-rating-section">
      ${renderStarsLarge(business.rating)}
      <span class="detail-rating-value">${business.rating.toFixed(1)}</span>
      <span class="detail-rating-count">(${business.review_count} reviews)</span>
    </div>

    <p class="detail-tagline">${business.description}</p>

    <div class="detail-action-buttons">
      <button class="btn btn-primary" id="contactBtn">Contact</button>
      <button class="btn btn-secondary" id="websiteBtn">Website</button>
      <button class="btn btn-secondary" id="shareBtn">Share</button>
      <button class="btn btn-secondary" id="saveBtn">Save</button>
    </div>
  </div>
</div>
```

**Styling:**
```css
.detail-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e6dbcd;
  background: var(--bg);
}

.back-button {
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #e6dbcd;
  border-radius: 4px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e4f0ed;
  border-color: var(--accent);
  color: var(--accent);
}

.detail-nav-buttons {
  display: flex;
  gap: 8px;
}

.nav-button {
  padding: 8px 12px;
  background: var(--panel);
  border: 1px solid #e6dbcd;
  border-radius: 4px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-button:hover:not(:disabled) {
  background: #e4f0ed;
  border-color: var(--accent);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.detail-header-main {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  padding: 32px 24px;
  background: var(--panel);
  border-bottom: 1px solid #e6dbcd;
}

.business-detail-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f0e8 0%, #e6dbcd 100%);
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-header-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-business-name {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}

.detail-header-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-category-badge {
  display: inline-block;
  background: #e4f0ed;
  color: #0a5d52;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-verified-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e4f0ed;
  color: #0a5d52;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.detail-verified-badge::before {
  content: "✓";
  font-weight: 700;
}

.detail-rating-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-rating-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.detail-rating-count {
  font-size: 13px;
  color: var(--muted);
}

.detail-tagline {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
  max-width: 600px;
}

.detail-action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.detail-action-buttons .btn {
  padding: 10px 16px;
  font-size: 13px;
  border-radius: 4px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-action-buttons .btn-primary {
  background: var(--accent);
  color: white;
}

.detail-action-buttons .btn-primary:hover {
  background: #08493f;
}

.detail-action-buttons .btn-secondary {
  background: #e4f0ed;
  color: #0a5d52;
  border: 1px solid #d0e8e3;
}

.detail-action-buttons .btn-secondary:hover {
  background: #d0e8e3;
}
```

**Responsive:**
```css
/* Tablet (max-width: 1024px) */
@media (max-width: 1024px) {
  .detail-header-main {
    grid-template-columns: 150px 1fr;
    gap: 24px;
  }

  .business-detail-image {
    width: 150px;
    height: 150px;
  }

  .detail-business-name {
    font-size: 28px;
  }
}

/* Mobile (max-width: 600px) */
@media (max-width: 600px) {
  .detail-header-top {
    flex-direction: column;
    gap: 12px;
  }

  .back-button {
    width: 100%;
  }

  .detail-nav-buttons {
    width: 100%;
  }

  .nav-button {
    flex: 1;
  }

  .detail-header-main {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .business-detail-image {
    width: 100%;
    height: 200px;
  }

  .detail-business-name {
    font-size: 24px;
  }

  .detail-action-buttons {
    flex-direction: column;
  }

  .detail-action-buttons .btn {
    width: 100%;
  }
}
```

---

## Part 5: Tab System (Full-Width Tabs)

### Tab Bar Navigation

```html
<div class="detail-tab-bar" role="tablist" aria-label="Business information tabs">
  <button
    class="detail-tab profile-tab active"
    data-tab="profile"
    role="tab"
    aria-selected="true"
    aria-controls="tab-panel-profile"
  >
    Profile
  </button>
  <button
    class="detail-tab geographic-tab"
    data-tab="geographic"
    role="tab"
    aria-selected="false"
    aria-controls="tab-panel-geographic"
  >
    Geographic
  </button>
  <button
    class="detail-tab reviews-tab"
    data-tab="reviews"
    role="tab"
    aria-selected="false"
    aria-controls="tab-panel-reviews"
  >
    Reviews
  </button>
  <button
    class="detail-tab quotes-tab"
    data-tab="quotes"
    role="tab"
    aria-selected="false"
    aria-controls="tab-panel-quotes"
  >
    Quotes
  </button>
  <button
    class="detail-tab ai-search-tab"
    data-tab="ai-search"
    role="tab"
    aria-selected="false"
    aria-controls="tab-panel-ai-search"
  >
    AI Search
  </button>
</div>
```

**Styling:**
```css
.detail-tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e6dbcd;
  background: var(--bg);
  overflow-x: auto;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.detail-tab {
  padding: 16px 20px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.detail-tab:hover {
  color: var(--text);
  background: rgba(10, 93, 82, 0.02);
}

.detail-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.detail-tab:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -5px;
}
```

### Tab Panels

```html
<div class="detail-tab-panels">
  <!-- Profile Tab -->
  <div
    id="tab-panel-profile"
    class="detail-tab-panel profile-tab-panel active"
    role="tabpanel"
    aria-labelledby="profile-tab"
  >
    <!-- Content loaded by profile-tab.js -->
  </div>

  <!-- Geographic Tab -->
  <div
    id="tab-panel-geographic"
    class="detail-tab-panel geographic-tab-panel"
    role="tabpanel"
    aria-labelledby="geographic-tab"
  >
    <!-- Content loaded by geographic-tab.js -->
  </div>

  <!-- Reviews Tab -->
  <div
    id="tab-panel-reviews"
    class="detail-tab-panel reviews-tab-panel"
    role="tabpanel"
    aria-labelledby="reviews-tab"
  >
    <!-- Content loaded by reviews-tab.js -->
  </div>

  <!-- Quotes Tab -->
  <div
    id="tab-panel-quotes"
    class="detail-tab-panel quotes-tab-panel"
    role="tabpanel"
    aria-labelledby="quotes-tab"
  >
    <!-- Content loaded by quotes-tab.js -->
  </div>

  <!-- AI Search Tab -->
  <div
    id="tab-panel-ai-search"
    class="detail-tab-panel ai-search-tab-panel"
    role="tabpanel"
    aria-labelledby="ai-search-tab"
  >
    <!-- Content loaded by ai-search-tab.js -->
  </div>
</div>
```

**Styling:**
```css
.detail-tab-panels {
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px;
  background: var(--bg);
}

.detail-tab-panel {
  display: none;
}

.detail-tab-panel.active {
  display: block;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Part 6: Tab Content Layouts (Full Width)

### Profile Tab

**Content:**
```html
<div class="profile-tab-content">
  <!-- About Section -->
  <section class="profile-section">
    <h3>About</h3>
    <p class="profile-description">
      ${business.description}
    </p>
  </section>

  <!-- Contact Section -->
  <section class="profile-section">
    <h3>Contact Information</h3>
    <div class="profile-contact">
      <div class="contact-item">
        <span class="contact-label">Phone:</span>
        <a href="tel:${business.phone}" class="contact-link">${business.phone}</a>
        <button class="btn-copy" data-copy="${business.phone}">Copy</button>
      </div>
      <div class="contact-item">
        <span class="contact-label">Email:</span>
        <a href="mailto:${business.email}" class="contact-link">${business.email}</a>
        <button class="btn-copy" data-copy="${business.email}">Copy</button>
      </div>
      <div class="contact-item">
        <span class="contact-label">Website:</span>
        <a href="${business.website}" target="_blank" class="contact-link">${business.website}</a>
      </div>
    </div>
  </section>

  <!-- Address Section -->
  <section class="profile-section">
    <h3>Address</h3>
    <div class="address-block">
      <p>${business.address}</p>
      <p>${business.city}, ${business.state} ${business.zip_code}</p>
    </div>
  </section>

  <!-- Hours Section -->
  <section class="profile-section">
    <h3>Hours of Operation</h3>
    <div class="profile-hours">
      ${business.hours.map(hour => `
        <div class="hours-row">
          <span class="hours-day">${hour.day}</span>
          <span class="hours-time">${hour.open} - ${hour.close}</span>
        </div>
      `).join('')}
    </div>
  </section>

  <!-- Social Links Section -->
  <section class="profile-section">
    <h3>Follow Us</h3>
    <div class="profile-social">
      ${business.social_links.map(link => `
        <a href="${link.url}" target="_blank" class="social-link">
          ${link.platform} →
        </a>
      `).join('')}
    </div>
  </section>
</div>
```

**Styling:**
```css
.profile-tab-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 800px;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text);
  padding-bottom: 8px;
  border-bottom: 2px solid #e6dbcd;
}

.profile-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text);
}

.profile-contact {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-label {
  font-weight: 600;
  color: var(--text);
  min-width: 80px;
  font-size: 13px;
}

.contact-link {
  color: var(--accent);
  text-decoration: none;
  flex: 1;
  word-break: break-all;
  font-size: 13px;
}

.contact-link:hover {
  text-decoration: underline;
}

.btn-copy {
  background: transparent;
  border: 1px solid #e6dbcd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--accent);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-copy:hover {
  background: #e4f0ed;
}

.address-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.address-block p {
  margin: 0;
  color: var(--text);
}

.profile-hours {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hours-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  font-size: 13px;
}

.hours-day {
  font-weight: 600;
  color: var(--text);
}

.hours-time {
  color: var(--muted);
}

.profile-social {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.social-link {
  display: inline-block;
  padding: 10px 16px;
  background: #e4f0ed;
  color: #0a5d52;
  text-decoration: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  width: fit-content;
}

.social-link:hover {
  background: #d0e8e3;
  transform: translateX(4px);
}
```

### Geographic Tab

**Content:**
```html
<div class="geographic-tab-content">
  <!-- Location Section -->
  <section class="geo-section">
    <h3>Location</h3>
    <div class="geo-location">
      <h4 class="location-address">${business.address}</h4>
      <div class="location-details">
        <span>${business.city}, ${business.state} ${business.zip_code}</span>
      </div>
    </div>
  </section>

  <!-- Map Section -->
  <section class="geo-section">
    <h3>Map</h3>
    <div class="geo-map-container">
      <iframe
        class="geo-map-embed"
        src="https://maps.google.com/maps?q=${encodeURIComponent(business.address)}&output=embed"
        allowfullscreen=""
        loading="lazy"
      ></iframe>
    </div>
  </section>

  <!-- Service Area Section -->
  <section class="geo-section">
    <h3>Service Area</h3>
    <div class="geo-scope">
      <div class="scope-item">
        <span class="scope-label">Scope Type:</span>
        <span class="scope-value">${business.geo_scope_type}</span>
      </div>
      <div class="scope-item">
        <span class="scope-label">Service Area:</span>
        <span class="scope-value">${business.service_area_display}</span>
      </div>
    </div>
  </section>

  <!-- Coordinates Section (if available) -->
  <section class="geo-section">
    <h3>Coordinates</h3>
    <div class="geo-scope">
      <div class="coord-item">
        <span class="coord-label">Latitude:</span>
        <span class="coord-value">${business.latitude}</span>
      </div>
      <div class="coord-item">
        <span class="coord-label">Longitude:</span>
        <span class="coord-value">${business.longitude}</span>
      </div>
    </div>
  </section>

  <!-- View in Geo Intelligence Link -->
  <div class="geo-intelligence-link">
    <button class="btn btn-secondary" id="viewGeoIntelligenceBtn">
      View on Geo Intelligence Map →
    </button>
  </div>
</div>
```

**Styling:** (mostly reused from current CSS, but adapted for full-width)

```css
.geographic-tab-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 800px;
}

.geo-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.geo-section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text);
  padding-bottom: 8px;
  border-bottom: 2px solid #e6dbcd;
}

.geo-map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e6dbcd;
}

.geo-map-embed {
  width: 100%;
  height: 100%;
  border: none;
}

.geo-intelligence-link {
  margin-top: 16px;
}

.geo-intelligence-link .btn {
  padding: 12px 20px;
  font-size: 14px;
}
```

### Reviews Tab

**Layout:** (current styling, but full-width content area)

```html
<div class="reviews-tab-content">
  <!-- Review Form -->
  <section class="reviews-form-section">
    <h3>Leave a Review</h3>
    <form class="review-form" id="reviewForm">
      <!-- Form fields -->
    </form>
  </section>

  <!-- Reviews List -->
  <section class="reviews-list-section">
    <h3>Reviews (${business.review_count})</h3>
    <div class="reviews-list">
      ${business.reviews.map(review => `
        <div class="review-card">
          <!-- Review content -->
        </div>
      `).join('')}
    </div>
  </section>
</div>
```

### Quotes Tab

**Layout:** (current styling, but full-width content area)

```html
<div class="quotes-tab-content">
  <!-- Quote Request Form -->
  <section class="quotes-form-section">
    <h3>Request a Quote</h3>
    <form class="quote-form" id="quoteForm">
      <!-- Form fields -->
    </form>
  </section>

  <!-- Quote History -->
  <section class="quotes-list-section">
    <h3>Quote History</h3>
    <div class="quotes-list">
      ${business.quotes.map(quote => `
        <div class="quote-card">
          <!-- Quote content -->
        </div>
      `).join('')}
    </div>
  </section>
</div>
```

### AI Search Tab

**Layout:** (current styling, but full-width content area)

```html
<div class="ai-search-tab-content">
  <!-- Search controls -->
  <!-- Results section -->
  <!-- Related meetings list -->
</div>
```

---

## Part 7: Responsive Design Strategy

### Breakpoints
- **Desktop:** > 1200px (3-col card grid)
- **Tablet:** 800px - 1200px (2-col card grid)
- **Mobile:** < 800px (1-col card grid, single full-width page)

### List View Responsive

```css
/* Desktop (>1200px) */
.business-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 24px;
}

/* Tablet (800px - 1200px) */
@media (max-width: 1200px) {
  .business-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 20px;
  }
}

/* Mobile (<800px) */
@media (max-width: 800px) {
  .business-cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .business-list-header {
    padding: 16px;
  }

  .list-filter-section {
    padding: 0 16px;
  }

  .list-filter-section .filter-bar {
    grid-template-columns: 1fr;
  }

  .detail-header-main {
    grid-template-columns: 1fr;
  }

  .business-detail-image {
    height: 200px;
  }

  .detail-tab-bar {
    padding: 0 16px;
    overflow-x: auto;
  }

  .detail-tab {
    padding: 12px 16px;
    font-size: 12px;
  }

  .detail-tab-panels {
    padding: 16px;
  }
}
```

### Mobile Navigation

On mobile, tabs appear as:
1. **Scrollable horizontal chips** (current approach)
2. **Dropdown select** (alternative, more mobile-friendly)

```html
<!-- Option 1: Scrollable chips (current) -->
<div class="detail-tab-bar mobile-scrollable">
  <!-- Tabs scroll horizontally -->
</div>

<!-- Option 2: Dropdown (alternative) -->
<select class="tab-select-mobile" id="tabSelect">
  <option value="profile">Profile</option>
  <option value="geographic">Geographic</option>
  <option value="reviews">Reviews</option>
  <option value="quotes">Quotes</option>
  <option value="ai-search">AI Search</option>
</select>
```

---

## Part 8: Navigation Flow

### User Journey

**Scenario 1: Browse & Discover**
```
1. User navigates to #/business-hub
   → businessListViewHandler renders directory
   → Shows list of approved/validated businesses
   → 3-column grid on desktop

2. User searches or filters
   → Real-time results update
   → Cards reflow based on matches

3. User clicks business card
   → Navigate to #/business-hub/:id
   → businessDetailViewHandler renders detail page
   → Profile tab loaded first (lazy-load others)

4. User clicks "Back to Directory"
   → Navigate back to #/business-hub
   → List view restored (maintain scroll position with state)
```

**Scenario 2: Browse Between Businesses**
```
1. User viewing #/business-hub/:id
2. User clicks "Next" button
   → Load next business in list
   → URL changes to #/business-hub/:id2
   → No navigation back to list, stays in detail flow
3. User clicks "Previous"
   → Go to previous business
```

**Scenario 3: Cross-Navigation to Geo Intelligence**
```
1. User in Geographic tab
2. User clicks "View on Geo Intelligence"
   → Navigate to #/geo-intelligence/:id
   → Shows business on full geographic map
3. From Geo Intelligence back button
   → Return to #/business-hub/:id (preserve tab)
```

### Route Handlers

```javascript
// Route 1: Business Directory List
export async function businessListViewHandler(params, context) {
  // Load full-page list view
  // Render card grid (3-col desktop, 2-col tablet, 1-col mobile)
  // Filter: status=approved AND validation_status=validated
}

// Route 2: Business Detail View
export async function businessDetailViewHandler(params, context) {
  // Load full-page detail view
  // params.id contains business ID
  // Load business data
  // Initialize tab system (lazy-load tab content)
}

// URL changes trigger handler
// #/business-hub → businessListViewHandler()
// #/business-hub/:id → businessDetailViewHandler({id})
// Back button: window.history.back() or navigate('/business-hub')
```

---

## Part 9: Filter & Search Strategy

### Real-Time Search (Debounced)

```javascript
// Debounced search handler
function handleSearch(searchTerm) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    const filtered = businesses.filter(biz => {
      const searchLower = searchTerm.toLowerCase();
      return (
        biz.name.toLowerCase().includes(searchLower) ||
        biz.category.toLowerCase().includes(searchLower) ||
        biz.city.toLowerCase().includes(searchLower) ||
        biz.description.toLowerCase().includes(searchLower)
      );
    });
    render(filtered);
  }, 300); // 300ms debounce
}
```

### Multi-Select Filtering

```javascript
// State
const state = {
  filters: {
    categories: [],      // Multi-select
    locations: [],       // Multi-select
    serviceArea: null,   // Single select
    minRating: 0,        // Single select
    verificationOnly: true // Always true for Business Hub
  }
};

// Apply filters
function applyFilters() {
  let results = businesses.filter(biz => {
    // Verification filter (always applied)
    if (biz.status !== 'approved' || biz.validation_status !== 'validated') {
      return false;
    }

    // Category filter
    if (state.filters.categories.length > 0) {
      if (!state.filters.categories.includes(biz.category)) {
        return false;
      }
    }

    // Location filter
    if (state.filters.locations.length > 0) {
      if (!state.filters.locations.includes(biz.city)) {
        return false;
      }
    }

    // Service area filter
    if (state.filters.serviceArea) {
      if (biz.service_area_type !== state.filters.serviceArea) {
        return false;
      }
    }

    // Rating filter
    if (state.filters.minRating > 0) {
      if ((biz.rating || 0) < state.filters.minRating) {
        return false;
      }
    }

    return true;
  });

  return results;
}
```

### Filter Persistence

```javascript
// Save to sessionStorage during this session
function saveFilterState() {
  sessionStorage.setItem('businessHubFilters', JSON.stringify(state.filters));
}

// Load on page init
function loadFilterState() {
  const saved = sessionStorage.getItem('businessHubFilters');
  if (saved) {
    state.filters = JSON.parse(saved);
  }
}

// Clear when user clicks "Clear All"
function clearFilters() {
  state.filters = {
    categories: [],
    locations: [],
    serviceArea: null,
    minRating: 0,
    verificationOnly: true
  };
  saveFilterState();
  render();
}
```

---

## Part 10: Performance Considerations

### Lazy Loading

1. **Businesses List:** Load all initially (pagination at 50 per page)
2. **Business Images:** Lazy load with IntersectionObserver
3. **Tab Content:** Lazy load only when tab clicked
4. **Maps:** Load iframe only when Geographic tab opened

```javascript
// Image lazy loading
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      imageObserver.unobserve(img);
    }
  });
});

images.forEach(img => imageObserver.observe(img));
```

### Efficient Re-renders

```javascript
// Only re-render affected cards on filter change
function renderFilteredResults(results) {
  const grid = document.querySelector('.business-cards-grid');

  // Clear and re-render (simple approach)
  grid.innerHTML = '';
  results.forEach(biz => {
    grid.appendChild(createBusinessCard(biz));
  });

  // OR: Update only changed cards (complex but performant)
  // - Compare previous results to new results
  // - Only update cards that changed
}
```

### Pagination Strategy

```javascript
const PAGE_SIZE = 50;

// Load paginated results
function loadPage(pageNum) {
  const start = (pageNum - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return filteredBusinesses.slice(start, end);
}

// Render page
function renderPage(pageNum) {
  const businesses = loadPage(pageNum);
  renderCards(businesses);
  updatePaginationButtons(pageNum, totalPages);
}
```

---

## Part 11: API Integration

### Endpoints Used

```
GET /api/business-listings
  Query params:
    ?approved=true
    &validated=true
    &search=term
    &category=tech
    &location=boston
    &limit=50
    &offset=0
  Returns: Array of business objects

GET /api/business-listings/:id
  Returns: Single business object with all details

GET /api/business-listings/:id/reviews
  Returns: Array of review objects

POST /quotes
  Body: {businessId, serviceType, description}
  Returns: Quote object

POST /business-listings (admin only)
  Creates new business

PUT /business-listings/:id (admin only)
  Updates business
```

### Sample API Response

```json
{
  "id": "biz_abc123",
  "name": "ABC Corporation",
  "category": "Technology",
  "description": "Full-service IT solutions",
  "address": "123 Main St",
  "city": "Boston",
  "state": "MA",
  "zip_code": "02101",
  "phone": "(617) 555-1234",
  "email": "info@abc.com",
  "website": "https://abc.com",
  "image_url": "https://cdn.example.com/biz_abc123.jpg",
  "status": "approved",
  "validation_status": "validated",
  "rating": 4.8,
  "review_count": 42,
  "service_area_type": "statewide",
  "service_area_display": "MA, NH, VT",
  "hours": [
    {"day": "Monday", "open": "9:00 AM", "close": "5:00 PM"},
    {"day": "Tuesday", "open": "9:00 AM", "close": "5:00 PM"},
    {"day": "Wednesday", "open": "9:00 AM", "close": "5:00 PM"},
    {"day": "Thursday", "open": "9:00 AM", "close": "5:00 PM"},
    {"day": "Friday", "open": "9:00 AM", "close": "5:00 PM"},
    {"day": "Saturday", "open": "Closed", "close": "Closed"},
    {"day": "Sunday", "open": "Closed", "close": "Closed"}
  ],
  "social_links": [
    {"platform": "LinkedIn", "url": "https://linkedin.com/company/abc"},
    {"platform": "Facebook", "url": "https://facebook.com/abc"}
  ],
  "geo_scope_type": "statewide",
  "geo_scope_id": "MA",
  "latitude": 42.3601,
  "longitude": -71.0589,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-03-20T14:22:00Z"
}
```

---

## Part 12: CSS Architecture

### File Structure

```
apps/secretary-console/views/business-hub/
├── business-list-view.js          (NEW: full-page list handler)
├── business-detail-view.js        (NEW: full-page detail handler)
├── business-list.js               (DEPRECATED: old 2-pane list)
├── business-detail.js             (DEPRECATED: old 2-pane detail)
├── tabs/
│   ├── profile-tab.js            (REUSED: no changes needed)
│   ├── geographic-tab.js         (REUSED: no changes needed)
│   ├── reviews-tab.js            (REUSED: no changes needed)
│   ├── quotes-tab.js             (REUSED: no changes needed)
│   └── ai-search-tab.js          (REUSED: no changes needed)
├── business-hub.css              (UPDATED: full-page styles)
└── business-hub-view.js           (DEPRECATED: old coordinator)
```

### CSS Classes (Full-Page)

**List View:**
- `.business-list-view-container` - Main container
- `.business-list-header` - Title + trust message
- `.business-list-search-section` - Search box
- `.business-list-filter-section` - Filter controls
- `.business-cards-grid` - Card grid layout
- `.business-card` - Individual card
- `.card-image-section`, `.card-content`, `.card-meta`, etc.

**Detail View:**
- `.business-detail-view-container` - Main container
- `.detail-header-top` - Back button + nav
- `.detail-header-main` - Business info + image
- `.detail-tab-bar` - Tab navigation
- `.detail-tab` - Individual tab button
- `.detail-tab-panels` - Tab content area
- `.detail-tab-panel` - Individual tab panel

**Verified Badge:**
- `.verified-badge` - Styling for "✓ Verified Member"

### Responsive Grid Classes

```css
/* Utility classes for responsive layouts */

.grid-3-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1200px) {
  .grid-3-col {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 800px) {
  .grid-3-col {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

---

## Part 13: Before/After Comparison

### BEFORE (2-Pane, Cramped)

```
┌──────────────────────────────────────────────────────────┐
│ Business Hub                                             │
├──────────────────┬──────────────────────────────────────┤
│ List (30%)       │ Detail (70%)                         │
│                  │                                      │
│ [Search]         │ [Business Name]                      │
│ [Filter] [Sort]  │ [Category | Rating]                  │
│                  │                                      │
│ [Card 1]         │ [Profile] [Geo] [Rev] [Quotes]...    │
│ [Card 2]    X    │                                      │
│ [Card 3]         │ Content squeezed into 70% width:     │
│ [Card 4]         │ - Text cramped                       │
│ [Card 5]         │ - Maps too small                     │
│            ↓     │ - Forms cramped                      │
└──────────────────┴──────────────────────────────────────┘

Problems:
- List view cramped (business names truncated)
- Detail view cramped (70% width constraint)
- Tab switching awkward in tight space
- Mobile: list hidden entirely
- Discovery difficult (can't see many businesses)
- Confusing interaction model (side-by-side)
```

### AFTER (Full-Page, Spacious)

```
List View (#/business-hub):
┌──────────────────────────────────────────────────────────┐
│ Business Hub Directory                                   │
│ ✓ All businesses verified by the Chamber                 │
│                                                          │
│ [🔍 Search] [Filters ▼] [Cards/Table]                   │
│                                                          │
│ [Card 1]        [Card 2]        [Card 3]                │
│ [Card 4]        [Card 5]        [Card 6]                │
│ [Card 7]        [Card 8]        [Card 9]                │
└──────────────────────────────────────────────────────────┘

Detail View (#/business-hub/:id):
┌──────────────────────────────────────────────────────────┐
│ [← Back] [< Prev] [Next >]                               │
│                                                          │
│ [Image] Business Name ⭐ 4.8                             │
│         ✓ Verified Member                               │
│         [Contact] [Website] [Share] [Save]              │
│                                                          │
│ [Profile] [Geographic] [Reviews] [Quotes] [AI Search]   │
│                                                          │
│ ABOUT               CONTACT                              │
│ Long description    Phone: (617) 555-1234                │
│ ...full text...     Email: info@abc.com                  │
│                     Website: abc.com                     │
│                                                          │
│ HOURS                                                    │
│ Mon-Fri: 9am-5pm     SOCIAL MEDIA                        │
│ Sat: 10am-3pm        🔗 LinkedIn                         │
│ Sun: Closed          🔗 Facebook                         │
└──────────────────────────────────────────────────────────┘

Benefits:
- Full-width directory scanning (3-col desktop, 2-col tablet, 1-col mobile)
- Full-width detail view with breathing room
- Natural page navigation (list → detail → list)
- Mobile stacking feels natural
- Verified badge prominent on all listings
- Better discovery experience
- Cleaner code (separate handlers)
- Better performance (lazy-loading)
```

---

## Part 14: Implementation Strategy

### Phase 1: Setup & Core Structure (1 day)

1. Create new files:
   - `business-list-view.js` (full-page list handler)
   - `business-detail-view.js` (full-page detail handler)

2. Update routing:
   - Add handlers to main app router
   - Map `#/business-hub` → businessListViewHandler
   - Map `#/business-hub/:id` → businessDetailViewHandler

3. Update CSS:
   - Remove 2-pane grid (line 19-26)
   - Add full-page layout styles
   - Add verified badge styles

### Phase 2: List View Implementation (2 days)

1. Implement businessListViewHandler:
   - Load and render full-page directory
   - Create search functionality (debounced)
   - Create filter controls (multi-select)
   - Create card grid (responsive 3-2-1 col)
   - Implement pagination

2. Add styling:
   - Card grid layout
   - Search/filter bar styling
   - Responsive breakpoints
   - Hover/active states

3. Add interactivity:
   - Click card → navigate to detail
   - Filter state → sessionStorage
   - Clear filters button
   - Sort dropdown

### Phase 3: Detail View Implementation (2-3 days)

1. Implement businessDetailViewHandler:
   - Load business data
   - Render full-page detail header
   - Render tab system
   - Lazy-load tab content

2. Implement navigation:
   - Back button → #/business-hub
   - Previous/Next buttons between businesses
   - Cross-nav to Geo Intelligence

3. Add styling:
   - Header layout (image + info)
   - Tab bar styling
   - Tab panel full-width content
   - Verified badge display

### Phase 4: Testing & Polish (1-2 days)

1. Unit tests:
   - Search functionality
   - Filter logic
   - Pagination
   - Tab switching

2. E2E tests:
   - Navigate list → detail → list
   - Filter and search
   - Previous/Next navigation
   - Mobile responsiveness

3. Visual polish:
   - Refine spacing
   - Verify badge visibility
   - Dark theme compatibility
   - Accessibility (focus states, ARIA labels)

### Phase 5: Migration & Deprecation (0.5 days)

1. Deprecate old components:
   - Mark business-list.js as deprecated
   - Mark business-detail.js as deprecated
   - Mark business-hub-view.js as deprecated

2. Remove old routes:
   - Update app router
   - Remove old handlers

3. Update tests:
   - Update references
   - Update mocks

---

## Part 15: Testing Checklist

### Unit Tests

- [ ] Search filters correctly by name, category, location
- [ ] Filter by approval status (only approved + validated)
- [ ] Filter by rating works
- [ ] Sort options work (name, rating, newest, proximity)
- [ ] Pagination: page navigation works
- [ ] Pagination: shows correct range (1-50, 51-100, etc.)
- [ ] Clear filters button clears all filters
- [ ] Filter state persists in sessionStorage
- [ ] Previous/Next buttons disabled at boundaries
- [ ] Tab switching loads correct content
- [ ] Lazy loading: images don't load until in viewport
- [ ] Lazy loading: tab content doesn't load until clicked

### E2E Tests (Playwright)

- [ ] Navigate to #/business-hub → list view renders
- [ ] List shows 3 columns on desktop
- [ ] List shows 2 columns on tablet (1024px)
- [ ] List shows 1 column on mobile (767px)
- [ ] Click search → results filter in real-time
- [ ] Click category filter → results update
- [ ] Click business card → navigate to detail view (#/business-hub/:id)
- [ ] Detail view renders full header (image, name, rating, verified badge)
- [ ] Detail tabs are visible and clickable
- [ ] Click "Profile" tab → profile content loads
- [ ] Click "Geographic" tab → map loads
- [ ] Click "Reviews" tab → reviews load
- [ ] Click "Back to Directory" → navigate to #/business-hub
- [ ] Click "Previous" → navigate to previous business
- [ ] Click "Next" → navigate to next business
- [ ] "Previous" disabled on first business
- [ ] "Next" disabled on last business
- [ ] Verified badge visible on all cards
- [ ] Verified badge visible on detail header
- [ ] "View on Geo Intelligence" link works
- [ ] Mobile: tabs scroll horizontally
- [ ] Mobile: content readable without horizontal scroll
- [ ] Search results filter correctly on mobile
- [ ] All test IDs present and correct

### Visual/UX Tests

- [ ] Business names readable on cards
- [ ] Rating clearly visible (stars + number)
- [ ] Verified badge prominent (✓ green)
- [ ] Category/tag visible on cards
- [ ] Image loads or shows placeholder
- [ ] "No results" message clear when filters match nothing
- [ ] Loading state visible during data fetch
- [ ] Error state handled gracefully
- [ ] Dark theme: colors correct
- [ ] Light theme: colors correct
- [ ] Tab content not cramped (full-width visible)
- [ ] Forms in tabs (quote, review) not squeezed
- [ ] Maps display correctly in Geographic tab
- [ ] Hover states work on all interactive elements
- [ ] Focus states visible (accessibility)

### Performance Tests

- [ ] List view loads <2s on 3G
- [ ] Images lazy load correctly
- [ ] Tab switching instant (no lag)
- [ ] Filter updates responsive (<500ms)
- [ ] No console errors
- [ ] No memory leaks on repeated navigation
- [ ] Pagination large lists (1000+ businesses) loads fast

---

## Part 16: Success Criteria

### Functional

- ✅ Directory list shows ONLY approved + validated businesses
- ✅ Full-page list view renders correctly
- ✅ Full-page detail view renders correctly
- ✅ All 5 tabs work (reuse existing tab modules)
- ✅ Search filters by name, category, location
- ✅ Filters work (category, location, rating, service area)
- ✅ Sort options work (name, rating, newest, proximity)
- ✅ Pagination works for large lists
- ✅ Navigation between list and detail works
- ✅ Previous/Next navigation between businesses works
- ✅ "View on Geo Intelligence" button navigates correctly
- ✅ Verified badge visible and prominent

### UX/Design

- ✅ 3-column card grid on desktop (>1200px)
- ✅ 2-column card grid on tablet (800-1200px)
- ✅ 1-column card grid on mobile (<800px)
- ✅ No horizontal scroll on any breakpoint
- ✅ Tab content full-width without constraints
- ✅ Maps, forms, reviews readable without scrolling
- ✅ Touch-friendly buttons on mobile
- ✅ Clear loading/error states
- ✅ Dark theme support
- ✅ Better UX than 2-pane version

### Technical

- ✅ No breaking changes to existing tests
- ✅ All test IDs preserved
- ✅ Reuse existing tab components (no duplication)
- ✅ Same API contract as before
- ✅ Filter results correctly (approved=true, validated=true)
- ✅ Performance: list loads <2s, tabs switch instant
- ✅ No console errors or warnings
- ✅ Accessibility: focus states, ARIA labels

### Code Quality

- ✅ businessListViewHandler properly structured
- ✅ businessDetailViewHandler properly structured
- ✅ CSS well-organized and documented
- ✅ Comments explain complex logic
- ✅ No code duplication
- ✅ Functions are single-responsibility

---

## Part 17: Timeline

| Phase | Task | Duration | Owner |
|-------|------|----------|-------|
| 1 | Design specification (this doc) | 1 day | ✅ Complete |
| 2 | Setup new files & routing | 1 day | TBD |
| 3 | List view implementation | 2 days | TBD |
| 4 | Detail view implementation | 2-3 days | TBD |
| 5 | Testing & bug fixes | 1-2 days | TBD |
| 6 | Polish & refinement | 0.5 days | TBD |
| 7 | Migration & cleanup | 0.5 days | TBD |
| **Total** | **6-7 days** | | |

**Parallel work possible:**
- List & Detail views can be developed in parallel (after setup phase)
- Testing can begin as each component is ready

---

## Part 18: Notes for Implementers

### Important Implementation Details

1. **API Filter:** Add query parameter support to `GET /api/business-listings`:
   ```javascript
   // In business_listings.js route handler
   // Filter by approval status
   if (req.query.approved === 'true') {
     businesses = businesses.filter(b => b.status === 'approved');
   }
   if (req.query.validated === 'true') {
     businesses = businesses.filter(b => b.validation_status === 'validated');
   }
   ```

2. **Verified Badge:** Always show when:
   - `status === 'approved'`
   - `validation_status === 'validated'`
   - Display: `✓ Verified Member` with green background

3. **Previous/Next Navigation:**
   - Maintain filtered/sorted list in state
   - Navigate through current results only
   - Disable buttons at boundaries

4. **Tab Lazy Loading:**
   - Only load tab content when tab clicked
   - Reuse existing tab initializers
   - Don't load all tabs at once

5. **Image Handling:**
   - Use `data-src` for lazy loading
   - Provide placeholder SVG as fallback
   - Use IntersectionObserver for efficiency

6. **Mobile Tabs:**
   - Keep horizontal scroll (current approach)
   - OR implement dropdown select for better mobile UX
   - Test on real devices

7. **Responsive Padding:**
   - Desktop: 24px padding
   - Tablet: 20px padding
   - Mobile: 16px padding

8. **Focus Management:**
   - Back button gets focus after navigation
   - Tab navigation uses keyboard (↑↓ arrows)
   - All interactive elements have visible focus states

9. **Error Handling:**
   - Show toast on API errors
   - Show empty state if no results
   - Show loading spinner during fetch

10. **Session State:**
    - Save filter state to sessionStorage
    - Maintain scroll position if possible
    - Clear state on logout

### Git Commits

Recommended commit structure:
```
1. feat: Create business-list-view.js for full-page directory
2. feat: Create business-detail-view.js for full-page detail
3. feat: Add full-page routing for #/business-hub and #/business-hub/:id
4. feat: Implement list view with search, filter, card grid
5. feat: Implement detail view with verified badge and tabs
6. feat: Update CSS for full-page layouts
7. test: Add unit tests for business hub redesign
8. test: Add E2E tests for list/detail navigation
9. refactor: Deprecate old 2-pane components
10. docs: Update CHANGELOG for Phase 6 Redesign
```

---

## Conclusion

This design specification provides a complete blueprint for redesigning Phase 6 from a cramped 2-pane layout into a spacious, full-page experience that better serves the business discovery use case. The redesign leverages full viewport width for better scanning, maintains all existing functionality through tab reuse, and improves mobile experience through natural page stacking.

The Verified Member badge prominently communicates that all businesses in the Business Hub have been approved and validated by the Chamber, building user trust and distinguishing this directory from the Geo Intelligence map (which shows all locations for analysis).

Key success factors:
- Clear separation of list and detail views
- Full-width utilization on all devices
- Prominent verification status
- Efficient pagination and lazy-loading
- Reuse of existing tab components
- Natural responsive stacking

---

**Document Version:** 1.0
**Last Updated:** 2026-03-28
**Status:** Ready for Implementation
