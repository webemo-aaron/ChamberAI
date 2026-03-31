import { TIERS } from "../../billing.js";

function formatRole(role = "guest") {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function normalizeTier(tier = "Free") {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function tierSupportsAnalytics(tier = "Free") {
  return ["Council", "Network"].includes(normalizeTier(tier));
}

function getTierConfig(tier = "Free") {
  return TIERS[tier.toLowerCase()] || TIERS.free;
}

function getUpgradeTarget(tier = "Free") {
  const current = getTierConfig(tier);
  return current.upgradeTo ? TIERS[current.upgradeTo] : null;
}

function normalizeBillingTier(statusTier, fallbackTier) {
  if (statusTier) {
    return normalizeTier(statusTier);
  }

  return normalizeTier(fallbackTier || "Free");
}

export function buildUtilityRouteConfig(route, context = {}) {
  const role = context.role || "guest";
  const tier = normalizeTier(context.tier || "Free");
  const email = context.email || "guest@chamberai.local";
  const tierConfig = getTierConfig(tier);
  const upgradeTarget = getUpgradeTarget(tier);

  const sharedActions = {
    dashboard: { label: "Open Dashboard", route: "/dashboard" },
    settings: { label: "Open Settings", route: "/settings" }
  };

  switch (route) {
    case "/analytics":
      return {
        eyebrow: "Operations",
        title: "Analytics",
        description:
          "Board effectiveness, action completion, and AI-assisted operational throughput in one operating view.",
        spotlight: {
          title: "Council analytics lane",
          description:
            "Track completion health, approval flow, and guided AI usage before issues become board friction.",
          pills: [`${tier} tier`, `${formatRole(role)} role`]
        },
        cards: [
          {
            title: "Board Health",
            description: "Weekly operating measures for meeting output and follow-through.",
            metrics: [
              { label: "Completion", value: "92%" },
              { label: "Open Actions", value: "3" },
              { label: "Approval Pace", value: "1.8d" }
            ]
          },
          {
            title: "AI Throughput",
            description: "Assists generated across minutes, summaries, and support workflows.",
            metrics: [
              { label: "Interactions", value: "14" },
              { label: "Drafts Ready", value: "6" },
              { label: "Coverage", value: "High" }
            ]
          },
          {
            title: "Operational Moves",
            description: "Use the dashboard for the live overview, then drill into meetings for corrective action.",
            actions: [sharedActions.dashboard, { label: "Open Meetings", route: "/meetings" }]
          }
        ]
      };

    case "/billing":
      return {
        eyebrow: "Operations",
        title: "Billing",
        description:
          "Plan status, premium capabilities, and the next commercial move for the workspace.",
        spotlight: {
          title: `${tierConfig.name} plan`,
          description:
            upgradeTarget
              ? `${upgradeTarget.name} is the next tier when you need broader analytics, API access, or multi-surface AI operations.`
              : "This workspace is already on the highest available tier for the console.",
          pills: [`${tierConfig.price}${tierConfig.period}`, "Stripe-ready"]
        },
        cards: [
          {
            title: "Current Plan",
            description: "Live subscription posture for the current workspace.",
            metrics: [
              { label: "Tier", value: tierConfig.name },
              { label: "Status", value: "Active" },
              { label: "Role Access", value: formatRole(role) }
            ]
          },
          {
            title: "Included Capabilities",
            description: "Key surfaces unlocked on the current tier.",
            list: tierConfig.features.slice(0, 5)
          },
          {
            title: upgradeTarget ? `Upgrade Path: ${upgradeTarget.name}` : "Enterprise Coverage",
            description:
              upgradeTarget
                ? "Use the next tier when the chamber needs broader intelligence and premium operations."
                : "Multi-chamber workflows, SSO, advanced analytics, and custom integrations are already available.",
            metrics: upgradeTarget
              ? [
                  { label: "Next Price", value: `${upgradeTarget.price}${upgradeTarget.period}` },
                  { label: "Current Gap", value: upgradeTarget.features[0] },
                  { label: "Readiness", value: "Available" }
                ]
              : [
                  { label: "SSO", value: "Available" },
                  { label: "Integrations", value: "Available" },
                  { label: "Support", value: "Enterprise" }
                ],
            actions: [
              { label: "Open Stripe Admin", href: "./stripe-admin.html", external: true },
              { label: "Open Products Admin", href: "./products-admin.html", external: true }
            ]
          }
        ]
      };

    case "/geo-intelligence":
      return {
        eyebrow: "Intelligence",
        title: "Geo Intelligence",
        description:
          "Coverage, opportunity mapping, and chamber visibility by city, ZIP, or town.",
        spotlight: {
          title: "Territory coverage",
          description:
            "Use geographic briefs to understand where member support and prospecting should focus next.",
          pills: ["City / ZIP / Town", "Opportunity-ready"]
        },
        cards: [
          {
            title: "Coverage Insight",
            description: "Territory-aware signals for member support and outreach.",
            metrics: [
              { label: "Scope", value: "City / ZIP" },
              { label: "Priority Zones", value: "4" },
              { label: "Status", value: "Ready" }
            ]
          },
          {
            title: "Next Move",
            description: "Seed business listings and recent meetings to deepen geographic context.",
            actions: [{ label: "Open Business Hub", route: "/business-hub" }]
          }
        ]
      };

    case "/profile":
      return {
        eyebrow: "Account",
        title: "Profile",
        description: "Identity, role, and primary operator context for this ChamberAI workspace.",
        spotlight: {
          title: email,
          description: "The active identity used for board operations, member support, and dashboard personalization.",
          pills: [`${formatRole(role)} role`, `${tier} tier`]
        },
        cards: [
          {
            title: "Identity",
            description: "Current authenticated operator context.",
            metrics: [
              { label: "Email", value: email },
              { label: "Role", value: formatRole(role) },
              { label: "Tier", value: tier }
            ]
          },
          {
            title: "Workspace Moves",
            description: "Jump back into live operating surfaces from account context.",
            actions: [sharedActions.dashboard, { label: "Open Preferences", route: "/preferences" }]
          }
        ]
      };

    case "/preferences":
      return {
        eyebrow: "Account",
        title: "Preferences",
        description:
          "Personal workspace behavior, landing defaults, and focused operating habits.",
        spotlight: {
          title: "Operator defaults",
          description:
            "Use preferences to keep the console aligned to your weekly chamber rhythm and handoff style.",
          pills: ["Dashboard landing", "ChamberAI theme"]
        },
        cards: [
          {
            title: "Working Defaults",
            description: "Suggested defaults for day-to-day secretary workflows.",
            metrics: [
              { label: "Landing", value: "Dashboard" },
              { label: "Review Mode", value: "Operational" },
              { label: "Notifications", value: "Focused" }
            ]
          },
          {
            title: "Adjust Settings",
            description: "Broader platform controls remain in the settings workspace.",
            actions: [sharedActions.settings]
          }
        ]
      };

    default:
      return {
        eyebrow: "Workspace",
        title: "ChamberAI",
        description: "Operational surfaces for chamber teams.",
        cards: [{ title: "Return", description: "Go back to the dashboard.", actions: [sharedActions.dashboard] }]
      };
  }
}

export function buildBillingRouteConfig(context = {}, status = {}, uiState = {}) {
  const role = context.role || "guest";
  const liveTier = normalizeBillingTier(status.tier, context.liveTier || context.tier);
  const tierPreview = context.tierPreview || "";
  const tier = normalizeBillingTier(context.tier || tierPreview || liveTier, liveTier);
  const billingStatus = status.status || "Active";
  const renewalText = status.validUntil
    ? new Date(status.validUntil).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "Indefinite";
  const tierConfig = getTierConfig(tier);
  const upgradeTarget = getUpgradeTarget(tier);
  const readinessText =
    billingStatus === "past_due" ? "Needs attention" : "Ready";

  return {
    eyebrow: "Operations",
    title: "Billing",
    description:
      "Plan status, premium capabilities, and direct commercial actions for the active workspace.",
    spotlight: {
      title: `${tierConfig.name} plan`,
      description:
        upgradeTarget
          ? `${upgradeTarget.name} is the next tier when you need broader analytics, API access, or multi-surface AI operations.`
          : "This workspace is already on the highest available tier for the console.",
      pills: [`${tierConfig.price}${tierConfig.period}`, billingStatus]
    },
    cards: [
      {
        title: "Current Plan",
        description: "Live subscription posture for the current workspace.",
        metrics: [
          { label: "Tier", value: tierConfig.name },
          { label: "Status", value: billingStatus },
          { label: "Renewal", value: renewalText },
          { label: "Role Access", value: formatRole(role) }
        ]
      },
      {
        title: "Tier Sandbox",
        description:
          "Preview Free, Pro, Council, and Network behavior in the console while keeping the live billing record intact.",
        metrics: [
          { label: "Live Tier", value: liveTier },
          { label: "Preview", value: tierPreview || "Live Billing" },
          { label: "Effective Tier", value: tier }
        ],
        actions: [
          { label: "Live Billing", action: "preview-tier", value: "live", disabled: !tierPreview },
          { label: "Free", action: "preview-tier", value: "free", disabled: tier === "Free" },
          { label: "Pro", action: "preview-tier", value: "pro", disabled: tier === "Pro" },
          { label: "Council", action: "preview-tier", value: "council", disabled: tier === "Council" },
          { label: "Network", action: "preview-tier", value: "network", disabled: tier === "Network" }
        ]
      },
      {
        title: "Included Capabilities",
        description: "Key surfaces unlocked on the current tier.",
        list: tierConfig.features.slice(0, 6)
      },
      {
        title: upgradeTarget ? `Upgrade Path: ${upgradeTarget.name}` : "Enterprise Coverage",
        description:
          upgradeTarget
            ? "Launch checkout when the chamber needs broader intelligence and premium operations."
            : "Multi-chamber workflows, SSO, advanced analytics, and custom integrations are already available.",
        metrics: upgradeTarget
          ? [
              { label: "Next Price", value: `${upgradeTarget.price}${upgradeTarget.period}` },
              { label: "Current Gap", value: upgradeTarget.features[0] },
              { label: "Readiness", value: readinessText }
            ]
          : [
              { label: "SSO", value: "Available" },
              { label: "Integrations", value: "Available" },
              { label: "Support", value: "Enterprise" }
            ],
        actions: [
          {
            label:
              uiState.pendingAction === "portal"
                ? "Opening Billing Portal..."
                : "Manage Subscription",
            action: "portal",
            disabled: Boolean(uiState.pendingAction)
          },
          ...(upgradeTarget
            ? [
                {
                  label:
                    uiState.pendingAction === "checkout"
                      ? `Launching ${upgradeTarget.name} Upgrade...`
                      : `Launch ${upgradeTarget.name} Upgrade`,
                  action: "checkout",
                  value: upgradeTarget.name.toLowerCase(),
                  disabled: Boolean(uiState.pendingAction)
                }
              ]
            : []),
          { label: "Open Stripe Admin", href: "./stripe-admin.html", external: true },
          { label: "Open Products Admin", href: "./products-admin.html", external: true }
        ]
      }
    ],
    notice: uiState.notice || null
  };
}

export function buildAnalyticsRouteConfig(context = {}, analytics = {}, uiState = {}) {
  const role = context.role || "guest";
  const tier = normalizeTier(context.tier || "Free");
  const hasAnalyticsAccess = tierSupportsAnalytics(tier);
  const completionRate = Number(analytics.completionRate ?? 0);
  const aiInteractions = Number(analytics.aiInteractions ?? 0);
  const actionItemsOpen = Number(analytics.actionItemsOpen ?? 0);
  const approvalsPace = analytics.approvalPace || "1.8d";
  const draftCount = analytics.draftCount || "6";
  const coverage = analytics.coverage || "High";

  return {
    eyebrow: "Operations",
    title: "Analytics",
    description:
      "Board effectiveness, action completion, and AI-assisted operational throughput in one operating view.",
    spotlight: {
      title: "Board analytics lane",
      description:
        "Track completion health, approval flow, and guided AI usage before issues become board friction.",
      pills: [`${tier} tier`, `${formatRole(role)} role`]
    },
    notice: uiState.notice || null,
    cards: [
      {
        title: "Board Health",
        description: "Weekly operating measures for meeting output and follow-through.",
        metrics: [
          { label: "Completion", value: `${completionRate}%` },
          { label: "Open Actions", value: String(actionItemsOpen) },
          { label: "Approval Pace", value: approvalsPace }
        ]
      },
      {
        title: "AI Throughput",
        description: "Assists generated across minutes, summaries, and support workflows.",
        metrics: [
          { label: "Interactions", value: String(aiInteractions) },
          { label: "Drafts Ready", value: String(draftCount) },
          { label: "Coverage", value: coverage }
        ]
      },
      {
        title: "Operational Moves",
        description:
          "Use the dashboard for the live overview, then drill into meetings for corrective action.",
        actions: [
          { label: "Open Dashboard", route: "/dashboard" },
          { label: "Open Meetings", route: "/meetings" },
          hasAnalyticsAccess
            ? { label: "Refresh Analytics", action: "refresh", disabled: Boolean(uiState.pendingAction) }
            : { label: "Open Billing", route: "/billing" }
        ]
      }
    ]
  };
}
