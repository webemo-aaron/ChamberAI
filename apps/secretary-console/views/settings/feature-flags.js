/**
 * Feature Flags Settings Tab
 *
 * Allows administrators to enable/disable features:
 * - Advanced search
 * - Audio processing
 * - Real-time collaboration
 * - Export formats (DOCX, Excel)
 * - Analytics dashboard
 * - Governance reports
 */

/**
 * Render the feature flags tab content
 * Creates a grid of feature toggle switches
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} settings - Current settings from API
 */
export function renderFeatureFlags(container, settings = {}) {
  // Clear container
  container.innerHTML = "";

  // Create form section
  const form = document.createElement("form");
  form.className = "settings-form";

  // Form title
  const title = document.createElement("h2");
  title.className = "settings-form-title";
  title.textContent = "Feature Flags";

  const subtitle = document.createElement("p");
  subtitle.className = "settings-form-subtitle";
  subtitle.textContent = "Enable or disable features for your organization";

  form.appendChild(title);
  form.appendChild(subtitle);

  // Feature definitions
  const features = [
    {
      id: "advancedSearch",
      label: "Advanced Search",
      description: "Full-text search across all meetings and minutes",
      default: true
    },
    {
      id: "audioProcessing",
      label: "Audio Processing",
      description: "Upload and process meeting audio files",
      default: false
    },
    {
      id: "realTimeCollab",
      label: "Real-Time Collaboration",
      description: "Collaborative minutes editing with multiple users",
      default: true
    },
    {
      id: "docxExport",
      label: "DOCX Export",
      description: "Export minutes as Word documents",
      default: false
    },
    {
      id: "excelExport",
      label: "Excel Export",
      description: "Export action items and motions as spreadsheets",
      default: false
    },
    {
      id: "analyticsBoard",
      label: "Analytics Dashboard",
      description: "Board effectiveness metrics and reporting",
      default: false
    },
    {
      id: "governanceReport",
      label: "Governance Report",
      description: "Automated governance compliance reporting",
      default: false
    },
    {
      id: "apiAccess",
      label: "API Access",
      description: "Enable REST API for third-party integrations",
      default: false
    }
  ];

  // Create feature flags grid
  const flagsGrid = document.createElement("div");
  flagsGrid.className = "feature-flags-grid";

  features.forEach((feature) => {
    // Get value from settings or use default
    const isEnabled = settings[feature.id] !== undefined ? settings[feature.id] : feature.default;

    // Create flag item
    const flagItem = document.createElement("div");
    flagItem.className = "feature-flag-item";

    // Checkbox wrapper
    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.className = "feature-flag-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = feature.id;
    checkbox.checked = isEnabled;

    const label = document.createElement("label");
    label.htmlFor = feature.id;
    label.className = "feature-flag-label";

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);

    // Feature details
    const details = document.createElement("div");
    details.className = "feature-flag-details";

    const featureTitle = document.createElement("h3");
    featureTitle.className = "feature-flag-title";
    featureTitle.textContent = feature.label;

    const featureDesc = document.createElement("p");
    featureDesc.className = "feature-flag-description";
    featureDesc.textContent = feature.description;

    details.appendChild(featureTitle);
    details.appendChild(featureDesc);

    // Status indicator
    const statusBadge = document.createElement("div");
    statusBadge.className = `feature-flag-status ${isEnabled ? "enabled" : "disabled"}`;
    statusBadge.textContent = isEnabled ? "Enabled" : "Disabled";

    // Add change listener to update badge
    checkbox.addEventListener("change", () => {
      statusBadge.textContent = checkbox.checked ? "Enabled" : "Disabled";
      statusBadge.className = `feature-flag-status ${checkbox.checked ? "enabled" : "disabled"}`;
    });

    // Assemble flag item
    flagItem.appendChild(checkboxWrapper);
    flagItem.appendChild(details);
    flagItem.appendChild(statusBadge);

    flagsGrid.appendChild(flagItem);
  });

  form.appendChild(flagsGrid);

  // Info box
  const infoBox = document.createElement("div");
  infoBox.className = "settings-info-box";

  const infoTitle = document.createElement("p");
  infoTitle.className = "settings-info-title";
  infoTitle.textContent = "About Feature Flags";

  const infoText = document.createElement("p");
  infoText.className = "settings-info-text";
  infoText.textContent = "Feature flags control which capabilities are available to your users. Enabling a feature makes it accessible through the web interface and API.";

  infoBox.appendChild(infoTitle);
  infoBox.appendChild(infoText);

  form.appendChild(infoBox);

  container.appendChild(form);
}
