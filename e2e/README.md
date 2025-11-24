# End-to-End Tests with Playwright

This directory contains end-to-end tests for the workflow builder application using Playwright.

## Setup

1. **Install Playwright** (if not already installed):
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Install browsers**:
   ```bash
   npx playwright install chromium firefox webkit
   ```

## Running Tests

### Run all E2E tests:
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive):
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

### Run specific test file:
```bash
npm run test:e2e:workflow
```

### Debug tests:
```bash
npm run test:e2e:debug
```

### View test report:
```bash
npm run test:e2e:report
```

## Test Files

### `workflow-creation.spec.ts`
End-to-end test that creates a complete "Standard Company Onboarding" workflow with:
- 9 steps
- All field types (text, email, select, date, number, checkbox, etc.)
- Full workflow configuration

**What it tests:**
1. Navigation to workflow builder
2. Creating a new workflow
3. Adding 9 steps with proper names and descriptions
4. Adding all fields for each step with correct configuration
5. Saving the workflow
6. Verifying the workflow was created successfully

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the project.

### Key Settings:
- **Base URL**: `http://localhost:3000` (or set `PLAYWRIGHT_TEST_BASE_URL` env variable)
- **Test Directory**: `./e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Auto-start dev server**: Yes (runs `npm run dev` before tests)

## Screenshots

Screenshots are automatically saved to `e2e/screenshots/` on test failures or when explicitly taken in tests.

## Environment Variables

- `PLAYWRIGHT_TEST_BASE_URL`: Override the base URL for tests (default: `http://localhost:3000`)
- `CI`: Set to `true` in CI environments for optimized test execution

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e/` directory
2. Import test utilities: `import { test, expect } from '@playwright/test';`
3. Use descriptive test names
4. Add console.log statements for debugging (visible in test output)
5. Take screenshots at key points for verification

### Example Test Structure:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Test steps
    console.log('Step 1: Doing something...');
    await page.click('button');
    
    // Assertions
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Troubleshooting

### Tests fail to find elements:
- Check if the dev server is running
- Verify selectors using Playwright Inspector: `npm run test:e2e:debug`
- Use `page.pause()` to debug interactively

### Tests timeout:
- Increase timeout in `playwright.config.ts`
- Check if the app is loading correctly
- Verify network requests are completing

### Browser not found:
- Run `npx playwright install` to install browsers
- Check browser installation: `npx playwright install --help`

## CI/CD Integration

For CI environments, set `CI=true`:
```bash
CI=true npm run test:e2e
```

This will:
- Run tests in parallel (1 worker)
- Retry failed tests 2 times
- Generate HTML report
- Save traces and videos on failure

