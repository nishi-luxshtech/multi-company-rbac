# Multi-Step API Submission Guide
## Understanding How 9 Different API Calls Work Together

---

## 📚 Table of Contents

1. [Overview - The Big Picture](#overview---the-big-picture)
2. [The Problem We're Solving](#the-problem-were-solving)
3. [How It Works - Simple Explanation](#how-it-works---simple-explanation)
4. [Technical Implementation](#technical-implementation)
5. [Step-by-Step Flow](#step-by-step-flow)
6. [Code Examples](#code-examples)
7. [How to Configure API Endpoints](#how-to-configure-api-endpoints)
8. [Troubleshooting](#troubleshooting)

---

## Overview - The Big Picture

### What is Multi-Step API Submission?

Imagine you're filling out a long form at a government office. Instead of submitting each page separately and waiting in line 9 times, you fill out all 9 pages first, then submit everything at once. The clerk then processes each page by sending it to different departments (HR, Finance, Legal, etc.) all at the same time.

**That's exactly what our system does!**

- **9 Steps** = 9 different forms/pages
- **9 API Endpoints** = 9 different departments/systems
- **Submit All Button** = Submit everything at once
- **Parallel Processing** = All departments work simultaneously

---

## The Problem We're Solving

### Traditional Approach (Slow ❌)

\`\`\`
User fills Step 1 → Submit → Wait for API response → Move to Step 2
User fills Step 2 → Submit → Wait for API response → Move to Step 3
User fills Step 3 → Submit → Wait for API response → Move to Step 4
... (repeat 9 times)
\`\`\`

**Problems:**
- User has to wait after each step
- If Step 5 fails, user loses progress
- Takes a long time (9 separate waits)
- Bad user experience

### Our Approach (Fast ✅)

\`\`\`
User fills all 9 steps → Click "Submit All" → All 9 APIs called at once
\`\`\`

**Benefits:**
- User fills everything first (no waiting between steps)
- All APIs are called in parallel (faster)
- Better error handling (can retry failed steps)
- Great user experience

---

## How It Works - Simple Explanation

### Step 1: Define Your API Endpoints

Think of this as creating a phone directory. Each step needs to know which "phone number" (API endpoint) to call.

\`\`\`typescript
// This is like a phone book for your steps
const API_ENDPOINTS = {
  "Company Information": "/api/company/basic-info",
  "Address Details": "/api/company/address",
  "Contact Information": "/api/company/contact",
  "Tax Information": "/api/company/tax",
  "Bank Details": "/api/company/banking",
  "Legal Documents": "/api/company/legal",
  "Employee Setup": "/api/company/employees",
  "Department Structure": "/api/company/departments",
  "System Configuration": "/api/company/config"
}
\`\`\`

### Step 2: User Fills Out All Steps

The user goes through each step and fills in the required information. The system validates each step but **doesn't call any APIs yet**.

\`\`\`
Step 1: Company Information ✓ (validated, not submitted)
Step 2: Address Details ✓ (validated, not submitted)
Step 3: Contact Information ✓ (validated, not submitted)
... (all 9 steps)
\`\`\`

### Step 3: Click "Submit All"

When the user clicks "Submit All", the system:

1. **Collects data from all 9 steps**
2. **Looks up the correct API endpoint for each step** (using the phone book)
3. **Calls all 9 APIs at the same time** (parallel processing)
4. **Waits for all responses**
5. **Shows success or error for each step**

---

## Technical Implementation

### Architecture Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (React)                    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     ┌──────────┐ │
│  │  Step 1  │  │  Step 2  │  │  Step 3  │ ... │  Step 9  │ │
│  │  Form    │  │  Form    │  │  Form    │     │  Form    │ │
│  └──────────┘  └──────────┘  └──────────┘     └──────────┘ │
│                                                               │
│                    ┌──────────────────┐                      │
│                    │  Submit All Btn  │                      │
│                    └────────┬─────────┘                      │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  API Submission │
                    │     Handler     │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │  API 1   │ │  API 2   │ │  API 9   │
         │ /company │ │ /address │ │ /config  │
         │  /basic  │ │          │ │          │
         └──────────┘ └──────────┘ └──────────┘
                │            │            │
                └────────────┼────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  All Responses  │
                    │    Combined     │
                    └─────────────────┘
\`\`\`

### Key Components

#### 1. **Step Configuration** (The Phone Book)

This maps each step name to its API endpoint:

\`\`\`typescript
const getStepApiEndpoint = (stepName: string): string => {
  const endpoints: Record<string, string> = {
    "Company Information": "/api/company/basic-info",
    "Address Details": "/api/company/address",
    "Contact Information": "/api/company/contact",
    "Tax Information": "/api/company/tax",
    "Bank Details": "/api/company/banking",
    "Legal Documents": "/api/company/legal",
    "Employee Setup": "/api/company/employees",
    "Department Structure": "/api/company/departments",
    "System Configuration": "/api/company/config"
  }
  
  return endpoints[stepName] || "/api/company/default"
}
\`\`\`

#### 2. **Data Collection** (Gathering All Forms)

Before submitting, we collect data from all steps:

\`\`\`typescript
// Collect data for each step
const stepDataArray = workflow.steps.map((step, index) => {
  // Get the form data for this step
  const stepFormData = Object.entries(formData)
    .filter(([key]) => {
      // Find fields that belong to this step
      return step.fields.some(field => field.name === key)
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {} as Record<string, any>)
  
  return {
    stepName: step.name,
    stepIndex: index,
    data: stepFormData,
    endpoint: getStepApiEndpoint(step.name)
  }
})
\`\`\`

#### 3. **Parallel API Calls** (Calling All Departments at Once)

This is where the magic happens! We use `Promise.all()` to call all APIs simultaneously:

\`\`\`typescript
const handleSubmitAll = async () => {
  console.log("Submitting all steps to different APIs...")
  
  // Create an array of API call promises
  const apiCalls = stepDataArray.map(async (stepData) => {
    try {
      console.log(`Calling API for ${stepData.stepName}: ${stepData.endpoint}`)
      
      // Make the API call
      const response = await fetch(stepData.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stepData.data)
      })
      
      if (!response.ok) {
        throw new Error(`API call failed for ${stepData.stepName}`)
      }
      
      const result = await response.json()
      
      return {
        stepName: stepData.stepName,
        success: true,
        data: result
      }
    } catch (error) {
      return {
        stepName: stepData.stepName,
        success: false,
        error: error.message
      }
    }
  })
  
  // Wait for ALL API calls to complete
  const results = await Promise.all(apiCalls)
  
  // Check if all succeeded
  const allSucceeded = results.every(r => r.success)
  
  if (allSucceeded) {
    console.log("All API calls succeeded!")
    // Save to localStorage and show success message
  } else {
    console.log("Some API calls failed:", results.filter(r => !r.success))
    // Show error message with details
  }
}
\`\`\`

---

## Step-by-Step Flow

### Phase 1: User Fills Out Forms

\`\`\`
┌─────────────────────────────────────────────────────────┐
│ Step 1: Company Information                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Company Name: [Acme Corp____________]               │ │
│ │ Industry: [Technology_______________]               │ │
│ │ Founded: [2020______________________]               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [Mark as Complete] ← User clicks this                    │
└─────────────────────────────────────────────────────────┘
                          ↓
              ✓ Step validated (no API call yet)
              ✓ Checkmark appears on tab
              ✓ User moves to next step
\`\`\`

**Repeat for all 9 steps...**

### Phase 2: Submit All Button Becomes Active

\`\`\`
After all 9 steps are validated:

┌─────────────────────────────────────────────────────────┐
│ ✓ Step 1  ✓ Step 2  ✓ Step 3  ...  ✓ Step 9           │
│                                                           │
│              [Submit All Steps] ← Now enabled!           │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Phase 3: Parallel API Submission

\`\`\`
User clicks "Submit All Steps"
                ↓
┌───────────────────────────────────────────────────────────┐
│          Preparing API Calls...                           │
│                                                             │
│  Step 1 → /api/company/basic-info    [Preparing...]       │
│  Step 2 → /api/company/address       [Preparing...]       │
│  Step 3 → /api/company/contact       [Preparing...]       │
│  Step 4 → /api/company/tax           [Preparing...]       │
│  Step 5 → /api/company/banking       [Preparing...]       │
│  Step 6 → /api/company/legal         [Preparing...]       │
│  Step 7 → /api/company/employees     [Preparing...]       │
│  Step 8 → /api/company/departments   [Preparing...]       │
│  Step 9 → /api/company/config        [Preparing...]       │
└───────────────────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│          Calling APIs in Parallel...                      │
│                                                             │
│  Step 1 → /api/company/basic-info    [Sending... 🔄]      │
│  Step 2 → /api/company/address       [Sending... 🔄]      │
│  Step 3 → /api/company/contact       [Sending... 🔄]      │
│  Step 4 → /api/company/tax           [Sending... 🔄]      │
│  Step 5 → /api/company/banking       [Sending... 🔄]      │
│  Step 6 → /api/company/legal         [Sending... 🔄]      │
│  Step 7 → /api/company/employees     [Sending... 🔄]      │
│  Step 8 → /api/company/departments   [Sending... 🔄]      │
│  Step 9 → /api/company/config        [Sending... 🔄]      │
└───────────────────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│          Receiving Responses...                           │
│                                                             │
│  Step 1 → /api/company/basic-info    [✓ Success]         │
│  Step 2 → /api/company/address       [✓ Success]         │
│  Step 3 → /api/company/contact       [✓ Success]         │
│  Step 4 → /api/company/tax           [✓ Success]         │
│  Step 5 → /api/company/banking       [✓ Success]         │
│  Step 6 → /api/company/legal         [✓ Success]         │
│  Step 7 → /api/company/employees     [✓ Success]         │
│  Step 8 → /api/company/departments   [✓ Success]         │
│  Step 9 → /api/company/config        [✓ Success]         │
└───────────────────────────────────────────────────────────┘
                ↓
        All APIs succeeded! ✓
        Company saved to localStorage
        Success message shown
\`\`\`

---

## Code Examples

### Example 1: Basic Setup

\`\`\`typescript
// File: components/dynamic-company-wizard.tsx

// Step 1: Define your API endpoints
const getStepApiEndpoint = (stepName: string): string => {
  const endpoints: Record<string, string> = {
    "Company Information": "/api/company/basic-info",
    "Address Details": "/api/company/address",
    "Contact Information": "/api/company/contact",
    // ... add more as needed
  }
  return endpoints[stepName] || "/api/company/default"
}

// Step 2: Handle "Submit All" button click
const handleSubmitAll = async () => {
  setIsSubmitting(true)
  
  try {
    // Collect data from all steps
    const stepDataArray = workflow.steps.map((step, index) => ({
      stepName: step.name,
      stepIndex: index,
      data: getStepFormData(step),
      endpoint: getStepApiEndpoint(step.name)
    }))
    
    // Call all APIs in parallel
    const results = await Promise.all(
      stepDataArray.map(stepData => callStepApi(stepData))
    )
    
    // Check results
    const allSucceeded = results.every(r => r.success)
    
    if (allSucceeded) {
      // Success! Save to localStorage
      saveCompanyToLocalStorage(formData)
      toast.success("Company created successfully!")
      onComplete()
    } else {
      // Some failed - show errors
      const failedSteps = results.filter(r => !r.success)
      toast.error(`Failed steps: ${failedSteps.map(s => s.stepName).join(", ")}`)
    }
  } catch (error) {
    toast.error("Submission failed: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}
\`\`\`

### Example 2: Individual API Call Function

\`\`\`typescript
// Helper function to call a single step's API
const callStepApi = async (stepData: {
  stepName: string
  stepIndex: number
  data: Record<string, any>
  endpoint: string
}) => {
  try {
    console.log(`Calling ${stepData.endpoint} for ${stepData.stepName}`)
    
    const response = await fetch(stepData.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}` // If needed
      },
      body: JSON.stringify({
        stepName: stepData.stepName,
        stepIndex: stepData.stepIndex,
        data: stepData.data,
        timestamp: new Date().toISOString()
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "API call failed")
    }
    
    const result = await response.json()
    
    console.log(`✓ Success for ${stepData.stepName}:`, result)
    
    return {
      stepName: stepData.stepName,
      success: true,
      data: result
    }
  } catch (error) {
    console.error(`✗ Failed for ${stepData.stepName}:`, error)
    
    return {
      stepName: stepData.stepName,
      success: false,
      error: error.message
    }
  }
}
\`\`\`

### Example 3: Collecting Step Data

\`\`\`typescript
// Helper function to get form data for a specific step
const getStepFormData = (step: WorkflowStep): Record<string, any> => {
  const stepData: Record<string, any> = {}
  
  // Loop through all fields in this step
  step.fields.forEach(field => {
    // Get the value from formData
    const value = formData[field.name]
    
    // Only include if value exists
    if (value !== undefined && value !== null && value !== "") {
      stepData[field.name] = value
    }
  })
  
  return stepData
}
\`\`\`

---

## How to Configure API Endpoints

### Option 1: Hardcoded Endpoints (Simple)

Best for: Small projects with fixed endpoints

\`\`\`typescript
const getStepApiEndpoint = (stepName: string): string => {
  const endpoints: Record<string, string> = {
    "Company Information": "/api/company/basic-info",
    "Address Details": "/api/company/address",
    "Contact Information": "/api/company/contact",
    "Tax Information": "/api/company/tax",
    "Bank Details": "/api/company/banking",
    "Legal Documents": "/api/company/legal",
    "Employee Setup": "/api/company/employees",
    "Department Structure": "/api/company/departments",
    "System Configuration": "/api/company/config"
  }
  
  return endpoints[stepName] || "/api/company/default"
}
\`\`\`

### Option 2: Configuration File (Recommended)

Best for: Medium to large projects, easier to maintain

\`\`\`typescript
// File: lib/workflow-api-config.ts

export const WORKFLOW_API_ENDPOINTS = {
  "Company Information": {
    endpoint: "/api/company/basic-info",
    method: "POST",
    requiresAuth: true
  },
  "Address Details": {
    endpoint: "/api/company/address",
    method: "POST",
    requiresAuth: true
  },
  "Contact Information": {
    endpoint: "/api/company/contact",
    method: "POST",
    requiresAuth: true
  },
  // ... more steps
}

export const getStepApiConfig = (stepName: string) => {
  return WORKFLOW_API_ENDPOINTS[stepName] || {
    endpoint: "/api/company/default",
    method: "POST",
    requiresAuth: false
  }
}
\`\`\`

### Option 3: Database Configuration (Advanced)

Best for: Enterprise projects, dynamic workflows

\`\`\`typescript
// Store API endpoints in database
// Load them when workflow is loaded

const loadWorkflowApiConfig = async (workflowId: string) => {
  const response = await fetch(`/api/workflows/${workflowId}/api-config`)
  const config = await response.json()
  
  return config.steps.map(step => ({
    stepName: step.name,
    endpoint: step.apiEndpoint,
    method: step.apiMethod,
    headers: step.apiHeaders
  }))
}
\`\`\`

### Option 4: Environment Variables (Flexible)

Best for: Different environments (dev, staging, prod)

\`\`\`typescript
// .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_COMPANY_API=/company
NEXT_PUBLIC_ADDRESS_API=/address

// In code:
const getStepApiEndpoint = (stepName: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  
  const endpoints: Record<string, string> = {
    "Company Information": `${baseUrl}${process.env.NEXT_PUBLIC_COMPANY_API}/basic-info`,
    "Address Details": `${baseUrl}${process.env.NEXT_PUBLIC_ADDRESS_API}`,
    // ... more
  }
  
  return endpoints[stepName]
}
\`\`\`

---

## Real-World Example

Let's walk through a complete example with a 3-step workflow:

### Step 1: Define the Workflow

\`\`\`typescript
const workflow = {
  id: "wf_company_onboarding",
  name: "Company Onboarding",
  steps: [
    {
      name: "Company Information",
      fields: [
        { name: "companyName", label: "Company Name", type: "text", required: true },
        { name: "industry", label: "Industry", type: "text", required: true }
      ]
    },
    {
      name: "Address Details",
      fields: [
        { name: "street", label: "Street", type: "text", required: true },
        { name: "city", label: "City", type: "text", required: true }
      ]
    },
    {
      name: "Contact Information",
      fields: [
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true }
      ]
    }
  ]
}
\`\`\`

### Step 2: User Fills Out Forms

\`\`\`typescript
// User fills out all 3 steps
const formData = {
  // Step 1 data
  companyName: "Acme Corp",
  industry: "Technology",
  
  // Step 2 data
  street: "123 Main St",
  city: "San Francisco",
  
  // Step 3 data
  email: "contact@acme.com",
  phone: "+1-555-0123"
}
\`\`\`

### Step 3: Submit All

\`\`\`typescript
// When user clicks "Submit All"
const handleSubmitAll = async () => {
  // Prepare API calls
  const apiCalls = [
    // API Call 1: Company Information
    fetch("/api/company/basic-info", {
      method: "POST",
      body: JSON.stringify({
        companyName: formData.companyName,
        industry: formData.industry
      })
    }),
    
    // API Call 2: Address Details
    fetch("/api/company/address", {
      method: "POST",
      body: JSON.stringify({
        street: formData.street,
        city: formData.city
      })
    }),
    
    // API Call 3: Contact Information
    fetch("/api/company/contact", {
      method: "POST",
      body: JSON.stringify({
        email: formData.email,
        phone: formData.phone
      })
    })
  ]
  
  // Execute all API calls in parallel
  const results = await Promise.all(apiCalls)
  
  // All 3 APIs are called at the same time!
  // Results come back when all are complete
}
\`\`\`

### Step 4: Handle Results

\`\`\`typescript
// Check if all succeeded
const allSucceeded = results.every(r => r.ok)

if (allSucceeded) {
  console.log("✓ All 3 API calls succeeded!")
  // Show success message
  // Save to localStorage
  // Redirect to company list
} else {
  console.log("✗ Some API calls failed")
  // Show which steps failed
  // Allow user to retry
}
\`\`\`

---

## Troubleshooting

### Problem 1: API Endpoint Not Found

**Symptom:** Error message "API endpoint not found for step X"

**Solution:**
\`\`\`typescript
// Make sure step name matches exactly
const endpoints = {
  "Company Information": "/api/company/basic-info", // ✓ Correct
  "company information": "/api/company/basic-info", // ✗ Wrong (case sensitive)
}

// Add a fallback
return endpoints[stepName] || "/api/company/default"
\`\`\`

### Problem 2: Some APIs Fail

**Symptom:** Some steps succeed, others fail

**Solution:**
\`\`\`typescript
// Show detailed error information
const failedSteps = results.filter(r => !r.success)
failedSteps.forEach(step => {
  console.error(`Failed: ${step.stepName}`, step.error)
  toast.error(`${step.stepName} failed: ${step.error}`)
})

// Allow retry for failed steps only
const retryFailedSteps = async () => {
  const retryResults = await Promise.all(
    failedSteps.map(step => callStepApi(step))
  )
  // Check retry results
}
\`\`\`

### Problem 3: Slow API Responses

**Symptom:** "Submit All" takes too long

**Solution:**
\`\`\`typescript
// Add timeout to API calls
const callStepApiWithTimeout = async (stepData, timeout = 30000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(stepData.endpoint, {
      method: "POST",
      body: JSON.stringify(stepData.data),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}
\`\`\`

### Problem 4: Data Not Sent Correctly

**Symptom:** API receives incomplete or wrong data

**Solution:**
\`\`\`typescript
// Log data before sending
console.log("Sending data for", stepData.stepName, ":", stepData.data)

// Validate data structure
const validateStepData = (step: WorkflowStep, data: Record<string, any>) => {
  const requiredFields = step.fields.filter(f => f.required)
  const missingFields = requiredFields.filter(f => !data[f.name])
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.map(f => f.label).join(", ")}`)
  }
  
  return true
}
\`\`\`

---

## Summary

### Key Takeaways

1. **9 Steps = 9 Different APIs**
   - Each step has its own API endpoint
   - Configured in a mapping object or configuration file

2. **Fill First, Submit Later**
   - User fills all steps without API calls
   - Validation happens locally
   - All APIs called only when "Submit All" is clicked

3. **Parallel Processing**
   - All 9 APIs are called simultaneously using `Promise.all()`
   - Faster than sequential calls
   - Better user experience

4. **Error Handling**
   - Each API call is wrapped in try-catch
   - Failed steps are tracked and reported
   - User can retry failed steps

5. **Flexible Configuration**
   - API endpoints can be hardcoded, in config files, or in database
   - Easy to add/modify endpoints
   - Supports different environments

### Next Steps

1. **Review the code examples** in this document
2. **Configure your API endpoints** using one of the methods shown
3. **Test with your actual APIs** (or use mock APIs first)
4. **Add error handling** for your specific use cases
5. **Monitor API performance** and optimize as needed

---

## Additional Resources

- [React Promise.all() Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Error Handling Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [Workflow System Guide](./WORKFLOW_SYSTEM_GUIDE.md)

---

**Questions or Issues?**

If you have questions about implementing multi-step API submission, please:
1. Check the troubleshooting section above
2. Review the code examples
3. Check the console logs for detailed error messages
4. Contact the development team for support
