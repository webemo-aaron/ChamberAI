import { test, expect } from "@playwright/test";
import { API_BASE, bootstrapPage } from "./support/ui_helpers.mjs";

test.describe("Email + Motion Integration UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API_BASE}/integrations/motion/config`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            enabled: false,
            workspaceId: "",
            defaultProjectId: "",
            defaultLinkTemplate: "",
            hasApiKey: false
          })
        });
        return;
      }
      if (route.request().method() === "PUT") {
        const payload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            enabled: Boolean(payload.enabled),
            workspaceId: payload.workspaceId ?? "",
            defaultProjectId: payload.defaultProjectId ?? "",
            defaultLinkTemplate: payload.defaultLinkTemplate ?? "",
            hasApiKey: true
          })
        });
        return;
      }
      await route.continue();
    });
    await page.route(`${API_BASE}/integrations/motion/test`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, name: "Mock Motion User" })
      });
    });
    await page.route(`${API_BASE}/invites/authorized-senders`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ authorizedSenders: ["admin@acme.com"] })
        });
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ authorizedSenders: ["admin@acme.com", "aaron@mahoosuc.solutions"] })
      });
    });
    await page.route(`${API_BASE}/invites/send`, async (route) => {
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, inviteId: "invite_1", resendId: "mock" })
      });
    });

    await bootstrapPage(page);
    const emailFlag = page.locator("#featureFlags input[data-flag='integrations_email']");
    if (!(await emailFlag.isChecked())) {
      await emailFlag.check();
      await page.locator("#saveSettings").click();
    }
  });

  test("shows auth cycle status and integration sections", async ({ page }) => {
    await expect(page.locator("#authCycleStatus")).toBeVisible();
    await expect(page.locator("#settingsInviteDisclosure")).toBeVisible();
    await expect(page.locator("#settingsMotionDisclosure")).toBeVisible();
  });

  test("motion template is used when invite motion link is empty", async ({ page }) => {
    await page.locator("#settingsMotionDisclosure summary").click();
    await page.locator("#motionEnabled").check();
    await page.locator("#motionApiKey").fill("mock-api-key");
    await page.locator("#motionLinkTemplate").fill("https://app.usemotion.com/?q={{meeting_title}}");
    await page.locator("#motionSaveBtn").click();
    await expect(page.locator("#motionStatus")).toHaveText(/saved/i);

    await page.locator("#settingsInviteDisclosure summary").click();
    await page.locator("#inviteRecipientEmail").fill("newmember@acme.com");
    await page.locator("#inviteMeetingTitle").fill("Board Meeting April");
    await page.locator("#inviteMotionLink").fill("");
    await expect(page.locator("#inviteMotionSource")).toHaveText(/chamber default template/i);
    await page.locator("#inviteSendBtn").click();
    await expect(page.locator("#inviteStatus")).toHaveText(/Invite sent/i);
  });
});
