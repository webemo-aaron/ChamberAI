# Phase 4: Sidebar + Visual Refresh - Quick Reference

**Status**: Design Complete ✅
**Full Spec**: [PHASE_4_DESIGN_SPEC.md](./PHASE_4_DESIGN_SPEC.md)
**Created**: 2026-03-28

---

## At a Glance

### What's New
- Dark left sidebar (220px fixed, #1a1a1a background)
- 6 navigation links with role/tier gating
- Mobile bottom tab bar (<600px breakpoint)
- API config moved to topbar popover
- User identity + logout in sidebar footer

### Layout Changes
| Breakpoint | Sidebar | Navigation |
|------------|---------|------------|
| Desktop (>768px) | 220px fixed, visible | Sidebar links |
| Tablet (600-900px) | 220px fixed, visible | Sidebar links |
| Mobile (<600px) | Hidden | Bottom icon nav |

---

## Navigation Links (6 total)

| # | Link | Icon | Route | Visible | Role Gate | Tier Gate |
|---|------|------|-------|---------|-----------|-----------|
| 1 | Meetings | 📋 | #/meetings | Always | None | None |
| 2 | Business Hub | 🏢 | #/business-hub | Always | None | None |
| 3 | Settings | ⚙️ | #/settings | Always | None | None |
| 4 | Billing | 💳 | #/billing | Conditional | secretary+ | None |
| 5 | Admin | 👑 | #/admin | Conditional | admin | None |
| 6 | AI Kiosk | 🤖 | #/kiosk | Conditional | secretary+ | Council+ |

---

## Design Tokens (Key Colors)

```css
/* Sidebar */
--sidebar-bg: #1a1a1a (dark)
--sidebar-text: #f8f3eb (cream)
--sidebar-text-muted: rgba(248, 243, 235, 0.6)
--sidebar-link-hover-bg: rgba(255, 255, 255, 0.08)
--sidebar-link-active-bg: rgba(10, 93, 82, 0.15)
--sidebar-border: #2a2a2a

/* Active State */
Border: 3px left #0a5d52 (accent)
Background: 15% opacity accent
```

---

## File Changes

### Create
- `src/components/sidebar.js` (150-200 lines)
- `src/components/sidebar.css` (300-400 lines)
- `src/components/topbar.js` (100-150 lines)

### Modify
- `index.html` - Add sidebar + bottom nav markup, remove view-nav
- `app.js` - Import sidebar module, wire up event handlers
- `styles.css` - Adjust shell grid, add responsive rules

### Lines of Code
- New CSS: ~420 lines
- Modified CSS: ~125 lines
- New JS: ~350 lines
- Net: +895 lines added

---

## Test Compatibility

### Preserved IDs
✅ All existing test IDs maintained:
- `#apiBase`, `#saveApiBase`, `#logout`
- All modals, buttons, inputs unchanged

### New Selectors
```javascript
// Sidebar links
[data-testid="sidebar-link-meetings"]
[data-testid="sidebar-link-business-hub"]
// ... etc for all 6 links

// Mobile nav
[data-testid="bottom-nav-meetings"]
// ... etc

// Other
[data-testid="sidebar-logout"]
[data-testid="api-config-btn"]
```

### Classes to Update
- Replace `.view-tab` with `.sidebar-link`
- Replace `.view-nav` with `.sidebar`
- Add `.active` state to sidebar links

---

## CSS Architecture

### Sidebar Structure
```
.sidebar (fixed, 220px)
├── .sidebar-header (optional)
├── .sidebar-nav
│   └── .sidebar-link × 6
│       ├── .sidebar-icon
│       └── .sidebar-label
└── .sidebar-footer
    ├── .user-info
    │   ├── .user-avatar
    │   └── .user-details
    │       ├── .user-email
    │       └── .user-role
    └── .btn-logout

.bottom-nav (mobile only, fixed bottom, 56px)
└── .bottom-nav-link × 6
    └── .bottom-icon
```

### Responsive Grid
```css
/* Desktop */
.shell {
  margin-left: 220px;
  grid-template-columns: minmax(280px, 1fr) minmax(380px, 1.2fr);
}

/* Tablet - same sidebar, stack panes */
@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
    margin-left: 220px;
  }
}

/* Mobile - hide sidebar, show bottom nav */
@media (max-width: 600px) {
  .sidebar { display: none; }
  .bottom-nav { display: flex; }
  .shell { margin-left: 0; padding-bottom: 76px; }
}
```

---

## Implementation Checklist

### Phase 4 Steps
1. [ ] Create sidebar.js + sidebar.css files
2. [ ] Add sidebar markup to index.html
3. [ ] Modify shell grid in styles.css
4. [ ] Wire up sidebar in app.js
5. [ ] Test desktop layout (>768px)
6. [ ] Test tablet layout (600-900px)
7. [ ] Test mobile layout (<600px)
8. [ ] Update E2E tests (class selectors)
9. [ ] Verify role/tier gating works
10. [ ] Local testing & validation
11. [ ] Code review
12. [ ] Staging deployment
13. [ ] Production rollout

---

## Quick Start Commands

```bash
# Check design spec
cat docs/PHASE_4_DESIGN_SPEC.md

# Estimate CSS lines
wc -l apps/secretary-console/styles.css

# Find view-nav to replace
grep -n "view-nav\|view-tab" apps/secretary-console/styles.css

# Test mobile breakpoint
# In browser DevTools: Set viewport to 375x812
```

---

## Key Decisions & Rationale

1. **Fixed Sidebar vs. Hamburger Menu**
   - Fixed sidebar visible at >768px (persistent navigation)
   - Bottom tab bar on mobile (better touch targets, less screen space)

2. **Dark Sidebar vs. Light**
   - Dark (#1a1a1a) provides contrast to light content area
   - Matches brand ink color (existing .brand-mark background)

3. **6 Links vs. Fewer**
   - All major views accessible (Meetings, Business, Settings, Billing, Admin, Kiosk)
   - Role/tier gating hides non-applicable links

4. **Icon + Label vs. Icon-Only (Desktop)**
   - Label visibility aids discoverability
   - Icons provide quick recognition

5. **Icon-Only (Mobile)**
   - Space constraint at <600px
   - Title attributes provide context for screen readers

6. **Left Border Active State**
   - Clear visual indicator of active link
   - Subtle background prevents harsh contrast
   - Consistent with dark UI patterns

---

## Success Metrics

### Desktop (>768px)
- ✅ Sidebar visible & functional
- ✅ All navigation links accessible
- ✅ Active state clearly indicated
- ✅ User info displayed
- ✅ No layout shift on navigation

### Tablet (600-900px)
- ✅ Sidebar visible (same as desktop)
- ✅ Content panes stack vertically
- ✅ No horizontal scroll

### Mobile (<600px)
- ✅ Sidebar hidden
- ✅ Bottom nav visible (6 icons)
- ✅ Icons 24px, buttons 56px height
- ✅ Content doesn't hide under nav
- ✅ Touch targets adequate

### E2E Tests
- ✅ All existing tests pass
- ✅ New selectors work
- ✅ Role gating verified
- ✅ Mobile breakpoint tested

---

## Common Questions

**Q: Will this break existing tests?**
A: No—all element IDs preserved. Only class selectors need updates (`.view-tab` → `.sidebar-link`).

**Q: What happens to the old view-nav buttons?**
A: Replaced by sidebar. Old markup removed from index.html.

**Q: How does API config work on mobile?**
A: Moved to popover button in topbar (⚙️ icon) for space efficiency.

**Q: Can the sidebar collapse?**
A: Not in Phase 4. Future enhancement possible (Phase 5+).

**Q: What about dark mode?**
A: Already dark sidebar. Full dark mode theme deferred to Phase 5+.

---

## Phase 4 Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Design (DONE) | ✅ Complete | Spec + Reference Guide |
| Implementation | Est. 2-3 days | Code ready for review |
| Testing | Est. 1-2 days | E2E passing, staging validated |
| Deployment | Est. 0.5 days | Live in production |
| **Total** | **~4-5 days** | Production-ready |

---

## Related Documents

- **Full Spec**: [PHASE_4_DESIGN_SPEC.md](./PHASE_4_DESIGN_SPEC.md)
- **Phase 3 Complete**: Settings Route Multi-Agent Implementation
- **Phase 9b Complete**: Kiosk Frontend Implementation
- **Memory**: ChamberAI Project Memory with full context

---

## Next Steps After Phase 4

1. **Phase 5**: Business Hub Refinement & Advanced Exports
2. **Phase 6**: Analytics Dashboard
3. **Phase 7**: SSO/SAML Integration
4. **Phase 8**: Full-Text Search Enhancements
5. **Phase 9c**: Kiosk Chat Widget (Parallel)

---

**Document Version**: 1.0
**Last Updated**: 2026-03-28
**Status**: Ready for Implementation
**Next Reviewer**: Phase 4 Implementation Team Lead
