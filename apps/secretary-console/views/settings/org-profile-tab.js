/**
 * Organization Profile tab for settings
 * Manages org branding, display name, and kiosk system prompt override
 */

export function buildOrgProfilePanel() {
  const panel = document.createElement("div");
  panel.id = "orgProfilePanel";
  panel.className = "settings-panel";
  panel.innerHTML = `
    <h3 class="settings-section-title">Organization Profile</h3>

    <div class="settings-field">
      <label class="settings-label" for="orgDisplayNameInput">Display Name</label>
      <input
        type="text"
        id="orgDisplayNameInput"
        name="branding.displayName"
        class="settings-input"
        placeholder="Your Chamber of Commerce"
      >
      <p class="settings-field-hint">The name displayed in the browser title and header</p>
    </div>

    <div class="settings-field">
      <label class="settings-label" for="orgLogoUrlInput">Logo URL</label>
      <input
        type="url"
        id="orgLogoUrlInput"
        name="branding.logoUrl"
        class="settings-input"
        placeholder="https://example.com/logo.png"
      >
      <p class="settings-field-hint">Direct URL to your organization's logo</p>
      <div id="logoPreview" class="logo-preview"></div>
    </div>

    <div class="settings-field">
      <label class="settings-label" for="orgKioskPromptInput">Kiosk System Prompt Override</label>
      <textarea
        id="orgKioskPromptInput"
        name="branding.kioskSystemPromptOverride"
        class="settings-textarea"
        rows="6"
        placeholder="Custom instructions for the AI when responding to questions..."
      ></textarea>
      <p class="settings-field-hint">Leave empty to use default system prompt. Include org-specific context or guidelines.</p>
    </div>

    <div class="settings-actions">
      <button type="button" id="orgProfileSaveBtn" class="settings-btn settings-btn--primary">
        Save Organization Profile
      </button>
      <span id="orgProfileStatus" class="settings-status"></span>
    </div>
  `;
  return panel;
}

export function initializeOrgProfile(config) {
  const branding = config?.branding ?? {};
  document.getElementById("orgDisplayNameInput").value = branding.displayName ?? "";
  document.getElementById("orgLogoUrlInput").value = branding.logoUrl ?? "";
  document.getElementById("orgKioskPromptInput").value = branding.kioskSystemPromptOverride ?? "";

  // Update logo preview
  updateLogoPreview(branding.logoUrl);
}

export function serializeOrgProfile() {
  const form = new FormData();
  form.append("displayName", document.getElementById("orgDisplayNameInput").value);
  form.append("logoUrl", document.getElementById("orgLogoUrlInput").value);
  form.append("kioskSystemPromptOverride", document.getElementById("orgKioskPromptInput").value);

  return {
    displayName: form.get("displayName"),
    logoUrl: form.get("logoUrl"),
    kioskSystemPromptOverride: form.get("kioskSystemPromptOverride")
  };
}

function updateLogoPreview(logoUrl) {
  const preview = document.getElementById("logoPreview");
  if (!logoUrl) {
    preview.innerHTML = "";
    return;
  }
  preview.innerHTML = `<img src="${logoUrl}" alt="Organization logo" class="logo-preview-img" onerror="this.parentElement.innerHTML='Failed to load image'">`;
}

export function setupOrgProfileHandlers(api, showToast) {
  const logoInput = document.getElementById("orgLogoUrlInput");
  const saveBtn = document.getElementById("orgProfileSaveBtn");
  const statusSpan = document.getElementById("orgProfileStatus");

  // Update logo preview on URL change
  logoInput?.addEventListener("change", (e) => {
    updateLogoPreview(e.target.value);
  });

  // Save handler
  saveBtn?.addEventListener("click", async () => {
    saveBtn.disabled = true;
    if (statusSpan) statusSpan.textContent = "Saving...";

    const profile = serializeOrgProfile();
    const result = await api.patch("/api/settings/org-profile", profile);

    saveBtn.disabled = false;
    if (result.success) {
      if (statusSpan) statusSpan.textContent = "Saved";
      showToast("Organization profile updated");
      // Update document title if displayName changed
      if (profile.displayName) {
        document.title = `${profile.displayName} — Chamber AI`;
      }
    } else {
      if (statusSpan) statusSpan.textContent = "Save failed";
      showToast("Failed to save organization profile");
    }
  });
}
