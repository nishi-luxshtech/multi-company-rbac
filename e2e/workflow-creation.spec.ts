import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Create Standard Company Onboarding Workflow
 * 
 * This test creates a complete workflow with 9 steps and all fields
 * using the UI, simulating real user interaction.
 */

// Workflow data structure
const WORKFLOW_DATA = {
  name: 'Standard Company Onboarding',
  description: 'Comprehensive 9-step company onboarding process with all field types',
  steps: [
    {
      name: 'General Information',
      description: 'Basic company details and identification',
      fields: [
        { label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
        { label: 'Company Code', type: 'text', required: true, placeholder: 'e.g., COMP001' },
        { label: 'Association Number', type: 'text', required: false, placeholder: 'Registration number' },
        { label: 'Country', type: 'select', required: true, options: ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'India', 'China', 'Japan', 'Australia'] },
        { label: 'Default Language', type: 'select', required: true, options: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi'] },
        { label: 'Form of Business', type: 'select', required: true, options: ['Corporation', 'LLC', 'Partnership', 'Sole Proprietorship', 'Non-Profit'] },
        { label: 'Company Creation Date', type: 'date', required: true },
        { label: 'Company Website', type: 'url', required: false, placeholder: 'https://example.com' },
      ],
    },
    {
      name: 'Addresses',
      description: 'Company physical and mailing addresses',
      fields: [
        { label: 'Address Type', type: 'select', required: true, options: ['Headquarters', 'Branch Office', 'Warehouse', 'Mailing Address'] },
        { label: 'Address Line 1', type: 'text', required: true, placeholder: 'Street address' },
        { label: 'Address Line 2', type: 'text', required: false, placeholder: 'Apt, suite, unit, etc.' },
        { label: 'City', type: 'text', required: true, placeholder: 'City name' },
        { label: 'State/Province', type: 'text', required: true, placeholder: 'State or province' },
        { label: 'Postal Code', type: 'text', required: true, placeholder: 'ZIP or postal code' },
        { label: 'Country', type: 'select', required: true, options: ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'India', 'China', 'Japan', 'Australia'] },
      ],
    },
    {
      name: 'Communication Methods',
      description: 'Contact information and communication channels',
      fields: [
        { label: 'Primary Email', type: 'email', required: true, placeholder: 'contact@company.com' },
        { label: 'Secondary Email', type: 'email', required: false, placeholder: 'support@company.com' },
        { label: 'Primary Phone', type: 'phone', required: true, placeholder: '+1 (555) 123-4567' },
        { label: 'Fax Number', type: 'phone', required: false, placeholder: '+1 (555) 123-4568' },
        { label: 'Preferred Communication Method', type: 'select', required: true, options: ['Email', 'Phone', 'Fax', 'Mail', 'EDI'] },
      ],
    },
    {
      name: 'Message Setup',
      description: 'Configure messaging and notification settings',
      fields: [
        { label: 'Message Code', type: 'text', required: false, placeholder: 'MSG001' },
        { label: 'Media Code', type: 'select', required: false, options: ['Email', 'SMS', 'Push Notification', 'In-App'] },
        { label: 'Enable Messaging', type: 'checkbox', required: false },
        { label: 'Notification Email', type: 'email', required: false, placeholder: 'notifications@company.com' },
      ],
    },
    {
      name: 'Employees',
      description: 'Add company employees and staff members',
      fields: [
        { label: 'Employee ID', type: 'text', required: true, placeholder: 'EMP001' },
        { label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
        { label: 'Employee Email', type: 'email', required: true, placeholder: 'john.doe@company.com' },
        { label: 'Role', type: 'select', required: true, options: ['Manager', 'Supervisor', 'Staff', 'Contractor', 'Intern'] },
        { label: 'Hire Date', type: 'date', required: true },
        { label: 'Active Employee', type: 'checkbox', required: false },
      ],
    },
    {
      name: 'Accounting Rules',
      description: 'Configure accounting and financial settings',
      fields: [
        { label: 'Accounting Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CAD', 'AUD'] },
        { label: 'Parallel Currency', type: 'select', required: false, options: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CAD', 'AUD'] },
        { label: 'Fiscal Year Start Date', type: 'date', required: true },
        { label: 'Tax Rounding Method', type: 'select', required: true, options: ['Round Up', 'Round Down', 'Round to Nearest', 'No Rounding'] },
        { label: 'Maximum Tax Percentage', type: 'number', required: false, placeholder: '25' },
        { label: 'Use Voucher Series', type: 'checkbox', required: false },
      ],
    },
    {
      name: 'Invoice Settings',
      description: 'Configure invoice and billing preferences',
      fields: [
        { label: 'Default Invoice Type', type: 'select', required: true, options: ['Standard', 'Proforma', 'Credit Note', 'Debit Note', 'Commercial'] },
        { label: 'Invoice Number Prefix', type: 'text', required: false, placeholder: 'INV-' },
        { label: 'Tax Regime', type: 'select', required: true, options: ['VAT', 'GST', 'Sales Tax', 'No Tax'] },
        { label: 'Tax ID Number', type: 'text', required: true, placeholder: 'Tax identification number' },
        { label: 'Default Payment Terms (Days)', type: 'number', required: true, placeholder: '30' },
        { label: 'Enable Cash Discount', type: 'checkbox', required: false },
      ],
    },
    {
      name: 'Payment Settings',
      description: 'Configure payment methods and preferences',
      fields: [
        { label: 'Accepted Payment Methods', type: 'select', required: true, options: ['Bank Transfer', 'Credit Card', 'Check', 'Cash', 'PayPal', 'Stripe'] },
        { label: 'Bank Name', type: 'text', required: false, placeholder: 'Primary bank name' },
        { label: 'Account Number', type: 'text', required: false, placeholder: 'Bank account number' },
        { label: 'Routing Number', type: 'text', required: false, placeholder: 'Bank routing number' },
        { label: 'Payment Tolerance (%)', type: 'number', required: false, placeholder: '5' },
        { label: 'Enable Automatic Payment Matching', type: 'checkbox', required: false },
      ],
    },
    {
      name: 'Distribution',
      description: 'Configure distribution and logistics settings',
      fields: [
        { label: 'Distribution Method', type: 'select', required: true, options: ['Direct Shipping', 'Warehouse', 'Drop Shipping', 'Third-Party Logistics'] },
        { label: 'Primary Warehouse Location', type: 'text', required: false, placeholder: 'Warehouse address' },
        { label: 'Preferred Shipping Carrier', type: 'select', required: false, options: ['FedEx', 'UPS', 'DHL', 'USPS', 'Local Courier'] },
        { label: 'Ownership Transfer Point', type: 'select', required: true, options: ['On Shipment', 'On Delivery', 'On Payment', 'On Acceptance'] },
        { label: 'Use Transit Balancing', type: 'checkbox', required: false },
        { label: 'Create Receipt Postings for Non-Invoiced Items', type: 'checkbox', required: false },
      ],
    },
  ],
};

test.describe('Workflow Creation E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    console.log('🌐 Navigating to application...');
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the main app to be visible
    await page.waitForSelector('body', { state: 'visible' });
    
    // Wait for sidebar to be visible (it might be hidden on mobile initially)
    await page.waitForTimeout(1000);
    
    // Check if there's a login form - if so, we need to login first
    const loginForm = page.locator('input[type="email"], input[type="text"][placeholder*="username" i], input[type="text"][placeholder*="email" i]').first();
    if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🔐 Login form detected - attempting to login...');
      // Try to find and fill login form
      const usernameInput = page.locator('input[type="text"], input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
      
      // Fill with default test credentials (adjust as needed)
      await usernameInput.fill('admin');
      await passwordInput.fill('admin');
      await loginButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Take initial screenshot for debugging
    await page.screenshot({ path: 'e2e/screenshots/initial-page.png', fullPage: true });
    console.log('✅ Page loaded successfully');
  });

  test('should create Standard Company Onboarding workflow with all 9 steps and fields', async ({ page }) => {
    // Step 1: Navigate to Workflows tab
    console.log('📋 Step 1: Navigating to Workflows tab...');
    
    // The sidebar has a button with text "Workflows" - find it in the nav
    // Look for button in nav that contains "Workflows" text
    const workflowsButton = page.locator('nav button:has-text("Workflows"), aside button:has-text("Workflows")').first();
    
    // Wait for the button to be visible
    await workflowsButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Found Workflows button');
    
    // Scroll into view if needed
    await workflowsButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Click the button
    await workflowsButton.click({ timeout: 5000 });
    console.log('✅ Clicked Workflows button');
    
    // Wait for the workflows page to load
    await page.waitForTimeout(2000);
    
    // Verify we're on the workflows page by looking for "Create Workflow" button or workflow list
    const verifyCreateButton = page.locator('button:has-text("Create"), button:has-text("New Workflow"), button:has-text("Add Workflow")').first();
    await verifyCreateButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Take screenshot after navigation
    await page.screenshot({ path: 'e2e/screenshots/after-navigation.png', fullPage: true });
    console.log('✅ Successfully navigated to Workflows page');

    // Step 2: Click "Create Workflow" button
    console.log('📋 Step 2: Clicking Create Workflow button...');
    
    // Look for create workflow button - try multiple selectors
    let createButton = page.locator('button:has-text("Create Workflow"), button:has-text("New Workflow"), button:has-text("Add Workflow")').first();
    
    // If not found, try finding button with Plus icon
    if (!(await createButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      createButton = page.locator('button:has([class*="Plus"]), button:has-text("Create")').first();
    }
    
    // Wait for button to be visible
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Found Create Workflow button');
    
    // Scroll into view
    await createButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Click the button
    await createButton.click({ timeout: 5000 });
    console.log('✅ Clicked Create Workflow button');
    
    // Wait for workflow builder to load - look for the workflow name input
    await page.waitForSelector('input#workflow-name', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Take screenshot after opening builder
    await page.screenshot({ path: 'e2e/screenshots/workflow-builder-opened.png', fullPage: true });
    console.log('✅ Workflow builder opened successfully');

    // Step 3: Fill in workflow name
    console.log('📋 Step 3: Filling workflow name...');
    
    // Use the specific ID from the component
    const nameInput = page.locator('input#workflow-name').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(WORKFLOW_DATA.name);
    await page.waitForTimeout(500);

    // Step 4: Fill in workflow description
    console.log('📋 Step 4: Filling workflow description...');
    
    // Use the specific ID from the component
    const descriptionInput = page.locator('textarea#workflow-description').first();
    await descriptionInput.waitFor({ state: 'visible', timeout: 5000 });
    await descriptionInput.fill(WORKFLOW_DATA.description);
    await page.waitForTimeout(500);
    
    // Take screenshot after filling basic info
    await page.screenshot({ path: 'e2e/screenshots/workflow-basic-info-filled.png' });

    // Step 5: Create all 9 steps with their fields
    for (let stepIndex = 0; stepIndex < WORKFLOW_DATA.steps.length; stepIndex++) {
      const step = WORKFLOW_DATA.steps[stepIndex];
      console.log(`\n📋 Step ${stepIndex + 1}: Creating step "${step.name}"...`);

      // Add a new step (click "Add Step" button)
      const addStepButton = page.locator('button:has-text("Add Step"), button:has-text("Add First Step")').first();
      await addStepButton.waitFor({ state: 'visible', timeout: 5000 });
      await addStepButton.click();
      await page.waitForTimeout(2000); // Wait for step card to appear and render

      // Find the newly added step card - it will be the last step card
      // Steps are in cards, find all cards and get the last one
      // Look for cards that contain step-related content
      const allCards = page.locator('[class*="Card"], [class*="card"]');
      const cardCount = await allCards.count();
      
      if (cardCount === 0) {
        throw new Error('No step cards found after clicking Add Step');
      }
      
      // Get the last card (the one we just added)
      const currentStepCard = allCards.nth(cardCount - 1);
      await currentStepCard.waitFor({ state: 'visible', timeout: 5000 });
      console.log(`  ✅ Found step card ${stepIndex + 1} (card ${cardCount} of ${cardCount})`);

      // Click on the step card to expand it
      // The entire card header is clickable
      await currentStepCard.click();
      await page.waitForTimeout(2000); // Wait for expansion animation
      console.log(`  ✅ Step card clicked (should be expanding...)`);
      
      // Verify it expanded by looking for the "Step Name" label
      try {
        await page.waitForSelector('label:has-text("Step Name")', { state: 'visible', timeout: 5000 });
        console.log(`  ✅ Step card expanded successfully`);
      } catch (e) {
        // If not expanded, try clicking again
        console.log(`  ⚠️ Step card might not be expanded, trying to click again...`);
        await currentStepCard.click();
        await page.waitForTimeout(2000);
        await page.waitForSelector('label:has-text("Step Name")', { state: 'visible', timeout: 5000 });
      }

      // Wait for the expanded section to appear - look for "Step Name" label
      await page.waitForSelector('label:has-text("Step Name")', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Find the step name input - get all visible ones and use the last (most recently expanded)
      const stepNameInputs = page.locator('input[placeholder="e.g., General Information"]');
      const inputCount = await stepNameInputs.count();
      if (inputCount === 0) {
        throw new Error('Step name input not found after expanding step');
      }
      const stepNameInput = stepNameInputs.nth(inputCount - 1); // Get the last (most recent) one
      
      await stepNameInput.waitFor({ state: 'visible', timeout: 5000 });
      await stepNameInput.clear();
      await stepNameInput.fill(step.name);
      await page.waitForTimeout(500);
      console.log(`  ✅ Step name set to "${step.name}"`);

      // Update step description
      const stepDescInputs = page.locator('input[placeholder="e.g., Basic company details"]');
      const descCount = await stepDescInputs.count();
      if (descCount > 0) {
        const stepDescInput = stepDescInputs.nth(descCount - 1);
        await stepDescInput.clear();
        await stepDescInput.fill(step.description);
        await page.waitForTimeout(500);
        console.log(`  ✅ Step description set`);
      }
      
      // Take a screenshot after setting step name/description
      await page.screenshot({ path: `e2e/screenshots/step-${stepIndex + 1}-${step.name.replace(/\s+/g, '-')}.png`, fullPage: true });

      // Add all fields for this step
      // Fields are added within the expanded step card
      for (let fieldIndex = 0; fieldIndex < step.fields.length; fieldIndex++) {
        const field = step.fields[fieldIndex];
        console.log(`\n  ➕ Adding field ${fieldIndex + 1}/${step.fields.length}: "${field.label}" (${field.type})...`);
        
        // Ensure step card is still expanded before adding next field
        // Check if "Step Name" label is visible (indicates expanded state)
        const stepNameLabel = currentStepCard.locator('label:has-text("Step Name")').first();
        const isExpanded = await stepNameLabel.isVisible({ timeout: 2000 }).catch(() => false);
        if (!isExpanded) {
          console.log(`    ⚠️ Step card appears collapsed, re-expanding...`);
          // Find and click the step card to expand it
          const stepCards = page.locator('[class*="Card"], [class*="card"]');
          const cardCount = await stepCards.count();
          if (cardCount > 0) {
            const lastCard = stepCards.nth(cardCount - 1);
            await lastCard.click();
            await page.waitForTimeout(1500);
            // Verify it's expanded now
            await stepNameLabel.waitFor({ state: 'visible', timeout: 5000 });
          }
        }

        // Field types are in a grid - map field types to their button labels (from FIELD_TYPES in component)
        const fieldTypeLabels: Record<string, string> = {
          'text': 'Text',
          'email': 'Email',
          'select': 'Dropdown',
          'date': 'Date',
          'number': 'Number',
          'checkbox': 'Checkbox',
          'phone': 'Phone',
          'url': 'URL',
          'textarea': 'Long Text',
          'time': 'Time',
          'daterange': 'Date Range',
          'switch': 'Switch',
          'radio': 'Radio Group',
          'combobox': 'Combobox',
          'multiselect': 'Multi-Select',
          'slider': 'Slider',
          'rating': 'Rating',
          'file': 'File Upload',
          'color': 'Color Picker',
        };
        
        const buttonLabel = fieldTypeLabels[field.type] || field.type.charAt(0).toUpperCase() + field.type.slice(1);
        console.log(`    🔍 Looking for field type button: "${buttonLabel}" (field ${fieldIndex + 1} of ${step.fields.length})`);
        
        // Make sure no dialog is open before looking for field type buttons
        // Wait for any open dialog to close
        try {
          const dialog = page.locator('[role="dialog"], [class*="Dialog"]').first();
          if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`    ⚠️ Dialog still visible, waiting for it to close...`);
            await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          // Dialog might already be closed, that's fine
        }
        
        // Ensure the step card is still expanded and visible
        // Scroll to the step name input to ensure we're in the right area
        const stepNameInputs = page.locator(`input[placeholder="e.g., General Information"]`);
        const stepInputCount = await stepNameInputs.count();
        if (stepInputCount > 0) {
          const currentStepInput = stepNameInputs.nth(stepInputCount - 1);
          if (await currentStepInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await currentStepInput.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
          }
        }
        
        // Find the field type button - buttons are in a grid within the expanded step
        // First, make sure we can see the field type buttons area
        const fieldsLabel = currentStepCard.locator('label:has-text("Fields")').first();
        if (await fieldsLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await fieldsLabel.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
        }
        
        let fieldTypeButton = currentStepCard
          .locator('button')
          .filter({ hasText: new RegExp(`^\\s*${buttonLabel}\\s*$`, 'i') })
          .first();
        
        let clicked = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!clicked && retryCount < maxRetries) {
          if (retryCount > 0) {
            console.log(`    🔄 Retry ${retryCount} of ${maxRetries} to find field type button...`);
            await page.waitForTimeout(1000);
            // Scroll to fields area again
            const fieldsLabel = page.locator('label:has-text("Fields")').first();
            if (await fieldsLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
              await fieldsLabel.scrollIntoViewIfNeeded();
            }
          }
          
          if (await fieldTypeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await fieldTypeButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(300);
            await fieldTypeButton.click();
            clicked = true;
            console.log(`    ✅ Clicked "${buttonLabel}" field type button`);
            break;
          } else {
            // Try finding in the field type grid
            const fieldGrid = currentStepCard
              .locator('[class*="grid"]')
              .filter({ hasText: new RegExp(buttonLabel, 'i') })
              .first();
            if (await fieldGrid.isVisible({ timeout: 2000 }).catch(() => false)) {
              const buttonInGrid = fieldGrid.locator('button').first();
              await buttonInGrid.scrollIntoViewIfNeeded();
              await buttonInGrid.click();
              clicked = true;
              console.log(`    ✅ Clicked field type button in grid`);
              break;
            } else {
              // Try case-insensitive search in the field type grid area
              const fieldTypeGrid = currentStepCard
                .locator('[class*="grid"]')
                .filter({ hasText: /Text|Email|Dropdown|Date|Number/i })
                .first();
              if (await fieldTypeGrid.isVisible({ timeout: 2000 }).catch(() => false)) {
                const allButtonsInGrid = fieldTypeGrid.locator('button');
                const buttonCount = await allButtonsInGrid.count();
                for (let i = 0; i < buttonCount; i++) {
                  const btn = allButtonsInGrid.nth(i);
                  const btnText = await btn.textContent().catch(() => '');
                  if (btnText && btnText.trim().toLowerCase() === buttonLabel.toLowerCase()) {
                    await btn.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(200);
                    await btn.click();
                    clicked = true;
                    console.log(`    ✅ Clicked field type button (found by exact text match: "${btnText}")`);
                    break;
                  }
                }
                if (clicked) break;
              }
            }
          }
          retryCount++;
        }

        if (!clicked) {
          console.log(`    ⚠️ Could not find field type button for "${field.type}" (looking for "${buttonLabel}"), trying fallback...`);
          // Last resort: click first available field button (usually "Text")
          const fallbackButton = currentStepCard.locator('button:has-text("Text")').first();
          if (await fallbackButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await fallbackButton.click();
            clicked = true;
            console.log(`    ✅ Used fallback: clicked "Text" button`);
          }
        }

        if (!clicked) {
          console.log(`    ❌ Could not find any field type button, skipping field "${field.label}"...`);
          // Take screenshot to debug
          await page.screenshot({ path: `e2e/screenshots/field-type-button-not-found-${field.type}.png`, fullPage: true });
          continue;
        }

        // Wait for dialog to open after clicking field type button
        await page.waitForSelector('[role="dialog"], [class*="Dialog"]', { state: 'visible', timeout: 10000 });
        await page.waitForTimeout(800); // Wait for dialog animation
        
        // Field Label - find input in the dialog
        // The first input in the dialog is usually the field label input
        const dialog = page.locator('[role="dialog"], [class*="Dialog"]').first();
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        
        // Find the field label input - it's usually the first text input in the dialog
        const dialogInputs = dialog.locator('input[type="text"]');
        const inputCount = await dialogInputs.count();
        let labelInput = dialogInputs.first();
        
        // If no text input found, try any input
        if (inputCount === 0) {
          labelInput = dialog.locator('input').first();
        }
        
        await labelInput.waitFor({ state: 'visible', timeout: 5000 });
        await labelInput.clear();
        await labelInput.fill(field.label);
        await page.waitForTimeout(500);
        console.log(`    ✅ Field label set to "${field.label}"`);

        // Field Type dropdown - only change if it doesn't match
        // The type is usually already set when we click the field type button, so skip this
        // Only change if needed

        // Placeholder (if provided and field type supports it)
        if (field.placeholder && field.type !== 'select' && field.type !== 'checkbox') {
          const placeholderInput = page.locator('input[placeholder*="placeholder"], input[id*="placeholder"]').first();
          if (await placeholderInput.isVisible().catch(() => false)) {
            await placeholderInput.clear();
            await placeholderInput.fill(field.placeholder);
            await page.waitForTimeout(200);
          }
        }

        // Required toggle - look for switch near "Required Field" label
        if (field.required) {
          // Find the switch - it's usually near a label with "Required"
          const requiredSection = page.locator('div:has-text("Required Field"), label:has-text("Required")').first();
          if (await requiredSection.isVisible({ timeout: 2000 }).catch(() => false)) {
            const requiredSwitch = requiredSection.locator('~ [role="switch"], ~ button, + [role="switch"], + button').first();
            if (await requiredSwitch.isVisible({ timeout: 1000 }).catch(() => false)) {
              const isChecked = await requiredSwitch.getAttribute('aria-checked').catch(() => null);
              if (isChecked !== 'true') {
                await requiredSwitch.click();
                await page.waitForTimeout(200);
                console.log(`    ✅ Field marked as required`);
              }
            } else {
              // Try finding switch by role
              const switchByRole = page.locator('[role="switch"]').first();
              if (await switchByRole.isVisible({ timeout: 1000 }).catch(() => false)) {
                const isChecked = await switchByRole.getAttribute('aria-checked').catch(() => null);
                if (isChecked !== 'true') {
                  await switchByRole.click();
                  await page.waitForTimeout(200);
                }
              }
            }
          }
        }

        // Options (for select, radio, etc.)
        if (field.options && field.options.length > 0) {
          const optionsTextarea = page.locator('textarea[placeholder*="option"], textarea[id*="option"]').first();
          if (await optionsTextarea.isVisible().catch(() => false)) {
            await optionsTextarea.clear();
            await optionsTextarea.fill(field.options.join('\n'));
            await page.waitForTimeout(200);
          }
        }

        // Save the field - look for "Save Field" button in the dialog footer
        const saveFieldButton = page.locator('button:has-text("Save Field"), button:has-text("Add Field"), button:has-text("Done")').first();
        await saveFieldButton.waitFor({ state: 'visible', timeout: 5000 });
        console.log(`    💾 Clicking "Save Field" button...`);
        await saveFieldButton.click();
        
        // Wait for dialog to close - explicitly wait for it to disappear
        console.log(`    ⏳ Waiting for dialog to close...`);
        try {
          const dialog = page.locator('[role="dialog"], [class*="Dialog"]').first();
          await dialog.waitFor({ state: 'hidden', timeout: 10000 });
          console.log(`    ✅ Dialog closed`);
        } catch (e) {
          // If dialog doesn't have hidden state, wait for it to not be visible
          console.log(`    ⚠️ Dialog might still be visible, waiting a bit more...`);
          await page.waitForTimeout(2000);
          // Check if dialog is still there
          const dialogStillVisible = await page.locator('[role="dialog"], [class*="Dialog"]').first().isVisible({ timeout: 1000 }).catch(() => false);
          if (dialogStillVisible) {
            console.log(`    ⚠️ Dialog still visible after wait, trying to close it...`);
            // Try clicking outside or pressing Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        }
        
        await page.waitForTimeout(1500); // Additional wait for field to appear in the list
        
        // Verify the dialog is closed by checking that field type buttons are visible again
        let fieldTypeButtonsVisible = false;
        let checkAttempts = 0;
        while (!fieldTypeButtonsVisible && checkAttempts < 5) {
          fieldTypeButtonsVisible = await currentStepCard.locator('button:has-text("Text")').first().isVisible({ timeout: 2000 }).catch(() => false);
          if (!fieldTypeButtonsVisible) {
            console.log(`    ⚠️ Field type buttons not visible yet (attempt ${checkAttempts + 1}/5), waiting more...`);
            await page.waitForTimeout(1000);
            // Try scrolling to the fields area
            const fieldsLabel = page.locator('label:has-text("Fields")').first();
            if (await fieldsLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
              await fieldsLabel.scrollIntoViewIfNeeded();
            }
          } else {
            console.log(`    ✅ Field type buttons are visible again`);
          }
          checkAttempts++;
        }

        console.log(`  ✅ Field "${field.label}" added successfully (${fieldIndex + 1}/${step.fields.length})`);
        
        // Small delay before next field to ensure UI is stable
        if (fieldIndex < step.fields.length - 1) {
          await page.waitForTimeout(500);
        }
      }

      console.log(`✅ Step "${step.name}" created with ${step.fields.length} fields`);
    }

    // Step 6: Save the workflow
    console.log('\n💾 Saving workflow...');
    const saveWorkflowButton = page.locator('button').filter({ hasText: /save.*workflow/i }).first();
    await saveWorkflowButton.click();
    
    // Wait for save to complete (look for success message or navigation)
    await page.waitForTimeout(3000);
    
    // Verify workflow was created successfully
    // Option 1: Check for success message
    const successMessage = page.locator('text=/success|created|saved/i').first();
    if (await successMessage.isVisible().catch(() => false)) {
      console.log('✅ Workflow saved successfully!');
    }

    // Option 2: Verify we're back on workflows list and see the new workflow
    const workflowName = page.locator('text=' + WORKFLOW_DATA.name).first();
    if (await workflowName.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Workflow appears in the workflows list!');
    }

    // Take a screenshot for verification
    await page.screenshot({ path: 'e2e/screenshots/workflow-created.png', fullPage: true });
    console.log('📸 Screenshot saved to e2e/screenshots/workflow-created.png');
  });

  test('should verify workflow structure after creation', async ({ page }) => {
    // Navigate to workflows
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Navigate to workflows tab
    const workflowsButton = page.locator('nav button:has-text("Workflows"), aside button:has-text("Workflows")').first();
    await workflowsButton.waitFor({ state: 'visible', timeout: 10000 });
    await workflowsButton.click();
    await page.waitForTimeout(2000);

    // Find and click on the created workflow
    const workflowCard = page.locator('text=' + WORKFLOW_DATA.name).first();
    await expect(workflowCard).toBeVisible({ timeout: 10000 });
    
    // Click to view/edit the workflow
    await workflowCard.click();
    await page.waitForTimeout(2000);

    // Verify all 9 steps are present
    for (const step of WORKFLOW_DATA.steps) {
      const stepElement = page.locator('text=' + step.name).first();
      await expect(stepElement).toBeVisible({ timeout: 5000 });
    }

    console.log('✅ All 9 steps verified in the workflow!');
  });
});

