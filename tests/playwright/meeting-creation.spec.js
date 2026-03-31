import { test, expect } from "@playwright/test";
import { UI_BASE, bootstrapPage, openMeeting } from "./support/ui_helpers.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

test.describe("Meeting Creation", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
    await page.goto(`${UI_BASE}/#/meetings`);
    await expect(page.locator("#refreshBtn")).toBeVisible();
  });

  test("Create new meeting with all required fields @critical", async ({ page }) => {
    const guard = attachConsoleGuard(page);
    const location = `Conference Room A ${Date.now()}`;
    await page.locator('[data-testid="quick-create"]').click();
    await expect(page.locator("#quickModal")).toBeVisible();
    await page.locator("#quickLocation").fill(location);
    await page.locator("#quickChair").fill("Alex Chair");
    await page.locator("#quickSecretary").fill("Riley Secretary");
    await page.locator("#quickTags").fill("budget,annual");

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes("/meetings") && response.request().method() === "POST" && response.ok()
      ),
      page.locator('[data-testid="quick-submit"]').click()
    ]);
    await expect(page.locator("#quickModal")).toHaveClass(/hidden/);
    await expect(page.locator(".meeting-detail-header h1")).toContainText(location);
    await expect(page.locator(".meeting-detail-header .badge")).toContainText(/created/i);
    await guard.assertNoUnexpected();
  });

  test("Create meeting with minimal required fields", async ({ page }) => {
    const location = `Meeting Hall ${Date.now()}`;
    await page.locator('[data-testid="quick-create"]').click();
    await page.locator("#quickLocation").fill(location);

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes("/meetings") && response.request().method() === "POST" && response.ok()
      ),
      page.locator('[data-testid="quick-submit"]').click()
    ]);
    await expect(page.locator(".meeting-detail-header h1")).toContainText(location);
  });

  test("Display validation error for missing required fields", async ({ page }) => {
    await page.locator('[data-testid="quick-create"]').click();
    await page.locator('[data-testid="quick-submit"]').click();
    await expect(page.locator("#quickCreateError")).toContainText("Location is required");
    await expect(page.locator("#quickModal")).toBeVisible();
  });

  test("Quick create meeting uses default values", async ({ page }) => {
    const location = `Quick Room ${Date.now()}`;
    await page.locator('[data-testid="quick-create"]').click();
    await expect(page.locator("#quickModal")).toBeVisible();

    const createRequest = page.waitForRequest((request) =>
      request.url().includes("/meetings") && request.method() === "POST"
    );
    await page.locator("#quickLocation").fill(location);
    await page.locator("#quickChair").fill("Quick Chair");
    await page.locator("#quickSecretary").fill("Quick Secretary");
    await page.locator("#quickTags").fill("quick");
    await page.locator('[data-testid="quick-submit"]').click();
    const request = await createRequest;
    const payload = JSON.parse(request.postData() || "{}");

    await expect(page.locator("#quickModal")).toHaveClass(/hidden/);
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.start_time).toBe("09:00");
    expect(payload.location).toBe(location);
    await openMeeting(page, location);
  });
});
