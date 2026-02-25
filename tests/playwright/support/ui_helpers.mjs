import { expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "../utils.mjs";

export { API_BASE, UI_BASE };

export async function bootstrapPage(page) {
  await page.goto(`${UI_BASE}/`);
  const loginModal = page.locator("#loginModal");
  const loginVisible = await loginModal.isVisible().catch(() => false);
  if (loginVisible) {
    await page.locator("#loginEmail").fill("admin@acme.com");
    await page.locator("#loginRole").selectOption("admin");
    await page.locator("#loginSubmit").click();
  }
  await page.locator("#apiBase").fill(API_BASE);
  await page.locator("#saveApiBase").click();
}

export async function createMeeting(request, location, overrides = {}) {
  await waitForApi(request, API_BASE);
  const payload = {
    date: "2026-03-20",
    start_time: "10:00",
    location,
    chair_name: "Alex Chair",
    secretary_name: "Riley Secretary",
    tags: "e2e",
    ...overrides
  };
  const createRes = await request.post(`${API_BASE}/meetings`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: payload
  });
  expect(createRes.ok()).toBeTruthy();
  return createRes.json();
}

export async function openMeeting(page, location) {
  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card", { hasText: location }).first().click();
  await expect(page.locator("#meetingStatus")).toBeVisible();
}
