import { test, expect } from "@playwright/test";
import { UI_BASE } from "./utils.mjs";

async function signIn(page) {
  await page.goto(`${UI_BASE}/#/login`);
  const loginPage = page.locator("#loginPageContainer");
  await loginPage.locator(".demo-summary").click();
  await loginPage.locator("#loginEmail").fill("admin@acme.com");
  await loginPage.locator("#loginRole").selectOption("admin");
  await loginPage.locator("#loginSubmit").click();
  await page.waitForFunction(() => window.location.hash === "#/dashboard");
  await expect(page.locator("#dashboardView")).toBeVisible();
}

async function mockBusinessHubApi(page) {
  const businessSummary = {
    id: "biz-1",
    name: "Acme Advisors",
    category: "Consulting",
    rating: 4.8,
    businessType: "service_provider"
  };
  const businessDetail = {
    ...businessSummary,
    description: "Strategic advisory support for chamber member operations.",
    email: "team@acmeadvisors.com",
    phone: "555-0100",
    website: "https://acmeadvisors.example.com",
    address: "100 Main Street",
    city: "Portland",
    state: "ME",
    zip: "04101",
    reviewCount: 2
  };
  const reviews = [
    {
      id: "review-1",
      author: "Jordan Smith",
      rating: 5,
      text: "Strong support for member onboarding and sponsor outreach.",
      createdAt: "2026-03-20T12:00:00.000Z"
    }
  ];
  const relatedMeetings = [
    {
      id: "meeting-42",
      title: "Council Operations Review",
      date: "2026-03-18T15:00:00.000Z",
      location: "Town Hall",
      relevanceScore: 0.91
    }
  ];
  let reviewLoadCount = 0;
  let aiSearchLoadCount = 0;

  await page.route("http://business-hub.mock/business-listings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [businessSummary] })
    });
  });

  await page.route("http://business-hub.mock/business-listings/biz-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(businessDetail)
    });
  });

  await page.route("http://business-hub.mock/business-listings/biz-1/reviews", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    reviewLoadCount += 1;
    const responseBody =
      reviewLoadCount === 1
        ? { error: "Reviews backend offline" }
        : { data: reviews };

    await route.fulfill({
      status: reviewLoadCount === 1 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody)
    });
  });

  await page.route(
    "http://business-hub.mock/business-listings/biz-1/reviews/review-1/draft-response",
    async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Draft workflow unavailable" })
      });
    }
  );

  await page.route(
    "http://business-hub.mock/api/ai-search/business?businessId=biz-1",
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      aiSearchLoadCount += 1;
      const responseBody =
        aiSearchLoadCount === 1
          ? { error: "AI index unavailable" }
          : { data: relatedMeetings };

      await route.fulfill({
        status: aiSearchLoadCount === 1 ? 503 : 200,
        contentType: "application/json",
        body: JSON.stringify(responseBody)
      });
    }
  );
}

