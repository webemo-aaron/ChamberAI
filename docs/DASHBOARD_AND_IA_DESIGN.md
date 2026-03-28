# ChamberAI Dashboard & Information Architecture Design

**Version:** 1.0
**Date:** 2026-03-28
**Status:** Design Specification
**Scope:** Post-Login Dashboard, Navigation Structure, Page Layouts, Role-Based Variations

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Dashboard Design (Post-Login)](#dashboard-design-post-login)
3. [Information Architecture Structure](#information-architecture-structure)
4. [Responsive Navigation](#responsive-navigation)
5. [Page Layout Templates](#page-layout-templates)
6. [Feature Page Designs](#feature-page-designs)
7. [Multi-Role Dashboard Variations](#multi-role-dashboard-variations)
8. [Navigation Flow Diagrams](#navigation-flow-diagrams)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Empty States & Onboarding](#empty-states--onboarding)
11. [Accessibility Features](#accessibility-features)
12. [Implementation Sequence](#implementation-sequence)

---

## Executive Summary

ChamberAI is a comprehensive AI-powered platform for chamber of commerce management. This design specification defines:

- **Dashboard architecture** that communicates four core intelligence features
- **Information architecture** organized into three semantic sections (Intelligence, Operations, Admin)
- **Responsive navigation** from desktop (220px sidebar) to mobile (bottom navigation bar)
- **Eight page layout templates** for meetings, business, geography, chat, settings, analytics, billing, and admin
- **Role-based variations** for Executives, Staff, Members, and Public visitors
- **Empty states and onboarding** to guide new users through platform capabilities

This specification emphasizes:
- **Role-based access control** - Different users see different features
- **Intelligent feature discovery** - Users understand what ChamberAI can do immediately
- **Responsive mobile experience** - Native-feeling UX at all breakpoints
- **Accessibility first** - WCAG 2.1 AA compliant with high contrast and keyboard navigation

---

## Dashboard Design (Post-Login)

### Dashboard Overview & Purpose

The dashboard is the first page users see after login. It serves as:
1. **Feature discovery hub** - Show what ChamberAI can do
2. **Quick access launcher** - One-click entry to key features
3. **Status snapshot** - Key metrics at a glance
4. **Personalized greeting** - Role-based welcome message
5. **Recent activity** - What happened since last login

### Dashboard Mockup (Executive View)

```
┌─────────────────────────────────────────────────────────────────┐
│  ChamberAI                                    👤 John | Settings │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Welcome back, John                              Executive Role ││
│ │ Last login: Mar 28, 2026 at 2:30 PM                         ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ KEY METRICS                                                  ││
│ │ ┌──────────┬──────────┬──────────┬──────────┐              ││
│ │ │ Meetings │ Members  │ Actions  │ AI Help  │              ││
│ │ │    12    │    345   │    48    │   1.2K   │              ││
│ │ │ Managed  │Verified  │ Pending  │ Requests │              ││
│ │ └──────────┴──────────┴──────────┴──────────┘              ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ QUICK ACTIONS                                                ││
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        ││
│ │ │ + Create │ │   Browse │ │  Analyze │ │   Chat   │        ││
│ │ │ Meeting  │ │Directory │ │ Coverage │ │ with AI  │        ││
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘        ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ INTELLIGENCE FEATURES                                        ││
│ │                                                              ││
│ │ ┌────────────────────┬────────────────────┐               ││
│ │ │ 🎯 Meetings        │ 🏢 Business Hub    │               ││
│ │ │ Intelligence       │ Intelligence       │               ││
│ │ │ AI-powered         │ Verified member    │               ││
│ │ │ meeting mgmt       │ directory & rates  │               ││
│ │ │ [Learn More →]     │ [Learn More →]     │               ││
│ │ └────────────────────┴────────────────────┘               ││
│ │ ┌────────────────────┬────────────────────┐               ││
│ │ │ 🗺️ Geographic      │ 🤖 AI Kiosk        │               ││
│ │ │ Intelligence       │ RAG Assistant      │               ││
│ │ │ Territory & coverage│ Smart Q&A for      │               ││
│ │ │ mapping            │ members & visitors │               ││
│ │ │ [Learn More →]     │ [Learn More →]     │               ││
│ │ └────────────────────┴────────────────────┘               ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ RECENT ACTIVITY (Last 5 Items)                              ││
│ │ ┌─────────────────────────────────────────────────────────┐││
│ │ │ ✓ Board Meeting (Mar 28) - Minutes approved              │││
│ │ │ ✓ ABC Corp - New business verified                      │││
│ │ │ ↑ 3 pending action items from Finance Committee          │││
│ │ │ + John Smith asked about chamber services (AI Kiosk)     │││
│ │ │ ↑ Geographic coverage now 87% downtown corridor          │││
│ │ └─────────────────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ UPCOMING EVENTS                                              ││
│ │ • Apr 2 - Monthly Board Meeting at 10:00 AM                ││
│ │ • Apr 9 - Finance Committee at 2:00 PM                     ││
│ │ • Apr 15 - Member Networking Event at 6:00 PM              ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ANALYTICS SNAPSHOT                                           ││
│ │ Meetings this month: 4  |  Members joined: 8  |  NPS: 42    ││
│ │ [View Full Analytics →]                                      ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Components

#### 1. Welcome Section
```
┌──────────────────────────────────────────┐
│ Welcome back, [User Name]                │
│ [Role Badge]                             │
│ Last login: Mar 28, 2026 at 2:30 PM      │
└──────────────────────────────────────────┘
```

**Content:**
- Personalized greeting with user's first name
- Role badge (Executive, Staff, Member, Visitor)
- Last login timestamp
- Conditional content based on role

#### 2. Key Statistics Section
```
┌──────────┬──────────┬──────────┬──────────┐
│ Meetings │ Members  │ Actions  │ AI Help  │
│    12    │    345   │    48    │   1.2K   │
│ Managed  │Verified  │ Pending  │ Requests │
└──────────┴──────────┴──────────┴──────────┘
```

**Metrics by Role:**

| Metric | Executives | Staff | Members | Public |
|--------|-----------|-------|---------|--------|
| Meetings Managed | ✓ | ✓ | ✗ | ✗ |
| Verified Members | ✓ | ✓ | Partial | ✗ |
| Pending Actions | ✓ | ✓ | Their own | ✗ |
| AI Interactions | ✓ | ✓ | ✓ | ✓ |
| Admin Tasks | ✓ | ✗ | ✗ | ✗ |
| Revenue/Billing | ✓ | ✗ | ✗ | ✗ |

#### 3. Quick Action Buttons
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ + Create │ │  Browse  │ │ Analyze  │ │  Chat    │
│ Meeting  │ │Directory │ │ Coverage │ │ with AI  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Button Specifications:**
- **Create Meeting** → #/meetings (POST form)
- **Browse Directory** → #/business-hub
- **Analyze Coverage** → #/geo-intelligence
- **Chat with AI** → Opens AI Kiosk widget or #/kiosk

**Visibility by Role:**
- Executive: All 4 visible
- Staff: All 4 visible
- Member: Browse Directory, Chat visible (Create/Analyze hidden)
- Public: Chat only (in modal, no navigation)

#### 4. Intelligence Feature Cards (4 Cards)

Each card is a 2x2 grid layout on desktop, stacking vertically on mobile.

**Card Template:**
```
┌────────────────────────┐
│ 🎯 Feature Title       │
│                        │
│ Brief description of   │
│ what this does and     │
│ why users care.        │
│                        │
│ [Learn More →] [Open →]│
└────────────────────────┘
```

**Card 1: Meetings Intelligence**
- **Icon:** 🎯 (target/meetings)
- **Title:** Meetings Intelligence
- **Description:** AI-powered meeting management. Draft minutes with AI, manage motions, track action items, and ensure compliance.
- **CTA:** "Learn More" → Help docs | "Open" → #/meetings

**Card 2: Business Hub Intelligence**
- **Icon:** 🏢 (building/business)
- **Title:** Business Hub Intelligence
- **Description:** Verified member directory with ratings, reviews, and business intelligence. Analyze industries and service areas.
- **CTA:** "Learn More" → Help docs | "Open" → #/business-hub

**Card 3: Geographic Intelligence**
- **Icon:** 🗺️ (map)
- **Title:** Geographic Intelligence
- **Description:** Map-based location analysis. Visualize member coverage, analyze service areas, and plan territories.
- **CTA:** "Learn More" → Help docs | "Open" → #/geo-intelligence

**Card 4: AI Kiosk**
- **Icon:** 🤖 (robot)
- **Title:** AI Kiosk (RAG Assistant)
- **Description:** Smart Q&A powered by semantic search. Members get private mode with chamber context. Public visitors get public mode.
- **CTA:** "Learn More" → Help docs | "Open" → Opens widget or #/kiosk

#### 5. Recent Activity Feed
```
┌────────────────────────────────────────────┐
│ RECENT ACTIVITY (Last 5 Items)             │
├────────────────────────────────────────────┤
│ ✓ Board Meeting (Mar 28) - Minutes approved│
│ ✓ ABC Corp - New business verified         │
│ ↑ 3 pending action items from Finance Cmte │
│ + John Smith asked about services (Kiosk)  │
│ ↑ Geographic coverage now 87% downtown     │
└────────────────────────────────────────────┘
```

**Activity Types:**
- **✓ Completed** - Meeting approved, business verified
- **↑ Requires Attention** - Pending items, coverage changes
- **+** - New submission, new inquiry
- **⚠** - Warnings, errors

**Click Behavior:** Each item links to relevant detail page
- "Board Meeting" → #/meetings/[id]
- "ABC Corp" → #/business-hub/[id]
- "Pending actions" → #/meetings/[id]/actions
- "AI Kiosk inquiry" → #/kiosk or detail modal

#### 6. Calendar Widget
```
┌────────────────────────────────────────┐
│ UPCOMING EVENTS                        │
├────────────────────────────────────────┤
│ • Apr 2 - Monthly Board Meeting 10am   │
│ • Apr 9 - Finance Committee 2pm        │
│ • Apr 15 - Networking Event 6pm        │
└────────────────────────────────────────┘
```

**Features:**
- Shows next 3-5 upcoming events
- Clickable to view meeting detail
- Filter by meeting type (all, board, committees)
- "View Calendar" link to full calendar view

#### 7. Analytics Summary
```
┌────────────────────────────────────────────┐
│ ANALYTICS SNAPSHOT                         │
│ Meetings this month: 4                     │
│ Members joined: 8                          │
│ NPS Score: 42                              │
│ [View Full Analytics →]                    │
└────────────────────────────────────────────┘
```

**Visibility:** Executives and Staff only

#### 8. Empty State (New User)
```
┌────────────────────────────────────────────┐
│                                            │
│     Welcome to ChamberAI! 🎉               │
│                                            │
│  Let's get you started:                    │
│                                            │
│  1. Create your first meeting              │
│     [Start Here →]                         │
│                                            │
│  2. Build your member directory             │
│     [Import or Add Members →]              │
│                                            │
│  3. Explore AI features                    │
│     [Tour the Platform →]                  │
│                                            │
│  Need help? [Contact Support]              │
│                                            │
└────────────────────────────────────────────┘
```

---

## Information Architecture Structure

### Semantic Navigation Organization

ChamberAI navigation is organized into **4 semantic sections** that reflect how users think about their work:

```
ChamberAI
├── INTELLIGENCE (Primary Features)
│   ├── 🎯 Meetings
│   ├── 🏢 Business Hub
│   ├── 🗺️ Geographic
│   └── 🤖 AI Kiosk
│
├── OPERATIONS (Running the Chamber)
│   ├── ⚙️ Settings
│   ├── 📊 Analytics
│   └── 💳 Billing
│
├── ADMIN (Management Only)
│   ├── 🔑 Stripe Management
│   ├── 📦 Product Management
│   └── 👥 User Management
│
└── ACCOUNT (Personal)
    ├── 👤 Profile
    ├── ⚙️ Preferences
    └── 🚪 Logout
```

### Desktop Sidebar Navigation

**Layout:** 220px fixed sidebar on left side of all pages

```
┌─────────────────────┐
│      ChamberAI      │ ← Logo/brand (40px height)
├─────────────────────┤
│ 🎯 Meetings         │ ← INTELLIGENCE section
│ 🏢 Business Hub     │
│ 🗺️ Geographic       │
│ 🤖 AI Kiosk         │
│                     │
│ ⚙️ Settings         │ ← OPERATIONS section
│ 📊 Analytics        │
│ 💳 Billing          │
│                     │
│ 🔑 Stripe Mgmt      │ ← ADMIN (conditional)
│ 📦 Product Mgmt     │
│ 👥 User Mgmt        │
│                     │
│ ─────────────────── │ ← Visual divider
│                     │
│ 👤 John Smith       │ ← User identity chip
│ Executive           │   (name, role)
│ 🚪 Logout           │
│                     │
└─────────────────────┘
```

### Navigation Item Specifications

| Item | Icon | Route | Visibility | Description |
|------|------|-------|------------|-------------|
| Meetings | 🎯 | #/meetings | All authenticated | Meeting management, minutes, motions, actions |
| Business Hub | 🏢 | #/business-hub | All authenticated | Member directory, verification, ratings |
| Geographic | 🗺️ | #/geo-intelligence | Exec, Staff | Map, territory, coverage analysis |
| AI Kiosk | 🤖 | #/kiosk | All authenticated | Chat interface to RAG assistant |
| Settings | ⚙️ | #/settings | Exec, Staff | Feature flags, retention, notifications, integrations |
| Analytics | 📊 | #/analytics | Exec, Staff | Metrics, charts, reporting (Council tier+) |
| Billing | 💳 | #/billing | Exec | Subscription, usage, payment method |
| Stripe Mgmt | 🔑 | #/admin/stripe | Admin | Products, prices, webhooks |
| Product Mgmt | 📦 | #/admin/products | Admin | Feature flags, configuration |
| User Mgmt | 👥 | #/admin/users | Admin | Users, roles, permissions, audit log |
| Profile | 👤 | #/profile | All authenticated | User settings, preferences |
| Logout | 🚪 | Logout | All authenticated | End session |

### Sidebar Styling

**Default State:**
- Background: White (#ffffff)
- Text color: Dark gray (#333333)
- Icon size: 20px
- Item padding: 12px 16px
- Font size: 14px
- Border: Light gray border on right (1px)

**Hover State:**
- Background: Light gray (#f5f5f5)
- Text: Dark blue (#0066cc)
- Cursor: Pointer

**Active State (Current Page):**
- Background: Very light blue (#e6f2ff)
- Text: Dark blue (#0066cc)
- Left border: 4px solid blue (#0066cc)
- Left padding adjusted to account for border

**Section Headers (Non-clickable):**
- Text: Medium gray (#666666)
- Font size: 11px
- Font weight: Bold
- Letter spacing: 1px
- All caps: YES
- Padding: 16px 16px 8px 16px

### Top Navbar

**Layout:** Spans full width above sidebar content

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back | Page Title                          Search  👤 Menu │
└──────────────────────────────────────────────────────────────┘
```

**Components:**
- **Back Arrow:** Mobile/tablet only, navigates to previous page
- **Page Title:** Full title of current page (e.g., "Meetings Intelligence")
- **Search:** Global search input (meetings, members, features)
- **User Menu:** Dropdown with Profile, Preferences, Logout
- **Notification Bell:** Shows unread activity count

**Height:** 56px (touch-friendly)
**Background:** White with light shadow
**Border:** Light gray bottom border (1px)

---

## Responsive Navigation

### Desktop (>900px)

**Sidebar:** Always visible, 220px fixed width
**Layout:** Sidebar + full-width content
**Navigation:** Always accessible

```
┌─────────────┬─────────────────────────────────────────┐
│             │                                         │
│  Sidebar    │         Main Content                    │
│  (220px)    │         (Remaining width)               │
│             │                                         │
│             │                                         │
└─────────────┴─────────────────────────────────────────┘
```

### Tablet (600-900px)

**Sidebar:** Visible but narrower (180px or 160px)
**Navigation items:** Icon + text remains readable
**Main content:** Adjusts to remaining space

```
┌──────────┬────────────────────────────────┐
│          │                                │
│Sidebar   │    Main Content                │
│(160px)   │    (Adjusted width)            │
│          │                                │
└──────────┴────────────────────────────────┘
```

**Responsive adjustments:**
- Icon size: 18px (down from 20px)
- Item padding: 10px 12px (down from 12px 16px)
- Font size: 13px (down from 14px)
- Sidebar width: 160px
- User chip font: 12px

### Mobile (<600px)

**Sidebar:** Hidden, replaced with bottom navigation bar
**Layout:** Full-width content with bottom nav
**Navigation:** Icon-only tabs (6-8 main sections)

```
┌─────────────────────────────────────────┐
│                                         │
│        Full-Width Content               │
│        (Entire screen width)            │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 📋  🏢  🗺️  🤖  ⚙️  👤  ⋯             │ ← Bottom nav
└─────────────────────────────────────────┘
```

**Bottom Navigation Bar Specifications:**
- Height: 56px (touch-friendly, 48px min)
- Position: Fixed to bottom of viewport
- Background: White (#ffffff)
- Border: Light gray top border (1px)
- Safe area: accounts for device notches

**Bottom Nav Items (6 main tabs + more):**
1. **📋 Meetings** → #/meetings
2. **🏢 Business** → #/business-hub
3. **🗺️ Geographic** → #/geo-intelligence
4. **🤖 AI Kiosk** → #/kiosk
5. **⚙️ Settings** → #/settings
6. **👤 Account** → #/profile
7. **⋯ More** → Drawer/modal with additional items

**Item Styling:**
- Icon: 24px
- Label: 10px, underneath icon (optional on very small screens)
- Color: Dark gray (#666666)
- Active color: Blue (#0066cc)
- Padding: 8px 12px
- Tap target: 48x48px minimum

**Active Indicator:** Blue icon + underline or pill background

### Breakpoint Summary

| Breakpoint | Width | Sidebar | Bottom Nav | Key Changes |
|------------|-------|---------|-----------|-------------|
| Desktop | >900px | 220px visible | Hidden | Full navigation visible |
| Tablet | 600-900px | 160px visible | Hidden | Narrower sidebar, content adjusts |
| Mobile | <600px | Hidden | 56px visible | Icon-only navigation, full-width content |
| Small Mobile | <480px | Hidden | 56px visible | Single-column layout, oversized touch targets |

---

## Page Layout Templates

ChamberAI uses 8 distinct page layout templates optimized for different content types and user tasks.

### Template 1: Full-Page List + Header

**Purpose:** Browse/search/filter collections (meetings, members)
**Used By:** Meetings Intelligence, Business Hub (list views)

```
┌──────────────────────────────────────────────────────┐
│ Page Title                      [+ Create Button]    │
│ Brief description or subheader                       │
├──────────────────────────────────────────────────────┤
│ [Search] [Filter] [Sort] [View Toggle]              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Item 1                                       │  │
│  │ Metadata, date, status                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Item 2                                       │  │
│  │ Metadata, date, status                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [Pagination: ← Previous | Page 1 of 5 | Next →]  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Header Section:**
- Page title (h1)
- Brief description/subheader (optional)
- Primary CTA button (create/add/import)
- Location: Top of page, fixed height ~80px

**Filter & Search Section:**
- Search input field (with debounce)
- Filter dropdowns/checkboxes
- Sort options
- View toggle (list/card/table)
- Clear all filters button
- Location: Below header, can be sticky on scroll

**List Content:**
- Cards or table rows (depends on view toggle)
- Each item clickable to detail view
- Hover state: subtle background change
- Selected state: highlight or checkbox

**Pagination:**
- Previous/Next buttons
- Page indicator
- Jump to page input
- Items per page selector (10/25/50)

### Template 2: Full-Page Detail + Tabs

**Purpose:** View and manage a single item with multiple views
**Used By:** Meeting detail, Business detail

```
┌──────────────────────────────────────────────────────┐
│ ← Back | Item Title           [Edit] [Delete] [Share]│
│ Metadata: Date, Location, Status                     │
├──────────────────────────────────────────────────────┤
│ Minutes | Actions | Motions | Audit | Summary        │ ← Tabs
├──────────────────────────────────────────────────────┤
│                                                      │
│     Tab content goes here, full width               │
│     Content area stretches to fill height           │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Header Section:**
- Back button (navigation)
- Item title (h1)
- Key metadata (date, location, status)
- Action buttons (Edit, Delete, Share, Export, etc.)

**Tab Bar:**
- Horizontal tabs below header
- Sticky on scroll (stays visible)
- Active tab: bold, underline, or pill background
- Inactive tabs: gray text
- Tab content lazy-loads on click

**Content Area:**
- Full width below tab bar
- Scrollable vertically
- Preserves tab state during scroll
- Loading states for async data

### Template 3: Map-Based Layout

**Purpose:** Visualize geographic data with location markers
**Used By:** Geographic Intelligence

```
┌────────────────────────────────────────────────────────┐
│ Page Title                                             │
├────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐ ┌──────────────┐│
│  │                                 │ │ ⊕ [Search]   ││
│  │                                 │ │              ││
│  │     Google Map (Full Height)    │ │ [Filters]    ││
│  │                                 │ │              ││
│  │                                 │ │ Businesses:  ││
│  │                                 │ │ □ ABC Corp   ││
│  │     Markers, Clustering         │ │ □ XYZ LLC    ││
│  │                                 │ │              ││
│  │                                 │ │ [Stats]      ││
│  │                                 │ │ 345 Total    ││
│  │                                 │ │ 8 Industries ││
│  │                                 │ │              ││
│  └─────────────────────────────────┘ └──────────────┘│
└────────────────────────────────────────────────────────┘
```

**Map Section:**
- Full-width Google Map
- Responsive: takes available height (min 400px)
- Markers for each business location
- Color-coded by industry or status
- Clustering on zoom out
- Click marker → popup with business info
- Click popup → navigate to business detail

**Sidebar Controls (Right or Left):**
- Search input
- Filter controls (industry, rating, service area)
- Business list (sortable, searchable)
- Analytics summary
- On mobile: floating panel or drawer

**Map Controls:**
- Zoom in/out buttons
- Reset to fit all markers
- Satellite/street toggle
- Full screen button (mobile)

### Template 4: Chat Interface

**Purpose:** Conversational AI interaction
**Used By:** AI Kiosk

```
┌────────────────────────────────────────────────┐
│  ChamberAI Assistant                  ⓘ | ✕    │ ← Header
├────────────────────────────────────────────────┤
│                                                │
│  Assistant: Hi! How can I help?                │
│                                                │
│  You: What's on the board agenda?              │
│                                                │
│  Assistant: The board meeting next Tuesday...  │
│                                                │
│  ⋮ [Load earlier messages]                     │
│                                                │
│                                                │
├────────────────────────────────────────────────┤
│ [⌨️ Type a message...]              [Send ▶]   │ ← Input
├────────────────────────────────────────────────┤
│ Suggested: [Agenda] [Minutes] [Actions] [Help] │ ← Suggestions
└────────────────────────────────────────────────┘
```

**Header:**
- Assistant name/title
- Info button (about, scope, privacy)
- Close button (if modal)

**Message List:**
- Scrollable conversation history
- Assistant messages: right-aligned, blue background
- User messages: left-aligned, gray background
- Typing indicator while waiting
- Load older messages button at top

**Input Section:**
- Text input field (expandable)
- Send button
- Attachment button (if applicable)
- Suggested follow-up buttons

**Full-Screen Variant:**
- Same layout but spans entire screen
- Accessible from navigation

**Modal Variant:**
- Smaller version for embedded/floating widget
- Positioned bottom-right or overlay
- Can be dragged/minimized

### Template 5: Form/Settings Page

**Purpose:** Configuration and data input
**Used By:** Settings, Profile, Feature Flags

```
┌────────────────────────────────────────────────┐
│ Settings & Configuration                       │
├────────────────────────────────────────────────┤
│ Tab 1 | Tab 2 | Tab 3 | Tab 4                  │ ← Tabs
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Setting Section 1                        │ │
│  │ Description of what this controls        │ │
│  │                                          │ │
│  │ ☑ Feature enabled                        │ │
│  │ [Dropdown: Value 1 ▼]                    │ │
│  │ [Input: ..................]              │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Setting Section 2                        │ │
│  │ [Radio ◯ Option A]                       │ │
│  │ [Radio ◉ Option B]                       │ │
│  │ [Radio ◯ Option C]                       │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [⚠ Unsaved Changes]                         │
│  [Cancel]  [Save Settings]                    │
│                                                │
└────────────────────────────────────────────────┘
```

**Tab Navigation:**
- Horizontal tabs
- Each tab is a settings category
- Tab state persists on page

**Settings Sections:**
- Grouped logically (2-4 sections per tab)
- Section header + description
- Form controls (toggles, dropdowns, inputs, radio buttons)
- Help text below each control

**Form Controls:**
- Toggles: Switch/checkbox for on/off
- Dropdowns: For single selection
- Radio buttons: For exclusive options
- Inputs: Text, number, email, date
- Text areas: For longer text

**Save Section:**
- Unsaved changes indicator (yellow banner)
- Cancel button (revert to last saved)
- Save button (primary action)
- Success/error message after save
- Loading state during save

### Template 6: Table/Analytics Page

**Purpose:** Data visualization and reporting
**Used By:** Analytics, Admin panels

```
┌────────────────────────────────────────────────┐
│ Analytics & Insights                           │
│ Date range: [Mar 1 - Mar 28, 2026] [Update]   │
├────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┬─────────┐   │
│  │ Total   │ Members │ Actions │ AI Help │   │
│  │ 12      │ 345     │ 48      │ 1.2K    │   │ ← Summary cards
│  │ Meetings│ Verified│ Pending │ Requests│   │
│  └─────────┴─────────┴─────────┴─────────┘   │
│                                               │
│  ┌──────────────────────────────────────────┐│
│  │ Meetings Over Time (Line Chart)          ││
│  │ ▄▃▃▄▅▇█▆▅▄▃▂▁                           ││
│  │                                          ││
│  └──────────────────────────────────────────┘│
│                                               │
│  ┌────────────────┐  ┌──────────────────────┐│
│  │ Members by     │  │ Action Item Status   ││
│  │ Industry       │  │                      ││
│  │ (Pie)          │  │ ███ Completed: 45%  ││
│  │                │  │ ███ Pending: 38%    ││
│  │                │  │ ███ Overdue: 17%    ││
│  └────────────────┘  └──────────────────────┘│
│                                               │
│  [Export as CSV] [Export as PDF]              │
│                                               │
└────────────────────────────────────────────────┘
```

**Summary Section:**
- KPI cards (4-6 metrics)
- Large number + label
- Trend indicator (↑ green, ↓ red)
- Click card for details

**Charts:**
- Multiple chart types (line, pie, bar, etc.)
- Interactive: hover for details
- Legend below chart
- Full-width on mobile, side-by-side on desktop

**Table (if included):**
- Sortable columns
- Filterable rows
- Pagination
- Export buttons

**Date Range Filter:**
- Preset options (Last 7 days, Last 30 days, This month, Custom)
- Custom date picker
- Update/Apply button

### Template 7: Billing/Subscription Page

**Purpose:** Manage subscription and payment
**Used By:** Billing page

```
┌────────────────────────────────────────────────┐
│ Subscription & Billing                         │
├────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐ │
│  │ Current Plan: COUNCIL                    │ │
│  │ $149/month                               │ │
│  │ Renews: May 28, 2026                     │ │
│  │ [Manage Subscription →]                  │ │
│  │ [Cancel Plan]                            │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────┐  ┌──────────────┐ ┌───────┐│
│  │ PRO          │  │ COUNCIL      │ │ FREE  ││
│  │ $29/mo       │  │ $149/mo      │ │ Free  ││
│  │ [CURRENT]    │  │ [Upgrade]    │ │ Trial ││
│  └──────────────┘  └──────────────┘ └───────┘│
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Usage This Month                         │ │
│  │ Meetings: 12 / unlimited                 │ │
│  │ Members: 345 / unlimited                 │ │
│  │ Storage: 2.3GB / 100GB                   │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Payment Method                           │ │
│  │💳 Visa ending in 4242                   │ │
│  │ Expires: 12/2027                         │ │
│  │ [Update Payment Method]                  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Billing History                          │ │
│  │ • Mar 28, 2026 - $149.00 - PDF           │ │
│  │ • Feb 28, 2026 - $149.00 - PDF           │ │
│  │ • Jan 28, 2026 - $149.00 - PDF           │ │
│  │ [View All →]                             │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

**Sections:**
- Current plan card (prominent, highlighted)
- Plan comparison cards (upgrade options)
- Usage display (progress bars)
- Payment method card
- Billing history table/list
- Invoice download links

### Template 8: Admin Panel

**Purpose:** System management and administration
**Used By:** Stripe Management, Product Management, User Management

```
┌────────────────────────────────────────────────┐
│ Admin: User Management                         │
├────────────────────────────────────────────────┤
│ [+ Add User] [Import] [Export]   [Search] ✕   │
├────────────────────────────────────────────────┤
│ Name          | Email           | Role | Actions
│─────────────────────────────────────────────────│
│ John Smith    | john@chamber... | Exec | ⚙️ ✕ │
│ Jane Doe      | jane@chamber... | Staff| ⚙️ ✕ │
│ Bob Johnson   | bob@chamber.... | Memb | ⚙️ ✕ │
│                                                │
│ [← Prev] Page 1 of 2 [Next →]                │
│                                                │
└────────────────────────────────────────────────┘
```

**Table Structure:**
- Column headers (sortable)
- Rows of data
- Action buttons per row (edit, delete, etc.)
- Bulk actions (top toolbar)

**Toolbar:**
- Add/Import buttons
- Search/filter
- Export button
- Bulk action checkboxes

**Row Actions:**
- Settings/Edit icon
- Delete icon
- More actions menu (if more than 2 actions)

---

## Feature Page Designs

### Meetings Intelligence Page

**URL:** #/meetings
**Template:** Full-page list + detail view (split or modal)
**Roles:** Executives, Staff, Members (partial)

#### Meeting List View

```
┌──────────────────────────────────────────────────────────┐
│ 🎯 Meetings Intelligence                   [+ Meeting]   │
│ AI-powered meeting management                           │
├──────────────────────────────────────────────────────────┤
│ [🔍 Search] [📅 Date] [📍 Location] [⊙ Status] [↕ Sort] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Board Meeting                           Mar 28, 10am │
│ │📍 Downtown Conference Center                       │
│ │ ✓ Approved | 12 attendees | 8 action items       │
│ │ Minutes: Draft → Ready for Review                │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Finance Committee Meeting                Mar 15, 2pm │
│ │ 📍 Downtown Conference Center                       │
│ │ ✓ Approved | 8 attendees | 3 action items        │
│ │ Minutes: Final                                    │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Strategic Planning Session                Mar 8, 1pm │
│ │ 📍 Virtual (Zoom)                                   │
│ │ ⊙ Scheduled | 15 attendees | 5 action items      │
│ │ Minutes: Draft (0% complete)                      │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [← Prev] Page 1 of 3 [Next →]                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Card Display:**
- Location (📍 icon)
- Date and time
- Status badge (Scheduled, In-Progress, Approved, Archived)
- Attendee count
- Action items count
- Minutes status (Draft, Ready for Review, Final)
- Click to navigate to detail

**Filters:**
- **Date Range:** Last week, This month, Date picker
- **Status:** Scheduled, In-Progress, Approved, Archived
- **Location:** Dropdown of meeting locations
- **Sort:** Date (newest/oldest), Location, Status

**Search:** Full-text search of meeting title, location, description

#### Meeting Detail View

**URL:** #/meetings/[id]

```
┌──────────────────────────────────────────────────────┐
│ ← Board Meeting       Mar 28, 10am  [Edit] [Delete]  │
│ 📍 Downtown Conference Center  | ✓ Approved          │
├──────────────────────────────────────────────────────┤
│ Minutes | Actions | Motions | Audit | Summary        │ ← Tabs
├──────────────────────────────────────────────────────┤
│                                                      │
│ MINUTES TAB:                                         │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ Minutes                                          ││
│ │ Generated by AI on Mar 28, 11:30am               ││
│ │                                                  ││
│ │ Call to Order: Meeting called to order...       ││
│ │ ...                                              ││
│ │ Adjournment: Meeting adjourned at 11:50am      ││
│ │                                                  ││
│ │ [✎ Edit] [⊙ Draft] → [Ready for Review] → Final ││
│ │                                                  ││
│ │ Version history: Current | Mar 28, 10:05am      ││
│ │                                                  ││
│ │ [Rollback] [Export: PDF] [Export: Markdown]    ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ ACTIONS TAB:                                         │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ ✓ Follow up with members (Due: Apr 2)           ││
│ │   Assigned to: Jane Doe | Status: On track      ││
│ │                                                  ││
│ │ ✓ Prepare budget report (Due: Apr 1)            ││
│ │   Assigned to: Bob Smith | Status: Completed   ││
│ │                                                  ││
│ │ ⊙ Finalize venue for event (Due: Apr 5)        ││
│ │   Assigned to: John Johnson | Status: At Risk  ││
│ │                                                  ││
│ │ [+ Add Action Item]                             ││
│ │ [⬇ Export as CSV]                               ││
│ │ [⬇ Export as Excel]                             ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Tab Specifications:**

1. **Minutes Tab:**
   - AI-generated minutes text (editable)
   - Status badges (Draft, Ready for Review, Final)
   - Version history
   - Rollback button
   - Export (PDF, Markdown)
   - Edit button to toggle edit mode

2. **Actions Tab:**
   - List of action items
   - Checkbox to mark complete
   - Due date
   - Assignee
   - Status (On track, At risk, Completed, Overdue)
   - Add new action item button
   - Export options (CSV, Excel, PDF)

3. **Motions Tab:**
   - List of motions/resolutions discussed
   - Motion text
   - Vote count (approve/oppose/abstain)
   - Approval status (Approved, Rejected, Pending)
   - Approval gate: if all required roles haven't approved, show pending approvals
   - Add motion button
   - Vote buttons if user is authorized

4. **Audit Tab:**
   - Compliance checklist
   - Required documentation
   - Governance rules
   - Audit trail of changes
   - Who made changes, when, what changed

5. **Summary Tab:**
   - Executive summary of meeting
   - Key decisions made
   - Next steps
   - Who to follow up with
   - Links to related items

### Business Directory/Business Hub Page

**URL:** #/business-hub
**Template:** Full-page list + detail view
**Roles:** All authenticated users

#### Business List View

```
┌──────────────────────────────────────────────────────────┐
│ 🏢 Business Hub                         [+ Add Business] │
│ Verified Members Directory                              │
├──────────────────────────────────────────────────────────┤
│ [🔍 Search] [🏷️ Category] [⭐ Rating] [📍 Area] [View] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Logo] ABC Corporation              ✓ Verified    │ │
│ │ Consulting & Strategy                             │
│ │ ⭐⭐⭐⭐⭐ (4.8) 24 reviews                        │
│ │ Downtown | Service area: 5 counties               │
│ │ "Strategic consulting for growing businesses"    │
│ │ [View Details →]                                  │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Logo] XYZ Professional Services       ✓ Verified │ │
│ │ Accounting & Bookkeeping                          │
│ │ ⭐⭐⭐⭐ (4.5) 12 reviews                         │
│ │ Midtown | Service area: City & suburbs            │
│ │ "Full-service accounting for nonprofits"         │
│ │ [View Details →]                                  │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Logo] Tech Innovations LLC            ✓ Verified │ │
│ │ IT Services & Software Development                │
│ │ ⭐⭐⭐⭐⭐ (5.0) 8 reviews                         │
│ │ Tech Park | Service area: Regional                │
│ │ "Custom software solutions for enterprises"      │
│ │ [View Details →]                                  │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ [← Prev] Page 1 of 12 [Next →]                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Card Display:**
- Business logo/image
- Business name
- Verified badge (✓ with blue color)
- Category/industry tag
- Star rating + review count
- Location
- Service area
- Brief description
- Click to navigate to detail

**Filters:**
- **Category:** Multi-select of industries
- **Rating:** Filter by minimum rating (4+, 4.5+, 5.0)
- **Location:** Geographic area
- **Service Area:** Does business serve this area?

**Search:** Business name, owner name, keywords

**View Toggle:** Cards (default) or Table

#### Business Detail View

```
┌──────────────────────────────────────────────────────┐
│ ← ABC Corporation                         [Edit]      │
│ ✓ Verified Member | ⭐⭐⭐⭐⭐ (4.8, 24 reviews)   │
│ Founded: 2010 | Downtown | 50+ employees            │
├──────────────────────────────────────────────────────┤
│ Profile | Geographic | Reviews | Quotes | AI Search │ ← Tabs
├──────────────────────────────────────────────────────┤
│                                                      │
│ PROFILE TAB:                                         │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ Business Information                             ││
│ │ Industry: Consulting & Strategy                 ││
│ │ Employees: 50+                                   ││
│ │ Service Area: 5-county region                   ││
│ │ Website: www.abccorp.com                        ││
│ │ Phone: (555) 123-4567                           ││
│ │ Email: info@abccorp.com                         ││
│ │ Contact: John Smith (Owner)                     ││
│ │                                                  ││
│ │ Description:                                     ││
│ │ "ABC Corporation provides strategic consulting  ││
│ │  services to growing businesses in the region.  ││
│ │  We specialize in business growth strategy,     ││
│ │  operational efficiency, and market analysis."  ││
│ │                                                  ││
│ │ Services:                                        ││
│ │ • Strategic planning & consulting               ││
│ │ • Market analysis & research                    ││
│ │ • Operational process improvement               ││
│ │ • Leadership coaching                           ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ GEOGRAPHIC TAB:                                      │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ Map showing service area (highlighted regions)  ││
│ │                                                  ││
│ │ Service Statistics:                              ││
│ │ • Coverage: 5 counties in [State]               ││
│ │ • Primary area: Downtown & adjacent             ││
│ │ • Remote capability: Yes                         ││
│ │ • Expansion plans: National presence (Q4 2026)  ││
│ │                                                  ││
│ │ [View competitors in area]                       ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Tab Specifications:**

1. **Profile Tab:**
   - Logo/header image
   - Business name, verified badge
   - Industry/category
   - Contact info (phone, email, website)
   - Description
   - Services/products offered
   - Employees, founded date
   - Edit button

2. **Geographic Tab:**
   - Map showing service area
   - Coverage statistics
   - Nearby businesses
   - Expansion plans
   - Distance to downtown/CBD

3. **Reviews Tab:**
   - Star rating breakdown
   - Individual reviews (text, rating, reviewer)
   - Add review button (if permissions allow)
   - Filter by rating

4. **Quotes Tab:**
   - Quote request list
   - Status of each quote
   - Request new quote button
   - View/download quote documents

5. **AI Search Tab:**
   - Search this business across all chamber data
   - Find related information
   - View connections to other members

### Geographic Intelligence Page

**URL:** #/geo-intelligence
**Template:** Map-based layout
**Roles:** Executives, Staff

```
┌──────────────────────────────────────────────────────────────┐
│ 🗺️ Geographic Intelligence                                  │
│ Territory & Coverage Analysis                                │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ ┌────────────┐ │
│ │                                          │ │ [🔍 Srch] │ │
│ │                                          │ ├────────────┤ │
│ │      Google Map (Full Height)            │ │ Filters:  │ │
│ │      Markers by business location        │ │ Category: │ │
│ │      Color-coded by industry             │ │ [All ▼]   │ │
│ │      Clusters when zoomed out            │ │           │ │
│ │                                          │ │ Rating:   │ │
│ │      Click marker → popup → detail       │ │ [4+ ▼]    │ │
│ │                                          │ │           │ │
│ │                                          │ │ Area:     │ │
│ │                                          │ │ [All ▼]   │ │
│ │                                          │ ├────────────┤ │
│ │                                          │ │Businesses:│ │
│ │                                          │ │□ ABC Corp │ │
│ │                                          │ │□ XYZ LLC  │ │
│ │                                          │ │□ Tech Inc │ │
│ │                                          │ ├────────────┤ │
│ │                                          │ │ Analytics:│ │
│ │                                          │ │ 345 Total │ │
│ │                                          │ │ 12 Indust │ │
│ │                                          │ │ 87% Down │ │
│ │                                          │ │           │ │
│ └──────────────────────────────────────────┘ └────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Map Features:**
- Full-width interactive Google Map
- Markers for each business
- Color-coded by industry (legend visible)
- Clustering on zoom out
- Click marker → popup with business name, location, rating
- Click popup → navigate to #/business-hub/[id]

**Sidebar (Right):**
- Search input (by business name or address)
- Filters (category, rating, service area)
- Business list (sortable by name, rating, distance)
- Analytics summary (total businesses, industries, coverage %)
- On mobile: floating panel or drawer

### AI Kiosk Page

**URL:** #/kiosk or floating widget
**Template:** Chat interface
**Roles:** All users (authenticated and public)

**Public Mode (Floating Widget or #/kiosk for public):**
```
┌──────────────────────────────────────────┐
│  ChamberAI Assistant           ⓘ | ✕     │
├──────────────────────────────────────────┤
│                                          │
│  🤖 Hi! I'm here to help you learn       │
│  about our chamber and member services.  │
│                                          │
│  What can I help you with?               │
│                                          │
│                                          │
│                                          │
│                                          │
├──────────────────────────────────────────┤
│ [📝 Type a message...]      [Send ▶]    │
├──────────────────────────────────────────┤
│ Suggestions:                             │
│ [About Us] [Members] [Events] [Contact] │
│                                          │
└──────────────────────────────────────────┘
```

**Private Mode (Members/Staff):**
```
┌──────────────────────────────────────────┐
│  Chamber Assistant          ⓘ | Settings │
├──────────────────────────────────────────┤
│ Context: Your private chamber data       │
│                                          │
│  You: What's on the agenda?              │
│                                          │
│  Assistant: The board meeting next       │
│  Tuesday includes discussion of...       │
│                                          │
│  You: Any action items for me?           │
│                                          │
│  Assistant: Based on your profile,       │
│  you have 3 pending actions due...       │
│                                          │
├──────────────────────────────────────────┤
│ [📝 Type a message...]      [Send ▶]    │
├──────────────────────────────────────────┤
│ Suggested:                               │
│ [My Actions] [Upcoming Mtgs] [Members]  │
│                                          │
└──────────────────────────────────────────┘
```

**Features:**
- Conversational interface
- RAG-powered answers from chamber data
- Different knowledge scope (public vs private)
- Suggested follow-up questions
- Typing indicator while waiting
- Can be embedded as widget or full page
- Settings/configuration button (admin only)

### Settings Page

**URL:** #/settings
**Template:** Form/settings page
**Roles:** Executives, Staff (partial)

```
┌──────────────────────────────────────────────────────┐
│ ⚙️ Settings & Configuration                          │
├──────────────────────────────────────────────────────┤
│ Features | Data & Retention | Notifications | Integ  │ ← Tabs
├──────────────────────────────────────────────────────┤
│                                                      │
│ FEATURES TAB:                                        │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ Meeting Intelligence                             ││
│ │ Generate minutes automatically with AI           ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ Motion Approval Gating                           ││
│ │ Require Executive approval before finalizing      ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ Business Directory Verification                  ││
│ │ Require verification for new business listings   ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ AI Kiosk                                         ││
│ │ Enable public-facing AI assistant                ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ Geographic Intelligence                          ││
│ │ Show member locations on map                     ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ Advanced Search                                  ││
│ │ Full-text search across all features             ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ Export Functionality                             ││
│ │ Allow export of meeting minutes and actions      ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ Audit Logging                                    ││
│ │ Track all changes for compliance                 ││
│ │ ☑ Enabled                 [Learn more]          ││
│ │                                                  ││
│ │ [Cancel] [Save Settings]                         ││
│ │                                                  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Tab Specifications:**

1. **Features Tab:**
   - List of 8+ feature flags
   - Toggles to enable/disable
   - Help text for each feature
   - "Learn more" links

2. **Data & Retention Tab:**
   - Meeting minutes retention policy (days)
   - Archive old meetings after (days)
   - Delete after (years)
   - Video storage retention
   - Form inputs with defaults

3. **Notifications Tab:**
   - Email for new meetings
   - Email for pending actions
   - Email for business verification
   - Email for AI kiosk questions
   - Frequency options (real-time, daily digest, weekly)

4. **Integrations Tab:**
   - Motion API integration
   - API key management
   - Webhook configuration
   - Testing endpoint

### Analytics Page

**URL:** #/analytics
**Template:** Table/analytics page
**Roles:** Executives, Staff (Council tier+)
**Tier:** Council tier or higher

```
┌────────────────────────────────────────────────────────┐
│ 📊 Analytics & Insights                               │
│ Date: [Mar 1 - Mar 28, 2026] [Update]                │
├────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┐        │
│  │ Meetings │ Members  │ Actions  │ AI Help  │        │
│  │    12    │    345   │    48    │   1.2K   │        │
│  │ Managed  │Verified  │ Pending  │ Requests │        │
│  └──────────┴──────────┴──────────┴──────────┘        │
│                                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Meetings Over Time                              │ │
│  │ (Line Chart - Past 12 months)                   │ │
│  │ ▄▃▃▄▅▇█▆▅▄▃▂▁                                  │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────┐  ┌────────────────────────┐   │
│  │ Members by       │  │ Action Item Status     │   │
│  │ Industry (Pie)   │  │ (Bar chart)            │   │
│  │                  │  │ ███ Completed: 45%    │   │
│  │                  │  │ ███ Pending: 38%      │   │
│  │                  │  │ ███ Overdue: 17%      │   │
│  │                  │  │                       │   │
│  └──────────────────┘  └────────────────────────┘   │
│                                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Geographic Distribution (Map)                   │ │
│  │ (Shows member locations, density)               │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│  [Export as CSV] [Export as PDF] [Schedule Report]   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Metrics Displayed:**
- Total meetings
- Total members
- Pending action items
- AI kiosk interactions
- Meeting trend (last 12 months)
- Members by industry
- Action item status breakdown
- Geographic distribution

### Billing Page

**URL:** #/billing
**Template:** Billing/subscription page
**Roles:** Executives only

(See Template 7 for layout and details)

---

## Multi-Role Dashboard Variations

### Role 1: Chamber Executive Dashboard

**Visibility:** All features, admin panels, analytics

```
Welcome back, John Smith
Executive Role | Last login: Mar 28, 2:30 PM

KEY METRICS
┌──────────┬──────────┬──────────┬──────────┐
│ Meetings │ Members  │ Actions  │ AI Help  │
│    12    │    345   │    48    │   1.2K   │
└──────────┴──────────┴──────────┴──────────┘

QUICK ACTIONS
[Create Meeting] [Browse Directory] [Analyze Coverage] [Chat with AI]

INTELLIGENCE FEATURES
[🎯 Meetings] [🏢 Business Hub] [🗺️ Geographic] [🤖 AI Kiosk]

RECENT ACTIVITY
✓ Board Meeting - Minutes approved (Today)
✓ ABC Corp - Business verified (Yesterday)
↑ 3 pending actions from Finance Committee
+ John Smith AI inquiry: "Chamber services" (Today)
↑ 87% downtown corridor coverage achieved

UPCOMING EVENTS
• Apr 2 - Monthly Board Meeting 10am
• Apr 9 - Finance Committee 2pm
• Apr 15 - Networking Event 6pm

ANALYTICS SNAPSHOT
Meetings: 4 | Members joined: 8 | NPS: 42 | [View Full →]
```

**Sidebar Includes:**
- All INTELLIGENCE items
- All OPERATIONS items
- All ADMIN items
- ACCOUNT items

**Visible Metrics:**
- Total meetings, members, actions, AI requests
- Recent activity from all features
- Upcoming events
- Analytics summary
- Billing/subscription status

### Role 2: Staff Dashboard

**Visibility:** Meetings, Business Hub, Geographic, AI Kiosk, Settings (partial), Analytics (Council tier+)

```
Welcome back, Jane Doe
Staff Role | Last login: Mar 28, 1:15 PM

KEY METRICS
┌──────────┬──────────┬──────────┬──────────┐
│ Meetings │ Members  │ Actions  │ AI Help  │
│    12    │    345   │    48    │   1.2K   │
└──────────┴──────────┴──────────┴──────────┘

QUICK ACTIONS
[Create Meeting] [Browse Directory] [Analyze Coverage] [Chat with AI]

INTELLIGENCE FEATURES
[🎯 Meetings] [🏢 Business Hub] [🗺️ Geographic] [🤖 AI Kiosk]

RECENT ACTIVITY
✓ Board Meeting - Minutes approved (Today)
✓ ABC Corp - Business verified (Yesterday)
↑ 3 pending actions from Finance Committee
+ AI Kiosk: "Where do I find member services?" (Today)

UPCOMING EVENTS
• Apr 2 - Board Meeting 10am
• Apr 9 - Finance Committee 2pm

(No analytics or admin panels visible)
```

**Sidebar Includes:**
- All INTELLIGENCE items
- OPERATIONS items (Settings, Analytics if Council tier)
- ACCOUNT items
- NO ADMIN section

**Visible Metrics:**
- Meetings, members, actions, AI requests
- Recent activity (meetings, members, actions, kiosk)
- Upcoming events
- No admin or billing data

### Role 3: Business Member Dashboard

**Visibility:** Business Hub (their listing + directory), AI Kiosk, Profile/Preferences

```
Welcome back, Bob Smith
Member Role | Last login: Mar 28, 10:30 AM

MY BUSINESS
┌────────────────────────────┐
│ ABC Corporation             │
│ Consulting & Strategy       │
│ ⭐⭐⭐⭐⭐ (4.8, 24 reviews)│
│ [View Profile] [Edit]       │
└────────────────────────────┘

QUICK ACTIONS
[Browse Members Directory] [Chat with AI]

MEMBER DIRECTORY STATS
📊 345 verified members
📂 12 industries represented
🗺️ 87% downtown coverage

RECENT ACTIVITY
✓ Your business - Verified as member (Feb 28)
✓ New review: "Great service!" (Mar 22)
+ 5 businesses viewed your profile (This week)

NETWORKING OPPORTUNITIES
• Apr 2 - Monthly Networking Event
• Apr 15 - Business Mixer 6pm
```

**Sidebar Includes:**
- 🏢 Business Hub
- 🤖 AI Kiosk
- 👤 Profile/Account
- ACCOUNT items (Preferences, Logout)

**Visible Metrics:**
- Only their own business data
- Member directory stats
- Recent activity related to their business
- Networking events
- No meetings, actions, analytics, or admin

### Role 4: Public Visitor Dashboard

**No dashboard** - Instead, direct to AI Kiosk in modal or full-screen view

```
NO SIDEBAR NAVIGATION
NO AUTHENTICATION REQUIRED
DIRECT TO MODAL/FULL-SCREEN:

┌────────────────────────────────────────┐
│  ChamberAI Assistant           ⓘ | ✕   │
├────────────────────────────────────────┤
│                                        │
│  👋 Welcome to [Chamber Name]!         │
│                                        │
│  I'm here to help you learn about      │
│  our chamber, member services, and     │
│  upcoming events.                      │
│                                        │
│  What can I help you with?             │
│                                        │
├────────────────────────────────────────┤
│ [📝 Type a message...]      [Send ▶]  │
├────────────────────────────────────────┤
│ Suggested:                             │
│ [About Us] [Members] [Events] [Contact]│
│                                        │
└────────────────────────────────────────┘
```

**Public Mode Features:**
- No authentication required
- No sidebar or navigation
- AI Kiosk only
- Public knowledge base only
- Can be embedded on website or linked from homepage
- Modal or full-page view

---

## Navigation Flow Diagrams

### Main User Flow: Create Meeting

```
Dashboard
   ↓
[+ Create Meeting] button
   ↓
#/meetings (POST form modal or page)
   ↓
Fill: Title, Date, Time, Location, Attendees
   ↓
[Save Meeting] button
   ↓
#/meetings/:id (detail view, Minutes tab active)
   ↓
View: AI-generated draft minutes
   ↓
[Approve] or [Edit] or [Reject]
   ↓
#/meetings/:id (Minutes → Approved)
   ↓
View: Actions, Motions tabs
```

### User Flow: Browse & Verify Member

```
Dashboard or
#/business-hub (Browse Directory)
   ↓
[Browse Directory] button
   ↓
List view: Sort/filter members
   ↓
Click: Business card
   ↓
#/business-hub/:id (detail view)
   ↓
View: Profile, Geographic, Reviews
   ↓
[Verify] button (if Admin)
   ↓
Confirmation modal
   ↓
#/business-hub/:id (✓ Verified badge appears)
```

### User Flow: Analyze Coverage with Map

```
Dashboard
   ↓
[Analyze Coverage] button or
Navigate: 🗺️ Geographic in sidebar
   ↓
#/geo-intelligence (map view)
   ↓
View: Map with markers, filters on right
   ↓
Click: Filter category dropdown
   ↓
Map updates: Show only selected category
   ↓
Click: Business marker on map
   ↓
Popup: Business name, rating, location
   ↓
Click: Popup "View Details"
   ↓
#/business-hub/:id (business detail)
```

### User Flow: Chat with AI Kiosk

**Authenticated User:**
```
Dashboard
   ↓
[Chat with AI] button or
🤖 AI Kiosk in sidebar
   ↓
#/kiosk (private mode, full-screen chat)
   ↓
AI context: All chamber data available
   ↓
Type: "What are my pending action items?"
   ↓
AI: Semantic search + RAG on chamber data
   ↓
Response: "You have 3 pending items: ..."
   ↓
Click: [My Actions] suggested button
   ↓
#/meetings/:id/actions (actions detail)
```

**Public Visitor:**
```
External: Website link or Embedded widget
   ↓
Modal or #/kiosk/public opens
   ↓
No authentication required
   ↓
AI context: Public knowledge base only
   ↓
Type: "What services do you offer?"
   ↓
AI: Semantic search on public FAQs
   ↓
Response: "We offer these services: ..."
   ↓
Click: [Contact Us] suggested button
   ↓
Modal closes, contact form appears
```

---

## Responsive Breakpoints

### Breakpoint 1: Desktop (>900px)

**Sidebar:** Always visible, 220px fixed
**Layout:** Two-column (sidebar + content)
**Navigation:** Full text labels visible
**Content Width:** Remaining space after sidebar

```
┌─────────────┬───────────────────────────────┐
│             │                               │
│  Sidebar    │       Main Content            │
│  (220px)    │     (Full Height)             │
│  Fixed      │                               │
│  Text + Icon│                               │
│             │                               │
│             │                               │
│             │                               │
│             │                               │
│             │                               │
│             │                               │
└─────────────┴───────────────────────────────┘
```

**Components:**
- Sidebar: Full 220px width
- Navigation items: Icon + text (14px font)
- Logo: Full brand name visible
- User chip: Name + role visible
- Lists: Full columns visible
- Cards: 2-3 per row
- Modals: Centered, 90% width max 600px

### Breakpoint 2: Tablet (600-900px)

**Sidebar:** Visible but narrower, 160px
**Layout:** Two-column with adjusted widths
**Navigation:** Text remains readable, slightly smaller
**Content Width:** Adjusts to remaining space

```
┌──────────┬──────────────────────────────┐
│          │                              │
│  Sidebar │      Main Content            │
│  (160px) │    (Adjusted Width)          │
│  Fixed   │                              │
│  Icon +  │                              │
│  Text    │                              │
│ (13px)   │                              │
│          │                              │
│          │                              │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Components:**
- Sidebar: 160px (down from 220px)
- Navigation items: Icon + text (13px font)
- Logo: Brand name may be abbreviated
- User chip: Smaller text
- Lists: Full columns, may wrap
- Cards: 1-2 per row
- Modals: Centered, 85% width max 500px

### Breakpoint 3: Mobile (<600px)

**Sidebar:** Hidden, replaced with bottom nav
**Layout:** Full-width content with bottom navigation
**Navigation:** Icon-only (6-8 main items)
**Content Width:** Full available width

```
┌──────────────────────────────┐
│                              │
│     Full-Width Content       │
│     (Single column)          │
│                              │
│                              │
│                              │
│                              │
│                              │
│                              │
│                              │
│                              │
│                              │
│                              │
│                              │
├──────────────────────────────┤
│ 📋 🏢 🗺️ 🤖 ⚙️ 👤 ⋯        │ ← Bottom nav (56px)
└──────────────────────────────┘
```

**Components:**
- Sidebar: Hidden (swiped away or drawer)
- Bottom nav: 56px height, icon-only
- Navigation items: 24px icons, no text labels
- Logo: Hidden or minimal
- User chip: Hidden
- Lists: Single column, full width
- Cards: 1 per row, full width
- Modals: Full-width, bottom-to-top slide-in
- Filters: Drawer/modal with apply button

### Component Behavior by Breakpoint

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Sidebar | 220px, always visible | 160px, always visible | Hidden, bottom nav |
| Page Header | Full width | Full width | Full width, stacked |
| List/Cards | 2-3 per row | 1-2 per row | 1 per row |
| Modals | Centered, 600px max | Centered, 500px max | Full-width, bottom-up |
| Tables | Scrollable, 8+ columns | Scrollable, 4-6 columns | Single column, expandable |
| Forms | Multi-column | Single column | Single column |
| Map | Full height | Full height | Full width, 400px height min |
| Chat | Sidebar + chat | Stacked or side-by-side | Full-width, stacked |

---

## Empty States & Onboarding

### Empty Dashboard (Brand New User)

```
┌────────────────────────────────────────────────┐
│                                                │
│        Welcome to ChamberAI! 🎉                │
│                                                │
│    Let's get you started in 3 easy steps:      │
│                                                │
│    ┌──────────────────────────────────────┐  │
│    │ 1. Create Your First Meeting         │  │
│    │                                      │  │
│    │ Set up a meeting to begin using our  │  │
│    │ AI-powered minutes generation and    │  │
│    │ action item tracking.                │  │
│    │                                      │  │
│    │ [Create Meeting →]                   │  │
│    └──────────────────────────────────────┘  │
│                                                │
│    ┌──────────────────────────────────────┐  │
│    │ 2. Build Your Member Directory       │  │
│    │                                      │  │
│    │ Add your business members to the     │  │
│    │ directory. We'll help verify and     │  │
│    │ rate them.                           │  │
│    │                                      │  │
│    │ [Import Members →] [Add Manually →]  │  │
│    └──────────────────────────────────────┘  │
│                                                │
│    ┌──────────────────────────────────────┐  │
│    │ 3. Explore Our AI Features           │  │
│    │                                      │  │
│    │ See what ChamberAI can do: AI        │  │
│    │ minutes, business intelligence,      │  │
│    │ maps, and the AI kiosk.              │  │
│    │                                      │  │
│    │ [Take a Tour →]                      │  │
│    └──────────────────────────────────────┘  │
│                                                │
│    Need help? [Contact Support]               │
│                                                │
└────────────────────────────────────────────────┘
```

### Empty Meetings List

```
┌────────────────────────────────────────────────┐
│ 🎯 Meetings Intelligence              [+ Meeting]
│ AI-powered meeting management                │
├────────────────────────────────────────────────┤
│                                                │
│            No meetings yet                     │
│                                                │
│     Create your first meeting to begin         │
│     using AI-powered minutes generation,       │
│     motion tracking, and action management.    │
│                                                │
│            [+ Create First Meeting]            │
│                                                │
│      Or import meetings from your             │
│      existing records.                         │
│                                                │
│           [Import From File →]                 │
│                                                │
└────────────────────────────────────────────────┘
```

### Empty Business Directory

```
┌────────────────────────────────────────────────┐
│ 🏢 Business Hub                  [+ Add Business]
│ Verified Members Directory                     │
├────────────────────────────────────────────────┤
│                                                │
│         No verified members yet                │
│                                                │
│    Start building your member directory by     │
│    adding local businesses. Each business      │
│    will be verified and rated.                 │
│                                                │
│         [+ Add First Business]                 │
│                                                │
│      Or import a list of businesses.           │
│                                                │
│          [Import CSV →]                        │
│                                                │
└────────────────────────────────────────────────┘
```

### Empty Analytics

```
┌────────────────────────────────────────────────┐
│ 📊 Analytics & Insights                        │
├────────────────────────────────────────────────┤
│                                                │
│   Not enough data yet for analytics            │
│                                                │
│   Once you create meetings and add members,    │
│   you'll see insights like:                    │
│                                                │
│   • Meeting trends over time                   │
│   • Member distribution by industry            │
│   • Action item tracking                       │
│   • Geographic coverage analysis               │
│                                                │
│   [Create Your First Meeting →]                │
│   [Add Businesses →]                           │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Accessibility Features

### WCAG 2.1 AA Compliance

**Contrast Ratios:**
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

**Example:**
- Text color: #333333 on #ffffff = 19.5:1 (AAA compliant)
- Blue links: #0066cc on #ffffff = 8.6:1 (AAA compliant)
- Gray disabled text: #999999 on #ffffff = 4.5:1 (AA compliant)

### Keyboard Navigation

**Tab Order:**
1. Logo/home link
2. Navigation items (top to bottom)
3. Page title and buttons
4. Search/filter inputs
5. List items
6. Pagination

**Keyboard Shortcuts:**
- **Tab:** Navigate forward
- **Shift+Tab:** Navigate backward
- **Enter:** Select/click focused item
- **Space:** Toggle checkbox/toggle
- **Escape:** Close modal or menu
- **/**  (slash): Open command palette (optional)

**Focus Indicators:**
- Visible focus ring (2px, #0066cc color)
- Works on all interactive elements
- Never removed via CSS

### Screen Reader Support

**ARIA Labels:**
- Form inputs have explicit labels
- Buttons have descriptive text
- Icons have aria-labels
- Regions have role attributes
- Lists marked as navigation

**Semantic HTML:**
- Proper heading hierarchy (h1 → h2 → h3)
- List items in `<ul>`/`<ol>` + `<li>`
- Form elements in `<form>`
- Buttons as `<button>`, not `<div>`
- Links as `<a>`, not styled `<span>`

**Example:**
```html
<!-- Good -->
<nav aria-label="Main navigation">
  <a href="#/meetings" aria-current="page">Meetings</a>
  <a href="#/business-hub">Business Hub</a>
</nav>

<!-- Bad -->
<div class="nav">
  <span onclick="...">Meetings</span>
  <span onclick="...">Business Hub</span>
</div>
```

### Color & Visual

**No Information by Color Alone:**
- Status indicators use icons + color
- Charts have patterns in addition to color
- Success/error/warning use text + color

**High Contrast Mode:**
- UI remains usable in Windows High Contrast mode
- Relies on borders and icons, not just color
- Text remains readable

### Motion & Animation

**Reduced Motion:**
- Animations disabled when `prefers-reduced-motion: reduce`
- No auto-playing videos or animations
- Animations are supplementary, not essential

---

## Implementation Sequence

### Phase 0: Dashboard & Information Architecture (Current)

**Week 1 (Mar 28 - Apr 4):**
- [ ] Design specification (THIS DOCUMENT) ✓
- [ ] Approval from stakeholders
- [ ] Component library decisions

### Phase 1: Sidebar Navigation & Layout Structure (Apr 1-14)

**Week 1 (Apr 1-7):**
- [ ] Create sidebar navigation component (220px desktop)
- [ ] Implement navigation items with routing
- [ ] Create top navbar (page title, user menu)
- [ ] Setup responsive detection (desktop vs tablet vs mobile)
- [ ] Update app.js router to include new layout

**Week 2 (Apr 8-14):**
- [ ] Responsive sidebar for tablet (160px)
- [ ] Mobile bottom navigation bar (56px)
- [ ] Tab switching between breakpoints
- [ ] Styling and visual refinement
- [ ] E2E testing on all breakpoints

### Phase 2: Dashboard (Apr 15-21)

**Week 1 (Apr 15-21):**
- [ ] Dashboard page layout
- [ ] Welcome section (personalized greeting)
- [ ] Key statistics cards (metrics by role)
- [ ] Quick action buttons
- [ ] Intelligence feature cards (4 cards)
- [ ] Recent activity feed (query endpoints)
- [ ] Calendar widget
- [ ] Empty state for new users
- [ ] Role-based variations (Exec, Staff, Member)
- [ ] Styling and animations

### Phase 3: Page Layout Templates (Apr 22-28)

**Week 1 (Apr 22-28):**
- [ ] Template 1: Full-page list + header
- [ ] Template 2: Full-page detail + tabs
- [ ] Template 3: Map-based layout
- [ ] Template 4: Chat interface (enhance existing)
- [ ] Template 5: Form/settings page
- [ ] Template 6: Table/analytics page
- [ ] Template 7: Billing page
- [ ] Template 8: Admin panel template
- [ ] Create reusable components library
- [ ] Document each template

### Phase 4: Dashboard Components (Apr 29 - May 5)

**Week 1 (Apr 29 - May 5):**
- [ ] Refine dashboard styling
- [ ] Add analytics snapshot
- [ ] Add upcoming events calendar
- [ ] Animations (card entrance, transitions)
- [ ] Dark mode support (optional)
- [ ] Print styles for reports
- [ ] Mobile responsiveness testing
- [ ] Accessibility audit (WCAG 2.1 AA)

### Phase 5 & 6 Implementation (Parallel)

(Phase 5: Meetings, Phase 6: Business Hub)
- Use new page layout templates
- Implement responsive designs at all breakpoints
- 2-3 weeks each, can run in parallel

### Phase 7 & 8 Implementation

(Phase 7: Admin Pages, Phase 8: Billing View)
- Use admin panel and billing templates
- 1 week combined
- After Phase 5 & 6 foundation

---

## Success Criteria

### Dashboard & Information Architecture Complete When:

- [ ] **Dashboard** displays all 6 sections (welcome, metrics, quick actions, feature cards, activity, calendar)
- [ ] **Navigation** works at all 3 breakpoints (desktop, tablet, mobile)
- [ ] **Page templates** provide consistent layout for all features
- [ ] **Role-based access** correctly shows/hides content per user role
- [ ] **Responsive design** tested on 4 breakpoints
- [ ] **Accessibility** meets WCAG 2.1 AA standards
- [ ] **Empty states** guide new users effectively
- [ ] **Documentation** complete for all pages and components
- [ ] **E2E tests** passing with zero breaking changes
- [ ] **Performance** dashboard loads in <2 seconds

---

## Appendix: Style Guide Reference

### Color Palette

| Color | Usage | Hex |
|-------|-------|-----|
| Primary Blue | Links, active nav, buttons | #0066cc |
| Dark Gray | Text, labels | #333333 |
| Medium Gray | Secondary text | #666666 |
| Light Gray | Disabled, borders, backgrounds | #f5f5f5 |
| White | Page background | #ffffff |
| Green | Success, completed | #28a745 |
| Yellow | Warning, attention | #ffc107 |
| Red | Error, critical | #dc3545 |

### Typography

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| Page Title | -apple-system, BlinkMacSystemFont, "Segoe UI" | 28px | 700 | h1, main heading |
| Section Title | System font | 18px | 700 | h2, section heading |
| Item Title | System font | 16px | 600 | h3, item name |
| Body Text | System font | 14px | 400 | Paragraphs, labels |
| Small Text | System font | 12px | 400 | Help text, timestamps |
| Button Text | System font | 14px | 600 | Buttons, links |

### Spacing

| Size | Value | Usage |
|------|-------|-------|
| XS | 4px | Icon spacing |
| S | 8px | Item padding |
| M | 16px | Component padding |
| L | 24px | Section padding |
| XL | 32px | Page padding |
| XXL | 48px | Large sections |

---

**Document Version:** 1.0
**Last Updated:** 2026-03-28
**Status:** Final Design Specification
**Ready for Implementation:** YES

---
