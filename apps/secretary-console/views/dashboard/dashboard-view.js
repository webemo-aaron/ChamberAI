import { request } from "../../core/api.js";
import { getCurrentRole, getCurrentUser } from "../../core/auth.js";
import { getEffectiveTier, setStoredTier } from "../../billing.js";
import { navigate } from "../../core/router.js";
import { buildDashboardModel } from "./dashboard-model.js";
import {
  buildShowcaseCityOptions,
  filterBusinessesByShowcaseCity,
  filterMeetingsByShowcaseCity,
  getSelectedShowcaseCity,
  setSelectedShowcaseCity
} from "../common/showcase-city-context.js";

function normalizeListResponse(response) {
  if (!response || response.error) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
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
    completionRate: Number(response.completion_rate ?? response.completionRate ?? 0),
    aiInteractions: Number(response.ai_interactions ?? response.aiInteractions ?? 0),
    actionItemsOpen: Number(response.open_action_items ?? response.actionItemsOpen ?? 0)
  };
}

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

function renderStatCards(model) {
  return model.stats
    .map(
      (stat) => `
        <button type="button" class="dashboard-stat-card dashboard-click-card" data-route="${stat.route}">
          <span class="dashboard-stat-label">${stat.label}</span>
          <strong class="dashboard-stat-value">${stat.value}</strong>
          <span class="dashboard-stat-helper">${stat.helper}</span>
        </button>
      `
    )
    .join("");
}

function renderWorkspaceLanes(model) {
  return model.workspaceLanes
    .map(
      (lane) => `
        <button type="button" class="dashboard-lane-card dashboard-click-card" data-route="${lane.route}">
          <div class="dashboard-lane-header">
            <span class="dashboard-lane-label">${lane.label}</span>
            <span class="dashboard-lane-count">${lane.itemCount} surfaces</span>
          </div>
          <p>${lane.description}</p>
          <span class="dashboard-lane-highlights">${lane.highlights.join(" • ")}</span>
          <span class="dashboard-card-cta">${lane.actionLabel}</span>
        </button>
      `
    )
    .join("");
}

function renderQuickActions(model) {
  return model.quickActions
    .map(
      (action) => `
        <button class="dashboard-action" data-route="${action.route}">
          <span class="dashboard-action-label">${action.label}</span>
          <span class="dashboard-action-helper">${action.helper}</span>
        </button>
      `
    )
    .join("");
}

function renderFeatureCards(model) {
  return model.featureCards
    .map(
      (card) => `
        <button type="button" class="dashboard-feature-card dashboard-click-card${card.accent ? ` dashboard-feature-card--${card.accent}` : ""}" data-route="${card.route}">
          <span class="dashboard-feature-eyebrow">${card.eyebrow}</span>
          <h3>${card.title}</h3>
          <p>${card.description}</p>
          <div class="dashboard-feature-actions">
            <span class="dashboard-feature-open">Open</span>
          </div>
        </button>
      `
    )
    .join("");
}

function renderActivity(model) {
  if (model.activityFeed.length === 0) {
    return '<div class="dashboard-empty-inline">No recent activity yet.</div>';
  }

  return model.activityFeed
    .map(
      (item) => `
        <button class="dashboard-activity-item" data-route="${item.route}">
          <span class="dashboard-activity-icon">${item.icon}</span>
          <span class="dashboard-activity-copy">
            <strong>${item.title}</strong>
            <span>${item.meta}</span>
          </span>
        </button>
      `
    )
    .join("");
}

function renderCalendar(model) {
  return model.calendar
    .map(
      (item) => `
        <button type="button" class="dashboard-calendar-item dashboard-click-card" data-route="${item.route}">
          <span class="dashboard-calendar-date">${item.label}</span>
          <span class="dashboard-calendar-title">${item.title}</span>
          <span class="dashboard-card-cta">Open Meeting</span>
        </button>
      `
    )
    .join("");
}

