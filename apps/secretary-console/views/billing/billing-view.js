import { request } from "../../core/api.js";
import { getCurrentRole } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import {
  clearTierPreview,
  getEffectiveTier,
  getTierPreview,
  setStoredTier,
  setTierPreview
} from "../../billing.js";
import { buildBillingRouteConfig } from "../common/utility-config.js";
import { renderUtilityView } from "../common/utility-view.js";

function normalizeBillingStatus(response) {
  if (!response || response.error) {
    return {
      tier: getEffectiveTier(),
      status: "Active",
      validUntil: null
    };
  }

  return {
    tier: response.tier || response.plan || getEffectiveTier(),
    status: response.status || "Active",
    validUntil: response.validUntil || response.valid_until || null
  };
}

export async function billingHandler(params, context) {
  const container = document.getElementById("utilityView");
  if (!container) {
    return;
  }

  context?.onCleanup?.(() => {
    // No-op: renderUtilityView is stateless
  });

  const statusResponse = await request("/billing/status", "GET", null, {
    suppressAlert: true
  });
  const billingStatus = normalizeBillingStatus(statusResponse);
  setStoredTier(billingStatus.tier);

  const userContext = {
    role: getCurrentRole() || "guest",
    tier: getEffectiveTier(billingStatus.tier),
    liveTier: billingStatus.tier,
    tierPreview: getTierPreview(),
    email: localStorage.getItem("camEmail") || "guest@chamberai.local"
  };
  let uiState = { pendingAction: "", notice: null };

  const render = () => {
    const config = buildBillingRouteConfig(userContext, billingStatus, uiState);
    config.onAction = async (action, value) => {
      if (action === "preview-tier") {
        if (value === "live") {
          clearTierPreview();
          userContext.tierPreview = "";
          userContext.tier = billingStatus.tier;
          uiState = {
            pendingAction: "",
            notice: {
              tone: "success",
              title: "Live Billing Tier Restored",
              message: `The workspace is back on the live ${billingStatus.tier} tier.`
            }
          };
        } else {
          setTierPreview(value);
          userContext.tierPreview = getTierPreview();
          userContext.tier = userContext.tierPreview || billingStatus.tier;
          uiState = {
            pendingAction: "",
            notice: {
              tone: "info",
              title: `Previewing ${userContext.tier} Tier`,
              message: "The console is now simulating this tier for workflow testing."
            }
          };
        }
        render();
        return;
      }

      uiState = {
        pendingAction: action,
        notice: {
          tone: "info",
          title: action === "portal" ? "Opening Billing Portal" : "Launching Checkout",
          message:
            action === "portal"
              ? "Preparing your Stripe billing session."
              : "Preparing your ChamberAI upgrade checkout."
        }
      };
      render();

      const response =
        action === "portal"
          ? await request("/billing/portal", "POST", {}, { suppressAlert: true })
          : await request(
              "/billing/checkout",
              "POST",
              { tier: value },
              { suppressAlert: true }
            );

      if (response?.url) {
        uiState = {
          pendingAction: action,
          notice: {
            tone: "success",
            title: "Redirecting",
            message: "Your billing session is ready. Redirecting now."
          }
        };
        render();
        window.location.href = response.url;
        return;
      }

      const failureMessage =
        action === "portal"
          ? "Billing portal unavailable for this environment"
          : "Upgrade checkout unavailable for this environment";

      uiState = {
        pendingAction: "",
        notice: {
          tone: "warning",
          title: "Billing Action Unavailable",
          message: `${failureMessage}. Verify the API base and Stripe runtime, then try again.`
        }
      };
      render();
      showToast(failureMessage);
    };

    renderUtilityView(container, config);
  };

  render();
}
