import { getWorkspaceLanes } from "../../components/sidebar-config.js";

const laneRouteMap = {
  intelligence: {
    route: "/dashboard",
    actionLabel: "Open Overview"
  },
  operations: {
    route: "/operations",
    actionLabel: "Open Operations"
  },
  admin: {
    route: "/admin/stripe",
    actionLabel: "Open Admin"
  }
};

const cityPlaybookMap = {
  all: {
    kicker: "Statewide Showcase",
    summary: "Use the dashboard as a cross-city launch point into meetings, member support, and analytics.",
    primaryCta: { label: "Open Operations Workspace", route: "/operations" },
    secondaryCta: { label: "Review Business Hub", route: "/business-hub" },
    statHelpers: {
      meetings: "Tracked sessions",
      members: "Businesses in view",
      actions: "Pending follow-through",
      ai: "Recent guided assists"
    },
    navigationLinks: {
      quickActions: { label: "Open Operations", route: "/operations" },
      feature: { label: "Open Business Hub", route: "/business-hub" },
      activity: { label: "View All Activity", route: "/operations" },
      calendar: { label: "Open Calendar View", route: "/meetings" }
    }
  },
  "portland-me": {
    kicker: "Portland Visitor Economy",
    summary: "Prioritize restaurants, hospitality, and member-response workflows for the city’s busiest chamber surface.",
    primaryCta: { label: "Open Portland Businesses", route: "/business-hub" },
    secondaryCta: { label: "Review Portland Analytics", route: "/analytics" },
    statHelpers: {
      meetings: "Portland governance in motion",
      members: "Portland businesses in view",
      actions: "Portland follow-through pending",
      ai: "Portland operational assists"
    },
    navigationLinks: {
      quickActions: { label: "Review Portland Meetings", route: "/meetings" },
      feature: { label: "Open Portland Member Hub", route: "/business-hub" },
      activity: { label: "View Portland Activity", route: "/meetings" },
      calendar: { label: "Open Portland Calendar", route: "/meetings" }
    }
  },
  "augusta-me": {
    kicker: "Augusta Civic Workflow",
    summary: "Lead with governance, board actions, and public-sector operations for the state-capital showcase.",
    primaryCta: { label: "Open Augusta Meetings", route: "/meetings" },
    secondaryCta: { label: "Track Augusta Operations", route: "/analytics" },
    statHelpers: {
      meetings: "Augusta governance in motion",
      members: "Augusta businesses in view",
      actions: "Augusta follow-through pending",
      ai: "Augusta operational assists"
    },
    navigationLinks: {
      quickActions: { label: "Review Augusta Agendas", route: "/meetings" },
      feature: { label: "Open Augusta Business Hub", route: "/business-hub" },
      activity: { label: "View Augusta Activity", route: "/meetings" },
      calendar: { label: "Open Augusta Calendar", route: "/meetings" }
    }
  },
  "bangor-me": {
    kicker: "Bangor Growth Corridor",
    summary: "Surface regional development signals, member updates, and chamber operations across the Bangor footprint.",
    primaryCta: { label: "View Bangor Operations", route: "/analytics" },
    secondaryCta: { label: "Open Bangor Businesses", route: "/business-hub" },
    statHelpers: {
      meetings: "Bangor governance in motion",
      members: "Bangor businesses in view",
      actions: "Bangor follow-through pending",
      ai: "Bangor operational assists"
    },
    navigationLinks: {
      quickActions: { label: "View Bangor Meetings", route: "/meetings" },
      feature: { label: "Open Bangor Member Hub", route: "/business-hub" },
      activity: { label: "View Bangor Activity", route: "/meetings" },
      calendar: { label: "Open Bangor Calendar", route: "/meetings" }
    }
  },
  "bethel-me": {
    kicker: "Bethel Seasonal Economy",
    summary: "Focus on tourism, hospitality, and small-town member coordination during seasonal demand swings.",
    primaryCta: { label: "Open Bethel Businesses", route: "/business-hub" },
    secondaryCta: { label: "Review Bethel Meetings", route: "/meetings" },
    statHelpers: {
      meetings: "Bethel governance in motion",
      members: "Bethel businesses in view",
      actions: "Bethel follow-through pending",
      ai: "Bethel operational assists"
    },
    navigationLinks: {
      quickActions: { label: "View Bethel Meetings", route: "/meetings" },
      feature: { label: "Open Bethel Member Hub", route: "/business-hub" },
      activity: { label: "View Bethel Activity", route: "/meetings" },
      calendar: { label: "Open Bethel Calendar", route: "/meetings" }
    }
  },
  "kingfield-me": {
    kicker: "Kingfield Rural Support",
    summary: "Keep local-business visibility and chamber follow-through easy to manage for a smaller rural footprint.",
    primaryCta: { label: "Open Kingfield Businesses", route: "/business-hub" },
    secondaryCta: { label: "Review Kingfield Meetings", route: "/meetings" },
    statHelpers: {
      meetings: "Kingfield governance in motion",
      members: "Kingfield businesses in view",
      actions: "Kingfield follow-through pending",
      ai: "Kingfield operational assists"
    },
    navigationLinks: {
      quickActions: { label: "View Kingfield Meetings", route: "/meetings" },
      feature: { label: "Open Kingfield Member Hub", route: "/business-hub" },
      activity: { label: "View Kingfield Activity", route: "/meetings" },
      calendar: { label: "Open Kingfield Calendar", route: "/meetings" }
    }
  },
  "carrabassett-valley-me": {
    kicker: "Carrabassett Destination Economy",
    summary: "Guide hospitality, visitor readiness, and resort-adjacent member workflows from one launch surface.",
    primaryCta: { label: "Open Carrabassett Businesses", route: "/business-hub" },
    secondaryCta: { label: "Review Destination Analytics", route: "/analytics" },
    statHelpers: {
      meetings: "Carrabassett governance in motion",
      members: "Carrabassett businesses in view",
      actions: "Carrabassett follow-through pending",
      ai: "Carrabassett operational assists"
    },
    navigationLinks: {
      quickActions: { label: "View Carrabassett Meetings", route: "/meetings" },
      feature: { label: "Open Carrabassett Member Hub", route: "/business-hub" },
      activity: { label: "View Carrabassett Activity", route: "/meetings" },
      calendar: { label: "Open Carrabassett Calendar", route: "/meetings" }
    }
  },
  "york-me": {
    kicker: "York Tourism Support",
    summary: "Center the dashboard on visitor-facing businesses, chamber coordination, and high-response member service.",
    primaryCta: { label: "Open York Businesses", route: "/business-hub" },
    secondaryCta: { label: "Review York Meetings", route: "/meetings" },
    statHelpers: {
      meetings: "York governance in motion",
      members: "York businesses in view",
      actions: "York follow-through pending",
      ai: "York operational assists"
    },
    navigationLinks: {
      quickActions: { label: "View York Meetings", route: "/meetings" },
      feature: { label: "Open York Member Hub", route: "/business-hub" },
      activity: { label: "View York Activity", route: "/meetings" },
      calendar: { label: "Open York Calendar", route: "/meetings" }
    }
  },
  "scarborough-me": {
    kicker: "Scarborough Service Growth",
    summary: "Track member operations, growth-corridor activity, and business follow-up for a fast-moving service market.",
    primaryCta: { label: "View Scarborough Operations", route: "/analytics" },
    secondaryCta: { label: "Open Scarborough Businesses", route: "/business-hub" },
    statHelpers: {
      meetings: "Scarborough governance in motion",
      members: "Scarborough businesses in view",
      actions: "Scarborough follow-through pending",
      ai: "Scarborough operational assists"
    },
    navigationLinks: {
      quickActions: { label: "View Scarborough Meetings", route: "/meetings" },
      feature: { label: "Open Scarborough Member Hub", route: "/business-hub" },
      activity: { label: "View Scarborough Activity", route: "/meetings" },
      calendar: { label: "Open Scarborough Calendar", route: "/meetings" }
    }
  }
};

