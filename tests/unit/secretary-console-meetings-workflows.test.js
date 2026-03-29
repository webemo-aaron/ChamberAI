import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildMeetingExportText,
  buildMeetingSummaryDraft
} from "../../apps/secretary-console/views/meetings/meeting-workflow-utils.js";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("meeting workflow helpers generate export and summary content", () => {
  const meeting = {
    location: "Board Room",
    date: "2026-03-28T14:00:00.000Z",
    chair: "Alex",
    secretary: "Riley",
    attendeeCount: 6,
    tags: ["budget", "membership"]
  };

  const draft = buildMeetingSummaryDraft(
    meeting,
    "Budget review completed.\nMembership campaign approved."
  );
  const exportText = buildMeetingExportText(meeting);

  assert.match(draft, /Board Room session/);
  assert.match(draft, /budget, membership/);
  assert.match(exportText, /Chair: Alex/);
  assert.match(exportText, /Secretary: Riley/);
});

test("meetings detail actions no longer rely on coming-soon placeholders", () => {
  const headerJs = read(
    "apps/secretary-console/views/meetings/meeting-detail-header.js"
  );
  const summaryTabJs = read(
    "apps/secretary-console/views/meetings/tabs/public-summary-tab.js"
  );

  assert.doesNotMatch(headerJs, /coming soon/);
  assert.doesNotMatch(summaryTabJs, /coming soon/);
  assert.match(summaryTabJs, /buildMeetingSummaryDraft/);
  assert.match(headerJs, /meeting-tab-requested/);
  assert.match(headerJs, /geoMeetingBtn/);
  assert.match(headerJs, /navigate\("\/geo-intelligence"\)/);
  assert.match(headerJs, /inferShowcaseCityFromMeeting/);
});

