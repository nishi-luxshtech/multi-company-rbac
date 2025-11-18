# API Endpoints Reference

Complete documentation of all API endpoints used in the frontend application.

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Workflow Builder Endpoints](#workflow-builder-endpoints)
3. [Company Management Endpoints](#company-management-endpoints)
4. [User Management Endpoints](#user-management-endpoints)
5. [Configuration](#configuration)
6. [Error Handling](#error-handling)
   
   
## Authentication Endpoints

### Login
**Endpoint**: `POST /auth/token`

**Description**: Authenticate user and receive access token

**Request**:
```typescript
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Usage in Frontend**:
```typescript
import { authAPI } from "@/lib/api-services"

const response = await authAPI.login({ username: "admin", password: "admin" })
localStorage.setItem("auth_token", response.access_token)
```

**Location**: `lib/api-services.ts` - `authAPI.login()`

---

### Logout
**Endpoint**: `POST /auth/logout`

**Description**: Invalidate current access token

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Usage in Frontend**:
```typescript
import { authAPI } from "@/lib/api-services"

await authAPI.logout()
localStorage.removeItem("auth_token")
```

**Location**: `lib/api-services.ts` - `authAPI.logout()`

---

## Workflow Builder Endpoints

### Get All Master Table Records
**Endpoint**: `GET /workflows/builder/table-data/all`

**Description**: Retrieve all master table records from ALL workflows that have dynamic tables

**Query Parameters**:
- `company_id` (optional, integer): Filter records by specific company ID
- `limit_per_workflow` (optional, integer, default: 100): Max records per workflow (1-1000)
- `offset_per_workflow` (optional, integer, default: 0): Pagination offset
- `group_by_step` (optional, boolean, default: false): Organize fields by workflow step

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "total_workflows": 4,
  "workflows_with_tables": 2,
  "total_records_across_all_workflows": 2,
  "workflow_data": {
    "workflow-id-1": {
      "workflow_id": "7d49bfea-3007-4068-9ce7-9c2393546544",
      "workflow_name": "Standard Company Onboarding",
      "table_name": "master_table_data_...",
      "total_records": 1,
      "records": [
        {
          "id": "fb4580e2-afc8-492d-8ce1-3aa9395d2f0b",
          "company_id": 4,
          "company_name": "Acme Corporation",
          "company_code": "ACME001",
          // ... all workflow fields
        }
      ]
    }
  }
}
```

**Usage in Frontend**:
```typescript
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"

const response = await dynamicWorkflowAPI.getAllMasterTableData(
  undefined, // company_id - get all
  100,      // limit_per_workflow
  0,        // offset_per_workflow
  false     // group_by_step
)
```

**Location**: 
- Service: `lib/api/services/dynamic-workflow-api.service.ts` - `getAllMasterTableData()`
- Used in: `components/erp-company-list.tsx`, `components/erp-dashboard.tsx`, `components/erp-user-management.tsx`

---

### List All Workflows
**Endpoint**: `GET /workflows/builder/`

**Description**: Get all dynamic workflows

**Query Parameters**:
- `active_only` (optional, boolean, default: true): Filter only active workflows

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": "7d49bfea-3007-4068-9ce7-9c2393546544",
    "name": "Standard Company Onboarding",
    "description": "Comprehensive 9-step company onboarding process",
    "steps": [...],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

**Usage in Frontend**:
```typescript
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"

const workflows = await dynamicWorkflowAPI.listWorkflows(true)
```

**Location**: 
- Service: `lib/api/services/dynamic-workflow-api.service.ts` - `listWorkflows()`
- Used in: `components/workflow-management.tsx`

---

### Get Workflow by ID
**Endpoint**: `GET /workflows/builder/{workflow_id}`

**Description**: Get specific workflow details

**Path Parameters**:
- `workflow_id` (string, UUID): Workflow identifier

**Request Headers**:
```
Authorization: Bearer <token>
```

**Usage in Frontend**:
```typescript
const workflow = await dynamicWorkflowAPI.getWorkflow(workflowId)
```

---

### Create Workflow
**Endpoint**: `POST /workflows/builder/`

**Description**: Create a new dynamic workflow with automatic table generation

**Request Body**:
```json
{
  "name": "Standard Company Onboarding",
  "description": "Comprehensive 9-step company onboarding process",
  "generate_table": true,
  "table_config": {
    "table_name": "company_onboarding_data"
  },
  "steps": [
    {
      "name": "General Information",
      "description": "Basic company details",
      "order": 1,
      "fields": [...]
    }
  ]
}
```

**Usage in Frontend**:
```typescript
const workflow = await dynamicWorkflowAPI.createWorkflow(workflowData)
```

---

### Get Workflow Table Data
**Endpoint**: `GET /workflows/builder/{workflow_id}/table-data`

**Description**: Get all records from a specific workflow's master table

**Query Parameters**:
- `company_id` (optional, integer): Filter by company ID
- `limit` (optional, integer, default: 100): Max records (1-1000)
- `offset` (optional, integer, default: 0): Pagination offset
- `group_by_step` (optional, boolean, default: false): Organize by step

**Usage in Frontend**:
```typescript
const data = await dynamicWorkflowAPI.getTableData(
  workflowId,
  companyId,
  100,
  0,
  false
)
```

**Location**: 
- Service: `lib/api/services/dynamic-workflow-api.service.ts` - `getTableData()`
- Used in: `components/workflow-data-view-page.tsx`

---

### Create Table Record
**Endpoint**: `POST /workflows/builder/{workflow_id}/table-data`

**Description**: Insert a new record into the workflow's master table

**Request Body**:
```json
{
  "company_id": 4,
  "company_name": "Acme Corporation",
  "company_code": "ACME001",
  // ... all workflow fields
}
```

**Usage in Frontend**:
```typescript
// This is typically done through the onboarding wizard
// See: components/dynamic-company-wizard.tsx
```

---

### Get Table Record
**Endpoint**: `GET /workflows/builder/{workflow_id}/table-data/{record_id}`

**Description**: Get a specific record from the workflow's master table

**Usage in Frontend**:
```typescript
// Used internally by workflow data view page
```

---

## Company Management Endpoints

### Get All Companies
**Endpoint**: `GET /api/companies`

**Note**: This endpoint may not exist in the backend. Companies are fetched from workflow builder master table data instead.

**Current Implementation**: Uses `/workflows/builder/table-data/all` endpoint

**Location**: `components/erp-company-list.tsx` - `loadMasterRecords()`

---

## User Management Endpoints

### Get All Users
**Endpoint**: `GET /api/users`

**Description**: Get list of all users (admin only)

**Request Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "permissions": ["read", "write", "delete"]
  }
]
```

**Usage in Frontend**:
```typescript
import { userAPI } from "@/lib/api-services"

const users = await userAPI.getAllUsers()
```

**Location**: 
- Service: `lib/api-services.ts` - `userAPI.getAllUsers()`
- Used in: `components/erp-dashboard.tsx`, `components/erp-user-management.tsx`

---

## Configuration

### Base URL Configuration

**Location**: `lib/api/config.ts`

```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  timeout: 30000, // 30 seconds
}
```

### How to Change Backend Base URL

#### Option 1: Environment Variable (Recommended)

Create a `.env.local` file in the frontend root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://your-backend-url:8000
```

#### Option 2: Modify Config File

Edit `lib/api/config.ts`:

```typescript
export const API_CONFIG = {
  baseURL: "http://your-backend-url:8000", // Change this
  apiVersion: "v1",
  timeout: 30000,
}
```

**Important**: After changing the base URL, restart the Next.js development server.

---

## Error Handling

### Authentication Errors

**Status Codes**: 401, 403

**Error Messages**:
- "Not authenticated"
- "Invalid token"
- "Token expired"

**Handling**:
- Token is automatically cleared from localStorage
- User is redirected to login page
- Error message is displayed

**Location**: `lib/api/http-client.ts` - Response interceptor

### Network Errors

**Error Message**: "Network error. Please check your connection."

**Handling**:
- Check if backend server is running
- Verify baseURL is correct
- Check network connectivity

### Permission Errors

**Status Code**: 403

**Error Message**: "You don't have permission to view companies."

**Handling**:
- Verify user has required permissions
- Contact administrator

---

## Endpoint URL Construction

The HTTP client automatically constructs URLs based on endpoint patterns:

### Root Level Endpoints (No `/api/v1/` prefix)
- `/auth/*` - Authentication endpoints
- `/workflows/builder/*` - Workflow builder endpoints
- `/workflows/*` - Workflow endpoints

### Versioned Endpoints (With `/api/v1/` prefix)
- `/api/users` - User management
- `/api/companies` - Company management (if exists)
- All other endpoints

**Location**: `lib/api/http-client.ts` - `buildUrl()` method

---

## Complete Endpoint List

| Method | Endpoint | Purpose | Used In |
|--------|----------|---------|---------|
| POST | `/auth/token` | Login | `erp-login-form.tsx` |
| POST | `/auth/logout` | Logout | `erp-auth-context.tsx` |
| GET | `/workflows/builder/` | List workflows | `workflow-management.tsx` |
| POST | `/workflows/builder/` | Create workflow | `workflow-management.tsx` |
| GET | `/workflows/builder/{id}` | Get workflow | Various |
| GET | `/workflows/builder/table-data/all` | Get all master records | `erp-company-list.tsx`, `erp-dashboard.tsx` |
| GET | `/workflows/builder/{id}/table-data` | Get workflow records | `workflow-data-view-page.tsx` |
| POST | `/workflows/builder/{id}/table-data` | Create record | `dynamic-company-wizard.tsx` |
| GET | `/api/users` | Get all users | `erp-dashboard.tsx`, `erp-user-management.tsx` |

---

## Testing Endpoints

### Using curl

```bash
# Login
curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"

# Get all master records (replace TOKEN with actual token)
curl -X GET "http://localhost:8000/workflows/builder/table-data/all" \
  -H "Authorization: Bearer TOKEN"

# Get all workflows
curl -X GET "http://localhost:8000/workflows/builder/" \
  -H "Authorization: Bearer TOKEN"
```

### Using Browser DevTools

1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform action in frontend
4. Check request/response details

---

## Troubleshooting

### Issue: "Not authenticated" error

**Solution**:
1. Check if token exists: `localStorage.getItem("auth_token")`
2. Verify token is being sent in headers
3. Try logging in again
4. Check backend authentication endpoint is accessible

### Issue: 404 errors

**Solution**:
1. Verify endpoint URL is correct
2. Check if endpoint exists in backend
3. Verify baseURL configuration
4. Check network tab for actual request URL

### Issue: CORS errors

**Solution**:
1. Verify backend CORS configuration allows frontend origin
2. Check if backend is running
3. Verify baseURL matches backend URL

### Issue: Timeout errors

**Solution**:
1. Increase timeout in `lib/api/config.ts`
2. Check backend server performance
3. Verify network connectivity

---

## Related Documentation

- [Workflow Builder Integration Guide](./WORKFLOW_BUILDER_INTEGRATION.md)
- [Backend API Documentation](../../erp_r-main/docs/workflow-management/)
- [Configuration Guide](./CONFIGURATION_GUIDE.md)

