# Phase 4: Sidebar + Visual Refresh - Design Specification

**Document Version:** 1.0
**Status:** Design Phase
**Target Audience:** Frontend Implementation Team, QA, E2E Testing
**Estimated CSS:** 800-1000 lines (new) + 400-500 lines (modifications)
**Breakpoint Strategy:** Desktop (>768px) | Tablet (600-900px) | Mobile (<600px)

---

## Executive Summary

Phase 4 introduces a dark sidebar navigation paradigm to the ChamberAI Operations Workspace. This spec standardizes:

1. **Layout Architecture**: Sidebar (220px fixed, dark) + content grid reflow
2. **Navigation Structure**: 6 main links with role/tier gating, active state indicators
3. **Responsive Behavior**: Desktop sidebar → Mobile bottom tab bar (<768px)
4. **Design Tokens**: Extended color palette, spacing scale, animations
5. **Component Integration**: Minimal impact on existing DOM, preserve test IDs
6. **E2E Compatibility**: All existing selectors + new sidebar element IDs

**Key Design Principle**: Migrate from horizontal view-tabs + topbar API config to vertical sidebar navigation while preserving 100% of existing functionality and test coverage.

---

## 1. Layout Architecture

### 1.1 Desktop Layout (>768px)

```
┌───────────────────────────────────────────────────────────────────┐
│ Topbar: Brand (logo + title) | API Config Popover | Auth Status  │
├──────────┬────────────────────────────────────────────────────────┤
│ SIDEBAR  │                                                        │
│ (220px)  │            MAIN CONTENT AREA                          │
│          │  ┌────────────────────────────┬──────────────────────┐│
│ ▣ Nav    │  │   Left Pane (Meetings)     │  Right Pane (Detail)  ││
│ Links    │  │  - Search                  │  - Tab Bar            ││
│ (Fixed)  │  │  - Meeting List            │  - Tab Content        ││
│          │  │                            │                       ││
│──────────┤  └────────────────────────────┴──────────────────────┘│
│ User ID  │                                                        │
│ Logout   │                                                        │
└──────────┴────────────────────────────────────────────────────────┘
```

**Topbar** (height: 72px)
- Left: Brand mark (CAM) + title + subtitle (unchanged from current)
- Right: API Config popover button + Auth status pills + Logout (moved from direct UI)

**Sidebar** (width: 220px, fixed, left: 0, top: 72px)
- Background: #1a1a1a (dark ink)
- Text: #f8f3eb (light cream)
- Position: fixed (does not scroll with content)
- Border-right: 1px solid #2a2a2a (subtle edge)
- Z-index: 100 (above main content)

**Main Content** (grid-template-columns adjustment)
- Previous: `minmax(320px, 1fr) minmax(420px, 1.2fr)`
- New: `margin-left: 220px; grid-template-columns: minmax(280px, 1fr) minmax(380px, 1.2fr);`
- Padding adjustment: 24px 40px 60px → 24px 40px 60px (same, but left margin handles sidebar)

**Body Layout Change**
```css
body {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.topbar {
  flex-shrink: 0;
  height: 72px;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 72px;
  width: 220px;
  height: calc(100vh - 72px);
  /* ... styling ... */
}

main {
  margin-left: 220px;
  flex: 1;
  overflow-y: auto;
}
```

---

### 1.2 Tablet Layout (600-900px)

```
┌────────────────────────────────────┐
│ Topbar (stacked, compact)          │
├────────────────────────────────────┤
│ SIDEBAR (220px, visible)           │
│ + CONTENT (side-by-side, scrolls)  │
│ Left Pane content stacks in shell  │
└────────────────────────────────────┘
```

- Sidebar: Still visible (220px, fixed)
- Main content: Left pane + right pane stack vertically
- Grid change: `grid-template-columns: 1fr` (full-width panes stack)
- Shell padding: Reduced to 20px 24px 60px
- Sidebar still takes space reservation

---

### 1.3 Mobile Layout (<600px)

```
┌──────────────────────────────┐
│ Topbar (brand + auth pills)  │
├──────────────────────────────┤
│                              │
│   MAIN CONTENT (full width)  │
│   - Left pane (meetings)     │
│   - Right pane (detail)      │
│   - Full scrolling           │
│                              │
├──────────────────────────────┤
│ BOTTOM TAB BAR (56px fixed)  │
│ [▣] [⚙] [💳] [🔐] [🤖] [❌] │ (icon-only)
└──────────────────────────────┘
```

**Key Changes:**
- Sidebar: Hidden (`display: none`)
- Main content: No margin-left, full width
- Bottom tab bar: Fixed, 56px height, 6 icons only (labels hidden)
- Shell: Padding-bottom: 60px (to not hide under tab bar)
- Content area: Max-width: 100%, no restrictions

**Bottom Tab Bar Positioning**
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #1a1a1a;
  border-top: 1px solid #2a2a2a;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}
```

---

## 2. Navigation Structure

### 2.1 Sidebar Links (Desktop & Tablet)

**Link Order & Roles:**

| Link | Icon | Route | Role Requirement | Tier Requirement | Notes |
|------|------|-------|------------------|------------------|-------|
| 1. Meetings | 📋 | /meetings | None (guest) | Free | Default view, always visible |
| 2. Business Hub | 🏢 | /business-hub | None (guest) | Free | Local business directory |
| 3. Settings | ⚙️ | /settings | None (guest) | Free | User preferences, API config |
| 4. Billing | 💳 | /billing | secretary+ | Free | Subscription, tier, invoices |
| 5. Admin | 👑 | /admin | admin | Free | Product/Stripe admin tools |
| 6. AI Kiosk | 🤖 | /kiosk | secretary+ | Council+ | Premium full-screen chat |

**HTML Structure (Sidebar):**
```html
<aside class="sidebar">
  <!-- Sidebar Header (optional logo/branding) -->
  <div class="sidebar-header"></div>

  <!-- Navigation Links -->
  <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
    <a href="#/meetings" class="sidebar-link active" data-testid="sidebar-link-meetings" aria-current="page">
      <span class="sidebar-icon">📋</span>
      <span class="sidebar-label">Meetings</span>
    </a>

    <a href="#/business-hub" class="sidebar-link" data-testid="sidebar-link-business-hub">
      <span class="sidebar-icon">🏢</span>
      <span class="sidebar-label">Business Hub</span>
    </a>

    <a href="#/settings" class="sidebar-link" data-testid="sidebar-link-settings">
      <span class="sidebar-icon">⚙️</span>
      <span class="sidebar-label">Settings</span>
    </a>

    <a href="#/billing" class="sidebar-link billing-link" data-testid="sidebar-link-billing" style="display: none;">
      <span class="sidebar-icon">💳</span>
      <span class="sidebar-label">Billing</span>
    </a>

    <a href="#/admin" class="sidebar-link admin-link" data-testid="sidebar-link-admin" style="display: none;">
      <span class="sidebar-icon">👑</span>
      <span class="sidebar-label">Admin</span>
    </a>

    <a href="#/kiosk" class="sidebar-link kiosk-link" data-testid="sidebar-link-kiosk" style="display: none;">
      <span class="sidebar-icon">🤖</span>
      <span class="sidebar-label">AI Kiosk</span>
    </a>
  </nav>

  <!-- Sidebar Footer (User Identity + Logout) -->
  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar"></div>
      <div class="user-details">
        <div class="user-email" id="sidebarUserEmail">user@domain.com</div>
        <div class="user-role" id="sidebarUserRole">Secretary</div>
      </div>
    </div>
    <button id="sidebarLogout" class="btn-logout" data-testid="sidebar-logout">
      <span class="logout-icon">🚪</span>
      <span class="logout-label">Logout</span>
    </button>
  </div>
