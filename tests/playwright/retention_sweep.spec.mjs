import { test, expect } from "@playwright/test";
import { waitForApi } from "./utils.mjs";

test("retention sweep runs from settings", async ({ browser, request }) => {
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
      location: "Retention Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "retention"
    }
  });
  const meeting = await createRes.json();

  await request.post(`http://127.0.0.1:4100/meetings/${meeting.id}/audio-sources`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: {
      type: "UPLOAD",
      file_uri: "retention_test.wav",
      duration_seconds: 60
    }
  });

  await request.put(`http://127.0.0.1:4100/meetings/${meeting.id}`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: { status: "APPROVED" }
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:5174/");
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill("http://127.0.0.1:4100");
  await page.locator("#saveApiBase").click();

  await page.locator("#runRetentionSweep").click();
  await expect(page.locator("#retentionResult")).toContainText("Sweep complete");

  await context.close();
});
