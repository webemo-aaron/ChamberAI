# ChamberAI Dashboard & IA - Implementation Roadmap

**Version:** 1.0 | **Date:** 2026-03-28 | **Duration:** 6 weeks (Apr 1 - May 15)

---

## Overview

This document provides a detailed implementation roadmap for the ChamberAI Dashboard and Information Architecture redesign. It includes:

1. **Phase-by-phase breakdown** with tasks and deliverables
2. **Dependency map** showing what can be done in parallel
3. **Test strategy** for each phase
4. **Success criteria** and go/no-go gates
5. **Risk mitigation** for common issues

---

## Phase Timeline

```
APR                             MAY
1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
├─────────────────────────────────────────────────────────────────────────────┤

Phase 1: Navigation         [███████████████]
Phase 2: Dashboard          [               ███████████████]
Phase 3: Templates          [                               ███████████████]
Phase 4: Refinement         [                                               ███]
Phase 5+6: Features         [                                  PARALLEL TRACK]

COMPLETE TIMELINE: Apr 1 - May 15 (6 weeks)
```

---

## Phase 1: Navigation & Layout Structure (Apr 1-14)

### Objectives
- Establish responsive navigation (desktop, tablet, mobile)
- Create top navbar and sidebar components
- Implement role-based menu visibility
- Wire up basic routing

### Deliverables

#### Week 1 (Apr 1-7)

**Task 1.1: Sidebar Navigation Component** (3 days)
- **File:** `apps/secretary-console/components/sidebar-nav.js`
- **Size:** 200-250 lines
- **Requirements:**
  - 220px width (desktop), 160px (tablet)
  - 4 semantic sections (Intelligence, Operations, Admin, Account)
  - Icon + text labels
  - Hover/active states
  - User identity chip at bottom
  - No external dependencies (vanilla JS)
- **Testing:** Visual regression on 3 breakpoints
- **Acceptance:** Sidebar matches mockup exactly

**Task 1.2: Top Navbar Component** (2 days)
- **File:** `apps/secretary-console/components/top-navbar.js`
- **Size:** 150-200 lines
- **Requirements:**
  - Page title (dynamic from router)
  - User menu (dropdown)
  - Search input (placeholder for now)
  - 56px height, touch-friendly
  - Shadow and border styling
- **Testing:** Visual regression, keyboard navigation
- **Acceptance:** Navbar matches mockup, user menu functional

**Task 1.3: Responsive Detection & Layout** (2 days)
- **File:** `apps/secretary-console/core/responsive.js`
- **Size:** 100-150 lines
- **Requirements:**
  - Detect breakpoints (900px, 600px, 480px)
  - Dispatch events on breakpoint change
  - Calculate available content width
  - Window resize listener with debounce
- **Testing:** Unit tests for breakpoint detection
- **Acceptance:** Events fire correctly on window resize

**Task 1.4: Routing Integration** (2 days)
- **File:** Modify `apps/secretary-console/core/router.js`
- **Requirements:**
  - Add sidebar to main layout
  - Add navbar to all pages
  - Update page templates
  - Preserve existing routes
- **Testing:** E2E tests confirm all routes still work
- **Acceptance:** No broken links, all routes functional

#### Week 2 (Apr 8-14)

**Task 1.5: Mobile Bottom Navigation** (3 days)
- **File:** `apps/secretary-console/components/mobile-nav.js`
- **Size:** 200-250 lines
- **Requirements:**
  - 56px height, fixed to bottom
  - Icon-only tabs (6-8 items)
  - Active indicator (blue icon + underline)
  - Drawer/modal for "more" menu
  - Safe area support (notches)
- **Testing:** Mobile device testing, touch events
- **Acceptance:** Touch targets 48x48px minimum, smooth transitions

**Task 1.6: Navigation Visibility by Role** (2 days)
- **File:** Modify `apps/secretary-console/components/sidebar-nav.js`
- **Requirements:**
  - Read user role from auth context
  - Hide/show menu items based on role
  - Hide entire sections if no visible items
  - Admin section only for admin users
- **Testing:** Unit tests for each role type
- **Acceptance:** Only correct items visible for each role

