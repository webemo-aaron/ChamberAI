/**
 * Full-Page Login View Handler for ChamberAI
 *
 * Provides a full-page login experience with:
 * - Google Sign-In integration
 * - Demo access with email + role selection
 * - Responsive design
 * - Accessible form controls
 * - Toast notifications for feedback
 *
 * Route: /login
 */

import { signInWithGoogle, signInWithSAML, signInWithOIDC, setRole } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";
import { request } from "../../core/api.js";

let loginThemeMediaQuery = null;
let loginThemeChangeHandler = null;

function getDemoTierForRole(role) {
  if (role === "admin") return "Network";
  if (role === "secretary") return "Council";
  return "Free";
}

function normalizeDemoTier(value = "") {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "pro") return "Pro";
  if (normalized === "council") return "Council";
  if (normalized === "network") return "Network";
  return "Free";
}

/**
 * Check if SSO is enabled for the current org
 * @async
 * @returns {Promise<Object|null>} SSO status object {enabled, provider, orgId} or null
 */
async function getSsoStatus() {
  try {
    // Get org slug from subdomain
    const host = window.location.hostname;
    const slug = host.split(".")[0];

    if (!slug || slug === "localhost" || slug === "127.0.0.1") {
      return null;
    }

    // Check SSO status from API
    const response = await request("/api/sso/status", "GET");

    if (response?.enabled) {
      return response;
    }
  } catch (error) {
    // SSO check failed - fall back to non-SSO
    console.debug("SSO status check failed:", error.message);
  }

  return null;
}

/**
 * Render SSO button for the given provider
 * @param {Object} ssoStatus - SSO status object {provider}
 * @returns {HTMLElement} Button element for SSO sign-in
 */
function renderSsoButton(ssoStatus) {
  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.type = "button";
  btn.setAttribute("aria-label", `Sign in with ${ssoStatus.provider}`);

  // Determine button text and provider-specific logic
  const providerMap = {
    google_workspace: "Continue with Google Workspace",
    azure_ad: "Continue with Azure AD",
    okta: "Continue with Okta",
    saml_custom: "Continue with Organization SSO",
    oidc_custom: "Continue with Organization SSO"
  };

  btn.textContent = providerMap[ssoStatus.provider] || "Continue with SSO";
  btn.id = `loginSSO_${ssoStatus.provider}`;

  return btn;
}

/**
 * Render the full-page login card
 * Creates the HTML structure for the login page
 * @param {Object|null} ssoStatus - Optional SSO status object
 * @returns {HTMLElement} The login page container
 */
