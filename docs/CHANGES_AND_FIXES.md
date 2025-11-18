# Changes and Fixes Documentation

Complete documentation of all changes made to integrate backend APIs with the frontend.

## Table of Contents

1. [Overview](#overview)
2. [Major Changes](#major-changes)
3. [API Integration Changes](#api-integration-changes)
4. [Authentication Fixes](#authentication-fixes)
5. [Component Updates](#component-updates)
6. [Configuration Changes](#configuration-changes)
7. [How to Fix Issues](#how-to-fix-issues)

---

## Overview

This document tracks all changes made to integrate the workflow builder API endpoints with the frontend application. These changes ensure the frontend properly communicates with the backend and displays data from the workflow builder system.

---

## Major Changes

### 1. Removed localStorage Dependency for Companies

**Before**: Companies were loaded from both API and localStorage, then merged.

**After**: Companies are now loaded exclusively from the workflow builder API endpoint `/workflows/builder/table-data/all`.

**Files Changed**:
- `components/erp-company-list.tsx`
- `components/erp-dashboard.tsx`
- `components/erp-user-management.tsx`

**Impact**: All company data now comes from the server, ensuring data consistency.

---

### 2. Fixed Authentication Endpoint

**Before**: Auth endpoint might have been constructed incorrectly.

**After**: Auth endpoints (`/auth/token`, `/auth/logout`) are now correctly handled at root level without `/api/v1/` prefix.

**Files Changed**:
- `lib/api/http-client.ts` - Added auth endpoint handling in `buildUrl()`

**Impact**: Login and logout now work correctly.

---

### 3. Integrated Workflow Builder API

**Before**: Components used non-existent `/api/companies` endpoint.

**After**: Components now use `/workflows/builder/table-data/all` to fetch all master records from all workflows.

**Files Changed**:
- `components/erp-company-list.tsx` - Uses `getAllMasterTableData()`
- `components/erp-dashboard.tsx` - Uses `getAllMasterTableData()`
- `components/erp-user-management.tsx` - Uses `getAllMasterTableData()`

**Impact**: Companies are now displayed from workflow builder master tables.

---

## API Integration Changes

### Company Data Loading

**Old Implementation**:
```typescript
// Loaded from both API and localStorage
const apiCompanies = await companyAPI.getAllCompanies()
const localCompanies = storageService.getCompanies()
const allCompanies = [...apiCompanies, ...localCompanies]
```

**New Implementation**:
```typescript
// Load only from workflow builder API
const response = await dynamicWorkflowAPI.getAllMasterTableData()
// Flatten records from all workflows
const allRecords = Object.values(response.workflow_data || {})
  .flatMap(workflow => workflow.records || [])
```

**Location**: `components/erp-company-list.tsx` - `loadMasterRecords()`

---

### User Data Loading

**Old Implementation**:
```typescript
const users = await userAPI.getAll() // Method didn't exist
```

**New Implementation**:
```typescript
const users = await userAPI.getAllUsers() // Correct method name
```

**Location**: `components/erp-dashboard.tsx`, `components/erp-user-management.tsx`

---

### Workflow Data Loading

**Old Implementation**:
```typescript
// Tried to load from API, fell back to localStorage
const workflows = await WorkflowBridgeService.getAllWorkflows()
if (!workflows) {
  const localWorkflows = workflowStorage.getAll()
}
```

**New Implementation**:
```typescript
// Load from API, handle errors gracefully
try {
  const workflows = await WorkflowBridgeService.getAllWorkflows()
  setWorkflows(workflows)
} catch (error) {
  // Handle auth errors specifically
  if (error.response?.status === 401) {
    // Clear token and redirect
  }
  // Fallback to localStorage if available
}
```

**Location**: `components/workflow-management.tsx`

---

## Authentication Fixes

### Token Handling

**Added**: Pre-flight authentication check before API calls

```typescript
useEffect(() => {
  const token = localStorage.getItem("auth_token")
  if (!token) {
    setError("Not authenticated. Please log in to continue.")
    setTimeout(() => window.location.href = "/", 1500)
    return
  }
  loadData()
}, [])
```

**Location**: `components/erp-company-list.tsx`

---

### Error Handling

**Added**: Comprehensive authentication error detection

```typescript
if (error.response?.status === 401 || error.response?.status === 403) {
  const errorDetail = error.response?.data?.detail || ""
  if (
    errorDetail.includes("token") || 
    errorDetail.includes("Not authenticated") ||
    errorDetail.includes("Invalid")
  ) {
    localStorage.removeItem("auth_token")
    window.location.href = "/"
  }
}
```

**Location**: 
- `lib/api/http-client.ts` - Response interceptor
- `components/erp-company-list.tsx`
- `components/workflow-management.tsx`

---

### URL Construction Fix

**Before**: Auth endpoints might get `/api/v1/` prefix added incorrectly.

**After**: Auth endpoints are explicitly handled at root level.

```typescript
// Auth endpoints are at root level (no /api/v1 prefix)
if (cleanEndpoint.startsWith("auth/")) {
  return `/${cleanEndpoint}`
}
```

**Location**: `lib/api/http-client.ts` - `buildUrl()` method

---

## Component Updates

### ERP Company List

**Changes**:
1. Removed `loadCompanies()` function that merged API and localStorage
2. Removed `storageService` import
3. Removed storage event listener
4. Added pre-flight token check
5. Improved error handling for authentication errors
6. Updated "Try Again" button to check token before retry

**Location**: `components/erp-company-list.tsx`

---

### ERP Dashboard

**Changes**:
1. Replaced `companyAPI.getAll()` with `dynamicWorkflowAPI.getAllMasterTableData()`
2. Fixed `userAPI.getAll()` to `userAPI.getAllUsers()`
3. Added data flattening logic for workflow records
4. Improved error handling

**Location**: `components/erp-dashboard.tsx`

---

### ERP User Management

**Changes**:
1. Fixed `userAPI.getAll()` to `userAPI.getAllUsers()`
2. Replaced `companyAPI.getAll()` with `dynamicWorkflowAPI.getAllMasterTableData()`
3. Added data flattening for companies list

**Location**: `components/erp-user-management.tsx`

---

### Workflow Management

**Changes**:
1. Added authentication error handling
2. Improved error messages
3. Added token check before API calls

**Location**: `components/workflow-management.tsx`

---

## Configuration Changes

### HTTP Client

**Added**: Auth endpoint handling in URL construction

```typescript
private buildUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
  
  // Auth endpoints are at root level
  if (cleanEndpoint.startsWith("auth/")) {
    return `/${cleanEndpoint}`
  }
  
  // Workflow builder endpoints are at root level
  if (cleanEndpoint.startsWith("workflows/builder")) {
    return `/${cleanEndpoint}`
  }
  
  // Other endpoints need /api/v1 prefix
  return `/api/${API_CONFIG.apiVersion}/${cleanEndpoint}`
}
```

**Location**: `lib/api/http-client.ts`

---

### API Config

**No changes needed** - Endpoints are already correctly configured:
- `/auth/token` - Login
- `/auth/logout` - Logout
- `/workflows/builder/table-data/all` - Get all master records

**Location**: `lib/api/config.ts`

---

## How to Fix Issues

### Issue: "Not authenticated" Error

**Cause**: Token not found or invalid

**Fix**:
1. Clear localStorage:
   ```javascript
   localStorage.removeItem("auth_token")
   localStorage.removeItem("user")
   ```
2. Login again with admin/admin
3. Verify token is stored: `localStorage.getItem("auth_token")`

**Related Files**:
- `lib/erp-auth-context.tsx` - Login function
- `components/erp-company-list.tsx` - Pre-flight check

---

### Issue: Companies Not Showing

**Cause**: No data in workflow builder or API error

**Fix**:
1. Run the script to create workflow and data:
   ```bash
   cd erp_r-main
   python3 scripts/create_workflow_and_insert_data.py
   ```
2. Check Network tab for `/workflows/builder/table-data/all` request
3. Verify response contains `workflow_data` with records
4. Check console logs for data processing

**Related Files**:
- `components/erp-company-list.tsx` - `loadMasterRecords()`
- `lib/api/services/dynamic-workflow-api.service.ts` - `getAllMasterTableData()`

---

### Issue: Wrong API Endpoint URL

**Cause**: URL construction issue

**Fix**:
1. Check `buildUrl()` method in `lib/api/http-client.ts`
2. Verify endpoint pattern matches:
   - `auth/*` → root level
   - `workflows/builder/*` → root level
   - Others → `/api/v1/` prefix
3. Check Network tab for actual request URL

**Related Files**:
- `lib/api/http-client.ts` - `buildUrl()` method

---

### Issue: CORS Errors

**Cause**: Backend CORS not configured for frontend origin

**Fix**:
1. Update backend CORS configuration:
   ```python
   allow_origins=["http://localhost:3000"]
   ```
2. For development, allow all:
   ```python
   allow_origins=["*"]
   ```
3. Restart backend server

**Related Files**: Backend CORS middleware

---

### Issue: Environment Variables Not Working

**Cause**: Variable not set or wrong name

**Fix**:
1. Ensure variable starts with `NEXT_PUBLIC_`
2. Create `.env.local` in frontend root
3. Add: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
4. Restart development server

**Related Files**:
- `lib/api/config.ts` - API_CONFIG
- `.env.local` - Environment variables

---

## Migration Guide

### If Updating from Old Version

1. **Clear localStorage**:
   ```javascript
   localStorage.clear()
   ```

2. **Update imports**:
   - Remove `storageService` imports from company components
   - Add `dynamicWorkflowAPI` imports

3. **Update API calls**:
   - Replace `companyAPI.getAll()` with `dynamicWorkflowAPI.getAllMasterTableData()`
   - Replace `userAPI.getAll()` with `userAPI.getAllUsers()`

4. **Test authentication**:
   - Login with admin/admin
   - Verify token is stored
   - Check API calls include token

5. **Verify data loading**:
   - Run workflow creation script
   - Check companies page shows data
   - Verify dashboard shows statistics

---

## Testing Checklist

After making changes, verify:

- [ ] Login works with admin/admin
- [ ] Token is stored in localStorage
- [ ] Companies page loads data from API
- [ ] Dashboard shows company statistics
- [ ] Workflow management loads workflows
- [ ] No localStorage errors in console
- [ ] Network tab shows correct API calls
- [ ] Error handling works (try invalid token)
- [ ] "Try Again" button works
- [ ] Logout clears token

---

## Related Documentation

- [API Endpoints Reference](./API_ENDPOINTS_REFERENCE.md)
- [Configuration Guide](./CONFIGURATION_GUIDE.md)
- [Backend Frontend Integration](./BACKEND_FRONTEND_INTEGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [Workflow Builder Integration](./WORKFLOW_BUILDER_INTEGRATION.md)

---

## Summary

All changes ensure:
1. ✅ Data comes from server (no localStorage for companies)
2. ✅ Authentication works correctly
3. ✅ API endpoints are correctly constructed
4. ✅ Error handling is comprehensive
5. ✅ Components are properly integrated with workflow builder API

The frontend is now fully integrated with the backend workflow builder system.