function formatRole(role) {
  if (!role) {
    return "Guest";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function createActivityFeed(meetings, businesses) {
  const meetingEntries = meetings.slice(0, 3).map((meeting) => ({
    id: `meeting-${meeting.id}`,
    type: "meeting",
    icon: "●",
    title: `${meeting.location || "Meeting"} ready for review`,
    meta: meeting.date || "Next board session",
    route: meeting.id ? `/meetings/${meeting.id}` : "/meetings"
  }));

  const businessEntries = businesses.slice(0, 2).map((business) => ({
    id: `business-${business.id}`,
    type: "business",
    icon: "◌",
    title: `${business.name || "Business"} updated`,
    meta: business.category || "Directory profile",
    route: business.id ? `/business-hub/${business.id}` : "/business-hub"
  }));

  return [...meetingEntries, ...businessEntries].slice(0, 5);
}

function createCalendar(meetings) {
  const fromMeetings = meetings
    .filter((meeting) => meeting.date)
    .slice(0, 4)
    .map((meeting) => ({
      id: meeting.id || "",
      label: meeting.date,
      title: meeting.location || "Board meeting",
      route: meeting.id ? `/meetings/${meeting.id}` : "/meetings"
    }));

  if (fromMeetings.length > 0) {
    return fromMeetings;
  }

  const fallback = [];
  const now = new Date();

  for (let index = 0; index < 4; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + index + 1);
    fallback.push({
      id: `fallback-${index}`,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      }),
      title: index === 0 ? "Review open actions" : "Member service block",
      route: "/meetings"
    });
  }

  return fallback;
}

function buildMissionStatHelpers(cityLabel = "Network") {
  return {
    meetings: `${cityLabel} operations in motion`,
    members: `${cityLabel} businesses in spotlight`,
    actions: `${cityLabel} relationship follow-up pending`,
    ai: `${cityLabel} communication assists`
  };
}

