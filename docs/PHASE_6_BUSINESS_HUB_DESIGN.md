# Phase 6: Business Hub Modularization Design Specification

**Status**: Design Phase
**Timeline**: 1-2 weeks
**Dependencies**: Phase 4 (Sidebar + Layout), Phase 5 (Modularization patterns)
**Success Criteria**: All business hub functionality works identically, E2E tests pass without changes, 6 modular components, each <250 lines

---

## 1. Current State Analysis

### 1.1 Existing Business Hub Feature
The Business Hub feature was added in commit c5a0ee8 (AI product management) with complete Local Business OS implementation:
- **Business directory**: List of local member businesses
- **Business detail view**: Multi-tab interface for exploring business information
- **5 major tabs**: Profile, Geographic, Reviews, Quotes, AI Search
- **Modal interactions**: Review response drafting, quote request forms
- **API endpoints**: Complete backend implementation with 4 route files

**Current Location**:
- HTML structure: `index.html` lines 105-108, 192-249 (businessHubView + bizModal)
- Handlers: `app.js` lines 269-272 (businessHubHandler placeholder)
- Styles: `styles.css` lines 1120-1250+ (business-card, review-card, quote-card, etc.)
- No view modules yet (feature added before Phase 5 modularization)

### 1.2 Business Hub HTML Structure
```html
<!-- Main container: empty, populated by handler -->
<main class="shell hidden" id="businessHubView">
  <!-- Content rendered by handlers -->
</main>

<!-- Add Business Modal: form for creating new business -->
<div id="bizModal" class="modal hidden">
  <!-- 10 input fields: name, category, address, city, state, zip, phone, email, geoType, scopeId -->
</div>
```

### 1.3 Current Code Breakdown

#### HTML Elements
- Business Hub main: 1 element
- Business Modal: 10 input fields + form controls
- Modal has data-testid attributes for all inputs (E2E compatibility)

#### CSS Classes (Existing)
- `.business-card` (hover, active states)
- `.biz-category-pill`
- `.biz-score-row`, `.biz-score-block`, `.biz-score-value`, `.biz-score-label`
- `.biz-use-cases`, `.biz-use-case`
- `.review-card`, `.review-rating`, `.review-response-draft`
- `.quote-card` (partial, extends to line 1250+)

#### Test IDs (Must Preserve)
- Modal: `biz-modal-name`, `biz-modal-submit`, `biz-modal-cancel`
- All modal inputs have testid equivalents

### 1.4 API Integration Points (Confirmed)

**Base Routes**:
- `GET /business-listings` - List all businesses (filters: geo_scope_type, geo_scope_id, category, search)
- `POST /business-listings` - Create business (admin/secretary only)
- `GET /business-listings/:id` - Get single business
- `PUT /business-listings/:id` - Update business (admin/secretary only)
- `DELETE /business-listings/:id` - Delete business (admin only)

**Reviews Sub-Route**:
- `GET /business-listings/:id/reviews` - List reviews
- `POST /business-listings/:id/reviews` - Create review
- `PUT /business-listings/:id/reviews/:reviewId` - Update review
- `POST /business-listings/:id/reviews/:reviewId/draft-response` - AI draft response

**Quotes Sub-Route**:
- `GET /business-listings/:id/quotes` - List quotes
- `POST /business-listings/:id/quotes` - Create quote
- `PUT /business-listings/:id/quotes/:quoteId` - Update quote status

**AI Search Routes** (public endpoints):
- `GET /ai-search/business-profiles?orgId=X` - AI-enabled businesses
- `GET /ai-search/local-intelligence?scopeType=X&scopeId=Y&orgId=Z` - Geo content
- `GET /ai-search/schema.json?orgId=X` - JSON-LD LocalBusiness schema

---

## 2. Target Module Structure (Phase 5 Pattern)

Apply the same modularization pattern from Phase 5 Meetings View:

```
apps/secretary-console/views/business-hub/
├── business-hub-view.js          (70-100 lines)   Route handler + coordinator
├── business-list.js              (150-200 lines)  Directory list + search/filter
├── business-detail.js            (100-150 lines)  Detail header + tab selector
├── business-detail-header.js     (80-100 lines)   Business name/contact info
└── tabs/
    ├── profile-tab.js            (120-150 lines)  Business info, contact, hours
    ├── geographic-tab.js         (100-130 lines)  Map/location, service area
    ├── reviews-tab.js            (150-200 lines)  Reviews list, rating workflow
    ├── quotes-tab.js             (150-200 lines)  Quotes form, status, history
    └── ai-search-tab.js          (100-150 lines)  AI search, related meetings
```

**Total Target Lines**: 1000-1300 lines (split from ~400-500 currently monolithic)
**Modularity Gain**: Each module focused on single responsibility

### 2.1 Module Breakdown by Responsibility

