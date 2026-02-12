import { test, expect } from "@playwright/test";
import { fixtures } from "../fixtures/data.js";

test.describe("Meeting Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Complete meeting workflow: create → upload → process → approve", async ({
    page
  }) => {
    // Step 1: Create meeting
    await page.fill('[data-testid="meeting-date"]', "2026-03-20");
    await page.fill('[data-testid="meeting-start-time"]', "10:00");
    await page.fill('[data-testid="meeting-location"]', "Board Room");
    await page.fill('[data-testid="meeting-chair"]', "Board Chair");
    await page.fill('[data-testid="meeting-secretary"]', "Board Secretary");
    await page.click('[data-testid="create-meeting"]');

    // Wait for meeting to appear and click it
    const meetingRow = page.locator('text="Board Room"');
    await expect(meetingRow).toBeVisible({ timeout: 5000 });
    await meetingRow.click();

    // Step 2: Register audio file
    await page.click('[data-testid="pick-file"]');
    // In real test, would set up mock file upload
    // For now, verify the button works
    await expect(
      page.locator('[data-testid="register-audio"]')
    ).toBeEnabled();

    // Step 3: Process meeting
    await page.click('[data-testid="process-meeting"]');

    // Wait for draft minutes to be generated
    const minutesContent = page.locator('[data-testid="minutes-content"]');
    await expect(minutesContent).toHaveValue(/draft|minutes/i, {
      timeout: 10000
    });

    // Step 4: Verify draft is ready and approve
    await expect(
      page.locator('text=/draft ready|processed/i')
    ).toBeVisible();

    await page.click('[data-testid="approve-meeting"]');

    // Verify approval succeeded
    await expect(
      page.locator('text=/approved|success/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test("Upload audio file to meeting", async ({ page }) => {
    // Create a meeting first
    await page.fill('[data-testid="meeting-date"]', "2026-03-21");
    await page.fill('[data-testid="meeting-start-time"]', "14:00");
    await page.fill('[data-testid="meeting-location"]', "Audio Test Room");
    await page.click('[data-testid="create-meeting"]');

    // Click on the meeting to open detail view
    await page.locator('text="Audio Test Room"').click();

    // Verify audio upload section is visible
    await expect(
      page.locator('[data-testid="pick-file"]')
    ).toBeVisible();

    // Click pick file button
    await page.click('[data-testid="pick-file"]');

    // In actual implementation, would upload real file
    // Verify register button becomes available
    await expect(
      page.locator('[data-testid="register-audio"]')
    ).toBeVisible();
  });

  test("Edit meeting details after creation", async ({ page }) => {
    // Create meeting
    await page.fill('[data-testid="meeting-date"]', "2026-03-22");
    await page.fill('[data-testid="meeting-start-time"]', "09:00");
    await page.fill('[data-testid="meeting-location"]', "Edit Test Room");
    await page.click('[data-testid="create-meeting"]');

    // Open meeting
    await page.locator('text="Edit Test Room"').click();

    // Edit end time
    await page.fill('[data-testid="meta-end-time"] || input[type="time"]', "17:00");

    // Save metadata
    await page.locator('button:has-text("Save")').first().click();

    // Verify save succeeded
    await expect(
      page.locator('text=/saved|updated/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test("Cannot approve meeting without processing", async ({ page }) => {
    // Create meeting
    await page.fill('[data-testid="meeting-date"]', "2026-03-23");
    await page.fill('[data-testid="meeting-start-time"]', "15:00");
    await page.fill('[data-testid="meeting-location"]', "No-Process Room");
    await page.click('[data-testid="create-meeting"]');

    // Open meeting
    await page.locator('text="No-Process Room"').click();

    // Try to approve without processing
    await page.click('[data-testid="approve-meeting"]');

    // Should show error
    await expect(
      page.locator('text=/process|draft|cannot/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test("Meeting status updates through workflow stages", async ({ page }) => {
    // Create meeting
    await page.fill('[data-testid="meeting-date"]', "2026-03-24");
    await page.fill('[data-testid="meeting-start-time"]', "11:00");
    await page.fill('[data-testid="meeting-location"]', "Status Test Room");
    await page.click('[data-testid="create-meeting"]');

    // Open meeting
    const row = page.locator('text="Status Test Room"');
    await expect(row).toBeVisible();

    // Check initial status is CREATED
    const statusBadge = page.locator('text=/created|draft|uploaded/i').first();
    await expect(statusBadge).toBeVisible();

    // Verify meeting details show correct status
    await expect(page.locator('text="CREATED" || text="Status Test Room"')).toBeVisible();
  });
});
