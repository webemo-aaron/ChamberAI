import { test, expect } from "@playwright/test";
import { waitForApi } from "./utils.mjs";

test("action items CSV import/export", async ({ browser, request }) => {
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
      location: "CSV Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "csv"
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
  await page.locator(".meeting-card", { hasText: "CSV Hall" }).first().click();
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
  await page.locator("#csvApply").click();

  const descInputs = page.locator("#actionItemsList input[placeholder='Description']");
  await expect(descInputs).toHaveCount(2);
  await expect(descInputs.nth(0)).toHaveValue("Follow up with vendor");
  await expect(descInputs.nth(1)).toHaveValue("Send member update");

  const ownerInputs = page.locator("#actionItemsList input[placeholder='Owner']");
  await expect(ownerInputs.nth(0)).toHaveValue("Taylor Treasurer");
  await expect(ownerInputs.nth(1)).toHaveValue("Riley Secretary");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportActionCsv").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("action-items-");

  await context.close();
});