test("public summary tab uses live summary and minutes endpoints with draft and export actions", () => {
  const summaryTabJs = read(
    "apps/secretary-console/views/meetings/tabs/public-summary-tab.js"
  );
  const minutesTabJs = read(
    "apps/secretary-console/views/meetings/tabs/minutes-tab.js"
  );
  const actionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/action-items-tab.js"
  );

  assert.match(summaryTabJs, /request\(`\/meetings\/\$\{meeting\.id\}\/summary`, "GET"\)/);
  assert.match(summaryTabJs, /request\(`\/meetings\/\$\{meeting\.id\}\/minutes`, "GET", null, \{/);
  assert.match(summaryTabJs, /btn-draft/);
  assert.match(summaryTabJs, /btn-export/);
  assert.match(summaryTabJs, /surface-primary-actions/);
  assert.match(minutesTabJs, /surface-primary-actions/);
  assert.match(actionsTabJs, /surface-primary-actions/);
});

test("meetings action, motion, and audit tabs are wired to live workflows", () => {
  const actionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/action-items-tab.js"
  );
  const motionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/motions-tab.js"
  );
  const auditTabJs = read(
    "apps/secretary-console/views/meetings/tabs/audit-tab.js"
  );

  assert.match(actionsTabJs, /request\(`\/meetings\/\$\{meeting\.id\}\/actions`, "GET"\)/);
  assert.match(actionsTabJs, /btn-add-action/);
  assert.match(actionsTabJs, /btn-export-csv/);
  assert.match(actionsTabJs, /row-action-menu/);
  assert.match(actionsTabJs, /btn-row-menu/);
  assert.match(motionsTabJs, /request\(`\/meetings\/\$\{meeting\.id\}\/motions`, "GET"\)/);
  assert.match(motionsTabJs, /btn-create-motion/);
  assert.match(motionsTabJs, /vote: voteType/);
  assert.match(motionsTabJs, /motion-row-menu/);
  assert.match(motionsTabJs, /btn-row-menu/);
  assert.match(auditTabJs, /request\(`\/meetings\/\$\{meeting\.id\}\/audit`, "GET"\)/);
  assert.match(auditTabJs, /#actionFilter/);
  assert.match(auditTabJs, /#userFilter/);
});

test("meetings file-based integrations use the shared API base and auth path", () => {
  const apiJs = read("apps/secretary-console/core/api.js");
  const actionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/action-items-tab.js"
  );
  const minutesTabJs = read(
    "apps/secretary-console/views/meetings/tabs/minutes-tab.js"
  );

  assert.match(apiJs, /export async function fetchWithAuth/);
  assert.match(actionsTabJs, /fetchWithAuth\(`\/meetings\/\$\{meetingId\}\/actions\/import-csv`/);
  assert.match(minutesTabJs, /fetchWithAuth\(`\/meetings\/\$\{meetingId\}\/minutes\/audio`/);
});

test("meetings list supports showcase city switching for seeded live demos", () => {
  const listJs = read("apps/secretary-console/views/meetings/meeting-list.js");
  const viewJs = read("apps/secretary-console/views/meetings/meetings-view.js");

  assert.match(listJs, /showcaseCityFilter/);
  assert.match(listJs, /showcase-city-changed/);
  assert.match(listJs, /statusFilterState/);
  assert.match(viewJs, /listenForShowcaseCityChanged/);
  assert.match(viewJs, /filterMeetingsByShowcaseCity/);
  assert.match(viewJs, /Meetings scoped to/);
});

test("meetings view utilities are extracted and reused across files", () => {
  const formatJs = read("apps/secretary-console/views/meetings/utils/format.js");
  const filterJs = read("apps/secretary-console/views/meetings/utils/filter.js");
  const meetingRowJs = read(
    "apps/secretary-console/views/meetings/components/meeting-row.js"
  );
  const listJs = read("apps/secretary-console/views/meetings/meeting-list.js");
  const headerJs = read(
    "apps/secretary-console/views/meetings/meeting-detail-header.js"
  );
  const workflowUtilsJs = read(
    "apps/secretary-console/views/meetings/meeting-workflow-utils.js"
  );
  const minutesTabJs = read(
    "apps/secretary-console/views/meetings/tabs/minutes-tab.js"
  );
  const actionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/action-items-tab.js"
  );
  const motionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/motions-tab.js"
  );
  const auditTabJs = read(
    "apps/secretary-console/views/meetings/tabs/audit-tab.js"
  );
  const summaryTabJs = read(
    "apps/secretary-console/views/meetings/tabs/public-summary-tab.js"
  );

  // Verify utilities exist and export expected functions
  assert.match(formatJs, /export function formatDate/);
  assert.match(formatJs, /export function escapeHtml/);
  assert.match(filterJs, /export function filterBySearch/);
  assert.match(filterJs, /export function filterByStatus/);
  assert.match(filterJs, /export function applyMeetingsFilter/);
  assert.match(meetingRowJs, /export function createMeetingRow/);
  assert.match(meetingRowJs, /from "\.\.\/utils\/format\.js"/);

  // Verify meeting-list imports from utils and components
  assert.match(listJs, /import.*createMeetingRow.*from "\.\/components\/meeting-row/);
  assert.match(listJs, /import.*applyMeetingsFilter.*from "\.\/utils\/filter/);
  // Verify formatDate/escapeHtml are no longer defined locally in meeting-list.js
  assert.doesNotMatch(listJs, /function formatDate\(dateStr\)/);
  assert.doesNotMatch(listJs, /function escapeHtml\(text\)/);
  assert.doesNotMatch(listJs, /function createMeetingRow\(/);

  // Verify header imports formatDate and escapeHtml
  assert.match(
    headerJs,
    /import.*formatDate.*escapeHtml.*from "\.\/utils\/format\.js"/
  );

  // Verify workflow-utils imports formatDate
  assert.match(workflowUtilsJs, /import.*formatDate.*from "\.\/utils\/format\.js"/);

  // Verify all tabs import from utils/format.js and don't define duplicates
  for (const [name, content] of [
    ["minutes-tab", minutesTabJs],
    ["action-items-tab", actionsTabJs],
    ["motions-tab", motionsTabJs],
    ["audit-tab", auditTabJs],
    ["public-summary-tab", summaryTabJs]
  ]) {
    assert.match(
      content,
      /from "\.\.\/utils\/format\.js"/,
      `${name} should import from utils/format.js`
    );
    // Check that local definitions are removed
    if (name === "minutes-tab" || name === "action-items-tab") {
      // These had both formatDate and escapeHtml
      assert.doesNotMatch(
        content,
        /function formatDate\(/,
        `${name} should not define formatDate`
      );
    }
    if (
      name === "motions-tab" ||
      name === "audit-tab" ||
      name === "public-summary-tab"
    ) {
      // These had escapeHtml
      assert.doesNotMatch(
        content,
        /function escapeHtml\(/,
        `${name} should not define escapeHtml`
      );
    }
  }

  // Verify action-items-tab has data-testid attributes
  assert.match(actionsTabJs, /data-testid="quick-submit"/);
  assert.match(actionsTabJs, /data-testid="quick-cancel"/);
});

test("meetings view implements proper cleanup on route change", () => {
  const routerJs = read("apps/secretary-console/core/router.js");
  const meetingsViewJs = read("apps/secretary-console/views/meetings/meetings-view.js");
  const meetingDetailJs = read(
    "apps/secretary-console/views/meetings/meeting-detail.js"
  );
  const minutesTabJs = read(
    "apps/secretary-console/views/meetings/tabs/minutes-tab.js"
  );
  const actionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/action-items-tab.js"
  );
  const motionsTabJs = read(
    "apps/secretary-console/views/meetings/tabs/motions-tab.js"
  );
  const auditTabJs = read(
    "apps/secretary-console/views/meetings/tabs/audit-tab.js"
  );
  const summaryTabJs = read(
    "apps/secretary-console/views/meetings/tabs/public-summary-tab.js"
  );

  // Verify router implements onCleanup support
  assert.match(routerJs, /let pendingCleanup = null/);
  assert.match(routerJs, /onCleanup: \(fn\) => \{/);
  assert.match(routerJs, /if \(pendingCleanup\)/);

  // Verify all tab modules export cleanup
  assert.match(minutesTabJs, /export function cleanup\(\)/);
  assert.match(actionsTabJs, /export function cleanup\(\)/);
  assert.match(motionsTabJs, /export function cleanup\(\)/);
  assert.match(auditTabJs, /export function cleanup\(\)/);
  assert.match(summaryTabJs, /export function cleanup\(\)/);

  // Verify meeting-detail exports cleanup and calls tab cleanups on meeting change
  assert.match(meetingDetailJs, /export function cleanup\(\)/);
  assert.match(meetingDetailJs, /mod\.cleanup\?\.\(\)/);
  assert.match(meetingDetailJs, /loadedModules\.clear\(\)/);
  assert.match(meetingDetailJs, /setAttribute\("data-loaded", "false"\)/);

  // Verify meetings-view imports and calls cleanupMeetingDetail
  assert.match(meetingsViewJs, /cleanup as cleanupMeetingDetail/);
  assert.match(meetingsViewJs, /from "\.\/meeting-detail\.js"/);
  assert.match(meetingsViewJs, /cleanupMeetingDetail\(\)/);
});

