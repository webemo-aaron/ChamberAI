import { test, expect } from "@playwright/test";
import { bootstrapPage, openMeeting } from "./support/ui_helpers.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

test.describe("Meeting Creation", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("Create new meeting with all required fields @critical", async ({ page }) => {
    const guard = attachConsoleGuard(page);
    const location = `Conference Room A ${Date.now()}`;
    await page.locator('[data-testid="meeting-date"]').fill("2026-03-15");
    await page.locator('[data-testid="meeting-start-time"]').fill("10:00");
    await page.locator('[data-testid="meeting-location"]').fill(location);
    await page.locator('[data-testid="meeting-chair"]').fill("Alex Chair");
    await page.locator('[data-testid="meeting-secretary"]').fill("Riley Secretary");
    await page.locator('[data-testid="meeting-tags"]').fill("budget,annual");

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes("/meetings") && response.request().method() === "POST" && response.ok()
      ),
      page.locator('[data-testid="create-meeting"]').click()
    ]);
    await openMeeting(page, location);
    await expect(page.locator("#meetingStatus")).toHaveText("CREATED");
    await guard.assertNoUnexpected();
  });

  test("Create meeting with minimal required fields", async ({ page }) => {
    const location = `Meeting Hall ${Date.now()}`;
    await page.locator('[data-testid="meeting-date"]').fill("2026-03-16");
    await page.locator('[data-testid="meeting-start-time"]').fill("14:00");
    await page.locator('[data-testid="meeting-location"]').fill(location);

    await page.locator('[data-testid="create-meeting"]').click();

    await expect(page.locator(".meeting-card", { hasText: location }).first()).toBeVisible();
  });

  test("Display validation error for missing required fields", async ({ page }) => {
    await page.locator('[data-testid="create-meeting"]').click();
    await expect(page.locator("#newMeetingError")).toContainText("Required:");
    await expect(page.locator("#newMeetingError")).toContainText("date");
    await expect(page.locator("#newMeetingError")).toContainText("start time");
    await expect(page.locator("#newMeetingError")).toContainText("location");
  });

  test("Quick create meeting uses default values", async ({ page }) => {
    const location = `Quick Room ${Date.now()}`;
    await page.locator('[data-testid="quick-create"]').click();
    await expect(page.locator("#quickModal")).toBeVisible();

    await page.locator("#quickLocation").fill(location);
    await page.locator("#quickChair").fill("Quick Chair");
    await page.locator("#quickSecretary").fill("Quick Secretary");
    await page.locator("#quickTags").fill("quick");
    await page.locator('[data-testid="quick-submit"]').click();

    await expect(page.locator("#quickModal")).toHaveClass(/hidden/);
    await expect(page.locator(".meeting-card", { hasText: location }).first()).toBeVisible();
  });
});
