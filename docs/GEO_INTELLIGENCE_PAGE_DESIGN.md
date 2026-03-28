# Geo Intelligence Page - Design Specification

## Executive Summary

Geo Intelligence is being extracted from a buried tab in Business Hub and promoted to a **dedicated full-page feature** with its own route and dedicated UI patterns. This elevation recognizes geographic analysis as a first-class capability for chamber executives and secretaries to visualize member locations, analyze service areas, and make data-driven decisions about geographic coverage.

**Route:** `#/geo-intelligence`
**Sub-route:** `#/geo-intelligence/:id` (for specific business location analysis)
**Status:** NEW - Not previously a standalone page
**Target Timeline:** 3-4 days (MVP phase)

---

## 1. Product Definition

### What is Geo Intelligence?

Geo Intelligence is a **geospatial analysis and location visualization tool** that enables chamber executives to:

- **Visualize** business member locations on an interactive map
- **Analyze** geographic coverage and distribution patterns
- **Search** by location (zip code, city, county, region)
- **Filter** by business type, service area, member status
- **Gain insights** into business density, coverage gaps, and expansion opportunities

It answers critical chamber business questions:

- "Where are our members concentrated?"
- "What geographic areas are underrepresented?"
- "Which businesses serve which regions?"
- "Are we achieving statewide coverage or just local?"
- "What's the density of specific service types in different regions?"

### Use Cases

#### Chamber Executive Perspective
1. **Coverage Analysis:** Understand current member distribution across service territory
2. **Gap Identification:** Identify geographic areas with low member density
3. **Expansion Planning:** Data-driven decisions on where to recruit new members
4. **Territory Assignment:** Assign service areas to sub-chambers or regional chapters
5. **Meeting Planning:** Understand attendee locations for optimal meeting sites

#### Member Management
1. **Networking:** See local business opportunities in specific geographic areas
2. **Partnership Discovery:** Identify service providers in their region
3. **Collaboration:** Connect with businesses in adjacent territories

#### Board Reporting
1. **Quarterly Reports:** Geographic coverage metrics for board meetings
2. **Trend Analysis:** Changes in coverage over time
3. **Strategic Metrics:** Visualize success of geographic expansion initiatives

### Why Standalone Page?

The current tab-based geographic view lacks prominence and discoverability:

| Aspect | Tab (Current) | Standalone Page |
|--------|---------------|-----------------|
| **Navigation** | Hidden in Business → Geographic tab | Direct sidebar link + business detail shortcuts |
| **Space** | Cramped (shares ~20% of detail pane) | Full-width (100% of view area) |
| **Capabilities** | Display location info only | Map + filters + list + analytics |
| **Usage Patterns** | "I opened business detail, then geographic tab" | "I want to analyze all locations" |
| **Performance** | Loads with business detail | On-demand, optimized |
| **Mobile** | Squashed in tab bar | Full screen with mobile optimizations |

**Decision:** Extract to standalone page because:
1. Geographic analysis is a distinct workflow (not always tied to single business)
2. Map visualization needs full-width to be useful
3. Multi-location filtering requires advanced controls (not tab-friendly)
4. Analytics and comparisons need dedicated space
5. Mobile usage heavily favors full-screen maps

### Relationship to Business Hub

Geo Intelligence and Business Hub are **complementary, not competing:**

| Feature | Business Hub | Geo Intelligence |
|---------|--------------|------------------|
| **Primary Goal** | View single business details | Analyze many businesses geographically |
| **Typical Workflow** | "Tell me about ABC Corp" | "Show me all businesses in ZIP 04101" |
| **Key Action** | View profile, reviews, quotes | Search, filter, compare locations |
| **Navigation** | Business → Detail | Map → Click marker → Optionally view detail |
| **Exports** | Business card, quotes | Location reports, service area maps |

**Cross-navigation:**
- Business Hub Detail → "View on Map" button → Geo Intelligence (focused on that location)
- Geo Intelligence → Click marker → Show business card (in-map popup) or navigate to full detail
- Geo Intelligence → List item click → Navigate to Business Hub detail

### Business Value

#### Revenue Impact
- **New Member Recruitment:** Geographic gap analysis → targeted outreach → higher conversion
- **Member Retention:** Service area analysis → understanding member value by region
- **Premium Feature:** Geographic analytics available in Pro+ tiers (territory planning tools)

#### Strategic Impact
- **Data-Driven Planning:** Replace guessing with visual, interactive analysis
- **Board Confidence:** Presentation-ready geographic reports and dashboards
- **Scalability:** Foundation for sub-chamber/regional chapter management

#### Operational Impact
- **Faster Search:** "Show me all vendors in Portland" in seconds
- **Meeting Planning:** Choose venues based on member density heatmaps
- **Reporting:** Automated geographic coverage metrics for quarterly reports

---

## 2. Page Layout

