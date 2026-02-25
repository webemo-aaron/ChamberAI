import { test, expect } from "@playwright/test";
import { API_BASE, UI_BASE, waitForApi } from "./utils.mjs";
import { attachConsoleGuard } from "./support/console_guard.mjs";

test("public summary publish flow @critical", async ({ browser, request }) => {
  await waitForApi(request);
  const meetingLocation = `Chamber Hall ${Date.now()}`;
  await request.post(`${API_BASE}/meetings`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: {
      date: "2026-01-23",
      start_time: "18:00",
      location: meetingLocation,
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "demo"
    }
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  const guard = attachConsoleGuard(page);
  page.on("dialog", async (dialog) => {
    await dialog.dismiss();
  });

  await page.goto(`${UI_BASE}/`);
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill(API_BASE);
  await page.locator("#saveApiBase").click();
  const state = await page.evaluate(() => ({
    role: localStorage.getItem("camRole"),
    email: localStorage.getItem("camEmail"),
    apiBase: document.getElementById("apiBase")?.value ?? ""
  }));
  console.log(`state: ${JSON.stringify(state)}`);
  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card", { hasText: meetingLocation }).first().click();
  await expect(page.locator("#meetingStatus")).toHaveText(/CREATED|UPLOADED|PROCESSING|DRAFT_READY|APPROVED/);

  const publicFlag = page.locator("#featureFlags input[data-flag='public_summary']");
  await publicFlag.check();
  await page.locator("#saveSettings").click();

  await page.locator("#publicSummaryTab").click();
  await page.locator("#tab-public-summary").waitFor({ state: "visible" });
  const summarySections = page.locator("#tab-public-summary details.disclosure").first();
  if (!(await summarySections.evaluate((el) => el.hasAttribute("open")))) {
    await summarySections.locator("summary").click();
  }

  await page.locator("#publicSummaryTitle").fill("Board meeting highlights");
  await expect(page.locator("#publicSummaryTitle")).toHaveValue("Board meeting highlights");
  await page.locator("#publicSummaryHighlights").fill("Approved downtown signage updates.");
  await expect(page.locator("#publicSummaryHighlights")).toHaveValue("Approved downtown signage updates.");
  await page.locator("#publicSummaryImpact").fill("Improves visitor navigation and local visibility.");
  await expect(page.locator("#publicSummaryImpact")).toHaveValue("Improves visitor navigation and local visibility.");
  await page.locator("#publicSummaryMotions").fill("Motion to proceed approved.");
  await expect(page.locator("#publicSummaryMotions")).toHaveValue("Motion to proceed approved.");
  await page.locator("#publicSummaryActions").fill("Coordinate with public works by end of month.");
  await expect(page.locator("#publicSummaryActions")).toHaveValue("Coordinate with public works by end of month.");
  await page.locator("#publicSummaryCTA").fill("Members can share feedback via email.");
  await expect(page.locator("#publicSummaryCTA")).toHaveValue("Members can share feedback via email.");

  await page.locator("#composePublicSummary").click();
  await expect(page.locator("#publicSummaryContent")).toHaveValue(/Board meeting highlights/);

  await expect(page.locator("#publishPublicSummary")).toBeDisabled();

  await page.locator("#summaryNoConfidential").check();
  await page.locator("#summaryNamesApproved").check();
  await page.locator("#summaryMotionsReviewed").check();
  await page.locator("#summaryActionsReviewed").check();
  await page.locator("#summaryChairApproved").check();

  await page.locator("#savePublicSummary").click();
  await expect(page.locator("#publishPublicSummary")).toBeEnabled();
  await page.locator("#publishPublicSummary").click();

  await expect(page.locator("#publicSummaryPublishStatus")).toContainText("Published");
  await guard.assertNoUnexpected();
  await context.close();
});

test("public summary async refresh does not overwrite in-progress edits", async ({ browser, request }) => {
  await waitForApi(request);
  const meetingLocation = `Chamber Hall Async ${Date.now()}`;
  await request.post(`${API_BASE}/meetings`, {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: {
      date: "2026-01-23",
      start_time: "18:00",
      location: meetingLocation,
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "demo"
    }
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  const guard = attachConsoleGuard(page);

  await page.goto(`${UI_BASE}/`);
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill(API_BASE);
  await page.locator("#saveApiBase").click();
  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card", { hasText: meetingLocation }).first().click();

  const publicFlag = page.locator("#featureFlags input[data-flag='public_summary']");
  await publicFlag.check();
  await page.locator("#saveSettings").click();

  let intercepted = false;
  let releaseSummaryFetch;
  const summaryFetchRelease = new Promise((resolve) => {
    releaseSummaryFetch = resolve;
  });
  await page.route(`${API_BASE}/meetings/**/public-summary`, async (route) => {
    if (route.request().method() === "GET" && !intercepted) {
      intercepted = true;
      await summaryFetchRelease;
    }
    await route.continue();
  });

  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card", { hasText: meetingLocation }).first().click();
  await page.locator("#publicSummaryTab").click();
  await page.locator("#tab-public-summary").waitFor({ state: "visible" });

  await page.locator("#publicSummaryTitle").fill("Typing before async summary load finishes");
  await expect(page.locator("#publicSummaryTitle")).toHaveValue("Typing before async summary load finishes");

  releaseSummaryFetch();
  await page.waitForTimeout(400);

  expect(intercepted).toBe(true);
  await expect(page.locator("#publicSummaryTitle")).toHaveValue("Typing before async summary load finishes");
  await guard.assertNoUnexpected();
  await context.close();
});
