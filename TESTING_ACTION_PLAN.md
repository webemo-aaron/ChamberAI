# ChamberAI Testing - 30-Day Action Plan

**Current Grade:** C+ (67/100)
**Target Grade (30 days):** B (80/100)
**Target Grade (60 days):** A- (90/100)

---

## Week 1: Foundation & Quick Wins

### Monday (2-3 hours)

**Task 1: Fix Playwright Anti-patterns** (30 mins)
```bash
# File: tests/playwright/feature-flags.spec.js
# Action: Replace all waitForTimeout() with proper waits

BEFORE:
await page.waitForTimeout(500);

AFTER:
await page.waitForFunction(() => {
  return document.querySelector('#retentionResult')?.textContent?.length > 0;
}, { timeout: 5000 });
```

**Task 2: Add Data Test Attributes to UI** (45 mins)
```bash
# File: apps/secretary-console/src/ (all components)
# Action: Add data-testid to interactive elements

# Example components to update:
# - Meeting list items
# - Form inputs
# - Action buttons
# - Settings checkboxes
# - Navigation tabs

# Pattern:
# <button data-testid="save-meeting">Save</button>
# <input data-testid="meeting-title" />
```

**Task 3: Create Test Fixtures** (45 mins)
```bash
# File: tests/fixtures/data.js
# Create reusable test data

export const fixtures = {
  validMeeting: { /* ... */ },
  invalidMeeting: { /* ... */ },
  validAudio: { /* ... */ },
  testUser: { /* ... */ }
};
```

### Tuesday (2 hours)

**Task 4: Create Test Organization** (1 hour)
```bash
# Create directory structure:
tests/
├── fixtures/          # Test data
├── helpers/           # Setup utilities
├── unit/              # Unit tests
│   ├── db.test.js
│   ├── validation.test.js
│   └── ...
└── playwright/        # E2E tests
    ├── feature-flags.spec.js (existing)
    ├── meeting-workflow.spec.js (new)
    └── ...
```

**Task 5: Add Error Handling Tests** (1 hour)
Create: `tests/unit/error-handling.test.js`

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";

test("API returns 400 for missing required fields", () => {
  // Test: createMeeting without date field
});

test("API returns 401 for unauthorized request", () => {
  // Test: API call without auth token
});

test("API returns 404 for non-existent meeting", () => {
  // Test: getM eeting with invalid ID
});

test("API returns 422 for invalid input", () => {
  // Test: createMeeting with invalid date format
});

test("API returns 500 with error details on server error", () => {
  // Test: API call when database fails
});
```

### Wednesday (2-3 hours)

**Task 6: Add Motion Management Tests** (2-3 hours)
Create: `tests/unit/motions.test.js`

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMeeting,
  createMotion,
  recordVote,
  tallyMotion,
  approveMotion
} from "../services/api/index.js";

test("Create motion with title and description", () => {
  // Test motion creation
});

test("Record vote (yes/no/abstain) on motion", () => {
  // Test vote recording
});

test("Tally votes and determine result", () => {
  // Test vote counting
});

test("Handle tie-breaking procedure", () => {
  // Test tie scenarios
});

test("Cannot vote twice on same motion", () => {
  // Test vote validation
});

test("Motion status transitions correctly", () => {
  // Test: pending → voted → resolved
});
```

### Thursday-Friday (2-3 hours)

**Task 7: Setup Package.json Test Scripts** (30 mins)
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "node --test 'tests/unit/**/*.test.js'",
    "test:unit:watch": "node --test --watch 'tests/unit/**/*.test.js'",
    "test:unit:coverage": "nyc node --test 'tests/unit/**/*.test.js'",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:errors": "node --test 'tests/unit/error-handling.test.js'",
    "test:motions": "node --test 'tests/unit/motions.test.js'"
  }
}
```

**Task 8: Add Coverage Reporting** (1.5 hours)
```bash
# Install:
npm install --save-dev nyc

# Create: .nycrc.json
{
  "reporter": ["html", "text", "lcov"],
  "exclude": ["tests/**", "node_modules/**"],
  "all": true,
  "lines": 80,
  "statements": 80,
  "functions": 80,
  "branches": 75
}

