import { test, expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "./utils.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

test("approval gating and export flow @critical", async ({ browser, request }) => {
  await waitForApi(request);
  const createRes = await request.post(`${API_BASE}/meetings`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: {
      date: "2026-01-23",
      start_time: "18:00",
      location: "Approval Gate Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "approval"
    }
  });
  await createRes.json();

  const context = await browser.newContext();
  const page = await context.newPage();
  const guard = attachConsoleGuard(page);

  await page.goto(`${UI_BASE}/`);
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill(API_BASE);
  await page.locator("#saveApiBase").click();

  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card", { hasText: "Approval Gate Hall" }).first().click();
  await expect(page.locator("#meetingStatus")).toHaveText(/CREATED|UPLOADED|PROCESSING|DRAFT_READY|APPROVED/);

  await expect(page.locator("#approveMeeting")).toBeDisabled();

  await page.locator("#flagNoMotions").check();
  await page.locator("#flagNoAdjournment").check();
  await page.locator("#saveMeta").click();

  await page.locator(".tab", { hasText: "Action Items" }).click();
  await page.locator("#actionDescription").fill("Confirm signage vendor timeline");
  await page.locator("#actionOwner").fill("Taylor Treasurer");
  await page.locator("#actionDue").fill("2026-02-01");
  await page.locator("#addActionItem").click();

  await expect(page.locator("#approveMeeting")).toBeEnabled();
  await page.locator("#approveMeeting").click();
  await expect(page.locator("#meetingStatus")).toHaveText("APPROVED");

  await page.locator(".tab", { hasText: "Motions" }).click();
  await page.locator("#exportPdf").click();
  await expect(page.locator("#exportResults")).toContainText("PDF export ready");

  await page.locator("#exportDocx").click();
  await expect(page.locator("#exportResults")).toContainText("DOCX export ready");
  await guard.assertNoUnexpected();

  await context.close();
});
