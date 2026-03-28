# API Integration Guide

This document explains how to use the unified API client module (`core/api.js`) in the ChamberAI frontend.

## Module Overview

The `core/api.js` module provides:

- **`request(path, method, payload, options)`** - Main HTTP request function with retry logic
- **`setApiBase(url)`** - Set and persist the API base URL
- **`getApiBase()`** - Get the current API base URL
- **`getAuthHeaders()`** - Get auth headers for authenticated requests

## Imports

```javascript
import { request, setApiBase, getApiBase, getAuthHeaders } from './core/api.js';
import { showToast } from './core/toast.js';
import { getFirebaseUser, setCurrentUser } from './core/auth.js';
```

## Basic Usage

### Simple GET Request

```javascript
const meetings = await request('/meetings', 'GET');
if (meetings.error) {
  console.error('Failed to load meetings:', meetings.error);
} else {
  // Use meetings data
  console.log('Loaded', meetings.length, 'meetings');
}
```

### POST with Payload

```javascript
const created = await request('/meetings', 'POST', {
  title: 'Q4 Board Meeting',
  location: 'Conference Room A',
  scheduledTime: '2024-04-10T14:00:00Z'
});

if (created.error) {
  console.error('Failed to create meeting:', created.error);
} else {
  console.log('Created meeting:', created.id);
}
```

### Request with Retry Logic

```javascript
const data = await request('/meetings/123/action-items', 'GET', null, {
  retries: 2,
  retryDelayMs: 500
});
```

Retry behavior:
- Attempt 1: immediate
- Attempt 2: wait 500ms, then retry
- Attempt 3: wait 1000ms (500 * 2), then retry
- Attempt 4: wait 1500ms (500 * 3), then retry

### Suppress Error Alerts

```javascript
// For optional/non-critical requests
const optional = await request('/analytics/board', 'GET', null, {
  suppressAlert: true
});

if (!optional.error) {
  // Use analytics data
}
```

## Error Handling Pattern

All API calls follow this pattern:

```javascript
const result = await request(path, method, payload, options);

if (result && result.error) {
  // API returned an error (HTTP 4xx/5xx with error message)
  console.error('API Error:', result.error);
  showToast(`Error: ${result.error}`);
} else if (result === null) {
  // Network failure (no response received)
  console.error('Network error - check console');
} else {
  // Success - use result.data or result directly
  console.log('Success:', result);
}
```

## API Base Configuration

### Auto-Detection

On first load, the module auto-detects the API base:

```javascript
// Vercel deployment: https://chamberai-api.vercel.app
// Localhost: http://localhost:4000
```

### Manual Configuration

```javascript
// In app.js or settings module:
import { setApiBase } from './core/api.js';

// Set new base URL
setApiBase('https://custom-api.example.com');

// URL is persisted to localStorage key 'camApiBase'
// and will be used in future requests
```

### Getting Current Base

```javascript
import { getApiBase } from './core/api.js';

const currentBase = getApiBase();
console.log('Using API base:', currentBase);
```

## Authentication

### Firebase Integration

When a user authenticates via Firebase/Google:

1. Firebase auth state changes
2. `initFirebaseAuth()` in `app.js` receives the user object
3. Call `setCurrentUser(user)` from `core/auth.js`:

```javascript
import { setCurrentUser } from './core/auth.js';

authModule.onAuthStateChanged(firebaseAuth, (user) => {
  firebaseUser = user;
  setCurrentUser(user);  // Update auth module state
  // ... rest of auth handling
});
```

### Demo Mode (Localhost)

For development without Firebase:

1. Set `camRole` in localStorage: `localStorage.setItem('camRole', 'secretary')`
2. Set `camEmail` in localStorage: `localStorage.setItem('camEmail', 'user@example.com')`
3. `getAuthHeaders()` will return `Authorization: Bearer demo-token`

### Auth Headers

The module automatically includes:

- **Authorization Header**: Firebase ID token or demo token
- **x-demo-email Header**: Demo email address if stored

```javascript
const headers = await getAuthHeaders();
// {
//   'Authorization': 'Bearer <firebase-token>',
//   'x-demo-email': 'user@example.com'
// }
```

## Refactoring Existing Code

### Before (app.js pattern)

```javascript
async function authHeaders() {
  const headers = {};
  // ... auth logic
  return headers;
}

async function request(path, method, payload, options = {}) {
  // ... fetch logic
}

const result = await request('/meetings', 'GET');
```

