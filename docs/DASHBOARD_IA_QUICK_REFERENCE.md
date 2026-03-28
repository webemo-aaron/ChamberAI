# ChamberAI Dashboard & IA - Quick Reference

**Version:** 1.0 | **Date:** 2026-03-28 | **Status:** Implementation Ready

This is a condensed reference guide. For complete details, see `DASHBOARD_AND_IA_DESIGN.md`.

---

## Navigation Structure (At a Glance)

```
ChamberAI Platform
├── INTELLIGENCE (Primary Features)
│   ├── 🎯 Meetings (#/meetings)
│   ├── 🏢 Business Hub (#/business-hub)
│   ├── 🗺️ Geographic (#/geo-intelligence)
│   └── 🤖 AI Kiosk (#/kiosk)
├── OPERATIONS
│   ├── ⚙️ Settings (#/settings)
│   ├── 📊 Analytics (#/analytics) [Council+ tier]
│   └── 💳 Billing (#/billing) [Exec only]
├── ADMIN [Exec only]
│   ├── 🔑 Stripe Management (#/admin/stripe)
│   ├── 📦 Product Management (#/admin/products)
│   └── 👥 User Management (#/admin/users)
└── ACCOUNT
    ├── 👤 Profile (#/profile)
    ├── ⚙️ Preferences
    └── 🚪 Logout
```

---

## Responsive Navigation

| Breakpoint | Width | Sidebar | Bottom Nav | Key Changes |
|-----------|-------|---------|-----------|-------------|
| Desktop | >900px | 220px visible | Hidden | Full navigation with text |
| Tablet | 600-900px | 160px visible | Hidden | Narrower sidebar |
| Mobile | <600px | Hidden | 56px visible | Icon-only bottom nav (6-8 tabs) |

**Mobile Bottom Nav Items:**
1. 📋 Meetings
2. 🏢 Business Hub
3. 🗺️ Geographic
4. 🤖 AI Kiosk
5. ⚙️ Settings
6. 👤 Account
7. ⋯ More (drawer)

---

## Dashboard Sections

### 1. Welcome Section
- Personalized greeting: "Welcome back, [Name]"
- Role badge
- Last login timestamp

### 2. Key Statistics (4 Cards)
- **Meetings Managed** - Executives, Staff only
- **Verified Members** - All authenticated
- **Pending Actions** - Role-specific
- **AI Interactions** - All authenticated

### 3. Quick Action Buttons (4 Buttons)
- **Create Meeting** - Exec, Staff
- **Browse Directory** - All authenticated
- **Analyze Coverage** - Exec, Staff
- **Chat with AI** - All authenticated

### 4. Intelligence Feature Cards (4 Cards)
| Card | Icon | Title | Key Benefit |
|------|------|-------|------------|
| 1 | 🎯 | Meetings Intelligence | AI-powered meeting management |
| 2 | 🏢 | Business Hub Intelligence | Verified member directory & ratings |
| 3 | 🗺️ | Geographic Intelligence | Territory & coverage mapping |
| 4 | 🤖 | AI Kiosk | RAG-powered smart assistant |

### 5. Recent Activity Feed
Shows last 5 items:
- ✓ Completed items
- ↑ Items requiring attention
- \+ New submissions
- ⚠ Warnings/errors

### 6. Calendar Widget
- Next 3-5 upcoming events
- Clickable to detail view
- Filter options

### 7. Analytics Summary (Exec/Staff only)
- KPI metrics
- Trend indicators
- "View Full" link to analytics page

### 8. Empty State (New Users)
- Onboarding flow: 3 steps
- "Create first meeting"
- "Build member directory"
- "Explore AI features"

---

## Page Layout Templates (8 Total)

| # | Template | Purpose | Used By |
|---|----------|---------|---------|
| 1 | Full-Page List + Header | Browse collections | Meetings, Business |
| 2 | Full-Page Detail + Tabs | View single item | Meeting detail, Business detail |
| 3 | Map-Based | Visualize locations | Geographic Intelligence |
| 4 | Chat Interface | Conversational AI | AI Kiosk |
| 5 | Form/Settings | Configuration | Settings, Profile |
| 6 | Table/Analytics | Data visualization | Analytics, Admin |
| 7 | Billing/Subscription | Payment management | Billing page |
| 8 | Admin Panel | System management | Admin pages |

---

## Role-Based Access Control

### Executive
- **Sidebar:** All INTELLIGENCE + All OPERATIONS + All ADMIN + ACCOUNT
- **Dashboard:** All sections (metrics, analytics, admin)
- **Features:** Everything
- **Features:** Can access Admin panels, Billing, Analytics

