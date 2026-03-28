/**
 * Hash-based router with pattern matching for single-page applications.
 * Manages route registration, navigation, and parameter extraction.
 */

// Route registry: stores registered routes with patterns and handlers
const routes = new Map();

// Current route state
let currentRoute = {
  path: '/',
  params: {},
  query: {},
};

// Route change listeners
const routeChangeListeners = [];

/**
 * Parses a query string into an object.
 * @param {string} queryString - The query string (without leading ?)
 * @returns {Object} Parsed query parameters
 * @private
 */
function parseQuery(queryString) {
  if (!queryString) return {};

  return Object.fromEntries(
    queryString
      .split('&')
      .map(pair => pair.split('='))
      .map(([key, value]) => [
        decodeURIComponent(key),
        decodeURIComponent(value || ''),
      ])
  );
}

/**
 * Converts a pattern like '/meetings/:id' into a regex and extracts param names.
 * @param {string} pattern - The route pattern
 * @returns {{ regex: RegExp, paramNames: string[] }} Compiled pattern info
 * @private
 */
function compilePattern(pattern) {
  const paramNames = [];

  // Find all :paramName occurrences
  const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;

  while ((match = paramRegex.exec(pattern)) !== null) {
    paramNames.push(match[1]);
  }

  // Escape special regex chars and replace :paramName with capture groups
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '([^/?#]+)');

  const regex = new RegExp(`^${regexPattern}$`);

  return { regex, paramNames };
}

/**
 * Matches a route path against a pattern and extracts parameters.
 * @param {string} pattern - The route pattern (e.g., '/meetings/:id')
 * @param {string} path - The actual path to match (e.g., '/meetings/123')
 * @returns {{ match: boolean, params: Object }} Match result and extracted params
 */
export function matchPattern(pattern, path) {
  const { regex, paramNames } = compilePattern(pattern);
  const match = path.match(regex);

  if (!match) {
    return { match: false, params: {} };
  }

  const params = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });

  return { match: true, params };
}

/**
 * Registers a route handler for a given pattern.
 * @param {string} pattern - Route pattern with optional :paramName placeholders (e.g., '/meetings/:id')
 * @param {Function} handler - Handler function called with (params, context)
 * @param {Object} options - Optional configuration
 * @param {boolean} options.name - Optional name for debugging
 * @returns {void}
 */
export function registerRoute(pattern, handler, options = {}) {
  if (typeof pattern !== 'string') {
    console.error('[Router] Pattern must be a string');
    return;
  }

  if (typeof handler !== 'function') {
    console.error('[Router] Handler must be a function');
    return;
  }

  routes.set(pattern, { handler, options });
}

/**
 * Unregisters a route handler (useful for cleanup).
 * @param {string} pattern - Route pattern to remove
 * @returns {boolean} True if route was removed, false if not found
 * @private
 */
function unregisterRoute(pattern) {
  return routes.delete(pattern);
}

/**
 * Gets the current route state.
 * @returns {Object} Current route object with { path, params, query }
 */
export function getCurrentRoute() {
  return { ...currentRoute };
}

/**
 * Registers a listener for route changes.
 * @param {Function} handler - Handler called with (newRoute, oldRoute) when route changes
 * @returns {Function} Unsubscribe function to remove the listener
 */
export function onRouteChange(handler) {
  if (typeof handler !== 'function') {
    console.error('[Router] Route change handler must be a function');
    return () => {};
  }

  routeChangeListeners.push(handler);

  // Return unsubscribe function
  return () => {
    const index = routeChangeListeners.indexOf(handler);
    if (index > -1) {
      routeChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Notifies all route change listeners.
 * @param {Object} newRoute - The new route state
 * @private
 */
function notifyRouteChange(newRoute) {
  const oldRoute = currentRoute;
  routeChangeListeners.forEach(listener => {
    try {
      listener(newRoute, oldRoute);
    } catch (error) {
      console.error('[Router] Error in route change listener:', error);
    }
  });
}

/**
 * Processes the current hash and updates router state.
 * @private
 */
function processHash() {
  const hash = window.location.hash.slice(1) || '/';

  // Split path and query string
  const [pathPart, queryPart] = hash.split('?');
  const path = pathPart || '/';
  const query = parseQuery(queryPart);

  // Try to find a matching registered route
  let matchedRoute = null;
  let matchedPattern = null;
  let params = {};

  for (const [pattern] of routes) {
    const result = matchPattern(pattern, path);
    if (result.match) {
      matchedPattern = pattern;
      matchedRoute = routes.get(pattern);
      params = result.params;
      break;
    }
  }

  // Update current route state
  const newRoute = { path, params, query };
  currentRoute = newRoute;

  // Call the matched handler if found
  if (matchedRoute) {
    try {
      const context = {
        router: {
          navigate,
          getCurrentRoute,
          onRouteChange,
        },
        pattern: matchedPattern,
      };
      matchedRoute.handler(params, context);
    } catch (error) {
      console.error(`[Router] Error in handler for pattern "${matchedPattern}":`, error);
    }
  } else {
    // No route found - log a warning but don't fail
    if (path !== '/') {
      console.warn(`[Router] No route handler found for path: ${path}`);
    }
  }

  // Notify listeners
  notifyRouteChange(newRoute);
}

/**
 * Navigates to a new path.
 * @param {string} path - The path to navigate to (e.g., '/meetings/123')
 * @param {Object} options - Navigation options
 * @param {boolean} options.replace - If true, replace history instead of pushing
 * @param {Object} options.query - Query parameters to append
 * @returns {void}
 */
export function navigate(path, options = {}) {
  if (typeof path !== 'string') {
    console.error('[Router] Path must be a string');
    return;
  }

  // Build the new hash
  let hash = path;

  // Append query string if provided
  if (options.query && typeof options.query === 'object') {
    const queryString = Object.entries(options.query)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    if (queryString) {
      hash += `?${queryString}`;
    }
  }

  // Navigate using history API or direct hash assignment
  if (options.replace) {
    window.location.replace(`#${hash}`);
  } else {
    window.location.hash = hash;
  }
}

/**
 * Initializes the router by setting up hash change listener.
 * Should be called once when the application starts.
 * @returns {Function} Cleanup function to remove listeners
 */
export function initRouter() {
  // Process the initial hash
  processHash();

  // Listen for hash changes
  const handleHashChange = () => {
    processHash();
  };

  window.addEventListener('hashchange', handleHashChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
    routes.clear();
    routeChangeListeners.length = 0;
    currentRoute = { path: '/', params: {}, query: {} };
  };
}
