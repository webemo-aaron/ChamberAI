import { test, expect } from "@playwright/test";
import { waitForApi } from "./utils.mjs";

test("approval gating and export flow", async ({ browser, request }) => {
  await waitForApi(request);
  const createRes = await request.post("http://127.0.0.1:4100/meetings", {
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

  await page.goto("http://127.0.0.1:5174/");
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill("http://127.0.0.1:4100");
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

  await context.close();
});
