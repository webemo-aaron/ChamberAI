import { test, expect } from "@playwright/test";
import { bootstrapPage, UI_BASE } from "./support/ui_helpers.mjs";

test.describe("UI Error Handling", () => {
  test("non-JSON API response does not crash the UI", async ({ page }) => {
    await bootstrapPage(page);
    await page.evaluate((apiBase) => {
      localStorage.setItem("camApiBase", apiBase);
    }, UI_BASE);
    await page.reload({ waitUntil: "load" });
    await page.goto(`${UI_BASE}/#/meetings`);
    await page.locator("#refreshBtn").click();
    await expect(page.locator("#meetingCount")).toBeVisible();
    await expect(page.locator("#meetingSearch")).toBeVisible();
  });

  test("network failure shows user-facing alert", async ({ page }) => {
    await bootstrapPage(page);
    page.on("dialog", async (dialog) => {
      await dialog.dismiss().catch(() => {});
    });
    await page.evaluate(() => {
      localStorage.setItem("camApiBase", "http://127.0.0.1:59999");
    });
    await page.reload({ waitUntil: "load" });
    await page.goto(`${UI_BASE}/#/meetings`);
    await page.locator("#refreshBtn").click();
    await expect(page.locator("#toast")).toContainText("API request failed");
  });
});
