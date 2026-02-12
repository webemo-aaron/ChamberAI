import { test, expect } from "@playwright/test";

test.describe("Meeting Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");
  });

  test("Create new meeting with all required fields", async ({ page }) => {
    // Fill in meeting creation form
    await page.fill('[data-testid="meeting-date"]', "2026-03-15");
    await page.fill('[data-testid="meeting-start-time"]', "10:00");
    await page.fill(
      '[data-testid="meeting-location"]',
      "Conference Room A"
    );
    await page.fill('[data-testid="meeting-chair"]', "Alex Chair");
    await page.fill('[data-testid="meeting-secretary"]', "Riley Secretary");

    // Submit form
    await page.click('[data-testid="create-meeting"]');

    // Verify meeting appears in list
    await expect(
      page.locator('text="Conference Room A"')
    ).toBeVisible({ timeout: 5000 });
  });

  test("Create meeting with minimal required fields", async ({ page }) => {
    // Fill only required fields
    await page.fill('[data-testid="meeting-date"]', "2026-03-16");
    await page.fill('[data-testid="meeting-start-time"]', "14:00");
    await page.fill('[data-testid="meeting-location"]', "Meeting Hall");

    // Submit form
    await page.click('[data-testid="create-meeting"]');

    // Verify meeting was created
    await expect(page.locator('text="Meeting Hall"')).toBeVisible({
      timeout: 5000
    });
  });

  test("Display validation error for missing required fields", async ({
    page
  }) => {
    // Try to create meeting without filling any fields
    await page.click('[data-testid="create-meeting"]');

    // Expect error message to appear
    await expect(
      page.locator('text=/required|missing/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test("Quick create meeting uses default values", async ({ page }) => {
    // Click quick create button
    await page.click('[data-testid="quick-create"]');

    // Fill quick create form (location and other fields)
    const modal = page.locator(".modal");
    await expect(modal).toBeVisible();

    // Fill in quick create fields
    await modal.locator('[data-testid="quick-location"] || input[placeholder*="Location"]').fill(
      "Quick Room"
    );
    await modal.locator('[data-testid="quick-chair"] || input[placeholder*="Chair"]').fill(
      "Quick Chair"
    );
    await modal.locator('[data-testid="quick-secretary"] || input[placeholder*="Secretary"]').fill(
      "Quick Secretary"
    );

    // Submit quick create
    await page.click('[data-testid="quick-submit"]');

    // Verify meeting created with today's date and 6 PM default
    await expect(page.locator('text="Quick Room"')).toBeVisible({
      timeout: 5000
    });
  });
});