**Task 1.7: Styling & Theme** (2 days)
- **File:** `apps/secretary-console/styles/navigation.css`
- **Size:** 300-400 lines
- **Requirements:**
  - Colors per spec (blue #0066cc, grays)
  - Hover/active states
  - Font sizes and weights
  - Spacing and padding
  - Dark mode placeholders (optional)
- **Testing:** Visual regression on all components
- **Acceptance:** Matches design specification exactly

**Task 1.8: Responsive Testing & QA** (3 days)
- **Devices:** Desktop (1920px), Tablet (768px), Mobile (375px)
- **Browsers:** Chrome, Firefox, Safari
- **Testing:**
  - Sidebar visible/hidden at correct breakpoints
  - Bottom nav appears on mobile
  - Text readable at all sizes
  - Touch targets 48px minimum
  - Focus indicators visible
  - Keyboard navigation works
- **Acceptance:** Zero visual regressions, all breakpoints pass

### Phase 1 Success Criteria

- [ ] Navigation component complete (sidebar + navbar)
- [ ] Responsive at 3 breakpoints (desktop, tablet, mobile)
- [ ] Role-based visibility working
- [ ] All routes functional (no broken links)
- [ ] Visual testing passed on all breakpoints
- [ ] Keyboard navigation and focus indicators working
- [ ] E2E tests passing (zero existing test failures)
- [ ] Code review approved
- [ ] Performance: Page load with nav < 1 second

### Phase 1 Go/No-Go Gate

**Must Have:**
- ✓ Sidebar renders at correct widths
- ✓ Bottom nav appears on mobile
- ✓ All 8 routes functional
- ✓ No E2E test failures

**Nice to Have:**
- Dark mode styling
- Animations/transitions

**If Not Met:** Fix failing tests before Phase 2

---

## Phase 2: Dashboard (Apr 15-21)

### Objectives
- Create dashboard landing page
- Implement all 8 dashboard sections
- Role-based dashboard variations
- Empty state onboarding

### Deliverables

#### Tasks (7 days parallel work)

**Task 2.1: Dashboard Page Scaffolding** (1 day)
- **File:** `apps/secretary-console/views/dashboard/dashboard-view.js`
- **Size:** 100-150 lines
- **Requirements:**
  - Router handler (#/dashboard or /)
  - Layout with sidebar + navbar
  - Sections placeholder divs
- **Testing:** Renders without errors

**Task 2.2: Welcome Section** (1 day)
- **File:** `apps/secretary-console/views/dashboard/sections/welcome.js`
- **Size:** 80-120 lines
- **Requirements:**
  - Greeting: "Welcome back, [Name]"
  - Role badge (Executive, Staff, Member)
  - Last login timestamp
  - Dynamic content from auth context

**Task 2.3: Key Statistics Section** (2 days)
- **File:** `apps/secretary-console/views/dashboard/sections/statistics.js`
- **Size:** 150-200 lines
- **Requirements:**
  - 4 cards (Meetings, Members, Actions, AI Help)
  - Query endpoints for live data
  - Role-based metrics (some hidden for certain roles)
  - Loading states while fetching
  - Error handling

**Task 2.4: Quick Action Buttons** (1 day)
- **File:** `apps/secretary-console/views/dashboard/sections/quick-actions.js`
- **Size:** 100-150 lines
- **Requirements:**
  - 4 buttons
  - Role-based visibility
  - Navigate to correct routes on click
  - Hover/active states

**Task 2.5: Intelligence Feature Cards** (2 days)
- **File:** `apps/secretary-console/views/dashboard/sections/feature-cards.js`
- **Size:** 200-250 lines
- **Requirements:**
  - 4 cards (Meetings, Business, Geographic, AI Kiosk)
  - Icons, titles, descriptions
  - "Learn More" and "Open" buttons
  - 2x2 grid on desktop, stack on mobile
  - Animations (card entrance)

**Task 2.6: Recent Activity Feed** (2 days)
- **File:** `apps/secretary-console/views/dashboard/sections/activity-feed.js`
- **Size:** 200-250 lines
- **Requirements:**
  - Fetch last 5 activities from API
  - 5 activity types (✓, ↑, +, ⚠)
  - Click items to navigate to detail pages
  - Loading states
  - Empty state (no activities)

**Task 2.7: Calendar Widget** (1 day)
- **File:** `apps/secretary-console/views/dashboard/sections/calendar-widget.js`
- **Size:** 120-150 lines
- **Requirements:**
  - Next 3-5 upcoming events
  - Date/time/location info
  - Click event to navigate to meeting detail
  - If no events, show "No upcoming events"

**Task 2.8: Analytics Summary** (1 day)
- **File:** `apps/secretary-console/views/dashboard/sections/analytics-summary.js`
- **Size:** 100-120 lines
- **Requirements:**
  - 3 KPIs (Meetings, Members, NPS)
  - "View Full Analytics" link
  - Visible for Exec/Staff only
  - Hidden for Members/Public

**Task 2.9: Empty State (New Users)** (1 day)
- **File:** `apps/secretary-console/views/dashboard/sections/empty-state.js`
- **Size:** 80-120 lines
- **Requirements:**
  - 3-step onboarding flow
  - CTAs for each step
  - Show when no data exists
  - Hide when user has data

**Task 2.10: Dashboard Styling** (2 days)
- **File:** `apps/secretary-console/styles/dashboard.css`
- **Size:** 400-500 lines
- **Requirements:**
  - Section containers and spacing
  - Card styling
  - Buttons and links
  - Responsive breakpoints
  - Light/dark theme support

**Task 2.11: Role-Based Variations** (2 days)
- **Files:** Modify multiple sections
- **Requirements:**
  - Executive: All sections visible
  - Staff: No admin/billing sections
  - Member: Only their business, no meetings
  - Public: Not shown dashboard (direct to kiosk)

**Task 2.12: Dashboard Testing & QA** (3 days)
- **Tests:**
  - Unit: Each section renders correctly
  - Integration: Sections load together
  - E2E: Dashboard loads, sections visible
  - Visual regression: All breakpoints
  - Accessibility: WCAG 2.1 AA
- **Devices:** Desktop, tablet, mobile
- **Scenarios:**
  - Exec user: all sections
  - Staff user: no admin/billing
  - Member user: limited sections
  - New user: empty state shows
  - Existing user: data loads correctly

### Phase 2 Success Criteria

- [ ] Dashboard renders all 8 sections
- [ ] Each section has live data (or loading state)
- [ ] Role-based variations working
- [ ] Empty state shows for new users
- [ ] Responsive at all breakpoints
- [ ] Accessibility meets WCAG 2.1 AA
- [ ] All E2E tests passing
- [ ] Performance: Dashboard loads < 2 seconds

### Phase 2 Go/No-Go Gate

**Must Have:**
- ✓ All 8 sections rendering
- ✓ Data loading (or placeholder)
- ✓ Role-based visibility correct
- ✓ No E2E failures

**If Not Met:** Fix failing sections before Phase 3

---

## Phase 3: Page Layout Templates (Apr 22-28)

### Objectives
- Create 8 reusable page layout templates
- Document each template
- Test across all breakpoints

### Deliverables

#### Task 3.1-3.8: Layout Templates

**Task 3.1: List + Header Template** (1 day)
- **File:** `apps/secretary-console/templates/list-with-header.js`
- **Size:** 150-200 lines
- **Usage:** Meetings list, Business list
- **Includes:** Header, filters, list, pagination

**Task 3.2: Detail + Tabs Template** (1 day)
- **File:** `apps/secretary-console/templates/detail-with-tabs.js`
- **Size:** 150-200 lines
- **Usage:** Meeting detail, Business detail
- **Includes:** Header, tab bar, content area

**Task 3.3: Map-Based Template** (1.5 days)
- **File:** `apps/secretary-console/templates/map-layout.js`
- **Size:** 200-250 lines
- **Usage:** Geographic Intelligence
- **Includes:** Map, sidebar controls, markers

**Task 3.4: Chat Interface Template** (1 day)
- **File:** `apps/secretary-console/templates/chat-interface.js`
- **Size:** 150-200 lines
- **Usage:** AI Kiosk
- **Includes:** Message list, input, suggestions

**Task 3.5: Form/Settings Template** (1 day)
- **File:** `apps/secretary-console/templates/form-layout.js`
- **Size:** 150-200 lines
- **Usage:** Settings, Profile, Feature flags
- **Includes:** Tabs, form sections, save button

**Task 3.6: Table/Analytics Template** (1.5 days)
- **File:** `apps/secretary-console/templates/analytics-layout.js`
- **Size:** 200-250 lines
- **Usage:** Analytics, Admin panels
- **Includes:** Summary cards, charts, table

**Task 3.7: Billing Template** (1 day)
- **File:** `apps/secretary-console/templates/billing-layout.js`
- **Size:** 150-200 lines
- **Usage:** Billing page
- **Includes:** Current plan, usage, history

**Task 3.8: Admin Panel Template** (1 day)
- **File:** `apps/secretary-console/templates/admin-layout.js`
- **Size:** 150-200 lines
- **Usage:** Admin pages
- **Includes:** Table, toolbar, actions

**Task 3.9: Component Library** (2 days)
- **File:** `apps/secretary-console/components/template-components.js`
- **Size:** 400-500 lines
- **Includes:**
  - FilterBar component
  - SearchInput component
  - PaginationControl component
  - TabBar component
  - StatCard component
  - ListItem component

**Task 3.10: Template Documentation** (2 days)
- **File:** `docs/TEMPLATE_USAGE_GUIDE.md`
- **Size:** 2,000+ lines
- **Includes:**
  - Each template: mockup, specs, usage
  - Code examples for each template
  - Component reference
  - Responsive behavior
  - Accessibility notes

**Task 3.11: Template Styling** (2 days)
- **File:** `apps/secretary-console/styles/templates.css`
- **Size:** 500-600 lines
- **Includes:**
  - Grid layouts
  - Responsive breakpoints
  - Colors and typography
  - Spacing and padding

**Task 3.12: Template Testing** (2 days)
- **Tests:**
  - Unit: Each template component
  - Visual: All templates on 3 breakpoints
  - Accessibility: Keyboard nav, screen reader
  - E2E: Templates in real pages
- **Scenarios:**
  - Desktop display
  - Tablet layout
  - Mobile layout
  - Form submission
  - Pagination navigation

### Phase 3 Success Criteria

- [ ] All 8 templates implemented
- [ ] Component library complete
- [ ] Documentation written and examples provided
- [ ] Responsive at all breakpoints
- [ ] Accessibility compliant
- [ ] All template tests passing
- [ ] Code review approved

### Phase 3 Go/No-Go Gate

**Must Have:**
- ✓ All 8 templates coded
- ✓ All templates responsive
- ✓ No accessibility violations

**If Not Met:** Finish templates before Phase 4

---

## Phase 4: Refinement & Polish (Apr 29 - May 5)

### Objectives
- Add animations and transitions
- Accessibility audit and fixes
- Performance optimization
- Cross-browser testing

### Deliverables

**Task 4.1: Animations & Transitions** (2 days)
- Card entrance animations (stagger)
- Page transitions
- Loading spinners
- Hover/click effects
- Prefers-reduced-motion support

**Task 4.2: Accessibility Audit** (2 days)
- Contrast ratio verification
- Keyboard navigation testing
- Screen reader testing
- Focus management
- ARIA labels and roles
- Form accessibility

**Task 4.3: Performance Optimization** (1 day)
- Dashboard load time target: <2 seconds
- Navigation load time: <500ms
- Lazy-load images
- Debounce search/filters
- Code-split templates

**Task 4.4: Cross-Browser Testing** (2 days)
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

**Task 4.5: Print Styles (Optional)** (1 day)
- Reports printable
- Meeting minutes printable
- Hide nav on print
- Optimize colors for B&W

**Task 4.6: Dark Mode Preparation (Optional)** (1 day)
- CSS variables for colors
- Dark theme not activated, but ready
- Toggle placeholder in user menu

**Task 4.7: Final QA** (3 days)
- Regression testing (all E2E tests)
- Visual regression (screenshots)
- Performance testing
- Accessibility testing
- User acceptance testing (UAT)

### Phase 4 Success Criteria

- [ ] All animations smooth and <200ms
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Dashboard loads in <2 seconds
- [ ] All E2E tests passing
- [ ] Cross-browser testing complete
- [ ] No console errors or warnings
- [ ] Performance metrics on target

### Phase 4 Go/No-Go Gate

**Must Have:**
- ✓ Accessibility audit passed
- ✓ All E2E tests passing
- ✓ Performance targets met

**Go to Production:** Ready for Phase 5+6 implementation

---

## Phase 5 & 6: Feature Implementation (May 6+ / Parallel)

These phases use the templates, components, and styling from Phases 1-4.

**Phase 5:** Meetings page (using Template 1 + 2)
**Phase 6:** Business Hub page (using Template 1 + 2)

Both can run in parallel. See `DASHBOARD_AND_IA_DESIGN.md` for details.

---

## Dependency Map

```
Phase 1: Navigation (Foundation)
    │
    ├─→ Phase 2: Dashboard
    │        │
    │        └─→ Phase 3: Templates
    │                 │
    │                 └─→ Phase 4: Polish
    │                      │
    │                      └─→ PRODUCTION READY
    │
    ├─→ Phase 5: Meetings (Parallel with Phase 6)
    │
    └─→ Phase 6: Business Hub (Parallel with Phase 5)

Timeline: Phases 1-4 sequential (6 weeks)
         Phases 5-6 start after Phase 3 complete (can overlap Phase 4)
         Phase 4 refinement continues while 5-6 implement features
```

---

## Testing Strategy

### Unit Testing
- Each component: renders, handles props, handles events
- Coverage target: 80%+
- Framework: Existing test suite

### Integration Testing
- Navigation routes correctly
- Dashboard loads all sections
- Templates work with real data
- Role-based visibility enforced

### E2E Testing
- Full user flows (login → dashboard → feature → detail)
- All 4 user roles tested
- Responsive breakpoints tested
- Mobile touch interactions
- Keyboard navigation

### Visual Regression Testing
- Screenshots at 3 breakpoints
- Automated comparison (PixelMatch or similar)
- Manual review of changes

### Accessibility Testing
- Automated: axe-core, Lighthouse
- Manual: Screen reader (NVDA/JAWS)
- Keyboard only navigation
- Focus management
- Color contrast

### Performance Testing
- Load time <2 seconds (dashboard)
- Core Web Vitals targets met
- No jank or stuttering
- Smooth animations

### UAT (User Acceptance Testing)
- Real users test dashboard
- Executive feedback on feature cards
- Staff feedback on operations sections
- Mobile user feedback

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Phase 1 delays navigation | Medium | High | Start with high priority; have backup code |
| Responsive bugs on mobile | Medium | Medium | Daily testing on real devices, not just emulators |
| Accessibility issues found late | Low | High | Audit continuously, not at end |
| Performance regressions | Low | Medium | Monitor load time during development |
| E2E test failures | Medium | High | Don't merge until all tests pass |
| Browser compatibility issues | Low | Medium | Test weekly on 4+ browsers |
| Team capacity issues | Medium | Medium | Have detailed specs so knowledge-transfer easy |

---

## Success Metrics (Measuring Impact)

After implementation, measure:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Dashboard load time | <2 sec | N/A | TBD |
| Feature discovery (user survey) | 90% aware | N/A | TBD |
| Mobile usage (% of traffic) | +25% | TBD | TBD |
| Accessibility (WCAG audit) | AA | N/A | TBD |
| User satisfaction (NPS) | 45+ | TBD | TBD |
| Feature adoption (features used) | 80%+ | N/A | TBD |
| Support tickets (design-related) | -30% | TBD | TBD |

---

## Implementation Best Practices

### Code Quality
- Pre-commit hooks (ESLint, Prettier)
- Code review required before merge
- Max 250 lines per component
- Clear function naming
- Comments for complex logic

### Version Control
- Feature branches (`feature/dashboard`, `feature/navigation`, etc.)
- Commit messages: `feat:`, `fix:`, `refactor:`, `docs:`
- Pull request template with checklist
- Squash commits before merge

### Communication
- Daily standup (15 min)
- Weekly progress report
- Slack channel for questions
- Design review meetings (2x weekly)
- UAT feedback loop

### Documentation
- Code comments for non-obvious logic
- Component API documentation
- Usage examples for each template
- Architecture decision records (ADRs)
- Implementation guides

---

## Handoff to Phase 5+6 Teams

When Phase 3 (Templates) complete, provide to development teams:

1. **Design Specification** - DASHBOARD_AND_IA_DESIGN.md
2. **Quick Reference** - DASHBOARD_IA_QUICK_REFERENCE.md
3. **Template Guide** - TEMPLATE_USAGE_GUIDE.md
4. **Code Examples** - Commented templates in `/apps/secretary-console/templates/`
5. **Storybook (Optional)** - Visual component library
6. **Figma (Optional)** - Design handoff with measurements
7. **Color/Typography Guide** - Exact specs for styling

---

## Appendix: Weekly Status Reports Template

**Week of: [Date]**

### Completed
- [ ] Phase X Task 1 - Description
- [ ] Phase X Task 2 - Description

### In Progress
- [ ] Phase X Task 3 - 50% complete, expected [date]

### Blocked
- [ ] Phase X Task 4 - Blocked on [reason], mitigation: [plan]

### Risks
- [ ] [Risk name] - Probability: [H/M/L], Impact: [H/M/L]

### Next Week
- [ ] Planned tasks...

### Metrics
- Code coverage: X%
- E2E tests: X/Y passing
- Performance: Dashboard loads in X sec
- Accessibility: X violations remaining

---

**Document Status:** READY FOR IMPLEMENTATION
**Version:** 1.0
**Last Updated:** 2026-03-28

