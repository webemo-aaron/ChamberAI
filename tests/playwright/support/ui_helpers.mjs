import { expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "../utils.mjs";

export { API_BASE, UI_BASE };

export async function bootstrapPage(page) {
  await page.goto(`${UI_BASE}/`);

  // Check for login page (full-page /login route) or modal (legacy)
  const loginPageContainer = page.locator("#loginPageContainer");
  const loginModal = page.locator("#loginModal");

  const pageLoginVisible = await loginPageContainer.isVisible().catch(() => false);
  const modalLoginVisible = await loginModal.isVisible().catch(() => false);

  if (pageLoginVisible || modalLoginVisible) {
    // Both page and modal use same form IDs, so we can use the same logic
    await page.locator("#loginEmail").fill("admin@acme.com");
    await page.locator("#loginRole").selectOption("admin");
    await page.locator("#loginSubmit").click();

    // Wait for redirect to /meetings after login
    if (pageLoginVisible) {
      await page.waitForNavigation().catch(() => {
        // Navigation might happen via hash change, not full page load
        return page.waitForFunction(() =>
          window.location.hash === "#/meetings" ||
          !document.getElementById("loginPageContainer")?.style?.display?.includes("flex")
        );
      });
    }
  }

  // Configure API base
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
  const card = page.locator(".meeting-card", { hasText: location }).first();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.locator("#refreshMeetings").click();
    if (!(await card.isVisible().catch(() => false))) {
      await page.waitForTimeout(250);
      continue;
    }
    try {
      await card.click();
      await expect(page.locator("#meetingStatus")).toBeVisible({ timeout: 2000 });
      return;
    } catch {
      await page.waitForTimeout(200);
    }
  }
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator("#meetingStatus")).toBeVisible();
}