| Module | Responsibility | Dependencies | Lines |
|--------|-----------------|--------------|-------|
| `business-hub-view.js` | Route handler, state coordination, tab/list selection | router, api, auth | 70-100 |
| `business-list.js` | Render list, filter/search, selection events | api, toast | 150-200 |
| `business-detail.js` | Detail pane header, tab switcher, data loading | api, tabs/* | 100-150 |
| `business-detail-header.js` | Business name, rating, actions, contact | none | 80-100 |
| `profile-tab.js` | Contact info, hours, social links, description | none | 120-150 |
| `geographic-tab.js` | Location details, service area, geo context | none | 100-130 |
| `reviews-tab.js` | Reviews list, rating, AI response draft modal | api, toast, modal | 150-200 |
| `quotes-tab.js` | Quotes list, request form, status tracking | api, toast, modal | 150-200 |
| `ai-search-tab.js` | Show relevant meetings, related businesses | api | 100-150 |

---

## 3. Component Hierarchy & Data Flow

```
businessHubHandler (app.js)
  ↓
business-hub-view
  ├─→ business-list                     (Side pane, left 30%)
  │    ├─ loadBusinesses()              [API call]
  │    ├─ filterBusinesses()            [Local filtering]
  │    ├─ renderList()                  [DOM render]
  │    └─ onSelectBusiness()            [Fire event to parent]
  │
  └─→ business-detail                   (Main pane, right 70%)
      ├─ business-detail-header         (Business card header)
      │  ├─ renderName()
      │  ├─ renderRating()
      │  └─ renderQuickActions()
      │
      └─ Tab Container                  (Tabs + panels)
         ├─ renderTabBar()
         ├─ activateTab()
         ├─ Tab Panels (one visible):
         │  ├─ profile-tab (name, contact, hours, social)
         │  ├─ geographic-tab (location, service area)
         │  ├─ reviews-tab (reviews list, workflow)
         │  ├─ quotes-tab (quotes list, form)
         │  └─ ai-search-tab (related meetings)
         │
         └─ Modals:
            ├─ Review Draft Modal (from reviews-tab)
            └─ Quote Request Modal (from quotes-tab)
```

### 3.1 State Management

**Coordinator State** (business-hub-view):
```javascript
{
  selectedBusinessId: null,          // Currently selected business (null = list only)
  activeTab: "profile",              // Current tab key
  listFilter: {                       // Search/filter state
    search: "",
    category: null,
    geoType: null,
    geoId: null
  },
  businesses: [],                    // Cached list for filtering
  currentBusiness: null,             // Detail data for selected business
  loading: false,                    // Loading state
  error: null                        // Error state
}
```

**Encapsulated State** (Tab modules):
- Each tab module manages its own internal state (reviews data, quotes data, etc.)
- State updates via API calls + local UI state
- Tab modules expose `render(business)` function only

### 3.2 Event Flow

```
User clicks business in list
  ↓
business-list.onSelectBusiness(bizId)
  ↓
business-hub-view.handleSelectBusiness(bizId)
  ↓
  1. Load business data: GET /business-listings/:id
  2. Set selectedBusinessId = bizId
  3. Reset activeTab = "profile"
  4. Render business-detail
  5. Render profile-tab with data
  ↓
User clicks tab (e.g., "Reviews")
  ↓
business-detail.activateTab("reviews")
  ↓
  1. Hide current tab panel
  2. Show reviews tab panel
  3. If first time: Call reviews-tab.render(business)
     - GET /business-listings/:id/reviews
     - Render review list
  ↓
User submits review response
  ↓
reviews-tab.submitResponse(reviewId, response)
  ↓
  POST /business-listings/:id/reviews/:reviewId/draft-response
  ↓
  showToast("Response submitted")
  ↓
  Re-render reviews list
```

### 3.3 Modal Integration

**Review Response Modal**:
- Opened from reviews-tab
- Returns to reviews-tab on close
- Focus management via app.js openModal/closeModal

**Quote Request Modal**:
- Opened from quotes-tab
- Submits to POST /business-listings/:id/quotes
- Returns to quotes-tab on success

---

## 4. Route Integration & Navigation

### 4.1 URL Patterns

```
#/business-hub                → List only (no detail)
                              → Render business-list
                              → business-detail hidden
                              → meetingsView hidden

#/business-hub/:id            → List + Detail
                              → Render business-list (highlighted)
                              → Render business-detail with active tab
                              → Tab state in coordinator (not URL)
```

### 4.2 Route Handler Implementation

```javascript
// app.js route registration (current: placeholder)
registerRoute("/business-hub", (params, context) => {
  if (!getCurrentRole()) {
    navigate("/login");
    return;
  }
  businessHubHandler(params, context);
});

// Route handler (to create)
async function businessHubHandler(params) {
  // Delegate to business-hub-view
  await businessHubView.init(params, {
    container: document.getElementById("businessHubView"),
    onNavigate: navigate
  });
}
```

### 4.3 Back Button Behavior

**Desktop**: List stays visible, clicking business in list loads detail in right pane
**Mobile**: Toggle between list and detail views via button

**URL Back Button**:
- From #/business-hub/:id → #/business-hub
- Clear selectedBusinessId
- business-detail collapses/hides
- business-list stays visible

---

## 5. Tab-Specific Designs

### 5.1 Profile Tab

**Content**:
- Business name (heading)
- Category pill
- Description (truncated, expandable)
- Contact information:
  - Phone (clickable: `tel:` link)
  - Email (clickable: `mailto:` link)
  - Website (link)
  - Address (with copy button)
- Operating hours (if available)
- Social media links (if available)

**Interactions**:
- Click phone → Open phone app
- Click email → Open email client
- Click website → Open in new tab
- Copy address → Tooltip "Copied!"

**API Integration**:
- Data from GET /business-listings/:id response
- All fields optional (render only if present)

**Estimated Lines**: 120-150

### 5.2 Geographic Tab

**Content**:
- Full address with copy button
- Service area (from geo_scope_type + geo_scope_id)
  - "City of Boston"
  - "ZIP 02101"
  - "Town of Winchester"
- Distance from chamber (if geo data available)
- Service area heat map (future: placeholder text for now)
- Related businesses in same geo (future: placeholder)

**Interactions**:
- Copy address
- Click service area → Filter list by geo (coordinate with business-list)
- Hover map → Show service boundaries

**API Integration**:
- Primary: GET /business-listings/:id
- Secondary: GET /ai-search/local-intelligence?scopeType=X&scopeId=Y
- Load geo context briefs if ai_search_enabled=true

**Estimated Lines**: 100-130

### 5.3 Reviews Tab

**Content**:
- Review count badge (top)
- Average rating (stars, text, count)
- Filter by platform (if multiple: Google, Yelp, etc.)
- Review list cards (newest first):
  - Platform badge
  - Rating (stars)
  - Reviewer name
  - Review date
  - Review text (truncated, expandable)
  - Response status badge
  - Response text (if exists, truncated)
  - "Draft Response" button (if no response yet)
  - "Edit Response" button (if response exists)

**Interactions**:
- Click "Draft Response" → Open modal
- Modal: Auto-filled with AI suggestion (from API)
- Modal: Submit → POST /business-listings/:id/reviews/:reviewId/draft-response
- Modal: Cancel → Close
- Re-render list on save

**Modals Required**:
- Review Response Draft Modal (from index.html existing)
- Reuse existing modal, populate from API

**API Integration**:
- GET /business-listings/:id/reviews
- POST /business-listings/:id/reviews/:reviewId/draft-response
- Returns: suggested_response field

**Estimated Lines**: 150-200

### 5.4 Quotes Tab

**Content**:
- Quote request form (always visible at top):
  - Title (required)
  - Description (optional)
  - Service class dropdown (default: "quick_win_automation")
  - Contact name (required)
  - Contact email (required)
  - Submit button
  - Clear button

- Quote list (below form):
  - Quote card per quote:
    - Title
    - Service class pill
    - Contact info (name, email)
    - Total USD amount
    - Status badge (draft, sent, accepted)
    - Created date
    - "Send Quote" button (if draft)
    - "Edit" button

**Interactions**:
- Fill form → Submit → POST /business-listings/:id/quotes
- Response: Toast "Quote created"
- Re-render list with new quote
- Click "Send Quote" → Changes status to "sent"
- Click "Edit" → Pre-fill form + Submit edits quote

**API Integration**:
- GET /business-listings/:id/quotes
- POST /business-listings/:id/quotes
- PUT /business-listings/:id/quotes/:quoteId

**Estimated Lines**: 150-200

### 5.5 AI Search Tab

**Content**:
- AI-search status indicator:
  - "Enabled" / "Not enabled" badge
- If enabled:
  - Show related meetings list
  - "Query AI" button → Opens Kiosk widget (if available)
  - Links to relevant chamber meetings/events
- If not enabled:
  - Explanation text
  - "Enable AI Search" button (admin only)

**Interactions**:
- Click "Enable AI Search" → PUT /business-listings/:id with ai_search_enabled=true
- Click "Query AI" → Launch kiosk widget with business context
- Filter related meetings by date

**API Integration**:
- GET /ai-search/business-profiles
- GET /ai-search/local-intelligence
- PUT /business-listings/:id (enable toggle)

**Estimated Lines**: 100-150

---

## 6. API Integration Points (Detailed)

### 6.1 Business List Loading

**Module**: `business-list.js`

```javascript
async function loadBusinesses(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category) params.append("category", filters.category);
    if (filters.geoType) params.append("geo_scope_type", filters.geoType);
    if (filters.geoId) params.append("geo_scope_id", filters.geoId);

    const response = await request("GET", `/business-listings?${params.toString()}`);
    return response; // Array of business objects
  } catch (error) {
    showToast(`Error loading businesses: ${error.message}`, "error");
    return [];
  }
}
```

**Response Structure**:
```json
[
  {
    "id": "biz_abc123",
    "name": "Local Coffee Roasters",
    "category": "Food & Beverage",
    "address": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zip_code": "02101",
    "phone": "617-555-0123",
    "email": "owner@coffee.local",
    "website": "https://coffee.local",
    "description": "Premium artisan coffee",
    "tags": ["coffee", "cafe", "local"],
    "geo_scope_type": "city",
    "geo_scope_id": "boston",
    "ai_search_enabled": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

### 6.2 Business Detail Loading

**Module**: `business-detail.js`

```javascript
async function loadBusiness(bizId) {
  try {
    const response = await request("GET", `/business-listings/${bizId}`);
    return response; // Single business object
  } catch (error) {
    showToast(`Error loading business: ${error.message}`, "error");
    return null;
  }
}
```

### 6.3 Reviews Tab API

**Module**: `reviews-tab.js`

```javascript
// Load reviews
async function loadReviews(bizId) {
  const response = await request("GET", `/business-listings/${bizId}/reviews`);
  return response; // Array of review objects
}

// Submit draft response
async function submitResponse(bizId, reviewId, response) {
  const result = await request(
    "POST",
    `/business-listings/${bizId}/reviews/${reviewId}/draft-response`,
    { response_text: response }
  );
  return result;
}

// Update review (change response status)
async function updateReview(bizId, reviewId, updates) {
  const result = await request(
    "PUT",
    `/business-listings/${bizId}/reviews/${reviewId}`,
    updates
  );
  return result;
}
```

**Review Object Structure**:
```json
{
  "id": "review_xyz",
  "business_id": "biz_abc123",
  "platform": "google",
  "rating": 5,
  "reviewer_name": "Jane Doe",
  "review_text": "Great service!",
  "review_date": "2024-01-10T15:30:00Z",
  "response_draft": "Thank you Jane! We appreciate...",
  "response_text": null,
  "response_status": "draft",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### 6.4 Quotes Tab API

**Module**: `quotes-tab.js`

```javascript
// Load quotes
async function loadQuotes(bizId) {
  const response = await request("GET", `/business-listings/${bizId}/quotes`);
  return response; // Array of quote objects
}

// Create quote
async function createQuote(bizId, quoteData) {
  const result = await request(
    "POST",
    `/business-listings/${bizId}/quotes`,
    {
      title: quoteData.title,
      description: quoteData.description,
      service_class: quoteData.serviceClass,
      services: quoteData.services || [],
      total_usd: parseFloat(quoteData.total),
      contact_name: quoteData.contactName,
      contact_email: quoteData.contactEmail
    }
  );
  return result;
}

// Update quote (e.g., change status to "sent")
async function updateQuote(bizId, quoteId, updates) {
  const result = await request(
    "PUT",
    `/business-listings/${bizId}/quotes/${quoteId}`,
    updates
  );
  return result;
}
```

**Quote Object Structure**:
```json
{
  "id": "quote_abc123",
  "business_id": "biz_abc123",
  "title": "Website Redesign",
  "description": "Complete redesign and CMS setup",
  "service_class": "quick_win_automation",
  "services": ["design", "development", "deployment"],
  "total_usd": 5000.00,
  "contact_name": "Bob Smith",
  "contact_email": "bob@coffee.local",
  "status": "draft",
  "created_at": "2024-01-15T10:00:00Z",
  "sent_at": null
}
```

### 6.5 AI Search Tab API

**Module**: `ai-search-tab.js`

```javascript
// Get business AI search status + related data
async function loadAISearchContext(bizId) {
  // Main business object has ai_search_enabled flag
  // Load local intelligence if enabled
  if (business.ai_search_enabled) {
    const briefs = await request(
      "GET",
      `/ai-search/local-intelligence?scopeType=${business.geo_scope_type}&scopeId=${business.geo_scope_id}`
    );
    return briefs; // Array of geo content briefs
  }
  return [];
}

// Toggle AI search enabled
async function toggleAISearch(bizId, enabled) {
  const result = await request(
    "PUT",
    `/business-listings/${bizId}`,
    { ai_search_enabled: enabled }
  );
  return result;
}
```

---

## 7. CSS Architecture (Phase 4 Continuity)

### 7.1 CSS Organization

**Existing Classes** (preserve as-is):
- `.business-card`, `.business-card:hover`, `.business-card.active`
- `.biz-category-pill`
- `.biz-score-row`, `.biz-score-block`, `.biz-score-value`, `.biz-score-label`
- `.biz-use-cases`, `.biz-use-case`
- `.review-card`, `.review-rating`, `.review-response-draft`
- `.quote-card` (partial)

**New Classes** (add to styles.css):

```css
/* Business Hub Layout */
.business-hub-container {
  display: grid;
  grid-template-columns: 30% 1fr;
  gap: 16px;
  height: 100%;
  padding: 16px;
}

