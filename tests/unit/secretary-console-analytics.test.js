import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("analytics backend includes open_action_items and ai_interactions metrics", () => {
  const analyticsJs = read(
    "services/api-firebase/src/routes/analytics.js"
  );

  // Verify open_action_items is calculated
  assert.match(analyticsJs, /openActions/);
  assert.match(analyticsJs, /open_action_items.*openActions/);

  // Verify kiosk_chats is fetched
  assert.match(analyticsJs, /kioskChatsSnap/);
  assert.match(analyticsJs, /kiosk_chats/);

  // Verify ai_interactions count
  assert.match(analyticsJs, /ai_interactions.*kioskChats\.length/);
});

test("analytics backend has /analytics/kiosk endpoint", () => {
  const analyticsJs = read(
    "services/api-firebase/src/routes/analytics.js"
  );

  // Verify endpoint exists
  assert.match(analyticsJs, /router\.get\("\/analytics\/kiosk".*requireTier/);

  // Verify it returns kiosk metrics
  assert.match(analyticsJs, /total_messages/);
  assert.match(analyticsJs, /unique_users/);
  assert.match(analyticsJs, /avg_tokens_per_message/);
  assert.match(analyticsJs, /top_providers/);
});

test("analytics backend has /analytics/compliance endpoint", () => {
  const analyticsJs = read(
    "services/api-firebase/src/routes/analytics.js"
  );

  // Verify endpoint exists
  assert.match(analyticsJs, /router\.get\("\/analytics\/compliance".*requireTier/);

  // Verify it requires Pro tier
  assert.match(analyticsJs, /requireTier\("pro"\)/);

  // Verify it returns compliance metrics
  assert.match(analyticsJs, /avg_compliance_score/);
  assert.match(analyticsJs, /scores_by_meeting/);
  assert.match(analyticsJs, /common_issues/);
});

test("analytics backend returns completion_rate alias", () => {
  const analyticsJs = read(
    "services/api-firebase/src/routes/analytics.js"
  );

  // Verify both fields are returned
  assert.match(analyticsJs, /action_item_completion_rate/);
  assert.match(analyticsJs, /completion_rate[\s\S]*action_item_completion_rate/);
});

test("analytics-view uses tier not context.tier", () => {
  const analyticsJs = read(
    "apps/secretary-console/views/analytics/analytics-view.js"
  );

  // Verify it uses tier variable
  assert.match(analyticsJs, /canAccessAnalyticsTier\(tier\)/);

  // Verify it doesn't use context.tier
  assert.doesNotMatch(analyticsJs, /canAccessAnalyticsTier\(context\.tier\)/);
});

test("analytics-view normalizeAnalytics maps fields correctly", () => {
  const analyticsJs = read(
    "apps/secretary-console/views/analytics/analytics-view.js"
  );

  // Verify it has normalizeAnalytics function with correct mappings
  assert.match(analyticsJs, /function normalizeAnalytics/);

  // Verify it maps action_item_completion_rate
  assert.match(analyticsJs, /action_item_completion_rate/);
  assert.match(analyticsJs, /completionRate/);

  // Verify it uses ai_interactions
  assert.match(analyticsJs, /ai_interactions/);
  assert.match(analyticsJs, /aiInteractions/);

  // Verify it uses open_action_items
  assert.match(analyticsJs, /open_action_items/);
  assert.match(analyticsJs, /actionItemsOpen/);

  // Verify it maps average_time_to_approval_days
  assert.match(analyticsJs, /average_time_to_approval_days/);
  assert.match(analyticsJs, /approvalPace/);

  // Verify it uses meetings_total for draft count
  assert.match(analyticsJs, /meetings_total/);
  assert.match(analyticsJs, /draftCount/);
});

test("analytics-view fetches kiosk metrics in parallel", () => {
  const analyticsJs = read(
    "apps/secretary-console/views/analytics/analytics-view.js"
  );

  // Verify parallel requests with Promise.all
  assert.match(analyticsJs, /Promise\.all/);
  assert.match(analyticsJs, /\/analytics\/board/);
  assert.match(analyticsJs, /\/analytics\/kiosk/);
});
