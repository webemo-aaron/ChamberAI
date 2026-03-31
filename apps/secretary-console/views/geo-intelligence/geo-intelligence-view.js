import { request } from "../../core/api.js";
import { getCurrentRole } from "../../core/auth.js";
import { getEffectiveTier } from "../../billing.js";
import { navigate } from "../../core/router.js";
import { buildShowcaseCityOptions, getSelectedShowcaseCity, setSelectedShowcaseCity } from "../common/showcase-city-context.js";
import { buildGeoInputContext } from "./geo-intelligence-context.js";
import { buildGeoIntelligenceModel, normalizeGeoCollection } from "./geo-intelligence-model.js";

function buildGeoRequestPath(basePath, selectedCity) {
  if (!selectedCity || selectedCity.id === "all") {
    return basePath;
  }

  const params = new URLSearchParams({
    scopeType: selectedCity.scopeType,
    scopeId: selectedCity.scopeId
  });
  return `${basePath}?${params.toString()}`;
}

function renderGeoWorkspace(container, model) {
  container.innerHTML = `
    <div class="utility-page geo-workspace" role="main">
      <section class="panel utility-hero">
        <span class="utility-eyebrow">${model.eyebrow}</span>
        <h1>${model.title}</h1>
        <p>${model.description}</p>
      </section>

      ${
        model.notice
          ? `
            <section class="panel utility-notice utility-notice--${model.notice.tone || "info"}" role="status" aria-live="polite">
              <strong>${model.notice.title}</strong>
              <p>${model.notice.message}</p>
            </section>
          `
          : ""
      }

      <section class="panel utility-spotlight">
        <div class="utility-spotlight-copy">
          <span class="utility-spotlight-eyebrow">Territory Focus</span>
          <h2>${model.spotlight.title}</h2>
          <p>${model.spotlight.description}</p>
        </div>
        <div class="geo-workspace-meta">
          <div class="utility-pill-row">
            ${model.spotlight.pills.map((pill) => `<span class="utility-pill">${pill}</span>`).join("")}
          </div>
          <div class="geo-workspace-controls">
            <label class="utility-form-group">
              <span>Showcase City</span>
              <select id="geoWorkspaceScope" class="utility-form-input">
                ${buildShowcaseCityOptions(model.scope.id)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section class="utility-grid">
        ${model.cards
          .map(
            (card) => `
              <article class="panel utility-card">
                <h2>${card.title}</h2>
                <p>${card.description}</p>
                ${
                  card.metrics
                    ? `
                      <div class="utility-metric-row">
                        ${card.metrics
                          .map(
                            (metric) => `
                              <div class="utility-metric">
                                <span>${metric.label}</span>
                                <strong>${metric.value}</strong>
                              </div>
                            `
                          )
                          .join("")}
                      </div>
                    `
                    : ""
                }
                ${
                  card.list
                    ? `
                      <ul class="utility-list">
                        ${card.list.map((item) => `<li>${item}</li>`).join("")}
                      </ul>
                    `
                    : ""
                }
                ${card.detail ? `<div class="geo-workspace-card-detail">${card.detail}</div>` : ""}
                ${
                  card.actions
                    ? `
                      <div class="utility-action-row">
                        ${card.actions
                          .map((action) => {
                            if (action.route) {
                              return `<button class="utility-action" data-route="${action.route}"${action.disabled ? " disabled" : ""}>${action.label}</button>`;
                            }

                            return `<button class="utility-action" data-action="${action.action}"${action.disabled ? " disabled" : ""}>${action.label}</button>`;
                          })
                          .join("")}
                      </div>
                    `
                    : ""
                }
              </article>
            `
          )
          .join("")}
      </section>
    </div>
  `;
}

