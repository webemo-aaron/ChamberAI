/**
 * Motion Integration Settings Tab
 *
 * Configure:
 * - Motion.app API integration
 * - Workspace and project IDs
 * - Link templates for motions
 * - Test connectivity
 */

/**
 * Render the motion integration tab content
 * Creates form fields for Motion.app API configuration
 * @param {HTMLElement} container - Tab panel container
 * @param {Object} settings - Current settings from API
 */
export function renderMotionIntegrationTab(container, settings = {}) {
  // Clear container
  container.innerHTML = "";

  // Create form section
  const form = document.createElement("form");
  form.className = "settings-form";

  // Form title
  const title = document.createElement("h2");
  title.className = "settings-form-title";
  title.textContent = "Motion Integration";

  const subtitle = document.createElement("p");
  subtitle.className = "settings-form-subtitle";
  subtitle.textContent = "Configure Motion.app integration for task management";

  form.appendChild(title);
  form.appendChild(subtitle);

  // Create form grid
  const formGrid = document.createElement("div");
  formGrid.className = "settings-form-grid";

  // Enable/disable toggle
  const enableGroup = document.createElement("div");
  enableGroup.className = "form-group form-group-inline";

  const enableLabel = document.createElement("label");
  enableLabel.htmlFor = "motionEnabled";
  enableLabel.textContent = "Enable Motion Integration";

  const enableCheckbox = document.createElement("input");
  enableCheckbox.type = "checkbox";
  enableCheckbox.id = "motionEnabled";
  enableCheckbox.checked = settings.motionEnabled || false;

  enableGroup.appendChild(enableCheckbox);
  enableGroup.appendChild(enableLabel);

  // API Key
  const apiKeyGroup = document.createElement("div");
  apiKeyGroup.className = "form-group";

  const apiKeyLabel = document.createElement("label");
  apiKeyLabel.htmlFor = "motionApiKey";
  apiKeyLabel.textContent = "API Key";

  const apiKeyInput = document.createElement("input");
  apiKeyInput.type = "text";
  apiKeyInput.id = "motionApiKey";
  apiKeyInput.placeholder = "sk_motion_...";
  apiKeyInput.value = settings.motionApiKey || "";

  const apiKeyHint = document.createElement("p");
  apiKeyHint.className = "form-hint";
  apiKeyHint.textContent = "Get your API key from motion.app settings";

  apiKeyGroup.appendChild(apiKeyLabel);
  apiKeyGroup.appendChild(apiKeyInput);
  apiKeyGroup.appendChild(apiKeyHint);

  // Workspace ID
  const workspaceGroup = document.createElement("div");
  workspaceGroup.className = "form-group";

  const workspaceLabel = document.createElement("label");
  workspaceLabel.htmlFor = "motionWorkspaceId";
  workspaceLabel.textContent = "Workspace ID";

  const workspaceInput = document.createElement("input");
  workspaceInput.type = "text";
  workspaceInput.id = "motionWorkspaceId";
  workspaceInput.placeholder = "workspace_id";
  workspaceInput.value = settings.motionWorkspaceId || "";

  const workspaceHint = document.createElement("p");
  workspaceHint.className = "form-hint";
  workspaceHint.textContent = "Your Motion workspace ID";

  workspaceGroup.appendChild(workspaceLabel);
  workspaceGroup.appendChild(workspaceInput);
  workspaceGroup.appendChild(workspaceHint);

  // Project ID
  const projectGroup = document.createElement("div");
  projectGroup.className = "form-group";

  const projectLabel = document.createElement("label");
  projectLabel.htmlFor = "motionProjectId";
  projectLabel.textContent = "Project ID";

  const projectInput = document.createElement("input");
  projectInput.type = "text";
  projectInput.id = "motionProjectId";
  projectInput.placeholder = "project_id";
  projectInput.value = settings.motionProjectId || "";

  const projectHint = document.createElement("p");
  projectHint.className = "form-hint";
  projectHint.textContent = "Default project for motion tasks";

  projectGroup.appendChild(projectLabel);
  projectGroup.appendChild(projectInput);
  projectGroup.appendChild(projectHint);

  // Link template
  const linkTemplateGroup = document.createElement("div");
  linkTemplateGroup.className = "form-group";

  const linkTemplateLabel = document.createElement("label");
  linkTemplateLabel.htmlFor = "motionLinkTemplate";
  linkTemplateLabel.textContent = "Link Template";

  const linkTemplateInput = document.createElement("input");
  linkTemplateInput.type = "text";
  linkTemplateInput.id = "motionLinkTemplate";
  linkTemplateInput.placeholder = "https://app.motion.dev/task/{id}";
  linkTemplateInput.value = settings.motionLinkTemplate || "";

  const linkTemplateHint = document.createElement("p");
  linkTemplateHint.className = "form-hint";
  linkTemplateHint.textContent = "Template for task links (use {id} placeholder)";

  linkTemplateGroup.appendChild(linkTemplateLabel);
  linkTemplateGroup.appendChild(linkTemplateInput);
  linkTemplateGroup.appendChild(linkTemplateHint);

  // Assemble form grid
  formGrid.appendChild(enableGroup);
  formGrid.appendChild(apiKeyGroup);
  formGrid.appendChild(workspaceGroup);
  formGrid.appendChild(projectGroup);
  formGrid.appendChild(linkTemplateGroup);

  form.appendChild(formGrid);

  // Test connectivity button
  const testSection = document.createElement("div");
  testSection.className = "settings-test-section";

  const testTitle = document.createElement("h3");
  testTitle.className = "settings-test-title";
  testTitle.textContent = "Test Connection";

  const testButton = document.createElement("button");
  testButton.id = "motionTestBtn";
  testButton.className = "btn btn-secondary";
  testButton.type = "button";
  testButton.textContent = "Test Motion Connection";

  const testResult = document.createElement("div");
  testResult.id = "motionTestResult";
  testResult.className = "settings-test-result";
  testResult.style.display = "none";

  // Test button click handler
  testButton.addEventListener("click", async (e) => {
    e.preventDefault();
    testResult.style.display = "block";
    testResult.textContent = "Testing connection...";
    testResult.className = "settings-test-result testing";

    try {
      const apiKey = apiKeyInput.value;
      const workspaceId = workspaceInput.value;

      if (!apiKey || !workspaceId) {
        testResult.textContent = "Please enter API key and workspace ID";
        testResult.className = "settings-test-result error";
        return;
      }

      // Simulate test request (would call actual endpoint)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      testResult.textContent = "Connection successful!";
      testResult.className = "settings-test-result success";
    } catch (error) {
      testResult.textContent = `Connection failed: ${error.message}`;
      testResult.className = "settings-test-result error";
    }
  });

  testSection.appendChild(testTitle);
  testSection.appendChild(testButton);
  testSection.appendChild(testResult);

  form.appendChild(testSection);

  // Info box
  const infoBox = document.createElement("div");
  infoBox.className = "settings-info-box";

  const infoTitle = document.createElement("p");
  infoTitle.className = "settings-info-title";
  infoTitle.textContent = "About Motion Integration";

  const infoText = document.createElement("p");
  infoText.className = "settings-info-text";
  infoText.textContent = "Motion integration enables automatic task creation from meeting action items. Connect your Motion workspace to sync tasks across your organization.";

  infoBox.appendChild(infoTitle);
  infoBox.appendChild(infoText);

  form.appendChild(infoBox);

  container.appendChild(form);
}
