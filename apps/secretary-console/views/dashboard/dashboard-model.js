import { getWorkspaceLanes } from "../../components/sidebar-config.js";

const laneRouteMap = {
  intelligence: {
    route: "/meetings",
    actionLabel: "Open Intelligence"
  },
  operations: {
    route: "/analytics",
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
    primaryCta: { label: "Open Meetings Workspace", route: "/meetings" },
    secondaryCta: { label: "Review Business Hub", route: "/business-hub" },
    statHelpers: {
      meetings: "Tracked sessions",
      members: "Businesses in view",
      actions: "Pending follow-through",
      ai: "Recent guided assists"
    },
    navigationLinks: {
      quickActions: { label: "View Meetings", route: "/meetings" },
      feature: { label: "Open Business Hub", route: "/business-hub" },
      activity: { label: "View All Activity", route: "/meetings" },
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

  const quickActions = [
    {
      id: "create-meeting",
      label: "Create Meeting",
      helper: "Draft agenda, record, and publish",
      route: "/meetings"
    },
    {
      id: "open-directory",
      label: "Open Directory",
      helper: "Review members and local businesses",
      route: "/business-hub"
    },
    {
      id: "go-settings",
      label: "Tune Settings",
      helper: "Flags, retention, and integrations",
      route: "/settings"
    }
  ];

  if (showAnalytics) {
    quickActions.push({
      id: "review-analytics",
      label: "Review Analytics",
      helper: "Board health and completion trends",
      route: "/analytics"
    });
  }

  const featureCards = [
    {
      id: "meetings",
      eyebrow: "Core Workflow",
      title: "Meetings Intelligence",
      description: "Minutes, motions, approvals, and audit history in one operating surface.",
      route: "/meetings"
    },
    {
      id: "business-hub",
      eyebrow: "Member Service",
      title: "Business Hub",
      description: "Directory records, reviews, quotes, and chamber follow-up.",
      route: "/business-hub"
    },
    {
      id: "geo-intelligence",
      eyebrow: "Coverage",
      title: "Geo Intelligence",
      description: "See where chamber activity is strong, thin, or ready for intervention.",
      route: "/geo-intelligence"
    },
    showKiosk
      ? {
          id: "kiosk",
          eyebrow: "Premium AI",
          title: "AI Kiosk",
          description: "Private and public chamber copilots with governed context windows.",
          route: "/kiosk",
          accent: "ai"
        }
      : {
          id: "analytics",
          eyebrow: "Operations",
          title: "Analytics",
          description: "Track completion, engagement, and board effectiveness over time.",
          route: "/analytics"
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
        label: "Meetings",
        value: String(meetingCount),
        helper: cityPlaybook.statHelpers.meetings,
        route: "/meetings"
      },
      {
        id: "members",
        label: "Directory",
        value: String(businessCount),
        helper: cityPlaybook.statHelpers.members,
        route: "/business-hub"
      },
      {
        id: "actions",
        label: "Open Actions",
        value: String(actionItemsOpen),
        helper: cityPlaybook.statHelpers.actions,
        route: "/meetings"
      },
      {
        id: "ai",
        label: "AI Interactions",
        value: String(aiInteractions),
        helper: cityPlaybook.statHelpers.ai,
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
      title: "Start by creating your first operating surface",
      description:
        "Seed a meeting, connect the business directory, or enable analytics to turn the dashboard into a live chamber cockpit."
    }
  };
}
