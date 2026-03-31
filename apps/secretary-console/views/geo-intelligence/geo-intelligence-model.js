function normalizeScopeValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function matchGeoRecord(record, scope) {
  if (!scope?.isActionable) {
    return true;
  }

  return (
    normalizeScopeValue(record?.scope_type) === normalizeScopeValue(scope.scopeType) &&
    normalizeScopeValue(record?.scope_id) === normalizeScopeValue(scope.scopeId)
  );
}

function selectLatest(records = [], scope) {
  return records
    .filter((record) => matchGeoRecord(record, scope))
    .sort((left, right) => String(right.updated_at ?? right.generated_at ?? "").localeCompare(String(left.updated_at ?? left.generated_at ?? "")))[0] || null;
}

export function normalizeGeoCollection(response) {
  if (!response || response.error) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

export function buildGeoIntelligenceModel({
  selectedCity,
  profiles = [],
  briefs = [],
  inputContext = null,
  uiState = {}
}) {
  const scope = {
    id: selectedCity?.id || "all",
    label: selectedCity?.label || "All Showcase Cities",
    scopeId: selectedCity?.scopeId || "",
    scopeType: selectedCity?.scopeType || "",
    isActionable: Boolean(selectedCity && selectedCity.id && selectedCity.id !== "all")
  };

  const activeProfile = selectLatest(profiles, scope);
  const activeBrief = selectLatest(briefs, scope);
  const pendingAction = uiState.pendingAction || "";
  const profileRefreshPending = pendingAction === "refresh-profile";
  const briefGenerationPending = pendingAction === "generate-brief";

  let notice = uiState.notice || null;
  if (!notice && !scope.isActionable) {
    notice = {
      tone: "info",
      title: "Choose a Territory",
      message: "Select a showcase city to refresh a geo profile or generate a new content brief."
    };
  } else if (!notice && scope.isActionable && !activeProfile) {
    notice = {
      tone: "info",
      title: "Profile Ready To Refresh",
      message: `No stored geo profile is loaded for ${scope.label} yet. Refresh the territory profile to build one from current chamber context.`
    };
  }

  return {
    eyebrow: "Intelligence",
    title: "Geo Intelligence",
    description: "Turn territory coverage into actionable chamber priorities, outreach, and opportunity mapping.",
    scope,
    notice,
    spotlight: {
      title: scope.label,
      description: scope.isActionable
        ? `Live territory view for ${scope.label}. Refresh the profile when chamber activity changes, then generate a brief for outreach or operator planning.`
        : "Select one showcase city to run profile refresh and content generation against a specific chamber territory.",
      pills: scope.isActionable
        ? [
            `${scope.scopeType || "territory"} scope`,
            activeProfile ? "Profile loaded" : "Profile pending",
            activeBrief ? "Brief ready" : "Brief pending"
          ]
        : ["All showcase cities", "Read-only overview"]
    },
    cards: [
      {
        title: "Territory Profile",
        description: scope.isActionable
          ? "Coverage, readiness, and current chamber signal strength for the selected territory."
          : "Pick a single city to inspect and refresh a live territory profile.",
        metrics: [
          { label: "Scope", value: scope.isActionable ? scope.scopeType : "Select city" },
          { label: "AI Readiness", value: String(activeProfile?.ai_readiness_score ?? "—") },
          { label: "Business Density", value: String(activeProfile?.business_density_score ?? "—") }
        ],
        actions: [
          {
            label: profileRefreshPending ? "Refreshing Profile..." : "Refresh Profile",
            action: "refresh-profile",
            disabled: !scope.isActionable || profileRefreshPending || briefGenerationPending
          },
          {
            label: briefGenerationPending ? "Generating Brief..." : "Generate Brief",
            action: "generate-brief",
            disabled: !scope.isActionable || briefGenerationPending || profileRefreshPending
          }
        ]
      },
      {
        title: "Demand Gaps",
        description: "Signals that indicate where chamber-led AI support can unlock business value next.",
        list: activeProfile?.demand_gap_tags?.length
          ? activeProfile.demand_gap_tags
          : ["No demand signals yet for this territory."]
      },
      {
        title: "Provider Supply",
        description: "Current operator or ecosystem inputs available to support implementation in this geography.",
        list: activeProfile?.provider_supply_tags?.length
          ? activeProfile.provider_supply_tags
          : ["No provider inputs recorded for this territory yet."]
      },
      {
        title: "Profile Inputs",
        description: "The live chamber context that contributed to the current territory profile refresh.",
        metrics: [
          { label: "Businesses Sampled", value: String(inputContext?.businessCount ?? "0") },
          { label: "Meetings Sampled", value: String(inputContext?.meetingCount ?? "0") }
        ],
        list: [
          inputContext?.businessNames?.length
            ? `Businesses sampled: ${inputContext.businessNames.join(", ")}`
            : "Businesses sampled: none yet.",
          inputContext?.categories?.length
            ? `Top categories: ${inputContext.categories.join(", ")}`
            : "Top categories: none yet.",
          inputContext?.meetingTopics?.length
            ? `Meeting topics sampled: ${inputContext.meetingTopics.join(", ")}`
            : "Meeting topics sampled: none yet."
        ],
        actions: [
          {
            label: `Open ${scope.isActionable ? scope.scopeId : "Territory"} Businesses`,
            route: "/business-hub",
            disabled: !scope.isActionable
          },
          {
            label: `Open ${scope.isActionable ? scope.scopeId : "Territory"} Meetings`,
            route: "/meetings",
            disabled: !scope.isActionable
          }
        ]
      },
      {
        title: "Content Brief",
        description: activeBrief?.opportunity_summary || "Generate a content brief to draft outreach and use-case positioning for this territory.",
        list: activeBrief?.top_use_cases?.length
          ? activeBrief.top_use_cases
          : ["No geo content brief generated yet."],
        detail: activeBrief?.outreach_draft || ""
      }
    ]
  };
}
