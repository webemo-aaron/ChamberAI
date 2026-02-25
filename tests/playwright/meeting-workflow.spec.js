import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

const authHeaders = {
  Authorization: "Bearer demo-token",
  "x-demo-email": "admin@acme.com",
  "Content-Type": "application/json"
};

test.describe("Meeting Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapPage(page);
  });

  test("Complete meeting workflow: create -> upload -> process -> approve @critical", async ({ page, request }) => {
    const guard = attachConsoleGuard(page);
    const location = `Workflow Full Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);

    await page.locator("#registerAudio").click();
    await expect(page.locator("#audioSources")).toContainText("No audio sources yet.");

    await request.post(`${API_BASE}/meetings/${meeting.id}/audio-sources`, {
      headers: authHeaders,
      data: { type: "UPLOAD", file_uri: "workflow.wav", duration_seconds: 1200 }
    });
    await page.locator("#refreshMeetings").click();
    await openMeeting(page, location);
    await expect(page.locator("#audioSources")).toContainText("workflow.wav");

    await page.locator('[data-testid="process-meeting"]').click();
    await expect(page.locator("#meetingStatus")).toHaveText("DRAFT_READY");

    await page.locator("#flagNoMotions").check();
    await page.locator("#flagNoAdjournment").check();
    await page.locator("#saveMeta").click();
    await page.locator(".tab", { hasText: "Action Items" }).click();
    await page.locator("#actionDescription").fill("Send recap");
    await page.locator("#actionOwner").fill("Riley Secretary");
    await page.locator("#actionDue").fill("2026-04-01");
    await page.locator('[data-testid="add-action-item"]').click();

    await expect(page.locator('[data-testid="approve-meeting"]')).toBeEnabled();
    await page.locator('[data-testid="approve-meeting"]').click();
    await expect(page.locator("#meetingStatus")).toHaveText("APPROVED");
    await guard.assertNoUnexpected();
  });

  test("Upload audio file to meeting", async ({ page, request }) => {
    const location = `Audio Upload Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);

    await request.post(`${API_BASE}/meetings/${meeting.id}/audio-sources`, {
      headers: authHeaders,
      data: { type: "UPLOAD", file_uri: "meeting.wav", duration_seconds: 900 }
    });
    await page.locator("#refreshMeetings").click();
    await openMeeting(page, location);
    await expect(page.locator("#audioSources")).toContainText("meeting.wav");
  });

  test("Edit meeting details after creation", async ({ page, request }) => {
    const location = `Edit Test Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);

    await page.locator("#metaEndTime").fill("19:30");
    await page.locator("#metaTags").fill("edited,board");
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes(`/meetings/${meeting.id}`) && response.request().method() === "PUT" && response.ok()
      ),
      page.locator("#saveMeta").click()
    ]);
    await expect(page.locator("#metaEndTime")).toHaveValue("19:30");

    const res = await request.get(`${API_BASE}/meetings/${meeting.id}`);
    const data = await res.json();
    expect(data.end_time).toBe("19:30");
    expect(data.tags).toContain("edited");
  });

  test("Cannot approve meeting without processing", async ({ page, request }) => {
    const location = `Approval Gate Room ${Date.now()}`;
    await createMeeting(request, location);
    await openMeeting(page, location);
    await expect(page.locator('[data-testid="approve-meeting"]')).toBeDisabled();
  });

  test("Meeting status updates through workflow stages", async ({ page, request }) => {
    const location = `Status Test Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);
    await expect(page.locator("#meetingStatus")).toHaveText("CREATED");

    await request.post(`${API_BASE}/meetings/${meeting.id}/audio-sources`, {
      headers: authHeaders,
      data: { type: "UPLOAD", file_uri: "status.wav", duration_seconds: 600 }
    });
    await page.locator("#refreshMeetings").click();
    await openMeeting(page, location);
    await expect(page.locator("#meetingStatus")).toHaveText("UPLOADED");

    await page.locator('[data-testid="process-meeting"]').click();
    await expect(page.locator("#meetingStatus")).toHaveText("DRAFT_READY");
  });
});