# Run:
npm run test:unit:coverage
```

---

## Week 2: E2E Testing

### Monday-Tuesday (3-4 hours)

**Task 9: Create Meeting Workflow E2E Tests** (3-4 hours)
Create: `tests/playwright/meeting-workflow.spec.js`

```javascript
import { test, expect } from "@playwright/test";

test.describe("Meeting Workflow", () => {
  test("Create new meeting from scratch", async ({ page }) => {
    await page.goto("/");

    // Click "New Meeting" button
    await page.click('button[data-testid="new-meeting"]');

    // Fill form
    await page.fill('input[data-testid="meeting-title"]', 'Board Meeting');
    await page.fill('input[data-testid="meeting-date"]', '2026-02-15');
    await page.fill('input[data-testid="meeting-location"]', 'Conference Room');

    // Submit
    await page.click('button[data-testid="save-meeting"]');

    // Verify created
    await expect(page.locator('h1:has-text("Board Meeting")')).toBeVisible();
  });

  test("Upload audio file to meeting", async ({ page }) => {
    // Navigate to meeting
    // Upload file
    // Verify upload success
  });

  test("View and edit draft minutes", async ({ page }) => {
    // Process meeting
    // View draft minutes
    // Edit text
    // Save changes
  });

  test("Create and vote on motion", async ({ page }) => {
    // Add motion
    // Record votes
    // Verify tally
  });

  test("Add action items with owners", async ({ page }) => {
    // Add action item
    // Assign owner
    // Set due date
    // Save
  });

  test("Approve minutes workflow", async ({ page }) => {
    // Verify all sections complete
    // Approve minutes
    // Confirm approval
  });
});
```

### Wednesday-Friday (3-4 hours)

**Task 10: Create Settings & Features E2E Tests** (2 hours)
Create: `tests/playwright/settings.spec.js`

```javascript
test.describe("Settings", () => {
  test("Toggle feature flags", async ({ page }) => {
    // Navigate to Settings
    // Toggle Public Summary flag
    // Verify tab appears/disappears
  });

  test("Run retention sweep", async ({ page }) => {
    // Click retention button
    // Verify confirmation
    // Check results
  });

  test("View audit log", async ({ page }) => {
    // Navigate to audit log
    // Verify entries
    // Check filters work
  });
});
```

**Task 11: Create Accessibility Tests** (2 hours)
Create: `tests/playwright/accessibility.spec.js`

```javascript
test.describe("Accessibility", () => {
  test("Keyboard navigation with Tab", async ({ page }) => {
    // Tab through all interactive elements
    // Verify focus is visible
  });

  test("Form inputs are labeled", async ({ page }) => {
    // Check all inputs have associated labels
    // Verify ARIA attributes
  });

  test("Color contrast meets WCAG AA", async ({ page }) => {
    // Use axe accessibility checker
  });
});
```

---

## Week 3: Integration & Polish

### Monday-Tuesday (2 hours)

**Task 12: Document Testing in README** (1 hour)
Create/update: `TESTING.md`

```markdown
# Testing Guide

## Running Tests

### Unit Tests
\`\`\`bash
npm run test:unit        # Run all unit tests
npm run test:unit:watch  # Watch mode
npm run test:unit:coverage # With coverage
\`\`\`

### E2E Tests
\`\`\`bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:headed  # See browser
npm run test:e2e:debug   # Debug mode
\`\`\`

## Writing Tests

### Unit Test Template
\`\`\`javascript
import { test } from "node:test";
import assert from "node:assert/strict";

test("describe what is being tested", () => {
  // Arrange
  // Act
  // Assert
});
\`\`\`

### E2E Test Template
\`\`\`javascript
test("describe user workflow", async ({ page }) => {
  await page.goto("/");
  await page.click('button[data-testid="action"]');
  await expect(page.locator('h1')).toContainText("Expected");
});
\`\`\`
```

