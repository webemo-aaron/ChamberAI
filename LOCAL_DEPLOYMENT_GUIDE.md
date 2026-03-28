# Local Deployment & Testing Guide
**Date:** 2026-03-28 | **Version:** 1.0

---

## 🎯 Quick Start (5 minutes)

Choose your preferred method:

### Option A: Direct Node.js (Fastest)
```bash
cd /mnt/devdata/repos/ChamberAI/apps/secretary-console
node ../../scripts/serve_console.js
```
Then open: **http://localhost:5173**

### Option B: Docker Compose (Full Stack)
```bash
cd /mnt/devdata/repos/ChamberAI
docker-compose -f docker-compose.hybrid.yml up
```
Then open: **http://localhost:80** or **http://localhost:5173**

---

## 📋 Prerequisites

### For Direct Node.js Method
- Node.js 18+ (already installed)
- Git (already installed)
- Modern browser (Chrome, Firefox, Safari)

### For Docker Method
- Docker (installed)
- Docker Compose (installed)
- 2GB+ free disk space

---

## 🚀 Method 1: Direct Node.js (Recommended for Testing)

### Step 1: Navigate to Console Directory
```bash
cd /mnt/devdata/repos/ChamberAI/apps/secretary-console
```

### Step 2: Start Development Server
```bash
node ../../scripts/serve_console.js
```

You should see:
```
Server listening on http://0.0.0.0:5173
```

### Step 3: Open Browser
```
http://localhost:5173
```

### Step 4: Demo Login
The app will start with:
- **Email:** demo@example.com
- **Role:** secretary (can see all features)

To test different roles:
- Open DevTools Console (F12)
- Run: `localStorage.setItem('camRole', 'admin')` or `'viewer'`
- Refresh page (F5)

---

## 🐳 Method 2: Docker Compose (Full Stack)

### Step 1: Navigate to Project Root
```bash
cd /mnt/devdata/repos/ChamberAI
```

### Step 2: Start Services
```bash
docker-compose -f docker-compose.hybrid.yml up
```

### Step 3: Wait for Services
Watch for output:
```
console   | Server listening on http://0.0.0.0:5173
api       | API listening on http://0.0.0.0:4001
firebase-emulators | All emulators ready
```

### Step 4: Open Browser
```
http://localhost:5173
```

### Step 5: Stop Services
```
Press Ctrl+C
# Then clean up:
docker-compose -f docker-compose.hybrid.yml down
```

---

## 🧪 Testing Responsive Design

### Option 1: Browser DevTools (Easiest)
1. Open http://localhost:5173
2. Press F12 to open DevTools
3. Click device toggle (Ctrl+Shift+M)
4. Select viewport sizes:

**Desktop:** 1400×900px
- Sidebar visible (left side)
- All 6 nav links visible
- Content flows right of sidebar

**Tablet:** 800×600px
- Sidebar still visible but narrower
- Content panes stack vertically

**Mobile Landscape:** 667×375px
- Sidebar hidden
- Bottom tab bar appears (56px, icon-only)
- 6 navigation icons

**Mobile Portrait:** 375×667px
- Sidebar hidden
- Bottom tab bar visible
- Full-width content

### Option 2: Chrome Device Emulation
1. DevTools → Device toolbar
2. Preset devices: iPhone 12, iPad, Galaxy S21
3. Test touch interactions

### Option 3: Physical Device
1. Find your machine's local IP: `ifconfig | grep inet`
2. On phone: `http://<your-ip>:5173`
3. Test with real touch/gestures

---

## 🎯 What to Test

### Phase 4: Sidebar + Visual Refresh

