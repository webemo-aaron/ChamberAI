import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

test.describe("Minutes Editing and Management", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("Edit draft minutes after generation", async ({ page, request }) => {
    const location = `Minutes Edit Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await request.post(`${API_BASE}/meetings/${meeting.id}/process`);

    // Wait until backend processing reaches DRAFT_READY to avoid async worker overwrite races.
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const statusRes = await request.get(`${API_BASE}/meetings/${meeting.id}`);
      const statusBody = await statusRes.json();
      if (statusBody?.status === "DRAFT_READY" || statusBody?.status === "APPROVED") {
        break;
      }
      await page.waitForTimeout(250);
    }

    await openMeeting(page, location);
    await expect(page.locator('[data-testid="collab-status"]')).toContainText("Collaboration active.");

    const updatedText = "Updated draft minutes for board review.";
    await page.locator('[data-testid="minutes-content"]').fill(updatedText);
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes(`/meetings/${meeting.id}/draft-minutes`) &&
        response.request().method() === "PUT" &&
        response.ok()
      ),
      page.locator('[data-testid="save-minutes"]').click()
    ]);
    await expect(page.locator('[data-testid="collab-status"]')).toContainText("Draft saved.");

    // Confirm persistence at API layer before forcing a UI reload.
    let persisted = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const draft = await request.get(`${API_BASE}/meetings/${meeting.id}/draft-minutes`);
      if (draft.ok()) {
        const body = await draft.json();
        if ((body?.content ?? "").includes(updatedText)) {
          persisted = true;
          break;
        }
      }
      await page.waitForTimeout(250);
    }
    expect(persisted).toBe(true);

    await page.locator("#refreshMeetings").click();
    await openMeeting(page, location);
    await expect(page.locator('[data-testid="minutes-content"]')).toHaveValue(updatedText);
  });

  test("Add action items to meeting", async ({ page, request }) => {
    const location = `Action Items Room ${Date.now()}`;
    await createMeeting(request, location);
    await openMeeting(page, location);
    await page.locator(".tab", { hasText: "Action Items" }).click();

    await page.locator('[data-testid="action-description"]').fill("Schedule sponsor outreach");
    await page.locator('[data-testid="action-owner"]').fill("Taylor Treasurer");
    await page.locator('[data-testid="action-due-date"]').fill("2026-04-05");
    await page.locator('[data-testid="add-action-item"]').click();

    const rows = page.locator("#actionItemsList .action-card");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator("input[placeholder='Description']")).toHaveValue("Schedule sponsor outreach");
    await expect(rows.first().locator("input[placeholder='Owner']")).toHaveValue("Taylor Treasurer");
  });

  test("Create and edit motions during meeting", async ({ page, request }) => {
    const location = `Motions Room ${Date.now()}`;
    await createMeeting(request, location);
    await openMeeting(page, location);
    await page.locator(".tab", { hasText: "Motions" }).click();

    await page.locator('[data-testid="motion-text"]').fill("Approve annual budget");
    await page.locator('[data-testid="motion-mover"]').fill("Alex Chair");
    await page.locator('[data-testid="motion-seconder"]').fill("Riley Secretary");
    await page.locator('[data-testid="motion-vote"]').fill("Voice vote");
    await page.locator('[data-testid="motion-outcome"]').fill("Passed");
    await page.locator('[data-testid="add-motion"]').click();

    await expect(page.locator("#motionsList")).toContainText("Approve annual budget");
    await expect(page.locator("#motionsList")).toContainText("Passed");
  });

  test("Export minutes in different formats", async ({ page, request }) => {
    const location = `Export Room ${Date.now()}`;
    await createMeeting(request, location);
    await openMeeting(page, location);
    await page.locator(".tab", { hasText: "Motions" }).click();

    await page.locator('[data-testid="export-pdf"]').click();
    await expect(page.locator("#exportResults")).toContainText("PDF export ready");

    await page.locator('[data-testid="export-docx"]').click();
    await expect(page.locator("#exportResults")).toContainText("DOCX export ready");
  });
});
