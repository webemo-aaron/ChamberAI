# Contributing to ChamberOfCommerceAI

Thank you for your interest in contributing to ChamberOfCommerceAI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the [issue list](https://github.com/mahoosuc-solutions/ChamberOfCommerceAI/issues) as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps which reproduce the problem** in as many details as possible
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots/videos if possible**
- **Include your environment details**: OS, browser, versions, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior** and **the expected enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

- Fill in the required template
- Follow the [styleguides](#styleguides)
- End all files with a newline
- Avoid platform-dependent code
- Ensure all tests pass

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (optional but recommended)
- Git

### Setting Up Your Development Environment

1. **Fork and clone the repository**

```bash
git clone https://github.com/mahoosuc-solutions/ChamberOfCommerceAI.git
cd ChamberOfCommerceAI
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development services**

```bash
# Using Docker (recommended)
docker-compose up -d

# Or manually in separate terminals:
# Terminal 1: Firebase emulator
npm run dev:firebase

# Terminal 2: API service
npm run dev:api

# Terminal 3: Console UI
npm run dev:console
```

4. **Open in browser**

- Console: http://localhost:5173
- API Health: http://localhost:4001/health
- Firebase Emulator: http://localhost:4000

### Project Structure

```
ChamberOfCommerceAI/
├── apps/
│   └── secretary-console/          # Main UI application
│       ├── app.js                 # Core application logic
│       ├── modules.js             # Feature flags configuration
│       ├── index.html             # HTML structure
│       └── styles/                # CSS files
├── services/
│   ├── api-firebase/              # Backend API service
│   │   ├── src/
│   │   ├── server.js
│   │   └── Dockerfile
│   └── worker-firebase/           # Background worker service
│       ├── src/
│       └── Dockerfile
├── tests/
│   ├── unit/                      # Unit tests
│   └── playwright/                # E2E tests
├── docs/                          # Documentation
├── docker-compose.yml             # Local development setup
├── package.json                   # Project metadata
└── README.md                      # Project overview
```

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add meeting approval workflow

- Implement approval checklist UI
- Add approval flag to meeting metadata
- Add validation before approval

Fixes #123
```

### JavaScript/Node.js Code Style

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).

Key points:
- Use 2 spaces for indentation
- Use single quotes for strings
- Semicolons required
- No trailing commas (except in multi-line objects/arrays)
- Use `const` by default, `let` when needed, avoid `var`

Example:
```javascript
const handleMeetingCreate = async (meetingData) => {
  try {
    const response = await api.createMeeting(meetingData);
    return response.data;
  } catch (error) {
    console.error('Failed to create meeting:', error);
    throw error;
  }
};
```

### Test Code Style

- Use descriptive test names: `test('should create meeting with valid data')`
- Organize tests with `describe` blocks by feature
- Use `beforeEach` for setup, `afterEach` for cleanup

Example:
```javascript
describe('Meeting Creation', () => {
  let page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
  });

  test('should create meeting with all required fields', async () => {
    await page.fill('[data-testid="meeting-date"]', '2026-03-25');
    await page.click('[data-testid="create-meeting"]');
    await expect(page.locator('text="Meeting created"')).toBeVisible();
  });
});
```

### Documentation Style

- Use clear, concise language
- Include code examples where helpful
- Use markdown formatting for structure
- Keep lines under 100 characters where possible

## Testing

### Running Tests

```bash
# Unit tests
npm run test:unit

# Unit tests with coverage
npm run test:unit:coverage

# E2E tests (headed browser)
npm run test:e2e:headed

# E2E tests (headless)
npm run test:e2e

# Debug specific test
npm run test:e2e:debug -- tests/playwright/meeting-creation.spec.js

# All tests
npm test
```

### Writing Tests

**Unit Tests**: Test individual functions in isolation
```javascript
import { validateMeetingData } from '../../src/validation.js';

test('should validate meeting data', () => {
  const valid = validateMeetingData({
    date: '2026-03-25',
    startTime: '10:00',
    location: 'Main Conference Room'
  });
  assert.equal(valid, true);
});
```

**E2E Tests**: Test complete user workflows
```javascript
test('should complete meeting workflow', async ({ page }) => {
  // Create meeting
  await page.fill('[data-testid="meeting-location"]', 'Test Room');
  await page.click('[data-testid="create-meeting"]');
  
  // Upload audio
  await page.setInputFiles('[data-testid="audio-upload"]', 'test-audio.mp3');
  
  // Verify completion
  await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Uploaded');
});
```

### Test Coverage Goals

- Unit tests: 80%+ coverage for core logic
- E2E tests: 100% coverage of user workflows
- Accessibility tests: WCAG AA compliance

## Submitting Changes

1. **Create a feature branch**

```bash
git checkout -b feature/add-meeting-templates
```

2. **Make your changes**

- Follow the styleguides
- Write clear commit messages
- Add tests for new functionality

3. **Run tests and linting**

```bash
# Run all tests
npm test

# Check code style (if configured)
npm run lint

# Fix style issues (if configured)
npm run lint:fix
```

4. **Push your branch**

```bash
git push origin feature/add-meeting-templates
```

5. **Create a Pull Request**

- Fill in the PR template
- Reference related issues
- Wait for CI checks to pass
- Respond to review feedback

## Pull Request Process

1. Update documentation as needed
2. Add tests for new features
3. Ensure all tests pass locally
4. Make sure code follows styleguides
5. Wait for maintainer review
6. Respond to feedback and make revisions
7. Squash commits if requested
8. PR will be merged by maintainer

## Reporting Security Issues

**Please do not file public issues for security vulnerabilities.**

Instead, please email security@chamberai.dev with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

See [SECURITY.md](SECURITY.md) for more details.

## Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Release notes for significant contributions
- GitHub contributors page

## Questions?

- Open a GitHub Discussion
- Check the [documentation](docs/)
- Join our community chat

## License

By contributing to ChamberOfCommerceAI, you agree that your contributions will be licensed under its [MIT License](LICENSE).

---

**Thank you for contributing to ChamberOfCommerceAI!** 🚀