function renderLoginPage(ssoStatus = null) {
  // Create main login page container
  const loginPage = document.createElement("div");
  loginPage.className = "login-page";
  loginPage.setAttribute("role", "main");

  const loginStage = document.createElement("div");
  loginStage.className = "login-stage";

  const contextPanel = document.createElement("section");
  contextPanel.className = "login-context-panel";
  contextPanel.innerHTML = `
    <div class="login-context-shell">
      <span class="login-context-eyebrow">ChamberAI Workspace</span>
      <h1 class="login-context-title">Help local businesses get seen, connected, and supported.</h1>
      <p class="login-context-copy">
        Run business visibility, relationship workflows, customer communication, and governance
        from one AI-powered chamber platform.
      </p>
      <div class="login-capabilities">
        <span>Business visibility</span>
        <span>Relationship activation</span>
        <span>Member communication</span>
        <span>Trusted governance</span>
      </div>
      <div class="login-outcomes">
        <article class="login-outcome-card">
          <strong>Advertise member businesses</strong>
          <p>Keep profiles, quotes, and reviews current so local businesses are easier to discover and trust.</p>
        </article>
        <article class="login-outcome-card">
          <strong>Build stronger relationships</strong>
          <p>Coordinate follow-up, referrals, and outreach with clear ownership across chamber teams.</p>
        </article>
        <article class="login-outcome-card">
          <strong>Communicate with confidence</strong>
          <p>Use AI-assisted summaries and responses while keeping approvals, records, and audit controls intact.</p>
        </article>
      </div>
    </div>
  `;

  // Create login card with centered content
  const loginCard = document.createElement("div");
  loginCard.className = "login-card login-auth-panel";
  loginCard.setAttribute("role", "region");
  loginCard.setAttribute("aria-labelledby", "loginPageTitle");

  // Header with brand mark and title
  const header = document.createElement("div");
  header.className = "login-header";

  const eyebrow = document.createElement("span");
  eyebrow.className = "login-eyebrow";
  eyebrow.textContent = "Workspace Access";

  const brandMark = document.createElement("div");
  brandMark.className = "brand-mark-large";
  brandMark.textContent = "CAM";
  brandMark.setAttribute("aria-label", "ChamberAI Mark");

  const title = document.createElement("h1");
  title.id = "loginPageTitle";
  title.className = "login-title";
  title.textContent = "Enter ChamberAI";

  const subtitle = document.createElement("p");
  subtitle.className = "login-subtitle";
  subtitle.textContent =
    "Sign in to run business visibility, relationship outreach, customer communication, and chamber governance in one place.";

  const authNote = document.createElement("p");
  authNote.className = "login-auth-note";
  authNote.textContent =
    "Choose your organization sign-in path. Local demo access remains available for QA and workflow review.";

  header.appendChild(eyebrow);
  header.appendChild(brandMark);
  header.appendChild(title);
  header.appendChild(subtitle);
  header.appendChild(authNote);

  // SSO button (if enabled)
  let ssoBtn = null;
  if (ssoStatus && ssoStatus.enabled) {
    ssoBtn = renderSsoButton(ssoStatus);
  }

  // Google Sign-In button
  const googleBtn = document.createElement("button");
  googleBtn.id = "loginGoogle";
  googleBtn.className = "btn btn-primary";
  googleBtn.type = "button";
  googleBtn.textContent = ssoBtn ? "Continue with Google" : "Continue with Google";
  googleBtn.setAttribute("aria-label", "Sign in with Google account");

  // Divider
  const divider = document.createElement("div");
  divider.className = "login-divider";

  const dividerText = document.createElement("span");
  dividerText.className = "divider-text";
  dividerText.textContent = "Or";

  divider.appendChild(dividerText);

  // Demo access section
  const demoAccess = document.createElement("div");
  demoAccess.className = "demo-access";

  const demoSummary = document.createElement("summary");
  demoSummary.className = "demo-summary";
  demoSummary.setAttribute("role", "button");
  demoSummary.setAttribute("tabindex", "0");
  demoSummary.textContent = "Demo Access";

  const demoDetails = document.createElement("details");
  demoDetails.appendChild(demoSummary);

  const demoForm = document.createElement("div");
  demoForm.className = "demo-form";

  const demoNote = document.createElement("p");
  demoNote.className = "demo-note";
  demoNote.textContent = "Demo access is intended for local validation, responsive QA, and workflow review.";

  // Email input
  const emailLabel = document.createElement("label");
  emailLabel.htmlFor = "loginEmail";
  emailLabel.textContent = "Email";

  const emailInput = document.createElement("input");
  emailInput.id = "loginEmail";
  emailInput.type = "email";
  emailInput.placeholder = "admin@acme.com";
  emailInput.className = "form-input";
  emailInput.setAttribute("aria-label", "Email address");

  const emailWrapper = document.createElement("div");
  emailWrapper.className = "form-group";
  emailWrapper.appendChild(emailLabel);
  emailWrapper.appendChild(emailInput);

  // Role select
  const roleLabel = document.createElement("label");
  roleLabel.htmlFor = "loginRole";
  roleLabel.textContent = "Role";

  const roleSelect = document.createElement("select");
  roleSelect.id = "loginRole";
  roleSelect.className = "form-input";
  roleSelect.setAttribute("aria-label", "User role for demo access");

  const guestOption = document.createElement("option");
  guestOption.value = "guest";
  guestOption.textContent = "Guest";

  const secretaryOption = document.createElement("option");
  secretaryOption.value = "secretary";
  secretaryOption.textContent = "Secretary";
  secretaryOption.selected = true;

  const adminOption = document.createElement("option");
  adminOption.value = "admin";
  adminOption.textContent = "Admin";

  const viewerOption = document.createElement("option");
  viewerOption.value = "viewer";
  viewerOption.textContent = "Viewer";

  roleSelect.appendChild(guestOption);
  roleSelect.appendChild(secretaryOption);
  roleSelect.appendChild(adminOption);
  roleSelect.appendChild(viewerOption);

  const roleWrapper = document.createElement("div");
  roleWrapper.className = "form-group";
  roleWrapper.appendChild(roleLabel);
  roleWrapper.appendChild(roleSelect);

  // Tier select (explicit Council+ / Network demo option)
  const tierLabel = document.createElement("label");
  tierLabel.htmlFor = "loginTier";
  tierLabel.textContent = "Access Tier";

  const tierSelect = document.createElement("select");
  tierSelect.id = "loginTier";
  tierSelect.className = "form-input";
  tierSelect.setAttribute("aria-label", "Access tier for demo access");

  const tierAutoOption = document.createElement("option");
  tierAutoOption.value = "auto";
  tierAutoOption.textContent = "Auto (from role)";
  tierAutoOption.selected = true;

  const tierFreeOption = document.createElement("option");
  tierFreeOption.value = "free";
  tierFreeOption.textContent = "Free";

  const tierProOption = document.createElement("option");
  tierProOption.value = "pro";
  tierProOption.textContent = "Pro";

  const tierCouncilOption = document.createElement("option");
  tierCouncilOption.value = "council";
  tierCouncilOption.textContent = "Council+";

  const tierNetworkOption = document.createElement("option");
  tierNetworkOption.value = "network";
  tierNetworkOption.textContent = "Network";

  tierSelect.appendChild(tierAutoOption);
  tierSelect.appendChild(tierFreeOption);
  tierSelect.appendChild(tierProOption);
  tierSelect.appendChild(tierCouncilOption);
  tierSelect.appendChild(tierNetworkOption);

  const tierWrapper = document.createElement("div");
  tierWrapper.className = "form-group";
  tierWrapper.appendChild(tierLabel);
  tierWrapper.appendChild(tierSelect);

  // Demo submit button
  const submitBtn = document.createElement("button");
  submitBtn.id = "loginSubmit";
  submitBtn.className = "btn btn-secondary";
  submitBtn.type = "button";
  submitBtn.textContent = "Enter Workspace";
  submitBtn.setAttribute("aria-label", "Sign in with email and role");

  demoForm.appendChild(demoNote);
  demoForm.appendChild(emailWrapper);
  demoForm.appendChild(roleWrapper);
  demoForm.appendChild(tierWrapper);
  demoForm.appendChild(submitBtn);

  demoDetails.appendChild(demoForm);
  demoAccess.appendChild(demoDetails);

  // Assemble the login card
  loginCard.appendChild(header);

  // Add SSO button first if enabled
  if (ssoBtn) {
    loginCard.appendChild(ssoBtn);
  }

  loginCard.appendChild(googleBtn);
  loginCard.appendChild(divider);
  loginCard.appendChild(demoAccess);

  // Assemble the login page
  loginStage.appendChild(contextPanel);
  loginStage.appendChild(loginCard);
  loginPage.appendChild(loginStage);

  return loginPage;
}

