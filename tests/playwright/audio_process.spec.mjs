import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

const authHeaders = {
  Authorization: "Bearer demo-token",
  "x-demo-email": "admin@acme.com",
  "Content-Type": "application/json"
};

test("audio upload and processing flow reaches draft-ready state", async ({ page, request }) => {
  const location = `Audio Hall ${Date.now()}`;
  const meeting = await createMeeting(request, location, {
    date: "2026-01-23",
    start_time: "18:00",
    tags: "audio"
  });

  await bootstrapPage(page);
  await openMeeting(page, location);
  await expect(page.locator(".meeting-detail-header .badge")).toContainText(/created/i);

  const uploadResponse = page.waitForResponse((response) =>
    response.url().includes(`/meetings/${meeting.id}/minutes/audio`) &&
    response.request().method() === "POST" &&
    response.status() === 202
  );
  await page.locator('.audio-upload-zone input[type="file"]').setInputFiles({
    name: "audio.wav",
    mimeType: "audio/wav",
    buffer: Buffer.from("RIFF0000WAVEfmt ")
  });
  await uploadResponse;
  await expect(page.locator("#toast")).toContainText(/Audio uploaded/i);

  const registerRes = await request.post(`${API_BASE}/meetings/${meeting.id}/audio-sources`, {
    headers: authHeaders,
    data: {
      type: "UPLOAD",
      file_uri: "audio.wav",
      duration_seconds: 120
    }
  });
  expect(registerRes.ok()).toBeTruthy();

  const audioSourcesRes = await request.get(`${API_BASE}/meetings/${meeting.id}/audio-sources`, {
    headers: authHeaders
  });
  expect(audioSourcesRes.ok()).toBeTruthy();
  const audioSources = await audioSourcesRes.json();
  expect(Array.isArray(audioSources)).toBe(true);

  const processRes = await request.post(`${API_BASE}/meetings/${meeting.id}/process`, {
    headers: authHeaders
  });
  expect(processRes.ok()).toBeTruthy();

  await expect
    .poll(async () => {
      const statusRes = await request.get(`${API_BASE}/meetings/${meeting.id}/process-status`, {
        headers: authHeaders
      });
      const status = await statusRes.json();
      return status.status;
    }, { timeout: 15000 })
    .toBe("DRAFT_READY");

  await page.goto("about:blank");
  await openMeeting(page, location);
  await expect(page.locator(".meeting-detail-header .badge")).toContainText(/draft_ready/i);
  await expect(page.locator("#minutesContent")).toHaveValue(/Draft Minutes|Worker stub generated/);
});
