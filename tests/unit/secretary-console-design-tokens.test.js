import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("secretary console core styles use ChamberAI design tokens", () => {
  const stylesCss = read("apps/secretary-console/styles.css");
  const businessHubCss = read(
    "apps/secretary-console/views/business-hub/business-hub.css"
  );
  const meetingsCss = read(
    "apps/secretary-console/views/meetings/meetings.css"
  );
  const kioskWidgetCss = read(
    "apps/secretary-console/components/kiosk-widget.css"
  );
  const kioskCss = read("apps/secretary-console/views/kiosk/kiosk.css");

  assert.match(stylesCss, /\.modal\s*\{[\s\S]*background:\s*var\(--color-bg-overlay\)/);
  assert.match(stylesCss, /\.toast\s*\{[\s\S]*background:\s*var\(--color-success\)/);
  assert.match(stylesCss, /\.btn-primary\s*\{[\s\S]*background:\s*var\(--color-primary\)/);
  assert.match(stylesCss, /\.btn-secondary:hover\s*\{[\s\S]*background:\s*var\(--color-primary-50\)/);
  assert.match(stylesCss, /\.demo-summary\s*\{[\s\S]*background:\s*var\(--color-bg-secondary\)/);
  assert.ok(!stylesCss.includes("rgba(10, 93, 82"));

  assert.match(businessHubCss, /--business-accent:\s*var\(--color-primary\)/);
  assert.match(businessHubCss, /--business-accent-soft:\s*var\(--color-primary-50\)/);
  assert.match(businessHubCss, /--business-success:\s*var\(--color-success\)/);

  assert.match(meetingsCss, /--accent-color:\s*var\(--color-primary\)/);
  assert.match(meetingsCss, /--status-approved:\s*var\(--color-success-50\)/);
  assert.match(meetingsCss, /--status-failed:\s*var\(--color-error-50\)/);

  assert.match(kioskWidgetCss, /--widget-bubble-bg-from:\s*var\(--color-primary\)/);
  assert.match(kioskWidgetCss, /--widget-header-bg:\s*var\(--color-bg-secondary\)/);
  assert.match(kioskWidgetCss, /--widget-close-color:\s*var\(--color-error\)/);

  assert.match(kioskCss, /\.kiosk-page\s*\{[\s\S]*background:\s*var\(--color-bg-secondary\)/);
  assert.match(kioskCss, /\.user-bubble\s*\{[\s\S]*background:\s*linear-gradient\(\s*135deg,\s*var\(--color-primary\)/);
  assert.match(kioskCss, /\.kiosk-mode-banner\.public\s*\{[\s\S]*background-color:\s*var\(--color-primary-50\)/);
});

test("secretary console dark mode overrides hardcoded light surfaces in the shell", () => {
  const stylesCss = read("apps/secretary-console/styles.css");

  assert.match(
    stylesCss,
    /@media \(prefers-color-scheme: dark\) \{[\s\S]*?\.btn\.ghost\s*\{[\s\S]*?background:\s*var\(--color-bg-secondary\)/
  );
  assert.match(
    stylesCss,
    /@media \(prefers-color-scheme: dark\) \{[\s\S]*?\.meeting-card\s*\{[\s\S]*?background:\s*var\(--color-bg-secondary\)/
  );
  assert.match(
    stylesCss,
    /@media \(prefers-color-scheme: dark\) \{[\s\S]*?\.tab\s*\{[\s\S]*?background:\s*var\(--color-bg-tertiary\)/
  );
  assert.match(
    stylesCss,
    /@media \(prefers-color-scheme: dark\) \{[\s\S]*?\.summary-checklist[\s\S]*?background:\s*var\(--color-bg-secondary\)/
  );
  assert.match(
    stylesCss,
    /@media \(prefers-color-scheme: dark\) \{[\s\S]*?\.warning[\s\S]*?background:\s*var\(--color-bg-tertiary\)/
  );
  assert.match(
    stylesCss,
    /@media \(prefers-color-scheme: dark\) \{[\s\S]*?\.adjournment-gate[\s\S]*?background:\s*var\(--color-bg-tertiary\)/
  );
});
