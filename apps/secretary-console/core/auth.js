/**
 * Authentication module for ChamberAI
 * Manages Firebase authentication state, role-based permissions, and auth headers.
 * All state is internal; access via exported getter functions only.
 */

// Internal module state
let currentRole = localStorage.getItem("camRole") || "";
let firebaseUser = null;
let firebaseAuth = null;
let signInWithPopupFn = null;
let signOutFn = null;
let googleProvider = null;

// Auth state change listeners
const authStateListeners = [];

/**
 * Get current user role
 * @returns {string} Current role: "secretary", "admin", "viewer", "guest", or ""
 */
export function getCurrentRole() {
  return currentRole;
}

/**
 * Get current user information
 * @returns {Object} User object with role, email, displayName properties
 */
export function getCurrentUser() {
  return {
    role: currentRole,
    email: localStorage.getItem("camEmail") || "",
    displayName: localStorage.getItem("camDisplayName") || ""
  };
}

/**
 * Set user role and persist to localStorage
 * Updates permissions and emits auth state change event
 * @param {string} role - Role to set ("secretary", "admin", "viewer", "guest")
 * @param {string} email - User email
 * @param {string} [displayName=""] - User display name
 */
export function setRole(role, email, displayName = "") {
  currentRole = role;
  localStorage.setItem("camRole", role);
  localStorage.setItem("camEmail", email);
  localStorage.setItem("camDisplayName", displayName);

  applyRolePermissions(role);
  emitAuthStateChange(getCurrentUser());

  // Close login modal if open
  const loginModal = document.getElementById("loginModal");
  if (loginModal && !loginModal.classList.contains("hidden")) {
    loginModal.classList.add("hidden");
  }
}

/**
 * Get authorization headers for API requests
 * Includes Firebase ID token if available, or demo token for non-guest demo mode
 * @async
 * @returns {Promise<Object>} Headers object with Authorization and optional x-demo-email
 */
export async function getAuthHeaders() {
  const headers = {};

  try {
    // Use Firebase ID token if user is logged in
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } else {
      // Demo mode fallback (localhost and not guest)
      const isDemoMode =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1" ||
        localStorage.getItem("camAuthMode") === "demo";
      const email = localStorage.getItem("camEmail");
      const role = currentRole;

      if (isDemoMode && role !== "guest" && email) {
        headers.Authorization = "Bearer demo-token";
      }
    }
  } catch (error) {
    console.error("Error getting auth headers:", error);
  }

  // Add demo email header if available
  const email = localStorage.getItem("camEmail");
  if (email) {
    headers["x-demo-email"] = email;
  }

  return headers;
}

/**
 * Initialize Firebase authentication
 * Dynamically imports Firebase SDK and sets up auth state listener
 * @async
 * @param {Object} config - Firebase config object
 * @param {string} config.apiKey - Firebase API key
 * @param {string} config.authDomain - Firebase auth domain
 * @param {string} config.projectId - Firebase project ID
 * @param {string} config.appId - Firebase app ID
 * @param {boolean} [config.useEmulator=false] - Use Firebase emulator
 * @returns {Promise<boolean>} True if initialization succeeded, false otherwise
 */
