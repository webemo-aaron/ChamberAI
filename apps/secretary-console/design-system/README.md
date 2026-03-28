# ChamberAI Design System

**Quick reference for developers and designers**

## Overview

The ChamberAI Design System provides a comprehensive set of design tokens, component styles, and guidelines for building a consistent, accessible, and beautiful product interface.

**Latest Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** March 28, 2026

## Quick Start

### 1. Import Design System CSS Files

```html
<!-- In your HTML head -->
<link rel="stylesheet" href="/design-system/colors.css">
<link rel="stylesheet" href="/design-system/typography.css">
<link rel="stylesheet" href="/design-system/spacing.css">
<link rel="stylesheet" href="/design-system/shadows.css">
<link rel="stylesheet" href="/design-system/buttons.css">
<link rel="stylesheet" href="/design-system/forms.css">
<link rel="stylesheet" href="/design-system/animations.css">
<link rel="stylesheet" href="/design-system/accessibility.css">
```

### 2. Use CSS Variables

```css
/* Colors */
background-color: var(--color-primary);
color: var(--color-text-primary);

/* Spacing */
padding: var(--space-4);
margin-bottom: var(--space-5);

/* Typography */
font-family: var(--font-body);
font-size: var(--font-size-md);

/* Shadows */
box-shadow: var(--shadow-2);

/* Radius */
border-radius: var(--radius-md);
```

## File Structure

| File | Purpose |
|------|---------|
| `DESIGN_SYSTEM.md` | Complete specification (3,000+ words) |
| `colors.css` | Color palette and variables |
| `typography.css` | Font families, sizes, weights, line heights |
| `spacing.css` | Grid system, padding, margin utilities |
| `shadows.css` | Elevation system and border radius |
| `buttons.css` | Button component styles |
| `forms.css` | Form input and control styles |
| `animations.css` | Transitions and animation utilities |
| `accessibility.css` | A11y utilities and WCAG AA compliance |
| `README.md` | This file |

## Color Palette

### Primary Colors

| Color | Hex | Use Case |
|-------|-----|----------|
| Blue | `#0066CC` | Primary actions, brand, links |
| Green | `#00CC66` | Success, verified, positive |
| Purple | `#9933FF` | AI features, premium, innovation |

### Semantic Colors

| Color | Hex | Use Case |
|-------|-----|----------|
| Error / Red | `#DC3545` | Errors, danger, delete |
| Warning / Orange | `#FF9800` | Warnings, caution |
| Info / Light Blue | `#0099FF` | Information, help |

### Neutrals

| Color | Hex | Use Case |
|-------|-----|----------|
| Black | `#0A0E27` | Primary text |
| Gray | `#5C5C5C` | Secondary text |
| Light Gray | `#E8E8E8` | Borders |
| White | `#FFFFFF` | Backgrounds |

**CSS Usage:**
```css
background-color: var(--color-primary);      /* Blue */
color: var(--color-success);                 /* Green */
border-color: var(--color-error);            /* Red */
```

## Typography

### Font Stack

```css
--font-display: system fonts (Segoe UI, Roboto, etc)
--font-body: system fonts (Segoe UI, Roboto, etc)
--font-code: monospace (SF Mono, Monaco, etc)
```

### Font Sizes

| Size | Value | Usage |
|------|-------|-------|
| `xs` | 12px | Captions, small labels |
| `sm` | 13px | Labels, form text |
| `base` | 14px | Small body text |
| `md` | 16px | Main body text |
| `lg` | 18px | Minor headings (H5) |
| `xl` | 24px | Section headings (H4) |
| `2xl` | 32px | Major headings (H3) |
| `3xl` | 40px | Page headings (H2) |
| `4xl` | 48px | Hero titles (H1) |

**CSS Usage:**
```css
font-size: var(--font-size-md);
font-weight: var(--font-semibold);  /* 600 */
line-height: var(--line-height-relaxed);  /* 1.5 */
```

