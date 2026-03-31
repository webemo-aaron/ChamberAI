import { test, expect } from "@playwright/test";
import { bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

test.describe("Export Features", () => {
  test.beforeEach(async ({ page, request }) => {
    const location = `Export Room ${Date.now()}`;
    await bootstrapPage(page);
    await createMeeting(request, location);
    await openMeeting(page, location);
  });

  test("meeting header exports a snapshot text file", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#exportMeetingBtn").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("export-room");
    expect(download.suggestedFilename()).toContain("snapshot.txt");
  });

  test("action items export downloads a CSV file", async ({ page }) => {
    await page.locator(".detail-tab-bar [data-tab='actions']").click();
    await page.waitForFunction(() => {
      const panel = document.querySelector("#actions-panel");
      return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
    });

    await page.locator("#actions-panel .btn-add-action").click();
    await page.locator(".modal #actionDescription").fill("Export action item");
    await page.locator(".modal #actionAssignee").fill("Riley Secretary");
    await page.locator(".modal #actionDue").fill("2026-04-01");
    await page.locator(".modal .btn-save").click();
    await expect(page.locator("#actions-panel .actions-table")).toContainText("Export action item");

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#actions-panel .btn-export-csv").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("action-items.csv");
  });

  test("summary export menu exposes plain text, markdown, and PDF options", async ({ page }) => {
    await page.locator("#moreActionsBtn").click();
    await page.locator('#meetingActionMenu [data-action="open-summary"]').click();
    await page.waitForFunction(() => {
      const panel = document.querySelector("#public-summary-panel");
      return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
    });

    const summaryPanel = page.locator("#public-summary-panel");
    await summaryPanel.locator(".btn-export").click();

    const exportMenu = summaryPanel.locator(".export-menu");
    await expect(exportMenu.locator('[data-format="txt"]')).toBeVisible();
    await expect(exportMenu.locator('[data-format="md"]')).toBeVisible();
    await expect(exportMenu.locator('[data-format="pdf"]')).toBeVisible();
  });

  test("summary export downloads markdown", async ({ page }) => {
    await page.locator("#moreActionsBtn").click();
    await page.locator('#meetingActionMenu [data-action="open-summary"]').click();
    await page.waitForFunction(() => {
      const panel = document.querySelector("#public-summary-panel");
      return panel?.getAttribute("data-loaded") === "true" && panel?.getAttribute("aria-hidden") === "false";
    });

    const summaryPanel = page.locator("#public-summary-panel");
    const summaryEditor = summaryPanel.locator(".summary-editor textarea.editor-input");
    await summaryEditor.fill("Export-ready public summary.");

    await summaryPanel.locator(".btn-export").click();
    const downloadPromise = page.waitForEvent("download");
    await summaryPanel.locator('.export-menu [data-format="md"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("meeting-summary.md");
  });
});
