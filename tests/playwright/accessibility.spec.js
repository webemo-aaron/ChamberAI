import { test, expect } from "@playwright/test";
import { bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

test.describe("Accessibility and WCAG Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("live regions expose status semantics", async ({ page, request }) => {
    const location = `Accessibility Status Room ${Date.now()}`;
    await createMeeting(request, location, {
      date: "2026-03-30",
      start_time: "09:00",
      tags: "accessibility"
    });
    await page.goto(`${page.url().split("#")[0]}#/meetings`);
    await openMeeting(page, location);
    await page.locator('[data-testid="quick-create"]').click();

    const liveRegions = ["#quickCreateError", ".transcription-status"];

    for (const selector of liveRegions) {
      const region = page.locator(selector);
      await expect(region).toHaveAttribute("role", "status");
      await expect(region).toHaveAttribute("aria-live", "polite");
      await expect(region).toHaveAttribute("aria-atomic", "true");
    }
  });

  test("tabs expose ARIA roles and support keyboard navigation", async ({ page, request }) => {
    const location = `Accessibility Tab Room ${Date.now()}`;
    await createMeeting(request, location, {
      date: "2026-03-30",
      start_time: "10:00",
      tags: "accessibility"
    });
    await page.goto(`${page.url().split("#")[0]}#/meetings`);
    await openMeeting(page, location);

    const tablist = page.locator(".detail-tab-bar[role='tablist']");
    await expect(tablist).toBeVisible();

    const minutesTab = page.locator(".detail-tab-bar [data-tab='minutes']");
    const actionsTab = page.locator(".detail-tab-bar [data-tab='actions']");
    const auditTab = page.locator(".detail-tab-bar [data-tab='audit']");
    const summaryTab = page.locator(".detail-tab-bar [data-tab='public-summary']");

    await expect(minutesTab).toHaveAttribute("role", "tab");
    await expect(actionsTab).toHaveAttribute("role", "tab");
    await expect(auditTab).toHaveAttribute("role", "tab");
    await expect(minutesTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#minutes-panel")).not.toHaveClass(/hidden/);

    await minutesTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(actionsTab).toBeFocused();
    await expect(actionsTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#actions-panel")).not.toHaveClass(/hidden/);
    await expect(page.locator("#minutes-panel")).toHaveClass(/hidden/);

    await page.keyboard.press("End");
    await expect(summaryTab).toBeFocused();
    await expect(summaryTab).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(minutesTab).toBeFocused();
    await expect(minutesTab).toHaveAttribute("aria-selected", "true");
  });

  test("modal dialogs trap focus and restore trigger focus on close", async ({ page }) => {
    await page.goto(`${page.url().split("#")[0]}#/meetings`);
    const trigger = page.locator('[data-testid="quick-create"]');
    await trigger.focus();
    await page.keyboard.press("Enter");

    const modal = page.locator("#quickModal");
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute("role", "dialog");
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAttribute("aria-hidden", "false");

    const firstField = page.locator("#quickLocation");
    const lastFocusable = page.locator("#quickCancel");
    await expect(firstField).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(lastFocusable).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(firstField).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(modal).toHaveClass(/hidden/);
    await expect(modal).toHaveAttribute("aria-hidden", "true");
    await expect(trigger).toBeFocused();
  });

  test("meeting cards are keyboard operable", async ({ page }) => {
    await page.goto(`${page.url().split("#")[0]}#/meetings`);
    await page.locator('[data-testid="quick-create"]').click();
    await page.locator("#quickLocation").fill("Keyboard Test Room");
    await page.locator('[data-testid="quick-submit"]').click();

    const card = page.locator(".meeting-item", { hasText: "Keyboard Test Room" }).first();
    await expect(card).toBeVisible();
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".meeting-detail-header")).toContainText("Keyboard Test Room");
    await expect(card).toHaveClass(/selected/);
  });
});
