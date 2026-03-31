/**
 * Kiosk Configuration Panel
 *
 * Admin panel for configuring the AI kiosk with:
 * - 5 configuration tabs (modes, scope, provider, retention, display)
 * - Form inputs with validation
 * - Save/test/preview functionality
 * - Live kiosk preview
 * - Auth guard (admin + tier)
 *
 * Route: /kiosk-config
 */

import { request } from "../../core/api.js";
import { getCurrentRole } from "../../core/auth.js";
import { showToast } from "../../core/toast.js";
import { navigate } from "../../core/router.js";

/**
 * Kiosk config handler
 * @param {Object} params - Route parameters
 * @param {Object} context - Router context
 */
export async function kioskConfigHandler(params, context) {
  try {
    // Auth guard: require admin role
    const currentRole = getCurrentRole();
    if (currentRole !== "admin") {
      showToast("Kiosk configuration requires admin access", "error");
      navigate("/meetings");
      return;
    }

    // Load current configuration
    let kioskConfig;
    try {
      kioskConfig = await request("/api/kiosk/config", "GET");
    } catch (error) {
      showToast("Failed to load kiosk configuration", "error");
      console.error("Failed to load config:", error);
      navigate("/meetings");
      return;
    }

    // Render config page
    const configPage = document.createElement("div");
    configPage.className = "kiosk-config-page";
    configPage.setAttribute("role", "main");

    configPage.innerHTML = `
      <div class="kiosk-config-container">
        <div class="config-header">
          <h1>AI Kiosk Configuration</h1>
          <p class="config-subtitle">Configure how your organization's AI assistant works</p>
        </div>

        <div class="config-layout">
          <!-- Left: Config Form -->
          <div class="config-form-section">
            <form id="kioskConfigForm" class="kiosk-config-form" aria-label="Kiosk configuration">
              <!-- Tab Navigation -->
              <div class="config-tabs" role="tablist">
                <button type="button" class="config-tab active" role="tab" aria-selected="true" aria-controls="modesPanel" data-tab="modes">
                  Modes
                </button>
                <button type="button" class="config-tab" role="tab" aria-selected="false" aria-controls="scopePanel" data-tab="scope">
                  Data Scope
                </button>
                <button type="button" class="config-tab" role="tab" aria-selected="false" aria-controls="providerPanel" data-tab="provider">
                  AI Provider
                </button>
                <button type="button" class="config-tab" role="tab" aria-selected="false" aria-controls="retentionPanel" data-tab="retention">
                  Context
                </button>
                <button type="button" class="config-tab" role="tab" aria-selected="false" aria-controls="limitsPanel" data-tab="limits">
                  Rate Limits
                </button>
              </div>

              <!-- Tab Panels -->
              <div class="config-panels">
                <!-- Modes Tab -->
                <div id="modesPanel" class="config-panel active" role="tabpanel" aria-labelledby="modesTab">
                  <h3>Operating Modes</h3>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" id="enabledCheckbox" name="enabled" />
                      <span>Enable AI Kiosk</span>
                    </label>
                  </div>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" id="publicModeCheckbox" name="publicModeEnabled" />
                      <span>Enable Public Mode</span>
                    </label>
                    <p class="field-description">Allow unauthenticated access to published information</p>
                  </div>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" id="privateModeCheckbox" name="privateModeEnabled" />
                      <span>Enable Private Mode</span>
                    </label>
                    <p class="field-description">Allow authenticated admins to access all data</p>
                  </div>
                </div>

                <!-- Data Scope Tab -->
                <div id="scopePanel" class="config-panel" role="tabpanel" aria-labelledby="scopeTab">
                  <h3>Data Scope</h3>
                  <div class="form-group">
                    <label for="dataScopeSelect">Default Data Scope</label>
                    <select id="dataScopeSelect" name="dataScope" class="form-input">
                      <option value="public">Public (published data only)</option>
                      <option value="private">Private (all organizational data)</option>
                    </select>
                    <p class="field-description">Controls what data the AI can see by default</p>
                  </div>
                </div>

                <!-- AI Provider Tab -->
                <div id="providerPanel" class="config-panel" role="tabpanel" aria-labelledby="providerTab">
                  <h3>AI Provider</h3>
                  <div class="form-group">
                    <label for="providerTypeSelect">Provider Type</label>
                    <select id="providerTypeSelect" name="aiProvider.type" class="form-input">
                      <option value="claude">Anthropic Claude</option>
                      <option value="openai">OpenAI GPT</option>
                      <option value="custom">Custom Endpoint</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="modelInput">Model Name</label>
                    <input
                      type="text"
                      id="modelInput"
                      name="aiProvider.model"
                      class="form-input"
                      placeholder="e.g., claude-3-5-sonnet-20241022"
                    />
                  </div>

                  <div class="form-group">
                    <label for="apiKeyInput">API Key</label>
                    <input
                      type="password"
                      id="apiKeyInput"
                      name="aiProvider.apiKey"
                      class="form-input"
                      placeholder="Enter API key (stored securely)"
                    />
                    <p class="field-description">API keys are encrypted before storage</p>
                  </div>

                  <div class="form-group" id="endpointGroup" style="display: none;">
                    <label for="endpointInput">Custom Endpoint</label>
                    <input
                      type="url"
                      id="endpointInput"
                      name="aiProvider.endpoint"
                      class="form-input"
                      placeholder="https://your-api.example.com/chat"
                    />
                  </div>

                  <button type="button" id="testProviderBtn" class="btn btn-secondary">
                    Test Provider Connection
                  </button>
                </div>

                <!-- Context/Retention Tab -->
                <div id="retentionPanel" class="config-panel" role="tabpanel" aria-labelledby="retentionTab">
                  <h3>Context Configuration</h3>
                  <div class="form-group">
                    <label for="tokenLimitInput">Token Limit</label>
                    <input
                      type="number"
                      id="tokenLimitInput"
                      name="contextConfig.tokenLimit"
                      class="form-input"
                      min="1000"
                      max="100000"
                      step="1000"
                    />
                    <p class="field-description">Maximum tokens to include in context</p>
                  </div>

                  <div class="form-group">
                    <label for="meetingsLimitInput">Meetings to Include</label>
                    <input
                      type="number"
                      id="meetingsLimitInput"
                      name="contextConfig.meetingsLimit"
                      class="form-input"
                      min="1"
                      max="50"
                    />
                  </div>

                  <div class="form-group">
                    <label for="motionsLimitInput">Motions to Include</label>
                    <input
                      type="number"
                      id="motionsLimitInput"
                      name="contextConfig.motionsLimit"
                      class="form-input"
                      min="1"
                      max="50"
                    />
                  </div>

                  <div class="form-group">
                    <label for="actionItemsLimitInput">Action Items to Include</label>
                    <input
                      type="number"
                      id="actionItemsLimitInput"
                      name="contextConfig.actionItemsLimit"
                      class="form-input"
                      min="1"
                      max="50"
                    />
                  </div>

                  <div style="border-top: 1px solid #e2e8f0; margin: 1.5rem 0; padding-top: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: 600;">Semantic Search (RAG)</h4>
                    <div class="form-group">
                      <label class="checkbox-label">
                        <input type="checkbox" id="ragEnabledCheckbox" name="contextConfig.ragEnabled" />
                        <span>Enable RAG</span>
                      </label>
                      <p class="field-description">Use embedding-based semantic search to find relevant context for queries</p>
                    </div>

                    <div class="form-group">
                      <label for="ragTopKInput">Top Results (K)</label>
                      <input
                        type="number"
                        id="ragTopKInput"
                        name="contextConfig.ragTopK"
                        class="form-input"
                        min="1"
                        max="20"
                      />
                      <p class="field-description">Number of semantically similar documents to retrieve per query</p>
                    </div>

                    <div style="margin-top: 1rem;">
                      <button type="button" id="rebuildIndexBtn" class="btn btn-secondary" style="margin-right: 0.75rem;">
                        Rebuild Search Index
                      </button>
                      <span id="indexStatus" style="font-size: 0.875rem; color: #64748b;"></span>
                    </div>
                  </div>
                </div>

                <!-- Rate Limits Tab -->
                <div id="limitsPanel" class="config-panel" role="tabpanel" aria-labelledby="limitsTab">
                  <h3>Rate Limiting</h3>
                  <div class="form-group">
                    <label for="chamberMaxInput">Chamber Max per Minute</label>
                    <input
                      type="number"
                      id="chamberMaxInput"
                      name="rateLimit.chamberMaxPerMinute"
                      class="form-input"
                      min="1"
                      max="100"
                    />
                    <p class="field-description">Max requests per minute from entire organization</p>
                  </div>

                  <div class="form-group">
                    <label for="ipMaxInput">IP Max per Minute</label>
                    <input
                      type="number"
                      id="ipMaxInput"
                      name="rateLimit.ipMaxPerMinute"
                      class="form-input"
                      min="1"
                      max="100"
                    />
                    <p class="field-description">Max requests per minute from single IP</p>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="config-actions">
                <button type="submit" class="btn btn-primary">Save Configuration</button>
                <button type="button" class="btn btn-secondary" id="previewBtn">Preview Kiosk</button>
              </div>
            </form>
          </div>

          <!-- Right: Live Preview -->
          <div class="config-preview-section">
            <h3>Live Preview</h3>
            <div class="kiosk-preview-frame" id="previewFrame">
              <p class="preview-placeholder">Kiosk preview will appear here</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Get main content area
    const mainContent = document.querySelector("main") || document.body;
    mainContent.innerHTML = "";
    mainContent.appendChild(configPage);

    // Initialize form with current config
    initializeForm(kioskConfig);

    // Set up event handlers
    setupTabNavigation(configPage);
    setupFormHandlers(configPage, kioskConfig);
  } catch (error) {
    console.error("Kiosk config handler error:", error);
    showToast("Failed to initialize kiosk configuration", "error");
  }
}

/**
 * Initialize form with current configuration
 */
function initializeForm(config) {
  document.getElementById("enabledCheckbox").checked = config.enabled ?? false;
  document.getElementById("publicModeCheckbox").checked = config.publicModeEnabled ?? false;
  document.getElementById("privateModeCheckbox").checked = config.privateModeEnabled ?? false;
  document.getElementById("dataScopeSelect").value = config.dataScope ?? "public";

  const aiProvider = config.aiProvider ?? {};
  document.getElementById("providerTypeSelect").value = aiProvider.type ?? "claude";
  document.getElementById("modelInput").value = aiProvider.model ?? "";

  const contextConfig = config.contextConfig ?? {};
  document.getElementById("tokenLimitInput").value = contextConfig.tokenLimit ?? 8000;
  document.getElementById("meetingsLimitInput").value = contextConfig.meetingsLimit ?? 5;
  document.getElementById("motionsLimitInput").value = contextConfig.motionsLimit ?? 10;
  document.getElementById("actionItemsLimitInput").value = contextConfig.actionItemsLimit ?? 10;
  document.getElementById("ragEnabledCheckbox").checked = contextConfig.ragEnabled ?? false;
  document.getElementById("ragTopKInput").value = contextConfig.ragTopK ?? 5;

  const rateLimit = config.rateLimit ?? {};
  document.getElementById("chamberMaxInput").value = rateLimit.chamberMaxPerMinute ?? 10;
  document.getElementById("ipMaxInput").value = rateLimit.ipMaxPerMinute ?? 5;

  // Update custom endpoint visibility
  updateEndpointVisibility();
}

/**
 * Set up tab navigation
 */
function setupTabNavigation(container) {
  const tabs = container.querySelectorAll(".config-tab");
  const panels = container.querySelectorAll(".config-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;

      // Deactivate all tabs and panels
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach((p) => {
        p.classList.remove("active");
      });

      // Activate selected tab and panel
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const panelId = tab.getAttribute("aria-controls");
      const panel = container.querySelector(`#${panelId}`);
      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

/**
 * Set up form event handlers
 */
function setupFormHandlers(container, kioskConfig) {
  const form = container.querySelector("#kioskConfigForm");
  const testBtn = container.querySelector("#testProviderBtn");
  const previewBtn = container.querySelector("#previewBtn");
  const rebuildBtn = container.querySelector("#rebuildIndexBtn");
  const providerTypeSelect = container.querySelector("#providerTypeSelect");

  // Provider type change handler
  providerTypeSelect.addEventListener("change", updateEndpointVisibility);

  // Test provider button
  if (testBtn) {
    testBtn.addEventListener("click", async () => {
      const config = serializeForm(form);
      await testProvider(config);
    });
  }

  // Rebuild index button
  if (rebuildBtn) {
    rebuildBtn.addEventListener("click", async () => {
      rebuildBtn.disabled = true;
      const statusEl = container.querySelector("#indexStatus");
      if (statusEl) statusEl.textContent = "Rebuilding...";

      try {
        const result = await request("/api/kiosk/index", "POST", {});
        if (result.success) {
          if (statusEl) statusEl.textContent = `Indexed ${result.documentsIndexed} documents`;
          showToast("Search index rebuilt successfully");
        } else {
          if (statusEl) statusEl.textContent = "Rebuild failed";
          showToast("Index rebuild failed — check provider config", "error");
        }
      } catch (error) {
        console.error("Index rebuild error:", error);
        if (statusEl) statusEl.textContent = "Rebuild failed";
        showToast(`Index rebuild failed: ${error.message}`, "error");
      } finally {
        rebuildBtn.disabled = false;
      }
    });
  }

  // Preview button
  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      const previewFrame = container.querySelector("#previewFrame");
      previewFrame.innerHTML = `
        <div class="kiosk-preview-content">
          <div class="kiosk-mode-banner public">
            <span class="mode-label">🌐 Public Mode</span>
          </div>
          <p style="text-align: center; padding: 2rem;">Preview of kiosk interface</p>
        </div>
      `;
      showToast("Preview displayed");
    });
  }

  // Form submission
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const config = serializeForm(form);
    await saveConfiguration(config);
  });
}

