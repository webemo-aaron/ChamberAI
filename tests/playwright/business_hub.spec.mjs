// @critical - Business Hub release gate tests
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_BASE = process.env.API_BASE || "http://localhost:4000";

test.describe("Business Hub @critical", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login
    await page.goto(BASE_URL);
    await page.fill("#apiBase", API_BASE);
    await page.click("#saveApiBase");

    // Wait for auth modal or auto-login
    const loginModal = page.locator("#loginModal");
    if (await loginModal.isVisible()) {
      await page.fill("#loginEmail", "admin@acme.com");
      await page.selectOption("#loginRole", "admin");
      await page.click("#loginSubmit");
      await page.waitForNavigation();
    }
  });

  test("should navigate to Business Hub view", async ({ page }) => {
    // Verify we're on meetings view by default
    const meetingsView = page.locator("#meetingsView");
    expect(await meetingsView.isVisible()).toBe(true);

    // Click Business Hub button
    await page.click("#viewBusinessHubBtn");

    // Verify Business Hub view is now visible
    const businessHubView = page.locator("#businessHubView");
    expect(await businessHubView.isVisible()).toBe(true);

    // Verify meetings view is hidden
    expect(await meetingsView.isVisible()).toBe(false);

    // Verify button states
    const meetingsBtn = page.locator("#viewMeetingsBtn");
    const bizBtn = page.locator("#viewBusinessHubBtn");
    expect(await meetingsBtn.getAttribute("aria-pressed")).toBe("false");
    expect(await bizBtn.getAttribute("aria-pressed")).toBe("true");
  });

  test("should add a new business via modal", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Open modal
    await page.click("[data-testid='add-business']");
    const modal = page.locator("#bizModal");
    expect(await modal.isVisible()).toBe(true);

    // Fill form
    await page.fill("[data-testid='biz-modal-name']", "Bethel Bakery");
    await page.fill("#bizModalCategory", "Food & Beverage");
    await page.fill("#bizModalAddress", "123 Main St");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-824-1234");
    await page.fill("#bizModalEmail", "info@bethelbakery.com");
    await page.selectOption("#bizModalGeoType", "city");
    await page.fill("#bizModalGeoId", "Bethel");

    // Submit
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500); // Wait for API call

    // Modal should close
    expect(await modal.isVisible()).toBe(false);
  });

  test("should display created business in list", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add business
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "City Diner");
    await page.fill("#bizModalCategory", "Restaurant");
    await page.fill("#bizModalAddress", "456 Oak Ave");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-824-5678");
    await page.fill("#bizModalEmail", "info@citydiner.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Verify business appears in list
    const businessList = page.locator("#businessList");
    const businessCard = businessList.locator("text=City Diner");
    expect(await businessCard.isVisible()).toBe(true);

    // Verify count updated
    const count = page.locator("#businessCount");
    const countText = await count.textContent();
    expect(parseInt(countText)).toBeGreaterThan(0);
  });

  test("should select business and load profile tab", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add a business first
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "Acme Corp");
    await page.fill("#bizModalCategory", "Services");
    await page.fill("#bizModalAddress", "789 Pine Rd");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-824-9999");
    await page.fill("#bizModalEmail", "info@acme.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Click on business in list
    await page.click("#businessList .business-card");

    // Verify detail panel is visible
    const detailPanel = page.locator("#businessDetailPanel");
    expect(await detailPanel.isVisible()).toBe(true);

    // Verify empty state is hidden
    const emptyState = page.locator("#businessEmptyState");
    expect(await emptyState.isVisible()).toBe(false);

    // Verify profile tab is active
    const profileTab = page.locator("#bizTabProfile");
    expect(await profileTab.getAttribute("aria-selected")).toBe("true");

    // Verify form is populated
    const nameField = page.locator("[data-testid='biz-name']");
    expect(await nameField.inputValue()).toBe("Acme Corp");
  });

  test("should edit and save business profile", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add business
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "Test Business");
    await page.fill("#bizModalCategory", "Retail");
    await page.fill("#bizModalAddress", "100 Main");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-111-1111");
    await page.fill("#bizModalEmail", "test@test.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Click business to open
    await page.click("#businessList .business-card");

    // Edit a field
    const categoryField = page.locator("[data-testid='biz-category']");
    await categoryField.clear();
    await categoryField.fill("Retail & Online");

    // Save
    await page.click("[data-testid='save-business']");
    await page.waitForTimeout(500);

    // Verify change persisted (by checking header updated)
    const header = page.locator("#bizDetailCategory");
    expect(await header.textContent()).toContain("Retail & Online");
  });

  test("should switch to Geo Intelligence tab", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add business
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "Geo Test");
    await page.fill("#bizModalCategory", "Test");
    await page.fill("#bizModalAddress", "100 Test");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-222-2222");
    await page.fill("#bizModalEmail", "geo@test.com");
    await page.selectOption("#bizModalGeoType", "city");
    await page.fill("#bizModalGeoId", "Bethel");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Click business
    await page.click("#businessList .business-card");

    // Click Geo Intel tab
    await page.click("#bizTabGeo");

    // Verify tab is active
    const geoTab = page.locator("#bizTabGeo");
    expect(await geoTab.getAttribute("aria-selected")).toBe("true");

    // Verify content area is visible
    const geoContent = page.locator("#biz-tab-geo");
    expect(await geoContent.isVisible()).toBe(true);
  });

  test("should add a review and display it", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add business
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "Review Test");
    await page.fill("#bizModalCategory", "Test");
    await page.fill("#bizModalAddress", "100 Rev");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-333-3333");
    await page.fill("#bizModalEmail", "rev@test.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Click business and switch to Reviews tab
    await page.click("#businessList .business-card");
    await page.click("#bizTabReviews");

    // Add review
    await page.click("#addReviewBtn");
    const reviewModal = page.locator("#reviewModal");
    expect(await reviewModal.isVisible()).toBe(true);

    await page.selectOption("#reviewPlatform", "Google");
    await page.fill("#reviewRating", "5");
    await page.fill("#reviewerName", "John Doe");
    await page.fill("#reviewText", "Excellent service! Highly recommended.");
    await page.click("#saveReviewBtn");
    await page.waitForTimeout(500);

    // Verify review appears in list
    const reviewList = page.locator("#reviewList");
    const review = reviewList.locator("text=Excellent service");
    expect(await review.isVisible()).toBe(true);
  });

  test("should create and manage quotes", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add business
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "Quote Test");
    await page.fill("#bizModalCategory", "Test");
    await page.fill("#bizModalAddress", "100 Quo");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-444-4444");
    await page.fill("#bizModalEmail", "quo@test.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Click business and switch to Quotes tab
    await page.click("#businessList .business-card");
    await page.click("#bizTabQuotes");

    // Add quote
    await page.click("#addQuoteBtn");
    const quoteModal = page.locator("#quoteModal");
    expect(await quoteModal.isVisible()).toBe(true);

    await page.fill("#quoteTitle", "Marketing Setup");
    await page.fill("#quoteDescription", "Email campaign and social media integration");
    await page.selectOption("#quoteServiceClass", "quick_win_automation");
    await page.fill("#quoteTotal", "1500");
    await page.fill("#quoteContactName", "Jane Smith");
    await page.fill("#quoteContactEmail", "jane@test.com");
    await page.click("#saveQuoteBtn");
    await page.waitForTimeout(500);

    // Verify quote appears
    const quoteList = page.locator("#quoteList");
    const quote = quoteList.locator("text=Marketing Setup");
    expect(await quote.isVisible()).toBe(true);

    // Verify total is displayed
    const total = quoteList.locator("text=$1500.00");
    expect(await total.isVisible()).toBe(true);
  });

  test("should display AI Search readiness panel", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add business with AI Search enabled
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "AI Search Test");
    await page.fill("#bizModalCategory", "Test");
    await page.fill("#bizModalAddress", "100 AI");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-555-5555");
    await page.fill("#bizModalEmail", "ai@test.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Open business and enable AI Search
    await page.click("#businessList .business-card");
    const aiCheckbox = page.locator("#bizAiSearchEnabled");
    await aiCheckbox.check();
    await page.click("[data-testid='save-business']");
    await page.waitForTimeout(500);

    // Switch to AI Search tab
    await page.click("#bizTabAiSearch");

    // Verify tab is active
    const aiTab = page.locator("#bizTabAiSearch");
    expect(await aiTab.getAttribute("aria-selected")).toBe("true");

    // Verify content shows
    const aiContent = page.locator("#aiSearchContent");
    expect(await aiContent.isVisible()).toBe(true);
  });

  test("should search businesses by name", async ({ page }) => {
    await page.click("#viewBusinessHubBtn");

    // Add first business
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "Alpha Bakery");
    await page.fill("#bizModalCategory", "Food");
    await page.fill("#bizModalAddress", "1 A St");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-666-6666");
    await page.fill("#bizModalEmail", "alpha@test.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Add second business
    await page.click("[data-testid='add-business']");
    await page.fill("[data-testid='biz-modal-name']", "Beta Restaurant");
    await page.fill("#bizModalCategory", "Food");
    await page.fill("#bizModalAddress", "2 B St");
    await page.fill("#bizModalCity", "Bethel");
    await page.fill("#bizModalState", "ME");
    await page.fill("#bizModalZip", "04217");
    await page.fill("#bizModalPhone", "207-777-7777");
    await page.fill("#bizModalEmail", "beta@test.com");
    await page.click("[data-testid='save-biz-modal']");
    await page.waitForTimeout(500);

    // Search for "Alpha"
    const searchInput = page.locator("[data-testid='business-search']");
    await searchInput.fill("Alpha");

    // Verify filtering
    const businessList = page.locator("#businessList");
    const alphaCard = businessList.locator("text=Alpha Bakery");
    expect(await alphaCard.isVisible()).toBe(true);
  });

  test("should toggle between Meetings and Business Hub views", async ({ page }) => {
    // Start on meetings
    const meetingsView = page.locator("#meetingsView");
    expect(await meetingsView.isVisible()).toBe(true);

    // Switch to Business Hub
    await page.click("#viewBusinessHubBtn");
    const bizView = page.locator("#businessHubView");
    expect(await bizView.isVisible()).toBe(true);
    expect(await meetingsView.isVisible()).toBe(false);

    // Switch back to Meetings
    await page.click("#viewMeetingsBtn");
    expect(await meetingsView.isVisible()).toBe(true);
    expect(await bizView.isVisible()).toBe(false);
  });
});