### Staff
- **Sidebar:** All INTELLIGENCE + OPERATIONS (Settings, Analytics if Council tier) + ACCOUNT
- **Dashboard:** No admin or billing data
- **Features:** Meetings, Business Hub, Geographic, AI Kiosk, Settings (partial)
- **Restrictions:** No admin panels, no billing access

### Business Member
- **Sidebar:** Business Hub, AI Kiosk, Profile, Account
- **Dashboard:** Only their business data + directory stats
- **Features:** View own business, browse directory, chat with AI
- **Restrictions:** No meetings, no admin, no analytics

### Public Visitor
- **No Dashboard** - Direct to AI Kiosk modal
- **Features:** AI Kiosk only (public mode)
- **Knowledge:** Public knowledge base only
- **Authentication:** Not required

---

## Feature Pages at a Glance

### Meetings Intelligence (#/meetings)
**List view:**
- Cards showing: date, location, status, attendees, action items
- Filters: date range, status, location
- Search: full-text
- Create button at top

**Detail view:**
- Header: location, date/time, status
- Tabs: Minutes | Actions | Motions | Audit | Summary
- Tab content full-width below tab bar

### Business Hub (#/business-hub)
**List view:**
- Cards showing: logo, name, verified badge, rating, location, service area
- Filters: category, rating, location, service area
- Search: business name
- View toggle: cards or table

**Detail view:**
- Header: name, logo, rating, verified badge
- Tabs: Profile | Geographic | Reviews | Quotes | AI Search

### Geographic Intelligence (#/geo-intelligence)
**Layout:**
- Full-width Google Map (main)
- Sidebar (right): filters, business list, analytics
- On mobile: floating panel or drawer
- Markers color-coded by industry
- Click marker → popup → detail page

### AI Kiosk (#/kiosk or widget)
**Public mode:**
- Minimal chrome, welcoming tone
- Public knowledge base only
- Suggested questions
- Can be embedded or full-screen

**Private mode:**
- Chamber context available
- User-specific information
- Staff/member mode with more options
- Settings button for configuration

### Settings (#/settings)
**Tabs:**
1. **Features** - Toggle 8+ features
2. **Data & Retention** - Policies
3. **Notifications** - Email preferences
4. **Integrations** - Motion API config

### Analytics (#/analytics) [Council tier+]
**Components:**
- Summary cards (4-6 KPIs)
- Line chart (meetings over time)
- Pie chart (members by industry)
- Bar chart (action status)
- Map (geographic distribution)
- Date range filter
- Export options

### Billing (#/billing) [Exec only]
**Sections:**
- Current plan (highlighted)
- Plan comparison cards
- Usage display
- Payment method
- Billing history
- Manage subscription button

---

## Component Specifications

### Sidebar Navigation Item
```
┌─────────────────────┐
│ 🎯 Meetings        │ ← Hover: light gray bg, blue text
│ 🏢 Business Hub    │
│ ⚙️ Settings        │
│                    │
│ ─────────────────  │ ← Visual divider
│ 👤 John Smith      │ ← User identity chip
│ Executive          │
└─────────────────────┘
```

- **Height:** 220px (desktop), 160px (tablet)
- **Fixed:** Yes, left side
- **Hover state:** Light gray background, blue text
- **Active state:** Blue left border (4px), light blue background
- **User chip:** Bottom, shows name + role

### Dashboard Feature Card
```
┌────────────────────────┐
│ 🎯 Feature Title       │
│                        │
│ Brief description of   │
│ what this does and why │
│ users care.            │
│                        │
│ [Learn More] [Open →]  │
└────────────────────────┘
```

- **Layout:** 2x2 grid on desktop, stacked on mobile
- **Icon size:** 32px
- **Title:** 16px, bold
- **Description:** 14px, gray
- **CTAs:** Two buttons (Learn More, Open)

### Statistics Card (4-Column)
```
┌──────────┬──────────┬──────────┬──────────┐
│ Meetings │ Members  │ Actions  │ AI Help  │
│    12    │    345   │    48    │   1.2K   │
│ Managed  │Verified  │ Pending  │ Requests │
└──────────┴──────────┴──────────┴──────────┘
```