## Spacing & Grid

### Spacing Scale (8px base)

| Scale | Value | Use Case |
|-------|-------|----------|
| 0 | 0px | No gap |
| 1 | 4px | Micro |
| 2 | 8px | Small |
| 3 | 12px | Small-medium |
| 4 | 16px | Standard (most common) |
| 5 | 24px | Medium |
| 6 | 32px | Large |
| 7 | 48px | Extra large |
| 8 | 64px | XXL |
| 9 | 96px | XXXL |

**CSS Usage:**
```css
padding: var(--space-4);           /* 16px */
margin-bottom: var(--space-5);     /* 24px */
gap: var(--space-3);               /* 12px */
```

**Utility Classes:**
```html
<div class="p-4">                    <!-- padding: 16px -->
<div class="px-5 py-4">             <!-- horizontal 24px, vertical 16px -->
<div class="mt-6 mb-4">             <!-- margin-top: 32px, margin-bottom: 16px -->
<div class="grid gap-4">            <!-- CSS Grid with 16px gap -->
```

## Shadows & Elevation

### Shadow System

| Level | Value | Usage |
|-------|-------|-------|
| 1 | `0 2px 4px rgba(...)` | Subtle, hover |
| 2 | `0 4px 8px rgba(...)` | Default card |
| 3 | `0 8px 16px rgba(...)` | Elevated card |
| 4 | `0 12px 24px rgba(...)` | Modal/popover |
| 5 | `0 20px 40px rgba(...)` | Full-screen modal |
| 6 | `0 24px 48px rgba(...)` | Critical alert |

**CSS Usage:**
```css
box-shadow: var(--shadow-2);
border-radius: var(--radius-md);
```

**Utility Classes:**
```html
<div class="shadow-2">               <!-- Medium shadow -->
<div class="hover:shadow-3:hover">   <!-- Hover effect -->
<div class="rounded-md">             <!-- 12px border radius -->
```

## Buttons

### Basic Syntax

```html
<!-- Primary Button (default) -->
<button class="button button--primary">
  <span class="button__icon">🔷</span>
  <span class="button__text">Create</span>
</button>

<!-- Secondary Button -->
<button class="button button--secondary">Cancel</button>

<!-- Danger Button -->
<button class="button button--danger">Delete</button>

<!-- Icon Button -->
<button class="button button--icon button--primary" aria-label="Close">✕</button>
```

### Button Variants

| Class | Style | Use Case |
|-------|-------|----------|
| `button--primary` | Blue solid | Main actions |
| `button--secondary` | Gray outline | Alternative actions |
| `button--danger` | Red solid | Destructive actions |
| `button--success` | Green solid | Positive actions |
| `button--ghost` | Transparent blue text | Minimal actions |
| `button--outline` | Blue outline | Secondary emphasis |
| `button--icon` | Square | Icon-only buttons |
| `button--text` | Text only | Link-like buttons |

### Button Sizes

| Class | Height | Use Case |
|-------|--------|----------|
| `button--small` | 32px | Compact layouts |
| `button--medium` | 40px | Default (most common) |
| `button--large` | 48px | Prominent actions |

## Forms

### Form Syntax

```html
<form class="form">
  <div class="form-group">
    <label for="email" class="required">Email Address</label>
    <input
      type="email"
      id="email"
      class="form-control"
      placeholder="you@example.com"
      required
    >
    <p class="help-text">We'll never share your email</p>
  </div>

  <div class="form-group">
    <label class="checkbox">
      <input type="checkbox">
      <span>Remember me</span>
    </label>
  </div>

  <button type="submit" class="button button--primary">Sign In</button>
</form>
```

### Form Controls

