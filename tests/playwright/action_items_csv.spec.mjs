import { test, expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "./utils.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

test("action items CSV import/export @critical", async ({ browser, request }) => {
  await waitForApi(request);
  const location = `CSV Hall ${Date.now()}`;
  const createRes = await request.post(`${API_BASE}/meetings`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: {
      date: "2026-01-23",
      start_time: "18:00",
      location,
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "csv"
    }
  });
  const createdMeeting = await createRes.json();
  const createdMeetingId = createdMeeting?.id;

  const context = await browser.newContext();
  const page = await context.newPage();
  const guard = attachConsoleGuard(page);

  await page.goto(`${UI_BASE}/`);
  await page.waitForLoadState("networkidle");
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill(API_BASE);
  await page.locator("#saveApiBase").click();

  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card", { hasText: location }).first().click();
  await expect(page.locator("#meetingStatus")).toHaveText(/CREATED|UPLOADED|PROCESSING|DRAFT_READY|APPROVED/);

  await page.locator(".tab", { hasText: "Action Items" }).click();

  const csv = [
    "description,owner_name,due_date,status",
    "Follow up with vendor,Taylor Treasurer,2026-02-10,OPEN",
    "Send member update,Riley Secretary,2026-02-12,OPEN"
  ].join("\n");

  await page.setInputFiles("#actionCsvInput", {
    name: "action-items.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv)
  });

  await expect(page.locator("#csvPreviewModal")).toBeVisible();
  const applyResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      (createdMeetingId
        ? response.url().includes(`/meetings/${createdMeetingId}/action-items`)
        : response.url().includes("/action-items")) &&
      response.status() === 200,
    { timeout: 15000 }
  );
  await page.locator("#csvApply").click();
  await applyResponse;
  await expect(page.locator("#csvPreviewModal")).toBeHidden();

  const descInputs = page.locator("#actionItemsList input[placeholder='Description']");
  await expect(descInputs).toHaveCount(2, { timeout: 15000 });
  await expect(descInputs.nth(0)).toHaveValue("Follow up with vendor");
  await expect(descInputs.nth(1)).toHaveValue("Send member update");

  const ownerInputs = page.locator("#actionItemsList input[placeholder='Owner']");
  await expect(ownerInputs.nth(0)).toHaveValue("Taylor Treasurer");
  await expect(ownerInputs.nth(1)).toHaveValue("Riley Secretary");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportActionCsv").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("action-items-");
  await guard.assertNoUnexpected();

  await context.close();
});