### Desktop Layout (>900px)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Geographic Intelligence | [Filter Icon] [Export Icon] [Settings]   │
├──────────────────────────────────────────────────────────────────┬──┤
│ SIDEBAR (30-40%)         │ MAP VIEW (60-70%)                    │  │
│                          │                                       │  │
│ ┌──────────────────────┐ │  ┌─────────────────────────────────┐ │  │
│ │ SEARCH & FILTERS     │ │  │                                 │ │  │
│ ├──────────────────────┤ │  │   [Google Maps Embed]           │ │  │
│ │ Search: [_______]    │ │  │   - Business location markers   │ │  │
│ │ Location: [_______]  │ │  │   - Color-coded by industry    │ │  │
│ │ Industry: [dropdown] │ │  │   - Clustered markers          │ │  │
│ │ Service Area: [dd]   │ │  │   - Click marker → popup       │ │  │
│ │ Status: [dropdown]   │ │  │                                 │ │  │
│ │                      │ │  │  [Marker Details Popup]         │ │  │
│ ├──────────────────────┤ │  │  - Business name              │ │  │
│ │ ANALYTICS SUMMARY    │ │  │  - Rating, phone, website      │ │  │
│ │                      │ │  │  - [View Details] [Navigate]   │ │  │
│ │ Total Businesses: 47 │ │  │                                 │ │  │
│ │ Industries: 12       │ │  │  [Search/Navigate Box]          │ │  │
│ │ Coverage: 8 ZIP      │ │  │                                 │ │  │
│ │                      │ │  │                                 │ │  │
│ │ Top Industries:      │ │  │                                 │ │  │
│ │ • Retail (15)        │ │  │                                 │ │  │
│ │ • Services (12)      │ │  │                                 │ │  │
│ │ • Tech (8)           │ │  │                                 │ │  │
│ ├──────────────────────┤ │  └─────────────────────────────────┘ │  │
│ │ BUSINESS LIST        │ │                                       │  │
│ │ (scrollable)         │ │                                       │  │
│ │                      │ │                                       │  │
│ │ ☑ ABC Corp          │ │                                       │  │
│ │   Portland, OR       │ │                                       │  │
│ │   Retail • ⭐ 4.2    │ │                                       │  │
│ │                      │ │                                       │  │
│ │ ☐ XYZ Services      │ │                                       │  │
│ │   Westbrook, ME      │ │                                       │  │
│ │   Tech • ⭐ 4.8      │ │                                       │  │
│ │                      │ │                                       │  │
│ │ [↓ Show more (12)]   │ │                                       │  │
│ └──────────────────────┘ │                                       │  │
└──────────────────────────────────────────────────────────────────┴──┘
```

### Tablet Layout (600-900px)

```
┌──────────────────────────────────────────────────────┐
│ Geographic Intelligence | [Filter] [Export] [Settings]│
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │                                                 │ │
│  │         [Google Maps Embed - Full Width]       │ │
│  │         - Business location markers            │ │
│  │         - Click marker → popup                 │ │
│  │         - Tap [⋯] → sidebar drawer            │ │
│  │                                                 │ │
│  │                                                 │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ SIDEBAR (collapsed/drawer, swipe to open)       │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ Search: [_______]                               │ │
│ │ Location: [_______]                             │ │
│ │ Industry: [dropdown]                            │ │
│ │ Service Area: [dropdown]                        │ │
│ │                                                 │ │
│ │ ANALYTICS                                       │ │
│ │ • Total: 47  • Industries: 12  • Coverage: 8   │ │
│ │                                                 │ │
│ │ BUSINESSES (scrollable)                         │ │
│ │                                                 │ │
│ │ • ABC Corp (Portland, OR) - Retail ⭐ 4.2     │ │
│ │ • XYZ Services (Westbrook, ME) - Tech ⭐ 4.8  │ │
│ │ [↓ Show more]                                   │ │
│ └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Mobile Layout (<600px)

