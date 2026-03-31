import { test, expect } from "@playwright/test";
import { API_BASE, UI_BASE, bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

const authHeaders = {
  Authorization: "Bearer demo-token",
  "x-demo-email": "admin@acme.com",
  "Content-Type": "application/json"
};

test("public summary draft, save, and export flow @critical", async ({ page, request }) => {
  const meetingLocation = `Chamber Hall ${Date.now()}`;
  const meeting = await createMeeting(request, meetingLocation, {
    date: "2026-01-23",
    start_time: "18:00",
    tags: "demo"
  });
  await request.post(`${API_BASE}/meetings/${meeting.id}/minutes`, {
    headers: authHeaders,
    data: {
      text: "Approved downtown signage updates.\nCoordinate with public works by end of month."
    }
  });

  const guard = attachConsoleGuard(page);
  await bootstrapPage(page);
  await openMeeting(page, meetingLocation);
  await page.locator(".detail-tab-bar [data-tab='public-summary']").click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#public-summary-panel");
    return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
  });
  const summaryPanel = page.locator("#public-summary-panel");
  const summaryEditor = summaryPanel.locator(".summary-editor textarea.editor-input");
  await expect(summaryEditor).toBeVisible();

  await summaryPanel.locator(".summary-toolbar .btn-draft").click();
  await expect(summaryEditor).toHaveValue(new RegExp(meetingLocation));
  await expect(summaryEditor).toHaveValue(/Approved downtown signage updates\./);

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes(`/meetings/${meeting.id}/summary`) &&
      response.request().method() === "POST" &&
      response.ok()
    ),
    summaryPanel.locator(".summary-editor .btn-save").click()
  ]);
  await expect(page.locator("#toast")).toContainText(/Summary saved/i);

  const downloadPromise = page.waitForEvent("download");
  await summaryPanel.locator(".summary-toolbar .btn-export").click();
  await summaryPanel.locator('.export-menu [data-format="md"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("meeting-summary.md");

  await guard.assertNoUnexpected();
});

test("public summary persists when reopening a meeting", async ({ page, request }) => {
  const meetingLocation = `Chamber Hall Async ${Date.now()}`;
  const meeting = await createMeeting(request, meetingLocation, {
    date: "2026-01-23",
    start_time: "18:00",
    tags: "demo"
  });

  const guard = attachConsoleGuard(page);
  await bootstrapPage(page);
  await openMeeting(page, meetingLocation);
  await page.locator(".detail-tab-bar [data-tab='public-summary']").click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#public-summary-panel");
    return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
  });
  const summaryPanel = page.locator("#public-summary-panel");
  const summaryEditor = summaryPanel.locator(".summary-editor textarea.editor-input");
  await expect(summaryEditor).toBeVisible();
  await summaryEditor.fill("Typing before summary reload finishes");
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes(`/meetings/${meeting.id}/summary`) &&
      response.request().method() === "POST" &&
      response.ok()
    ),
    summaryPanel.locator(".summary-editor .btn-save").click()
  ]);

  await page.goto(`${UI_BASE}/#/meetings`);
  await openMeeting(page, meetingLocation);
  await page.locator(".detail-tab-bar [data-tab='public-summary']").click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#public-summary-panel");
    return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
  });
  const reopenedSummaryPanel = page.locator("#public-summary-panel");
  await expect(reopenedSummaryPanel.locator(".summary-editor textarea.editor-input")).toHaveValue(
    "Typing before summary reload finishes"
  );
  await guard.assertNoUnexpected();
});
