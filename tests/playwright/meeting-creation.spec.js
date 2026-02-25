import { test, expect } from "@playwright/test";
import { bootstrapPage } from "./support/ui_helpers.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

test.describe("Meeting Creation", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("Create new meeting with all required fields @critical", async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.locator('[data-testid="meeting-date"]').fill("2026-03-15");
    await page.locator('[data-testid="meeting-start-time"]').fill("10:00");
    await page.locator('[data-testid="meeting-location"]').fill("Conference Room A");
    await page.locator('[data-testid="meeting-chair"]').fill("Alex Chair");
    await page.locator('[data-testid="meeting-secretary"]').fill("Riley Secretary");
    await page.locator('[data-testid="meeting-tags"]').fill("budget,annual");

    await page.locator('[data-testid="create-meeting"]').click();

    await expect(page.locator(".meeting-card", { hasText: "Conference Room A" }).first()).toBeVisible();
    await page.locator(".meeting-card", { hasText: "Conference Room A" }).first().click();
    await expect(page.locator("#meetingStatus")).toHaveText("CREATED");
    await guard.assertNoUnexpected();
  });

  test("Create meeting with minimal required fields", async ({ page }) => {
    await page.locator('[data-testid="meeting-date"]').fill("2026-03-16");
    await page.locator('[data-testid="meeting-start-time"]').fill("14:00");
    await page.locator('[data-testid="meeting-location"]').fill("Meeting Hall");

    await page.locator('[data-testid="create-meeting"]').click();

    await expect(page.locator(".meeting-card", { hasText: "Meeting Hall" }).first()).toBeVisible();
  });

  test("Display validation error for missing required fields", async ({ page }) => {
    await page.locator('[data-testid="create-meeting"]').click();
    await expect(page.locator("#newMeetingError")).toContainText("Required:");
    await expect(page.locator("#newMeetingError")).toContainText("date");
    await expect(page.locator("#newMeetingError")).toContainText("start time");
    await expect(page.locator("#newMeetingError")).toContainText("location");
  });

  test("Quick create meeting uses default values", async ({ page }) => {
    await page.locator('[data-testid="quick-create"]').click();
    await expect(page.locator("#quickModal")).toBeVisible();

    await page.locator("#quickLocation").fill("Quick Room");
    await page.locator("#quickChair").fill("Quick Chair");
    await page.locator("#quickSecretary").fill("Quick Secretary");
    await page.locator("#quickTags").fill("quick");
    await page.locator('[data-testid="quick-submit"]').click();

    await expect(page.locator("#quickModal")).toHaveClass(/hidden/);
    await expect(page.locator(".meeting-card", { hasText: "Quick Room" }).first()).toBeVisible();
  });
});
