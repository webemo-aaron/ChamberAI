/**
 * Admin Route Handlers
 *
 * Handles route logic for admin pages:
 * - /admin/stripe
 * - /admin/products
 *
 * Exported functions: stripeAdminHandler, productsAdminHandler
 */

import { getCurrentRole } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";
import { renderAdminWorkspace } from "./admin-workspace.js";

/**
 * Hide all transient view containers
 */
function hideAllViews() {
  const containers = [
    document.getElementById("dashboardView"),
    document.getElementById("meetingsView"),
    document.getElementById("businessHubView"),
    document.getElementById("utilityView"),
    document.getElementById("geoIntelligenceView"),
    document.getElementById("kioskView")
  ];
  containers.forEach((container) => {
    if (container) {
      container.classList.add("hidden");
      container.innerHTML = "";
    }
  });
}

/**
 * Activate the utility view
 */
function activateUtilityView() {
  hideAllViews();
  const el = document.getElementById("utilityView");
  if (el) {
    el.classList.remove("hidden");
  }
  return el;
}

/**
 * Stripe Admin Handler
 * @param {Object} params - Route parameters
 * @param {Object} context - Router context with onCleanup
 */
export function stripeAdminHandler(params, context) {
  if (getCurrentRole() !== "admin") {
    showToast("Stripe admin requires admin access", { type: "error" });
    navigate("/dashboard");
    return;
  }

  const container = activateUtilityView();
  if (!container) return;

  renderAdminWorkspace(container, {
    eyebrow: "Admin",
    title: "Stripe Admin",
    description: "Billing configuration, Stripe validation, and commercial operations without leaving the ChamberAI shell.",
    frameTitle: "Stripe Billing Admin",
    src: "./stripe-admin.html",
    sidecarTitle: "What to verify",
    sidecarDescription: "Use the embedded admin surface for live inspection, then open the full page only when you need isolated troubleshooting.",
    highlights: [
      "Validate Stripe environment and plan readiness.",
      "Review billing controls without losing app navigation.",
      "Keep the ChamberAI sidebar and topbar available during admin work."
    ]
  });

  context?.onCleanup?.(() => {
    // No-op: DOM cleanup handled by view system
  });
}

/**
 * Products Admin Handler
 * @param {Object} params - Route parameters
 * @param {Object} context - Router context with onCleanup
 */
export function productsAdminHandler(params, context) {
  if (getCurrentRole() !== "admin") {
    showToast("Products admin requires admin access", { type: "error" });
    navigate("/dashboard");
    return;
  }

  const container = activateUtilityView();
  if (!container) return;

  renderAdminWorkspace(container, {
    eyebrow: "Admin",
    title: "Products Admin",
    description: "Product catalog, entitlements, and operational controls inside the main ChamberAI workspace.",
    frameTitle: "Products Admin",
    src: "./products-admin.html",
    sidecarTitle: "What to verify",
    sidecarDescription: "Keep product operations tied to the live shell so switching between billing, settings, and catalog work stays fast.",
    highlights: [
      "Review product records and pricing safely in-shell.",
      "Keep context with the sidebar instead of jumping to a standalone page.",
      "Open the full page only for focused maintenance or copy/paste workflows."
    ]
  });

  context?.onCleanup?.(() => {
    // No-op: DOM cleanup handled by view system
  });
}
