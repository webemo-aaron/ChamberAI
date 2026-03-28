/**
 * Retention & Limits Settings Tab
 *
 * Configure:
 * - Data retention period
 * - Maximum file size limits
 * - Maximum meeting duration
 * - Soft delete grace period
 */

/**
 * Render the retention & limits tab content
 * Creates form fields for data retention policies
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} settings - Current settings from API
 */
export function renderRetentionTab(container, settings = {}) {
  // Clear container
  container.innerHTML = "";

  // Create form section
  const form = document.createElement("form");
  form.className = "settings-form";

  // Form title
  const title = document.createElement("h2");
  title.className = "settings-form-title";
  title.textContent = "Retention & Limits";

  const subtitle = document.createElement("p");
  subtitle.className = "settings-form-subtitle";
  subtitle.textContent = "Configure data retention policies and resource limits";

  form.appendChild(title);
  form.appendChild(subtitle);

  // Create form grid
  const formGrid = document.createElement("div");
  formGrid.className = "settings-form-grid";

  // Retention period
  const retentionGroup = document.createElement("div");
  retentionGroup.className = "form-group";

  const retentionLabel = document.createElement("label");
  retentionLabel.htmlFor = "settingRetention";
  retentionLabel.textContent = "Retention Period (months)";

  const retentionInput = document.createElement("input");
  retentionInput.type = "number";
  retentionInput.id = "settingRetention";
  retentionInput.min = "1";
  retentionInput.max = "120";
  retentionInput.value = settings.settingRetention || 36;
  retentionInput.placeholder = "36";

  const retentionHint = document.createElement("p");
  retentionHint.className = "form-hint";
  retentionHint.textContent = "How long to keep archived meetings (1-120 months)";

  retentionGroup.appendChild(retentionLabel);
  retentionGroup.appendChild(retentionInput);
  retentionGroup.appendChild(retentionHint);

  // Max file size
  const maxSizeGroup = document.createElement("div");
  maxSizeGroup.className = "form-group";

  const maxSizeLabel = document.createElement("label");
  maxSizeLabel.htmlFor = "settingMaxSize";
  maxSizeLabel.textContent = "Max File Size (MB)";

  const maxSizeInput = document.createElement("input");
  maxSizeInput.type = "number";
  maxSizeInput.id = "settingMaxSize";
  maxSizeInput.min = "1";
  maxSizeInput.max = "5000";
  maxSizeInput.value = settings.settingMaxSize || 100;
  maxSizeInput.placeholder = "100";

  const maxSizeHint = document.createElement("p");
  maxSizeHint.className = "form-hint";
  maxSizeHint.textContent = "Maximum file upload size (1-5000 MB)";

  maxSizeGroup.appendChild(maxSizeLabel);
  maxSizeGroup.appendChild(maxSizeInput);
  maxSizeGroup.appendChild(maxSizeHint);

  // Max meeting duration
  const maxDurationGroup = document.createElement("div");
  maxDurationGroup.className = "form-group";

  const maxDurationLabel = document.createElement("label");
  maxDurationLabel.htmlFor = "settingMaxDuration";
  maxDurationLabel.textContent = "Max Meeting Duration (hours)";

  const maxDurationInput = document.createElement("input");
  maxDurationInput.type = "number";
  maxDurationInput.id = "settingMaxDuration";
  maxDurationInput.min = "1";
  maxDurationInput.max = "24";
  maxDurationInput.value = settings.settingMaxDuration || 12;
  maxDurationInput.placeholder = "12";

  const maxDurationHint = document.createElement("p");
  maxDurationHint.className = "form-hint";
  maxDurationHint.textContent = "Maximum duration for a single meeting (1-24 hours)";

  maxDurationGroup.appendChild(maxDurationLabel);
  maxDurationGroup.appendChild(maxDurationInput);
  maxDurationGroup.appendChild(maxDurationHint);

  // Soft delete grace period
  const graceGroup = document.createElement("div");
  graceGroup.className = "form-group";

  const graceLabel = document.createElement("label");
  graceLabel.htmlFor = "settingGracePeriod";
  graceLabel.textContent = "Soft Delete Grace Period (days)";

  const graceInput = document.createElement("input");
  graceInput.type = "number";
  graceInput.id = "settingGracePeriod";
  graceInput.min = "1";
  graceInput.max = "90";
  graceInput.value = settings.settingGracePeriod || 30;
  graceInput.placeholder = "30";

  const graceHint = document.createElement("p");
  graceHint.className = "form-hint";
  graceHint.textContent = "Days to keep deleted data before permanent removal (1-90 days)";

  graceGroup.appendChild(graceLabel);
  graceGroup.appendChild(graceInput);
  graceGroup.appendChild(graceHint);

  // Auto-archive age
  const autoArchiveGroup = document.createElement("div");
  autoArchiveGroup.className = "form-group";

  const autoArchiveLabel = document.createElement("label");
  autoArchiveLabel.htmlFor = "settingAutoArchiveAge";
  autoArchiveLabel.textContent = "Auto-Archive After (months)";

  const autoArchiveInput = document.createElement("input");
  autoArchiveInput.type = "number";
  autoArchiveInput.id = "settingAutoArchiveAge";
  autoArchiveInput.min = "1";
  autoArchiveInput.max = "60";
  autoArchiveInput.value = settings.settingAutoArchiveAge || 12;
  autoArchiveInput.placeholder = "12";

  const autoArchiveHint = document.createElement("p");
  autoArchiveHint.className = "form-hint";
  autoArchiveHint.textContent = "Automatically archive meetings older than this (1-60 months)";

  autoArchiveGroup.appendChild(autoArchiveLabel);
  autoArchiveGroup.appendChild(autoArchiveInput);
  autoArchiveGroup.appendChild(autoArchiveHint);

  // Assemble form grid
  formGrid.appendChild(retentionGroup);
  formGrid.appendChild(maxSizeGroup);
  formGrid.appendChild(maxDurationGroup);
  formGrid.appendChild(graceGroup);
  formGrid.appendChild(autoArchiveGroup);

  form.appendChild(formGrid);

  // Warning box
  const warningBox = document.createElement("div");
  warningBox.className = "settings-warning-box";

  const warningTitle = document.createElement("p");
  warningTitle.className = "settings-warning-title";
  warningTitle.textContent = "Data Retention Warning";

  const warningText = document.createElement("p");
  warningText.className = "settings-warning-text";
  warningText.textContent = "Reducing retention periods will not delete existing data immediately. Soft-deleted data will be permanently removed after the grace period expires.";

  warningBox.appendChild(warningTitle);
  warningBox.appendChild(warningText);

  form.appendChild(warningBox);

  container.appendChild(form);
}