/**
 * Update endpoint field visibility based on provider type
 */
function updateEndpointVisibility() {
  const providerType = document.getElementById("providerTypeSelect").value;
  const endpointGroup = document.getElementById("endpointGroup");
  if (endpointGroup) {
    endpointGroup.style.display = providerType === "custom" ? "block" : "none";
  }
}

/**
 * Serialize form to configuration object
 */
function serializeForm(form) {
  const formData = new FormData(form);
  const config = {
    enabled: formData.get("enabled") === "on",
    publicModeEnabled: formData.get("publicModeEnabled") === "on",
    privateModeEnabled: formData.get("privateModeEnabled") === "on",
    dataScope: formData.get("dataScope"),
    aiProvider: {
      type: formData.get("aiProvider.type"),
      model: formData.get("aiProvider.model"),
      apiKey: formData.get("aiProvider.apiKey"),
      endpoint: formData.get("aiProvider.endpoint")
    },
    contextConfig: {
      tokenLimit: parseInt(formData.get("contextConfig.tokenLimit"), 10),
      meetingsLimit: parseInt(formData.get("contextConfig.meetingsLimit"), 10),
      motionsLimit: parseInt(formData.get("contextConfig.motionsLimit"), 10),
      actionItemsLimit: parseInt(formData.get("contextConfig.actionItemsLimit"), 10),
      ragEnabled: formData.get("contextConfig.ragEnabled") === "on",
      ragTopK: parseInt(formData.get("contextConfig.ragTopK") || "5", 10)
    },
    rateLimit: {
      chamberMaxPerMinute: parseInt(formData.get("rateLimit.chamberMaxPerMinute"), 10),
      ipMaxPerMinute: parseInt(formData.get("rateLimit.ipMaxPerMinute"), 10)
    }
  };

  // Validate
  if (!config.aiProvider.type) {
    throw new Error("AI provider type is required");
  }
  if (!config.aiProvider.model) {
    throw new Error("Model name is required");
  }

  return config;
}

