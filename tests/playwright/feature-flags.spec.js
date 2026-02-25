import { test, expect } from "@playwright/test";
import { bootstrapPage } from "./support/ui_helpers.mjs";

test.describe("Feature Flags", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("feature flags render in settings", async ({ page }) => {
    const flagsContainer = page.locator("#featureFlags");
    await expect(flagsContainer).toBeVisible();
    const checkboxes = flagsContainer.locator("input[type='checkbox'][data-flag]");
    await expect(checkboxes).toHaveCount(11);
  });

  test("public summary tab visibility toggles with feature flag", async ({ page }) => {
    const publicSummaryTab = page.locator("#publicSummaryTab");
    const publicSummaryCheckbox = page.locator("#featureFlags input[data-flag='public_summary']");

    const wasChecked = await publicSummaryCheckbox.isChecked();
    await publicSummaryCheckbox.setChecked(!wasChecked);
    await page.locator('[data-testid="save-settings"]').click();

    if (wasChecked) {
      await expect(publicSummaryTab).toHaveClass(/hidden/);
    } else {
      await expect(publicSummaryTab).not.toHaveClass(/hidden/);
    }

    // restore original state for test isolation
    await publicSummaryCheckbox.setChecked(wasChecked);
    await page.locator('[data-testid="save-settings"]').click();
  });

  test("retention sweep button appears in settings", async ({ page }) => {
    const retentionButton = page.locator('[data-testid="run-retention-sweep"]');
    await expect(retentionButton).toBeVisible();
    await expect(retentionButton).toBeEnabled();
  });
});