async function mockMeetingsApi(page) {
  const meetingSummary = {
    id: "meeting-1",
    location: "Board Room",
    date: "2026-03-28T14:00:00.000Z",
    status: "scheduled",
    chair: "Alex Morgan",
    secretary: "Riley Chen",
    attendeeCount: 6,
    tags: ["budget", "membership"]
  };
  const summaryResponse = { text: "" };
  const minutesResponse = {
    text: "Budget review completed.\nMembership campaign approved.\nDowntown events calendar finalized."
  };
  const actionItems = [
    {
      id: "action-1",
      meetingId: "meeting-1",
      description: "Prepare board packet",
      assignee: "Riley Chen",
      dueDate: "2026-04-02T00:00:00.000Z",
      status: "in-progress"
    }
  ];
  const motions = [
    {
      id: "motion-1",
      meetingId: "meeting-1",
      text: "Approve member scholarship fund",
      mover: "Alex Morgan",
      seconder: "Riley Chen",
      status: "pending",
      votes: { yes: 0, no: 0, abstain: 0, notVoted: 6 },
      result: "pending"
    }
  ];
  const auditEntries = [
    {
      id: "audit-1",
      action: "updated",
      user: "System",
      timestamp: "2026-03-28T14:30:00.000Z",
      changes: "Meeting record initialized"
    }
  ];

  await page.route("http://meetings.mock/meetings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [meetingSummary] })
    });
  });

  await page.route("http://meetings.mock/meetings/meeting-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: meetingSummary })
    });
  });

  await page.route("http://meetings.mock/meetings/meeting-1/summary", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, text: body.text })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summaryResponse)
    });
  });

  await page.route("http://meetings.mock/meetings/meeting-1/minutes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(minutesResponse)
    });
  });

  await page.route("http://meetings.mock/meetings/meeting-1/actions", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      actionItems.push({
        id: `action-${actionItems.length + 1}`,
        meetingId: "meeting-1",
        description: body.description,
        assignee: body.assignee,
        dueDate: body.dueDate,
        status: body.status
      });
      auditEntries.push({
        id: `audit-${auditEntries.length + 1}`,
        action: "created",
        user: "Alex Morgan",
        timestamp: "2026-03-28T15:00:00.000Z",
        changes: `Action item added: ${body.description}`
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: actionItems })
    });
  });

  await page.route("http://meetings.mock/meetings/meeting-1/motions", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      motions.push({
        id: `motion-${motions.length + 1}`,
        meetingId: "meeting-1",
        text: body.text,
        mover: body.mover,
        seconder: body.seconder,
        status: body.status,
        votes: { yes: 0, no: 0, abstain: 0, notVoted: 6 },
        result: "pending"
      });
      auditEntries.push({
        id: `audit-${auditEntries.length + 1}`,
        action: "created",
        user: "Alex Morgan",
        timestamp: "2026-03-28T15:05:00.000Z",
        changes: `Motion created: ${body.text}`
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: motions })
    });
  });

  await page.route("http://meetings.mock/meetings/meeting-1/motions/*", async (route) => {
    if (route.request().method() !== "PUT") {
      await route.fallback();
      return;
    }

    const motionId = route.request().url().split("/").pop();
    const body = route.request().postDataJSON();
    const motion = motions.find((entry) => entry.id === motionId);
    if (motion) {
      motion.votes[body.vote] += 1;
      motion.votes.notVoted = Math.max(0, motion.votes.notVoted - 1);
      auditEntries.push({
        id: `audit-${auditEntries.length + 1}`,
        action: "updated",
        user: "Alex Morgan",
        timestamp: "2026-03-28T15:06:00.000Z",
        changes: `Motion vote recorded: ${motion.text} (${body.vote})`
      });
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await page.route("http://meetings.mock/meetings/meeting-1/audit", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: auditEntries })
    });
  });
}

