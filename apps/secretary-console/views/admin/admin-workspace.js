import { escapeHtml } from "../common/format.js";

export function renderAdminWorkspace(container, config) {
  container.innerHTML = `
    <div class="utility-page admin-workspace-page" role="main">
      <section class="panel utility-hero admin-workspace-hero">
        <span class="utility-eyebrow">${escapeHtml(config.eyebrow || "Admin")}</span>
        <h1>${escapeHtml(config.title)}</h1>
        <p>${escapeHtml(config.description)}</p>
      </section>

      ${
        config.notice
          ? `
            <section class="panel utility-notice utility-notice--${escapeHtml(config.notice.tone || "info")}" role="status" aria-live="polite">
              <strong>${escapeHtml(config.notice.title)}</strong>
              <p>${escapeHtml(config.notice.message)}</p>
            </section>
          `
          : ""
      }

      <section class="admin-workspace-grid">
        <article class="panel admin-workspace-card">
          <div class="admin-workspace-card-head">
            <div>
              <span class="admin-workspace-card-eyebrow">Embedded Control Surface</span>
              <h2>${escapeHtml(config.frameTitle)}</h2>
            </div>
            <div class="admin-workspace-actions">
              <a class="utility-action utility-action-link" href="${escapeHtml(config.src)}" target="_blank" rel="noreferrer">Open Full Page</a>
            </div>
          </div>
          <div class="admin-workspace-frame-shell">
            <iframe
              class="admin-workspace-frame"
              src="${escapeHtml(config.src)}"
              title="${escapeHtml(config.frameTitle)}"
              loading="lazy"
              referrerpolicy="no-referrer"
            ></iframe>
          </div>
        </article>

        <aside class="panel admin-workspace-sidecar">
          <h2>${escapeHtml(config.sidecarTitle)}</h2>
          <p>${escapeHtml(config.sidecarDescription)}</p>
          <ul class="utility-list">
            ${config.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </aside>
      </section>
    </div>
  `;
}