```
┌─────────────────────────────┐
│ 🗺 Geo Intelligence [⋯]     │
├─────────────────────────────┤
│                             │
│   [Google Maps - Full]      │
│                             │
│   [Marker Popup]            │
│   ABC Corp                  │
│   Portland, OR              │
│   [Call] [Website] [View]   │
│                             │
│                             │
│                             │
│                             │
│  ┌──────────────────────┐   │
│  │ [⋯ Filters] [List ≡] │   │
│  └──────────────────────┘   │
│                             │
│  🔻 BOTTOM SHEET (Drawer)   │
│  ┌──────────────────────┐   │
│  │ Search: [____]       │   │
│  │ Location: [____]     │   │
│  │ Industry: [dd]       │   │
│  │ Service: [dd]        │   │
│  │ Status: [dd]         │   │
│  │                      │   │
│  │ Total: 47 businesses │   │
│  │ Industries: 12       │   │
│  │                      │   │
│  │ • ABC Corp ⭐ 4.2   │   │
│  │ • XYZ Services ⭐ 4.8│   │
│  │ [↓ More]             │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

---

## 3. Map Component

### Implementation Approach

**Primary:** Google Maps Embed API (embedded iframe)
**Rationale:** No additional library dependencies, official Google Maps, performant, mobile-friendly

### Map Features

#### Location Markers

```javascript
// Marker data structure
const marker = {
  id: "biz_123",
  name: "ABC Corp",
  lat: 43.6629,
  lng: -70.2553,
  address: "123 Main St, Portland, ME 04101",
  city: "Portland",
  state: "ME",
  zip: "04101",
  category: "Retail",
  rating: 4.2,
  phone: "207-555-1234",
  website: "https://example.com",
  status: "active",
  industryColor: "#FF6B6B"  // Red for Retail
};
```

#### Color Coding Strategy

**By Industry Type:**
```
Technology         → Blue (#4A90E2)
Retail             → Red (#FF6B6B)
Services           → Green (#7ED321)
Healthcare         → Purple (#9013FE)
Finance            → Orange (#F5A623)
Education          → Cyan (#50E3C2)
Manufacturing      → Brown (#8B4513)
Other/Unspecified  → Gray (#CCCCCC)
```

**By Member Status (secondary):**
- Active: Full opacity (1.0)
- Inactive: Reduced opacity (0.5)
- Pending: Animated pulse
- Suspended: Strikethrough indicator

#### Marker Clustering

**On Zoom Out:** Group overlapping markers
- Cluster count badge (e.g., "12")
- Cluster color based on majority industry
- Click cluster → zoom to bounds

**On Zoom In:** Individual markers appear
- Smooth transition
- Preserves user interaction

#### Map Interaction

**Desktop:**
- Click marker → Show popup (marker details + action buttons)
- Drag to pan
- Scroll to zoom (with mouse wheel)
- Right-click → Center on location
- Double-click → Zoom in

**Mobile:**
- Tap marker → Show popup
- Pinch to zoom
- Two-finger drag to pan
- Long-press marker → Full detail modal

#### Marker Popups

**Popup Contents:**
```
┌─────────────────────────────────┐
│ ★ ABC Corp (Retail)             │
├─────────────────────────────────┤
│ ⭐ 4.2 | 📍 Portland, ME 04101 │
│ 📞 207-555-1234                 │
│ 🌐 https://example.com          │
├─────────────────────────────────┤
│ [📋 View Details] [🗺 Navigate]  │
└─────────────────────────────────┘
```

**Popup Actions:**
- `View Details` → Navigate to `#/business-hub/:id`
- `Navigate` → Google Maps directions
- Swipe/click outside → Close popup

#### Search/Navigation Box

Embedded in top of map (mobile) or sidebar (desktop):
```
┌──────────────────────────────────┐
│ 🔍 Search businesses or locations │
│ [___________________________] [🔍] │
└──────────────────────────────────┘
```

**Functionality:**
- Type business name → filter + highlight
- Type location (address, city, zip) → pan to bounds
- Type industry → filter + recolor
- Autocomplete suggestions
- Clear search → reset map

---

## 4. Left Sidebar / Filter Panel

### Desktop (Fixed Left Pane, 30-40% width)

**Structure:**
```
┌──────────────────────────────┐
│ SEARCH & FILTERS             │
├──────────────────────────────┤
│                              │
│ 🔍 SEARCH                    │
│ ┌──────────────────────────┐ │
│ │ Search by name or address │ │
│ │ [____________________]    │ │
│ └──────────────────────────┘ │
│                              │
│ FILTERS                      │
│                              │
│ Location                     │
│ [Zip Code▼]  [input_____]   │
│ [City name▼] [input_____]   │
│                              │
│ Industry                     │
│ [All Industries▼]           │
│ ☑ Technology (12)           │
│ ☑ Retail (8)                │
│ ☑ Services (15)             │
│ ☐ Healthcare (3)            │
│ ☐ Finance (2)               │
│ ☐ Other (7)                 │
│                              │
│ Service Area                 │
│ [Local ▼] (default)         │
│ • Local (same city)          │
│ • Regional (same county)     │
│ • Statewide                  │
│ • National                   │
│                              │
│ Member Status               │
│ ☑ Active                    │
│ ☑ Inactive                  │
│ ☑ Pending                   │
│                              │
│ Rating                       │
│ ○ All ○ 4.0+ ○ 3.0+ ○ 2.0+ │
│                              │
│ [Clear All Filters]          │
│                              │
├──────────────────────────────┤
│ ANALYTICS SUMMARY            │
├──────────────────────────────┤
│                              │
│ 📊 Total Businesses: 47      │
│    (filtered from 127 total) │
│                              │
│ 🏭 Industries Represented    │
│    12 categories             │
│                              │
│ 🗺️  Service Area Coverage    │
│    8 zip codes, 3 counties   │
│                              │
│ 📈 Geographic Distribution   │
│    • Portland: 15 (32%)      │
│    • Westbrook: 9 (19%)      │
│    • Augusta: 7 (15%)        │
│    • Other: 16 (34%)         │
│                              │
├──────────────────────────────┤
│ BUSINESS LIST                │
│ (scrollable)                 │
├──────────────────────────────┤
│                              │
│ ⚙️ [Sort by▼ Distance]       │
│                              │
│ ABC Corp                     │
│ 📍 Portland, ME 04101        │
│ Retail • ⭐ 4.2 • 2.3 mi    │
│ ☑ Active   [→ Details]       │
│                              │
│ XYZ Services                 │
│ 📍 Westbrook, ME 04092       │
│ Tech • ⭐ 4.8 • 4.1 mi      │
│ ☑ Active   [→ Details]       │
│                              │
│ [↓ Show 12 more...]          │
│                              │
└──────────────────────────────┘
```

### Mobile (Bottom Sheet / Drawer)

**Default State:** Collapsed to 40% height with peek
**Expanded State:** Full screen (excluding map on drag)
**Gesture:** Swipe up to expand, down to collapse
**Tab Toggle:** Switch between "Filters" and "List" tabs

---

## 5. Responsive Behavior

### Breakpoints and Strategy

| Breakpoint | Device | Map | Sidebar | Behavior |
|------------|--------|-----|---------|----------|
| `<600px` | Mobile Phone | 100% width | Bottom drawer | Tap map for filters, list toggle |
| `600-900px` | Tablet | 100% width | Bottom (50% height stacked) | Drawer swipe or bottom sheet |
| `>900px` | Desktop | 65% width | 35% fixed left | Always visible side-by-side |

### Desktop (>900px)

- Side-by-side layout: map (65%) + sidebar (35%)
- Sidebar remains visible while scrolling map
- Sidebar scrolls independently
- Smooth transitions on filter changes
- Map recenter button visible when filters applied

### Tablet (600-900px)

```
[Header]
[Map - full width]
[Bottom Sheet - expandable]
  - Shows 40% of screen when closed
  - 100% of screen when expanded (with back button)
  - Swipe gesture to toggle
```

**Interaction:**
- Tap map to interact (pan, zoom, click markers)
- Pull bottom sheet up → expand filters/list
- Tap "< Back" in sheet → collapse to peek
- Tap "List" tab in sheet → switch from filters to business list

### Mobile (<600px)

```
[Header: "Geo Intelligence" with menu]
[Map - full screen]
[Floating action button: Filters icon]
[Floating action button: List toggle]
[Bottom Sheet - peek (30% height)]
```

**Interaction:**
- Tap Filters FAB → expand bottom sheet to full screen showing filters
- Tap List FAB → switch bottom sheet content to business list
- Swipe down in sheet → collapse to peek
- Tap map marker → show popup
- Tap popup action → navigate

### CSS Media Queries

```css
/* Desktop */
@media (min-width: 901px) {
  .geo-layout {
    display: grid;
    grid-template-columns: 35% 1fr;
  }
  .geo-sidebar { position: relative; width: 35%; }
  .geo-map { width: 65%; }
}

/* Tablet */
@media (min-width: 601px) and (max-width: 900px) {
  .geo-layout {
    display: flex;
    flex-direction: column;
  }
  .geo-map { flex: 1; height: 55%; }
  .geo-sidebar {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 45%;
    border-top: 1px solid;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .geo-map { height: 100vh; }
  .geo-sidebar {
    position: fixed;
    bottom: 0;
    width: 100%;
    max-height: 40vh;
    overflow-y: auto;
    z-index: 100;
  }
  .geo-sidebar.expanded { max-height: 100vh; }
}
```

---

## 6. Search & Filter Logic

### Real-Time Updates

**Flow:**
1. User modifies filter (location, industry, status)
2. Sidebar shows "Updating..." indicator briefly
3. API call: `GET /business-listings?filters=...`
4. Filter results in memory (no page reload)
5. Update markers on map (add/remove/recolor)
6. Update business list in sidebar
7. Update analytics cards (total count, top industries)
8. Map auto-recenter on filtered results if needed

### Search Implementation

**Search Input:**
```javascript
// Real-time search with debounce
const searchInput = sidebar.querySelector('.search-input');
searchInput.addEventListener('input', debounce((e) => {
  const query = e.target.value.toLowerCase();

  // Client-side filtering (fast)
  const results = businesses.filter(b =>
    b.name.toLowerCase().includes(query) ||
    b.city.toLowerCase().includes(query) ||
    b.address.toLowerCase().includes(query)
  );

  updateMap(results);
  updateList(results);
  updateAnalytics(results);
}, 300));
```

### Filter Priority

**When multiple filters applied:** Intersection (AND logic)
- Location: ZIP 04101
- Industry: Retail
- Status: Active
- **Result:** Active retail businesses in 04101 (0-3 results typical)

**Map Behavior:**
- Matching markers: Full color
- Non-matching markers: 50% opacity (shown but not highlighted)
- OR: "Show" vs "Hide" toggle for non-matching

### Map Recenter Strategy

**When to recenter:**
1. User applies new location filter → pan to bounds
2. User clears all filters → recenter to full state view
3. User types address in search → pan to location
4. User selects business from list → highlight + pan

**Bounds Calculation:**
```javascript
function fitMapToResults(businesses) {
  if (businesses.length === 0) {
    map.setCenter(chamberHeadquarters); // Fallback
    map.setZoom(8); // Zoom out to state level
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  businesses.forEach(b => {
    bounds.extend({ lat: b.lat, lng: b.lng });
  });

  map.fitBounds(bounds);
  map.setZoom(Math.max(map.getZoom(), 11)); // Min zoom 11
}
```

---

## 7. Sub-Route: #/geo-intelligence/:id

### Purpose

Accessed from:
1. Business Hub Detail → "View on Map" button
2. Geo Intelligence → Click marker → "View Details" button

Shows focused geo analysis for a specific business location.

### Layout

**Desktop:**
```
┌────────────────────────────────────────────┐
│ < Back | Geo Analysis: ABC Corp            │
├────────────────────────────────────────────┤
│                                            │
│  MAP (center on business location)         │
│  ┌─────────────────────────────────────┐  │
│  │  🔴 [ABC Corp - primary marker]     │  │
│  │   (centered, highlighted)           │  │
│  │                                     │  │
│  │  ○ Nearby Competitors (5)           │  │
│  │  ◇ Nearby Partners (3)              │  │
│  │  △ Regional Businesses (12)         │  │
│  └─────────────────────────────────────┘  │
│                                            │
│  ANALYSIS PANEL                            │
│  ┌────────┬────────┬────────┬────────┐   │
│  │ Detail │ Market │ Nearby │ Service│   │
│  ├────────┴────────┴────────┴────────┤   │
│  │                                    │   │
│  │ Business Details                   │   │
│  │ ─────────────────                  │   │
│  │ Name: ABC Corp                     │   │
│  │ Category: Retail                   │   │
│  │ Address: 123 Main St, Portland ME  │   │
│  │ Established: 2015                  │   │
│  │ Employees: 12-50                   │   │
│  │                                    │   │
│  │ Service Area: Local (Portland)     │   │
│  │ Coverage Radius: ~10 miles         │   │
│  │ Primary ZIP: 04101                 │   │
│  │ Secondary ZIPs: 04102, 04103       │   │
│  │                                    │   │
│  │ [→ View Full Profile]              │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

**Mobile:** Full-screen map with overlay tabs

### Analysis Features

#### Detail Tab
- Business information (pulled from Business Hub)
- Service area and coverage radius
- Primary and secondary service locations
- Rating and reviews summary

#### Market Tab (Demographics)
- Population density around location
- Business density in category
- Competitive landscape
  - Direct competitors nearby (same category)
  - Complementary services nearby
  - Distance to each
- Market saturation score

#### Nearby Tab
- Competitors (same industry, within 5 mi)
  - Name, address, rating, distance
  - [Compare] button → side-by-side view
- Partners (complementary services)
- Regional businesses (broader area)
- Click nearby business → show details or navigate to full detail

#### Service Area Tab
- Service area boundary (if defined)
- Coverage visualization (heatmap style)
- Primary vs secondary service zones
- Distance to chamber headquarters
- Accessibility analysis (roads, public transit)

### Action Buttons

```
[← Back to Map]    [View Full Profile]    [Add to Report]    [Export]
```

**Back to Map:** Return to main geo intelligence page (preserves filter state)
**View Full Profile:** Navigate to `#/business-hub/:id`
**Add to Report:** Build custom geographic analysis report
**Export:** Download location analysis as PDF or GeoJSON

---

## 8. Integrations

### Cross-Navigation

#### From Business Hub Detail

```javascript
// In business-detail.js, add action button
const viewMapBtn = document.createElement('button');
viewMapBtn.textContent = '🗺️ View on Map';
viewMapBtn.onclick = () => {
  navigate(`#/geo-intelligence/${business.id}`);
};
businessHeader.appendChild(viewMapBtn);
```

#### From Geo Intelligence

```javascript
// In map marker popup
const viewDetailsBtn = document.createElement('button');
viewDetailsBtn.textContent = '📋 View Details';
viewDetailsBtn.onclick = () => {
  navigate(`#/business-hub/${marker.id}`);
};
popup.appendChild(viewDetailsBtn);
```

### Settings Integration

**Geographic Scope Management:**

Route: `#/settings?tab=geographic`

```
Chamber Geographic Configuration
─────────────────────────────────

Primary Territory: Maine
Secondary Territories: New England (multi-select)

Service Area Type: Statewide

Headquarters Location:
📍 Downtown Chamber Office
123 Congress St, Portland ME 04101
[Update Location]

Visualization Defaults:
- Default zoom level: [10]
- Default view: [All Members]
- Color scheme: [By Industry]

[Save Settings]
```

### Sidebar Navigation

Add to main sidebar (in `components/sidebar.js`):

```javascript
const geoLink = {
  icon: '🗺️',
  label: 'Geographic Intelligence',
  href: '#/geo-intelligence',
  section: 'member-management'
};
```

---

## 9. Data Display

### Business List

**Item Structure:**
```
┌────────────────────────────────┐
│ ABC Corp                       │
│ 📍 Portland, ME 04101          │
│ Category: Retail               │
│ ⭐ 4.2 (28 reviews)            │
│ Service Area: Local            │
│ Status: ✓ Active               │
│ Distance: 2.3 mi               │
│ [→ View Details] [+ Compare]   │
└────────────────────────────────┘
```

**List Sorting Options:**
- Distance (from chamber HQ or search location)
- Name (A-Z)
- Rating (highest first)
- Category
- Recently added
- Most reviewed

**Selection/Highlighting:**
- Clicking list item → highlight marker on map
- Checkbox: add to comparison group or report

### Analytics Dashboard

**Summary Cards (in sidebar):**

```
┌──────────────────────┐
│ 📊 Total Businesses  │
│ 47 (filtered)        │
│ 127 (total)          │
└──────────────────────┘

┌──────────────────────┐
│ 🏭 Industries        │
│ 12 categories        │
│ Top: Retail (15)     │
└──────────────────────┘

┌──────────────────────┐
│ 🗺️  Coverage         │
│ 8 zip codes          │
│ 3 counties           │
│ 1 state              │
└──────────────────────┘

┌──────────────────────┐
│ 📈 Top Locations     │
│ • Portland: 15 (32%) │
│ • Westbrook: 9 (19%)│
│ • Augusta: 7 (15%)   │
│ • Other: 16 (34%)    │
└──────────────────────┘
```

**Expanded Analytics View (new route option):**

Route: `#/geo-intelligence/analytics`

Full-page dashboard with:
- Industry distribution (pie chart)
- Geographic heatmap (choropleth by county)
- Coverage trend over time (line chart)
- Growth by region (bar chart)
- Export options (PNG, PDF, CSV)

---

## 10. API Integration

### Endpoints Needed

#### 1. List Businesses with Geo Filters
```
GET /business-listings
Query Parameters:
  - search: string (name, address)
  - location: string (zip, city, county)
  - location_type: "zip_code" | "city" | "county"
  - industry: string (comma-separated)
  - service_area: "local" | "regional" | "statewide" | "national"
  - status: "active" | "inactive" | "pending" (comma-separated)
  - rating_min: number (0-5)
  - limit: number (default 100)
  - offset: number (default 0)

Response:
[
  {
    id: "biz_123",
    name: "ABC Corp",
    address: "123 Main St",
    city: "Portland",
    state: "ME",
    zip_code: "04101",
    lat: 43.6629,
    lng: -70.2553,
    category: "Retail",
    rating: 4.2,
    phone: "207-555-1234",
    website: "https://example.com",
    status: "active",
    service_area: "local",
    geo_scope_type: "zip_code",
    geo_scope_id: "04101"
  },
  ...
]
```

**Backend Implementation:** Extend existing `GET /business-listings` route
**Filtering:** Client-side OR server-side?
- Server-side (more efficient): Implement filters in route handler
- Client-side (simpler MVP): Fetch all, filter in JS

**Recommendation:** Server-side with pagination for scalability

#### 2. Get Business Detail
```
GET /business-listings/:id

Response:
{
  id: "biz_123",
  name: "ABC Corp",
  category: "Retail",
  address: "123 Main St",
  city: "Portland",
  state: "ME",
  zip_code: "04101",
  lat: 43.6629,
  lng: -70.2553,
  phone: "207-555-1234",
  email: "contact@example.com",
  website: "https://example.com",
  description: "...",
  rating: 4.2,
  review_count: 28,
  status: "active",
  service_area: "Local serving Portland metro",
  service_area_type: "local",
  geo_scope_type: "zip_code",
  geo_scope_id: "04101",
  founded_year: 2015,
  employee_count: "12-50",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-03-28T14:30:00Z"
}
```

**Backend:** Already exists, may need additional fields for geo display

#### 3. Get Geo Statistics
```
GET /geo-intelligence/stats
Query Parameters:
  - filters: JSON (same as business-listings)

Response:
{
  total_businesses: 47,
  filtered_from: 127,
  industries: {
    "Retail": 15,
    "Services": 12,
    "Technology": 8,
    "Healthcare": 5,
    "Finance": 3,
    "Other": 4
  },
  coverage: {
    zip_codes: ["04101", "04102", "04103", "04104", "04105", "04106", "04107", "04108"],
    counties: ["Cumberland", "York", "Oxford"],
    states: ["ME"]
  },
  locations_by_area: {
    "Portland": 15,
    "Westbrook": 9,
    "Augusta": 7,
    "Brunswick": 5,
    "Other": 11
  },
  average_rating: 4.1,
  member_status_breakdown: {
    "active": 42,
    "inactive": 4,
    "pending": 1
  },
  last_updated: "2024-03-28T14:30:00Z"
}
```

**Backend:** New endpoint, implements aggregation logic

#### 4. Search Geo Locations (Optional)
```
GET /geo-intelligence/search
Query Parameters:
  - q: string (address, city, zip, business name)
  - limit: number (default 10)

Response:
[
  {
    type: "zip_code" | "city" | "business",
    id: "04101",
    label: "04101, Portland, ME",
    lat: 43.6629,
    lng: -70.2553,
    bounds: { ne: { lat, lng }, sw: { lat, lng } }
  },
  ...
]
```

**Backend:** Geocoding/place search, could use Google Places API or PostGIS

#### 5. Get Geo Bounds (For auto-centering map)
```
GET /geo-intelligence/bounds
Query Parameters:
  - business_ids: string (comma-separated IDs for multi-selection)
  - OR
  - filters: JSON (same filters as business-listings)

Response:
{
  bounds: {
    north: 44.2,
    south: 42.8,
    east: -68.5,
    west: -71.2
  },
  center: {
    lat: 43.5,
    lng: -69.85
  },
  zoom_level: 9
}
```

**Backend:** Calculate bounding box from lat/lng coordinates

### Implementation Sequence

**Phase 1 (MVP):**
1. ✅ Use existing `GET /business-listings` (fetch all, filter client-side)
2. ✅ Use existing `GET /business-listings/:id` (for detail popup)
3. ✅ New: `GET /geo-intelligence/stats` (analytics cards)

**Phase 2 (Performance):**
1. Extend `GET /business-listings` with server-side filters
2. Add `GET /geo-intelligence/search` (location autocomplete)
3. Add `GET /geo-intelligence/bounds` (map auto-fit)

**Phase 3 (Analytics Dashboard):**
1. Advanced analytics endpoint with time-series data
2. Heatmap data endpoint
3. Competitive analysis endpoint

---

## 11. CSS Architecture

### File Structure

```
apps/secretary-console/
├── views/
│   ├── geo-intelligence/          [NEW DIRECTORY]
│   │   ├── geo-intelligence-view.js    [Entry point, coordinator]
│   │   ├── geo-map.js                  [Map component]
│   │   ├── geo-filters.js              [Filter panel]
│   │   ├── geo-list.js                 [Business list]
│   │   ├── geo-analytics.js            [Analytics summary]
│   │   └── geo-intelligence.css        [All styling]
│   │
│   └── business-hub/
│       ├── business-hub-view.js
│       └── tabs/
│           └── geographic-tab.js        [MODIFIED: Extract to standalone]
│
└── styles.css                      [Global styles]
```

### CSS Class Structure

```css
/* Geo Intelligence Layout */
.geo-intelligence-page { }
.geo-layout { }
.geo-layout--desktop { display: grid; grid-template-columns: 35% 1fr; }
.geo-layout--tablet { display: flex; flex-direction: column; }
.geo-layout--mobile { display: flex; flex-direction: column; }

/* Map Component */
.geo-map-container { }
.geo-map-embed { width: 100%; height: 100%; border: none; }
.geo-map-search { position: absolute; top: 12px; left: 12px; }
.geo-map-controls { position: absolute; bottom: 12px; right: 12px; }

/* Sidebar / Filter Panel */
.geo-sidebar { display: flex; flex-direction: column; }
.geo-sidebar--desktop { position: relative; border-right: 1px solid; }
.geo-sidebar--mobile { position: fixed; bottom: 0; z-index: 100; }
.geo-sidebar.expanded { max-height: 100vh; }

/* Filter Controls */
.geo-filters { padding: 16px; }
.geo-search-box { margin-bottom: 16px; }
.geo-search-input { width: 100%; padding: 8px 12px; }
.geo-filter-group { margin-bottom: 16px; }
.geo-filter-label { font-size: 12px; font-weight: 600; }
.geo-filter-control { width: 100%; padding: 6px 8px; }

/* Analytics Cards */
.geo-analytics { padding: 16px; border-top: 1px solid; }
.geo-stat-card { margin-bottom: 12px; padding: 12px; background: var(--panel); }
.geo-stat-card__value { font-size: 24px; font-weight: 700; }
.geo-stat-card__label { font-size: 12px; color: var(--muted); }

/* Business List */
.geo-list { flex: 1; overflow-y: auto; padding: 12px; }
.geo-list-item {
  padding: 12px;
  border: 1px solid #e6dbcd;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.geo-list-item:hover { background-color: var(--panel); }
.geo-list-item.highlighted { background-color: var(--accent); color: white; }
.geo-list-item__name { font-weight: 600; font-size: 14px; }
.geo-list-item__location { font-size: 13px; color: var(--muted); }
.geo-list-item__category { display: inline-block; padding: 2px 8px; background: var(--accent); color: white; border-radius: 3px; }

/* Marker Popups */
.geo-popup { padding: 12px; background: white; border-radius: 6px; }
.geo-popup__title { font-weight: 700; font-size: 14px; }
.geo-popup__detail { font-size: 12px; color: #666; margin: 4px 0; }
.geo-popup__actions { display: flex; gap: 8px; margin-top: 8px; }
.geo-popup__btn { flex: 1; padding: 6px; font-size: 12px; background: var(--accent); color: white; border: none; border-radius: 3px; cursor: pointer; }

/* Bottom Sheet (Mobile) */
.geo-bottom-sheet { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid; z-index: 99; }
.geo-bottom-sheet__handle { width: 40px; height: 4px; background: #ccc; border-radius: 2px; margin: 8px auto; }
.geo-bottom-sheet__content { overflow-y: auto; }

/* Detail View */
.geo-detail-view { display: flex; flex-direction: column; }
.geo-detail-tabs { display: flex; border-bottom: 1px solid; gap: 0; }
.geo-detail-tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; border-bottom: 2px solid transparent; }
.geo-detail-tab.active { border-bottom-color: var(--accent); }
.geo-detail-content { flex: 1; overflow-y: auto; padding: 16px; }

/* Responsive Overrides */
@media (max-width: 900px) {
  .geo-layout--desktop { grid-template-columns: 1fr; }
  .geo-sidebar--desktop { position: absolute; bottom: 0; width: 100%; }
}

@media (max-width: 600px) {
  .geo-sidebar { max-height: 40vh; }
  .geo-map-container { height: 100vh; }
  .geo-map-search { display: none; } /* Move to mobile top bar */
}
```

### Color Palette

**Industries (Marker colors):**
```css
.marker-technology { color: #4A90E2; }
.marker-retail { color: #FF6B6B; }
.marker-services { color: #7ED321; }
.marker-healthcare { color: #9013FE; }
.marker-finance { color: #F5A623; }
.marker-education { color: #50E3C2; }
.marker-manufacturing { color: #8B4513; }
.marker-other { color: #CCCCCC; }
```

**States:**
```css
.status-active { opacity: 1.0; }
.status-inactive { opacity: 0.5; filter: grayscale(50%); }
.status-pending { animation: pulse 2s infinite; }
.status-suspended { text-decoration: line-through; opacity: 0.6; }
```

---

## 12. Accessibility

### Keyboard Navigation

**Map Controls:**
- Arrow keys: Pan map
- +/- or Ctrl+Scroll: Zoom
- Tab: Navigate through markers
- Enter: Focus marker, show popup
- Esc: Close popup

**Filter Controls:**
- Tab: Navigate through filters
- Space/Enter: Toggle checkbox/select
- Arrow keys: Select from dropdown

**Business List:**
- Tab: Navigate list items
- Enter: Select item, highlight marker
- Arrow keys: Move through list
- Ctrl+A: Select all visible items

### ARIA Implementation

```html
<!-- Map -->
<div role="region" aria-label="Business location map">
  <div id="map" aria-live="polite"><!-- map content --></div>
</div>

<!-- Filters -->
<form role="search" aria-label="Filter businesses">
  <label for="search">Search businesses</label>
  <input id="search" type="text" aria-describedby="search-hint" />
  <span id="search-hint" class="sr-only">Search by name or address</span>
</form>

<!-- Business List -->
<ul role="listbox" aria-label="Business search results">
  <li role="option" aria-selected="false">ABC Corp</li>
</ul>

<!-- Analytics -->
<section aria-label="Geographic statistics">
  <h2>Analytics</h2>
  <dl>
    <dt>Total Businesses</dt>
    <dd aria-live="polite">47</dd>
  </dl>
</section>
```

### Color Not Sole Indicator

- **Marker status:** Use shape + color (circle = active, square = inactive)
- **Industry:** Use color + icon or text label
- **Status:** Use text label + color + pattern (stripe for suspended)

### Semantic HTML

- Use `<button>` for clickable elements, not `<div>`
- Use `<label>` with inputs
- Use heading hierarchy (`<h1>`, `<h2>`, `<h3>`)
- Use `<form>` for filter controls
- Use `<ul>` / `<ol>` for lists

### Testing

- Automated: axe DevTools (color contrast, ARIA)
- Manual: Keyboard navigation only, no mouse
- Screen reader: NVDA on Windows, JAWS testing
- Mobile: VoiceOver on iOS

---

## 13. Mobile Experience

### Top Bar (Mobile)

```
┌─────────────────────────────┐
│ 🗺 Geo Intelligence  [⋯]    │
└─────────────────────────────┘
```

**Menu options:**
- View as Map (default)
- View as List
- Settings
- Export
- Help

### Map (Full Screen)

- Tap to close filters/list
- Tap marker → show popup
- Tap popup action → navigate
- Pinch to zoom
- Two-finger pan

### Floating Action Buttons

```
     [Filters]
        FAB
          ▲
          │

[Map Full Screen Here]

          │
          ▼
  [List Toggle] FAB
```

**Position:**
- Filters FAB: Bottom-left
- List Toggle FAB: Bottom-right
- Show/hide on scroll (hide when scrolling through list)

### Bottom Sheet Interaction

**States:**
1. **Peek** (30% of screen)
   - Shows "Filters" and "List" tabs
   - Swipe up → expand
   - Swipe down → collapse (only if expanded)

2. **Expanded** (100% of screen, minus header)
   - Shows tab content (filters or list)
   - "< Back" button to collapse
   - Swipe down → collapse

3. **Full Screen** (landscape orientation)
   - Rotate device → expand sheet to full screen
   - Essential for filter manipulation on small devices

### Touch Targets

- All buttons: 44px minimum (touch-friendly)
- List items: Tap anywhere to select
- Markers: 40px radius tap zone (generous)

### Viewport Optimization

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0,
               maximum-scale=5, user-scalable=yes,
               viewport-fit=cover" />
```

**Considerations:**
- Notch support (viewport-fit: cover)
- Allow pinch zoom (user-scalable: yes)
- Portrait + landscape orientation

---

## 14. Features (Roadmap)

### Phase 1: MVP (3-4 days)

**Core Functionality:**
- ✅ Map view with location markers (color-coded by industry)
- ✅ Filter by location (zip, city), industry, status
- ✅ Business list in sidebar with search and sort
- ✅ Click marker → show popup with business card
- ✅ Click popup → navigate to Business Hub detail
- ✅ Analytics summary (total, industries, coverage)
- ✅ Responsive desktop + tablet + mobile
- ✅ Sidebar link + Business Hub integration

**Not Included:**
- Service area visualization
- Heatmaps
- Advanced analytics dashboard
- Demographic overlays
- Competitive analysis

**Estimated Effort:** 3-4 days (one person)

### Phase 2: Enhancement (1-2 weeks)

**Analytics Dashboard:**
- Full-page analytics view (`#/geo-intelligence/analytics`)
- Industry distribution pie chart
- Geographic heatmap (by county)
- Coverage trend over time
- Growth by region bar chart

**Service Area Visualization:**
- Draw service area boundaries on map
- Service area radius (configurable)
- Primary vs secondary zones
- Coverage heatmap

**Advanced Features:**
- Territory planning tool (assign regions)
- Comparison mode (select 2+ businesses, compare on map)
- Export options (PDF report, GeoJSON, CSV)

**Estimated Effort:** 1-2 weeks (one person)

### Phase 3: Advanced (3-4 weeks)

**Competitive Analysis:**
- Identify direct competitors on map
- Show nearby complementary services
- Competitive density heatmaps
- Market saturation analysis

**Demographic Overlays:**
- Population density by area
- Income levels by zip code
- Business density by industry
- Labor force data

**Route Optimization:**
- Optimize visiting order for field reps
- Territory coverage analysis
- Identify gaps in geographic reach

**Estimated Effort:** 3-4 weeks (one person with API support)

---

## 15. Implementation

### Timeline

| Task | Duration | Dependencies | Deliverables |
|------|----------|--------------|--------------|
| **Design & Prototyping** | 0.5 days | None | This spec, wireframes |
| **API Enhancements** | 1 day | Existing `/business-listings` | Filter endpoint, stats endpoint |
| **Map Component** | 1.5 days | Google Maps API, business data | `geo-map.js`, integrated |
| **Filter Panel** | 1.5 days | API endpoints | `geo-filters.js`, real-time filtering |
| **Business List** | 1 day | Business data | `geo-list.js`, sorting, selection |
| **Analytics Cards** | 0.5 days | API stats endpoint | `geo-analytics.js`, summary display |
| **Responsive Design** | 1 day | All components | Media queries, mobile bottom sheet |
| **Testing & QA** | 1 day | All components | E2E tests, accessibility audit |
| **Documentation** | 0.5 days | Implementation | API docs, setup guide, usage |
| **TOTAL** | **8 days** | | MVP ready |

### File Structure

```
apps/secretary-console/views/geo-intelligence/
├── geo-intelligence-view.js          (720 lines)
│   └── Entry point, coordinates map/filters/list/analytics
│   └── Handles routing, state management, API calls
│   └── Exports: geoIntelligenceHandler(container, options)
│
├── geo-map.js                        (480 lines)
│   └── Google Maps embed + marker management
│   └── Popup on marker click
│   └── Auto-recenter on filter changes
│   └── Exports: initGeoMap(container, options)
│
├── geo-filters.js                    (320 lines)
│   └── Search box, filter controls
│   └── Real-time filter event dispatch
│   └── Clear filters, save presets
│   └── Exports: initGeoFilters(container, options)
│
├── geo-list.js                       (280 lines)
│   └── Business list with sorting
│   └── Item selection and highlighting
│   └── Pagination/infinite scroll
│   └── Exports: initGeoList(container, options)
│
├── geo-analytics.js                  (160 lines)
│   └── Statistics summary cards
│   └── Industry breakdown
│   └── Coverage summary
│   └── Exports: initGeoAnalytics(container, options)
│
└── geo-intelligence.css              (600 lines)
    └── Layout (desktop/tablet/mobile)
    └── Map container styling
    └── Sidebar + filter panel
    └── Business list
    └── Bottom sheet (mobile)
    └── Analytics cards
    └── Responsive breakpoints
```

### Implementation Sequence

**Day 1: Backend API Preparation**
1. Extend `GET /business-listings` with geo-based filtering
2. Create `GET /geo-intelligence/stats` endpoint
3. Add test data with coordinates to 20+ businesses

**Day 2: Map Component**
1. Create `geo-intelligence-view.js` (coordinator)
2. Create `geo-map.js` with Google Maps embed
3. Add marker placement logic
4. Implement marker popup with business card

**Day 3: Filters & Analytics**
1. Create `geo-filters.js` with search and filter controls
2. Create `geo-analytics.js` with summary cards
3. Wire up real-time filtering (map + list + analytics update)
4. Implement bounds-fitting on filter changes

**Day 4: Business List**
1. Create `geo-list.js` with sortable business list
2. Implement selection and highlighting
3. Add pagination/infinite scroll
4. Wire up list item click → map highlight

**Day 5: Responsive Design & Mobile**
1. Create media queries for tablet/mobile
2. Implement bottom sheet for mobile
3. Add floating action buttons
4. Test touch interactions

**Day 6: Integration**
1. Add sidebar navigation link
2. Add "View on Map" button to Business Hub detail
3. Implement `#/geo-intelligence/:id` sub-route
4. Cross-navigation testing

**Day 7: Testing & Polish**
1. Unit tests for filtering logic
2. E2E tests for map interactions
3. Accessibility audit and fixes
4. Performance optimization

**Day 8: Documentation & Launch**
1. API documentation
2. User guide for chamber executives
3. Dev setup instructions
4. Production deployment

### Dependencies

**Frontend:**
- Google Maps JavaScript API (embed only, no library)
- Existing `request()` API client
- Router system (already in place)

**Backend:**
- Existing Firestore collection: `businessListings`
- Geospatial data: lat/lng coordinates (required)
- New `GET /geo-intelligence/stats` endpoint

**External APIs:**
- Google Maps Embed API (free tier: 25,000 maps/day)
- Optional: Google Places API for autocomplete

---

## 16. Success Criteria

### Functional Requirements

- [ ] Map displays all business locations with markers
- [ ] Markers color-coded correctly by industry
- [ ] Filter by location (zip code, city) updates map in real-time
- [ ] Filter by industry updates map in real-time
- [ ] Filter by status updates map in real-time
- [ ] Multiple filters work together (AND logic)
- [ ] Clear filters resets map to full view
- [ ] Click marker shows popup with business card
- [ ] Click "View Details" navigates to Business Hub
- [ ] Business list updates when filters change
- [ ] List items can be sorted (distance, name, rating)
- [ ] Analytics cards show correct counts
- [ ] Map auto-recenters on filtered results
- [ ] Search by business name works
- [ ] Responsive at mobile, tablet, desktop
- [ ] Bottom sheet works on mobile (swipe to expand)
- [ ] Navigation from Business Hub detail works
- [ ] Navigation back from Geo Intelligence works
- [ ] Sidebar navigation link appears

### Quality Requirements

- [ ] No console errors in Chrome, Firefox, Safari
- [ ] Keyboard navigation works (Tab, Arrow keys, Enter)
- [ ] Screen reader compatible (ARIA labels present)
- [ ] Color contrast meets WCAG AA standard
- [ ] Mobile touch targets are 44px minimum
- [ ] Map loads in <2 seconds
- [ ] Filter response is <500ms
- [ ] No memory leaks on navigation

### Performance Metrics

- [ ] Initial page load: <2s
- [ ] Filter update: <500ms
- [ ] Map render: <1s
- [ ] API response: <1s
- [ ] Mobile FCP: <3s
- [ ] Mobile LCP: <4.5s
- [ ] Mobile CLS: <0.1

### Test Coverage

- [ ] Unit tests: Filter logic (60%+ coverage)
- [ ] E2E tests: Map interactions (click, zoom, pan)
- [ ] E2E tests: Filter workflows
- [ ] E2E tests: Cross-navigation
- [ ] Accessibility tests: axe audit passes
- [ ] Mobile tests: iOS Safari, Android Chrome

---

## 17. Summary: Page Coordination

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  geo-intelligence-view.js (Coordinator & State Manager)    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  State:                                                     │
│  - businessList[]                                           │
│  - activeFilters{}                                          │
│  - selectedBusinesses[]                                     │
│  - mapBounds                                                │
│                                                             │
│  Methods:                                                   │
│  - onFilterChange(filters)                                  │
│  - onListItemClick(id)                                      │
│  - onMarkerClick(id)                                        │
│  - updateMap()                                              │
│  - updateList()                                             │
│  - updateAnalytics()                                        │
│                                                             │
└────┬──────────────────┬────────────────────┬──────────────┘
     │                  │                    │
     ▼                  ▼                    ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  geo-map    │  │ geo-filters  │  │  geo-list    │
│             │  │              │  │              │
│ Google Maps │  │ Search box   │  │ Business     │
│ Markers     │  │ Filter ctrls │  │ list items   │
│ Popups      │  │ Clear btn    │  │ Sorting      │
└─────────────┘  └──────────────┘  └──────────────┘
                        │
                        ▼
                  ┌──────────────┐
                  │geo-analytics │
                  │              │
                  │ Summary cards│
                  │ Statistics   │
                  └──────────────┘
```

### Data Flow

```
User Action (Filter Change)
         │
         ▼
geo-filters.js (event dispatch)
         │
         ▼
geo-intelligence-view.js (handle & update state)
         │
         ▼
API Call: GET /business-listings?filters=...
         │
         ▼
Update businessList[] state
         │
    ┌────┴────┬────────┬─────────┐
    │         │        │         │
    ▼         ▼        ▼         ▼
geo-map   geo-list  geo-      view
update    update    analytics  update
         update
```

---

## 18. Glossary & Terminology

- **Business Listing:** A registered business in the chamber directory
- **Member:** A business that has paid membership dues
- **Marker:** A pin on the map representing a business location
- **Cluster:** Grouped markers showing combined count
- **Service Area:** Geographic region that a business serves
- **Geo Scope:** Chamber's organizational unit (zip code, city, county)
- **Coverage:** Total geographic area represented by current members
- **Geographic Gap:** Area with low/zero member representation
- **Heatmap:** Visual intensity map (not MVP)
- **Territory:** Assigned region for sales/service team coverage

---

## Appendix A: Sample Data Structure

```json
{
  "id": "biz_001",
  "name": "ABC Corp Retail",
  "category": "Retail",
  "address": "123 Main Street",
  "city": "Portland",
  "state": "ME",
  "zip_code": "04101",
  "lat": 43.6629,
  "lng": -70.2553,
  "phone": "207-555-1234",
  "email": "contact@abccorp.com",
  "website": "https://abccorp.example.com",
  "description": "Local retail store specializing in home goods",
  "rating": 4.2,
  "review_count": 28,
  "status": "active",
  "service_area": "Portland metro area",
  "service_area_type": "local",
  "geo_scope_type": "zip_code",
  "geo_scope_id": "04101",
  "industry_color": "#FF6B6B",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-03-28T14:30:00Z",
  "metadata": {
    "employee_count": "12-50",
    "founded_year": 2015,
    "member_since": "2020-03-01"
  }
}
```

---

## Appendix B: API Response Examples

### GET /business-listings (with filters)

**Request:**
```
GET /business-listings?location=04101&industry=Retail&status=active
```

**Response:**
```json
{
  "items": [
    {
      "id": "biz_001",
      "name": "ABC Corp",
      "city": "Portland",
      "state": "ME",
      "zip_code": "04101",
      "lat": 43.6629,
      "lng": -70.2553,
      "category": "Retail",
      "rating": 4.2,
      "status": "active",
      "service_area_type": "local",
      "geo_scope_type": "zip_code",
      "geo_scope_id": "04101"
    }
  ],
  "total": 8,
  "limit": 100,
  "offset": 0,
  "has_more": false
}
```

### GET /geo-intelligence/stats

**Request:**
```
GET /geo-intelligence/stats?filters={"location":"04101","industry":"Retail"}
```

**Response:**
```json
{
  "total_businesses": 8,
  "filtered_from": 127,
  "industries": {
    "Retail": 8,
    "Technology": 0,
    "Services": 0
  },
  "coverage": {
    "zip_codes": ["04101"],
    "counties": ["Cumberland"],
    "states": ["ME"]
  },
  "locations_by_area": {
    "Portland": 8
  },
  "average_rating": 4.25,
  "member_status_breakdown": {
    "active": 8,
    "inactive": 0,
    "pending": 0
  },
  "last_updated": "2024-03-28T14:30:00Z"
}
```

---

**Document Version:** 1.0
**Last Updated:** 2024-03-28
**Status:** Ready for Implementation
