import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

const authHeaders = {
  Authorization: "Bearer demo-token",
  "x-demo-email": "admin@acme.com",
  "Content-Type": "application/json"
};

test("approval remains blocked until required approval fields are satisfied", async ({
  page,
  request
}) => {
  const location = `Approval Negative Hall ${Date.now()}`;
  const meeting = await createMeeting(request, location, {
    date: "2026-01-23",
    start_time: "18:00",
    tags: "negative"
  });

  const blockedStatusRes = await request.get(`${API_BASE}/meetings/${meeting.id}/approval-status`, {
    headers: authHeaders
  });
  expect(blockedStatusRes.ok()).toBeTruthy();
  const blockedStatus = await blockedStatusRes.json();
  expect(blockedStatus.ok).toBe(false);
  expect(blockedStatus.has_motions).toBe(false);
  expect(blockedStatus.no_motions_flag).toBe(false);

  await bootstrapPage(page);
  await openMeeting(page, location);
  await expect(page.locator(".meeting-detail-header .badge")).toContainText(/created/i);

  await page.locator(".detail-tab-bar [data-tab='actions']").click();
  await page.waitForFunction(() => {
    const panel = document.querySelector("#actions-panel");
    return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
  });
  const actionsPanel = page.locator("#actions-panel");
  await actionsPanel.locator(".btn-add-action").click();
  await page.locator(".modal #actionDescription").fill("Incomplete action item");
  await page.locator(".modal #actionAssignee").fill("Taylor Treasurer");
  await page.locator(".modal #actionDue").fill("2026-02-10");
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes(`/meetings/${meeting.id}/actions`) &&
      response.request().method() === "POST" &&
      response.status() === 201
    ),
    page.locator(".modal .btn-save").click()
  ]);

  await expect(actionsPanel.locator(".actions-table")).toContainText("Incomplete action item");

  const stillBlockedRes = await request.get(`${API_BASE}/meetings/${meeting.id}/approval-status`, {
    headers: authHeaders
  });
  expect(stillBlockedRes.ok()).toBeTruthy();
  const stillBlocked = await stillBlockedRes.json();
  expect(stillBlocked.ok).toBe(false);
  expect(stillBlocked.has_adjournment_time).toBe(false);
  expect(stillBlocked.no_adjournment_time_flag).toBe(false);

  const approveRes = await request.post(`${API_BASE}/meetings/${meeting.id}/approve`, {
    headers: authHeaders
  });
  expect(approveRes.status()).toBe(422);
});
