import { test, expect } from "@playwright/test";
import { bootstrapPage } from "./support/ui_helpers.mjs";

test.describe("Accessibility and WCAG Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("live regions expose status semantics", async ({ page }) => {
    const liveRegions = [
      "#toast",
      "#settingsStatus",
      "#retentionResult",
      "#publicSummaryPublishStatus",
      "#collabStatus"
    ];

    for (const selector of liveRegions) {
      const region = page.locator(selector);
      await expect(region).toHaveAttribute("role", "status");
      await expect(region).toHaveAttribute("aria-live", "polite");
      await expect(region).toHaveAttribute("aria-atomic", "true");
    }
  });

  test("tabs expose ARIA roles and support keyboard navigation", async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    const minutesTab = page.locator("#tabButtonMinutes");
    const actionsTab = page.locator("#tabButtonActions");
    const auditTab = page.locator("#tabButtonAudit");

    await expect(minutesTab).toHaveAttribute("role", "tab");
    await expect(actionsTab).toHaveAttribute("role", "tab");
    await expect(auditTab).toHaveAttribute("role", "tab");
    await expect(minutesTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tab-minutes")).not.toHaveClass(/hidden/);

    await minutesTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(actionsTab).toBeFocused();
    await expect(actionsTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tab-actions")).not.toHaveClass(/hidden/);
    await expect(page.locator("#tab-minutes")).toHaveClass(/hidden/);

    await page.keyboard.press("End");
    const lastVisibleTab = page.locator('[role="tab"]:not(.hidden)').last();
    await expect(lastVisibleTab).toBeFocused();
    await page.keyboard.press("Home");
    await expect(minutesTab).toBeFocused();
  });

  test("modal dialogs trap focus and restore trigger focus on close", async ({ page }) => {
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
    await page.locator('[data-testid="meeting-date"]').fill("2026-03-30");
    await page.locator('[data-testid="meeting-start-time"]').fill("10:00");
    await page.locator('[data-testid="meeting-location"]').fill("Keyboard Test Room");
    await page.locator('[data-testid="create-meeting"]').click();

    const card = page.locator(".meeting-card", { hasText: "Keyboard Test Room" }).first();
    await expect(card).toBeVisible();
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#meetingMeta")).toContainText("Keyboard Test Room");
    await expect(card).toHaveAttribute("aria-pressed", "true");
  });
});