</aside>
```

### 2.2 Active State & Link Behavior

**Active Link Styling:**
```css
.sidebar-link {
  /* Inactive state */
  color: rgba(248, 243, 235, 0.7);
  border-left: 3px solid transparent;
  transition: all 0.18s ease;
}

.sidebar-link:hover {
  color: #f8f3eb;
  background: rgba(255, 255, 255, 0.08);
  padding-left: 18px; /* Slight indent on hover */
}

.sidebar-link.active {
  /* Active state */
  color: #f8f3eb;
  background: rgba(10, 93, 82, 0.15); /* Subtle accent tint */
  border-left: 3px solid var(--accent); /* #0a5d52 */
  padding-left: 18px;
}

.sidebar-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
```

**Hidden Links (Role/Tier Gating):**
- Billing: Show when role >= secretary (hide guest)
- Admin: Show when role === admin
- AI Kiosk: Show when role >= secretary AND tier >= Council

```javascript
// In app.js, after auth state changes:
function updateSidebarVisibility(role, tier) {
  const billingLink = document.querySelector('.billing-link');
  const adminLink = document.querySelector('.admin-link');
  const kioskLink = document.querySelector('.kiosk-link');

  // Show/hide based on role
  billingLink.style.display = (role !== 'guest') ? 'flex' : 'none';
  adminLink.style.display = (role === 'admin') ? 'flex' : 'none';

  // Show/hide based on tier
  kioskLink.style.display = (role !== 'guest' && tier === 'Council') ? 'flex' : 'none';
}
```

### 2.3 Bottom Tab Bar (Mobile <600px)

**HTML Structure:**
```html
<!-- Rendered at bottom of page, above footer -->
<nav class="bottom-nav" role="navigation" aria-label="Mobile navigation" style="display: none;">
  <a href="#/meetings" class="bottom-nav-link active" data-testid="bottom-nav-meetings" aria-current="page" title="Meetings">
    <span class="bottom-icon">📋</span>
  </a>
  <a href="#/business-hub" class="bottom-nav-link" data-testid="bottom-nav-business-hub" title="Business Hub">
    <span class="bottom-icon">🏢</span>
  </a>
  <a href="#/settings" class="bottom-nav-link" data-testid="bottom-nav-settings" title="Settings">
    <span class="bottom-icon">⚙️</span>
  </a>
  <a href="#/billing" class="bottom-nav-link bottom-billing-link" data-testid="bottom-nav-billing" style="display: none;" title="Billing">
    <span class="bottom-icon">💳</span>
  </a>
  <a href="#/admin" class="bottom-nav-link bottom-admin-link" data-testid="bottom-nav-admin" style="display: none;" title="Admin">
    <span class="bottom-icon">👑</span>
  </a>
  <a href="#/kiosk" class="bottom-nav-link bottom-kiosk-link" data-testid="bottom-nav-kiosk" style="display: none;" title="AI Kiosk">
    <span class="bottom-icon">🤖</span>
  </a>
