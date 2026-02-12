import { test, expect } from "@playwright/test";
import { waitForApi } from "./utils.mjs";

test("approval remains blocked without required fields", async ({ browser, request }) => {
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
      location: "Approval Negative Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "negative"
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
  await page.locator(".meeting-card", { hasText: "Approval Negative Hall" }).first().click();
  await expect(page.locator("#approveMeeting")).toBeDisabled();

  await page.locator(".tab", { hasText: "Action Items" }).click();
  await page.locator("#actionDescription").fill("Incomplete action item");
  await page.locator("#addActionItem").click();

  await expect(page.locator("#approveMeeting")).toBeDisabled();
  await expect(page.locator("#actionGate")).toContainText("Approval blocked");

  await context.close();
});
