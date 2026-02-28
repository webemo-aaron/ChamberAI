import { test, expect } from "@playwright/test";
import { bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

async function ensureVersionHistoryHasTwoPages(page, prefix) {
  for (let i = 1; i <= 12; i += 1) {
    const pageLabel = (await page.locator('[data-testid="version-history-page"]').textContent())?.trim() ?? "";
    if (pageLabel === "Page 1/2") return;
    await page.locator('[data-testid="minutes-content"]').fill(`${prefix}-extra-v${i}-${Date.now()}`);
    await page.locator('[data-testid="save-minutes"]').click();
    await expect(page.locator('[data-testid="collab-status"]')).toContainText("Draft saved.");
  }
  await expect(page.locator('[data-testid="version-history-page"]')).toHaveText("Page 1/2");
}

test.describe("Collaboration and Version History", () => {
  test("real-time collaboration supports multi-user editing", async ({ page, request }) => {
    const location = `Collab Room ${Date.now()}`;
    await createMeeting(request, location);

    const pageB = await page.context().newPage();

    await bootstrapPage(page);
    await bootstrapPage(pageB);
    await openMeeting(page, location);
    await openMeeting(pageB, location);
    await expect(page.locator('[data-testid="collab-status"]')).toContainText("Collaboration active.");
    await expect(pageB.locator('[data-testid="collab-status"]')).toContainText("Collaboration active.");

    const content = `Shared draft ${Date.now()}`;
    await page.locator('[data-testid="minutes-content"]').fill(content);
    await page.locator('[data-testid="save-minutes"]').click();
    await expect(pageB.locator('[data-testid="minutes-content"]')).toHaveValue(content, { timeout: 20_000 });
    await expect(pageB.locator('[data-testid="collab-status"]')).toContainText("Synced from");

    await pageB.close();
  });

  test("conflict resolution reloads latest server draft", async ({ page, request }) => {
    const location = `Conflict Room ${Date.now()}`;
    await createMeeting(request, location);

    const pageB = await page.context().newPage();
    await bootstrapPage(page);
    await bootstrapPage(pageB);
    await openMeeting(page, location);
    await openMeeting(pageB, location);

    const sourceContent = `Server copy ${Date.now()}`;
    await page.locator('[data-testid="minutes-content"]').fill(sourceContent);
    await page.locator('[data-testid="save-minutes"]').click();

    await pageB.locator('[data-testid="minutes-content"]').fill(`stale update ${Date.now()}`);
    await pageB.locator('[data-testid="save-minutes"]').click();

    await expect(pageB.locator('[data-testid="collab-status"]')).toContainText("Conflict detected");
    await expect(pageB.locator('[data-testid="minutes-content"]')).toHaveValue(sourceContent);
    await pageB.close();
  });

  test("version history supports rollback", async ({ page, request }) => {
    const location = `Version Room ${Date.now()}`;
    await createMeeting(request, location);
    const pageB = await page.context().newPage();
    await bootstrapPage(page);
    await bootstrapPage(pageB);
    await openMeeting(page, location);
    await openMeeting(pageB, location);

    await page.locator('[data-testid="minutes-content"]').fill("v1 baseline minutes");
    await page.locator('[data-testid="save-minutes"]').click();
    await page.locator('[data-testid="minutes-content"]').fill("v2 changed minutes");
    await page.locator('[data-testid="save-minutes"]').click();

    const historyRows = page.locator("#versionHistoryList .version-item");
    await expect(historyRows).toHaveCount(2);
    await historyRows.nth(1).locator("button").click();
    await expect(page.locator('[data-testid="minutes-content"]')).toHaveValue("v1 baseline minutes");
    await expect(pageB.locator('[data-testid="minutes-content"]')).toHaveValue("v1 baseline minutes");
    await pageB.close();
  });

  test("version history pagination supports next and previous", async ({ page, request }) => {
    const location = `Version Paging Room ${Date.now()}`;
    await createMeeting(request, location);
    await bootstrapPage(page);
    await openMeeting(page, location);

    for (let i = 1; i <= 7; i += 1) {
      await page.locator('[data-testid="minutes-content"]').fill(`v${i} minutes`);
      await page.locator('[data-testid="save-minutes"]').click();
    }

    await ensureVersionHistoryHasTwoPages(page, "paging");
    await expect(page.locator('[data-testid="version-history-page"]')).toHaveText("Page 1/2");
    await expect(page.locator("#versionHistoryList .version-item")).toHaveCount(5);
    await page.locator('[data-testid="version-history-next"]').click();
    await expect(page.locator('[data-testid="version-history-page"]')).toHaveText("Page 2/2");
    await expect(page.locator('[data-testid="version-history-prev"]')).toBeEnabled();
    await page.locator('[data-testid="version-history-prev"]').click();
    await expect(page.locator('[data-testid="version-history-page"]')).toHaveText("Page 1/2");
  });

  test("version history empty state keeps page controls consistent", async ({ page, request }) => {
    const location = `Version Empty Room ${Date.now()}`;
    await createMeeting(request, location);
    await bootstrapPage(page);
    await openMeeting(page, location);

    await expect(page.locator("#versionHistoryList")).toContainText("No saved versions yet.");
    await expect(page.locator('[data-testid="version-history-page"]')).toHaveText("Page 1/1");
    await expect(page.locator('[data-testid="version-history-prev"]')).toBeDisabled();
    await expect(page.locator('[data-testid="version-history-next"]')).toBeDisabled();
  });

  test("version history last page disables next and avoids extra fetch", async ({ page, request }) => {
    const location = `Version Last Page Room ${Date.now()}`;
    await createMeeting(request, location);
    await bootstrapPage(page);
    await openMeeting(page, location);

    for (let i = 1; i <= 6; i += 1) {
      await page.locator('[data-testid="minutes-content"]').fill(`last-page-v${i}`);
      await page.locator('[data-testid="save-minutes"]').click();
    }

    await ensureVersionHistoryHasTwoPages(page, "last-page");
    let requestedPastLastPage = false;
    page.on("request", (req) => {
      const url = req.url();
      if (!url.includes("/draft-minutes/versions")) return;
      if (url.includes("offset=10")) requestedPastLastPage = true;
    });

    await expect(page.locator('[data-testid="version-history-page"]')).toHaveText("Page 1/2");
    await expect(page.locator("#versionHistoryList .version-item")).toHaveCount(5);
    const nextButton = page.locator('[data-testid="version-history-next"]');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await expect(page.locator('[data-testid="version-history-page"]')).toHaveText("Page 2/2");
    await expect(page.locator('[data-testid="version-history-next"]')).toBeDisabled();

    await page.locator('[data-testid="version-history-next"]').evaluate((btn) => btn.click());
    await page.waitForTimeout(400);
    expect(requestedPastLastPage).toBe(false);
  });
});