- **Height:** 80px
- **Background:** Light gray (#f5f5f5)
- **Number:** 32px, bold, blue
- **Label:** 12px, gray
- **Layout:** 4 equal columns on desktop, stack on mobile

### List Item Card
```
┌────────────────────────────────────────┐
│ Item Title                    [Metadata]│
│ Description or key information         │
│ Status badge | Count | Date            │
│ [Click to view details]                │
└────────────────────────────────────────┘
```

- **Padding:** 16px
- **Margin:** 12px between items
- **Hover:** Subtle background change
- **Click:** Navigate to detail page
- **Border:** Light gray (1px)

---

## Accessibility Checklist

- [ ] Contrast ratios: 4.5:1 for normal text, 3:1 for UI components
- [ ] Focus indicators: Visible 2px outline on all interactive elements
- [ ] Keyboard navigation: Tab order logical, Escape closes modals
- [ ] Screen reader: Semantic HTML, ARIA labels where needed
- [ ] No color alone: Status uses icons + color
- [ ] Reduced motion: Animations disabled when requested
- [ ] Text scaling: Works up to 200% zoom
- [ ] Form labels: All inputs have explicit labels

---

## Implementation Checklist

### Phase 1: Navigation (Apr 1-14)
- [ ] Sidebar component (220px desktop)
- [ ] Top navbar with user menu
- [ ] Responsive detection logic
- [ ] Mobile bottom nav (56px)
- [ ] Routing integration
- [ ] Styling and theme

### Phase 2: Dashboard (Apr 15-21)
- [ ] Welcome section
- [ ] Statistics cards
- [ ] Quick action buttons
- [ ] Feature cards (4 cards)
- [ ] Activity feed
- [ ] Calendar widget
- [ ] Empty state
- [ ] Role-based variations

### Phase 3: Templates (Apr 22-28)
- [ ] All 8 layout templates
- [ ] Reusable components
- [ ] Template documentation

### Phase 4: Refinement (Apr 29 - May 5)
- [ ] Animations and transitions
- [ ] Dark mode support (optional)
- [ ] Print styles
- [ ] Accessibility audit
- [ ] Mobile responsiveness testing

### Phase 5 & 6: Features (May onwards)
- [ ] Meetings page (using templates)
- [ ] Business Hub page (using templates)
- [ ] Other feature pages

---

## Color & Typography Quick Reference

### Colors
- **Primary Blue (Links/Active):** #0066cc
- **Dark Text:** #333333
- **Medium Gray (Secondary):** #666666
- **Light Gray (Borders/BG):** #f5f5f5
- **White (Pages):** #ffffff
- **Success (Green):** #28a745
- **Warning (Yellow):** #ffc107
- **Error (Red):** #dc3545

### Fonts (System Stack)
```
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### Text Sizes
- **h1 (Page Title):** 28px, 700 weight
- **h2 (Section):** 18px, 700 weight
- **h3 (Item):** 16px, 600 weight
- **Body:** 14px, 400 weight
- **Small:** 12px, 400 weight
- **Button:** 14px, 600 weight

---

## File References

**Main Specification:**
- `/docs/DASHBOARD_AND_IA_DESIGN.md` (3,500+ words, complete)

**Quick Reference (This Document):**
- `/docs/DASHBOARD_IA_QUICK_REFERENCE.md`

**Related Design Docs:**
- `/CHAMBERAI_PLATFORM_UI_STRATEGY.md` - Platform positioning
- `/docs/PHASE_4_DESIGN_SPEC.md` - Sidebar/navbar details
- `/docs/PHASE_5_DESIGN_SPECIFICATION.md` - Meetings page details
- `/docs/PHASE_6_BUSINESS_HUB_DESIGN.md` - Business Hub page details

---

## Key Decision Points

1. **Sidebar Width:** 220px (desktop), 160px (tablet), hidden on mobile ✓
2. **Bottom Navigation:** Icon-only, 6-8 main tabs ✓
3. **Page Templates:** 8 distinct patterns for different content types ✓
4. **Role-Based:** 4 distinct user roles with different feature access ✓
5. **Responsive Breakpoints:** 4 breakpoints (desktop, tablet, mobile, small mobile) ✓
6. **Accessibility:** WCAG 2.1 AA as minimum standard ✓
7. **Empty States:** Onboarding flows for new users ✓

---

## Timeline

- **Approval:** 2026-03-28
- **Phase 1 (Nav):** Apr 1-14
- **Phase 2 (Dashboard):** Apr 15-21
- **Phase 3 (Templates):** Apr 22-28
- **Phase 4 (Refinement):** Apr 29 - May 5
- **Phase 5+6 (Features):** May 6 onwards

**Estimated Completion:** Mid-May 2026

---

## Questions / Next Steps

1. **Approval:** Does this specification align with your vision?
2. **Implementation:** Ready to start Phase 1 (Navigation)?
3. **Feedback:** Any changes to navigation structure or templates?
4. **Team Assignment:** Who owns each phase?
5. **Timeline:** Is this schedule realistic for your team?

---

**Document Status:** READY FOR IMPLEMENTATION
**Contact:** Design Team
**Last Updated:** 2026-03-28