export async function geoIntelligenceHandler() {
  const container = document.getElementById("utilityView");
  if (!container) {
    return;
  }

  const context = {
    role: getCurrentRole() || "guest",
    tier: getEffectiveTier()
  };
  let selectedCity = getSelectedShowcaseCity();
  let uiState = {
    pendingAction: "",
    notice: {
      tone: "info",
      title: "Loading Geo Intelligence",
      message: "Pulling territory profiles and content briefs for the current chamber workspace."
    }
  };
  let profiles = [];
  let briefs = [];
  let meetings = [];
  let businesses = [];
  let inputContext = buildGeoInputContext({ selectedCity, businesses, meetings });

  const render = () => {
    const model = buildGeoIntelligenceModel({
      selectedCity,
      profiles,
      briefs,
      inputContext,
      uiState,
      context
    });
    renderGeoWorkspace(container, model);

    container.querySelector("#geoWorkspaceScope")?.addEventListener("change", async (event) => {
      selectedCity = setSelectedShowcaseCity(event.target.value);
      uiState = {
        pendingAction: "",
        notice: {
          tone: "info",
          title: "Switching Territory",
          message: `Loading Geo Intelligence for ${selectedCity.label}.`
        }
      };
      render();
      await loadGeoWorkspace();
    });

    container.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const action = button.dataset.action;
        if (!action) {
          return;
        }
        await runGeoAction(action);
      });
    });

    container.querySelectorAll("[data-route]").forEach((button) => {
      button.addEventListener("click", () => {
        navigate(button.dataset.route);
      });
    });
  };

  async function loadGeoWorkspace() {
    const [profilesResponse, briefsResponse, meetingsResponse, businessesResponse] = await Promise.all([
      request(buildGeoRequestPath("/geo-profiles", selectedCity), "GET", null, { suppressAlert: true }),
      request(buildGeoRequestPath("/geo-content-briefs", selectedCity), "GET", null, { suppressAlert: true }),
      request("/meetings", "GET", null, { suppressAlert: true }),
      request("/business-listings", "GET", null, { suppressAlert: true })
    ]);

    profiles = normalizeGeoCollection(profilesResponse);
    briefs = normalizeGeoCollection(briefsResponse);
    meetings = normalizeGeoCollection(meetingsResponse);
    businesses = normalizeGeoCollection(businessesResponse);
    inputContext = buildGeoInputContext({
      selectedCity,
      businesses,
      meetings
    });

    if (
      (profilesResponse && profilesResponse.error) ||
      (briefsResponse && briefsResponse.error) ||
      (meetingsResponse && meetingsResponse.error) ||
      (businessesResponse && businessesResponse.error)
    ) {
      uiState = {
        pendingAction: "",
        notice: {
          tone: "warning",
          title: "Geo Intelligence Unavailable",
          message: "The geo services could not be reached. Verify the API base or backend readiness, then refresh."
        }
      };
      render();
      return;
    }

    uiState = {
      pendingAction: "",
      notice: uiState.notice?.title === "Switching Territory"
        ? {
            tone: "success",
            title: "Territory Loaded",
            message: `Geo Intelligence is ready for ${selectedCity.label}.`
          }
        : null
    };
    render();
  }

  async function runGeoAction(action) {
    if (!selectedCity || selectedCity.id === "all") {
      return;
    }

    uiState = {
      pendingAction: action,
      notice: {
        tone: "info",
        title: action === "refresh-profile" ? "Refreshing Territory Profile" : "Generating Geo Brief",
        message:
          action === "refresh-profile"
            ? `Updating live chamber signals for ${selectedCity.label}.`
            : `Drafting outreach and opportunity guidance for ${selectedCity.label}.`
      }
    };
    render();

    const payload = {
      scopeType: selectedCity.scopeType,
      scopeId: selectedCity.scopeId,
      scopeLabel: selectedCity.label,
      existingDetails: inputContext.existingDetails
    };
    const response =
      action === "refresh-profile"
        ? await request("/geo-profiles/scan", "POST", payload, { suppressAlert: true })
        : await request("/geo-content-briefs/generate", "POST", payload, { suppressAlert: true });

    if (!response || response.error) {
      uiState = {
        pendingAction: "",
        notice: {
          tone: "warning",
          title: action === "refresh-profile" ? "Profile Refresh Unavailable" : "Brief Generation Unavailable",
          message: `Geo Intelligence could not complete the ${action === "refresh-profile" ? "profile refresh" : "brief generation"} for ${selectedCity.label}.`
        }
      };
      render();
      return;
    }

    uiState = {
      pendingAction: "",
      notice: {
        tone: "success",
        title: action === "refresh-profile" ? "Territory Profile Updated" : "Geo Brief Ready",
        message:
          action === "refresh-profile"
            ? `${selectedCity.label} now reflects the latest chamber territory signals.`
            : `${selectedCity.label} now has an updated outreach-ready geo brief.`
      }
    };
    await loadGeoWorkspace();
  }

  render();
  await loadGeoWorkspace();
}