export function buildDashboardModel({
  role = "guest",
  tier = "Free",
  displayName = "",
  meetings = [],
  businesses = [],
  activity = [],
  analytics = {},
  showcaseCity = "All Showcase Cities",
  showcaseCityId = "all"
} = {}) {
  const meetingCount = meetings.length;
  const businessCount = businesses.length;
  const actionItemsOpen = Number(analytics.actionItemsOpen ?? 0);
  const aiInteractions = Number(analytics.aiInteractions ?? 0);
  const completionRate = Number(analytics.completionRate ?? 0);
  const showKiosk = tier === "Council" || tier === "Network";
  const showAnalytics = role === "secretary" || role === "admin";
  const personName = displayName || "there";
  const workspaceLanes = getWorkspaceLanes({ role, tier });
  const cityPlaybook = cityPlaybookMap[showcaseCityId] || cityPlaybookMap.all;
  const cityLabel =
    showcaseCityId === "all"
      ? "Network"
      : String(showcaseCity || "Chamber").split(",")[0].trim() || "Chamber";
  const missionStatHelpers = buildMissionStatHelpers(cityLabel);

  const quickActions = [
    {
      id: "create-meeting",
      label: "Run Operations Session",
      helper: "Capture decisions, assign actions, and publish updates",
      route: "/operations"
    },
    {
      id: "open-directory",
      label: "Open Businesses",
      helper: "Promote members, track reviews, and manage follow-up",
      route: "/business-hub"
    },
    {
      id: "run-engagement",
      label: "Run Engagement",
      helper: "Manage outreach queues, follow-ups, and response timing",
      route: "/engagement"
    },
    {
      id: "launch-campaign",
      label: "Launch Campaigns",
      helper: "Publish promotion waves for member businesses",
      route: "/campaigns"
    }
  ];

  if (showAnalytics) {
    quickActions.push({
      id: "review-analytics",
      label: "Review Growth Analytics",
      helper: "Visibility, engagement, and member-impact trends",
      route: "/analytics"
    });
  }

  const featureCards = [
    {
      id: "meetings",
      eyebrow: "Operations",
      title: "Governance and Communications",
      description: "Run meetings, approve updates, and keep public communication audit-ready.",
      route: "/meetings"
    },
    {
      id: "business-hub",
      eyebrow: "Business Growth",
      title: "Business Visibility Hub",
      description: "Grow member exposure through profiles, reviews, quotes, and relationship actions.",
      route: "/business-hub"
    },
    {
      id: "geo-intelligence",
      eyebrow: "Market Focus",
      title: "Coverage Intelligence",
      description: "Find where outreach, partnerships, and local customer communication need attention.",
      route: "/geo-intelligence"
    },
    showKiosk
      ? {
          id: "kiosk",
          eyebrow: "Engagement AI",
          title: "Concierge Kiosk",
          description: "Support members and visitors with AI-guided answers and governed context.",
          route: "/kiosk",
          accent: "ai"
        }
      : {
          id: "campaigns",
          eyebrow: "Growth Signals",
          title: "Campaign Pipeline",
          description: "Plan and execute member promotion campaigns across chamber channels.",
          route: "/campaigns"
        }
  ];

  return {
    welcome: {
      title: `Welcome back, ${personName}`,
      subtitle: cityPlaybook.summary,
      roleLabel: formatRole(role),
      tierLabel: tier,
      showcaseCity,
      showcaseCityId
    },
    cityFocus: cityPlaybook,
    stats: [
      {
        id: "meetings",
        label: "Operations",
        value: String(meetingCount),
        helper: missionStatHelpers.meetings,
        route: "/meetings"
      },
      {
        id: "members",
        label: "Businesses",
        value: String(businessCount),
        helper: missionStatHelpers.members,
        route: "/business-hub"
      },
      {
        id: "actions",
        label: "Relationship Actions",
        value: String(actionItemsOpen),
        helper: missionStatHelpers.actions,
        route: "/business-hub"
      },
      {
        id: "ai",
        label: "Communication Assists",
        value: String(aiInteractions),
        helper: missionStatHelpers.ai,
        route: "/analytics"
      }
    ],
    quickActions,
    featureCards,
    activityFeed: activity.length > 0 ? activity : createActivityFeed(meetings, businesses),
    workspaceLanes: workspaceLanes.map((lane) => ({
      ...lane,
      route: laneRouteMap[lane.id]?.route || "/dashboard",
      actionLabel: laneRouteMap[lane.id]?.actionLabel || "Open Lane"
    })),
    calendar: createCalendar(meetings),
    analyticsSummary: {
      completionRate,
      aiInteractions,
      actionItemsOpen
    },
    navigationLinks: cityPlaybook.navigationLinks,
    emptyState: {
      isVisible: meetingCount === 0 && businessCount === 0,
      title: "Start by activating your first business-growth workflow",
      description:
        "Run an operations session, connect member businesses, and begin chamber outreach to turn this dashboard into a live local-commerce command center."
    }
  };
}
