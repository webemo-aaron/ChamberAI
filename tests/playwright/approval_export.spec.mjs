import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

const authHeaders = {
  Authorization: "Bearer demo-token",
  "x-demo-email": "admin@acme.com",
  "Content-Type": "application/json"
};

test("approval gating and export flow @critical", async ({ page, request }) => {
  const meetingLocation = `Approval Gate Hall ${Date.now()}`;
  const meeting = await createMeeting(request, meetingLocation, {
    date: "2026-01-23",
    start_time: "18:00",
    tags: "approval"
  });

  const guard = attachConsoleGuard(page);

  const blockedStatusRes = await request.get(`${API_BASE}/meetings/${meeting.id}/approval-status`, {
    headers: authHeaders
  });
  expect(blockedStatusRes.ok()).toBeTruthy();
  const blockedStatus = await blockedStatusRes.json();
  expect(blockedStatus.ok).toBe(false);

  const actionCreateRes = await request.post(`${API_BASE}/meetings/${meeting.id}/actions`, {
    headers: authHeaders,
    data: {
      description: "Confirm signage vendor timeline",
      assignee: "Taylor Treasurer",
      dueDate: "2026-02-01",
      status: "not-started"
    }
  });
  expect(actionCreateRes.ok()).toBeTruthy();

  const metadataRes = await request.put(`${API_BASE}/meetings/${meeting.id}`, {
    headers: authHeaders,
    data: {
      no_motions: true,
      no_adjournment_time: true
    }
  });
  expect(metadataRes.ok()).toBeTruthy();

  const readyStatusRes = await request.get(`${API_BASE}/meetings/${meeting.id}/approval-status`, {
    headers: authHeaders
  });
  expect(readyStatusRes.ok()).toBeTruthy();
  const readyStatus = await readyStatusRes.json();
  expect(readyStatus.ok).toBe(true);

  const approveRes = await request.post(`${API_BASE}/meetings/${meeting.id}/approve`, {
    headers: authHeaders
  });
  expect(approveRes.ok()).toBeTruthy();
  const approvedMeeting = await approveRes.json();
  expect(approvedMeeting.status).toBe("APPROVED");

  await bootstrapPage(page);
  await openMeeting(page, meetingLocation);
  await expect(page.locator(".meeting-detail-header")).toContainText("APPROVED");

  const snapshotDownloadPromise = page.waitForEvent("download");
  await page.locator("#exportMeetingBtn").click();
  const snapshotDownload = await snapshotDownloadPromise;
  expect(snapshotDownload.suggestedFilename()).toContain("approval-gate-hall");

  await page.locator("#moreActionsBtn").click();
  await page.locator('#meetingActionMenu [data-action="open-summary"]').click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#public-summary-panel");
    return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
  });
  const summaryPanel = page.locator("#public-summary-panel");
  const summaryEditor = summaryPanel.locator(".summary-editor textarea.editor-input");
  await expect(summaryEditor).toBeVisible();

  await summaryPanel.locator(".btn-draft").click();
  await expect(summaryEditor).not.toHaveValue("");

  await summaryPanel.locator(".btn-export").click();
  const summaryDownloadPromise = page.waitForEvent("download");
  await summaryPanel.locator('.export-menu [data-format="md"]').click();
  const summaryDownload = await summaryDownloadPromise;
  expect(summaryDownload.suggestedFilename()).toBe("meeting-summary.md");

  await guard.assertNoUnexpected();
});