#### Desktop (1400px)
- [ ] Sidebar visible on left (dark, 220px wide)
- [ ] 6 nav links: Meetings, Business Hub, Settings, Billing, Admin, AI Kiosk
- [ ] Click each link → navigates to route (#/meetings, #/settings, etc.)
- [ ] Active link highlighted (left border + background)
- [ ] Logout button in sidebar footer (red)
- [ ] Click logout → goes to #/login
- [ ] Topbar has brand mark + API config icon

#### Tablet (800px)
- [ ] Sidebar still visible
- [ ] Content panes stack vertically
- [ ] Same navigation functionality

#### Mobile Landscape (667px)
- [ ] Sidebar hidden
- [ ] Bottom navigation bar appears (56px)
- [ ] 6 icons (no labels): 📋 🏢 ⚙️ 💳 🔐 🤖
- [ ] Tap icon → navigate
- [ ] Touch targets ≥44×44px

#### Mobile Portrait (375px)
- [ ] Sidebar hidden
- [ ] Bottom tab bar visible
- [ ] All navigation accessible
- [ ] Content full-width

### Phase 9c: Kiosk Chat Widget

#### Desktop (1400px)
- [ ] Chat bubble appears in bottom-right corner
- [ ] Size: 60×60px circle
- [ ] Chat icon (💬) visible
- [ ] Click bubble → expands to window (380×500px)
- [ ] Window contains:
  - [ ] Chat message list
  - [ ] Text input field
  - [ ] Send button
  - [ ] Minimize button (collapses to bubble)
  - [ ] Close button (removes widget)

#### Feature Flag Testing
1. Open DevTools Console (F12)
2. Run: `localStorage.setItem('kiosk_widget_embed', 'false')`
3. Refresh page (F5)
4. Bubble should disappear
5. Run: `localStorage.setItem('kiosk_widget_embed', 'true')`
6. Refresh page
7. Bubble should reappear

#### Tier Testing
1. Default: Pro tier with kiosk_addon (widget visible)
2. To hide: Run: `localStorage.removeItem('camTier')` (widget disappears)
3. Restore: Refresh page

#### Chat Testing
1. Click bubble → window opens
2. Type message: "Hello, what's the next meeting?"
3. Click Send
4. Message appears in list
5. (Backend mock may not respond - that's OK for now)
6. Click Minimize → window collapses
7. Click Bubble again → window reopens with history preserved
8. Click Close → widget removed

### Phase 5: Meetings View Modularization

#### Desktop (1400px)
- [ ] Navigate to #/meetings
- [ ] Left pane: meetings list
- [ ] Right pane: empty (select a meeting)
- [ ] Click row → detail appears on right
- [ ] Tab switcher shows: Minutes, Actions, Motions, Audit, Summary
- [ ] Click each tab → content changes

#### Tabs to Test
- [ ] Minutes: text editor + audio upload section
- [ ] Action Items: list with CRUD + CSV import/export
- [ ] Motions: motion list with voting
- [ ] Audit: read-only log
- [ ] Summary: text editor + export

### Phase 6: Business Hub Modularization

#### Desktop (1400px)
- [ ] Navigate to #/business-hub
- [ ] Left pane: business directory list
- [ ] Right pane: empty
- [ ] Click row → detail appears
- [ ] 5 tabs: Profile, Geographic, Reviews, Quotes, AI Search

---

## 🔑 Default Credentials

### Demo Mode (No Backend Needed)
- **Email:** demo@example.com
- **Role:** secretary (default), can change to admin/viewer
- **Tier:** Pro with kiosk_addon (all features enabled)

To change role in DevTools Console:
```javascript
localStorage.setItem('camRole', 'admin');   // admin, secretary, viewer
localStorage.setItem('camTier', 'Council');  // Free, Pro, Council
location.reload();
```

---

## 🌐 API Configuration

### Default API Base
```
http://localhost:4001
```

To change:
1. Click ⚙️ icon in topbar
2. Enter new API base URL
3. Click Save

For local testing without backend:
- Leave as `http://localhost:4001` (won't connect, but won't error)
- All data is demo/mock in frontend

---

## 🛠️ Keyboard Shortcuts

- **F12** - Open DevTools
- **Ctrl+Shift+M** - Toggle device mode
- **Escape** - Close modals/popovers
- **Tab** - Cycle through interactive elements
- **Enter** - Activate buttons/links

---

## 🐛 Troubleshooting

### "Cannot find module" Error
```
Error: Cannot find module '../../scripts/serve_console.js'
```
**Solution:** Make sure you're in the correct directory
```bash
pwd  # Should show: /mnt/devdata/repos/ChamberAI/apps/secretary-console
```

### "Port 5173 already in use"
```
Error: listen EADDRINUSE :::5173
```
**Solution:** Kill existing process or use different port
```bash
# Find process using port 5173
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use different port
CONSOLE_PORT=3000 node ../../scripts/serve_console.js
```

### Navigation not working (stays on #/login)
**Causes:**
- Firebase auth may be blocking (check DevTools Console)
- localStorage role/email missing

**Solution:**
1. Open DevTools Console (F12)
2. Run:
```javascript
localStorage.setItem('camEmail', 'demo@example.com');
localStorage.setItem('camRole', 'secretary');
localStorage.setItem('camTier', 'Council');
```
3. Refresh page (F5)

### Sidebar not visible on desktop
**Causes:**
- CSS not loading
- Window too narrow

**Solution:**
1. Check DevTools (F12) for CSS errors
2. Resize window to ≥1024px
3. Hard refresh (Ctrl+Shift+R)

### Widget not appearing
**Causes:**
- Feature flag disabled
- Tier not set
- localStorage cleared

**Solution:**
1. Check DevTools Console:
```javascript
localStorage.getItem('kiosk_widget_embed')  // should be 'true'
localStorage.getItem('camTier')             // should be 'Pro' or 'Council'
```
2. Set if missing:
```javascript
localStorage.setItem('kiosk_widget_embed', 'true');
localStorage.setItem('camTier', 'Council');
```
3. Refresh page (F5)

---

## 📊 Testing Checklist

### Phase 4 Sidebar
- [ ] Desktop: Sidebar visible, 220px
- [ ] Tablet: Sidebar visible, content stacks
- [ ] Mobile Landscape: Bottom nav appears
- [ ] Mobile Portrait: Bottom nav icon-only
- [ ] All nav links clickable
- [ ] Active state highlighting works
- [ ] Logout functional

### Phase 9c Widget
- [ ] Bubble visible (desktop)
- [ ] Feature flag controls visibility
- [ ] Tier gating works
- [ ] Click bubble → window opens
- [ ] Chat input functional
- [ ] Minimize → collapse, reopen preserves history
- [ ] Close → clear history
- [ ] Responsive at 4 breakpoints

### Phase 5 Meetings
- [ ] List visible on left pane
- [ ] Detail shows on right pane
- [ ] Tab switching works
- [ ] All 5 tabs load correctly
- [ ] Responsive on mobile

### Phase 6 Business Hub
- [ ] List visible on left pane
- [ ] Detail shows on right pane
- [ ] Tab switching works
- [ ] 5 tabs functional
- [ ] Responsive on mobile

### Accessibility
- [ ] Tab key cycles through links
- [ ] Focus indicators visible
- [ ] Escape closes modals
- [ ] Keyboard-only navigation works

---

## 💡 Tips for Testing

1. **Use Multiple Browsers**
   - Chrome, Firefox, Safari all behave slightly differently
   - Test both desktop and mobile viewports

2. **Clear Cache Often**
   - DevTools → Application → Storage → Clear All
   - Or: Hard refresh with Ctrl+Shift+R

3. **Check Console for Errors**
   - DevTools → Console tab
   - Watch for red error messages
   - Yellow warnings are usually OK

4. **Test Touch Interactions**
   - DevTools → Device Mode
   - Try tapping buttons, scrolling, dragging
   - Ensure touch targets are ≥44×44px

5. **Test Different Roles**
   - Viewer: Limited access
   - Secretary: Most features
   - Admin: All features including admin panel

6. **Document Issues**
   - Screenshot the problem
   - Note which breakpoint/browser
   - Include console errors
   - Create GitHub issue if blocking

---

## 📈 Performance Testing

Open DevTools → Performance tab:
1. Click Record (red circle)
2. Interact with app (navigate, click buttons)
3. Stop recording
4. Analyze timeline

**Target Metrics:**
- First paint: <1 second
- Page interactive: <2 seconds
- Tab switching: <500ms

---

## 🚀 When Testing is Complete

1. Document any issues found
2. Create GitHub issues for bugs
3. Mark Task #16 (validation testing) as complete
4. Ready to proceed with Phase 7+8

---

## 📞 Getting Help

If you get stuck:
1. Check DevTools Console (F12) for errors
2. Try hard refresh (Ctrl+Shift+R)
3. Clear localStorage if weird behavior: `localStorage.clear()`
4. Restart server (Ctrl+C, then run command again)

---

**Happy Testing!** 🎉

Please test all 4 breakpoints and report any issues. You should see:
- ✅ Responsive sidebar (desktop) or bottom nav (mobile)
- ✅ Kiosk chat widget in corner (with proper feature flagging)
- ✅ Navigation between routes working
- ✅ All tabs loading correctly
- ✅ Smooth animations and transitions

Let me know what you find! 🚀
