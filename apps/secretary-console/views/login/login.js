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

import { signInWithGoogle, setRole } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";

/**
 * Render the full-page login card
 * Creates the HTML structure for the login page
 * @returns {HTMLElement} The login page container
 */
function renderLoginPage() {
  // Create main login page container
  const loginPage = document.createElement("div");
  loginPage.className = "login-page";
  loginPage.setAttribute("role", "main");

  // Create login card with centered content
  const loginCard = document.createElement("div");
  loginCard.className = "login-card";
  loginCard.setAttribute("role", "region");
  loginCard.setAttribute("aria-labelledby", "loginPageTitle");

  // Header with brand mark and title
  const header = document.createElement("div");
  header.className = "login-header";

  const brandMark = document.createElement("div");
  brandMark.className = "brand-mark-large";
  brandMark.textContent = "CAM";
  brandMark.setAttribute("aria-label", "ChamberAI Mark");

  const title = document.createElement("h1");
  title.id = "loginPageTitle";
  title.className = "login-title";
  title.textContent = "Secretary Console";

  const subtitle = document.createElement("p");
  subtitle.className = "login-subtitle";
  subtitle.textContent = "Governance-first minutes workflow";

  header.appendChild(brandMark);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Google Sign-In button
  const googleBtn = document.createElement("button");
  googleBtn.id = "loginGoogle";
  googleBtn.className = "btn btn-primary";
  googleBtn.type = "button";
  googleBtn.textContent = "Continue with Google";
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
  demoSummary.textContent = "Demo Access (for testing)";

  const demoDetails = document.createElement("details");
  demoDetails.appendChild(demoSummary);

  const demoForm = document.createElement("div");
  demoForm.className = "demo-form";

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

  // Demo submit button
  const submitBtn = document.createElement("button");
  submitBtn.id = "loginSubmit";
  submitBtn.className = "btn btn-secondary";
  submitBtn.type = "button";
  submitBtn.textContent = "Enter";
  submitBtn.setAttribute("aria-label", "Sign in with email and role");

  demoForm.appendChild(emailWrapper);
  demoForm.appendChild(roleWrapper);
  demoForm.appendChild(submitBtn);

  demoDetails.appendChild(demoForm);
  demoAccess.appendChild(demoDetails);

  // Assemble the login card
  loginCard.appendChild(header);
  loginCard.appendChild(googleBtn);
  loginCard.appendChild(divider);
  loginCard.appendChild(demoAccess);

  // Assemble the login page
  loginPage.appendChild(loginCard);

  return loginPage;
}

/**
 * Set up event handlers for the login page
 * Attaches click/submit listeners to form controls
 * @param {Function} navigate - Router navigate function
 */
function setupEventHandlers(navigate) {
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
 * Handle Google Sign-In flow
 * Calls Firebase signInWithGoogle and navigates on success
 * @async
 * @param {Function} navigate - Router navigate function
 */
async function handleGoogleSignIn(navigate) {
  try {
    const user = await signInWithGoogle();
    showToast(`Signed in as ${user.displayName || user.email}`, {
      type: "success"
    });
    // Navigate to meetings after successful sign-in
    navigate("/meetings");
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

  if (!emailInput || !roleSelect) {
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

    showToast(`Signed in as ${role}`, {
      type: "success"
    });

    // Navigate to meetings after successful sign-in
    navigate("/meetings");
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

  // Hide both main views
  if (meetingsView) meetingsView.classList.add("hidden");
  if (businessHubView) businessHubView.classList.add("hidden");

  // Get or create login page container
  let loginContainer = document.getElementById("loginPageContainer");
  if (!loginContainer) {
    loginContainer = document.createElement("div");
    loginContainer.id = "loginPageContainer";
    document.body.insertBefore(loginContainer, document.querySelector(".shell"));
  }

  // Clear and render login page
  loginContainer.innerHTML = "";
  const loginPage = renderLoginPage();
  loginContainer.appendChild(loginPage);

  // Set up event handlers with navigate function from context
  setupEventHandlers(context.router.navigate);
}