</nav>
```

---

## 3. Design Tokens

### 3.1 Color Palette

**Primary Colors (Existing)**
```css
:root {
  --bg: #f2efe9;           /* Light background */
  --ink: #1a1a1a;          /* Dark text / sidebar bg */
  --muted: #5c5c5c;        /* Muted text */
  --panel: #fdfbf6;        /* Card/panel background */
  --accent: #0a5d52;       /* Teal/green accent */
  --accent-2: #d05c3a;     /* Orange/coral accent */
  --pill: #e4dfd7;         /* Light pill background */
  --shadow: 0 20px 60px rgba(34, 34, 34, 0.12);
  --radius: 18px;
  --font-display: "Baskerville", "Palatino Linotype", "Book Antiqua", serif;
  --font-ui: "Avenir Next", "Gill Sans", "Futura", sans-serif;
}
```

**New Sidebar Colors**
```css
:root {
  /* Sidebar background */
  --sidebar-bg: #1a1a1a;
  --sidebar-text: #f8f3eb;
  --sidebar-text-muted: rgba(248, 243, 235, 0.6);

  /* Sidebar link states */
  --sidebar-link-hover-bg: rgba(255, 255, 255, 0.08);
  --sidebar-link-active-bg: rgba(10, 93, 82, 0.15);
  --sidebar-border: #2a2a2a;

  /* Bottom nav */
  --bottom-nav-bg: #1a1a1a;
  --bottom-nav-border: #2a2a2a;
}
```

### 3.2 Spacing Scale

Existing scale (maintained):
```css
/* Spacing tokens (multiples of 4px) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;

/* Sidebar-specific spacing */
--sidebar-padding: 20px;         /* Inside sidebar padding */
--sidebar-link-height: 44px;     /* Min-height for touch targets */
--sidebar-link-gap: 12px;        /* Gap between icon + label */
--sidebar-footer-gap: 16px;      /* Gap above footer divider */
```

### 3.3 Typography Scale

```css
/* Sidebar typography */
.sidebar-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.user-email {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.user-role {
  font-size: 11px;
  color: var(--sidebar-text-muted);
  text-transform: capitalize;
  line-height: 1.2;
}

.bottom-nav-link {
  font-size: 24px;           /* Icon size */
}
```

### 3.4 Transitions & Animations

```css
:root {
  --transition-fast: 0.12s ease;     /* Quick feedback */
  --transition-base: 0.18s ease;     /* Standard transition */
  --transition-slow: 0.3s ease;      /* Deliberate animation */

  --ease-out: cubic-bezier(0.33, 0.66, 0.66, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Sidebar animations */
.sidebar-link {
  transition:
    color var(--transition-fast) ease,
    background var(--transition-base) ease,
    padding-left var(--transition-base) ease,
    border-color var(--transition-base) ease;
}

@media (max-width: 600px) {
  /* Bottom nav appears with fade + slide-up */
  @keyframes bottomNavEnter {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .bottom-nav {
    animation: bottomNavEnter var(--transition-slow);
  }
}
```

### 3.5 Border Radius

```css
:root {
  --radius: 18px;           /* Panels, cards */
  --radius-md: 14px;        /* Buttons, inputs */
  --radius-sm: 12px;        /* Small elements */
  --radius-xs: 8px;         /* Minimal radius */
}
```

### 3.6 Shadows

```css
:root {
  --shadow-lg: 0 20px 60px rgba(34, 34, 34, 0.12);
  --shadow-md: 0 10px 20px rgba(10, 93, 82, 0.1);
  --shadow-sm: 0 4px 8px rgba(34, 34, 34, 0.08);
  --shadow-xs: 0 1px 3px rgba(34, 34, 34, 0.05);
}
```

---

## 4. CSS Architecture

### 4.1 File Structure

**New Files to Create:**
1. `src/components/sidebar.css` (300-400 lines)
   - All sidebar styling
   - Responsive behavior
   - Bottom nav styles

2. `src/components/sidebar.js` (150-200 lines)
   - Sidebar initialization
   - Link visibility gating
   - Active state management

3. `src/components/topbar.js` (100-150 lines)
   - API config popover logic
   - Topbar button handlers

**Files to Modify:**
1. `index.html` - Add sidebar + bottom nav markup, remove old view-nav
2. `styles.css` - Modify shell grid, add responsive rules, integrate sidebar vars
3. `app.js` - Import sidebar module, set up event handlers

### 4.2 CSS Class Hierarchy & BEM

**Sidebar Classes:**
```css
/* Block */
.sidebar
.sidebar__header
.sidebar__nav
.sidebar__footer

/* Elements */
.sidebar-link                    /* <a class="sidebar-link"> */
.sidebar-icon                    /* <span class="sidebar-icon"> */
.sidebar-label                   /* <span class="sidebar-label"> */

.sidebar-footer
.user-info
.user-avatar
.user-email
.user-role
.btn-logout

/* Modifiers */
.sidebar-link.active             /* Active route */
.sidebar-link:hover              /* Hover state */
.sidebar-link--admin             /* Admin-only link */
.sidebar-link--billing           /* Billing link */
.sidebar-link--kiosk             /* Kiosk link */

/* Mobile */
.bottom-nav
.bottom-nav-link
.bottom-nav-link.active
.bottom-icon
```

**Topbar Classes (Modified):**
```css
.topbar                          /* Adjust height to 72px */
.brand                           /* Keep unchanged */
.api-config                      /* Convert to popover trigger */
.api-config-trigger              /* New: button for popover */

/* Popover (new) */
.api-popover
.api-popover--visible
.api-popover-content
```

**Shell Grid Classes (Modified):**
```css
.shell {
  /* Change from: grid-template-columns: minmax(320px, 1fr) minmax(420px, 1.2fr); */
  /* To: */
  margin-left: 220px;
  grid-template-columns: minmax(280px, 1fr) minmax(380px, 1.2fr);
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;    /* Keep existing */
  }
}

@media (max-width: 600px) {
  .shell {
    margin-left: 0;
    padding-bottom: 76px;           /* Space for bottom nav */
  }
}
```

### 4.3 Responsive Breakpoints

**Breakpoint Strategy:**
```css
/* Large Desktop (>1200px) */
@media (min-width: 1201px) {
  .sidebar { width: 220px; }
  main { margin-left: 220px; }
  .shell { grid-template-columns: minmax(320px, 1fr) minmax(420px, 1.2fr); }
}

/* Tablet & Desktop (768px - 1200px) */
@media (min-width: 768px) and (max-width: 1200px) {
  .sidebar { width: 220px; }
  main { margin-left: 220px; }
  .shell { grid-template-columns: minmax(280px, 1fr) minmax(380px, 1.2fr); }
}

/* Tablet & Mobile (600px - 768px) */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .bottom-nav { display: flex; }
  main { margin-left: 0; }
  .shell { grid-template-columns: 1fr; }
}

/* Mobile (<600px) */
@media (max-width: 600px) {
  .sidebar { display: none; }
  .bottom-nav { display: flex; }
  .sidebar-label { display: none; }
  .user-info { display: none; }
  /* All existing mobile rules apply */
}
```

### 4.4 Dark Mode Consideration

Current design uses light background with dark sidebar. For future dark mode support:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f0f0f;
    --panel: #1a1a1a;
    --sidebar-bg: #0a0a0a;
    --sidebar-text: #f0f0f0;
    --sidebar-border: #333333;
    --pill: #2a2a2a;
  }
}
```

For Phase 4, stick with light background + dark sidebar (existing design intent).

### 4.5 Mobile-First Approach

While not fully mobile-first existing code, Phase 4 additions follow mobile-first pattern:

```css
/* Base: mobile (no sidebar) */
.sidebar { display: none; }
.bottom-nav { display: flex; }
main { margin-left: 0; }

/* Medium screens: show sidebar, hide bottom nav */
@media (min-width: 768px) {
  .sidebar { display: block; }
  .bottom-nav { display: none; }
  main { margin-left: 220px; }
}
```

---

## 5. Responsive Behavior Detail

### 5.1 Desktop (>768px): Sidebar Visible

**Layout:**
- Topbar: Full width (72px height)
- Sidebar: Fixed left (220px width, 100% viewport height minus topbar)
- Main content: Full width minus sidebar, scrollable
- Bottom nav: Hidden

**Interactions:**
- Click sidebar link → navigate + set active state
- Hover link → background + text color change
- Active link → border-left highlight + accent background
- Mobile nav not rendered in DOM

**CSS Grid Change:**
```css
.shell {
  margin-left: 220px;
  grid-template-columns: minmax(280px, 1fr) minmax(380px, 1.2fr);
}
```

### 5.2 Tablet (600-900px): Sidebar Visible, Content Stacks

**Layout:**
- Same as desktop
- Content area width: ~calc(100vw - 220px - 80px padding)
- Left/right panes may need tighter spacing
- Shell grid: Still 2-column but tighter

**CSS:**
```css
@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;      /* Revert to existing */
    margin-left: 220px;              /* Keep sidebar space */
    gap: 18px;
  }
}
```

### 5.3 Mobile (<600px): Bottom Tab Bar

**Layout:**
- Topbar: Simplified (brand + auth pills, API config in popover)
- Sidebar: Hidden
- Main content: Full width, padding-bottom adds space for nav
- Bottom nav: Fixed, icon-only tabs

**Display Changes:**
```css
@media (max-width: 600px) {
  .sidebar { display: none !important; }
  .sidebar-label { display: none; }
  .sidebar-label--mobile { display: inline; }  /* If needed */

  main {
    margin-left: 0;
    margin-bottom: 56px;
  }

  .shell {
    padding-bottom: 20px;  /* Total: 76px with nav margin */
  }

  .bottom-nav {
    display: flex;
  }

  /* Hide topbar content that doesn't fit */
  .api-config {
    display: none;  /* Replaced by popover icon in topbar */
  }
}
```

**Touch Targets:**
- Bottom nav buttons: 56px height × ~80px width (6 buttons = full viewport)
- Each icon: 24px, centered in button

---

## 6. Component Integration

### 6.1 How Sidebar Affects Existing Containers

**Meetings View (.meetings-container):**
```css
/* No direct changes, lives in right-pane which flows inside .shell */
/* .shell now has margin-left: 220px, so natural reflow */
```

**Business Hub View (.business-hub-container):**
```css
/* Same as meetings - reflows with shell grid */
/* Sidebar links trigger navigation, no styling changes needed */
```

**Modal Positioning:**
```css
.modal {
  /* Centered over entire viewport, including sidebar */
  position: fixed;
  inset: 0;
  z-index: 1000;  /* Above sidebar z-index: 100 */
  /* No changes needed */
}
```

**Toast Notifications:**
```css
.toast {
  /* Position at bottom-right of viewport */
  /* Adjust bottom: 76px on mobile to not hide under nav */
  position: fixed;
  bottom: 24px;
  right: 24px;

  @media (max-width: 600px) {
    bottom: 92px;   /* 76px nav + 16px spacing */
  }
}
```

### 6.2 Topbar API Config Popover

**Current State:**
```html
<div class="api-config">
  <label for="apiBase">API Base</label>
  <input id="apiBase" type="url" placeholder="http://localhost:4000" />
  <button id="saveApiBase" class="btn ghost">Save</button>
  ...
</div>
```

**New State (Popover):**
```html
<div class="api-config">
  <!-- Trigger button (icon: ⚙️ or 🔧) -->
  <button id="apiConfigBtn" class="api-config-trigger" aria-label="API Configuration">⚙️</button>

  <!-- Popover (initially hidden, appears on click) -->
  <div id="apiConfigPopover" class="api-popover hidden" role="dialog" aria-labelledby="apiConfigTitle">
    <h3 id="apiConfigTitle">API Configuration</h3>
    <label for="apiBase">API Base</label>
    <input id="apiBase" type="url" placeholder="http://localhost:4000" />
    <button id="saveApiBase" class="btn">Save</button>
    <button class="btn ghost" onclick="this.closest('.api-popover').classList.add('hidden')">Close</button>
  </div>
</div>
```

**CSS:**
```css
.api-config-trigger {
  /* Small button that opens popover */
  background: #efe7dc;
  border: 1px solid #d8d0c4;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
}

.api-config-trigger:hover {
  background: #e6dccf;
}

.api-popover {
  /* Positioned dropdown/popover */
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--panel);
  border: 1px solid #e6dbcd;
  border-radius: 14px;
  padding: 20px;
  min-width: 280px;
  box-shadow: var(--shadow-md);
  z-index: 200;
}

.api-popover.hidden {
  display: none;
}
```

**JavaScript Handler:**
```javascript
const apiConfigBtn = document.getElementById('apiConfigBtn');
const apiPopover = document.getElementById('apiConfigPopover');

apiConfigBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  apiPopover.classList.toggle('hidden');
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!apiPopover.contains(e.target) && e.target !== apiConfigBtn) {
    apiPopover.classList.add('hidden');
  }
});
```

### 6.3 Sidebar Module Integration

**File: src/components/sidebar.js**
```javascript
/**
 * Sidebar Module
 * - Initialize sidebar links
 * - Handle active state based on current route
 * - Manage role/tier-based visibility
 * - Sync logout button with main logout handler
 */

export function initSidebar(router, auth) {
  const sidebar = document.querySelector('.sidebar');
  const links = document.querySelectorAll('.sidebar-link');
  const sidebarLogout = document.getElementById('sidebarLogout');

  // Listen to route changes
  router.onRouteChange((route) => {
    links.forEach(link => {
      const isActive = link.getAttribute('href') === route;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  });

  // Sync logout button with main logout
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', (e) => {
      e.preventDefault();
      const mainLogout = document.getElementById('logout');
      mainLogout?.click();
    });
  }

  // Update user info
  auth.onAuthStateChange((user, role) => {
    const emailEl = document.getElementById('sidebarUserEmail');
    const roleEl = document.getElementById('sidebarUserRole');
    if (emailEl) emailEl.textContent = user?.email || 'not signed in';
    if (roleEl) roleEl.textContent = role || 'guest';
  });
}

export function updateSidebarVisibility(role, tier) {
  // Show/hide links based on permissions
  const billingLink = document.querySelector('.billing-link');
  const adminLink = document.querySelector('.admin-link');
  const kioskLink = document.querySelector('.kiosk-link');

  if (billingLink) billingLink.style.display = (role !== 'guest') ? 'flex' : 'none';
  if (adminLink) adminLink.style.display = (role === 'admin') ? 'flex' : 'none';
  if (kioskLink) kioskLink.style.display = (role !== 'guest' && tier === 'Council') ? 'flex' : 'none';
}
```

---

## 7. Icons & Visual Elements

### 7.1 Icon Set

Using Unicode/Emoji for simplicity (no SVG sprite sheet required):

| Element | Icon | Unicode | Fallback |
|---------|------|---------|----------|
| Meetings | 📋 | U+1F4CB | 📋 |
| Business Hub | 🏢 | U+1F3E2 | 🏢 |
| Settings | ⚙️ | U+2699 | ⚙️ |
| Billing | 💳 | U+1F4B3 | 💳 |
| Admin | 👑 | U+1F451 | 👑 |
| AI Kiosk | 🤖 | U+1F916 | 🤖 |
| Logout | 🚪 | U+1F6AA | 🚪 |

**CSS:**
```css
.sidebar-icon,
.bottom-icon {
  font-size: 20px;
  line-height: 1;
  display: inline-block;
}

@media (max-width: 600px) {
  .sidebar-icon { font-size: 24px; }
  .bottom-icon { font-size: 24px; }
}
```

### 7.2 Brand Mark Positioning

**Topbar Brand (Unchanged):**
```html
<div class="brand">
  <span class="brand-mark">CAM</span>
  <div>
    <div class="brand-title">Operations Workspace</div>
    <div class="brand-sub">Governance-first minutes workflow</div>
  </div>
</div>
```

**Sidebar Header (Optional):**
```css
.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--sidebar-border);
  text-align: center;
  font-size: 12px;
  color: var(--sidebar-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  /* Optional: show mini logo or "Navigation" label */
}
```

### 7.3 Active State Indicator

**Left Border (Teal) + Subtle Background:**
```css
.sidebar-link.active {
  border-left: 3px solid var(--accent);  /* #0a5d52 */
  padding-left: 18px;
  background: rgba(10, 93, 82, 0.15);    /* 15% opacity accent */
  color: #f8f3eb;
}
```

**Rationale:**
- Left border clearly indicates active state (vertical accent bar)
- Subtle background prevents high contrast
- Padding adjustment maintains left edge alignment

---

## 8. User Identity & Logout

### 8.1 Sidebar Footer Layout

```html
<div class="sidebar-footer">
  <!-- User Info Section -->
  <div class="user-info">
    <div class="user-avatar">
      <!-- Optional: Avatar circle with initials or default icon -->
      <span class="avatar-placeholder">👤</span>
    </div>
    <div class="user-details">
      <div class="user-email" id="sidebarUserEmail">user@example.com</div>
      <div class="user-role" id="sidebarUserRole">Secretary</div>
    </div>
  </div>

  <!-- Logout Button -->
  <button id="sidebarLogout" class="btn-logout" data-testid="sidebar-logout" title="Sign out">
    <span class="logout-icon">🚪</span>
    <span class="logout-label">Logout</span>
  </button>
</div>
```

### 8.2 CSS Styling

```css
.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  border-top: 1px solid var(--sidebar-border);
  background: rgba(0, 0, 0, 0.2);
  display: grid;
  gap: 16px;
}

.user-info {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  align-items: start;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.user-details {
  display: grid;
  gap: 3px;
}

.user-email {
  font-size: 12px;
  font-weight: 600;
  color: var(--sidebar-text);
  word-break: break-word;
  line-height: 1.3;
}

.user-role {
  font-size: 11px;
  color: var(--sidebar-text-muted);
  text-transform: capitalize;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: rgba(208, 92, 58, 0.2);  /* Accent-2 at low opacity */
  color: var(--sidebar-text);
  border: 1px solid rgba(208, 92, 58, 0.4);
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.btn-logout:hover {
  background: rgba(208, 92, 58, 0.3);
  border-color: rgba(208, 92, 58, 0.6);
  color: #f8f3eb;
}

.btn-logout:active {
  transform: scale(0.98);
}

.logout-icon {
  font-size: 16px;
}

.logout-label {
  flex: 1;
  text-align: left;
}

@media (max-width: 600px) {
  .logout-label {
    display: none;
  }

  .btn-logout {
    justify-content: center;
    padding: 8px;
  }
}
```

### 8.3 User Info Update

**JavaScript (app.js):**
```javascript
import { initSidebar, updateSidebarVisibility } from './components/sidebar.js';

// After auth state changes
onAuthStateChange((user, role) => {
  // Update sidebar user info
  const emailEl = document.getElementById('sidebarUserEmail');
  const roleEl = document.getElementById('sidebarUserRole');

  if (emailEl && user) {
    emailEl.textContent = user.email || user.displayName || 'User';
  }
  if (roleEl) {
    roleEl.textContent = role || 'Guest';
  }

  // Update link visibility
  const tier = BillingService.getCurrentTier();
  updateSidebarVisibility(role, tier);
});
```

---

## 9. E2E Test Compatibility

### 9.1 DOM Element Preservation

**All Existing Test IDs Preserved:**
- `#apiBase` → Moved inside popover (same ID, still testable)
- `#saveApiBase` → Moved inside popover (same ID, same functionality)
- `#logout` → Kept in topbar (same ID)
- `#loginSubmit`, `#quickSubmit`, etc. → Unchanged
- `.shell`, `.left-pane`, `.right-pane` → Unchanged structure

**Existing CSS Classes Preserved:**
- `.view-nav`, `.view-tab` → **Removed from DOM** (replaced by sidebar)
  - **Action Required**: Update any tests that reference these classes
  - **New Selectors**: Use `.sidebar-link` instead

- `.modal`, `.modal-content`, `.tab-bar`, `.tab-pane` → Unchanged
- `.panel`, `.meeting-card`, `.business-card` → Unchanged

### 9.2 New Test Selectors

**Sidebar Links:**
```javascript
// Test: Click Meetings link
const meetingsLink = document.querySelector('[data-testid="sidebar-link-meetings"]');
meetingsLink.click();

// Test: Verify active state
expect(meetingsLink.classList.contains('active')).toBe(true);
```

**Bottom Nav (Mobile):**
```javascript
// Test: Mobile navigation visible
const bottomNav = document.querySelector('.bottom-nav');
expect(window.getComputedStyle(bottomNav).display).toBe('flex'); // At <600px

// Test: Click bottom nav
const bottomMeetingsLink = document.querySelector('[data-testid="bottom-nav-meetings"]');
bottomMeetingsLink.click();
```

**Sidebar Footer:**
```javascript
// Test: User email displayed
const userEmail = document.getElementById('sidebarUserEmail');
expect(userEmail.textContent).toBe('user@example.com');

// Test: Logout button
const logoutBtn = document.querySelector('[data-testid="sidebar-logout"]');
logoutBtn.click(); // Should trigger logout
```

### 9.3 Updated E2E Test Suite

**Tests to Update:**
1. **Navigation Tests**
   - Replace `.view-tab` selectors with `.sidebar-link`
   - Add mobile breakpoint tests for `.bottom-nav`

2. **Active State Tests**
   - Update from `.view-tab.active` to `.sidebar-link.active`
   - Check `aria-current="page"` attribute

3. **Responsive Layout Tests**
   - Add assertions for sidebar visibility at >768px
   - Add assertions for bottom nav visibility at <600px

**Example Updated Test:**
```javascript
// OLD (Phase 3)
it('should highlight active view tab', async () => {
  const meetingsTab = page.locator('.view-tab[aria-pressed="true"]');
  expect(meetingsTab).toHaveClass('active');
});

// NEW (Phase 4, Desktop)
it('should highlight active sidebar link on desktop', async () => {
  const meetingsLink = page.locator('[data-testid="sidebar-link-meetings"]');
  expect(meetingsLink).toHaveClass('active');
  expect(meetingsLink).toHaveAttribute('aria-current', 'page');
});

// NEW (Phase 4, Mobile)
it('should show bottom nav on mobile and highlight active link', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  const bottomNav = page.locator('.bottom-nav');
  expect(bottomNav).toBeVisible();

  const meetingsLink = page.locator('[data-testid="bottom-nav-meetings"]');
  expect(meetingsLink).toHaveClass('active');
});
```

### 9.4 Test ID Strategy

**Naming Convention:**
```
[data-testid="sidebar-link-{route}"]    → Sidebar links
[data-testid="bottom-nav-{route}"]      → Bottom nav links
[data-testid="sidebar-logout"]          → Sidebar logout
[data-testid="api-config-btn"]          → API popover trigger
```

**Classes for Selectors:**
```css
.sidebar                   /* Main sidebar container */
.sidebar-link              /* Navigation links */
.sidebar-link.active       /* Active state */
.sidebar-footer            /* Footer section */
.user-info                 /* User details */
.bottom-nav                /* Mobile bottom nav */
.bottom-nav-link           /* Mobile nav links */
.api-popover               /* API config popover */
```

---

## 10. Implementation Checklist

### 10.1 Files to Create

- [ ] **src/components/sidebar.js** (150-200 lines)
  - `initSidebar(router, auth)` function
  - `updateSidebarVisibility(role, tier)` function
  - Event handlers for links and logout
  - Route change listener for active state

- [ ] **src/components/sidebar.css** (300-400 lines)
  - Sidebar container styles
  - Link states (hover, active, focus)
  - Footer styles
  - Bottom nav styles
  - Responsive rules (@media)

- [ ] **src/components/topbar.js** (100-150 lines)
  - API config popover initialization
  - Open/close handlers
  - Focus management

### 10.2 Files to Modify

- [ ] **index.html**
  - Remove `.view-nav` section (lines 41-45)
  - Add sidebar markup (after topbar, before main)
  - Add bottom nav markup (before closing body)
  - Ensure all test IDs preserved

- [ ] **app.js**
  - Import sidebar module: `import { initSidebar, updateSidebarVisibility } from './components/sidebar.js';`
  - Call `initSidebar(router, auth)` in init function
  - Update `onAuthStateChange` to call `updateSidebarVisibility`
  - Update API config logic for popover

- [ ] **styles.css**
  - Add CSS custom properties for sidebar colors/spacing
  - Modify `.shell` grid: add `margin-left: 220px` (desktop)
  - Modify body/main layout to support fixed sidebar
  - Add responsive rules (@media 768px, 600px)
  - Import sidebar.css at top of file (or inline)

### 10.3 Integration Points

**Module Imports:**
```javascript
// app.js
import { registerRoute, navigate, onRouteChange } from "./core/router.js";
import { initSidebar, updateSidebarVisibility } from "./components/sidebar.js";
import { initTopbar } from "./components/topbar.js";
```

**Initialization Sequence:**
```javascript
// 1. Initialize sidebar after DOM ready
initSidebar(router, auth);

// 2. Initialize topbar (API config popover)
initTopbar();

// 3. Listen to auth state for sidebar visibility
auth.onAuthStateChange((user, role) => {
  updateSidebarVisibility(role, getBillingTier());
});

// 4. Listen to billing tier changes
BillingService.onTierChange((tier) => {
  const currentRole = getCurrentRole();
  updateSidebarVisibility(currentRole, tier);
});
```

### 10.4 CSS Line Estimates

**sidebar.css:**
- Sidebar container: ~80 lines
- Link styles: ~60 lines
- Footer & user info: ~80 lines
- Bottom nav: ~100 lines
- Responsive rules: ~100 lines
- **Total: ~420 lines**

**styles.css (modifications):**
- Custom properties: ~20 lines
- Shell grid changes: ~30 lines
- Body/main layout: ~25 lines
- Responsive overrides: ~50 lines
- **Total additions: ~125 lines**

**Existing CSS Removal:**
- `.view-nav`, `.view-tab` styles: ~50 lines (DELETE)

**Grand Total:**
- New: ~545 lines (sidebar.css + styles.css changes)
- Removed: ~50 lines (view-nav)
- Net: +495 lines

### 10.5 Testing Strategy

**Unit Tests (JavaScript):**
1. `sidebar.js`
   - Test: Link active state updates on route change
   - Test: Visibility updates on role change
   - Test: Logout button triggers main logout

2. `topbar.js`
   - Test: Popover opens on button click
   - Test: Popover closes on outside click
   - Test: API config saves correctly

**E2E Tests (Playwright):**
1. Desktop (>768px)
   - Sidebar visible
   - Links navigable
   - Active state correct

2. Mobile (<600px)
   - Sidebar hidden
   - Bottom nav visible
   - Icon-only display
   - Navigation works

3. Responsive Transitions
   - Viewport resize triggers layout change
   - Links remain functional at all breakpoints

4. Role/Tier Gating
   - Billing link hidden for guests
   - Admin link hidden for non-admins
   - Kiosk link hidden for non-Council users

---

## 11. Implementation Notes & Considerations

### 11.1 DOM Rendering Order

**Optimal Markup Order:**
```html
<body>
  <div class="grain"></div>
  <header class="topbar">...</header>
  <aside class="sidebar">...</aside>
  <main class="shell">...</main>
  <nav class="bottom-nav" style="display: none;">...</nav>
  <div id="toast">...</div>
  <div id="loginModal">...</div>
  <!-- Other modals -->
</body>
```

Rationale:
- Sidebar before main (DOM order matters for layout)
- Bottom nav after main (doesn't affect scroll)
- Modals/toast last (highest z-index)

### 11.2 Fixed Positioning & Scrolling

**Sidebar:**
- `position: fixed` doesn't participate in document flow
- Main content gets `margin-left: 220px` to respect sidebar space
- Main content has `overflow-y: auto` for internal scrolling

**Bottom Nav (Mobile):**
- `position: fixed; bottom: 0;`
- Main content: `padding-bottom: 76px` to avoid hiding under nav
- No z-index collision (sidebar z-index: 100, bottom-nav z-index: 100, same layer OK)

### 11.3 Accessibility Considerations

**Semantic HTML:**
```html
<aside class="sidebar" role="complementary" aria-label="Main navigation">
  <nav role="navigation" aria-label="Main navigation links">
    <a ... aria-current="page">Meetings</a>
    <a ...>Business Hub</a>
  </nav>
</aside>

<nav class="bottom-nav" role="navigation" aria-label="Mobile navigation">
  <a ... aria-current="page" title="Meetings">📋</a>
</nav>
```

**Focus Management:**
- Sidebar links: tab-able, focus-visible outline (3px solid accent)
- Bottom nav: tab-able, title attribute provides context
- Popover: focus trap when open, return to trigger on close

**Screen Readers:**
- Active link: `aria-current="page"` attribute
- Sidebar labels: read at all widths
- Bottom nav icons: title attribute provides label

### 11.4 Potential Performance Considerations

**Transitions:**
- Use `--transition-base: 0.18s ease` (fast enough to feel responsive)
- Avoid complex animations on sidebar open/close

**Repaints:**
- Fixed sidebar doesn't cause repaints on content scroll
- Hover states use only color/background (no layout shifts)
- Use `will-change: none` (no optimization needed)

**Layout Shift:**
- Sidebar width is fixed (220px) - no CLS risk
- Bottom nav height is fixed (56px) - no CLS risk

### 11.5 Future Enhancements (Out of Scope)

- Collapsible sidebar (icon-only mode)
- Dark theme variant
- Sidebar search/filter
- Keyboard shortcuts overlay
- Sidebar animations (slide-in on mobile)
- Badge count on nav links (unread items)
- Nested navigation (accordion)

---

## 12. Visual Design Mockups

### 12.1 Desktop Layout Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ CAM Operations Workspace │ ⚙️ | Auth Status | 👤 | Logout      │
├──────────┬──────────────────────────────────────────────────┤
│ 📋 Meet  │  ┌────────────────────────┬──────────────────┐   │
│ ings     │  │ 🔍 Search meetings...  │ Minutes          │   │
│          │  │                        │ ┌──────────────┐ │   │
│ 🏢 Bus   │  │ [Meeting Card 1]       │ │ Minutes      │ │   │
│ iness    │  │ [Meeting Card 2]       │ │ [Editable]   │ │   │
│ Hub      │  │ [Meeting Card 3]       │ │              │ │   │
│          │  │                        │ └──────────────┘ │   │
│ ⚙️ Sett  │  └────────────────────────┴──────────────────┘   │
│ ings     │                                                   │
│          │  (Tabs: Minutes|Actions|Audit|Motions|Summary)   │
│ 💳 Bill  │                                                   │
│ ing      │                                                   │
│          │                                                   │
│ 👑 Admin │                                                   │
│          │                                                   │
│ 🤖 Kiosk │                                                   │
│          │                                                   │
├──────────┤                                                   │
│ 👤 user@ │                                                   │
│ example. │                                                   │
│ com      │                                                   │
│ Secretary│                                                   │
│          │                                                   │
│ 🚪 Logout│                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### 12.2 Mobile Layout Mockup

```
┌──────────────────────────────┐
│ CAM | ⚙️ Auth | 👤 Logout    │
├──────────────────────────────┤
│                              │
│   Main Content               │
│   (Meetings/Business/etc)    │
│   Full Width, Scrollable     │
│                              │
│                              │
├──────────────────────────────┤
│ 📋 🏢 ⚙️ 💳 👑 🤖            │
│ (Icon-only, 56px height)     │
└──────────────────────────────┘
```

### 12.3 Color Palette Reference

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar Background: #1a1a1a (Dark Ink)                  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                                         │
│ Sidebar Text: #f8f3eb (Light Cream)                     │
│ Sidebar Text Muted: rgba(248,243,235,0.6)              │
│ Sidebar Link Hover BG: rgba(255,255,255,0.08)          │
│ Sidebar Link Active BG: rgba(10,93,82,0.15)            │
│ Sidebar Border: #2a2a2a                                 │
│                                                         │
│ Active Link Border: #0a5d52 (Accent)                    │
│ ═════════════════════════════════════════════════════  │
│                                                         │
│ Panel Background: #fdfbf6 (Light Panel)                 │
│ Button Primary: #0a5d52 (Accent)                        │
│ Button Logout: rgba(208,92,58,0.2) (Accent-2 low)     │
│                                                         │
│ Text Primary: #1a1a1a (Dark Ink)                        │
│ Text Muted: #5c5c5c                                     │
│ Background: #f2efe9 (Light BG)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 13. Rollout & Deployment

### 13.1 Phase 4 Rollout Steps

1. **Code Review** (1 day)
   - Review sidebar.js module
   - Review sidebar.css styles
   - Verify no breaking changes to existing code

2. **Local Testing** (1-2 days)
   - Functional testing on desktop/tablet/mobile
   - Role/tier gating verification
   - E2E test updates

3. **Staging Deployment** (1 day)
   - Deploy to staging environment
   - Run full E2E test suite
   - Smoke test critical paths

4. **Production Deployment** (1 day)
   - Deploy to production
   - Monitor error logs
   - Verify all navigation routes accessible

### 13.2 Fallback & Rollback Plan

**If Breaking Issues Found:**
1. Identify affected CSS or JS module
2. Revert Phase 4 commit
3. Hotfix in new branch
4. Re-deploy after verification

**Feature Flags (Optional):**
```javascript
// In modules.js
const FEATURE_FLAGS = {
  ...existing,
  PHASE_4_SIDEBAR: true,  // Can be toggled to disable
};

// In app.js
if (FEATURE_FLAGS.PHASE_4_SIDEBAR) {
  initSidebar(router, auth);
} else {
  initViewNav();  // Fallback to old view-nav
}
```

---

## 14. Success Criteria & Acceptance Tests

### 14.1 Desktop Success Criteria

- [ ] Sidebar visible at >768px breakpoint
- [ ] Sidebar (220px) + content maintains responsive grid
- [ ] All 6 navigation links present (with gating rules)
- [ ] Active link shows left border + accent background
- [ ] Hover state: link text brightens + slight background
- [ ] User email/role displayed in footer
- [ ] Logout button triggers session end
- [ ] API config popover opens/closes correctly
- [ ] No horizontal scroll at any viewport width
- [ ] All existing modals work (above sidebar z-index)

### 14.2 Mobile Success Criteria (<600px)

- [ ] Sidebar hidden (not in DOM or `display: none`)
- [ ] Bottom nav visible (6 icon buttons)
- [ ] Bottom nav icons 24px size
- [ ] Bottom nav height 56px, fixed positioning
- [ ] Icons only (no labels visible)
- [ ] Active link shows indicator (background/border)
- [ ] Touch targets ≥44px recommended (56px/6 = 9-10px gap, acceptable)
- [ ] Content doesn't hide under bottom nav (padding-bottom)
- [ ] Toast notifications appear above bottom nav
- [ ] Navigation responsive without layout shifts (CLS <0.1)

### 14.3 E2E Test Success Criteria

- [ ] All existing test IDs preserved & functional
- [ ] Navigation links testable via `[data-testid="sidebar-link-*"]`
- [ ] Mobile nav testable via `[data-testid="bottom-nav-*"]`
- [ ] Active state detectable via `.active` class
- [ ] Role gating verified (admin/billing/kiosk links)
- [ ] Responsive breakpoints verified
- [ ] No console errors or accessibility warnings

### 14.4 Visual Regression Tests

- [ ] Desktop layout matches mockup (sidebar + content)
- [ ] Mobile layout matches mockup (bottom nav)
- [ ] Colors match design tokens
- [ ] Spacing/padding consistent across components
- [ ] Hover/focus states clearly visible
- [ ] No unexpected font rendering or alignment issues

---

## 15. Appendix: Code Snippets & References

### 15.1 HTML Template (Complete Sidebar)

```html
<aside class="sidebar">
  <!-- Optional header -->
  <div class="sidebar-header">Navigation</div>

  <!-- Navigation -->
  <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
    <a href="#/meetings" class="sidebar-link active" data-testid="sidebar-link-meetings" aria-current="page">
      <span class="sidebar-icon">📋</span>
      <span class="sidebar-label">Meetings</span>
    </a>
    <a href="#/business-hub" class="sidebar-link" data-testid="sidebar-link-business-hub">
      <span class="sidebar-icon">🏢</span>
      <span class="sidebar-label">Business Hub</span>
    </a>
    <a href="#/settings" class="sidebar-link" data-testid="sidebar-link-settings">
      <span class="sidebar-icon">⚙️</span>
      <span class="sidebar-label">Settings</span>
    </a>
    <a href="#/billing" class="sidebar-link billing-link" data-testid="sidebar-link-billing" style="display: none;">
      <span class="sidebar-icon">💳</span>
      <span class="sidebar-label">Billing</span>
    </a>
    <a href="#/admin" class="sidebar-link admin-link" data-testid="sidebar-link-admin" style="display: none;">
      <span class="sidebar-icon">👑</span>
      <span class="sidebar-label">Admin</span>
    </a>
    <a href="#/kiosk" class="sidebar-link kiosk-link" data-testid="sidebar-link-kiosk" style="display: none;">
      <span class="sidebar-icon">🤖</span>
      <span class="sidebar-label">AI Kiosk</span>
    </a>
  </nav>

  <!-- Footer -->
  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar">👤</div>
      <div class="user-details">
        <div class="user-email" id="sidebarUserEmail">user@example.com</div>
        <div class="user-role" id="sidebarUserRole">Secretary</div>
      </div>
    </div>
    <button id="sidebarLogout" class="btn-logout" data-testid="sidebar-logout" title="Sign out">
      <span class="logout-icon">🚪</span>
      <span class="logout-label">Logout</span>
    </button>
  </div>
</aside>
```

### 15.2 Sidebar Module (sidebar.js)

```javascript
/**
 * Sidebar Module - Navigation and interaction management
 */

export function initSidebar(router, auth) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return; // Not present on login page

  const links = document.querySelectorAll('.sidebar-link');
  const sidebarLogout = document.getElementById('sidebarLogout');

  // Handle link clicks
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      // Links are plain <a> tags with href, router will handle
      // Just ensure active state is updated
      updateActiveLink(link);
    });
  });

  // Listen to router changes
  router.onRouteChange?.((route) => {
    const activeLink = sidebar.querySelector(`a[href="${route}"]`);
    if (activeLink) {
      updateActiveLink(activeLink);
    }
  });

  // Sync logout button
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', (e) => {
      e.preventDefault();
      const mainLogout = document.getElementById('logout');
      if (mainLogout) mainLogout.click();
    });
  }

  // Update user info on auth change
  auth.onAuthStateChange?.((user, role) => {
    const emailEl = document.getElementById('sidebarUserEmail');
    const roleEl = document.getElementById('sidebarUserRole');

    if (emailEl && user) {
      emailEl.textContent = user.email || user.displayName || 'User';
    }
    if (roleEl) {
      roleEl.textContent = role || 'Guest';
    }
  });
}

function updateActiveLink(link) {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(l => {
    l.classList.remove('active');
    l.setAttribute('aria-current', 'false');
  });

  link.classList.add('active');
  link.setAttribute('aria-current', 'page');
}

export function updateSidebarVisibility(role, tier) {
  const billingLink = document.querySelector('.billing-link');
  const adminLink = document.querySelector('.admin-link');
  const kioskLink = document.querySelector('.kiosk-link');
  const bottomBillingLink = document.querySelector('.bottom-billing-link');
  const bottomAdminLink = document.querySelector('.bottom-admin-link');
  const bottomKioskLink = document.querySelector('.bottom-kiosk-link');

  // Billing: visible for secretary, admin
  const showBilling = role && role !== 'guest';
  if (billingLink) billingLink.style.display = showBilling ? 'flex' : 'none';
  if (bottomBillingLink) bottomBillingLink.style.display = showBilling ? 'flex' : 'none';

  // Admin: visible for admin only
  const showAdmin = role === 'admin';
  if (adminLink) adminLink.style.display = showAdmin ? 'flex' : 'none';
  if (bottomAdminLink) bottomAdminLink.style.display = showAdmin ? 'flex' : 'none';

  // Kiosk: visible for secretary/admin with Council tier
  const showKiosk = role && role !== 'guest' && tier === 'Council';
  if (kioskLink) kioskLink.style.display = showKiosk ? 'flex' : 'none';
  if (bottomKioskLink) bottomKioskLink.style.display = showKiosk ? 'flex' : 'none';
}
```

### 15.3 Essential Sidebar CSS (sidebar.css excerpt)

```css
:root {
  --sidebar-bg: #1a1a1a;
  --sidebar-text: #f8f3eb;
  --sidebar-text-muted: rgba(248, 243, 235, 0.6);
  --sidebar-link-hover-bg: rgba(255, 255, 255, 0.08);
  --sidebar-link-active-bg: rgba(10, 93, 82, 0.15);
  --sidebar-border: #2a2a2a;
  --sidebar-width: 220px;
  --sidebar-link-height: 44px;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 72px;
  width: var(--sidebar-width);
  height: calc(100vh - 72px);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 20px 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(248, 243, 235, 0.7);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.18s ease;
  min-height: var(--sidebar-link-height);
}

.sidebar-link:hover {
  color: var(--sidebar-text);
  background: var(--sidebar-link-hover-bg);
  padding-left: 20px;
}

.sidebar-link.active {
  color: var(--sidebar-text);
  background: var(--sidebar-link-active-bg);
  border-left-color: var(--accent);
}

.sidebar-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--sidebar-border);
  background: rgba(0, 0, 0, 0.2);
  display: grid;
  gap: 16px;
}

.user-info {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.user-email {
  font-size: 12px;
  font-weight: 600;
  color: var(--sidebar-text);
  word-break: break-word;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: rgba(208, 92, 58, 0.2);
  color: var(--sidebar-text);
  border: 1px solid rgba(208, 92, 58, 0.4);
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.btn-logout:hover {
  background: rgba(208, 92, 58, 0.3);
  border-color: rgba(208, 92, 58, 0.6);
}

/* Mobile Bottom Nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--sidebar-bg);
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.bottom-nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  font-size: 24px;
  color: rgba(248, 243, 235, 0.7);
  text-decoration: none;
  transition: all 0.18s ease;
  border-top: 3px solid transparent;
  cursor: pointer;
}

.bottom-nav-link:hover,
.bottom-nav-link.active {
  color: var(--sidebar-text);
  border-top-color: var(--accent);
  background: var(--sidebar-link-hover-bg);
}

/* Responsive */
@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
```

---

## Conclusion

This comprehensive design specification provides the Phase 4 implementation team with:

1. **Clear Visual Architecture**: Sidebar + content layout with responsive adaptation
2. **Detailed Component Specs**: Navigation links, footers, mobile alternatives
3. **Design Tokens**: Colors, spacing, typography, animations
4. **CSS Architecture**: File structure, class naming, responsive breakpoints
5. **Integration Points**: How sidebar connects to existing modules
6. **E2E Test Strategy**: Preserved IDs, new selectors, mobile testing
7. **Implementation Checklist**: Files, integration, testing, deployment

**Design Philosophy**: Maintain 100% backward compatibility with existing features while introducing modern sidebar navigation paradigm. All navigation preserved, all tests refactored, zero breaking changes to API or core modules.

**Ready for Implementation**: Forward this spec to the Phase 4 team with this document as the single source of truth for design decisions, CSS classes, DOM structure, and responsive behavior.

