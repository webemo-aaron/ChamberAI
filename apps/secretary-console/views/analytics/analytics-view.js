import { request } from "../../core/api.js";
import { getCurrentRole } from "../../core/auth.js";
import { getEffectiveTier, setStoredTier } from "../../billing.js";
import { buildAnalyticsRouteConfig } from "../common/utility-config.js";
import { renderUtilityView } from "../common/utility-view.js";

function normalizeTier(response) {
  if (!response || response.error) {
    return getEffectiveTier();
  }

  const tier = response.tier || response.plan || "Free";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function canAccessAnalyticsTier(tier = "Free") {
  return ["Council", "Network"].includes(String(tier).trim());
}

function normalizeAnalytics(response) {
  if (!response || response.error) {
    return {
      completionRate: 0,
      aiInteractions: 0,
      actionItemsOpen: 0
    };
  }

  return {
    completionRate: Number(response.action_item_completion_rate ?? response.completion_rate ?? 0),
    aiInteractions: Number(response.ai_interactions ?? 0),
    actionItemsOpen: Number(response.open_action_items ?? 0),
    approvalPace: `${response.average_time_to_approval_days ?? 1.8}d`,
    draftCount: String(response.meetings_total ?? "0"),
    coverage: response.average_meeting_attendance > 5 ? "Broad" : "Narrow"
  };
}

export async function analyticsHandler(params, context) {
  const container = document.getElementById("utilityView");
  if (!container) {
    return;
  }

  context?.onCleanup?.(() => {
    // No-op: renderUtilityView is stateless
  });

  const billingResponse = await request("/billing/status", "GET", null, {
    suppressAlert: true
  });
  if (billingResponse && !billingResponse.error && billingResponse.tier) {
    setStoredTier(billingResponse.tier);
  }
  const tier = normalizeTier(billingResponse);

  const userContext = {
    role: getCurrentRole() || "guest",
    tier,
    email: localStorage.getItem("camEmail") || "guest@chamberai.local"
  };

  let uiState = {
    pendingAction: "",
    notice: {
      tone: "info",
      title: "Loading Analytics",
      message: "Pulling the latest board metrics for this workspace."
    }
  };
  let analytics = {
    completionRate: 0,
    aiInteractions: 0,
    actionItemsOpen: 0
  };

  const render = () => {
    const config = buildAnalyticsRouteConfig(userContext, analytics, uiState);
    config.onAction = async (action) => {
      if (action !== "refresh") {
        return;
      }

      uiState = {
        pendingAction: "refresh",
        notice: {
          tone: "info",
          title: "Refreshing Analytics",
          message: "Fetching the latest board metrics from the analytics service."
        }
      };
      render();
      await loadAnalytics();
    };
    renderUtilityView(container, config);
  };

  async function loadAnalytics() {
    if (!canAccessAnalyticsTier(tier)) {
      analytics = {
        completionRate: 0,
        aiInteractions: 0,
        actionItemsOpen: 0
      };
      uiState = {
        pendingAction: "",
        notice: {
          tone: "info",
          title: "Analytics Available on Council Tier",
          message:
            "This workspace does not currently include council analytics. Open Billing to review plan access."
        }
      };
      render();
      return;
    }

    // Fetch board and kiosk metrics in parallel
    const [boardResponse, kioskResponse] = await Promise.all([
      request("/analytics/board", "GET", null, { suppressAlert: true }),
      request("/analytics/kiosk", "GET", null, { suppressAlert: true }).catch(() => null)
    ]);

    if (!boardResponse || boardResponse.error) {
      analytics = {
        completionRate: 0,
        aiInteractions: 0,
        actionItemsOpen: 0
      };
      uiState = {
        pendingAction: "",
        notice: {
          tone: "warning",
          title: "Analytics Unavailable",
          message:
            "The analytics service could not be reached. Verify the API base or backend readiness, then refresh."
        }
      };
      render();
      return;
    }

    analytics = normalizeAnalytics(boardResponse);
    uiState = {
      pendingAction: "",
      notice: {
        tone: "success",
        title: "Analytics Live",
        message: "Board metrics are current for this workspace."
      }
    };
    render();
  }

  render();
  await loadAnalytics();
}
