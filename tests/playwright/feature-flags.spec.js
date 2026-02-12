import { test, expect } from "@playwright/test";

test.describe("Feature Flags", () => {
  test("feature flags render in settings", async ({ page }) => {
    await page.goto("/");

    // Navigate to Settings tab
    await page.click('button:has-text("Settings")');

    // Verify feature flags section exists
    const modulesHeading = page.locator("h3:has-text('Modules')");
    await expect(modulesHeading).toBeVisible();

    // Verify some feature flags are present
    const publicSummaryFlag = page.locator('label:has-text("Public Summary")');
    await expect(publicSummaryFlag).toBeVisible();

    const memberSpotlightFlag = page.locator('label:has-text("Member Spotlight")');
    await expect(memberSpotlightFlag).toBeVisible();

    const analyticsFlag = page.locator('label:has-text("Analytics Dashboard")');
    await expect(analyticsFlag).toBeVisible();
  });

  test("public summary tab visibility toggles with feature flag", async ({ page }) => {
    await page.goto("/");

    // Navigate to Settings
    await page.click('button:has-text("Settings")');

    // Initially, public summary tab should be hidden
    const publicSummaryTab = page.locator('button.tab:has-text("Public Summary")');
    await expect(publicSummaryTab).toHaveClass(/hidden/);

    // Enable public summary feature flag
    const publicSummaryCheckbox = page.locator('label:has-text("Public Summary") input[type="checkbox"]');
    await publicSummaryCheckbox.check();

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Wait for the tab to become visible
    await expect(publicSummaryTab).not.toHaveClass(/hidden/, { timeout: 5000 });

    // Public summary tab should now be visible
    await expect(publicSummaryTab).toBeVisible();

    // Disable the flag
    await page.click('button:has-text("Settings")');
    await publicSummaryCheckbox.uncheck();
    await page.click('button:has-text("Save Settings")');

    // Wait for the tab to become hidden
    await expect(publicSummaryTab).toHaveClass(/hidden/, { timeout: 5000 });
  });

  test("retention sweep button appears in settings", async ({ page }) => {
    await page.goto("/");

    // Navigate to Settings
    await page.click('button:has-text("Settings")');

    // Verify retention sweep button exists
    const retentionButton = page.locator('button:has-text("Run Retention Sweep")');
    await expect(retentionButton).toBeVisible();

    // Click it and verify result appears
    await retentionButton.click();

    // Wait for result element to appear and contain text
    const retentionResult = page.locator("#retentionResult");
    await expect(retentionResult).toContainText(/Sweep complete|deleted/i, { timeout: 10000 });
  });
});
