# End-to-End Testing Setup - Playwright

## ✅ What Was Created

### 1. **Playwright Configuration** (`playwright.config.ts`)
   - Configured for Next.js application
   - Supports Chromium, Firefox, and WebKit browsers
   - Auto-starts dev server before tests
   - Generates HTML reports and screenshots on failure

### 2. **E2E Test File** (`e2e/workflow-creation.spec.ts`)
   - Complete end-to-end test for creating the "Standard Company Onboarding" workflow
   - Creates all 9 steps with their fields
   - Tests the entire workflow creation flow through the UI
   - Includes verification steps

### 3. **Test Scripts** (added to `package.json`)
   - `npm run test:e2e` - Run all tests
   - `npm run test:e2e:ui` - Interactive UI mode
   - `npm run test:e2e:headed` - Run with visible browser
   - `npm run test:e2e:debug` - Debug mode
   - `npm run test:e2e:workflow` - Run workflow creation test only
   - `npm run test:e2e:report` - View test report

### 4. **Documentation**
   - `e2e/README.md` - Complete guide for running and writing tests
   - `.gitignore` - Updated to exclude test artifacts

## 🚀 Quick Start

### Step 1: Install Playwright (if not already installed)
```bash
cd nishi-luxshtech-multi-company-rbac/multi-company-rbac
npm install -D @playwright/test
npx playwright install
```

### Step 2: Install Browsers
```bash
npx playwright install chromium firefox webkit
```

### Step 3: Run the Test
```bash
# Make sure your backend is running on http://127.0.0.1:8000
# Make sure your frontend dev server is running (or it will auto-start)

npm run test:e2e:workflow
```

## 📋 What the Test Does

The test (`workflow-creation.spec.ts`) performs the following steps:

1. **Navigates to the application** (`http://localhost:3000`)
2. **Clicks on "Workflows" tab** in the sidebar/navigation
3. **Clicks "Create Workflow" button**
4. **Fills in workflow details:**
   - Name: "Standard Company Onboarding"
   - Description: "Comprehensive 9-step company onboarding process..."
5. **Creates 9 steps** with the following structure:

   **Step 1: General Information** (8 fields)
   - Company Name (text)
   - Company Code (text)
   - Association Number (text)
   - Country (select)
   - Default Language (select)
   - Form of Business (select)
   - Company Creation Date (date)
   - Company Website (url)

   **Step 2: Addresses** (7 fields)
   - Address Type (select)
   - Address Line 1 (text)
   - Address Line 2 (text)
   - City (text)
   - State/Province (text)
   - Postal Code (text)
   - Country (select)

   **Step 3: Communication Methods** (5 fields)
   - Primary Email (email)
   - Secondary Email (email)
   - Primary Phone (phone)
   - Fax Number (phone)
   - Preferred Communication Method (select)

   **Step 4: Message Setup** (4 fields)
   - Message Code (text)
   - Media Code (select)
   - Enable Messaging (checkbox)
   - Notification Email (email)

   **Step 5: Employees** (6 fields)
   - Employee ID (text)
   - Full Name (text)
   - Employee Email (email)
   - Role (select)
   - Hire Date (date)
   - Active Employee (checkbox)

   **Step 6: Accounting Rules** (6 fields)
   - Accounting Currency (select)
   - Parallel Currency (select)
   - Fiscal Year Start Date (date)
   - Tax Rounding Method (select)
   - Maximum Tax Percentage (number)
   - Use Voucher Series (checkbox)

   **Step 7: Invoice Settings** (6 fields)
   - Default Invoice Type (select)
   - Invoice Number Prefix (text)
   - Tax Regime (select)
   - Tax ID Number (text)
   - Default Payment Terms (Days) (number)
   - Enable Cash Discount (checkbox)

   **Step 8: Payment Settings** (6 fields)
   - Accepted Payment Methods (select)
   - Bank Name (text)
   - Account Number (text)
   - Routing Number (text)
   - Payment Tolerance (%) (number)
   - Enable Automatic Payment Matching (checkbox)

   **Step 9: Distribution** (6 fields)
   - Distribution Method (select)
   - Primary Warehouse Location (text)
   - Preferred Shipping Carrier (select)
   - Ownership Transfer Point (select)
   - Use Transit Balancing (checkbox)
   - Create Receipt Postings for Non-Invoiced Items (checkbox)

6. **Saves the workflow**
7. **Verifies the workflow was created successfully**

## 🎯 Test Output

The test will:
- Print step-by-step progress to console
- Take screenshots at key points:
  - `e2e/screenshots/initial-page.png` - Initial page load
  - `e2e/screenshots/after-navigation.png` - After navigating to workflows
  - `e2e/screenshots/workflow-builder-opened.png` - When builder opens
  - `e2e/screenshots/workflow-basic-info-filled.png` - After filling name/description
  - `e2e/screenshots/workflow-created.png` - Final result
- Generate HTML report with test results

## 🔧 Configuration

### Environment Variables

You can set these environment variables:

- `PLAYWRIGHT_TEST_BASE_URL` - Override the base URL (default: `http://localhost:3000`)
- `CI` - Set to `true` in CI environments

### Modifying the Test

The workflow data is defined at the top of `e2e/workflow-creation.spec.ts`:

```typescript
const WORKFLOW_DATA = {
  name: 'Standard Company Onboarding',
  description: '...',
  steps: [
    // ... step definitions
  ],
};
```

You can modify this structure to test different workflows.

## 🐛 Debugging

### Run in Debug Mode
```bash
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through the test line by line
- Inspect the page at any point
- See what selectors are available
- Modify selectors in real-time

### Run in UI Mode
```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- See all tests
- Run individual tests
- Watch tests execute in real-time
- See screenshots and videos

### Run in Headed Mode
```bash
npm run test:e2e:headed
```

This runs tests with a visible browser window so you can see what's happening.

## 📸 Screenshots

Screenshots are automatically saved to `e2e/screenshots/`:
- On test failures
- At key points in the test (as defined in the test code)

## ⚠️ Important Notes

1. **Backend Must Be Running**: The test assumes your backend API is running on `http://127.0.0.1:8000`
2. **Frontend Dev Server**: Will auto-start if not running (configured in `playwright.config.ts`)
3. **Authentication**: If your app requires login, you'll need to add authentication steps in the `beforeEach` hook
4. **Selectors**: The test uses multiple fallback strategies to find elements, but you may need to adjust selectors based on your actual UI

## 🎓 Next Steps

1. **Run the test** to see it in action
2. **Adjust selectors** if needed based on your actual UI
3. **Add more tests** for other workflows or features
4. **Integrate with CI/CD** for automated testing

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test File Documentation](./e2e/README.md)