.business-hub-list-pane {
  overflow-y: auto;
  border-right: 1px solid #e6dbcd;
  padding-right: 16px;
}

.business-hub-detail-pane {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Business Detail Header */
.business-detail-header {
  background: var(--panel);
  border: 1px solid #e6dbcd;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.business-detail-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.business-detail-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: var(--muted);
}

/* Tab Bar for Business Detail */
.business-tab-bar {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e6dbcd;
  padding-bottom: 12px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.business-tab {
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  color: var(--muted);
  transition: all 0.2s ease;
}

.business-tab:hover {
  color: var(--text);
  background: #f5f5f5;
}

.business-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* Tab Panels */
.business-tab-panel {
  display: none;
}

.business-tab-panel.active {
  display: block;
}

/* Profile Tab Specific */
.profile-tab-content {
  display: grid;
  gap: 16px;
}

.contact-info-group {
  display: grid;
  gap: 8px;
}

.contact-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.contact-info-label {
  color: var(--muted);
  min-width: 80px;
  font-weight: 600;
}

.contact-info-value {
  flex: 1;
  word-break: break-word;
}

.contact-link {
  color: var(--accent);
  text-decoration: none;
  cursor: pointer;
}

.contact-link:hover {
  text-decoration: underline;
}

.hours-section {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}

/* Geographic Tab Specific */
.geographic-content {
  display: grid;
  gap: 16px;
}

.service-area-badge {
  display: inline-block;
  background: #e4f0ed;
  color: #0f4f46;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

/* Reviews Tab Specific */
.reviews-container {
  display: grid;
  gap: 16px;
}

.review-stats {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 12px;
  background: #fbf6ee;
  border-radius: 12px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-stars {
  font-size: 18px;
}

.review-platform-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 8px 0;
}

.review-platform-badge {
  padding: 4px 8px;
  background: #e4f0ed;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.review-platform-badge.active {
  background: var(--accent);
  color: white;
}

/* Quotes Tab Specific */
.quotes-container {
  display: grid;
  gap: 16px;
}

.quote-form {
  background: var(--panel);
  border: 1px solid #e6dbcd;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.quote-list {
  display: grid;
  gap: 12px;
}

/* Responsive Design */
@media (max-width: 900px) {
  .business-hub-container {
    grid-template-columns: 1fr;
  }

  .business-hub-list-pane {
    border-right: none;
    border-bottom: 1px solid #e6dbcd;
    padding-right: 0;
    padding-bottom: 16px;
    max-height: 40vh;
  }

  .business-hub-detail-pane {
    max-height: 50vh;
  }
}

@media (max-width: 600px) {
  .business-hub-container {
    padding: 8px;
    gap: 8px;
  }

  .business-detail-header {
    padding: 12px;
  }

  .business-tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .contact-info-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-stats {
    flex-direction: column;
    gap: 12px;
  }
}
```

### 7.2 Existing Color Scheme (Maintain)

- Accent: `var(--accent)` (teal)
- Panel background: `var(--panel)`
- Text: `var(--text)`
- Muted text: `var(--muted)`
- Light background: `#fbf6ee` (warm)
- Highlight: `#e4f0ed` (light green)
- Border: `#e6dbcd` (warm gray)

---

## 8. Modal Interactions (Detailed)

### 8.1 Review Response Draft Modal

**Trigger**: User clicks "Draft Response" in reviews-tab

**Modal HTML** (already exists in index.html, will be repurposed):
- Use existing `quickModal` or create `reviewResponseModal`

**Workflow**:
1. reviews-tab.js opens modal: `openModal(reviewResponseModal)`
2. Populate modal with:
   - Review text (read-only display)
   - AI-suggested response (pre-filled textarea)
   - Submit button: "Save Response"
   - Cancel button
3. User edits suggestion → Click "Save Response"
4. reviews-tab.js calls: `submitResponse(bizId, reviewId, responseText)`
5. API: `POST /business-listings/:id/reviews/:reviewId/draft-response`
6. Response: Toast "Response saved"
7. Close modal, re-render reviews list

**Focus Management**:
- Initial focus: textarea with suggestion
- Escape key: Close modal (closeOnEscape: true)
- Return focus: "Draft Response" button

### 8.2 Quote Request Modal

**Trigger**: User submits quotes-tab form OR clicks "Edit" on existing quote

**Modal HTML** (already exists in index.html as `bizModal`):
- Reuse existing modal with hidden inputs
- Clear/re-populate form based on context

**Workflow**:
1. quotes-tab.js populates form with default values
2. User fills form: title, description, service class, contact, amount
3. Click "Create Quote" (or "Update Quote")
4. quotes-tab.js calls: `createQuote(bizId, formData)`
5. API: `POST /business-listings/:id/quotes`
6. Response: Toast "Quote created"
7. Close modal, reload quotes list

**Focus Management**:
- Initial focus: Title input
- Escape key: Close modal (closeOnEscape: true)
- Return focus: "Create Quote" button

### 8.3 Modal Configuration in app.js

```javascript
// Add to modalBehavior Map
const modalBehavior = new Map([
  // ... existing
  [reviewResponseModal, {
    initialFocus: reviewResponseModal.querySelector("textarea"),
    closeOnEscape: true,
    closeOnBackdrop: true
  }],
  [bizModal, {
    initialFocus: bizModal.querySelector("#bizModalName"),
    closeOnEscape: true,
    closeOnBackdrop: true
  }]
]);
```

---

## 9. Event Handling Strategy (State Machine)

### 9.1 List Selection Event Flow

```
HTML: <div class="business-card" data-id="biz_123">

business-list.js
  ├─ Attach click listener to each .business-card
  └─ card.addEventListener("click", () => {
       const bizId = card.dataset.id;
       dispatchEvent(new CustomEvent("business-selected", {
         detail: { businessId: bizId }
       }));
     });

business-hub-view.js
  ├─ Listen for "business-selected" event
  └─ On event:
     1. handleSelectBusiness(bizId)
     2. Load GET /business-listings/:id
     3. Update state: selectedBusinessId = bizId
     4. Update state: activeTab = "profile"
     5. Render business-detail
     6. Render profile-tab
     7. Update list: mark card as .active
```

### 9.2 Tab Switch Event Flow

```
HTML: <button class="business-tab" data-tab="reviews">Reviews</button>

business-detail.js
  ├─ Attach click listener to each .business-tab
  └─ tab.addEventListener("click", () => {
       const tabKey = tab.dataset.tab;
       activateTab(tabKey);
     });

activateTab(tabKey):
  1. Mark all tabs: aria-selected=false, tabindex=-1
  2. Mark active tab: aria-selected=true, tabindex=0
  3. Hide all panels: class="hidden"
  4. Show active panel: class="active" (remove hidden)
  5. If first time loading this tab:
     - Call tabModule.render(currentBusiness)
     - Example: reviews-tab.render() calls GET /business-listings/:id/reviews
  6. Set focus to first input in panel
```

### 9.3 Filter/Search Event Flow

```
HTML: <input id="meetingSearch" type="text" placeholder="Search businesses..."/>

business-list.js
  ├─ Attach input listener
  └─ input.addEventListener("input", (e) => {
       const searchText = e.target.value;
       dispatchEvent(new CustomEvent("filter-changed", {
         detail: { search: searchText }
       }));
     });

business-hub-view.js
  ├─ Listen for "filter-changed" event
  └─ On event:
     1. Update state: listFilter.search = searchText
     2. Call business-list.filterBusinesses(filter)
     3. business-list re-renders filtered results
     4. If business was selected, verify it still matches filter
     5. If not, clear selection
```

### 9.4 Contact Actions (Inline)

```
HTML: <a class="contact-link" href="tel:617-555-0123">617-555-0123</a>
      <a class="contact-link" href="mailto:owner@coffee.local">owner@coffee.local</a>
      <a class="contact-link" href="https://coffee.local" target="_blank">Visit Website</a>

profile-tab.js
  ├─ Render contact info as inline links
  ├─ Phone: href="tel:..." (native mobile behavior)
  ├─ Email: href="mailto:..." (native email behavior)
  └─ Website: href="https://..." target="_blank" (new tab)

No additional JS needed - browser handles these
```

### 9.5 Copy Button (Address)

```
HTML: <div class="address-container">
        <span class="address-text">123 Main St, Boston MA 02101</span>
        <button class="copy-btn" aria-label="Copy address">📋</button>
      </div>

profile-tab.js
  ├─ Attach click listener to .copy-btn
  └─ copyBtn.addEventListener("click", () => {
       const text = document.querySelector(".address-text").textContent;
       navigator.clipboard.writeText(text).then(() => {
         showToast("Address copied!");
         copyBtn.textContent = "✓";
         setTimeout(() => { copyBtn.textContent = "📋"; }, 2000);
       });
     });
```

---

## 10. E2E Test Compatibility

### 10.1 Preserved Test IDs

**Existing (must not break)**:
- `#bizModalName` - Text input for business name
- `#bizModalSubmit` - Submit button
- `#bizModalCancel` - Cancel button
- All 10 input fields with testid attributes

**New Test IDs** (add to modules):
```javascript
// business-list.js
- [data-testid="business-list"] - Container
- [data-testid="business-card"] - Each card
- [data-testid="business-card-{id}"] - Specific business
- [data-testid="business-search"] - Search input
- [data-testid="business-filter-category"] - Category filter
- [data-testid="business-filter-clear"] - Clear filters button

// business-detail.js
- [data-testid="business-detail"] - Container
- [data-testid="business-detail-header"] - Header section
- [data-testid="business-detail-title"] - Business name
- [data-testid="business-detail-rating"] - Rating display
- [data-testid="business-tab-bar"] - Tab bar container
- [data-testid="business-tab"] - Each tab button
- [data-testid="business-tab-{key}"] - Specific tab

// profile-tab.js
- [data-testid="profile-tab-content"] - Container
- [data-testid="profile-phone"] - Phone link
- [data-testid="profile-email"] - Email link
- [data-testid="profile-website"] - Website link
- [data-testid="profile-address-copy"] - Copy address button

// reviews-tab.js
- [data-testid="reviews-tab-content"] - Container
- [data-testid="review-card"] - Each review
- [data-testid="review-draft-response-btn"] - Draft response button
- [data-testid="review-response-modal"] - Response modal
- [data-testid="review-response-textarea"] - Response text input
- [data-testid="review-response-submit"] - Submit response button

// quotes-tab.js
- [data-testid="quotes-tab-content"] - Container
- [data-testid="quote-form"] - Quote form
- [data-testid="quote-form-title"] - Title input
- [data-testid="quote-form-submit"] - Submit button
- [data-testid="quote-card"] - Each quote
- [data-testid="quote-send-btn"] - Send quote button
```

### 10.2 E2E Test Scenarios

**Scenario 1: List & Select**
```javascript
test("Select business from list loads detail", async () => {
  await page.goto("#/business-hub");
  const card = await page.$("[data-testid='business-card-biz_001']");
  await card.click();

  await expect(page.$("[data-testid='business-detail']")).toBeTruthy();
  const title = await page.$("[data-testid='business-detail-title']");
  const text = await title.textContent();
  expect(text).toContain("Local Coffee");
});
```

**Scenario 2: Tab Navigation**
```javascript
test("Clicking tab shows correct content", async () => {
  // ... select business first
  const reviewsTab = await page.$("[data-testid='business-tab-reviews']");
  await reviewsTab.click();

  const reviewsContent = await page.$("[data-testid='reviews-tab-content']");
  expect(await reviewsContent.isVisible()).toBe(true);
});
```

**Scenario 3: Form Submission**
```javascript
test("Create quote submits and appears in list", async () => {
  // ... navigate to quotes tab
  const titleInput = await page.$("[data-testid='quote-form-title']");
  await titleInput.fill("Website Redesign");
  // ... fill other fields

  const submitBtn = await page.$("[data-testid='quote-form-submit']");
  await submitBtn.click();

  await expect(page.$("[data-testid='quote-card']")).toBeTruthy();
});
```

### 10.3 Modal Test IDs

```javascript
// reviewResponseModal (if created separately)
- [data-testid="review-response-modal"]
- [data-testid="review-response-textarea"]
- [data-testid="review-response-submit"]
- [data-testid="review-response-cancel"]

// bizModal (existing, preserved)
- #bizModalName
- #bizModalCategory
- #bizModalAddress
- #bizModalCity
- #bizModalState
- #bizModalZip
- #bizModalPhone
- #bizModalEmail
- #bizModalGeoType
- #bizModalGeoId
- #bizModalSubmit
- #bizModalCancel
```

---

## 11. Responsive Design (Phase 4 Breakpoints)

### 11.1 Desktop (>900px)

**Layout**: 2-column grid (30% list, 70% detail)
```
┌─────────────────────────────────────────┐
│ List           │ Detail Header           │
│ Business Card  │ ┌────────────────────┐ │
│ Business Card  │ │ Name, Rating, Meta │ │
│ Business Card  │ └────────────────────┘ │
│ Business Card  │ Tab Bar (horizontal)   │
│ (scrollable)   │ ┌────────────────────┐ │
│                │ │ Tab Content        │ │
│                │ │ (Profile, Reviews, │ │
│                │ │  Quotes, etc.)     │ │
│                │ └────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key**: Full list always visible, detail on right

### 11.2 Tablet (600-900px)

**Layout**: Vertical stack (60% list, 40% detail)
```
┌──────────────────────────┐
│ List                     │ (60vh)
│ Business Card            │
│ Business Card            │
│ Business Card            │
│ (scrollable)             │
├──────────────────────────┤
│ Detail                   │ (40vh)
│ Name + Tab Bar           │
│ Tab Content (scrollable) │
└──────────────────────────┘
```

**Key**: List still visible at top, detail below, both scrollable

**CSS**:
```css
@media (max-width: 900px) {
  .business-hub-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .business-hub-list-pane {
    border-right: none;
    border-bottom: 1px solid #e6dbcd;
    max-height: 60vh;
    overflow-y: auto;
  }

  .business-hub-detail-pane {
    max-height: 40vh;
    overflow-y: auto;
  }
}
```

### 11.3 Mobile (<600px)

**Layout**: Single column, toggle between list and detail
```
┌──────────────────────────┐
│ Business Hub Header      │
│ [List] [Detail] buttons  │
├──────────────────────────┤
│ List View                │ (or Detail View)
│ Business Card            │
│ Business Card            │
│ Business Card            │
│ (full width, scrollable) │
└──────────────────────────┘
```

**Key**: Toggle button to switch between list and detail views

**Implementation**:
```javascript
// business-hub-view.js
function initMobileToggle() {
  if (window.innerWidth < 600) {
    renderMobileToggleButtons();

    listToggle.addEventListener("click", () => {
      listPane.style.display = "block";
      detailPane.style.display = "none";
    });

    detailToggle.addEventListener("click", () => {
      listPane.style.display = "none";
      detailPane.style.display = "block";
    });
  }
}
```

**CSS**:
```css
@media (max-width: 600px) {
  .business-hub-container {
    grid-template-columns: 1fr;
    padding: 8px;
  }

  .business-hub-list-pane,
  .business-hub-detail-pane {
    border: none;
    padding: 0;
  }

  .mobile-toggle-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .business-tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .contact-info-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

---

## 12. Consistency with Phase 5 Patterns

### 12.1 Module Structure Comparison

| Aspect | Phase 5 (Meetings) | Phase 6 (Business Hub) |
|--------|-------------------|----------------------|
| **Coordinator** | meetings-view.js | business-hub-view.js |
| **List Module** | meetings-list.js | business-list.js |
| **Detail Module** | meeting-detail.js | business-detail.js |
| **Tab Modules** | minutes-tab.js, actions-tab.js, etc. | profile-tab.js, reviews-tab.js, etc. |
| **State Pattern** | Coordinator manages selected + active tab | Coordinator manages selected + active tab |
| **Event Pattern** | CustomEvent for list selection | CustomEvent for list selection |
| **API Pattern** | request() from core/api.js | request() from core/api.js |
| **Toast Pattern** | showToast() for feedback | showToast() for feedback |
| **CSS Pattern** | BEM-style class naming | BEM-style class naming |

### 12.2 Code Pattern: List Selection

**Phase 5 (Meetings)**:
```javascript
// meetings-list.js
card.addEventListener("click", () => {
  dispatchEvent(new CustomEvent("meeting-selected", {
    detail: { meetingId: card.dataset.id }
  }));
});

// meetings-view.js
document.addEventListener("meeting-selected", (e) => {
  handleSelectMeeting(e.detail.meetingId);
});
```

**Phase 6 (Business Hub)** - Same pattern:
```javascript
// business-list.js
card.addEventListener("click", () => {
  dispatchEvent(new CustomEvent("business-selected", {
    detail: { businessId: card.dataset.id }
  }));
});

// business-hub-view.js
document.addEventListener("business-selected", (e) => {
  handleSelectBusiness(e.detail.businessId);
});
```

### 12.3 Code Pattern: Tab Activation

**Phase 5 (Meetings)**:
```javascript
// meetings-detail.js
activateTab(tabKey) {
  const tabs = document.querySelectorAll(".tab[data-tab]");
  tabs.forEach(tab => {
    const isActive = tab.dataset.tab === tabKey;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });
}
```

**Phase 6 (Business Hub)** - Same pattern:
```javascript
// business-detail.js
activateTab(tabKey) {
  const tabs = document.querySelectorAll(".business-tab[data-tab]");
  tabs.forEach(tab => {
    const isActive = tab.dataset.tab === tabKey;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });
}
```

### 12.4 Data Flow Consistency

Both Phase 5 and Phase 6 follow same data flow:

```
Route Handler
  ↓
Coordinator (view) - State & orchestration
  ↓
List Module - Render + events
  ↓
Detail Module - Data loading + tab switching
  ↓
Tab Modules - Content specific rendering
  ↓
API (core/api.js) - Network calls
```

---

## 13. Implementation Sequencing

### Phase 6a: Foundation (Days 1-2)
1. Create directory: `views/business-hub/` and `views/business-hub/tabs/`
2. Create `business-list.js` stub (render, select event)
3. Create `business-hub-view.js` stub (coordinator, state)
4. Register HTML structure (business-hub-container divs)
5. Hook business-hub-view to app.js handler
6. Verify empty view renders without error

### Phase 6b: List Module (Days 3-4)
1. Implement `business-list.js` full:
   - loadBusinesses() API call
   - renderList() HTML generation
   - Event listeners for clicks + filters
2. Add CSS classes for list styling
3. Verify list loads and displays businesses
4. Add test IDs for E2E

### Phase 6c: Detail Header (Days 5-6)
1. Implement `business-detail-header.js`:
   - renderHeader() with name, rating, meta
2. Implement `business-hub-view.js` selection logic:
   - Load business on selection
   - Render detail header
3. Verify detail header displays on selection
4. Update CSS for header styling

### Phase 6d: Tab Infrastructure (Days 7-8)
1. Implement `business-detail.js` tab manager:
   - renderTabBar() HTML
   - activateTab() logic
   - loadTabContent() delegator
2. Implement `profile-tab.js` (baseline, easiest tab)
   - Contact info, hours, description
3. Wire up first tab activation
4. Verify tabs work, no content loading errors

### Phase 6e: Tab Modules (Days 9-12)
1. Implement `geographic-tab.js`
2. Implement `reviews-tab.js` (with modal)
3. Implement `quotes-tab.js` (with form)
4. Implement `ai-search-tab.js`
5. Test each tab individually

### Phase 6f: Integration & Polish (Days 13-14)
1. Ensure all modules wire together
2. Add responsive CSS
3. Test E2E scenarios
4. Fix any bugs
5. Performance optimization

---

## 14. File Size & Code Impact

### 14.1 Current Monolithic

Assuming current business hub code is ~400-500 lines in app.js + inline styles:
- app.js: ~50 lines (businessHubHandler + HTML refs)
- styles.css: ~150 lines (business-related styles)
- HTML: ~60 lines (structure)
- **Total: 260 lines**

### 14.2 Target Modular

| File | Est. Lines | Role |
|------|-----------|------|
| business-hub-view.js | 80 | Coordinator |
| business-list.js | 180 | List rendering |
| business-detail.js | 120 | Detail + tabs |
| business-detail-header.js | 90 | Header display |
| profile-tab.js | 140 | Profile content |
| geographic-tab.js | 115 | Geographic content |
| reviews-tab.js | 190 | Reviews + modal |
| quotes-tab.js | 190 | Quotes + form |
| ai-search-tab.js | 130 | AI search |
| **Subtotal** | **1135** | **View code** |
| app.js changes | +20 | Handler registration |
| styles.css additions | +180 | Responsive CSS |
| index.html changes | +30 | Container divs |
| **Grand Total** | **1365** | **Complete feature** |

**Net Increase**: ~1100 lines (necessary for modularity)
**Benefit**: Each module <250 lines, testable, maintainable

### 14.3 Import Chain

```javascript
// app.js
import { businessHubHandler } from "./views/business-hub/business-hub-view.js";

// business-hub-view.js
import { loadBusinessList } from "./business-list.js";
import { loadBusinessDetail, renderDetailPane } from "./business-detail.js";
import { showToast } from "../core/toast.js";
import { request } from "../core/api.js";
import { navigate } from "../core/router.js";

// business-detail.js
import { renderProfileTab } from "./tabs/profile-tab.js";
import { renderReviewsTab } from "./tabs/reviews-tab.js";
import { renderQuotesTab } from "./tabs/quotes-tab.js";
import { renderGeographicTab } from "./tabs/geographic-tab.js";
import { renderAISearchTab } from "./tabs/ai-search-tab.js";

// Each tab module
import { request } from "../../core/api.js";
import { showToast } from "../../core/toast.js";
// etc.
```

---

## 15. Integration Checklist

### Files to Create
- [ ] `views/business-hub/business-hub-view.js`
- [ ] `views/business-hub/business-list.js`
- [ ] `views/business-hub/business-detail.js`
- [ ] `views/business-hub/business-detail-header.js`
- [ ] `views/business-hub/tabs/profile-tab.js`
- [ ] `views/business-hub/tabs/geographic-tab.js`
- [ ] `views/business-hub/tabs/reviews-tab.js`
- [ ] `views/business-hub/tabs/quotes-tab.js`
- [ ] `views/business-hub/tabs/ai-search-tab.js`

### Files to Modify
- [ ] `app.js` - Import business-hub-view, update businessHubHandler
- [ ] `index.html` - Add business-hub-container divs, rename business-hub view ID to have inner panes
- [ ] `styles.css` - Add responsive grid, tab styles, form styles (~180 lines)

### Import Statements Needed
```javascript
// app.js additions
import { businessHubHandler } from "./views/business-hub/business-hub-view.js";

// business-hub-view.js
import { createBusinessList } from "./business-list.js";
import { createBusinessDetail } from "./business-detail.js";
import { request } from "../core/api.js";
import { showToast } from "../core/toast.js";

// Each tab
import { request } from "../../core/api.js";
import { showToast } from "../../core/toast.js";
```

### Event Listeners Needed
- List card clicks → "business-selected" event
- Tab clicks → "tab-activated" event
- Filter input → "filter-changed" event
- Form submissions → validate + API call
- Modal opens → focus management
- Modal closes → re-render + focus restore

### API Call Integration
- GET /business-listings → Coordinator + List
- GET /business-listings/:id → Coordinator + Detail
- GET /business-listings/:id/reviews → Reviews tab
- POST /business-listings/:id/reviews/:reviewId/draft-response → Reviews modal
- GET /business-listings/:id/quotes → Quotes tab
- POST /business-listings/:id/quotes → Quotes form
- PUT /business-listings/:id/quotes/:quoteId → Quotes form
- GET /ai-search/local-intelligence → AI tab

### Modal Integration Points
- Review Response Modal: Opened from reviews-tab.js, uses app.js openModal/closeModal
- Quote Request Form: Opened from quotes-tab.js (or inline form), uses app.js modal

### CSS Classes to Define
- `.business-hub-container`
- `.business-hub-list-pane`
- `.business-hub-detail-pane`
- `.business-detail-header`
- `.business-tab-bar`
- `.business-tab`
- `.business-tab.active`
- `.business-tab-panel`
- `.business-tab-panel.active`
- `.profile-tab-content`
- `.contact-info-group`
- `.reviews-container`
- `.quote-form`
- `.quote-list`
- And responsive variants for <900px and <600px

---

## 16. Success Criteria (Acceptance)

### Functional
- [ ] All 5 tabs load correct content
- [ ] List filters work (search, category, geo)
- [ ] Selecting business loads detail
- [ ] Tab switching changes view
- [ ] Review response modal works
- [ ] Quote form submits
- [ ] All API calls succeed
- [ ] Errors show toast notifications

### Code Quality
- [ ] Each module <250 lines
- [ ] No circular dependencies
- [ ] Clear single responsibility
- [ ] Consistent naming (Phase 5 pattern)
- [ ] Full JSDoc comments
- [ ] No console errors

### E2E Tests
- [ ] All existing test IDs preserved
- [ ] New test IDs documented
- [ ] Can select business from list
- [ ] Can switch tabs
- [ ] Can submit review response
- [ ] Can create quote
- [ ] Responsive tests pass

### Responsive Design
- [ ] Desktop (>900px): 2-column layout works
- [ ] Tablet (600-900px): Stack layout works
- [ ] Mobile (<600px): Toggle layout works
- [ ] No overflow issues
- [ ] Touch-friendly on mobile

### Performance
- [ ] List loads <2s (cached)
- [ ] Detail loads <1s
- [ ] Tab switch <500ms
- [ ] No memory leaks
- [ ] Smooth animations

---

## 17. Comparison: Business Hub vs Meetings View

| Feature | Meetings (Phase 5) | Business Hub (Phase 6) |
|---------|------------------|----------------------|
| **List Type** | Meeting cards with date/location | Business cards with category |
| **Detail Interaction** | Click meeting → Load minutes view | Click business → Load detail pane |
| **Tabs** | Minutes, Actions, Audit, Motions | Profile, Geographic, Reviews, Quotes, AI |
| **Primary Action** | Create motion, edit minutes | Request quote, draft review response |
| **Modals** | Motion approval, quick create | Review response, quote form |
| **Search/Filter** | By date range, tags, search | By category, geo scope, search |
| **Data Hierarchy** | Meeting → Motions/Minutes/Actions | Business → Reviews/Quotes |
| **Real-time Updates** | Minutes collaborative editing | Review additions, quote status |
| **Mobile Experience** | Stack list above detail | Toggle between list/detail |

### 17.1 Reusable Patterns (Both Use)

1. **List Selection Event**: business-selected vs meeting-selected
2. **Tab Navigation**: Same activateTab() pattern
3. **Coordinator Pattern**: View manages state + orchestrates
4. **Modal Integration**: openModal/closeModal from app.js
5. **API Integration**: request() from core/api.js
6. **Toast Feedback**: showToast() for user feedback
7. **Responsive Breakpoints**: Same 900px/600px thresholds
8. **CSS BEM Naming**: business-tab vs meeting-tab

### 17.2 Key Differences

1. **Meetings**: Date-based sorting, time-based filtering
   **Business**: Geo-based organization, category filtering

2. **Meetings**: Heavy collaborative editing (real-time)
   **Business**: Workflow-based (review responses, quotes)

3. **Meetings**: Primary action is detailed minutes editing
   **Business**: Primary action is contact/quote/review response

4. **Meetings**: Detail often full-screen
   **Business**: Detail often side-by-side with list

---

## 18. Next Steps After Phase 6

Phase 6 establishes modularization for business hub, enabling:
- **Phase 7**: Settings view modularization (same pattern)
- **Phase 8**: Billing/Admin view modularization
- **Phase 9+**: Additional features (event collaboration, CRM integration)

All follow the same:
1. Coordinator pattern
2. List + Detail modules
3. Tab sub-modules
4. Event-driven communication
5. API integration
6. Responsive design

---

## Appendix: Phase 6 Design Reference

### Example: Full Route Handler

```javascript
// app.js: Import and register
import { businessHubHandler } from "./views/business-hub/business-hub-view.js";

registerRoute("/business-hub", (params, context) => {
  if (!getCurrentRole()) {
    navigate("/login");
    return;
  }
  businessHubHandler(params, context);
});

// views/business-hub/business-hub-view.js: Handler implementation
export async function businessHubHandler(params, context) {
  const container = document.getElementById("businessHubView");
  const state = {
    selectedBusinessId: params.id || null,
    activeTab: "profile",
    listFilter: { search: "", category: null },
    businesses: [],
    currentBusiness: null,
    loading: false
  };

  // Initialize coordinator
  const coordinator = {
    state,
    async init() {
      this.container = container;
      this.container.classList.remove("hidden");
      this.renderLayout();
      this.initializeList();
      if (params.id) {
        await this.selectBusiness(params.id);
      }
    },
    renderLayout() {
      this.container.innerHTML = `
        <div class="business-hub-container">
          <section class="business-hub-list-pane" id="listPane"></section>
          <section class="business-hub-detail-pane hidden" id="detailPane"></section>
        </div>
      `;
    },
    async initializeList() {
      const listModule = await createBusinessList({
        container: this.container.querySelector("#listPane"),
        onSelect: (bizId) => this.selectBusiness(bizId)
      });
      this.listModule = listModule;
    },
    async selectBusiness(bizId) {
      this.state.selectedBusinessId = bizId;
      const business = await request("GET", `/business-listings/${bizId}`);
      this.state.currentBusiness = business;

      const detailPane = this.container.querySelector("#detailPane");
      detailPane.classList.remove("hidden");

      const detailModule = await createBusinessDetail({
        container: detailPane,
        business: business,
        onTabChange: (tab) => this.state.activeTab = tab
      });
      this.detailModule = detailModule;
    }
  };

  await coordinator.init();
}
```

---

**Design Specification Complete**

This specification provides implementation agents with:
- Clear module responsibilities
- Exact HTML structure
- API integration points
- CSS architecture
- E2E test strategy
- Responsive design breakpoints
- Event handling patterns
- Phase 5 consistency reference
- Success criteria
- Implementation sequencing

**Ready for parallel implementation by multiple agents.**
