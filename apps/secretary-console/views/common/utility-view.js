import { navigate } from "../../core/router.js";

export function renderUtilityView(container, config) {
  container.innerHTML = `
    <div class="utility-page" role="main">
      <section class="panel utility-hero">
        <span class="utility-eyebrow">${config.eyebrow}</span>
        <h1>${config.title}</h1>
        <p>${config.description}</p>
      </section>

      ${
        config.notice
          ? `
            <section class="panel utility-notice utility-notice--${config.notice.tone || "info"}" role="status" aria-live="polite">
              <strong>${config.notice.title}</strong>
              <p>${config.notice.message}</p>
            </section>
          `
          : ""
      }

      ${
        config.spotlight
          ? `
            <section class="panel utility-spotlight">
              <div class="utility-spotlight-copy">
                <span class="utility-spotlight-eyebrow">Workspace Snapshot</span>
                <h2>${config.spotlight.title}</h2>
                <p>${config.spotlight.description}</p>
              </div>
              ${
                config.spotlight.pills?.length
                  ? `
                    <div class="utility-pill-row">
                      ${config.spotlight.pills
                        .map((pill) => `<span class="utility-pill">${pill}</span>`)
                        .join("")}
                    </div>
                  `
                  : ""
              }
            </section>
          `
          : ""
      }

      <section class="utility-grid">
        ${config.cards
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
                ${
                  card.actions
                    ? `
                      <div class="utility-action-row">
                        ${card.actions
                          .map((action) => {
                            if (action.external) {
                              return `<a class="utility-action utility-action-link" href="${action.href}" target="_blank" rel="noreferrer">${action.label}</a>`;
                            }

                            if (action.action) {
                              const valueAttr = action.value
                                ? ` data-action-value="${action.value}"`
                                : "";
                              const disabledAttr = action.disabled ? " disabled" : "";
                              return `<button class="utility-action" data-action="${action.action}"${valueAttr}${disabledAttr}>${action.label}</button>`;
                            }

                            const disabledAttr = action.disabled ? " disabled" : "";
                            return `<button class="utility-action" data-route="${action.route}"${disabledAttr}>${action.label}</button>`;
                          })
                          .join("")}
                      </div>
                    `
                    : ""
                }
                ${
                  card.route
                    ? `<button class="utility-action" data-route="${card.route}">${card.actionLabel || "Open"}</button>`
                    : ""
                }
              </article>
            `
          )
          .join("")}
      </section>
    </div>
  `;

  container.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(button.dataset.route);
    });
  });

  if (typeof config.onAction === "function") {
    container.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        config.onAction(button.dataset.action, button.dataset.actionValue || "");
      });
    });
  }
}
