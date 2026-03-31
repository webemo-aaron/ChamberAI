import { chromium } from "@playwright/test";

const APP_BASE = process.env.SHOWCASE_APP_BASE ?? "https://chamberai.mahoosuc.ai";
const API_BASE = process.env.SHOWCASE_API_BASE ?? "https://api.chamberai.mahoosuc.ai";
const TARGET_CITY = process.env.SHOWCASE_CITY_ID ?? "bethel-me";
const TARGET_MEETING = process.env.SHOWCASE_MEETING_TEXT ?? "Bethel Tourism Coordination Meeting";
const TARGET_BUSINESS = process.env.SHOWCASE_BUSINESS_TEXT ?? "Mountain View Lodging Co.";
const TARGET_REVIEWER = process.env.SHOWCASE_REVIEWER_TEXT ?? "Jordan Smith";
const TARGET_QUOTE = process.env.SHOWCASE_QUOTE_TEXT ?? "Visitor Intake Workflow";

const browser = await chromium.launch({
  headless: true,
  chromiumSandbox: false,
  args: ["--disable-setuid-sandbox"]
});
const page = await browser.newPage();

const result = {
  appBase: APP_BASE,
  apiBase: API_BASE,
  city: TARGET_CITY,
  dashboard: {},
  meetings: {},
  businessHub: {},
  errors: []
};

page.on("pageerror", (error) => result.errors.push(`pageerror:${error.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") {
    result.errors.push(`console:${msg.text()}`);
  }
});

await page.addInitScript(({ apiBase, cityId }) => {
  localStorage.setItem("camRole", "admin");
  localStorage.setItem("camEmail", "showcase-smoke@mahoosuc.ai");
  localStorage.setItem("camApiBase", apiBase);
  localStorage.setItem("camShowcaseCity", cityId);
}, { apiBase: API_BASE, cityId: TARGET_CITY });

try {
  await page.goto(`${APP_BASE}/#/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
  result.dashboard.title = await page.title();
  result.dashboard.cityLabel = await page.locator(".dashboard-city-pill").innerText();

  await page.goto(`${APP_BASE}/#/meetings`, { waitUntil: "networkidle", timeout: 30000 });
  result.meetings.matchCount = await page.locator(`text=${TARGET_MEETING}`).count();

  await page.goto(`${APP_BASE}/#/business-hub`, { waitUntil: "networkidle", timeout: 30000 });
  result.businessHub.matchCount = await page.locator(`text=${TARGET_BUSINESS}`).count();

  if (result.businessHub.matchCount > 0) {
    await page.locator('.business-list-item', { hasText: TARGET_BUSINESS }).first().click();
    await page.waitForFunction(() => window.location.hash.includes("/business-hub/"));
    result.businessHub.selectedBusiness = await page.locator(".business-name").first().innerText();

    await page.locator('.business-tab-bar .tab[data-tab="reviews"]').click();
    await page.locator("#tab-reviews").waitFor({ state: "visible", timeout: 10000 });
    await page
      .waitForFunction(
        (targetReviewer) => {
          const text = document.querySelector("#tab-reviews")?.innerText ?? "";
          return text.includes(targetReviewer) || !text.includes("Loading reviews...");
        },
        TARGET_REVIEWER,
        { timeout: 15000 }
      )
      .catch(() => {});
    result.businessHub.reviewMatchCount = await page.locator(`#tab-reviews >> text=${TARGET_REVIEWER}`).count();

    await page.locator('.business-tab-bar .tab[data-tab="quotes"]').click();
    await page.locator("#tab-quotes").waitFor({ state: "visible", timeout: 10000 });
    await page
      .waitForFunction(
        (targetQuote) => {
          const text = document.querySelector("#tab-quotes")?.innerText ?? "";
          return text.includes(targetQuote) || !text.includes("Loading quotes...");
        },
        TARGET_QUOTE,
        { timeout: 15000 }
      )
      .catch(() => {});
    result.businessHub.quoteMatchCount = await page.locator(`#tab-quotes >> text=${TARGET_QUOTE}`).count();
  }
} catch (error) {
  result.errors.push(`fatal:${error.message}`);
}

console.log(JSON.stringify(result, null, 2));
await browser.close();