/**
 * Set up event handlers for the login page
 * Attaches click/submit listeners to form controls
 * @param {Function} navigate - Router navigate function
 * @param {Object|null} ssoStatus - Optional SSO status object
 */
function setupEventHandlers(navigate, ssoStatus = null) {
  // SSO button handler
  if (ssoStatus && ssoStatus.enabled) {
    const ssoBtn = document.getElementById(`loginSSO_${ssoStatus.provider}`);
    if (ssoBtn) {
      ssoBtn.addEventListener("click", () =>
        handleSsoSignIn(navigate, ssoStatus)
      );
    }
  }

  const googleBtn = document.getElementById("loginGoogle");
  const submitBtn = document.getElementById("loginSubmit");

  // Google Sign-In handler
  if (googleBtn) {
    googleBtn.addEventListener("click", () => handleGoogleSignIn(navigate));
  }

  // Demo form submission handler
  if (submitBtn) {
    submitBtn.addEventListener("click", () => handleDemoSignIn(navigate));
  }

  // Allow Enter key in form fields to submit
  const emailInput = document.getElementById("loginEmail");
  const roleSelect = document.getElementById("loginRole");

  if (emailInput) {
    emailInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleDemoSignIn(navigate);
      }
    });
  }

  if (roleSelect) {
    roleSelect.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleDemoSignIn(navigate);
      }
    });
  }
}

/**
 * Handle SSO (SAML/OIDC) Sign-In flow
 * Routes to appropriate provider (SAML or OIDC)
 * @async
 * @param {Function} navigate - Router navigate function
 * @param {Object} ssoStatus - SSO status object {provider}
 */
async function handleSsoSignIn(navigate, ssoStatus) {
  try {
    let user;

    // Route to appropriate SSO provider
    if (ssoStatus.provider === "saml_custom") {
      user = await signInWithSAML(ssoStatus.provider);
    } else {
      // OIDC providers: google_workspace, azure_ad, okta, oidc_custom
      user = await signInWithOIDC(ssoStatus.provider);
    }
    localStorage.setItem("camAuthMode", "firebase");

    showToast(`Signed in as ${user.displayName || user.email}`, {
      type: "success"
    });

    // Navigate to dashboard after successful sign-in
    navigate("/dashboard");
  } catch (error) {
    console.error("SSO sign-in failed:", error);
    showToast("SSO sign-in failed. Try Google Sign-In instead.", {
      type: "error"
    });
  }
}

