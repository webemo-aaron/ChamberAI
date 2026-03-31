import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("toast and live-feedback surfaces expose screen-reader semantics", () => {
  const toastJs = read("apps/secretary-console/core/toast.js");
  const businessListJs = read("apps/secretary-console/views/business-hub/business-list.js");
  const reviewsTabJs = read("apps/secretary-console/views/business-hub/tabs/reviews-tab.js");
  const quotesTabJs = read("apps/secretary-console/views/business-hub/tabs/quotes-tab.js");
  const aiSearchTabJs = read("apps/secretary-console/views/business-hub/tabs/ai-search-tab.js");
  const topbarJs = read("apps/secretary-console/components/topbar.js");
  const settingsViewJs = read("apps/secretary-console/views/settings/settings-view.js");

  assert.match(toastJs, /typeof options === "string"/);
  assert.match(toastJs, /type === "error" \|\| type === "warning"/);
  assert.match(toastJs, /setAttribute\("role", "alert"\)/);
  assert.match(toastJs, /setAttribute\("role", "status"\)/);
  assert.match(toastJs, /setAttribute\('aria-live', 'off'\)/);

  assert.match(businessListJs, /item\.addEventListener\("keydown"/);
  assert.match(businessListJs, /role="alert"/);
  assert.match(businessListJs, /role="status"/);

  assert.match(reviewsTabJs, /role="\$\{state\.notice\.tone === "warning" \? "alert" : "status"\}"/);
  assert.match(reviewsTabJs, /aria-live="\$\{state\.notice\.tone === "warning" \? "assertive" : "polite"\}"/);
  assert.match(reviewsTabJs, /event\.key === "Escape"/);

  assert.match(quotesTabJs, /role="\$\{state\.notice\.tone === "warning" \? "alert" : "status"\}"/);
  assert.match(quotesTabJs, /aria-live="\$\{state\.notice\.tone === "warning" \? "assertive" : "polite"\}"/);
  assert.match(quotesTabJs, /event\.key === "Escape"/);

  assert.match(aiSearchTabJs, /class="ai-search-loading" role="status" aria-live="polite"/);
  assert.match(aiSearchTabJs, /class="ai-search-error" role="alert"/);

  assert.match(topbarJs, /returnFocusTarget = document\.activeElement/);
  assert.match(topbarJs, /apiPopover\.addEventListener\("keydown"/);
  assert.match(topbarJs, /event\.key !== "Tab"/);

  assert.match(settingsViewJs, /tabButton\.id = tab\.id/);
  assert.match(settingsViewJs, /event\.key === "Home"/);
  assert.match(settingsViewJs, /event\.key === "End"/);
  assert.match(settingsViewJs, /\(currentIndex - 1 \+ tabList\.length\) % tabList\.length/);
});
