import { test, expect } from "@playwright/test";
import { bootstrapPage, UI_BASE } from "./support/ui_helpers.mjs";

test.describe("UI Error Handling", () => {
  test("non-JSON API response does not crash the UI", async ({ page }) => {
    await bootstrapPage(page);
    await page.locator("#apiBase").fill(UI_BASE);
    await page.locator("#saveApiBase").click();
    await page.locator('[data-testid="refresh-meetings"]').click();
    await expect(page.locator("#meetingCount")).toBeVisible();
    await expect(page.locator("#meetingSearch")).toBeVisible();
  });

  test("network failure shows user-facing alert", async ({ page }) => {
    await bootstrapPage(page);
    page.on("dialog", async (dialog) => {
      await dialog.dismiss().catch(() => {});
    });
    await page.locator("#apiBase").fill("http://127.0.0.1:59999");
    await page.locator("#saveApiBase").click();
    await page.locator('[data-testid="refresh-meetings"]').click();
    await expect(page.locator("#toast")).toContainText("API request failed");
  });
});
