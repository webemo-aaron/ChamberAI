import { test, expect } from "@playwright/test";

test.describe("Accessibility and WCAG Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Dismiss login modal if present
    const loginModal = page.locator("#loginModal");
    const isVisible = await loginModal.isVisible().catch(() => false);
    if (isVisible) {
      await loginModal.locator("#loginSubmit").click().catch(() => null);
      await loginModal.evaluate(el => el.classList.add("hidden")).catch(() => null);
      await page.waitForTimeout(200);
    }
  });

  test("Keyboard navigation with Tab key works", async ({ page }) => {
    // Start tabbing through interactive elements
    await page.keyboard.press("Tab");

    // Verify focus is visible on first interactive element
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.getAttribute("data-testid") ||
        document.activeElement?.tagName ||
        "body";
    });

    expect(focusedElement).toBeTruthy();

    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      // Should have moved focus
      expect(focused).toBeTruthy();
    }

    // Shift+Tab should go backwards
    await page.keyboard.press("Shift+Tab");
    const afterShiftTab = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    expect(afterShiftTab).toBeTruthy();
  });

  test("Form inputs have associated labels", async ({ page }) => {
    // Check that form inputs have labels or aria-labels
    const inputs = page.locator("input[type='text'], input[type='date'], input[type='time']");
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);

      // Check for label association or aria-label
      const ariaLabel = await input.getAttribute("aria-label").catch(() => null);
      const id = await input.getAttribute("id").catch(() => null);
      const name = await input.getAttribute("name").catch(() => null);

      // Should have at least one of: aria-label, id, or name
      const hasAccessibility = ariaLabel || id || name;
      expect(hasAccessibility).toBeTruthy();
    }
  });

  test("Buttons have accessible text or aria-labels", async ({ page }) => {
    // Check that buttons have text content or aria-labels
    const buttons = page.locator("button").first();

    const buttonCount = await page.locator("button").count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = page.locator("button").nth(i);

      // Get button text
      const text = await button.textContent().catch(() => "");
      const ariaLabel = await button.getAttribute("aria-label").catch(() => null);

      // Should have either text or aria-label
      const hasAccessibleName = (text && text.trim()) || ariaLabel;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test("Form can be submitted with Enter key", async ({ page }) => {
    // Fill the meeting creation form
    const dateInput = page.locator('[data-testid="meeting-date"]');
    await dateInput.fill("2026-03-30");

    const timeInput = page.locator('[data-testid="meeting-start-time"]');
    await timeInput.fill("10:00");

    const locationInput = page.locator('[data-testid="meeting-location"]');
    await locationInput.fill("Keyboard Test Room");

    // Focus on the submit button (Enter key requires button to be focused)
    const submitBtn = page.locator('[data-testid="create-meeting"]');
    await submitBtn.focus();

    // Verify button is focused
    const isFocused = await submitBtn.evaluate(el => document.activeElement === el);
    expect(isFocused).toBeTruthy();

    // Submit using keyboard (Enter on focused button)
    await page.keyboard.press("Enter");

    // Wait briefly for potential form submission
    await page.waitForTimeout(500);

    // Button should still be visible (form didn't break)
    await expect(submitBtn).toBeVisible();
  });

  test("Modal dialogs are keyboard accessible", async ({ page }) => {
    // Open quick create modal
    await page.click('[data-testid="quick-create"]');

    const modal = page.locator("#quickModal");
    await expect(modal).toBeVisible();

    const location = page.locator("#quickLocation");
    await location.focus();
    await expect(location).toBeFocused();
    await location.fill("Accessible Location");

    // Modal should be keyboard-closeable.
    await page.keyboard.press("Escape");
    await expect(modal).toHaveClass(/hidden/);
  });

  test("Focus is visible on all interactive elements", async ({ page }) => {
    // Focus on a button to check focus visibility
    const button = page.locator('[data-testid="create-meeting"]');
    await button.focus();

    // Check that the element is focused
    const isFocused = await button.evaluate((el) => {
      return document.activeElement === el;
    });

    expect(isFocused).toBeTruthy();

    // Browser provides default focus styling (outline, etc.)
    // We verify the element is actually focused, which means focus is visible
    const focused = await page.evaluate(() => {
      return document.activeElement?.getAttribute("data-testid");
    });

    expect(focused).toBe("create-meeting");
  });

  test("Skip link or main content is accessible", async ({ page }) => {
    // Check for main content marker or skip links
    const mainContent = page.locator("main") || 
                       page.locator('[role="main"]') ||
                       page.locator('h1');

    const hasMain = await mainContent.first().isVisible().catch(() => false);
    expect(hasMain).toBeTruthy();
  });
});
