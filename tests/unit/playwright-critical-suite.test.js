import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("playwright bootstrap helper supports routed login page and legacy modal ids", () => {
  const helpers = read("tests/playwright/support/ui_helpers.mjs");

  assert.match(helpers, /camRole/);
  assert.match(helpers, /camEmail/);
  assert.match(helpers, /camShowcaseCity/);
  assert.match(helpers, /camApiBase/);
  assert.match(helpers, /#loginPageContainer/);
  assert.match(helpers, /#loginModal/);
  assert.match(helpers, /summary\.demo-summary/);
  assert.match(helpers, /#loginEmail/);
  assert.match(helpers, /#loginRole/);
  assert.match(helpers, /#loginSubmit/);
  assert.match(helpers, /#modalLoginEmail/);
  assert.match(helpers, /#modalLoginRole/);
  assert.match(helpers, /#modalLoginSubmit/);
  assert.match(helpers, /page\.goto\(`\$\{UI_BASE\}\/#\/meetings`\)/);
  assert.match(helpers, /#refreshBtn/);
  assert.match(helpers, /\.meeting-item/);
  assert.match(helpers, /\.meeting-detail-header/);
});

test("business hub critical spec uses shared Playwright bootstrap and API base helpers", () => {
  const spec = read("tests/playwright/business_hub.spec.mjs");

  assert.match(spec, /import \{ test, expect \} from "@playwright\/test";/);
  assert.match(spec, /import \{ bootstrapPage, UI_BASE \} from "\.\/support\/ui_helpers\.mjs";/);
  assert.doesNotMatch(spec, /localhost:3000/);
  assert.doesNotMatch(spec, /localhost:4000/);
  assert.match(spec, /await bootstrapPage\(page\);/);
  assert.match(spec, /#\/business-hub/);
});

test("action items CSV critical spec uses shared bootstrap and current actions-tab contract", () => {
  const spec = read("tests/playwright/action_items_csv.spec.mjs");

  assert.match(spec, /import \{ bootstrapPage, createMeeting, openMeeting \} from "\.\/support\/ui_helpers\.mjs";/);
  assert.doesNotMatch(spec, /#loginEmail/);
  assert.doesNotMatch(spec, /#apiBase/);
  assert.doesNotMatch(spec, /#csvPreviewModal/);
  assert.match(spec, /detail-tab-bar \[data-tab='actions'\]/);
  assert.match(spec, /\.btn-import-csv/);
  assert.match(spec, /\.btn-export-csv/);
});

test("approval export critical spec uses shared helpers and current export surfaces", () => {
  const spec = read("tests/playwright/approval_export.spec.mjs");

  assert.match(spec, /import \{ API_BASE, bootstrapPage, createMeeting, openMeeting \} from "\.\/support\/ui_helpers\.mjs";/);
  assert.doesNotMatch(spec, /#loginEmail/);
  assert.doesNotMatch(spec, /#apiBase/);
  assert.doesNotMatch(spec, /#approveMeeting/);
  assert.match(spec, /approval-status/);
  assert.match(spec, /#exportMeetingBtn/);
  assert.match(spec, /\.btn-export/);
});

test("meeting creation critical spec uses quick-create modal contract", () => {
  const spec = read("tests/playwright/meeting-creation.spec.js");
  const appJs = read("apps/secretary-console/app.js");
  const meetingListJs = read("apps/secretary-console/views/meetings/meeting-list.js");

  assert.match(spec, /\[data-testid="quick-create"\]/);
  assert.match(spec, /#quickModal/);
  assert.match(spec, /#quickCreateError/);
  assert.match(spec, /expect\(payload\.start_time\)\.toBe\("09:00"\)/);
  assert.match(meetingListJs, /id="createMeetingBtn" data-testid="quick-create"/);
  assert.match(appJs, /meetingsView\?\.addEventListener\("create-meeting"/);
  assert.match(appJs, /await request\("\/meetings", "POST", payload\)/);
});

test("meeting workflow critical spec uses current minutes and actions workspace contract", () => {
  const spec = read("tests/playwright/meeting-workflow.spec.js");

  assert.match(spec, /import \{ API_BASE, bootstrapPage, createMeeting, openMeeting \} from "\.\/support\/ui_helpers\.mjs";/);
  assert.doesNotMatch(spec, /#registerAudio/);
  assert.doesNotMatch(spec, /#meetingStatus/);
  assert.match(spec, /audio-upload-zone input\[type="file"\]/);
  assert.match(spec, /#minutesContent/);
  assert.match(spec, /\.detail-tab-bar \[data-tab='actions'\]/);
  assert.match(spec, /\.modal #actionDescription/);
});

test("public summary critical spec uses shared bootstrap and current summary editor contract", () => {
  const spec = read("tests/playwright/public_summary.spec.mjs");

  assert.match(spec, /import \{ API_BASE, UI_BASE, bootstrapPage, createMeeting, openMeeting \} from "\.\/support\/ui_helpers\.mjs";/);
  assert.doesNotMatch(spec, /#loginEmail/);
  assert.doesNotMatch(spec, /#apiBase/);
  assert.doesNotMatch(spec, /publishPublicSummary/);
  assert.match(spec, /\.summary-editor textarea\.editor-input/);
  assert.match(spec, /\.summary-toolbar \.btn-draft/);
  assert.match(spec, /\.export-menu \[data-format="md"\]/);
});
