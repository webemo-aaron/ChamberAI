import { test, expect } from "@playwright/test";
import { waitForApi } from "./utils.mjs";

test("public summary publish flow", async ({ browser, request }) => {
  await waitForApi(request);
  await request.post("http://127.0.0.1:4100/meetings", {
    headers: {
      Authorization: "Bearer demo-token",
      "x-demo-email": "admin@acme.com",
      "Content-Type": "application/json"
    },
    data: {
      date: "2026-01-23",
      start_time: "18:00",
      location: "Chamber Hall",
      chair_name: "Alex Chair",
      secretary_name: "Riley Secretary",
      tags: "demo"
    }
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`console error: ${msg.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    console.log(`page error: ${error.message}`);
  });
  page.on("dialog", async (dialog) => {
    console.log(`dialog: ${dialog.message()}`);
    await dialog.dismiss();
  });

  await page.goto("http://127.0.0.1:5174/");
  await page.locator("#loginEmail").fill("admin@acme.com");
  await page.locator("#loginRole").selectOption("admin");
  await page.locator("#loginSubmit").click();
  await page.locator("#apiBase").fill("http://127.0.0.1:4100");
  await page.locator("#saveApiBase").click();
  const state = await page.evaluate(() => ({
    role: localStorage.getItem("camRole"),
    email: localStorage.getItem("camEmail"),
    apiBase: document.getElementById("apiBase")?.value ?? ""
  }));
  console.log(`state: ${JSON.stringify(state)}`);
  await page.locator("#refreshMeetings").click();
  await page.locator(".meeting-card").first().click();
  await expect(page.locator("#meetingStatus")).toHaveText(/CREATED|UPLOADED|PROCESSING|DRAFT_READY|APPROVED/);

  const publicFlag = page.locator("#featureFlags input[data-flag='public_summary']");
  await publicFlag.check();
  await page.locator("#saveSettings").click();

  await page.locator("#publicSummaryTab").click();
  await page.locator("#tab-public-summary").waitFor({ state: "visible" });

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
  await context.close();
});