```html
<!-- Text Input -->
<input type="text" placeholder="Enter text..." />

<!-- Textarea -->
<textarea placeholder="Enter message..."></textarea>

<!-- Select Dropdown -->
<select>
  <option>Choose option...</option>
  <option>Option 1</option>
</select>

<!-- Checkbox -->
<label class="checkbox">
  <input type="checkbox">
  <span>Label text</span>
</label>

<!-- Radio Button -->
<label class="radio">
  <input type="radio" name="option">
  <span>Label text</span>
</label>

<!-- Toggle Switch -->
<label class="toggle">
  <input type="checkbox">
  <span>Enable feature</span>
</label>
```

### Form States

```html
<!-- Default -->
<input type="text" />

<!-- Focused -->
<input type="text" style="border-color: var(--color-primary);" />

<!-- Error -->
<input type="text" class="error" />

<!-- Success -->
<input type="text" class="success" />

<!-- Disabled -->
<input type="text" disabled />

<!-- Loading -->
<input type="text" class="is-loading" />
```

## Accessibility

### Required for WCAG AA Compliance

- **Color Contrast:** 4.5:1 for text, 3:1 for graphics
- **Focus Indicators:** 2px outline, clearly visible
- **Touch Targets:** 44×44px minimum
- **Keyboard Navigation:** All interactive elements accessible
- **Screen Reader Support:** Semantic HTML + ARIA labels

### Accessibility Classes

```html
<!-- Skip to main content -->
<a href="#main" class="skip-to-main">Skip to main content</a>

<!-- Screen reader only -->
<span class="sr-only">Loading...</span>

<!-- Focus visible indicator (automatic) -->
<button>Click me</button>  <!-- Already styled with var(--color-primary) outline -->

<!-- Reduced motion support (automatic) -->
<!-- Animations disabled automatically for users who prefer reduced motion -->

<!-- Alert/Status -->
<div role="status" aria-live="polite">File saved successfully</div>

<!-- Form validation -->
<input aria-invalid="true" aria-describedby="error-1" />
<p id="error-1" class="error-text">Email is required</p>
```

## Animations

### Transition Timing

| Speed | Value | Usage |
|-------|-------|-------|
| Fast | 0.1s | Quick interactions |
| Base | 0.18s | Standard transitions |
| Slow | 0.3s | Page transitions |
| Slower | 0.5s | Entrance animations |

**CSS Usage:**
```css
transition: all var(--timing-base) var(--easing-ease);
```

### Animation Classes

```html
<!-- Fade in/out -->
<div class="fade-in">Content</div>
<div class="fade-out">Content</div>

<!-- Slide in -->
<div class="slide-in-left">From left</div>
<div class="slide-in-right">From right</div>
<div class="slide-in-top">From top</div>
<div class="slide-in-bottom">From bottom</div>

<!-- Loading -->
<div class="animate-spin">Spinning...</div>
<div class="animate-pulse">Pulsing...</div>
<div class="animate-shimmer">Loading...</div>

<!-- Effects -->
<div class="hover:shadow-3:hover">Hover me</div>
<div class="hover:scale-105:hover">Scale on hover</div>
```

## Component Examples

### Card

```html
<div class="card shadow-2 rounded-md p-5">
  <h3 class="h4 mb-2">Meeting Intelligence</h3>
  <p class="text-secondary mb-4">Automatically capture and analyze meetings</p>
  <a href="#" class="text-primary">Learn More →</a>
</div>
```

### Button Group

```html
<div class="button-group">
  <button class="button button--secondary">Cancel</button>
  <button class="button button--primary">Save</button>
</div>
```

### Alert

```html
<div role="alert" class="p-4 rounded-md bg-blue-50 border-blue border">
  <strong>Info:</strong> This is an informational message.
</div>

<div role="alert" class="p-4 rounded-md bg-red-50 border-red border">
  <strong>Error:</strong> Something went wrong.
</div>
```

### Badge

```html
<span class="inline-block px-3 py-1 rounded-full bg-green-50 text-success text-xs font-semibold">
  ✓ Verified
</span>
```

