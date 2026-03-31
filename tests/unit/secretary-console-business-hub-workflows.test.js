import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("business hub profile tab supports real edit persistence flow", () => {
  const profileTabJs = read(
    "apps/secretary-console/views/business-hub/tabs/profile-tab.js"
  );
  const detailJs = read(
    "apps/secretary-console/views/business-hub/business-detail.js"
  );

  assert.match(profileTabJs, /request\(`\/business-listings\/\$\{business\.id\}`, "PUT"/);
  assert.match(profileTabJs, /Business profile saved locally for this session/);
  assert.match(profileTabJs, /saveProfileBtn/);
  assert.match(profileTabJs, /let currentBusiness = applyDraftBusiness\(business\)/);
  assert.match(profileTabJs, /currentBusiness = persistedBusiness/);
  assert.match(profileTabJs, /description: container\.querySelector\("#businessDescription"\)\?\.value \?\? currentBusiness\.description/);
  assert.match(detailJs, /onBusinessUpdated/);
});

test("business hub coordinator exposes recoverable list and detail states", () => {
  const listJs = read(
    "apps/secretary-console/views/business-hub/business-list.js"
  );
  const hubViewJs = read(
    "apps/secretary-console/views/business-hub/business-hub-view.js"
  );

  assert.match(listJs, /data-retry-load/);
  assert.match(listJs, /data-reset-filters/);
  assert.match(listJs, /bizCityFilter/);
  assert.match(listJs, /showcase city/i);
  assert.match(listJs, /filterBusinessesByShowcaseCity/);
  assert.match(listJs, /business-list-toolbar/);
  assert.match(hubViewJs, /renderDetailLoadingState/);
  assert.match(hubViewJs, /renderDetailErrorState/);
  assert.match(hubViewJs, /Business not found/);
});

test("business detail exposes a geo intelligence jump for the active business territory", () => {
  const detailJs = read(
    "apps/secretary-console/views/business-hub/business-detail.js"
  );
  const showcaseCityJs = read(
    "apps/secretary-console/views/common/showcase-city-context.js"
  );

  assert.match(detailJs, /bizGeoBtn/);
  assert.match(detailJs, /navigate\("\/geo-intelligence"\)/);
  assert.match(detailJs, /inferShowcaseCityFromBusiness/);
  assert.match(showcaseCityJs, /export function inferShowcaseCityFromBusiness/);
});

test("quotes tab exposes retry and in-tab action-state handling", () => {
  const quotesTabJs = read(
    "apps/secretary-console/views/business-hub/tabs/quotes-tab.js"
  );

  assert.match(quotesTabJs, /data-retry-quotes/);
  assert.match(quotesTabJs, /quotes-notice/);
  assert.match(quotesTabJs, /Quote Request Unavailable/);
  assert.match(quotesTabJs, /pendingAction === `status-\$\{quote\.id\}`/);
  assert.match(quotesTabJs, /surface-primary-actions/);
  assert.match(quotesTabJs, /quote-row-menu/);
  assert.match(quotesTabJs, /btn-row-menu/);
});

test("reviews tab exposes retry and in-tab action-state handling", () => {
  const reviewsTabJs = read(
    "apps/secretary-console/views/business-hub/tabs/reviews-tab.js"
  );

  assert.match(reviewsTabJs, /data-retry-reviews/);
  assert.match(reviewsTabJs, /reviews-notice/);
  assert.match(reviewsTabJs, /Response Unavailable/);
  assert.match(reviewsTabJs, /pendingAction === `delete-\$\{review\.id\}`/);
  assert.match(reviewsTabJs, /surface-primary-actions/);
  assert.match(reviewsTabJs, /review-row-menu/);
  assert.match(reviewsTabJs, /btn-row-menu/);
});

test("ai search tab exposes retry, notices, and correct API request usage", () => {
  const aiSearchTabJs = read(
    "apps/secretary-console/views/business-hub/tabs/ai-search-tab.js"
  );

  assert.match(aiSearchTabJs, /request\(\s*`\/api\/ai-search\/business\?businessId=\$\{business\.id\}`,\s*"GET"/);
  assert.match(aiSearchTabJs, /data-retry-ai-search/);
  assert.match(aiSearchTabJs, /ai-search-notice/);
  assert.match(aiSearchTabJs, /AI Search Unavailable/);
});

// New tests for Phase 6 modularization and bug fixes

test("coordinator wires onCleanup handler for proper cleanup on route change", () => {
  const hubViewJs = read(
    "apps/secretary-console/views/business-hub/business-hub-view.js"
  );

  assert.match(hubViewJs, /context\?\.onCleanup\?\.\(\(\) => cleanup\(\)\)/);
  assert.doesNotMatch(hubViewJs, /return \(\) => \{.*removePaneSplitter/s);
});

test("coordinator listens for showcase-city-changed event from business list", () => {
  const hubViewJs = read(
    "apps/secretary-console/views/business-hub/business-hub-view.js"
  );
  const listJs = read(
    "apps/secretary-console/views/business-hub/business-list.js"
  );

  assert.match(hubViewJs, /listenForShowcaseCityChanged/);
  assert.match(hubViewJs, /showcase-city-changed/);
  assert.match(hubViewJs, /filterBusinessesByShowcaseCity/);
  assert.match(listJs, /dispatchEvent\(\s*new CustomEvent\("showcase-city-changed"/);
});

test("business-detail uses loadedModules Map with data-loaded sentinel pattern", () => {
  const detailJs = read(
    "apps/secretary-console/views/business-hub/business-detail.js"
  );

  assert.match(detailJs, /const loadedModules = new Map\(\)/);
  assert.match(detailJs, /data-loaded="false"/);
  assert.match(detailJs, /panel\.dataset\.loaded === "true"/);
  assert.match(detailJs, /panel\.dataset\.loaded = "true"/);
  assert.match(detailJs, /export function cleanup\(\)/);
  assert.match(detailJs, /module\.cleanup/);
  assert.match(detailJs, /loadedModules\.clear\(\)/);
  assert.doesNotMatch(detailJs, /loadedTabs: new Set/);
});

test("business-detail uses dynamic import for lazy-loading tab modules", () => {
  const detailJs = read(
    "apps/secretary-console/views/business-hub/business-detail.js"
  );

  assert.match(detailJs, /import\("\.\/tabs\/profile-tab\.js"\)/);
  assert.match(detailJs, /import\("\.\/tabs\/geographic-tab\.js"\)/);
  assert.match(detailJs, /import\("\.\/tabs\/reviews-tab\.js"\)/);
  assert.match(detailJs, /import\("\.\/tabs\/quotes-tab\.js"\)/);
  assert.match(detailJs, /import\("\.\/tabs\/ai-search-tab\.js"\)/);
});

test("business-detail exports createBusinessDetail, renderBusinessDetail, and cleanup", () => {
  const detailJs = read(
    "apps/secretary-console/views/business-hub/business-detail.js"
  );

  assert.match(detailJs, /export function createBusinessDetail/);
  assert.match(detailJs, /export function renderBusinessDetail/);
  assert.match(detailJs, /export function cleanup\(\)/);
});

test("coordinator imports cleanup from business-detail", () => {
  const hubViewJs = read(
    "apps/secretary-console/views/business-hub/business-hub-view.js"
  );

  assert.match(hubViewJs, /cleanup as cleanupBusinessDetail.*from "\.\/business-detail\.js"/);
});

test("all 5 business-hub tab modules export render() and cleanup() functions", () => {
  const tabs = [
    "apps/secretary-console/views/business-hub/tabs/profile-tab.js",
    "apps/secretary-console/views/business-hub/tabs/geographic-tab.js",
    "apps/secretary-console/views/business-hub/tabs/ai-search-tab.js",
    "apps/secretary-console/views/business-hub/tabs/quotes-tab.js",
    "apps/secretary-console/views/business-hub/tabs/reviews-tab.js"
  ];

  tabs.forEach((tabPath) => {
    const tabJs = read(tabPath);
    assert.match(tabJs, /export function render\(/, `${tabPath} should export render()`);
    assert.match(tabJs, /export function cleanup\(\)/, `${tabPath} should export cleanup()`);
  });
});

test("no initXxxTab exports remain in tab files", () => {
  const tabs = [
    "apps/secretary-console/views/business-hub/tabs/profile-tab.js",
    "apps/secretary-console/views/business-hub/tabs/geographic-tab.js",
    "apps/secretary-console/views/business-hub/tabs/ai-search-tab.js",
    "apps/secretary-console/views/business-hub/tabs/quotes-tab.js",
    "apps/secretary-console/views/business-hub/tabs/reviews-tab.js"
  ];

  tabs.forEach((tabPath) => {
    const tabJs = read(tabPath);
    assert.doesNotMatch(tabJs, /export function init\w+Tab/, `${tabPath} should not export initXxxTab`);
  });
});

test("no local escapeHtml or formatDate definitions remain in tab files", () => {
  const tabs = [
    "apps/secretary-console/views/business-hub/tabs/profile-tab.js",
    "apps/secretary-console/views/business-hub/tabs/geographic-tab.js",
    "apps/secretary-console/views/business-hub/tabs/ai-search-tab.js",
    "apps/secretary-console/views/business-hub/tabs/quotes-tab.js",
    "apps/secretary-console/views/business-hub/tabs/reviews-tab.js"
  ];

  tabs.forEach((tabPath) => {
    const tabJs = read(tabPath);
    assert.doesNotMatch(tabJs, /function escapeHtml\(/, `${tabPath} should not define escapeHtml`);
    if (tabPath !== "apps/secretary-console/views/business-hub/tabs/geographic-tab.js" &&
        tabPath !== "apps/secretary-console/views/business-hub/tabs/profile-tab.js") {
      assert.doesNotMatch(tabJs, /function formatDate\(/, `${tabPath} should not define formatDate`);
    }
  });
});

test("all tab files import utilities from common/format.js", () => {
  const tabs = [
    "apps/secretary-console/views/business-hub/tabs/profile-tab.js",
    "apps/secretary-console/views/business-hub/tabs/geographic-tab.js",
    "apps/secretary-console/views/business-hub/tabs/ai-search-tab.js",
    "apps/secretary-console/views/business-hub/tabs/quotes-tab.js",
    "apps/secretary-console/views/business-hub/tabs/reviews-tab.js"
  ];

  tabs.forEach((tabPath) => {
    const tabJs = read(tabPath);
    assert.match(tabJs, /from "\.\.\/\.\.\/common\/format\.js"/, `${tabPath} should import from common/format.js`);
  });
});

test("reviews and quotes tabs have proper modal and menu cleanup handlers", () => {
  const reviewsTabJs = read(
    "apps/secretary-console/views/business-hub/tabs/reviews-tab.js"
  );
  const quotesTabJs = read(
    "apps/secretary-console/views/business-hub/tabs/quotes-tab.js"
  );

  // Reviews tab: openModal tracking
  assert.match(reviewsTabJs, /let openModal = null/);
  assert.match(reviewsTabJs, /openModal = modal/);
  assert.match(reviewsTabJs, /openModal\?\.remove\(\)/);
  assert.match(reviewsTabJs, /if \(event\.key === "Escape"\)/);

  // Both: closeMenuHandler
  assert.match(reviewsTabJs, /let closeMenuHandler = null/);
  assert.match(quotesTabJs, /let closeMenuHandler = null/);
  assert.match(reviewsTabJs, /document\.removeEventListener\("click", closeMenuHandler\)/);
  assert.match(quotesTabJs, /document\.removeEventListener\("click", closeMenuHandler\)/);
});
