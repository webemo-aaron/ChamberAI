# ChamberAI Design System - Getting Started

Start here if you're new to the ChamberAI Design System.

## 1. Quick Setup (5 minutes)

### Add to Your HTML
```html
<!DOCTYPE html>
<html>
<head>
  <!-- Design System CSS Files -->
  <link rel="stylesheet" href="/design-system/colors.css">
  <link rel="stylesheet" href="/design-system/typography.css">
  <link rel="stylesheet" href="/design-system/spacing.css">
  <link rel="stylesheet" href="/design-system/shadows.css">
  <link rel="stylesheet" href="/design-system/buttons.css">
  <link rel="stylesheet" href="/design-system/forms.css">
  <link rel="stylesheet" href="/design-system/animations.css">
  <link rel="stylesheet" href="/design-system/accessibility.css">
</head>
<body>
  <!-- Your content here -->
</body>
</html>
```

## 2. Learn by Example (10 minutes)

### Common Tasks

#### Create a Primary Button
```html
<button class="button button--primary">Click Me</button>
```

#### Style a Text Input
```html
<input type="text" class="form-control" placeholder="Enter text..." />
```

#### Build a Card
```html
<div class="shadow-2 rounded-md p-5 bg-primary">
  <h3 class="h4">Card Title</h3>
  <p>Card content goes here</p>
</div>
```

#### Add Spacing
```html
<!-- Padding: 16px -->
<div class="p-4">Content</div>

<!-- Margin-bottom: 24px -->
<div class="mb-5">Content</div>

<!-- Gap between flex items: 8px -->
<div style="display: flex; gap: var(--space-2);">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

#### Apply Color
```html
<!-- Blue text -->
<p class="text-primary">Primary text</p>

<!-- Green background -->
<div class="bg-success">Success message</div>

<!-- Red border -->
<input class="border-red" />
```

## 3. Key Concepts (15 minutes)

### CSS Variables
Everything is built on CSS variables. Use them:
```css
/* DON'T do this */
color: #0066CC;

/* DO this */
color: var(--color-primary);
```

### Spacing Grid
All spacing is 8px-based:
```
var(--space-1) = 4px
var(--space-2) = 8px   ← common for gaps
var(--space-4) = 16px  ← common for padding
var(--space-5) = 24px  ← common for margins
var(--space-6) = 32px
```

### Color Palette
Three main colors:
- **Blue** `#0066CC` - primary actions, brand
- **Green** `#00CC66` - success, verified
- **Purple** `#9933FF` - AI, premium

Plus semantic: red (error), orange (warning), blue (info)

### Responsive Breakpoints
```
320px  (sm) - Mobile
640px  (md) - Tablet
1024px (lg) - Desktop
1280px (xl) - Large desktop
```

## 4. Common Patterns (20 minutes)

### Button Group
```html
<div class="button-group">
  <button class="button button--secondary">Cancel</button>
  <button class="button button--primary">Save</button>
</div>
```

### Form Section
```html
<form class="form">
  <div class="form-group">
    <label for="email" class="required">Email</label>
    <input type="email" id="email" />
    <p class="help-text">We'll help you reset your password</p>
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

### Alert Messages
```html
<!-- Success -->
<div role="alert" class="p-4 rounded-md bg-green-50 border border-green">
  ✓ Success: Meeting created!
</div>

<!-- Error -->
<div role="alert" class="p-4 rounded-md bg-red-50 border border-red">
  ✕ Error: Something went wrong
</div>

<!-- Info -->
<div role="alert" class="p-4 rounded-md bg-blue-50 border border-blue">
  ℹ Info: Changes will be saved automatically
</div>
```

### Responsive Grid
```html
<div class="grid grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