### Table

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Date</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Q2 Board Meeting</td>
      <td>Mar 28, 2026</td>
      <td><span class="text-success">✓ Complete</span></td>
    </tr>
  </tbody>
</table>
```

## Responsive Design

### Breakpoints

| Breakpoint | Width | Device |
|------------|-------|--------|
| `sm` | 640px | Tablet portrait |
| `md` | 1024px | Tablet landscape |
| `lg` | 1280px | Desktop |
| `xl` | 1536px | Large desktop |

**CSS Usage:**
```css
@media (max-width: 640px) {
  .button--large { padding: 12px 16px; }
}
```

### Responsive Classes

```html
<!-- Hide on mobile, show on desktop -->
<div class="hide-on-mobile show-on-desktop">Desktop only</div>

<!-- Show on mobile, hide on desktop -->
<div class="show-on-mobile hide-on-desktop">Mobile only</div>

<!-- Grid that stacks on mobile -->
<div class="grid grid-cols-3 grid-cols-1-sm">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

## Common Patterns

### Center Content

```html
<div class="container mx-auto px-4">Content</div>
```

### Flex Layout

```html
<div style="display: flex; gap: var(--space-4); align-items: center;">
  <div>Left</div>
  <div>Right</div>
</div>
```

### Grid Layout

```html
<div class="grid grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

### Text Utilities

```html
<!-- Text colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-error">Error text</p>

<!-- Text sizes -->
<p class="text-xs">Extra small</p>
<p class="text-base">Base (16px)</p>
<p class="text-lg">Large</p>

<!-- Text alignment -->
<p class="text-center">Centered</p>
<p class="text-right">Right-aligned</p>

<!-- Text decoration -->
<p class="text-underline">Underlined</p>
<p class="font-bold">Bold</p>
<p class="font-semibold">Semi-bold</p>
```

## Implementation Checklist

- [ ] All CSS files imported in correct order
- [ ] Color variables used instead of hardcoded hex values
- [ ] Typography follows scale (H1-H6, body, captions)
- [ ] Spacing uses 8px grid system
- [ ] All interactive elements have focus indicators
- [ ] Touch targets are minimum 44×44px
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Forms have associated labels
- [ ] Buttons have descriptive text or aria-labels
- [ ] Images have alt text
- [ ] Page has proper heading hierarchy
- [ ] Links are visually distinguishable
- [ ] Error messages are clear and helpful
- [ ] Loading states are visible
- [ ] Responsive design tested at all breakpoints

## Troubleshooting

### Colors look different than expected
- Check CSS variable names (`--color-primary` vs `--color-blue`)
- Verify color contrast with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Ensure dark mode is not active in browser

### Focus indicators not visible
- Press Tab key to activate focus indicators
- Check `outline: 2px solid var(--color-primary)` is applied
- Ensure `:focus-visible` is supported in target browsers

### Spacing doesn't align to grid
- Verify using multiples of `var(--space-4)` (16px)
- Check that margins and padding use design system variables
- Use utility classes like `.p-4`, `.m-5` when possible

### Buttons look wrong
- Verify button has both `.button` and variant class (`.button--primary`)
- Check button height matches size variant (40px for medium)
- Ensure icon size matches button size

## Resources

- **Full Specification:** See `DESIGN_SYSTEM.md` (3,000+ words)
- **Component Gallery:** Available in design system components directory
- **Figma Design File:** [Link to Figma (when available)]
- **Accessibility Guidelines:** WCAG 2.1 AA compliant

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-28 | Initial production release |

## Support & Questions

For questions about the design system:
1. Check `DESIGN_SYSTEM.md` for detailed specifications
2. Review component examples in README.md (this file)
3. Check CSS file comments for implementation details
4. Refer to web standards (WCAG, CSS Working Group)

---

**Last Updated:** March 28, 2026
**Maintained by:** ChamberAI Design & Engineering Team
**Status:** ✅ Production Ready