async function mockGeoWorkspaceApi(page) {
  const geoProfile = {
    id: "geo_bethel",
    scope_type: "town",
    scope_id: "Bethel",
    scope_label: "Bethel, ME",
    business_density_score: 61,
    ai_readiness_score: 73,
    demand_gap_tags: ["visitor_messaging", "review_response"],
    provider_supply_tags: ["tourism", "automation_setup"],
    updated_at: "2026-03-28T12:00:00.000Z"
  };
  const geoBrief = {
    id: "brief_bethel",
    geo_profile_id: "geo_bethel",
    scope_type: "town",
    scope_id: "Bethel",
    top_use_cases: ["Visitor Messaging Assistant", "Review Response Copilot"],
    opportunity_summary: "Bethel has strong tourism-driven demand for AI support.",
    outreach_draft: "Invite Bethel businesses into a visitor-readiness sprint.",
    generated_at: "2026-03-28T13:00:00.000Z"
  };
  const businessSummary = {
    id: "biz-geo-1",
    name: "Mountain View Lodge",
    category: "Hospitality",
    rating: 4.9,
    businessType: "member",
    city: "Bethel",
    geo_scope_id: "Bethel"
  };
  const businessDetail = {
    ...businessSummary,
    description: "Hospitality support for seasonal visitors and chamber events.",
    email: "team@mountainview.example.com",
    phone: "555-0199",
    website: "https://mountainview.example.com",
    address: "1 Main Street",
    city: "Bethel",
    state: "ME",
    zip: "04217",
    geo_scope_id: "Bethel",
    reviewCount: 1
  };
  const meetingSummary = {
    id: "meeting-geo-1",
    location: "Bethel Chamber Hall",
    date: "2026-03-28T14:00:00.000Z",
    status: "scheduled",
    chair: "Alex Morgan",
    secretary: "Riley Chen",
    attendeeCount: 6,
    tags: ["tourism", "bethel", "member"]
  };

  await page.route("https://geo.mock/geo-profiles**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [geoProfile], total: 1, has_more: false, next_offset: 1, limit: 25, offset: 0 })
    });
  });

  await page.route("https://geo.mock/geo-profiles/scan", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(geoProfile)
    });
  });

  await page.route("https://geo.mock/geo-content-briefs**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [geoBrief], total: 1, has_more: false, next_offset: 1, limit: 25, offset: 0 })
    });
  });

  await page.route("https://geo.mock/geo-content-briefs/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(geoBrief)
    });
  });

  await page.route("https://geo.mock/business-listings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [businessSummary] })
    });
  });

  await page.route("https://geo.mock/business-listings/biz-geo-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(businessDetail)
    });
  });

  await page.route("https://geo.mock/business-listings/biz-geo-1/reviews", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] })
    });
  });

  await page.route("https://geo.mock/business-listings/biz-geo-1/quotes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] })
    });
  });

  await page.route("https://geo.mock/api/ai-search/business?businessId=biz-geo-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] })
    });
  });

  await page.route("https://geo.mock/meetings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [meetingSummary] })
    });
  });

  await page.route("https://geo.mock/meetings/meeting-geo-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: meetingSummary })
    });
  });

  await page.route("https://geo.mock/meetings/meeting-geo-1/summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: "" })
    });
  });

  await page.route("https://geo.mock/meetings/meeting-geo-1/minutes", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: "Tourism support and member outreach reviewed." })
    });
  });

  await page.route("https://geo.mock/meetings/meeting-geo-1/actions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] })
    });
  });

  await page.route("https://geo.mock/meetings/meeting-geo-1/motions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] })
    });
  });

  await page.route("https://geo.mock/meetings/meeting-geo-1/audit", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] })
    });
  });
}