<!-- On mobile (< 640px): stacks to 1 column -->
```

## 5. Accessibility Checklist

Before shipping, verify:

- [ ] Color contrast: Text passes 4.5:1 (use [contrast checker](https://webaim.org/resources/contrastchecker/))
- [ ] Focus visible: Press Tab, see outline on all buttons
- [ ] Keyboard only: Can use site with only Tab/Enter/Arrow keys
- [ ] Labels: All inputs have `<label>` elements
- [ ] Alt text: All images have `alt=""` attribute
- [ ] Headings: H1 → H2 → H3 (never skip levels)
- [ ] Links: Text is descriptive (not "click here")
- [ ] Touch targets: Buttons are at least 44×44px

## 6. Real-World Examples

### Meeting Card
```html
<div class="card shadow-2 rounded-lg p-5">
  <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
    <div>
      <h3 class="h5 mb-2">Q2 Board Meeting</h3>
      <p class="text-secondary text-sm mb-3">
        📅 Mar 28, 2:00 PM | 📍 Conference Room
      </p>
      <p class="text-sm mb-4">
        <span class="badge">3 Action Items</span>
        <span class="badge">12 Members</span>
      </p>
    </div>
    <span class="badge bg-green-50 text-success">Complete</span>
  </div>
  <div class="button-group mt-4">
    <button class="button button--secondary button--small">View Minutes</button>
    <button class="button button--primary button--small">Export</button>
  </div>
</div>
```

### Filter Form
```html
<form class="form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
  <div class="form-group">
    <label for="category">Category</label>
    <select id="category">
      <option>All</option>
      <option>Meetings</option>
      <option>Actions</option>
    </select>
  </div>

  <div class="form-group">
    <label for="status">Status</label>
    <select id="status">
      <option>All</option>
      <option>Active</option>
      <option>Completed</option>
    </select>
  </div>

  <div style="display: flex; align-items: flex-end; gap: var(--space-2);">
    <button type="submit" class="button button--primary" style="flex: 1;">
      Filter
    </button>
    <button type="reset" class="button button--ghost">
      Clear
    </button>
  </div>
</form>
```

## 7. Helpful Resources

### Inside This Package
- **README.md** - Quick reference for all components
- **DESIGN_SYSTEM.md** - Full specification (3,000+ words)
- **colors.css** - All color variables
- **typography.css** - Font sizes and weights
- **spacing.css** - Grid and spacing utilities
- **buttons.css** - Button variations
- **forms.css** - Form control styles
- **shadows.css** - Elevation and shadows
- **animations.css** - Motion and transitions
- **accessibility.css** - A11y utilities

### External Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [CSS Tricks](https://css-tricks.com/)
- [MDN Web Docs](https://developer.mozilla.org/)

## 8. Troubleshooting

### Q: Colors look different
**A:** Make sure CSS files are imported in correct order. Check browser DevTools to verify variables are applied.

### Q: Focus outline not visible
**A:** Press Tab to focus. Check that `:focus-visible` is supported in your target browser. Should see blue outline.

### Q: Buttons don't look right
**A:** Use both `.button` and variant class (`.button--primary`). Check size class is included.

### Q: Spacing looks off
**A:** Use multiples of 8px. Use utility classes (`.p-4`, `.m-5`) or variables (`var(--space-4)`).

### Q: Text contrast failing
**A:** Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/). Most color combinations pass 4.5:1.

## 9. Next Steps

1. **Now:** Import CSS files into your HTML
2. **Then:** Try building a simple form using the Form example
3. **Next:** Build a card with button group using the Meeting Card example
4. **Finally:** Review full DESIGN_SYSTEM.md for deep understanding

## 10. Questions?

- Check `README.md` for quick reference
- Review `DESIGN_SYSTEM.md` for detailed specifications
- Look at `forms.css`, `buttons.css` for component details
- Test in browser DevTools to debug issues

---

**You're ready!** Start building with the design system. 🚀

**Remember:** Consistency comes from using design system variables. Every time you use a variable instead of hardcoding a value, you make the product more cohesive.
