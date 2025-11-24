# Running Playwright Test in Visible Browser (Chrome)

## 🎯 Quick Start - See the Test Run in Chrome

To watch the Playwright test run in a visible Chrome browser window:

```bash
cd nishi-luxshtech-multi-company-rbac/multi-company-rbac
npm run test:e2e:workflow:watch
```

This will:
- ✅ Open Chrome browser (visible window)
- ✅ Run the workflow creation test
- ✅ Slow down actions by 100ms so you can see what's happening
- ✅ Show console logs in the terminal
- ✅ Take screenshots at key points

## 📋 What You'll See

The test will:

1. **Open Chrome** and navigate to `http://localhost:3000`
2. **Navigate to Workflows tab** - Click the "Workflows" button in the sidebar
3. **Click "Create Workflow"** button
4. **Fill in workflow details:**
   - Name: "Standard Company Onboarding"
   - Description: "Comprehensive 9-step company onboarding process..."
5. **Create 9 steps** with all their fields:
   - Step 1: General Information (8 fields)
   - Step 2: Addresses (7 fields)
   - Step 3: Communication Methods (5 fields)
   - Step 4: Message Setup (4 fields)
   - Step 5: Employees (6 fields)
   - Step 6: Accounting Rules (6 fields)
   - Step 7: Invoice Settings (6 fields)
   - Step 8: Payment Settings (6 fields)
   - Step 9: Distribution (6 fields)
6. **Save the workflow**
7. **Verify it was created**

## 🔧 Other Ways to Run

### Run with UI Mode (Interactive)
```bash
npm run test:e2e:ui
```
Opens Playwright's interactive UI where you can:
- See all tests
- Run individual tests
- Watch tests execute step-by-step
- Debug interactively

### Run in Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector where you can:
- Step through the test line by line
- Inspect the page at any point
- See available selectors
- Modify selectors in real-time

### Run All Tests (Headed)
```bash
npm run test:e2e:headed
```
Runs all E2E tests with visible browser

## ⚙️ Configuration

The test is configured to:
- **Run in headed mode** (visible browser) for Chromium
- **Slow down by 100ms** between actions so you can see what's happening
- **Take screenshots** at key points (saved to `e2e/screenshots/`)
- **Generate videos** on failure (saved to `test-results/`)

## 📸 Screenshots

Screenshots are automatically saved to:
- `e2e/screenshots/initial-page.png` - When page first loads
- `e2e/screenshots/after-navigation.png` - After clicking Workflows tab
- `e2e/screenshots/workflow-builder-opened.png` - When builder opens
- `e2e/screenshots/workflow-basic-info-filled.png` - After filling name/description
- `e2e/screenshots/workflow-created.png` - Final result

## 🐛 Troubleshooting

### Test can't find elements:
1. Make sure your dev server is running: `npm run dev`
2. Make sure your backend is running on `http://127.0.0.1:8000`
3. Check the browser window - you can see what the test sees
4. The test will pause on errors - check the browser to see what's on screen

### Test is too fast:
- The test is slowed down by 100ms between actions
- You can increase the `slowMo` value in `playwright.config.ts`:
  ```typescript
  launchOptions: {
    slowMo: 500, // Slow down by 500ms (half a second)
  },
  ```

### Need to see more details:
- Check the terminal console - it prints step-by-step progress
- Screenshots are saved automatically
- Videos are saved on failure

## 💡 Tips

1. **Watch the browser window** - You'll see exactly what the test is doing
2. **Check the terminal** - Console logs show what step is running
3. **Screenshots help** - Check `e2e/screenshots/` to see what the test saw
4. **Pause on error** - If test fails, the browser stays open so you can inspect

## 🎬 Example Output

When you run the test, you'll see in the terminal:

```
📋 Step 1: Navigating to Workflows tab...
✅ Found Workflows button
✅ Clicked Workflows button
✅ Successfully navigated to Workflows page

📋 Step 2: Clicking Create Workflow button...
✅ Found Create Workflow button
✅ Clicked Create Workflow button
✅ Workflow builder opened successfully

📋 Step 3: Filling workflow name...
📋 Step 4: Filling workflow description...

📋 Step 5: Creating step "General Information"...
  ➕ Adding field "Company Name" (text)...
  ✅ Field "Company Name" added successfully
  ...
```

And you'll see the browser window performing all these actions in real-time!

