# Frontend-Backend API Integration Guide

This document provides a comprehensive overview of all API endpoints used in the frontend codebase and how they integrate with the backend FastAPI server.

## Table of Contents

1. [API Configuration](#api-configuration)
2. [Authentication & Authorization](#authentication--authorization)
3. [Dynamic Workflow Builder APIs](#dynamic-workflow-builder-apis)
4. [Workflow Instance APIs](#workflow-instance-apis)
5. [Company Management APIs](#company-management-apis)
6. [User Management APIs](#user-management-apis)
7. [Health Check APIs](#health-check-apis)
8. [HTTP Client Architecture](#http-client-architecture)
9. [Error Handling](#error-handling)
10. [Integration Patterns](#integration-patterns)

---

## API Configuration

### Base Configuration

**Location:** `lib/api/config.ts`

```typescript
{
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  apiVersion: "v1",
  timeout: 30000 // 30 seconds
}
```

### URL Structure

The frontend uses different URL patterns based on endpoint type:

- **Auth endpoints**: `/auth/*` (no `/api/v1` prefix)
- **Workflow Builder endpoints**: `/workflows/builder/*` (no `/api/v1` prefix)
- **Workflow Instance endpoints**: `/workflows/instances/*` (no `/api/v1` prefix)
- **Standard API endpoints**: `/api/v1/*` (with prefix)
- **Health endpoints**: `/api/health` (with `/api` prefix)

---

## Authentication & Authorization

### Endpoints

#### 1. Login (OAuth2 Password Flow)

**Endpoint:** `POST /auth/token`

**Frontend Service:** `lib/api-services.ts` → `authAPI.login()`

**Request:**
```typescript
{
  username: string
  password: string
}
```

**Response:**
```typescript
{
  access_token: string
  token_type: "bearer"
}
```

**Usage:**
- Used in login forms to authenticate users
- Token is stored in `localStorage` as `auth_token`
- Token is automatically added to all subsequent requests via HTTP client interceptor

**Backend Route:** `api/auth_routes.py` or `api/v1/auth_routes.py`

---

#### 2. Logout

**Endpoint:** `POST /auth/logout`

**Frontend Service:** `lib/api-services.ts` → `authAPI.logout()`

**Request:** Requires Bearer token in Authorization header

**Response:**
```typescript
{
  success: boolean
  message: string
}
```

**Usage:**
- Invalidates the current session token
- Clears token from localStorage
- Redirects user to login page

**Backend Route:** `api/auth_routes.py` or `api/v1/auth_routes.py`

---

## Dynamic Workflow Builder APIs

### Service Location

**Primary Service:** `lib/api/services/dynamic-workflow-api.service.ts`

**Bridge Service:** `lib/api/services/workflow-bridge.service.ts` (maps API types to frontend types)

### Endpoints

#### 1. Create Dynamic Workflow

**Endpoint:** `POST /workflows/builder/`

**Frontend Method:** `dynamicWorkflowAPI.createWorkflow(data)`

**Request Body:**
```typescript
{
  name: string
  description?: string
  generate_table: boolean
  table_name?: string
  steps: Array<{
    name: string
    order: number
    description?: string
    fields: Array<{
      name: string
      label: string
      type: FieldType
      order: number
      required: boolean
      placeholder?: string
      validation?: ValidationRule
    }>
  }>
}
```

**Response:** `DynamicWorkflowResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `create_dynamic_workflow()`

**Usage:**
- Creating new dynamic workflows with automatic table generation
- Used in workflow builder UI

---

#### 2. List All Dynamic Workflows

**Endpoint:** `GET /workflows/builder/?active_only=true`

**Frontend Method:** `dynamicWorkflowAPI.listWorkflows(activeOnly)`

**Query Parameters:**
- `active_only` (boolean): Filter only active workflows

**Response:** `DynamicWorkflowResponse[]`

**Backend Route:** `api/v1/workflow_builder.py` → `list_workflows()`

**Usage:**
- Displaying list of available workflows
- Workflow selection dropdowns

---

#### 3. Get Workflow by ID

**Endpoint:** `GET /workflows/builder/{workflow_id}`

**Frontend Method:** `dynamicWorkflowAPI.getWorkflow(id)`

**Response:** `DynamicWorkflowResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `get_workflow()`

**Usage:**
- Loading workflow details for editing
- Displaying workflow structure in UI

---

#### 4. Update Workflow

**Endpoint:** `PUT /workflows/builder/{workflow_id}`

**Frontend Method:** `dynamicWorkflowAPI.updateWorkflow(id, data)`

**Request Body:** Partial `DynamicWorkflowCreate`

**Response:** `DynamicWorkflowResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `update_workflow()`

**Usage:**
- Updating workflow structure, steps, or fields
- Workflow builder edit mode

---

#### 5. Delete Workflow

**Endpoint:** `DELETE /workflows/builder/{workflow_id}`

**Frontend Method:** `dynamicWorkflowAPI.deleteWorkflow(id)`

**Response:** `void`

**Backend Route:** `api/v1/workflow_builder.py` → `delete_workflow()`

**Usage:**
- Removing workflows from the system

---

#### 6. Get Table Schema

**Endpoint:** `GET /workflows/builder/{workflow_id}/table-schema`

**Frontend Method:** `dynamicWorkflowAPI.getTableSchema(id)`

**Response:** `TableSchemaResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `get_table_schema()`

**Usage:**
- Inspecting generated database table structure
- Debugging table generation issues

---

#### 7. Migrate Workflow Table

**Endpoint:** `PUT /workflows/builder/{workflow_id}/migrate`

**Frontend Method:** `dynamicWorkflowAPI.migrateWorkflow(id, data)`

**Request Body:**
```typescript
{
  migration_type: "add_fields" | "remove_fields" | "modify_fields"
  changes: Array<FieldChange>
}
```

**Response:** `WorkflowMigrationResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `migrate_workflow_table()`

**Usage:**
- Migrating existing workflow tables when structure changes
- Adding/removing fields without data loss

---

#### 8. Regenerate Table

**Endpoint:** `POST /workflows/builder/{workflow_id}/regenerate-table?force_recreate=false`

**Frontend Method:** `dynamicWorkflowAPI.regenerateTable(id, forceRecreate)`

**Query Parameters:**
- `force_recreate` (boolean): Force table recreation even if it exists

**Response:** `TableSchemaResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `regenerate_workflow_table()`

**Usage:**
- Regenerating database tables after workflow changes
- Force recreating tables (destructive operation)

---

#### 9. Get Table Data

**Endpoint:** `GET /workflows/builder/{workflow_id}/table-data`

**Frontend Method:** `dynamicWorkflowAPI.getTableData(id, companyId, limit, offset, groupByStep)`

**Query Parameters:**
- `company_id` (number, optional): Filter by company
- `limit` (number, default: 100): Pagination limit
- `offset` (number, default: 0): Pagination offset
- `group_by_step` (boolean, default: false): Group data by workflow steps

**Response:** `WorkflowTableDataResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `get_table_data()`

**Usage:**
- Displaying workflow data records
- Company-specific data views
- Paginated data tables

---

#### 10. Get All Master Table Data

**Endpoint:** `GET /workflows/builder/table-data/all`

**Frontend Method:** `dynamicWorkflowAPI.getAllMasterTableData(companyId, limitPerWorkflow, offsetPerWorkflow, groupByStep)`

**Query Parameters:**
- `company_id` (number, optional): Filter by company
- `limit_per_workflow` (number, default: 100): Records per workflow
- `offset_per_workflow` (number, default: 0): Offset per workflow
- `group_by_step` (boolean, default: false): Group by steps

**Response:** `AllMasterTableDataResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `get_all_master_table_data()`

**Usage:**
- Aggregating data from all workflows
- Company dashboard views
- Cross-workflow reporting

---

#### 11. Create Table Record

**Endpoint:** `POST /workflows/builder/{workflow_id}/table-data`

**Frontend Method:** `dynamicWorkflowAPI.createTableRecord(id, data)`

**Request Body:**
```typescript
{
  company_id: number
  [field_name: string]: any // Dynamic fields based on workflow structure
}
```

**Response:** Created record object

**Backend Route:** `api/v1/workflow_builder.py` → `create_table_record()`

**Usage:**
- Creating new records in workflow master tables
- Company onboarding wizards
- Form submissions

**Field Name Mapping:**
- Frontend sends field names in snake_case (e.g., `state_province`, `default_payment_terms_days`)
- Backend maps these to UUID column names in the database
- Mapping is handled automatically by the service layer

---

#### 12. Validate Table Data

**Endpoint:** `POST /workflows/builder/{workflow_id}/table-data/validate?is_update=false`

**Frontend Method:** `dynamicWorkflowAPI.validateTableData(id, data, isUpdate)`

**Query Parameters:**
- `is_update` (boolean, default: false): If true, required fields are optional

**Request Body:**
```typescript
{
  company_id: number
  [field_name: string]: any
}
```

**Response:**
```typescript
{
  workflow_id: string
  is_valid: boolean
  total_fields: number
  validated_fields: number
  errors: Array<{
    field_name: string
    field_label: string
    field_type: string
    error_message: string
    provided_value: any
  }>
  warnings: string[]
  missing_required_fields: string[]
  invalid_field_types: string[]
  validation_summary: {
    total_fields_in_workflow: number
    fields_provided: number
    fields_validated: number
    required_fields_missing: number
    validation_errors: number
    warnings: number
    unknown_fields: string[]
  }
}
```

**Backend Route:** `api/v1/workflow_builder.py` → `validate_table_data()`

**Usage:**
- Validating form data before submission
- Frontend validation feedback
- Step-by-step validation in wizards

**Integration Pattern:**
1. Frontend performs client-side validation first
2. After all steps are validated, calls this API with complete data
3. If validation fails, errors are mapped back to form fields
4. User fixes errors and resubmits

---

#### 13. Delete Table Record

**Endpoint:** `DELETE /workflows/builder/{workflow_id}/table-data/{record_id}`

**Frontend Method:** Not currently implemented in frontend service (backend supports it)

**Backend Route:** `api/v1/workflow_builder.py` → `delete_table_record()`

---

#### 14. Delete Workflow Table

**Endpoint:** `DELETE /workflows/builder/{workflow_id}/table?confirm_deletion=true`

**Frontend Method:** `dynamicWorkflowAPI.deleteTable(id)`

**Query Parameters:**
- `confirm_deletion` (boolean, must be true): Confirmation flag

**Response:** `void`

**Backend Route:** `api/v1/workflow_builder.py` → `delete_workflow_table()`

**Usage:**
- Removing workflow tables (destructive operation)
- Cleanup during workflow deletion

---

#### 15. Validate Workflow Structure

**Endpoint:** `GET /workflows/builder/{workflow_id}/validation`

**Frontend Method:** `dynamicWorkflowAPI.validateWorkflow(id)`

**Response:** `WorkflowBuilderValidationResponse`

**Backend Route:** `api/v1/workflow_builder.py` → `validate_workflow_structure()`

**Usage:**
- Validating workflow structure integrity
- Checking table compatibility
- Pre-deployment validation

---

## Workflow Instance APIs

### Service Location

**Service:** `lib/api/services/workflow-instance-api.service.ts`

### Endpoints

#### 1. Create Workflow Instance

**Endpoint:** `POST /workflows/instances`

**Frontend Method:** `workflowInstanceAPI.createInstance(data)`

**Request Body:**
```typescript
{
  workflow_id: string
  company_id: number
  initial_data?: Record<string, any>
}
```

**Response:** `WorkflowInstanceResponse`

**Backend Route:** `api/v1/company_workflow_integration.py` → `create_company_with_workflow()`

**Usage:**
- Starting a workflow execution for a company
- Company onboarding initiation

---

#### 2. Get Workflow Instance

**Endpoint:** `GET /workflows/instances/{instance_id}`

**Frontend Method:** `workflowInstanceAPI.getInstance(id)`

**Response:** `WorkflowInstanceResponse`

**Backend Route:** `api/v1/company_workflow_integration.py` → `get_company_workflow_progress()`

**Usage:**
- Loading workflow instance details
- Resuming workflow execution

---

#### 3. Get Company Workflow Instances

**Endpoint:** `GET /workflows/companies/{company_id}/instances`

**Frontend Method:** `workflowInstanceAPI.getCompanyInstances(companyId)`

**Response:** `WorkflowInstanceResponse[]`

**Backend Route:** `api/v1/company_workflow_integration.py` → `get_company_workflow_progress()`

**Usage:**
- Listing all workflow instances for a company
- Company dashboard views

---

#### 4. Submit Step Data

**Endpoint:** `POST /workflows/instances/{instance_id}/submit-step`

**Frontend Method:** `workflowInstanceAPI.submitStepData(instanceId, data)`

**Request Body:**
```typescript
{
  step_id: string
  field_data: Record<string, any>
}
```

**Response:** `StepSubmitResponse`

**Backend Route:** `api/v1/company_workflow_integration.py` → `submit_workflow_step()`

**Usage:**
- Submitting data for a workflow step
- Progressing through workflow steps

---

## Company Management APIs

### Service Location

**Service:** `lib/api-services.ts` → `companyAPI`

### Endpoints

#### 1. Get All Companies

**Endpoint:** `GET /api/v1/companies?limit=100&offset=0&full_data=true`

**Frontend Method:** `companyAPI.getAllCompanies(limit, offset, fullData)`

**Query Parameters:**
- `limit` (number, default: 100): Pagination limit
- `offset` (number, default: 0): Pagination offset
- `full_data` (boolean, default: true): Include related data

**Response:**
```typescript
{
  results: Company[]
  total_count: number
  limit: number
  offset: number
  has_more: boolean
}
```

**Backend Route:** `api/v1/routes.py` → Company endpoints (if exists)

**Usage:**
- Company listing pages
- Paginated company tables

---

#### 2. Get Company by ID

**Endpoint:** `GET /api/v1/companies/{company_id}`

**Frontend Method:** `companyAPI.getCompanyById(companyId)`

**Response:** `Company`

**Usage:**
- Company detail pages
- Loading company information

---

#### 3. Create Company

**Endpoint:** `POST /api/v1/companies`

**Frontend Method:** `companyAPI.createCompany(companyData)`

**Request Body:** Partial `Company`

**Response:** `Company`

**Usage:**
- Creating new companies
- Company registration forms

---

#### 4. Update Company

**Endpoint:** `PUT /api/v1/companies/{company_id}`

**Frontend Method:** `companyAPI.updateCompany(companyId, companyData)`

**Request Body:** Partial `Company`

**Response:** `Company`

**Usage:**
- Editing company information
- Company profile updates

---

#### 5. Delete Company

**Endpoint:** `DELETE /api/v1/companies/{company_id}`

**Frontend Method:** `companyAPI.deleteCompany(companyId)`

**Response:** `void`

**Usage:**
- Removing companies from the system

---

#### 6. Search Companies

**Endpoint:** `GET /api/v1/companies/find?search={query}&limit=100&offset=0`

**Frontend Method:** `companyAPI.searchCompanies(search, limit, offset)`

**Query Parameters:**
- `search` (string): Search query
- `limit` (number, default: 100)
- `offset` (number, default: 0)

**Response:** `CompanyListResponse`

**Usage:**
- Company search functionality
- Filtering companies by name/code

---

### Company Sub-resources

#### Addresses

**Base Endpoint:** `/api/v1/companies/{company_id}/addresses`

- `POST` - Add address: `addressAPI.addAddress(companyId, addressData)`
- `PUT /{address_id}` - Update address: `addressAPI.updateAddress(companyId, addressId, addressData)`
- `DELETE /{address_id}` - Delete address: `addressAPI.deleteAddress(companyId, addressId)`

#### Communication Methods

**Base Endpoint:** `/api/v1/companies/{company_id}/comm-methods`

- `POST` - Add communication method: `communicationAPI.addCommMethod(companyId, commData)`
- `PUT /{comm_id}` - Update communication method: `communicationAPI.updateCommMethod(companyId, commId, commData)`
- `DELETE /{comm_id}` - Delete communication method: `communicationAPI.deleteCommMethod(companyId, commId)`

#### Employees

**Base Endpoint:** `/api/v1/companies/{company_id}/employees`

- `POST` - Add employee: `employeeAPI.addEmployee(companyId, employeeData)`
- `PUT /{employee_id}` - Update employee: `employeeAPI.updateEmployee(companyId, employeeId, employeeData)`
- `DELETE /{employee_id}` - Delete employee: `employeeAPI.deleteEmployee(companyId, employeeId)`

---

## User Management APIs

### Service Location

**Service:** `lib/api-services.ts` → `userAPI`

### Endpoints

#### 1. Get All Users

**Endpoint:** `GET /api/v1/users`

**Frontend Method:** `userAPI.getAllUsers()`

**Response:** `User[]`

**Usage:**
- User management pages
- User listing

---

#### 2. Get User by ID

**Endpoint:** `GET /api/v1/users/{user_id}`

**Frontend Method:** `userAPI.getUserById(userId)`

**Response:** `User`

**Usage:**
- User detail pages
- User profile views

---

#### 3. Create User

**Endpoint:** `POST /api/v1/users`

**Frontend Method:** `userAPI.createUser(userData)`

**Request Body:**
```typescript
{
  username: string
  password: string
  role: "user" | "admin"
  permissions?: string[]
}
```

**Response:** `User`

**Usage:**
- User registration
- Admin user creation

---

#### 4. Update User

**Endpoint:** `PUT /api/v1/users/{user_id}`

**Frontend Method:** `userAPI.updateUser(userId, userData)`

**Request Body:** Partial user data

**Response:** `User`

**Usage:**
- Editing user information
- Updating user roles/permissions

---

#### 5. Delete User

**Endpoint:** `DELETE /api/v1/users/{user_id}`

**Frontend Method:** `userAPI.deleteUser(userId)`

**Response:** `void`

**Usage:**
- Removing users from the system

---

## Health Check APIs

### Endpoint

**Endpoint:** `GET /api/health`

**Response:**
```typescript
{
  status: "ok"
}
```

**Usage:**
- Health monitoring
- API availability checks
- Load balancer health checks

**Backend Route:** `api/health.py` → `health()`

---

## HTTP Client Architecture

### Location

**File:** `lib/api/http-client.ts`

### Features

1. **Automatic Authentication**
   - Intercepts all requests
   - Adds `Authorization: Bearer {token}` header
   - Token retrieved from `localStorage.getItem("auth_token")`

2. **Error Handling**
   - Automatic 401/403 handling
   - Token expiration detection
   - Automatic logout and redirect on auth errors
   - Network error handling

3. **URL Building**
   - Automatically builds correct URLs based on endpoint type
   - Handles `/api/v1` prefix for standard endpoints
   - Skips prefix for workflow builder and auth endpoints

4. **Request/Response Interceptors**
   - Request: Adds auth token
   - Response: Handles errors and token expiration

### Usage Example

```typescript
import { apiClient } from "@/lib/api/http-client"

// GET request
const data = await apiClient.get<ResponseType>("/endpoint", {
  params: { key: "value" }
})

// POST request
const result = await apiClient.post<ResponseType>("/endpoint", requestData)

// PUT request
const updated = await apiClient.put<ResponseType>("/endpoint", updateData)

// DELETE request
await apiClient.delete<void>("/endpoint")
```

---

## Error Handling

### Error Structure

```typescript
interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}
```

### Error Types

1. **401 Unauthorized / 403 Forbidden**
   - Token invalid or expired
   - Automatic token clearing
   - Redirect to login page

2. **Network Errors**
   - Connection failures
   - Timeout errors
   - Returns `NETWORK_ERROR` code

3. **Server Errors (4xx/5xx)**
   - Extracts error message from `detail` or `message` field
   - Includes status code and error details

### Error Handling in Components

```typescript
try {
  const result = await dynamicWorkflowAPI.createWorkflow(data)
  // Handle success
} catch (error: any) {
  // error.message contains the error message
  // error.status contains HTTP status code
  // error.details contains full error response
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  })
}
```

---

## Integration Patterns

### 1. Service Layer Pattern

All API calls go through service layers:

```
Component → Service → HTTP Client → Backend API
```

**Example:**
```typescript
// Component
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"

const handleSubmit = async () => {
  const result = await dynamicWorkflowAPI.createTableRecord(workflowId, formData)
}
```

### 2. Type Safety

All API responses are typed using TypeScript interfaces:

```typescript
// Types defined in lib/api/types/
import { DynamicWorkflowResponse } from "@/lib/api/types/dynamic-workflow.types"

const workflow: DynamicWorkflowResponse = await dynamicWorkflowAPI.getWorkflow(id)
```

### 3. Bridge Pattern

Workflow Bridge Service maps between API types and frontend types:

```typescript
import { WorkflowBridgeService } from "@/lib/api/services/workflow-bridge.service"

// Convert API response to frontend format
const frontendWorkflow = WorkflowBridgeService.mapApiToFrontend(apiWorkflow)
```

### 4. Validation Flow

1. **Frontend Validation** (client-side)
   - Uses `lib/validation-utils.ts`
   - Immediate feedback
   - Regex patterns, required fields, type checks

2. **Backend Validation** (server-side)
   - Calls `validateTableData` API before submission
   - Comprehensive validation against workflow structure
   - Returns detailed error messages

3. **Error Mapping**
   - Backend errors mapped to form fields
   - Visual indicators on invalid fields
   - Step-by-step error navigation

### 5. Data Flow Pattern

```
User Input → Form State → Frontend Validation → 
Backend Validation API → Error Mapping → 
Fix Errors → Backend Validation API → 
Success → Create/Update API → Success Response
```

### 6. Field Name Mapping

**Problem:** Frontend uses snake_case field names, backend uses UUID column names

**Solution:** Automatic mapping in service layer

```typescript
// Frontend sends:
{
  state_province: "California",
  default_payment_terms_days: 30
}

// Backend maps to:
{
  "uuid-field-id-1": "California",
  "uuid-field-id-2": 30
}
```

Mapping happens in `erp_r-main/services/v1/dynamic_workflow_service.py` → `create_table_record()`

---

## Environment Variables

### Required

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
```

### Optional

- `NEXT_PUBLIC_API_TIMEOUT` (default: 30000ms)

---

## Best Practices

1. **Always use service methods** - Don't call `apiClient` directly from components
2. **Handle errors gracefully** - Use try/catch and show user-friendly messages
3. **Type all responses** - Use TypeScript interfaces for type safety
4. **Validate before submit** - Use frontend validation first, then backend validation
5. **Handle loading states** - Show loading indicators during API calls
6. **Cache when appropriate** - Cache workflow structures, user data, etc.
7. **Use pagination** - Always paginate large data sets
8. **Handle token expiration** - HTTP client handles this automatically, but be aware

---

## Testing API Integration

### Manual Testing

1. Check browser Network tab for API calls
2. Verify request/response payloads
3. Check for proper authentication headers
4. Verify error handling

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured
2. **401 Errors**: Check token is valid and not expired
3. **404 Errors**: Verify endpoint URL is correct
4. **Field Mapping Errors**: Check field name mapping logic
5. **Validation Errors**: Verify data format matches API expectations

---

## API Documentation References

- Backend API Documentation: `erp_r-main/docs/04-api/`
- Backend API Reference: `erp_r-main/docs/04-api/API_MANUAL_REFERENCE.md`
- V1 API Reference: `erp_r-main/docs/04-api/v1_api_reference.md`

---

## Summary

This frontend integrates with the backend through:

- **15+ Dynamic Workflow Builder endpoints** for workflow and data management
- **4 Workflow Instance endpoints** for workflow execution
- **6+ Company Management endpoints** for company CRUD operations
- **5 User Management endpoints** for user administration
- **2 Authentication endpoints** for login/logout
- **1 Health check endpoint** for monitoring

All endpoints use:
- Bearer token authentication
- TypeScript type safety
- Centralized error handling
- Automatic token management
- Consistent URL patterns

The integration follows RESTful principles with clear separation of concerns through service layers.