**Task 13: Setup GitHub Actions CI/CD** (1 hour)
Create: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm install
      - run: npm run test:unit
      - run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Wednesday-Friday (2-3 hours)

**Task 14: Test Coverage Review** (1.5 hours)
```bash
# Run coverage
npm run test:unit:coverage

# Target: 65%+ coverage
# Check:
# - statements: 65%+
# - branches: 60%+
# - functions: 65%+
# - lines: 65%+
```

**Task 15: Fix Any Flaky Tests** (1.5 hours)
```bash
# Run tests multiple times
# Identify any that fail intermittently
# Fix with proper waits/retries

# Common fixes:
# - Replace waitForTimeout
# - Use proper event waits
# - Add retry logic where needed
```

---

## Daily Checklist

### Every Day
- [ ] Run tests before committing
- [ ] Review test output
- [ ] Update coverage dashboard
- [ ] Check for flaky tests
- [ ] Document new test scenarios

### Every Week
- [ ] Review test coverage percentage
- [ ] Identify untested features
- [ ] Plan new tests
- [ ] Refactor test code
- [ ] Update test documentation

---

## Success Metrics - By Week

### End of Week 1
- [ ] ✅ All quick wins implemented
- [ ] ✅ Test structure organized
- [ ] ✅ Error handling tests added (5 tests)
- [ ] ✅ Motion tests added (6 tests)
- [ ] ✅ Coverage reporting setup
- [ ] [ ] Test count: 20+ tests
- [ ] [ ] API coverage: 75%+

### End of Week 2
- [ ] ✅ E2E workflow tests (20+ tests)
- [ ] ✅ Settings/features tests (8 tests)
- [ ] ✅ Accessibility tests (6 tests)
- [ ] ✅ All Playwright anti-patterns fixed
- [ ] [ ] Test count: 54+ tests
- [ ] [ ] Overall coverage: 60%+

### End of Week 3
- [ ] ✅ GitHub Actions pipeline working
- [ ] ✅ CI/CD blocking on test failures
- [ ] ✅ Documentation complete
- [ ] ✅ All flaky tests fixed
- [ ] [ ] Test count: 60+ tests
- [ ] [ ] Overall coverage: 65%+
- [ ] [ ] Grade: B (80/100)

---

## Estimated Time Breakdown

| Week | Task | Hours | Status |
|------|------|-------|--------|
| W1 | Quick wins | 2 | 🟢 Ready |
| W1 | Error handling | 1.5 | 🟢 Ready |
| W1 | Motions tests | 2-3 | 🟢 Ready |
| W1 | Organization | 1 | 🟢 Ready |
| W2 | E2E workflows | 3-4 | 🟢 Ready |
| W2 | Settings/Accessibility | 4 | 🟢 Ready |
| W3 | Documentation | 1 | 🟢 Ready |
| W3 | CI/CD setup | 1 | 🟢 Ready |
| W3 | Coverage review | 1.5 | 🟢 Ready |
| **Total** | | **17-18 hrs** | |

---

## Acceptance Criteria

### For Grade B (80/100) - 30 Days
- [ ] 50+ passing tests
- [ ] 65%+ code coverage
- [ ] API tests: A- (95/100)
- [ ] E2E tests: B+ (85/100)
- [ ] Zero flaky tests
- [ ] CI/CD pipeline active
- [ ] All critical paths tested

### For Grade A- (90/100) - 60 Days
- [ ] 100+ passing tests
- [ ] 85%+ code coverage
- [ ] API tests: A (98/100)
- [ ] E2E tests: A- (90/100)
- [ ] Visual regression testing
- [ ] Accessibility verified
- [ ] Cross-browser tested

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Testing Best Practices](https://testingjavascript.com)
- [Accessibility Testing](https://www.w3.org/WAI/test-evaluate)

---

## Questions & Support

When implementing tests:
1. Check existing tests for patterns
2. Use fixtures for test data
3. Keep tests focused and independent
4. Document complex test logic
5. Ask for code review before merging

---

**Next Step:** Start Week 1, Monday with Task 1 (Fix Playwright Anti-patterns)