/**
 * Test AI provider connection
 */
async function testProvider(config) {
  try {
    const testBtn = document.getElementById("testProviderBtn");
    testBtn.disabled = true;
    testBtn.textContent = "Testing...";

    // Call API to test (create a test config without saving)
    const response = await request("/api/kiosk/test-provider", "POST", {
      type: config.aiProvider.type,
      model: config.aiProvider.model,
      apiKey: config.aiProvider.apiKey,
      endpoint: config.aiProvider.endpoint
    });

    showToast("Provider connection successful");
  } catch (error) {
    console.error("Provider test failed:", error);
    showToast(`Provider test failed: ${error.message}`, "error");
  } finally {
    const testBtn = document.getElementById("testProviderBtn");
    testBtn.disabled = false;
    testBtn.textContent = "Test Provider Connection";
  }
}

/**
 * Save configuration to backend
 */
async function saveConfiguration(config) {
  try {
    const saveBtn = document.querySelector('button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    // Remove empty API key from payload if not changing it
    if (!config.aiProvider.apiKey) {
      delete config.aiProvider.apiKey;
    }

    // Remove empty endpoint if not custom
    if (config.aiProvider.type !== "custom") {
      delete config.aiProvider.endpoint;
    }

    const response = await request("/api/kiosk/config", "POST", config);

    showToast("Kiosk configuration saved successfully");
  } catch (error) {
    console.error("Save failed:", error);
    showToast(`Configuration save failed: ${error.message}`, "error");
  } finally {
    const saveBtn = document.querySelector('button[type="submit"]');
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Configuration";
  }
}