### After (core/api.js pattern)

```javascript
import { request } from './core/api.js';

const result = await request('/meetings', 'GET');
```

## File Structure

```
apps/secretary-console/
├── core/
│   ├── api.js                 ← Unified API client (210 lines)
│   ├── auth.js                ← Auth state management (84 lines)
│   ├── toast.js               ← Toast notifications (239 lines)
│   ├── router.js              ← Hash-based router (282 lines)
│   └── API_INTEGRATION_GUIDE.md  ← This file
├── app.js                      ← Main app (calls api.js)
└── ...
```

## Response Formats

### Success Response

```javascript
// GET /meetings/123
{
  id: '123',
  title: 'Q4 Board Meeting',
  location: 'Conference Room A',
  // ... other fields
}

// POST /meetings
{
  id: '456',
  title: 'New Meeting',
  created: true
}
```

### Error Response (from API)

```javascript
// HTTP 400 with message
{
  error: 'Invalid meeting date: past dates not allowed'
}

// HTTP 401
{
  error: 'Unauthorized'
}

// HTTP 403
{
  error: 'Insufficient permissions for this operation'
}
```

### Network Failure

```javascript
// No response from server
null

// Content-type validation failure
{
  error: 'Unexpected response content-type: text/html'
}

// JSON parse failure
{
  error: 'Invalid JSON response from API'
}
```

## Best Practices

1. **Always check for `.error`**:
   ```javascript
   if (result.error) {
     // Handle error
   }
   ```

2. **Use suppressAlert for optional data**:
   ```javascript
   // Don't spam user with error for optional analytics
   const analytics = await request('/analytics', 'GET', null, { suppressAlert: true });
   ```

3. **Include meaningful payloads**:
   ```javascript
   // Good: clear structure
   await request('/meetings', 'POST', {
     title: 'Meeting Title',
     location: 'Location',
     scheduledTime: '2024-04-10T14:00:00Z'
   });
   ```

4. **Use retry for critical operations**:
   ```javascript
   // Important: retry on failure
   const saved = await request('/meetings/123', 'PUT', patch, {
     retries: 2,
     retryDelayMs: 350
   });
   ```

5. **Log errors for debugging**:
   ```javascript
   if (result.error) {
     console.error('[MyComponent] API error:', result.error);
   }
   ```

## Examples from Current Codebase

### Load Meetings List

```javascript
const data = await request('/meetings', 'GET', undefined, { retries: 2 });
if (data.error) {
  console.error('Failed to load meetings:', data.error);
  showToast('Failed to load meetings. Check API base.');
  return;
}
// meetings are in data array
```

### Create Meeting with Audio

```javascript
const meeting = await request('/meetings', 'POST', {
  title: 'New Meeting',
  location: 'Room A'
});
if (meeting.error) {
  showToast(`Meeting creation failed: ${meeting.error}`);
  return;
}

// Add audio source
await request(`/meetings/${meeting.id}/audio-sources`, 'POST', {
  name: 'Recording',
  url: audioUrl
});

// Process meeting
await request(`/meetings/${meeting.id}/process`, 'POST');
```

### Approve Meeting Minutes

```javascript
const result = await request(`/meetings/${meetingId}/approve`, 'POST');
if (result.error) {
  showToast(`Approval failed: ${result.error}`);
  return;
}
showToast('Minutes approved successfully');
```

## Testing

The module exports are:
- `request` - async function
- `setApiBase` - function
- `getApiBase` - function
- `getAuthHeaders` - async function

To verify integration:

```javascript
import { request, setApiBase, getApiBase, getAuthHeaders } from './core/api.js';

console.log('API Base:', getApiBase());
setApiBase('http://localhost:4000');
console.log('Updated API Base:', getApiBase());

const headers = await getAuthHeaders();
console.log('Auth headers:', Object.keys(headers));
```

## Dependencies

- **core/toast.js** - For error notifications via `showToast()`
- **core/auth.js** - For Firebase user state via `window.chamberaiFirebaseUser`
- **Browser APIs**:
  - `fetch()` - HTTP requests
  - `localStorage` - URL persistence
  - `window.location` - Environment detection

## No External Dependencies

The module has **zero external npm dependencies**. It uses:
- Standard JavaScript ES6 async/await
- Fetch API (modern browsers)
- localStorage (all browsers)
- No frameworks or libraries
