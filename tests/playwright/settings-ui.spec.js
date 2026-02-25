import { test, expect } from "@playwright/test";
import { bootstrapPage } from "./support/ui_helpers.mjs";

test.describe("Settings and Features UI", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  async function openOpsSettings(page) {
    const disclosure = page.locator("#settingsOpsDisclosure");
    if (!(await disclosure.evaluate((el) => el.hasAttribute("open")))) {
      await disclosure.locator("summary").click();
    }
  }

  test("Feature flags render in settings section", async ({ page }) => {
    await expect(page.locator("#settingsModulesDisclosure > summary")).toContainText("Modules");
    const checkboxes = page.locator("#featureFlags input[data-flag]");
    await expect(checkboxes).toHaveCount(11);
  });

  test("Toggle public summary feature flag", async ({ page }) => {
    const checkbox = page.locator("#featureFlags input[data-flag='public_summary']");
    const initial = await checkbox.isChecked();
    await checkbox.setChecked(!initial);
    await page.locator('[data-testid="save-settings"]').click();
    await expect(page.locator("#settingsStatus")).toContainText("Settings saved.");
    if (initial) {
      await expect(checkbox).not.toBeChecked();
    } else {
      await expect(checkbox).toBeChecked();
    }
  });

  test("Run retention sweep from settings", async ({ page }) => {
    await openOpsSettings(page);
    const retentionButton = page.locator('[data-testid="run-retention-sweep"]');
    await retentionButton.click();
    await expect(page.locator("#retentionResult")).toContainText("Sweep complete.");
  });

  test("Settings changes persist across page reload", async ({ page }) => {
    await openOpsSettings(page);
    const retentionInput = page.locator("#settingRetention");
    await expect(retentionInput).toHaveValue(/^\d+$/);
    await retentionInput.fill("45");
    await expect(retentionInput).toHaveValue("45");
    await page.locator('[data-testid="save-settings"]').click();
    await expect(page.locator("#settingsStatus")).toContainText("Settings saved.");
    await page.reload();
    await openOpsSettings(page);
    await expect(page.locator("#settingRetention")).toHaveValue("45");
  });

  test("Settings displays retention sweep option", async ({ page }) => {
    await openOpsSettings(page);
    await expect(page.locator('[data-testid="run-retention-sweep"]')).toBeVisible();
    await expect(page.locator("#settingRetention")).toBeVisible();
    await expect(page.locator("#settingMaxSize")).toBeVisible();
    await expect(page.locator("#settingMaxDuration")).toBeVisible();
  });
});
