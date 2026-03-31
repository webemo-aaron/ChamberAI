import { expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "../utils.mjs";

export { API_BASE, UI_BASE };

export async function bootstrapPage(page) {
  await page.goto(`${UI_BASE}/`);
  await page.evaluate((apiBase) => {
    localStorage.setItem("camRole", "admin");
    localStorage.setItem("camEmail", "admin@acme.com");
    localStorage.setItem("camDisplayName", "");
    localStorage.setItem("camShowcaseCity", "all");
    localStorage.setItem("camApiBase", apiBase);
  }, API_BASE);
  await page.reload({ waitUntil: "load" });
  await Promise.any([
    page.locator("summary.demo-summary").waitFor({ state: "visible", timeout: 1500 }),
    page.locator("#modalLoginSubmit").waitFor({ state: "visible", timeout: 1500 }),
    page.locator("#apiBase").waitFor({ state: "visible", timeout: 1500 })
  ]).catch(() => {});

  // Check for login page (full-page /login route) or modal (legacy)
  const loginPageContainer = page.locator("#loginPageContainer");
  const loginModal = page.locator("#loginModal");
  const demoSummary = page.locator("summary.demo-summary");
  const pageGoogleButton = page.locator("#loginGoogle");
  const roleBadge = page.locator("#roleBadge");

  const pageLoginVisible = await loginPageContainer.isVisible().catch(() => false);
  const modalLoginVisible = await loginModal.isVisible().catch(() => false);
  const demoSummaryVisible = await demoSummary.isVisible().catch(() => false);
  const pageGoogleVisible = await pageGoogleButton.isVisible().catch(() => false);

  if (pageLoginVisible || demoSummaryVisible || pageGoogleVisible) {
    if (demoSummaryVisible) {
      await demoSummary.click();
      await page.waitForSelector("#loginEmail");
    }

    await page.locator("#loginEmail").fill("admin@acme.com");
    await page.locator("#loginRole").selectOption("admin");
    await page.locator("#loginSubmit").click();

    // Wait for redirect to /meetings after login
    await page.waitForNavigation().catch(() => {
      // Navigation might happen via hash change, not full page load
      return page.waitForFunction(() =>
        window.location.hash === "#/meetings" ||
        !document.getElementById("loginPageContainer")?.style?.display?.includes("flex")
      );
    });
  } else if (modalLoginVisible) {
    await page.locator("#modalLoginEmail").fill("admin@acme.com");
    await page.locator("#modalLoginRole").selectOption("admin");
    await page.locator("#modalLoginSubmit").click();
  }

  const guestVisible = await roleBadge
    .filter({ hasText: "Role: Guest" })
    .isVisible()
    .catch(() => false);
  if (guestVisible) {
    await page.evaluate((apiBase) => {
      localStorage.setItem("camRole", "admin");
      localStorage.setItem("camEmail", "admin@acme.com");
      localStorage.setItem("camDisplayName", "");
      localStorage.setItem("camApiBase", apiBase);
    }, API_BASE);
    await page.reload({ waitUntil: "load" });

    const stillGuest = await roleBadge
      .filter({ hasText: "Role: Guest" })
      .isVisible()
      .catch(() => false);
    if (stillGuest) {
      await page.goto(`${UI_BASE}/#/login`);
      if (await page.locator("#loginEmail").isVisible().catch(() => false)) {
        await page.locator("#loginEmail").fill("admin@acme.com");
        await page.locator("#loginRole").selectOption("admin");
        await page.locator("#loginSubmit").click();
      } else if (await page.locator("#modalLoginEmail").isVisible().catch(() => false)) {
        await page.locator("#modalLoginEmail").fill("admin@acme.com");
        await page.locator("#modalLoginRole").selectOption("admin");
        await page.locator("#modalLoginSubmit").click();
      }
    }
  }

  await expect(roleBadge).not.toContainText("Role: Guest", { timeout: 5000 });

  // Configure API base directly; the settings field now lives in a hidden popover.
  await page.evaluate((apiBase) => {
    localStorage.setItem("camApiBase", apiBase);
  }, API_BASE);
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
  const refreshButton = page.locator("#refreshBtn");
  if (!(await refreshButton.isVisible().catch(() => false))) {
    await page.goto(`${UI_BASE}/#/meetings`);
    await refreshButton.waitFor({ state: "visible", timeout: 5000 });
  }

  const row = page.locator(".meeting-item", { hasText: location }).first();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await refreshButton.click();
    if (!(await row.isVisible().catch(() => false))) {
      await page.waitForTimeout(250);
      continue;
    }
    const meetingId = await row.getAttribute("data-meeting-id");
    try {
      await row.scrollIntoViewIfNeeded();
      await row.click();
      if (meetingId) {
        await page.waitForFunction(
          (expectedId) => window.location.hash.includes(`/meetings/${expectedId}`),
          meetingId
        );
      }
      const detailHeader = page.locator(".meeting-detail-pane .meeting-detail-header");
      await expect(detailHeader).toBeVisible({ timeout: 5000 });
      await expect(detailHeader).toContainText(location, { timeout: 5000 });
      await expect(page.locator("#minutes-panel")).toHaveAttribute("data-loaded", "true", {
        timeout: 5000
      });
      await expect(page.locator("#minutes-panel #minutesContent")).toBeVisible({ timeout: 5000 });
      return;
    } catch {
      await page.waitForTimeout(200);
    }
  }
  await expect(row).toBeVisible();
  const meetingId = await row.getAttribute("data-meeting-id");
  await row.scrollIntoViewIfNeeded();
  await row.click();
  if (meetingId) {
    await page.waitForFunction(
      (expectedId) => window.location.hash.includes(`/meetings/${expectedId}`),
      meetingId
    );
  }
  const detailHeader = page.locator(".meeting-detail-pane .meeting-detail-header");
  await expect(detailHeader).toBeVisible();
  await expect(detailHeader).toContainText(location);
  await expect(page.locator("#minutes-panel")).toHaveAttribute("data-loaded", "true", {
    timeout: 5000
  });
  await expect(page.locator("#minutes-panel #minutesContent")).toBeVisible({ timeout: 5000 });
}
