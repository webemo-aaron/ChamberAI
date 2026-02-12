import { test, expect } from "@playwright/test";

test.describe("Settings and Features UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Feature flags render in settings section", async ({ page }) => {
    // Scroll down or look for settings section
    const modulesHeading = page.locator("h3:has-text('Modules')");
    await expect(modulesHeading).toBeVisible({ timeout: 3000 });

    // Verify feature flag checkboxes are present
    const publicSummaryFlag = page.locator(
      'label:has-text("Public Summary")'
    );
    const memberSpotlightFlag = page.locator(
      'label:has-text("Member Spotlight")'
    );
    const analyticsFlag = page.locator(
      'label:has-text("Analytics Dashboard")'
    );

    await expect(publicSummaryFlag).toBeVisible();
    await expect(memberSpotlightFlag).toBeVisible();
    await expect(analyticsFlag).toBeVisible();
  });

  test("Toggle public summary feature flag", async ({ page }) => {
    // Find and verify Public Summary tab is initially hidden
    const publicSummaryTab = page.locator(
      'button[data-tab="public-summary"] || button:has-text("Public Summary")'
    );

    // Initially should be hidden
    const hasHiddenClass = await publicSummaryTab
      .evaluate((el) => el.classList.contains("hidden"))
      .catch(() => true);
    expect(hasHiddenClass).toBeTruthy();

    // Find and enable the Public Summary feature flag
    const publicSummaryCheckbox = page.locator(
      'label:has-text("Public Summary") input[type="checkbox"]'
    );
    await publicSummaryCheckbox.check();

    // Save settings
    await page.click('[data-testid="save-settings"]');

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Verify tab is now visible (not hidden)
    const isNowVisible = await publicSummaryTab
      .evaluate(
        (el) =>
          !el.classList.contains("hidden") &&
          el.offsetParent !== null
      )
      .catch(() => false);

    expect(isNowVisible).toBeTruthy();

    // Disable the flag
    await publicSummaryCheckbox.uncheck();
    await page.click('[data-testid="save-settings"]');

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Verify tab is hidden again
    const isHiddenAgain = await publicSummaryTab
      .evaluate((el) => el.classList.contains("hidden"))
      .catch(() => true);

    expect(isHiddenAgain).toBeTruthy();
  });

  test("Run retention sweep from settings", async ({ page }) => {
    // Find retention sweep button
    const retentionButton = page.locator(
      '[data-testid="run-retention-sweep"] || button:has-text("Run Retention Sweep")'
    );
    await expect(retentionButton).toBeVisible({ timeout: 3000 });

    // Click retention sweep
    await retentionButton.click();

    // Wait for result to appear
    const retentionResult = page.locator("#retentionResult");
    await expect(retentionResult).toContainText(
      /Sweep complete|deleted|no files/i,
      { timeout: 10000 }
    );

    // Verify result shows completion message
    const resultText = await retentionResult.textContent();
    expect(resultText).toBeTruthy();
  });

  test("Settings changes persist across page reload", async ({ page }) => {
    // Change a setting
    const settingInput = page.locator(
      '[data-testid="setting-retention"] || input[type="number"]'
    ).first();

    if (await settingInput.isVisible().catch(() => false)) {
      // Get current value
      const currentValue = await settingInput.inputValue().catch(() => "90");

      // Change value
      const newValue = (parseInt(currentValue) + 10).toString();
      await settingInput.fill(newValue);

      // Save settings
      await page.click('[data-testid="save-settings"]');

      // Wait for save confirmation
      await page.waitForTimeout(1000);

      // Reload page
      await page.reload();

      // Verify setting was persisted
      const reloadedValue = await settingInput.inputValue();
      expect(reloadedValue).toBe(newValue);
    }
  });

  test("Settings displays retention sweep option", async ({ page }) => {
    // Look for retention settings section
    const retentionLabel = page.locator(
      'label:has-text("Retention") || text=/retention/i'
    ).first();

    await expect(retentionLabel).toBeVisible({ timeout: 3000 });

    // Verify retention sweep button
    const sweepButton = page.locator(
      '[data-testid="run-retention-sweep"] || button:has-text("Retention")'
    );

    await expect(sweepButton).toBeVisible();
  });
});
