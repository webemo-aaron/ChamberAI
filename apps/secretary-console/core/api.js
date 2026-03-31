/**
 * Unified API client module for ChamberAI frontend.
 * Centralizes all HTTP requests with retry logic, auth headers, and error handling.
 *
 * Integrates with core/auth.js for Firebase user management.
 * If auth.js is imported and initialized, automatically uses Firebase tokens.
 * Falls back to demo mode for localhost development.
 */

import { showToast } from './toast.js';
import { getFirebaseUser as getAuthFirebaseUser } from './auth.js';

export function detectDefaultApiBase() {
  if (window.location.hostname === 'chamberai.mahoosuc.ai') {
    return 'https://api.chamberai.mahoosuc.ai';
  }

  if (window.location.hostname.endsWith('.vercel.app')) {
    return 'https://chamberai-api-ecfgvedexq-uc.a.run.app';
  }

  const isLocalDevHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalDevHost) {
    const currentPort = window.location.port;
    if (currentPort === '5175' || currentPort === '5176' || currentPort === '5173') {
      return 'http://127.0.0.1:4010';
    }
    return 'http://localhost:4000';
  }

  return 'http://localhost:4000';
}

// API base URL management
let apiBase = (() => {
  const stored = localStorage.getItem('camApiBase');
  if (stored) return stored;
  return detectDefaultApiBase();
})();

/**
 * Set the API base URL and persist to localStorage.
 * @param {string} url - The API base URL (e.g., 'http://localhost:4000')
 */
export function setApiBase(url) {
  if (!url) {
    console.warn('[API] Empty URL provided to setApiBase');
    return;
  }
  apiBase = url;
  localStorage.setItem('camApiBase', url);
}

/**
 * Get the current API base URL.
 * Falls back to localhost if not set.
 * @returns {string} The API base URL
 */
export function getApiBase() {
  return apiBase || detectDefaultApiBase();
}

/**
 * Utility to pause execution.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 * @private
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get Firebase user from auth state.
 * Uses the auth.js module which manages Firebase authentication.
 * @returns {Object|null} Firebase user object or null
 * @private
 */
function getFirebaseUser() {
  // Use the getFirebaseUser from auth.js module
  return getAuthFirebaseUser();
}

/**
 * Get authentication headers for API requests.
 * Includes Firebase ID token if authenticated, demo token for localhost dev.
 * @returns {Promise<Object>} Headers object with Authorization and other auth fields
 */
export async function getAuthHeaders() {
  const headers = {};

  // Always include demo email if stored
  const email = localStorage.getItem('camEmail');
  if (email) {
    headers['x-demo-email'] = email;
  }

  // Try to get Firebase user token
  const firebaseUser = getFirebaseUser();
  if (firebaseUser) {
    try {
      const token = await firebaseUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
      return headers;
    } catch (error) {
      console.error('[API] Failed to get Firebase token:', error);
    }
  }

  // Fallback: demo token for localhost development
  const role = localStorage.getItem('camRole');
  const isLocalDevHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalDevHost && role && role !== 'guest') {
    headers.Authorization = 'Bearer demo-token';
  } else if (!firebaseUser && role && role !== 'guest') {
    console.warn(
      '[API] Google auth session missing; not sending demo token in hosted mode'
    );
  }

  return headers;
}

/**
 * Make an HTTP request with retry logic, auth headers, and error handling.
 *
 * @param {string} path - API path (e.g., '/meetings' or '/meetings/123')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object} [payload=null] - Request body payload (will be JSON stringified)
 * @param {Object} [options={}] - Request options
 * @param {number} [options.retries=0] - Number of retry attempts on failure
 * @param {number} [options.retryDelayMs=350] - Base delay in ms (multiplied by attempt number)
 * @param {boolean} [options.suppressAlert=false] - If true, don't show error toast
 *
 * @returns {Promise<Object|null>} Parsed response JSON on success, { error: string } on API error,
 *                                   or null on network failure (if not suppressed)
 *
 * @example
 * // Simple GET request
 * const meetings = await request('/meetings', 'GET');
 * if (meetings.error) console.error(meetings.error);
 *
 * @example
 * // POST with retry
 * const created = await request('/meetings', 'POST', { title: 'Q4 Board' }, {
 *   retries: 2,
 *   retryDelayMs: 500
 * });
 *
 * @example
 * // Suppress error alerts for optional data
 * const optional = await request('/analytics', 'GET', null, { suppressAlert: true });
 */
export async function request(path, method, payload, options = {}) {
  const retries = Number(options.retries ?? 0);
  const retryDelayMs = Number(options.retryDelayMs ?? 350);
  const suppressAlert = Boolean(options.suppressAlert);
  const base = getApiBase();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      // Handle empty response body
      const text = await response.text();
      if (!text) {
        return null;
      }

      // Validate content-type
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const error = {
          error: `Unexpected response content-type: ${contentType || 'unknown'}`,
        };
        if (!suppressAlert) {
          console.warn('[API] Invalid content-type:', error);
          showToast(`API error: ${error.error}`);
        }
        return error;
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        const error = { error: 'Invalid JSON response from API' };
        if (!suppressAlert) {
          console.error('[API] JSON parse failed:', parseError);
          showToast('API returned invalid JSON');
        }
        return error;
      }

      // Return error if response not ok
      if (!response.ok) {
        // Prefer server error message if available
        return data?.error ? data : { error: `HTTP ${response.status}` };
      }

      return data;
    } catch (error) {
      // Retry logic: if more attempts available, sleep and retry
      if (attempt < retries) {
        const delay = retryDelayMs * (attempt + 1);
        await sleep(delay);
        continue;
      }

      // All retries exhausted - handle error
      if (!suppressAlert) {
        console.error('[API] Request failed:', error);
        showToast('API request failed. Check API base and console.');
      }

      return null;
    }
  }
}