function renderDashboard(container, model, render) {
  container.innerHTML = `
    <div class="dashboard-page" role="main">
      <section class="dashboard-hero panel">
        <div class="dashboard-hero-copy">
          <span class="dashboard-eyebrow">ChamberAI Workspace</span>
          <h1>${model.welcome.title}</h1>
          <p>${model.welcome.subtitle}</p>
          <div class="dashboard-city-control">
            <label for="dashboardShowcaseCity">Showcase City</label>
            <select id="dashboardShowcaseCity" class="dashboard-city-select">
              ${buildShowcaseCityOptions(model.welcome.showcaseCityId)}
            </select>
            <div class="dashboard-city-status" aria-live="polite">
              <strong>${model.cityFocus.kicker}</strong>
              <span>${model.cityFocus.summary}</span>
            </div>
            <div class="dashboard-city-actions">
              <button type="button" class="dashboard-section-link" data-route="${model.cityFocus.primaryCta.route}">
                ${model.cityFocus.primaryCta.label}
              </button>
              <button type="button" class="dashboard-section-link dashboard-section-link--secondary" data-route="${model.cityFocus.secondaryCta.route}">
                ${model.cityFocus.secondaryCta.label}
              </button>
            </div>
          </div>
        </div>
        <div class="dashboard-hero-meta">
          <span class="dashboard-role-pill">${model.welcome.roleLabel}</span>
          <span class="dashboard-tier-pill">${model.welcome.tierLabel}</span>
          <span class="dashboard-city-pill">${model.welcome.showcaseCity}</span>
        </div>
      </section>

      <section class="dashboard-lanes panel">
        <div class="dashboard-section-head dashboard-section-head--actionable">
          <div>
            <h2>Workspace Lanes</h2>
            <p>The same semantic structure used in the sidebar, summarized for fast orientation.</p>
          </div>
          <button type="button" class="dashboard-section-link" data-route="/dashboard">Refresh Dashboard</button>
        </div>
        <div class="dashboard-lanes-grid">
          ${renderWorkspaceLanes(model)}
        </div>
      </section>

      <section class="dashboard-stats-grid">
        ${renderStatCards(model)}
      </section>

      <section class="dashboard-main-grid">
        <div class="dashboard-column dashboard-column--primary">
          <section class="panel dashboard-section">
            <div class="dashboard-section-head dashboard-section-head--actionable">
              <div>
                <h2>Quick Actions</h2>
                <p>Common operational moves for this role.</p>
              </div>
              <button type="button" class="dashboard-section-link" data-route="${model.navigationLinks.quickActions.route}">${model.navigationLinks.quickActions.label}</button>
            </div>
            <div class="dashboard-actions-grid">
              ${renderQuickActions(model)}
            </div>
          </section>

          <section class="panel dashboard-section">
            <div class="dashboard-section-head dashboard-section-head--actionable">
              <div>
                <h2>Intelligence Surfaces</h2>
                <p>Navigate directly into the chamber work that matters this week.</p>
              </div>
              <button type="button" class="dashboard-section-link" data-route="${model.navigationLinks.feature.route}">${model.navigationLinks.feature.label}</button>
            </div>
            <div class="dashboard-feature-grid">
              ${renderFeatureCards(model)}
            </div>
          </section>

          <section class="panel dashboard-section">
            <div class="dashboard-section-head dashboard-section-head--actionable">
              <div>
                <h2>Recent Activity</h2>
                <p>Last operational events across meetings and member support.</p>
              </div>
              <button type="button" class="dashboard-section-link" data-route="${model.navigationLinks.activity.route}">${model.navigationLinks.activity.label}</button>
            </div>
            <div class="dashboard-activity-list">
              ${renderActivity(model)}
            </div>
          </section>
        </div>

        <div class="dashboard-column dashboard-column--secondary">
          <section class="panel dashboard-section">
            <div class="dashboard-section-head dashboard-section-head--actionable">
              <div>
                <h2>Calendar</h2>
                <p>Upcoming checkpoints and review windows.</p>
              </div>
              <button type="button" class="dashboard-section-link" data-route="${model.navigationLinks.calendar.route}">${model.navigationLinks.calendar.label}</button>
            </div>
            <div class="dashboard-calendar-list">
              ${renderCalendar(model)}
            </div>
          </section>

          <section class="panel dashboard-section">
            <div class="dashboard-section-head">
              <h2>Analytics Summary</h2>
              <p>Operational health at a glance.</p>
            </div>
            <div class="dashboard-analytics-summary">
              <div class="dashboard-analytics-metric">
                <span>Completion Rate</span>
                <strong>${model.analyticsSummary.completionRate}%</strong>
              </div>
              <div class="dashboard-analytics-metric">
                <span>AI Interactions</span>
                <strong>${model.analyticsSummary.aiInteractions}</strong>
              </div>
              <div class="dashboard-analytics-metric">
                <span>Open Actions</span>
                <strong>${model.analyticsSummary.actionItemsOpen}</strong>
              </div>
            </div>
          </section>

          ${
            model.emptyState.isVisible
              ? `
                <section class="panel dashboard-empty-state">
                  <h2>${model.emptyState.title}</h2>
                  <p>${model.emptyState.description}</p>
                  <button class="dashboard-empty-cta" data-route="/meetings">Create First Meeting</button>
                </section>
              `
              : ""
          }
        </div>
      </section>
    </div>
  `;

  container.querySelectorAll("[data-route]").forEach((element) => {
    element.addEventListener("click", () => {
      navigate(element.dataset.route);
    });
  });

  container.querySelector("#dashboardShowcaseCity")?.addEventListener("change", (event) => {
    setSelectedShowcaseCity(event.target.value);
    render(); // Call the render function, not dashboardHandler()
  });
}

export async function dashboardHandler(params, context) {
  const container = document.getElementById("dashboardView");
  if (!container) {
    return;
  }

  const role = getCurrentRole();
  if (!role) {
    navigate("/login");
    return;
  }

  context?.onCleanup?.(() => {
    // No-op: DOM is managed by view system
  });

  async function render() {
    const user = getCurrentUser();

    const billingResponse = await request("/billing/status", "GET", null, {
      suppressAlert: true
    });
    if (billingResponse && !billingResponse.error && billingResponse.tier) {
      setStoredTier(billingResponse.tier);
    }
    const tier = normalizeTier(billingResponse);

    const [meetingsResponse, businessResponse, analyticsResponse] = await Promise.all([
      request("/meetings", "GET", null, { suppressAlert: true }),
      request("/business-listings", "GET", null, { suppressAlert: true }),
      canAccessAnalyticsTier(tier)
        ? request("/analytics/board", "GET", null, { suppressAlert: true })
        : Promise.resolve({ skipped: true })
    ]);

    const meetings = normalizeListResponse(meetingsResponse);
    const businesses = normalizeListResponse(businessResponse);
    const analytics = normalizeAnalytics(analyticsResponse);
    const selectedCity = getSelectedShowcaseCity();

    const model = buildDashboardModel({
      role,
      tier,
      displayName: user.displayName || user.email?.split("@")[0] || "",
      meetings: filterMeetingsByShowcaseCity(meetings, selectedCity),
      businesses: filterBusinessesByShowcaseCity(businesses, selectedCity),
      analytics,
      showcaseCity: selectedCity.label,
      showcaseCityId: selectedCity.id
    });

    renderDashboard(container, model, render);
  }

  await render();
}
