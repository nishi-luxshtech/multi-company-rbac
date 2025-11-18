# Backend to Frontend Integration Guide

Complete guide for integrating backend APIs with the frontend application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Integration Flow](#api-integration-flow)
3. [Authentication Flow](#authentication-flow)
4. [Data Flow](#data-flow)
5. [Integration Points](#integration-points)
6. [Common Patterns](#common-patterns)
7. [Error Handling](#error-handling)

---

## Architecture Overview

### Backend API Structure

```
Backend (FastAPI)
├── /auth/token                    # Authentication
├── /workflows/builder/            # Workflow management
│   ├── /table-data/all            # Get all master records
│   └── /{id}/table-data           # Workflow-specific data
└── /api/v1/                       # Versioned endpoints
    ├── /users                     # User management
    └── /companies                 # Company management (legacy)
```

### Frontend Structure

```
Frontend (Next.js)
├── lib/api/
│   ├── config.ts                  # API configuration
│   ├── http-client.ts             # HTTP client with interceptors
│   ├── api-services.ts            # API service methods
│   └── services/
│       └── dynamic-workflow-api.service.ts  # Workflow API
├── components/
│   ├── erp-company-list.tsx       # Uses getAllMasterTableData
│   ├── erp-dashboard.tsx         # Uses getAllMasterTableData
│   └── workflow-management.tsx   # Uses listWorkflows
└── lib/erp-auth-context.tsx      # Authentication context
```

---

## API Integration Flow

### 1. Configuration

**Backend Endpoint**: Any endpoint
**Frontend Config**: `lib/api/config.ts`

```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  apiVersion: "v1",
  timeout: 30000,
}
```

### 2. HTTP Client Setup

**File**: `lib/api/http-client.ts`

The HTTP client:
- Adds authentication token to all requests
- Handles errors automatically
- Constructs correct URLs based on endpoint patterns

```typescript
// Request interceptor adds token
this.client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 3. API Service Layer

**File**: `lib/api/services/dynamic-workflow-api.service.ts`

Service methods wrap API calls:

```typescript
async getAllMasterTableData(
  companyId?: number,
  limitPerWorkflow: number = 100,
  offsetPerWorkflow: number = 0,
  groupByStep: boolean = false
): Promise<AllMasterTableDataResponse> {
  return await apiClient.get<AllMasterTableDataResponse>(
    API_ENDPOINTS.dynamicWorkflows.getAllMasterTableData(),
    { params: { company_id: companyId, ... } }
  )
}
```

### 4. Component Usage

**File**: `components/erp-company-list.tsx`

Components use service methods:

```typescript
const loadMasterRecords = async () => {
  const response = await dynamicWorkflowAPI.getAllMasterTableData()
  // Process response
  setMasterRecords(allRecords)
}
```

---

## Authentication Flow

### Login Process

1. **User submits credentials** → `components/erp-login-form.tsx`

2. **Login API call** → `lib/api-services.ts`
   ```typescript
   const response = await authAPI.login({ username, password })
   ```

3. **Backend validates** → `/auth/token` endpoint

4. **Token received** → Stored in localStorage
   ```typescript
   localStorage.setItem("auth_token", response.access_token)
   ```

5. **User state updated** → `lib/erp-auth-context.tsx`
   ```typescript
   setUser(currentUser)
   ```

### Request Authentication

1. **Component makes API call** → Service method

2. **HTTP client interceptor** → Adds token
   ```typescript
   headers: {
     "Authorization": `Bearer ${token}`
   }
   ```

3. **Backend validates token** → Returns data or error

4. **Response handled** → Success or error handling

### Logout Process

1. **User clicks logout** → `lib/erp-auth-context.tsx`

2. **Logout API call** → `/auth/logout`

3. **Token cleared** → `localStorage.removeItem("auth_token")`

4. **User redirected** → Login page

---

## Data Flow

### Company Data Flow

```
Backend Script
  ↓ Creates workflow & inserts data
Backend Database
  ↓ Stores in master table
GET /workflows/builder/table-data/all
  ↓ Returns all records
Frontend Service Layer
  ↓ dynamicWorkflowAPI.getAllMasterTableData()
Frontend Component
  ↓ erp-company-list.tsx
UI Display
  ↓ Shows companies in grid
```

### Workflow Data Flow

```
Backend API
  ↓ GET /workflows/builder/
Frontend Service
  ↓ dynamicWorkflowAPI.listWorkflows()
Frontend Component
  ↓ workflow-management.tsx
UI Display
  ↓ Shows workflow cards
```

---

## Integration Points

### 1. Workflow Builder API

**Backend Endpoint**: `/workflows/builder/*`

**Frontend Service**: `lib/api/services/dynamic-workflow-api.service.ts`

**Used In**:
- `components/erp-company-list.tsx` - Get all master records
- `components/erp-dashboard.tsx` - Get company statistics
- `components/workflow-management.tsx` - List/create workflows
- `components/workflow-data-view-page.tsx` - View workflow data

**Key Methods**:
```typescript
getAllMasterTableData()    // Get all companies from all workflows
listWorkflows()            // Get all workflows
getWorkflow()              // Get specific workflow
createWorkflow()           // Create new workflow
getTableData()             // Get workflow records
```

### 2. Authentication API

**Backend Endpoint**: `/auth/token`, `/auth/logout`

**Frontend Service**: `lib/api-services.ts`

**Used In**:
- `components/erp-login-form.tsx` - Login
- `lib/erp-auth-context.tsx` - Auth state management

**Key Methods**:
```typescript
authAPI.login()    // Authenticate user
authAPI.logout()   // Logout user
```

### 3. User Management API

**Backend Endpoint**: `/api/users`

**Frontend Service**: `lib/api-services.ts`

**Used In**:
- `components/erp-dashboard.tsx` - User statistics
- `components/erp-user-management.tsx` - User management

**Key Methods**:
```typescript
userAPI.getAllUsers()    // Get all users
```

---

## Common Patterns

### Pattern 1: Fetching Data on Mount

```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true)
      const data = await apiService.getData()
      setData(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  loadData()
}, [])
```

**Example**: `components/erp-company-list.tsx` - `loadMasterRecords()`

### Pattern 2: Error Handling

```typescript
try {
  const response = await apiService.getData()
  // Process response
} catch (error: any) {
  if (error.response?.status === 401) {
    // Handle authentication error
    localStorage.removeItem("auth_token")
    window.location.href = "/"
  } else {
    // Handle other errors
    setError(error.message)
  }
}
```

**Example**: `components/erp-company-list.tsx` - Error handling

### Pattern 3: Token Check Before API Call

```typescript
useEffect(() => {
  const token = localStorage.getItem("auth_token")
  if (!token) {
    setError("Not authenticated")
    window.location.href = "/"
    return
  }
  loadData()
}, [])
```

**Example**: `components/erp-company-list.tsx` - Pre-flight check

---

## Error Handling

### Authentication Errors

**Status**: 401, 403

**Handling**:
```typescript
if (error.response?.status === 401 || error.response?.status === 403) {
  const errorDetail = error.response?.data?.detail || ""
  if (errorDetail.includes("token") || errorDetail.includes("Not authenticated")) {
    localStorage.removeItem("auth_token")
    window.location.href = "/"
  }
}
```

**Location**: `lib/api/http-client.ts` - Response interceptor

### Network Errors

**Handling**:
```typescript
catch (error: any) {
  if (error.code === "NETWORK_ERROR") {
    setError("Network error. Please check your connection.")
  }
}
```

### API Errors

**Handling**:
```typescript
catch (error: any) {
  const message = error.response?.data?.detail || error.message
  setError(message)
}
```

---

## Adding New API Integration

### Step 1: Add Endpoint to Config

**File**: `lib/api/config.ts`

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  newFeature: {
    getData: () => "/new-feature/data",
    createData: () => "/new-feature/data",
  },
}
```

### Step 2: Create Service Method

**File**: `lib/api/services/new-feature-api.service.ts`

```typescript
import { apiClient } from "../http-client"
import { API_ENDPOINTS } from "../config"

export const newFeatureAPI = {
  async getData(): Promise<DataResponse> {
    return await apiClient.get<DataResponse>(
      API_ENDPOINTS.newFeature.getData()
    )
  },
}
```

### Step 3: Use in Component

**File**: `components/new-feature.tsx`

```typescript
import { newFeatureAPI } from "@/lib/api/services/new-feature-api.service"

const loadData = async () => {
  try {
    const data = await newFeatureAPI.getData()
    setData(data)
  } catch (error) {
    setError(error.message)
  }
}
```

---

## Testing Integration

### Manual Testing

1. **Start Backend**:
   ```bash
   cd erp_r-main
   uvicorn main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend/multi-company-rbac
   npm run dev
   ```

3. **Test Login**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Login with admin/admin
   - Verify token is received

4. **Test API Calls**:
   - Navigate to Companies page
   - Check Network tab for API calls
   - Verify responses

### Using curl

```bash
# Get token
TOKEN=$(curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin" | jq -r '.access_token')

# Test API call
curl -X GET "http://localhost:8000/workflows/builder/table-data/all" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Issues and Solutions

### Issue: CORS Errors

**Solution**: Backend must allow frontend origin in CORS configuration

### Issue: Token Not Sent

**Solution**: Check HTTP client interceptor is adding token

### Issue: Wrong Endpoint URL

**Solution**: Verify `buildUrl()` method handles endpoint correctly

### Issue: Data Not Loading

**Solution**: 
1. Check Network tab for actual request
2. Verify backend endpoint exists
3. Check response format matches expected type

---

## Related Documentation

- [API Endpoints Reference](./API_ENDPOINTS_REFERENCE.md)
- [Configuration Guide](./CONFIGURATION_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [Workflow Builder Integration](./WORKFLOW_BUILDER_INTEGRATION.md)

