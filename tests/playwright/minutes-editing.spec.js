import { test, expect } from "@playwright/test";

test.describe("Minutes Editing and Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Edit draft minutes after generation", async ({ page }) => {
    // Create and process a meeting first
    await page.fill('[data-testid="meeting-date"]', "2026-03-25");
    await page.fill('[data-testid="meeting-start-time"]', "10:00");
    await page.fill('[data-testid="meeting-location"]', "Minutes Edit Room");
    await page.click('[data-testid="create-meeting"]');

    // Open meeting
    await page.locator('text="Minutes Edit Room"').click();

    // Simulate processing (in mock, would generate draft)
    await page.click('[data-testid="process-meeting"]');

    // Wait for minutes content to appear
    const minutesArea = page.locator('[data-testid="minutes-content"]');
    await expect(minutesArea).toBeVisible({ timeout: 5000 });

    // Edit the minutes
    await minutesArea.fill("Edited meeting minutes:\n- Item 1\n- Item 2\n- Item 3");

    // Save draft
    await page.click('[data-testid="save-minutes"]');

    // Verify save succeeded
    await expect(
      page.locator('text=/saved|draft saved/i')
    ).toBeVisible({ timeout: 3000 });

    // Verify content persists
    await expect(minutesArea).toHaveValue(/Edited meeting minutes/);
  });

  test("Add action items to meeting", async ({ page }) => {
    // Create meeting
    await page.fill('[data-testid="meeting-date"]', "2026-03-26");
    await page.fill('[data-testid="meeting-start-time"]', "11:00");
    await page.fill('[data-testid="meeting-location"]', "Action Items Room");
    await page.click('[data-testid="create-meeting"]');

    // Open meeting
    await page.locator('text="Action Items Room"').click();

    // Navigate to action items tab
    const actionTab = page.locator(
      'button:has-text("Action Items") || [data-testid="tab-actions"]'
    );
    await actionTab.click();

    // Wait for action items section to be visible
    await expect(
      page.locator('[data-testid="action-description"]')
    ).toBeVisible({ timeout: 3000 });

    // Add first action item
    await page.fill(
      '[data-testid="action-description"]',
      "Prepare budget report"
    );
    await page.fill('[data-testid="action-owner"]', "John Smith");
    await page.fill('[data-testid="action-due-date"]', "2026-04-15");
    await page.click('[data-testid="add-action-item"]');

    // Verify item added
    await expect(
      page.locator('text="Prepare budget report"')
    ).toBeVisible({ timeout: 3000 });

    // Add second action item
    await page.fill(
      '[data-testid="action-description"]',
      "Review financial statements"
    );
    await page.fill('[data-testid="action-owner"]', "Jane Doe");
    await page.fill('[data-testid="action-due-date"]', "2026-04-20");
    await page.click('[data-testid="add-action-item"]');

    // Verify both items are present
    await expect(
      page.locator('text="Review financial statements"')
    ).toBeVisible();
  });

  test("Create and edit motions during meeting", async ({ page }) => {
    // Create meeting
    await page.fill('[data-testid="meeting-date"]', "2026-03-27");
    await page.fill('[data-testid="meeting-start-time"]', "13:00");
    await page.fill('[data-testid="meeting-location"]', "Motions Room");
    await page.click('[data-testid="create-meeting"]');

    // Open meeting
    await page.locator('text="Motions Room"').click();

    // Navigate to motions tab
    const motionsTab = page.locator(
      'button:has-text("Motions") || [data-testid="tab-motions"]'
    );
    await motionsTab.click();

    // Wait for motions section
    await expect(
      page.locator('[data-testid="motion-text"]')
    ).toBeVisible({ timeout: 3000 });

    // Add a motion
    await page.fill(
      '[data-testid="motion-text"]',
      "Approve FY2026 budget proposal"
    );
    await page.fill('[data-testid="motion-mover"]', "Sarah Johnson");
    await page.fill('[data-testid="motion-seconder"]', "Mike Davis");
    await page.fill('[data-testid="motion-vote"]', "voice");
    await page.fill('[data-testid="motion-outcome"]', "PASSED");
    await page.click('[data-testid="add-motion"]');

    // Verify motion was added
    await expect(
      page.locator('text="Approve FY2026 budget proposal"')
    ).toBeVisible({ timeout: 3000 });
  });

  test("Export minutes in different formats", async ({ page }) => {
    // Create meeting
    await page.fill('[data-testid="meeting-date"]', "2026-03-28");
    await page.fill('[data-testid="meeting-start-time"]', "14:00");
    await page.fill('[data-testid="meeting-location"]', "Export Room");
    await page.click('[data-testid="create-meeting"]');

    // Open meeting
    await page.locator('text="Export Room"').click();

    // Process to get draft minutes
    await page.click('[data-testid="process-meeting"]');

    // Navigate to motions tab (where export buttons are)
    await page.locator(
      'button:has-text("Motions") || [data-testid="tab-motions"]'
    ).click();

    // Wait for export buttons
    await expect(
      page.locator('[data-testid="export-pdf"]')
    ).toBeVisible({ timeout: 3000 });

    // Verify all export options are available
    await expect(page.locator('[data-testid="export-docx"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="export-minutes-md"]')
    ).toBeVisible();

    // Click PDF export (mock in test environment)
    await page.click('[data-testid="export-pdf"]');

    // Verify export initiated
    await expect(
      page.locator('text=/export|download|generating/i')
    ).toBeVisible({ timeout: 3000 });
  });
});