/**
 * Handle Google Sign-In flow
 * Calls Firebase signInWithGoogle and navigates on success
 * @async
 * @param {Function} navigate - Router navigate function
 */
async function handleGoogleSignIn(navigate) {
  try {
    const user = await signInWithGoogle();
    localStorage.setItem("camAuthMode", "firebase");
    showToast(`Signed in as ${user.displayName || user.email}`, {
      type: "success"
    });
    // Navigate to dashboard after successful sign-in
    navigate("/dashboard");
  } catch (error) {
    console.error("Google sign-in failed:", error);
    showToast("Google sign-in failed. Try demo access instead.", {
      type: "error"
    });
  }
}

/**
 * Handle demo email + role sign-in
 * Validates inputs and calls setRole to authenticate
 * @async
 * @param {Function} navigate - Router navigate function
 */
async function handleDemoSignIn(navigate) {
  const emailInput = document.getElementById("loginEmail");
  const roleSelect = document.getElementById("loginRole");
  const tierSelect = document.getElementById("loginTier");

  if (!emailInput || !roleSelect || !tierSelect) {
    showToast("Form elements not found", { type: "error" });
    return;
  }

  const email = emailInput.value.trim() || "user@example.com";
  const role = roleSelect.value || "secretary";

  // Validate email format (basic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", { type: "warning" });
    return;
  }

  try {
    // Set role and persist to localStorage
    setRole(role, email, "");
    localStorage.setItem("camAuthMode", "demo");
    const demoTier =
      tierSelect.value === "auto"
        ? getDemoTierForRole(role)
        : normalizeDemoTier(tierSelect.value);
    localStorage.setItem("camUserTier", demoTier);
    localStorage.removeItem("camTierPreview");

    showToast(`Signed in as ${role} (${demoTier})`, {
      type: "success"
    });

    // Navigate to dashboard after successful sign-in
    navigate("/dashboard");
  } catch (error) {
    console.error("Demo sign-in failed:", error);
    showToast("Sign-in failed. Please try again.", {
      type: "error"
    });
  }
}

/**
 * Main login route handler
 * Called by router when navigating to /login
 * Renders the login page and sets up event handlers
 * @async
 * @param {Object} params - Route parameters (empty for /login)
 * @param {Object} context - Router context with navigate function
 */
export async function loginHandler(params, context) {
  // Get the main app container
  const meetingsView = document.getElementById("meetingsView");
  const businessHubView = document.getElementById("businessHubView");
  const dashboardView = document.getElementById("dashboardView");
  const utilityView = document.getElementById("utilityView");
  const loginModal = document.getElementById("loginModal");

  // Hide both main views
  if (meetingsView) meetingsView.classList.add("hidden");
  if (businessHubView) businessHubView.classList.add("hidden");
  if (dashboardView) dashboardView.classList.add("hidden");
  if (utilityView) utilityView.classList.add("hidden");
  if (loginModal) {
    loginModal.classList.add("hidden");
    loginModal.setAttribute("aria-hidden", "true");
  }

  // Get or create login page container
  let loginContainer = document.getElementById("loginPageContainer");
  if (!loginContainer) {
    loginContainer = document.createElement("div");
    loginContainer.id = "loginPageContainer";
    document.body.insertBefore(loginContainer, document.querySelector(".shell"));
  }

  // Check if SSO is enabled for this org
  const ssoStatus = await getSsoStatus();

  // Clear and render login page
  loginContainer.classList.remove("hidden");
  loginContainer.innerHTML = "";
  const loginPage = renderLoginPage(ssoStatus);
  loginContainer.appendChild(loginPage);
  syncLoginThemeWithOs(loginContainer);

  // Set up event handlers with navigate function from context
  setupEventHandlers(context.router.navigate, ssoStatus);

  context?.onCleanup?.(() => {
    teardownLoginThemeSync();
  });
}

function syncLoginThemeWithOs(loginContainer) {
  teardownLoginThemeSync();

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    loginContainer?.setAttribute("data-login-theme", "light");
    return;
  }

  loginThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = () => {
    const theme = loginThemeMediaQuery.matches ? "dark" : "light";
    loginContainer?.setAttribute("data-login-theme", theme);
  };

  applyTheme();

  loginThemeChangeHandler = () => applyTheme();
  loginThemeMediaQuery.addEventListener("change", loginThemeChangeHandler);
}

function teardownLoginThemeSync() {
  if (loginThemeMediaQuery && loginThemeChangeHandler) {
    loginThemeMediaQuery.removeEventListener("change", loginThemeChangeHandler);
  }
  loginThemeMediaQuery = null;
  loginThemeChangeHandler = null;
}