export async function initFirebaseAuth(config) {
  // Validate config
  if (!config || !config.apiKey || config.apiKey === "REPLACE_ME") {
    console.warn(
      "Firebase config invalid or not set. Auth will use demo mode."
    );
    return false;
  }

  try {
    // Dynamically import Firebase modules
    const firebaseAppModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
    );
    const firebaseAuthModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
    );

    // Initialize Firebase app
    const app = firebaseAppModule.initializeApp(config);

    // Get auth instance
    firebaseAuth = firebaseAuthModule.getAuth(app);

    // Create Google auth provider
    googleProvider = new firebaseAuthModule.GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: "select_account"
    });

    // Capture Firebase functions
    signInWithPopupFn = firebaseAuthModule.signInWithPopup;
    signOutFn = firebaseAuthModule.signOut;

    // Set up auth state listener
    firebaseAuthModule.onAuthStateChanged(firebaseAuth, (user) => {
      firebaseUser = user;

      if (user) {
        // User logged in via Firebase
        const email = user.email || "";
        const displayName = user.displayName || "";
        // Determine role from existing setting or use secretary as default
        const role = currentRole || "secretary";

        setRole(role, email, displayName);
      } else {
        // User logged out
        emitAuthStateChange(null);
      }
    });

    // Set up emulator if configured
    if (config.useEmulator) {
      try {
        firebaseAuthModule.connectAuthEmulator(firebaseAuth, "http://localhost:9099", {
          disableWarnings: true
        });
      } catch (error) {
        // Emulator might already be connected
        console.debug("Emulator connection info:", error.message);
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to initialize Firebase auth:", error);
    return false;
  }
}

/**
 * Sign in with Google
 * @async
 * @returns {Promise<Object>} User object with email and displayName
 * @throws {Error} If sign in fails or Firebase not initialized
 */
export async function signInWithGoogle() {
  if (!firebaseAuth || !signInWithPopupFn || !googleProvider) {
    throw new Error(
      "Firebase not initialized. Cannot sign in with Google."
    );
  }

  try {
    const result = await signInWithPopupFn(firebaseAuth, googleProvider);
    const user = result.user;
    const email = user.email || "";
    const displayName = user.displayName || "";

    // Determine role (use existing or secretary as default)
    const role = currentRole || "secretary";
    setRole(role, email, displayName);

    return { email, displayName, role };
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
}

/**
 * Sign in with SAML provider
 * @async
 * @param {string} providerId - SAML provider ID (e.g., "saml.my-org")
 * @returns {Promise<Object>} User object with email and displayName
 * @throws {Error} If sign in fails or Firebase not initialized
 */
export async function signInWithSAML(providerId) {
  if (!firebaseAuth || !signInWithPopupFn) {
    throw new Error(
      "Firebase not initialized. Cannot sign in with SAML."
    );
  }

  try {
    // Dynamically import SAML provider
    const firebaseAuthModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
    );

    const samlProvider = new firebaseAuthModule.SAMLAuthProvider(providerId);
    const result = await signInWithPopupFn(firebaseAuth, samlProvider);
    const user = result.user;
    const email = user.email || "";
    const displayName = user.displayName || "";

    // Determine role (use existing or secretary as default)
    const role = currentRole || "secretary";
    setRole(role, email, displayName);

    return { email, displayName, role, provider: "saml" };
  } catch (error) {
    console.error("SAML sign-in failed:", error);
    throw error;
  }
}

/**
 * Sign in with OIDC provider (Google Workspace, Azure AD, Okta, etc.)
 * @async
 * @param {string} providerId - OIDC provider ID (e.g., "oidc.google-workspace")
 * @returns {Promise<Object>} User object with email and displayName
 * @throws {Error} If sign in fails or Firebase not initialized
 */
export async function signInWithOIDC(providerId) {
  if (!firebaseAuth || !signInWithPopupFn) {
    throw new Error(
      "Firebase not initialized. Cannot sign in with OIDC."
    );
  }

  try {
    // Dynamically import OAuth provider
    const firebaseAuthModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
    );

    const oidcProvider = new firebaseAuthModule.OAuthProvider(providerId);
    const result = await signInWithPopupFn(firebaseAuth, oidcProvider);
    const user = result.user;
    const email = user.email || "";
    const displayName = user.displayName || "";

    // Determine role (use existing or secretary as default)
    const role = currentRole || "secretary";
    setRole(role, email, displayName);

    return { email, displayName, role, provider: "oidc" };
  } catch (error) {
    console.error("OIDC sign-in failed:", error);
    throw error;
  }
}

/**
 * Sign out current user
 * @async
 * @returns {Promise<void>}
 */
