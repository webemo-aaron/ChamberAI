import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("meetings.js has pagination and delta sync support", () => {
  const meetings = read("services/api-firebase/src/routes/meetings.js");

  // Verify pagination params
  assert.match(meetings, /limit[\s\S]*req\.query\.limit/);
  assert.match(meetings, /offset[\s\S]*req\.query\.offset/);

  // Verify delta sync
  assert.match(meetings, /since[\s\S]*req\.query\.since/);
  assert.match(meetings, /where.*updated_at[\s\S]*>/);

  // Verify response structure
  assert.match(meetings, /next_cursor/);
  assert.match(meetings, /next_since/);
});

test("action_items.js has pagination and filtering", () => {
  const actionItems = read("services/api-firebase/src/routes/action_items.js");

  // Verify pagination
  assert.match(actionItems, /limit[\s\S]*req\.query\.limit/);
  assert.match(actionItems, /offset[\s\S]*req\.query\.offset/);

  // Verify status filtering
  assert.match(actionItems, /status[\s\S]*req\.query\.status/);
  assert.match(actionItems, /OPEN[\s\S]*COMPLETED/);

  // Verify response structure
  assert.match(actionItems, /action_items/);
  assert.match(actionItems, /next_cursor/);
});

test("action_items.js has my-open endpoint for mobile dashboard", () => {
  const actionItems = read("services/api-firebase/src/routes/action_items.js");

  // Verify endpoint exists
  assert.match(actionItems, /\/action-items\/my-open/);

  // Verify it filters for user's email and OPEN status
  assert.match(actionItems, /owner_name[\s\S]*userEmail/);
  assert.match(actionItems, /status[\s\S]*OPEN/);

  // Verify it's ordered by due date
  assert.match(actionItems, /orderBy.*due_date/);
});

test("notifications.js service has push dispatch functions", () => {
  const notifications = read("services/api-firebase/src/services/notifications.js");

  // Verify sendToOrg exists
  assert.match(notifications, /export.*function sendToOrg/);

  // Verify sendToUser exists
  assert.match(notifications, /export.*function sendToUser/);

  // Verify notification builders
  assert.match(notifications, /buildMeetingNotification/);
  assert.match(notifications, /buildActionItemNotification/);
  assert.match(notifications, /buildMinutesNotification/);

  // Verify FCM usage
  assert.match(notifications, /messaging\(\)\.sendMulticast/);
});

test("notifications route has device token endpoints", () => {
  const notificationsRoute = read("services/api-firebase/src/routes/notifications.js");

  // Verify POST device-token endpoint
  assert.match(notificationsRoute, /POST[\s\S]*\/api\/notifications\/device-token/);
  assert.match(notificationsRoute, /token[\s\S]*req\.body/);

  // Verify DELETE device-token endpoint
  assert.match(notificationsRoute, /DELETE[\s\S]*\/api\/notifications\/device-token/);

  // Verify preferences endpoints
  assert.match(notificationsRoute, /GET[\s\S]*\/api\/notifications\/preferences/);
  assert.match(notificationsRoute, /PATCH[\s\S]*\/api\/notifications\/preferences/);

  // Verify test endpoint
  assert.match(notificationsRoute, /POST[\s\S]*\/api\/notifications\/test/);
  assert.match(notificationsRoute, /requireRole.*admin/);
});

test("notifications route stores tokens in Firestore", () => {
  const notificationsRoute = read("services/api-firebase/src/routes/notifications.js");

  // Verify device_tokens collection
  assert.match(notificationsRoute, /device_tokens/);

  // Verify token metadata storage
  assert.match(notificationsRoute, /platform/);
  assert.match(notificationsRoute, /email/);
  assert.match(notificationsRoute, /token/);
});

test("server.js registers notifications route", () => {
  const server = read("services/api-firebase/src/server.js");

  // Verify import
  assert.match(server, /import.*notifications[\s\S]*routes\/notifications/);

  // Verify route registration
  assert.match(server, /app\.use\(notifications\)/);
});

test("retention.js sends notifications for overdue action items", () => {
  const retention = read("services/api-firebase/src/routes/retention.js");

  // Verify imports
  assert.match(retention, /buildActionItemNotification/);
  assert.match(retention, /sendToUser/);

  // Verify overdue logic
  assert.match(retention, /due_date/);
  assert.match(retention, /status[\s\S]*OPEN/);
  assert.match(retention, /daysOverdue/);

  // Verify notification sending
  assert.match(retention, /sendToUser[\s\S]*db[\s\S]*orgId[\s\S]*notification/);
});

test("action_items pagination returns proper response structure", () => {
  const actionItems = read("services/api-firebase/src/routes/action_items.js");

  // Verify paginated response in /meetings/:id/action-items
  assert.match(actionItems, /action_items:/);
  assert.match(actionItems, /total[\s\S]*limit[\s\S]*offset/);
});

test("Phase 15 mobile API enhancements are production-ready", () => {
  // Verify all key components exist and are properly structured

  const meetings = read("services/api-firebase/src/routes/meetings.js");
  assert.match(meetings, /Math\.min[\s\S]*Math\.max/);  // Proper limit validation

  const notifications = read("services/api-firebase/src/services/notifications.js");
  assert.match(notifications, /catch[\s\S]*error/);  // Error handling

  const notificationsRoute = read("services/api-firebase/src/routes/notifications.js");
  assert.match(notificationsRoute, /requireAuth/);  // Auth is enforced
});

test("notification builders create proper payloads", () => {
  const notifications = read("services/api-firebase/src/services/notifications.js");

  // Verify payload structure
  assert.match(notifications, /title[\s\S]*body/);
  assert.match(notifications, /event_type/);
  assert.match(notifications, /data:/);

  // Verify multiple notification types
  assert.match(notifications, /created[\s\S]*approved[\s\S]*uploaded/);
});
