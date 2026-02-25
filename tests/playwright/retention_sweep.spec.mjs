import { test, expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "./utils.mjs";

test("retention sweep runs from settings", async ({ browser, request }) => {
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
      location: "Retention Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "retention"
    }
  });
  const meeting = await createRes.json();

  await request.post(`${API_BASE}/meetings/${meeting.id}/audio-sources`, {
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

  await request.put(`${API_BASE}/meetings/${meeting.id}`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: { status: "APPROVED" }
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${UI_BASE}/`);
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill(API_BASE);
  await page.locator("#saveApiBase").click();

  await page.locator("#runRetentionSweep").click();
  await expect(page.locator("#retentionResult")).toContainText("Sweep complete");

  await context.close();
});