export async function signOut() {
  if (firebaseAuth && signOutFn) {
    try {
      await signOutFn(firebaseAuth);
    } catch (error) {
      console.error("Sign out error (non-fatal):", error);
    }
  }

  // Clear local auth state
  localStorage.removeItem("camRole");
  localStorage.removeItem("camEmail");
  localStorage.removeItem("camDisplayName");
  localStorage.removeItem("camUserTier");
  localStorage.removeItem("camTierPreview");
  localStorage.removeItem("camAuthMode");

  currentRole = "";
  firebaseUser = null;

  emitAuthStateChange(null);
}

/**
 * Apply role-based permissions to the DOM
 * Disables write controls for viewers, applies readonly class
 * @param {string} role - Role to apply permissions for
 */
export function applyRolePermissions(role) {
  const isViewer = role === "viewer" || role === "guest" || !role;

  // Buttons that are disabled for viewers
  const writeButtons = [
    "createBtn",
    "quickCreateBtn",
    "seedDemoBtn",
    "saveMetaBtn",
    "registerAudioBtn",
    "processBtn",
    "approveBtn",
    "saveMinutesBtn",
    "addActionBtn",
    "addMotionBtn",
    "importActionCsv",
    "csvApply",
    "saveAdjournmentFlag",
    "saveSettingsBtn",
    "quickSubmit",
    "inviteSendBtn",
    "inviteRefreshBtn",
    "motionSaveBtn",
    "motionTestBtn",
    "geoScanBtn",
    "geoGenerateBtn"
  ];

  writeButtons.forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = isViewer;
    }
  });

  // Admin-only button
  const inviteAuthorizeSender = document.getElementById("inviteAuthorizeSender");
  if (inviteAuthorizeSender) {
    inviteAuthorizeSender.disabled = role !== "admin";
  }

  // Form fields that are disabled for viewers
  const writeFields = [
    "newDate",
    "newStart",
    "newLocation",
    "newChair",
    "newSecretary",
    "newTags",
    "metaEndTime",
    "metaTags",
    "flagNoMotions",
    "flagNoActionItems",
    "flagNoAdjournment",
    "flagNoAdjournmentInline",
    "actionDescription",
    "actionOwner",
    "actionDue",
    "motionText",
    "motionMover",
    "motionSeconder",
    "motionVote",
    "motionOutcome",
    "settingRetention",
    "settingMaxSize",
    "settingMaxDuration",
    "inviteAuthorizedEmail",
    "inviteRecipientEmail",
    "inviteMeetingTitle",
    "inviteMotionLink",
    "inviteJoinLink",
    "inviteNote",
    "motionEnabled",
    "motionApiKey",
    "motionWorkspaceId",
    "motionProjectId",
    "motionLinkTemplate",
    "geoScopeType",
    "geoScopeId",
    "geoExistingDetails"
  ];

  writeFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = isViewer;
    }
  });

  // Apply readonly class to body
  document.body.classList.toggle("readonly", isViewer);
}

/**
 * Get Firebase user object
 * @returns {Object|null} Firebase user object or null if not logged in
 */
export function getFirebaseUser() {
  return firebaseUser;
}

/**
 * Register a handler for auth state changes
 * @param {Function} handler - Callback function(user) called when auth state changes
 * @returns {Function} Unsubscribe function to remove listener
 */
export function onAuthStateChange(handler) {
  if (typeof handler !== "function") {
    console.error("Auth state handler must be a function");
    return () => {};
  }

  authStateListeners.push(handler);

  // Return unsubscribe function
  return () => {
    const index = authStateListeners.indexOf(handler);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
}

/**
 * Emit auth state change event to all registered listeners
 * @private
 * @param {Object|null} user - Current user object or null
 */
function emitAuthStateChange(user) {
  authStateListeners.forEach((handler) => {
    try {
      handler(user);
    } catch (error) {
      console.error("Error in auth state handler:", error);
    }
  });
}
