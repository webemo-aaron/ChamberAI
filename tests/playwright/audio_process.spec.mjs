import { test, expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "./utils.mjs";

test("audio upload + process flow", async ({ browser, request }) => {
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
      location: "Audio Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "audio"
    }
  });
  await createRes.json();

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${UI_BASE}/`);
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill(API_BASE);
  await page.locator("#saveApiBase").click();

  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card", { hasText: "Audio Hall" }).first().click();
  await expect(page.locator("#meetingStatus")).toHaveText(/CREATED|UPLOADED|PROCESSING|DRAFT_READY|APPROVED/);

  await page.setInputFiles("#fileInput", {
    name: "audio.wav",
    mimeType: "audio/wav",
    buffer: Buffer.from("RIFF0000WAVEfmt ")
  });
  await page.locator("#registerAudio").click();
  await expect(page.locator("#meetingStatus")).toHaveText(/UPLOADED|PROCESSING|DRAFT_READY/);

  await page.locator("#processMeeting").click();
  await expect(page.locator("#meetingStatus")).toHaveText(/PROCESSING|DRAFT_READY/);

  await expect.poll(async () => {
    await page.locator("#refreshMeetings").click();
    await page.locator(".meeting-card", { hasText: "Audio Hall" }).first().click();
    return page.locator("#meetingStatus").textContent();
  }, { timeout: 15000 }).toBe("DRAFT_READY");

  await expect(page.locator("#minutesContent")).toHaveValue(/Draft Minutes|Worker stub generated/);

  await context.close();
});
