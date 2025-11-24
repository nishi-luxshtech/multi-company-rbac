# 🚀 Quick Start: Run Test in Visible Chrome (Windows)

## Step-by-Step Instructions

### Step 1: Make sure your servers are running

**Terminal 1 - Backend:**
```bash
cd nishi-luxshtech-erp_r/erp_r
python -m uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd nishi-luxshtech-multi-company-rbac/multi-company-rbac
npm run dev
```

Wait until both are running (you should see "Ready" messages).

---

### Step 2: Run the test in visible Chrome

**Terminal 3 - Run Test:**
```bash
cd nishi-luxshtech-multi-company-rbac/multi-company-rbac
npm run test:e2e:workflow:watch
```

**OR use this command directly:**
```bash
npx playwright test e2e/workflow-creation.spec.ts --headed --project=chromium
```

---

## What You'll See

1. **Chrome browser will open** (visible window)
2. **Test will navigate** to `http://localhost:3000`
3. **You'll see the test:**
   - Click "Workflows" in the sidebar
   - Click "Create Workflow" button
   - Fill in workflow name and description
   - Create all 9 steps with fields
   - Save the workflow

4. **Terminal will show progress:**
   ```
   📋 Step 1: Navigating to Workflows tab...
   ✅ Found Workflows button
   ✅ Clicked Workflows button
   ✅ Successfully navigated to Workflows page
   ```

---

## If Chrome Doesn't Open

### Option 1: Force headed mode
```bash
npx playwright test e2e/workflow-creation.spec.ts --headed --project=chromium
```

### Option 2: Use UI mode (best for debugging)
```bash
npx playwright test --ui
```
Then click on the test to run it - you'll see it execute step by step!

### Option 3: Debug mode (step through line by line)
```bash
npx playwright test e2e/workflow-creation.spec.ts --debug --project=chromium
```

---

## Troubleshooting

### "Browser not found"
```bash
npx playwright install chromium
```

### "Test times out"
- Make sure both servers are running
- Check that `http://localhost:3000` opens in your browser
- Check that `http://127.0.0.1:8000` is your backend

### "Can't find Workflows button"
- The test takes a screenshot on failure - check `test-results/` folder
- Or check `e2e/screenshots/` folder
- The browser window stays open so you can see what's on screen

### Test runs too fast
The test is slowed down by 100ms. To make it slower, edit `playwright.config.ts`:
```typescript
launchOptions: {
  slowMo: 500, // Change to 500ms (half a second)
},
```

---

## Screenshots & Videos

- **Screenshots**: Saved to `e2e/screenshots/` folder
- **Videos**: Saved to `test-results/` folder (on failure)
- **HTML Report**: Run `npm run test:e2e:report` to see detailed report

---

## Best Way to Watch the Test

**Use UI Mode** - This is the best way to see everything:

```bash
npx playwright test --ui
```

This opens Playwright's interactive UI where you can:
- ✅ See all tests
- ✅ Click to run individual tests
- ✅ Watch the browser window
- ✅ See each step highlighted
- ✅ Pause and inspect at any time

---

## Quick Commands Reference

```bash
# Run test in visible Chrome (recommended)
npm run test:e2e:workflow:watch

# Run test in visible Chrome (alternative)
npx playwright test e2e/workflow-creation.spec.ts --headed --project=chromium

# Run with interactive UI (BEST for watching)
npx playwright test --ui

# Run in debug mode (step through line by line)
npx playwright test e2e/workflow-creation.spec.ts --debug --project=chromium

# View test report
npm run test:e2e:report
```