test.describe("dashboard navigation responsive shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("camUserTier", "Council");
    });
  });

  test("desktop shows dashboard landing with semantic sidebar groups", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await signIn(page);

    await expect(page.locator("#sidebar")).toBeVisible();
    await expect(page.locator("#bottomNav")).toBeHidden();
    await expect(page.locator("#sidebarNav")).toContainText("Intelligence");
    await expect(page.locator("#sidebarNav")).toContainText(
      "Board signals, member context, and chamber visibility."
    );
    await expect(page.locator("#sidebarNav")).toContainText("Council+");
    await expect(page.locator("#sidebarNav")).toContainText("Operations");
    await expect(page.locator("#sidebarNav")).toContainText("Admin");
    await expect(page.locator("#sidebarNav")).toContainText("Account");
    await expect(page.locator("#dashboardView")).toContainText("Welcome back");
    await expect(page.locator("#dashboardView")).toContainText("Workspace Lanes");
    await expect(page.locator("#dashboardView")).toContainText("Quick Actions");
    await expect(page.locator("#dashboardView")).toContainText("Intelligence Surfaces");

    await page.locator("#apiConfigBtn").click();
    await expect(page.locator("#apiPopover")).toBeVisible();
    await expect(page.locator("#apiPopover")).toContainText("Connection Control");
    await expect(page.locator("#apiPopover")).toContainText(
      "Point the console at your active ChamberAI API environment."
    );
  });

  test("mobile swaps to bottom nav and keeps dashboard accessible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);

    await expect(page.locator("#sidebar")).toBeHidden();
    await expect(page.locator("#bottomNav")).toBeVisible();
    await expect(page.locator(".bottom-nav-link")).toHaveCount(5);
    await expect(page.locator("#bottomNav")).toContainText("Dashboard");
    await expect(page.locator("#bottomNav")).toContainText("Settings");

    await page.locator('.bottom-nav-link[data-route="/meetings"]').click();
    await page.waitForFunction(() => window.location.hash.startsWith("#/meetings"));

    await page.locator('.bottom-nav-link[data-route="/dashboard"]').click();
    await page.waitForFunction(() => window.location.hash === "#/dashboard");
    await expect(page.locator("#dashboardView")).toBeVisible();
  });

  test("utility routes render richer billing workspace surfaces", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);
    await page.evaluate(() => {
      localStorage.setItem("camApiBase", "http://127.0.0.1:9");
    });

    await page.goto(`${UI_BASE}/#/billing`);
    await expect(page.locator("#utilityView")).toBeVisible();
    await expect(page.locator("#utilityView")).toContainText("Billing");
    await expect(page.locator("#utilityView")).toContainText("Current Plan");
    await expect(page.locator("#utilityView")).toContainText("Included Capabilities");
    await expect(page.locator("#utilityView")).toContainText("Manage Subscription");
    await expect(page.locator("#utilityView")).toContainText("Open Stripe Admin");

    await page.locator('button[data-action="portal"]').click();
    await expect(page.locator("#utilityView")).toContainText("Billing Action Unavailable");
  });

  test("analytics route shows explicit unavailable state when metrics backend is unreachable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);
    await page.evaluate(() => {
      localStorage.setItem("camApiBase", "http://127.0.0.1:9");
    });

    await page.goto(`${UI_BASE}/#/analytics`);
    await expect(page.locator("#utilityView")).toBeVisible();
    await expect(page.locator("#utilityView")).toContainText("Analytics");
    await expect(page.locator("#utilityView")).toContainText("Analytics Unavailable");
    await expect(page.locator("#utilityView")).toContainText("Refresh Analytics");
  });

  test("profile and preferences persist account settings into navigation behavior", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);

    await page.goto(`${UI_BASE}/#/profile`);
    await page.locator("#profileDisplayName").fill("Alex Operator");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("#profileDisplayMetric")).toContainText("Alex Operator");

    await page.goto(`${UI_BASE}/#/preferences`);
    await page.locator("#preferenceLanding").selectOption("/meetings");
    await page.locator("#preferenceReviewMode").selectOption("Executive");
    await page.locator("#preferenceNotifications").selectOption("Balanced");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("#preferenceLandingMetric")).toContainText("meetings");

    await page.goto(`${UI_BASE}/#/`);
    await page.waitForFunction(() => window.location.hash === "#/meetings");
  });

  test("standalone admin pages use ChamberAI operations framing", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });

    await page.goto(`${UI_BASE}/stripe-admin.html`);
    await expect(page.locator("body")).toContainText("ChamberAI Billing Operations");
    await expect(page.locator("body")).toContainText("Open Product Admin");

    await page.goto(`${UI_BASE}/products-admin.html`);
    await expect(page.locator("body")).toContainText("ChamberAI Product Operations");
    await expect(page.locator("body")).toContainText("Back to Billing Admin");
  });

  test("business hub reviews recover after retry and show inline action failures", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      localStorage.setItem("camApiBase", "http://business-hub.mock");
    });
    await mockBusinessHubApi(page);
    await signIn(page);

    await page.goto(`${UI_BASE}/#/business-hub`);
    await expect(page.locator("#businessHubView")).toBeVisible();
    await expect(page.locator("#businessListPane")).toContainText("Acme Advisors");

    await page.locator('.business-list-item[data-business-id="biz-1"]').click();
    await page.waitForFunction(() => window.location.hash === "#/business-hub/biz-1");
    await expect(page.locator("#businessDetailPane")).toContainText("Acme Advisors");

    await page.getByRole("tab", { name: "Reviews" }).click();
    await expect(page.locator("#tab-reviews")).toContainText("Unable to load reviews");
    await expect(page.locator("#tab-reviews")).toContainText(
      "Verify the API base or backend readiness, then retry."
    );

    await page.locator('#tab-reviews [data-retry-reviews]').click();
    await expect(page.locator("#tab-reviews")).toContainText("Jordan Smith");
    await expect(page.locator("#tab-reviews")).toContainText(
      "Strong support for member onboarding and sponsor outreach."
    );

    await page.locator('#tab-reviews [data-action="response"]').click();
    const responseModal = page.locator(".modal-overlay").filter({ hasText: "Draft Response" });
    await expect(responseModal).toContainText("Draft Response");
    await responseModal.locator("#responseText").fill(
      "Thank you for the feedback. We will keep coordinating with the chamber team."
    );
    await responseModal.locator("#submitResponseBtn").click();

    await expect(page.locator("#tab-reviews .reviews-notice")).toContainText("Response Unavailable");
    await expect(page.locator("#tab-reviews .reviews-notice")).toContainText(
      "The response could not be submitted. Retry when the backend is available."
    );
  });

  test("business hub AI search recovers after retry and links into meetings", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      localStorage.setItem("camApiBase", "http://business-hub.mock");
    });
    await mockBusinessHubApi(page);
    await signIn(page);

    await page.goto(`${UI_BASE}/#/business-hub`);
    await page.locator('.business-list-item[data-business-id="biz-1"]').click();
    await page.waitForFunction(() => window.location.hash === "#/business-hub/biz-1");

    await page.getByRole("tab", { name: "AI Search" }).click();
    await expect(page.locator("#tab-ai-search")).toContainText("Unable to run AI search");
    await expect(page.locator("#tab-ai-search .ai-search-notice")).toContainText(
      "AI Search Unavailable"
    );

    await page.locator('#tab-ai-search [data-retry-ai-search]').click();
    await expect(page.locator("#tab-ai-search")).toContainText("Council Operations Review");
    await expect(page.locator("#tab-ai-search")).toContainText("91%");
    await expect(page.locator("#tab-ai-search .ai-search-notice")).toContainText(
      "AI Search Updated"
    );

    await page.locator('#tab-ai-search .related-meeting-link[data-meeting-id="meeting-42"]').click();
    await page.waitForFunction(() => window.location.hash === "#/meetings/meeting-42");
  });

  test("meetings header actions drive summary drafting and export flows", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      localStorage.setItem("camApiBase", "http://meetings.mock");
    });
    await mockMeetingsApi(page);
    await signIn(page);

    await page.goto(`${UI_BASE}/#/meetings/meeting-1`);
    await expect(page.locator("#meetingsView")).toBeVisible();
    await expect(page.locator(".meeting-detail-header")).toContainText("Board Room");

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#exportMeetingBtn").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("board-room-snapshot.txt");

    await page.locator("#moreActionsBtn").click();
    await page.locator('#meetingActionMenu [data-action="open-summary"]').click();
    await expect(page.locator('.detail-tab-bar [data-tab="public-summary"]')).toHaveAttribute(
      "aria-selected",
      "true"
    );
    const summaryPanel = page.locator("#public-summary-panel");
    await expect(summaryPanel.locator("#summaryContent")).toBeVisible();

    await page.locator(".btn-draft").click();
    await expect(summaryPanel.locator("#summaryContent")).toHaveValue(/Board Room session/);
    await expect(summaryPanel.locator("#summaryContent")).toHaveValue(/Budget review completed\./);
    await expect(summaryPanel.locator(".word-count")).toContainText("46 words");
  });

  test("meetings actions, motions, and audit tabs support live workflow validation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      localStorage.setItem("camApiBase", "http://meetings.mock");
    });
    await mockMeetingsApi(page);
    await signIn(page);

    await page.goto(`${UI_BASE}/#/meetings/meeting-1`);
    await expect(page.locator(".meeting-detail-header")).toContainText("Board Room");

    await page.locator('.detail-tab-bar [data-tab="actions"]').click();
    const actionsPanel = page.locator("#actions-panel");
    await expect(actionsPanel).toContainText("Prepare board packet");

    const actionDownloadPromise = page.waitForEvent("download");
    await actionsPanel.locator(".btn-export-csv").click();
    const actionDownload = await actionDownloadPromise;
    expect(actionDownload.suggestedFilename()).toBe("action-items.csv");

    await actionsPanel.locator(".btn-add-action").click();
    const actionModal = page.locator(".modal").filter({ hasText: "Add Action Item" });
    await actionModal.locator("#actionDescription").fill("Confirm sponsor packets");
    await actionModal.locator("#actionAssignee").fill("Taylor Brooks");
    await actionModal.locator("#actionDue").fill("2026-04-09");
    await actionModal.locator(".btn-save").click();
    await expect(actionsPanel).toContainText("Confirm sponsor packets");

    await page.locator('.detail-tab-bar [data-tab="motions"]').click();
    const motionsPanel = page.locator("#motions-panel");
    await expect(motionsPanel).toContainText("Approve member scholarship fund");

    await motionsPanel.locator(".btn-create-motion").click();
    const motionModal = page.locator(".modal").filter({ hasText: "Create Motion" });
    await motionModal.locator("#motionText").fill("Approve spring budget");
    await motionModal.locator("#motionMover").fill("Alex Morgan");
    await motionModal.locator("#motionSeconder").fill("Riley Chen");
    await motionModal.locator(".btn-save").click();
    await expect(motionsPanel).toContainText("Approve spring budget");

    const createdMotion = motionsPanel.locator(".motion-item", { hasText: "Approve spring budget" });
    await createdMotion.locator(".btn-yes").click();
    await expect(motionsPanel).toContainText("Yes: 1");

    await page.locator('.detail-tab-bar [data-tab="audit"]').click();
    const auditPanel = page.locator("#audit-panel");
    await expect(auditPanel).toContainText("Motion vote recorded: Approve spring budget (yes)");
    await auditPanel.locator("#actionFilter").selectOption("updated");
    await auditPanel.locator("#userFilter").selectOption("Alex Morgan");
    await expect(auditPanel).toContainText("Alex Morgan");
    await expect(auditPanel).toContainText("Motion vote recorded: Approve spring budget (yes)");
  });

  test("geo intelligence links into business and meetings workflows and back into the same territory", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      localStorage.setItem("camApiBase", "https://geo.mock");
      localStorage.setItem("camShowcaseCity", "bethel-me");
    });
    await mockGeoWorkspaceApi(page);
    await signIn(page);

    await page.goto(`${UI_BASE}/#/geo-intelligence`);
    await expect(page.locator("#utilityView")).toContainText("Geo Intelligence");
    await expect(page.locator("#utilityView")).toContainText("Bethel, ME");
    await expect(page.locator("#utilityView")).toContainText("Profile Inputs");
    await expect(page.locator("#utilityView")).toContainText("Mountain View Lodge");

    await page.getByRole("button", { name: "Open Bethel Businesses" }).click();
    await page.waitForFunction(() => window.location.hash === "#/business-hub");
    await expect(page.locator("#businessHubView")).toContainText("Mountain View Lodge");
    await page.locator('.business-list-item[data-business-id="biz-geo-1"]').click();
    await page.waitForFunction(() => window.location.hash === "#/business-hub/biz-geo-1");
    await page.locator("#bizGeoBtn").click();
    await page.waitForFunction(() => window.location.hash === "#/geo-intelligence");
    await expect(page.locator("#geoWorkspaceScope")).toHaveValue("bethel-me");

    await page.getByRole("button", { name: "Open Bethel Meetings" }).click();
    await page.waitForFunction(() => window.location.hash === "#/meetings");
    await expect(page.getByRole("region", { name: "Meetings directory" })).toContainText("Bethel Chamber Hall");
    await page.getByRole("row", { name: /Bethel Chamber Hall/ }).click();
    await page.waitForFunction(() => window.location.hash === "#/meetings/meeting-geo-1");
    await page.locator("#geoMeetingBtn").click();
    await page.waitForFunction(() => window.location.hash === "#/geo-intelligence");
    await expect(page.locator("#geoWorkspaceScope")).toHaveValue("bethel-me");
  });
});
