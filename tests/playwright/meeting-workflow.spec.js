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

  test("Complete meeting workspace flow: minutes -> actions @critical", async ({ page, request }) => {
    const guard = attachConsoleGuard(page);
    const location = `Workflow Full Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);

    const audioUploadResponse = page.waitForResponse((response) =>
      response.url().includes(`/meetings/${meeting.id}/minutes/audio`) &&
      response.request().method() === "POST" &&
      response.status() === 202
    );
    await page
      .locator('.audio-upload-zone input[type="file"]')
      .setInputFiles({
        name: "workflow.wav",
        mimeType: "audio/wav",
        buffer: Buffer.from("RIFF")
      });
    await audioUploadResponse;
    await expect(page.locator("#toast")).toContainText(/Audio uploaded/i);

    await page.locator("#minutesContent").fill(
      "Budget review completed.\nMembership campaign approved."
    );
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes(`/meetings/${meeting.id}/minutes`) &&
        response.request().method() === "POST" &&
        response.ok()
      ),
      page.locator(".minutes-editor .btn-save").click()
    ]);

    await page.locator(".detail-tab-bar [data-tab='actions']").click();
    await page.waitForFunction(() => {
      const panel = document.querySelector("#actions-panel");
      return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
    });
    const actionsPanel = page.locator("#actions-panel");
    await expect(actionsPanel.locator(".btn-add-action")).toBeVisible();
    await actionsPanel.locator(".btn-add-action").click();
    await page.locator(".modal #actionDescription").fill("Send recap");
    await page.locator(".modal #actionAssignee").fill("Riley Secretary");
    await page.locator(".modal #actionDue").fill("2026-04-01");
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes(`/meetings/${meeting.id}/actions`) &&
        response.request().method() === "POST" &&
        response.status() === 201
      ),
      page.locator(".modal .btn-save").click()
    ]);

    await expect(actionsPanel.locator(".actions-table")).toContainText("Send recap");
    await expect(actionsPanel.locator(".actions-table")).toContainText("Riley Secretary");
    await guard.assertNoUnexpected();
  });

  test("Upload audio file to meeting", async ({ page, request }) => {
    const location = `Audio Upload Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);

    const uploadResponse = page.waitForResponse((response) =>
      response.url().includes(`/meetings/${meeting.id}/minutes/audio`) &&
      response.request().method() === "POST" &&
      response.status() === 202
    );
    await page
      .locator('.audio-upload-zone input[type="file"]')
      .setInputFiles({
        name: "meeting.wav",
        mimeType: "audio/wav",
        buffer: Buffer.from("RIFF")
      });
    await uploadResponse;
    await expect(page.locator("#toast")).toContainText(/Audio uploaded/i);
  });

  test("Save meeting minutes after creation", async ({ page, request }) => {
    const location = `Minutes Save Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);

    await page.locator("#minutesContent").fill("Approved downtown signage updates.");
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes(`/meetings/${meeting.id}/minutes`) &&
        response.request().method() === "POST" &&
        response.ok()
      ),
      page.locator(".minutes-editor .btn-save").click()
    ]);

    const res = await request.get(`${API_BASE}/meetings/${meeting.id}/minutes`, {
      headers: authHeaders
    });
    const data = await res.json();
    expect(data.text).toContain("Approved downtown signage updates.");
  });

  test("Action items tab starts empty before items are added", async ({ page, request }) => {
    const location = `Action Empty Room ${Date.now()}`;
    await createMeeting(request, location);
    await openMeeting(page, location);
    await page.locator(".detail-tab-bar [data-tab='actions']").click();
    await page.waitForFunction(() => {
      const panel = document.querySelector("#actions-panel");
      return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
    });
    const actionsPanel = page.locator("#actions-panel");
    await expect(actionsPanel.locator(".actions-list-container")).toContainText("No action items yet.");
  });

  test("Meeting status updates through backend workflow stages", async ({ page, request }) => {
    const location = `Status Test Room ${Date.now()}`;
    const meeting = await createMeeting(request, location);
    await openMeeting(page, location);
    await expect(page.locator(".meeting-detail-header .badge")).toContainText(/created/i);

    await request.post(`${API_BASE}/meetings/${meeting.id}/audio-sources`, {
      headers: authHeaders,
      data: { type: "UPLOAD", file_uri: "status.wav", duration_seconds: 600 }
    });
    await page.goto("about:blank");
    await openMeeting(page, location);
    await expect(page.locator(".meeting-detail-header .badge")).toContainText(/uploaded/i);

    await request.post(`${API_BASE}/meetings/${meeting.id}/process`, {
      headers: authHeaders
    });
    await page.goto("about:blank");
    await openMeeting(page, location);
    await expect(page.locator(".meeting-detail-header .badge")).toContainText(/processing|draft/i);

    await request.put(`${API_BASE}/meetings/${meeting.id}`, {
      headers: authHeaders,
      data: {
        no_motions: true,
        no_adjournment_time: true
      }
    });
    await request.post(`${API_BASE}/meetings/${meeting.id}/actions`, {
      headers: authHeaders,
      data: {
        description: "Confirm final notes",
        assignee: "Riley Secretary",
        dueDate: "2026-04-02",
        status: "not-started"
      }
    });
    await request.post(`${API_BASE}/meetings/${meeting.id}/approve`, {
      headers: authHeaders
    });
    await page.goto("about:blank");
    await openMeeting(page, location);
    await expect(page.locator(".meeting-detail-header .badge")).toContainText(/approved/i);
  });
});
