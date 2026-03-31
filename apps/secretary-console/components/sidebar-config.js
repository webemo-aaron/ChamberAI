const roleHierarchy = {
  guest: 0,
  viewer: 1,
  secretary: 2,
  admin: 3
};

const tierHierarchy = {
  Free: 0,
  Pro: 1,
  Council: 2,
  Network: 3
};

const navigationSections = [
  {
    id: "intelligence",
    label: "Overview",
    description: "Business visibility, relationship health, and local market signals.",
    items: [
      {
        id: "dashboard",
        icon: "◫",
        label: "Overview",
        route: "/dashboard",
        minRole: "guest",
        testId: "sidebar-link-dashboard",
        mobile: true
      },
      {
        id: "business-hub",
        icon: "🏢",
        label: "Businesses",
        route: "/business-hub",
        minRole: "guest",
        testId: "sidebar-link-business-hub",
        mobile: true
      },
      {
        id: "geo-intelligence",
        icon: "🗺",
        label: "Market Coverage",
        route: "/geo-intelligence",
        minRole: "guest",
        testId: "sidebar-link-geo-intelligence"
      },
      {
        id: "kiosk",
        icon: "🤖",
        label: "AI Engagement",
        route: "/kiosk",
        minRole: "secretary",
        minTier: "Council",
        testId: "sidebar-link-kiosk",
        badge: "Council+"
      }
    ]
  },
  {
    id: "operations",
    label: "Operations & Growth",
    description: "Campaign execution, communications, governance, and revenue controls.",
    items: [
      {
        id: "meetings",
        icon: "📋",
        label: "Operations",
        route: "/meetings",
        minRole: "guest",
        testId: "sidebar-link-meetings",
        mobile: true
      },
      {
        id: "engagement",
        icon: "💬",
        label: "Engagement",
        route: "/engagement",
        minRole: "guest",
        testId: "sidebar-link-engagement",
        mobile: true
      },
      {
        id: "campaigns",
        icon: "📣",
        label: "Campaigns",
        route: "/campaigns",
        minRole: "guest",
        testId: "sidebar-link-campaigns"
      },
      {
        id: "settings",
        icon: "⚙",
        label: "Communications",
        route: "/settings",
        minRole: "guest",
        testId: "sidebar-link-settings",
        mobile: true
      },
      {
        id: "analytics",
        icon: "📈",
        label: "Growth Analytics",
        route: "/analytics",
        minRole: "secretary",
        minTier: "Council",
        testId: "sidebar-link-analytics",
        badge: "Council+",
        mobile: true
      },
      {
        id: "billing",
        icon: "💳",
        label: "Billing",
        route: "/billing",
        minRole: "secretary",
        testId: "sidebar-link-billing",
        badge: "Paid"
      }
    ]
  },
  {
    id: "admin",
    label: "Admin",
    description: "Restricted control surfaces for platform administration.",
    items: [
      {
        id: "stripe-admin",
        icon: "🧾",
        label: "Stripe Admin",
        route: "/admin/stripe",
        minRole: "admin",
        testId: "sidebar-link-stripe-admin",
        badge: "Admin"
      },
      {
        id: "products-admin",
        icon: "🧰",
        label: "Products Admin",
        route: "/admin/products",
        minRole: "admin",
        testId: "sidebar-link-products-admin",
        badge: "Admin"
      }
    ]
  },
  {
    id: "account",
    label: "Account",
    description: "Identity, preferences, and session controls.",
    items: [
      {
        id: "profile",
        icon: "👤",
        label: "Profile",
        route: "/profile",
        minRole: "guest",
        testId: "sidebar-link-profile"
      },
      {
        id: "preferences",
        icon: "☰",
        label: "Preferences",
        route: "/preferences",
        minRole: "guest",
        testId: "sidebar-link-preferences"
      },
      {
        id: "logout",
        icon: "↗",
        label: "Logout",
        action: "logout",
        minRole: "guest",
        testId: "sidebar-link-logout",
        cssClass: "sidebar-link--logout"
      }
    ]
  }
];

function roleMeetsRequirement(userRole, minRole) {
  return (roleHierarchy[userRole] ?? -1) >= (roleHierarchy[minRole] ?? 0);
}

function tierMeetsRequirement(userTier, minTier) {
  return (tierHierarchy[userTier] ?? 0) >= (tierHierarchy[minTier] ?? 0);
}

function isItemVisible(item, role, tier) {
  if (!roleMeetsRequirement(role, item.minRole ?? "guest")) {
    return false;
  }

  if (item.minTier && !tierMeetsRequirement(tier, item.minTier)) {
    return false;
  }

  return true;
}

export function getNavigationSections({ role = "guest", tier = "Free" } = {}) {
  return navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isItemVisible(item, role, tier))
    }))
    .filter((section) => section.items.length > 0);
}

export function getMobileNavigationItems(context = {}) {
  const order = ["dashboard", "business-hub", "meetings", "engagement", "analytics", "settings"];

  return getNavigationSections(context)
    .flatMap((section) => section.items)
    .filter((item) => item.mobile)
    .sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id))
    .slice(0, 5);
}

export function getDefaultRouteForRole() {
  if (typeof localStorage !== "undefined") {
    const preferredRoute = localStorage.getItem("camPreferenceLanding");
    const allowedRoutes = new Set([
      "/dashboard",
      "/meetings",
      "/business-hub",
      "/engagement",
      "/campaigns",
      "/analytics",
      "/billing",
      "/settings"
    ]);

    if (allowedRoutes.has(preferredRoute)) {
      return preferredRoute;
    }
  }

  return "/dashboard";
}

export function getWorkspaceLanes(context = {}) {
  const allowedSections = ["intelligence", "operations", "admin"];

  return getNavigationSections(context)
    .filter((section) => allowedSections.includes(section.id))
    .map((section) => ({
      id: section.id,
      label: section.label,
      description: section.description,
      itemCount: section.items.length,
      highlights: section.items.slice(0, 3).map((item) => item.label)
    }));
}

export function getNavigationTitle(path = "/dashboard") {
  const normalizedPath = path.split("?")[0];

  for (const section of navigationSections) {
    for (const item of section.items) {
      if (item.route === normalizedPath) {
        return item.label;
      }
    }
  }

  if (normalizedPath.startsWith("/meetings/")) {
    return "Meeting Detail";
  }

  if (normalizedPath.startsWith("/business-hub/")) {
    return "Business Hub";
  }

  if (normalizedPath === "/admin/stripe") {
    return "Stripe Admin";
  }

  if (normalizedPath === "/admin/products") {
    return "Products Admin";
  }

  return "ChamberAI Console";
}
