# Workflow System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Workflow Canvas Builder](#workflow-canvas-builder)
4. [Role-Based Access Control](#role-based-access-control)
5. [Company Creation Workflows](#company-creation-workflows)
6. [API Integration](#api-integration)
7. [Configuration](#configuration)
8. [Testing & Demo Credentials](#testing--demo-credentials)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Multi-Company RBAC system provides a comprehensive workflow management solution for enterprise resource planning (ERP). It allows administrators to:

- **Create visual workflows** using an n8n-style canvas builder
- **Connect multiple workflows** into chains for complex business processes
- **Assign workflows to company onboarding** with flexible view modes
- **Control access** based on user roles (Admin, Manager, Employee, Viewer, Clerk)
- **Submit data to multiple APIs** in a coordinated batch process

### Key Features

- 🎨 **Visual Workflow Builder** - Drag-and-drop canvas powered by React Flow
- 🔗 **Workflow Chaining** - Connect workflows to create multi-step processes
- 👥 **Role-Based UI** - Different sidebar menus for different user roles
- 📋 **Dual View Modes** - Choose between step-by-step wizard or tab view
- 🚀 **Batch API Submission** - Submit all workflow steps to different APIs at once
- 💾 **Local Storage** - All data persists in browser localStorage for demo purposes

---

## Architecture

### Component Structure

\`\`\`
app/
├── page.tsx                          # Main application entry point
├── globals.css                       # Global styles including React Flow styles
components/
├── workflow-canvas-builder.tsx       # Visual workflow builder (React Flow)
├── workflow-management.tsx           # Workflow CRUD operations
├── workflow-selector.tsx             # Workflow selection with view mode
├── dynamic-company-wizard.tsx        # Company creation wizard/tabs
├── erp-sidebar.tsx                   # Role-based navigation sidebar
├── erp-company-list.tsx             # Company list with localStorage sync
└── login-form.tsx                   # Authentication with demo credentials
lib/
├── workflow-storage.ts              # Workflow localStorage management
├── storage-service.ts               # Company & user localStorage management
├── auth-context.tsx                 # Authentication context provider
└── company-api.ts                   # API client for company operations
docs/
├── WORKFLOW_SYSTEM_GUIDE.md         # This file
├── RBAC_SIDEBAR_GUIDELINES.md       # RBAC implementation guide
└── DEMO_CREDENTIALS.md              # Demo user credentials
\`\`\`

### Data Flow

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     User Authentication                      │
│                    (Demo Credentials)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Role-Based Sidebar                         │
│         (Different menus for Admin/Manager/Employee)         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│  Workflow Mgmt   │          │   Company Creation   │
│  - Create        │          │   - Select Workflow  │
│  - Edit          │          │   - Choose View Mode │
│  - Canvas Builder│          │   - Fill Steps       │
│  - Connect       │          │   - Submit All       │
└────────┬─────────┘          └──────────┬───────────┘
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│  localStorage    │          │   API Endpoints      │
│  - workflows     │          │   - /api/companies   │
│  - canvas        │          │   - /api/address     │
│  - companies     │          │   - /api/contact     │
└──────────────────┘          │   - ... (9 total)    │
                              └──────────────────────┘
\`\`\`

---

## Workflow Canvas Builder

### Overview

The Workflow Canvas Builder is a visual tool powered by React Flow that allows administrators to create, connect, and manage workflows in an n8n-style interface.

### Features

- **Drag-and-drop workflow nodes** - Add workflows to canvas from right-side panel
- **Visual connections** - Connect workflows with smooth bezier curves
- **Node management** - Delete nodes and connections with intuitive controls
- **Pan & Zoom** - Navigate large workflow canvases easily
- **Minimap** - Overview of entire canvas in bottom-right corner
- **Auto-save** - Canvas state persists to localStorage automatically

### How to Use

#### 1. Access Canvas Builder

\`\`\`typescript
// Navigate to Workflow Management → Canvas Builder
// Or click "Canvas Builder" in the sidebar (Admin only)
\`\`\`

#### 2. Add Workflows to Canvas

1. Click the **"+ Add Workflow"** button (bottom center of canvas)
2. A panel slides in from the right showing all available workflows
3. Use the search box to filter workflows by name
4. Click on a workflow to add it to the canvas
5. The workflow appears as a node with:
   - Workflow name and description
   - Number of steps
   - Status badge (Active/Inactive)
   - Connection handles (left = input, right = output)

#### 3. Connect Workflows

1. Hover over a workflow node to see connection handles
2. Click and drag from the **right handle** (output) of the first workflow
3. Drop on the **left handle** (input) of the second workflow
4. A smooth bezier curve connection appears
5. Connected workflows will execute in sequence during company creation

#### 4. Delete Connections

1. Click on any connection line to select it
2. The selected connection turns **red**
3. Press the **Delete** key on your keyboard
4. The connection is removed

#### 5. Delete Workflow Nodes

1. Hover over a workflow node
2. A **trash icon** appears in the top-right corner
3. Click the trash icon to delete the node
4. All connections to/from that node are also removed

#### 6. Save Canvas

1. Click the **"Save Canvas"** button in the toolbar
2. Canvas state is saved to localStorage
3. A success toast notification appears
4. The saved canvas is now available in company creation workflow selector

### Canvas Controls

| Control | Action |
|---------|--------|
| **Mouse Drag** | Pan the canvas |
| **Mouse Wheel** | Zoom in/out |
| **Click Node** | Select node |
| **Click Edge** | Select connection (turns red) |
| **Delete Key** | Delete selected edge |
| **Hover Node** | Show delete button |
| **Drag Handle** | Create connection |

### Technical Details

\`\`\`typescript
// Canvas data structure saved to localStorage
interface CanvasData {
  nodes: Array<{
    id: string              // React Flow node ID
    type: 'workflow'        // Node type
    position: { x: number, y: number }
    data: {
      workflow: Workflow    // Full workflow object
      onDelete: (id: string) => void
    }
  }>
  edges: Array<{
    id: string              // Edge ID
    source: string          // Source node ID
    target: string          // Target node ID
    type: 'smoothstep'      // Edge type (bezier curve)
    animated: true          // Animated flow
  }>
}

// Saved to localStorage with key: "workflow-canvas"
localStorage.setItem("workflow-canvas", JSON.stringify(canvasData))
\`\`\`

---

## Role-Based Access Control

### Overview

The system implements role-based access control (RBAC) to show different sidebar menus and features based on user roles.

### Available Roles

| Role | Access Level | Description |
|------|--------------|-------------|
| **Admin** | Full Access | Can access all features including workflow management, user management, and system settings |
| **Manager** | High Access | Can manage companies, workflows, and view reports |
| **Employee** | Limited Access | Can view dashboard, reports, and personal settings |
| **Viewer** | Read-Only | Can only view dashboard and reports |
| **Clerk** | Data Entry | Can manage company data entry and view reports |

### Sidebar Menu by Role

#### Admin (6 items)
- ✅ Dashboard
- ✅ Companies
- ✅ Workflows
- ✅ Users & Admins
- ✅ Reports
- ✅ Settings

#### Manager (5 items)
- ✅ Dashboard
- ✅ Companies
- ✅ Workflows
- ✅ Reports
- ✅ Settings

#### Employee (3 items)
- ✅ Dashboard
- ✅ Reports
- ✅ Settings

#### Viewer (2 items)
- ✅ Dashboard
- ✅ Reports

#### Clerk (4 items)
- ✅ Dashboard
- ✅ Companies
- ✅ Reports
- ✅ Settings

### Implementation

The sidebar dynamically filters menu items based on the authenticated user's role:

\`\`\`typescript
// Menu configuration with role-based access
const menuItems = [
  { 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    roles: ["admin", "manager", "employee", "viewer", "clerk"] 
  },
  { 
    label: "Companies", 
    icon: Building2, 
    roles: ["admin", "manager", "clerk"] 
  },
  { 
    label: "Workflows", 
    icon: Workflow, 
    roles: ["admin", "manager"] 
  },
  { 
    label: "Users & Admins", 
    icon: Users, 
    roles: ["admin"] 
  },
  { 
    label: "Reports", 
    icon: FileText, 
    roles: ["admin", "manager", "employee", "viewer", "clerk"] 
  },
  { 
    label: "Settings", 
    icon: Settings, 
    roles: ["admin", "manager", "employee", "clerk"] 
  },
]

// Filter based on current user role
const visibleItems = menuItems.filter(item => 
  item.roles.includes(currentUser.role)
)
\`\`\`

---

## Company Creation Workflows

### Overview

The company creation system allows administrators to select a workflow and choose between two view modes: **Step-by-Step Wizard** or **Tab View**.

### View Modes

#### 1. Step-by-Step Wizard (Sequential)

**Best for:** Linear processes where steps must be completed in order

**Features:**
- One step visible at a time
- Previous/Next navigation buttons
- Progress indicator showing current step
- Cannot skip steps
- Traditional wizard UX

**Use Case:** Guided onboarding where each step builds on the previous one

#### 2. Tab View (Flexible)

**Best for:** Complex forms where users may need to jump between sections

**Features:**
- All steps visible as tabs at the top
- Click any tab to jump to that step
- Visual indicators for completed steps (green checkmarks)
- Validation badges showing completion status
- Can fill steps in any order
- "Submit All" button enabled only when all steps are complete

**Use Case:** Data entry where information may be gathered non-sequentially

### Workflow Selection Process

#### Step 1: Select Workflow

\`\`\`typescript
// User navigates to Companies → Create Company
// WorkflowSelector component displays:
// 1. List of available workflows
// 2. Canvas Builder Workflow (if canvas is saved)
\`\`\`

#### Step 2: Choose View Mode

After selecting a workflow, a dialog appears:

\`\`\`
┌─────────────────────────────────────────┐
│     Choose Your Workflow View Mode      │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   📋 Step-by-Step Wizard        │   │
│  │   Complete steps sequentially   │   │
│  │   with guided navigation        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   📑 Tab View                   │   │
│  │   Access all steps via tabs     │   │
│  │   and fill in any order         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
\`\`\`

#### Step 3: Fill Out Workflow Steps

**Wizard Mode:**
1. Fill out current step fields
2. Click "Next" to proceed
3. Click "Previous" to go back
4. Click "Submit" on final step

**Tab Mode:**
1. Click any tab to view that step
2. Fill out fields in any order
3. Click "Mark as Complete" to validate step
4. Completed steps show green checkmark
5. Click "Submit All" when all steps are complete

### Step Validation

Each step validates required fields before allowing completion:

\`\`\`typescript
// Validation logic
const validateCurrentStep = () => {
  const currentStepData = workflow.steps[currentStep]
  
  // Get all required fields for this step
  const requiredFields = currentStepData.fields
    .filter(field => field.required)
    .map(field => field.name)
  
  // Check if all required fields have values
  const allFilled = requiredFields.every(fieldName => {
    const value = formData[fieldName]
    return value !== undefined && value !== null && value !== ''
  })
  
  return allFilled
}
\`\`\`

### Visual Indicators

**Tab View Completion Status:**

\`\`\`
┌─────────────────────────────────────────────────────────┐
│  Step 1 ✓  │  Step 2 ✓  │  Step 3 ⚠️  │  Step 4 ⭕  │
│  [Complete]│  [Complete]│  [Active]   │  [Pending]  │
└─────────────────────────────────────────────────────────┘
\`\`\`

- ✓ Green checkmark = Step completed and validated
- ⚠️ Yellow indicator = Current active step
- ⭕ Gray circle = Pending step (not yet completed)

---

## API Integration

### Overview

The workflow system supports **batch API submission** where each workflow step can call a different API endpoint. All API calls are triggered simultaneously when the user clicks "Submit All".

### API Call Flow

\`\`\`
User fills all 9 steps → Clicks "Submit All" → System triggers 9 API calls in parallel

Step 1: Company Info     → POST /api/companies/basic
Step 2: Address Details  → POST /api/companies/address
Step 3: Contact Info     → POST /api/companies/contact
Step 4: Tax Information  → POST /api/companies/tax
Step 5: Banking Details  → POST /api/companies/banking
Step 6: Legal Documents  → POST /api/companies/legal
Step 7: Compliance       → POST /api/companies/compliance
Step 8: Preferences      → POST /api/companies/preferences
Step 9: Final Review     → POST /api/companies/finalize

All calls complete → Save to localStorage → Show success message
\`\`\`

### Implementation

\`\`\`typescript
// Batch API submission handler
const handleSubmitAll = async () => {
  setIsSubmitting(true)
  const results: Array<{ step: string; success: boolean; error?: string }> = []

  try {
    // Create array of API calls for each step
    const apiCalls = workflow.steps.map(async (step, index) => {
      try {
        // Get step-specific data from formData
        const stepData = step.fields.reduce((acc, field) => {
          acc[field.name] = formData[field.name]
          return acc
        }, {} as Record<string, any>)

        // Determine API endpoint based on step name/type
        const endpoint = getApiEndpointForStep(step.name)
        
        console.log(`[v0] Calling API for ${step.name}:`, endpoint)
        
        // Make API call
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stepData),
        })

        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`)
        }

        const data = await response.json()
        
        return {
          step: step.name,
          success: true,
          data,
        }
      } catch (error) {
        console.error(`[v0] API call failed for ${step.name}:`, error)
        return {
          step: step.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })

    // Execute all API calls in parallel
    const apiResults = await Promise.all(apiCalls)
    results.push(...apiResults)

    // Check if all API calls succeeded
    const allSucceeded = apiResults.every(result => result.success)

    if (allSucceeded) {
      console.log('[v0] All API calls succeeded:', results)
      
      // Save company to localStorage
      const companyData = {
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formData.companyName || formData.name || 'New Company',
        description: formData.description || '',
        createdAt: new Date().toISOString(),
        workflowId: workflow.id,
        formData: formData,
      }
      
      storageService.saveWorkflowCompany(companyData)
      
      toast({
        title: "Success!",
        description: `All ${workflow.steps.length} steps submitted successfully`,
      })
      
      onComplete()
    } else {
      // Some API calls failed
      const failedSteps = apiResults
        .filter(r => !r.success)
        .map(r => r.step)
        .join(', ')
      
      toast({
        title: "Partial Failure",
        description: `Failed steps: ${failedSteps}`,
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error('[v0] Error during batch submission:', error)
    toast({
      title: "Error",
      description: "Failed to submit workflow data",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}
\`\`\`

### API Endpoint Mapping

The system maps workflow step names to specific API endpoints:

\`\`\`typescript
function getApiEndpointForStep(stepName: string): string {
  const endpointMap: Record<string, string> = {
    'Company Information': '/api/companies/basic',
    'Address Details': '/api/companies/address',
    'Contact Information': '/api/companies/contact',
    'Tax Information': '/api/companies/tax',
    'Banking Details': '/api/companies/banking',
    'Legal Documents': '/api/companies/legal',
    'Compliance': '/api/companies/compliance',
    'Preferences': '/api/companies/preferences',
    'Final Review': '/api/companies/finalize',
  }
  
  return endpointMap[stepName] || '/api/companies'
}
\`\`\`

### Error Handling

The system handles API errors gracefully:

1. **Individual Step Failure**: If one API call fails, others continue
2. **Partial Success**: Shows which steps succeeded and which failed
3. **Complete Failure**: Shows error message and allows retry
4. **Network Errors**: Catches and displays network-related errors

### API Response Format

Expected response format from each API endpoint:

\`\`\`typescript
interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

// Success response
{
  "success": true,
  "data": {
    "id": "comp-123",
    "status": "created"
  },
  "message": "Company information saved successfully"
}

// Error response
{
  "success": false,
  "error": "Validation failed",
  "message": "Company name is required"
}
\`\`\`

---

## Configuration

### Workflow Storage

Workflows are stored in localStorage with the following keys:

\`\`\`typescript
// Individual workflows
localStorage.setItem('workflows', JSON.stringify(workflows))

// Canvas configuration
localStorage.setItem('workflow-canvas', JSON.stringify(canvasData))

// Companies created via workflows
localStorage.setItem('workflow-companies', JSON.stringify(companies))
\`\`\`

### Workflow Data Structure

\`\`\`typescript
interface Workflow {
  id: string                    // Unique workflow ID
  name: string                  // Workflow name
  description: string           // Workflow description
  steps: WorkflowStep[]         // Array of workflow steps
  status: 'active' | 'inactive' // Workflow status
  createdAt: string            // ISO timestamp
  updatedAt: string            // ISO timestamp
}

interface WorkflowStep {
  id: string                    // Unique step ID
  name: string                  // Step name
  description: string           // Step description
  fields: WorkflowField[]       // Form fields for this step
  order: number                 // Step order (0-based)
}

interface WorkflowField {
  id: string                    // Unique field ID
  name: string                  // Field name (used as form key)
  label: string                 // Display label
  type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date'
  required: boolean             // Is field required?
  placeholder?: string          // Placeholder text
  options?: string[]            // Options for select fields
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}
\`\`\`

### Canvas Data Structure

\`\`\`typescript
interface CanvasData {
  nodes: ReactFlowNode[]        // React Flow nodes
  edges: ReactFlowEdge[]        // React Flow edges
  viewport?: {                  // Canvas viewport state
    x: number
    y: number
    zoom: number
  }
}
\`\`\`

---

## Testing & Demo Credentials

### Demo User Accounts

The system includes 5 pre-configured demo accounts for testing different roles:

| Username | Password | Role | Sidebar Items |
|----------|----------|------|---------------|
| `admin` | `password` | Admin | 6 items (full access) |
| `manager` | `password` | Manager | 5 items |
| `employee` | `password` | Employee | 3 items |
| `viewer` | `password` | Viewer | 2 items (read-only) |
| `clerk` | `password` | Clerk | 4 items (data entry) |

### Testing Workflow Canvas

1. **Login as Admin**
   \`\`\`
   Username: admin
   Password: password
   \`\`\`

2. **Navigate to Workflows → Canvas Builder**

3. **Add Sample Workflows**
   - Click "+ Add Workflow"
   - Add "Standard Company Onboarding" (9 steps)
   - Add "Site Creation" (1 step)

4. **Connect Workflows**
   - Drag from right handle of "Standard Company Onboarding"
   - Drop on left handle of "Site Creation"
   - Connection appears with smooth curve

5. **Save Canvas**
   - Click "Save Canvas" button
   - Verify success toast appears

6. **Test Company Creation**
   - Navigate to Companies → Create Company
   - Select "Canvas Builder Workflow"
   - Choose "Tab View" mode
   - Fill out all 9 steps
   - Click "Submit All"
   - Verify all API calls are triggered

### Testing Role-Based Access

1. **Test Admin Access**
   - Login as `admin`
   - Verify all 6 sidebar items are visible
   - Access Workflows and Users & Admins

2. **Test Manager Access**
   - Logout and login as `manager`
   - Verify 5 sidebar items (no Users & Admins)
   - Can access Workflows and Companies

3. **Test Employee Access**
   - Logout and login as `employee`
   - Verify only 3 items (Dashboard, Reports, Settings)
   - Cannot access Workflows or Companies

4. **Test Viewer Access**
   - Logout and login as `viewer`
   - Verify only 2 items (Dashboard, Reports)
   - Read-only access

5. **Test Clerk Access**
   - Logout and login as `clerk`
   - Verify 4 items (Dashboard, Companies, Reports, Settings)
   - Can manage company data

---

## Troubleshooting

### Common Issues

#### 1. Canvas Not Saving

**Symptom:** Click "Save Canvas" but canvas doesn't persist

**Solution:**
- Check browser console for errors
- Verify localStorage is enabled in browser
- Check localStorage quota (may be full)
- Clear localStorage and try again:
  \`\`\`javascript
  localStorage.removeItem('workflow-canvas')
  \`\`\`

#### 2. Workflows Not Appearing in Selector

**Symptom:** Canvas Builder Workflow option doesn't appear in company creation

**Solution:**
- Verify canvas is saved (check localStorage)
- Refresh the page to trigger reload
- Check console for "Loading saved canvas" message
- Verify canvas has at least one node

#### 3. Submit All Button Disabled

**Symptom:** Cannot click "Submit All" even after filling all steps

**Solution:**
- Verify ALL steps are marked as complete (green checkmarks)
- Check each step for required fields (red asterisks)
- Open browser console and check for validation errors
- Click "Mark as Complete" on each step individually

#### 4. API Calls Failing

**Symptom:** "Partial Failure" message after clicking Submit All

**Solution:**
- Check browser console for specific API errors
- Verify API endpoints are correct in `getApiEndpointForStep()`
- Check network tab for failed requests
- Verify request payload format matches API expectations
- For demo purposes, API calls may fail if endpoints don't exist (this is expected)

#### 5. Infinite Loop Error

**Symptom:** "Maximum update depth exceeded" error

**Solution:**
- This was fixed in the latest version
- If still occurring, check useEffect dependencies
- Verify no setState calls during render
- Clear browser cache and reload

#### 6. Sidebar Not Showing Correct Items

**Symptom:** Wrong menu items for user role

**Solution:**
- Verify user role in localStorage:
  \`\`\`javascript
  const user = JSON.parse(localStorage.getItem('currentUser'))
  console.log(user.role)
  \`\`\`
- Logout and login again
- Check `erp-sidebar.tsx` role configuration
- Verify role is one of: admin, manager, employee, viewer, clerk

#### 7. Workflow Nodes Not Deleting

**Symptom:** Click delete button but node doesn't disappear

**Solution:**
- This was fixed in the latest version
- Verify node ID is being passed correctly
- Check console for "Deleting node" message
- Try refreshing the page

### Debug Mode

Enable detailed logging by opening browser console:

\`\`\`javascript
// All components log with [v0] prefix
// Look for these messages:

// Canvas operations
"[v0] Loading saved canvas"
"[v0] Saving canvas"
"[v0] Adding workflow to canvas"
"[v0] Deleting node"

// Workflow operations
"[v0] Selected workflow"
"[v0] View mode selected"
"[v0] Step validation"
"[v0] Marking step as complete"

// API operations
"[v0] Calling API for [step name]"
"[v0] All API calls succeeded"
"[v0] API call failed for [step name]"

// Company operations
"[v0] Saved workflow company to localStorage"
"[v0] Loading companies from localStorage"
\`\`\`

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- localStorage support
- ES6+ JavaScript
- CSS Grid and Flexbox
- Fetch API

### Performance Optimization

**For Large Canvases (50+ nodes):**
- Use minimap for navigation
- Zoom out to see overview
- Group related workflows together
- Consider splitting into multiple canvases

**For Long Workflows (20+ steps):**
- Use Tab View mode for better navigation
- Group related fields together
- Consider splitting into multiple workflows
- Use workflow chaining for complex processes

---

## Best Practices

### Workflow Design

1. **Keep steps focused** - Each step should have a clear purpose
2. **Limit fields per step** - 5-10 fields maximum per step
3. **Use descriptive names** - Clear step and field names
4. **Group related data** - Put related fields in the same step
5. **Validate early** - Mark required fields clearly

### Canvas Organization

1. **Left-to-right flow** - Arrange workflows in reading order
2. **Consistent spacing** - Keep nodes evenly spaced
3. **Minimize crossings** - Avoid connection lines crossing
4. **Group by function** - Keep related workflows together
5. **Use descriptive names** - Clear workflow names and descriptions

### API Integration

1. **Handle errors gracefully** - Show clear error messages
2. **Validate before submission** - Check all required fields
3. **Use batch operations** - Submit all steps at once when possible
4. **Log API calls** - Track success/failure for debugging
5. **Provide feedback** - Show loading states and success messages

### Security Considerations

1. **Validate on server** - Never trust client-side validation alone
2. **Sanitize inputs** - Clean all user input before API calls
3. **Use HTTPS** - Always use secure connections for API calls
4. **Implement rate limiting** - Prevent abuse of API endpoints
5. **Audit user actions** - Log important operations for security

---

## Future Enhancements

### Planned Features

1. **Workflow Templates** - Pre-built workflows for common use cases
2. **Conditional Logic** - Show/hide steps based on previous answers
3. **File Uploads** - Support for document uploads in workflow steps
4. **Email Notifications** - Send emails when workflows are completed
5. **Workflow Analytics** - Track completion rates and bottlenecks
6. **Multi-language Support** - Internationalization for global use
7. **Real-time Collaboration** - Multiple users editing workflows simultaneously
8. **Workflow Versioning** - Track changes and rollback to previous versions
9. **Advanced Validation** - Custom validation rules and regex patterns
10. **Export/Import** - Export workflows as JSON for backup/sharing

---

## Support

For questions, issues, or feature requests:

1. Check this documentation first
2. Review the troubleshooting section
3. Check browser console for error messages
4. Review the demo credentials and test with different roles
5. Examine the source code in the components directory

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Visual workflow canvas builder with React Flow
- ✅ Workflow chaining and connections
- ✅ Role-based sidebar navigation
- ✅ Dual view modes (Wizard and Tab View)
- ✅ Batch API submission for all steps
- ✅ Step validation and completion tracking
- ✅ localStorage persistence
- ✅ Demo credentials for testing
- ✅ Comprehensive documentation

---

**Last Updated:** 2025-01-29
**Version:** 1.0.0
**Author:** v0 AI Assistant
