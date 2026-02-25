import { test, expect } from "@playwright/test";
import { bootstrapPage, createMeeting, openMeeting } from "./support/ui_helpers.mjs";

test.describe("Export Features", () => {
  test.beforeEach(async ({ page, request }) => {
    await bootstrapPage(page);
    await createMeeting(request, "Export Room");
    await openMeeting(page, "Export Room");
    await page.locator(".tab", { hasText: "Motions" }).click();
  });

  test("Export minutes as PDF", async ({ page }) => {
    await page.locator('[data-testid="export-pdf"]').click();
    await expect(page.locator("#exportResults")).toContainText("PDF export ready");
  });

  test("Export minutes as DOCX", async ({ page }) => {
    await page.locator('[data-testid="export-docx"]').click();
    await expect(page.locator("#exportResults")).toContainText("DOCX export ready");
  });

  test("Export action items as CSV", async ({ page }) => {
    await page.locator(".tab", { hasText: "Action Items" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#exportActionCsv").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("action-items-");
  });

  test("Export history shows previous exports", async ({ page }) => {
    await page.locator('[data-testid="export-pdf"]').click();
    await page.locator('[data-testid="export-docx"]').click();
    await expect(page.locator("#exportHistory")).toContainText("PDF");
    await expect(page.locator("#exportHistory")).toContainText("DOCX");
    await expect(page.locator("#exportHistory")).toContainText(".pdf");
    await expect(page.locator("#exportHistory")).toContainText(".docx");
  });

  test("Multiple export format support", async ({ page }) => {
    await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-docx"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-minutes-md"]')).toBeVisible();
  });
});
