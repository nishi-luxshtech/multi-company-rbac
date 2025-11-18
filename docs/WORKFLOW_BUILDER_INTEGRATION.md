# Workflow Builder API Integration

## ✅ Integration Complete

The frontend is fully integrated with the Workflow Builder API endpoints. The script has successfully created a workflow and inserted sample data.

## 📊 Created Data

**Workflow Created:**
- **Workflow ID**: `7d49bfea-3007-4068-9ce7-9c2393546544`
- **Workflow Name**: "Standard Company Onboarding"
- **Total Steps**: 9
- **Total Fields**: 54

**Sample Company Data:**
- **Record ID**: `fb4580e2-afc8-492d-8ce1-3aa9395d2f0b`
- **Company ID**: 4
- **Company Name**: "Acme Corporation"
- **Company Code**: "ACME001"

## 🔌 API Endpoints Used

### 1. Get All Master Table Records
**Endpoint**: `GET /workflows/builder/table-data/all`

**Used in:**
- `erp-company-list.tsx` - Displays all companies from all workflows
- `erp-dashboard.tsx` - Shows company statistics and recent companies
- `erp-user-management.tsx` - Lists companies for user assignment

**Parameters:**
- `company_id` (optional): Filter by specific company
- `limit_per_workflow` (default: 100): Max records per workflow
- `offset_per_workflow` (default: 0): Pagination offset
- `group_by_step` (default: false): Organize fields by step

**Response Structure:**
```typescript
{
  total_workflows: number
  workflows_with_tables: number
  total_records_across_all_workflows: number
  workflow_data: {
    [workflow_id: string]: {
      workflow_id: string
      workflow_name: string
      table_name: string
      total_records: number
      records: Array<{
        id: string
        company_id: number
        company_name: string
        company_code: string
        // ... all workflow fields
      }>
    }
  }
}
```

### 2. Get Workflow Table Data
**Endpoint**: `GET /workflows/builder/{workflow_id}/table-data`

**Used in:**
- `workflow-data-view-page.tsx` - View detailed workflow data

### 3. Create Workflow
**Endpoint**: `POST /workflows/builder/`

**Used in:**
- `workflow-management.tsx` - Create new workflows

### 4. Create Table Record
**Endpoint**: `POST /workflows/builder/{workflow_id}/table-data`

**Used in:**
- `erp-onboarding-wizard.tsx` - Insert company data during onboarding

## 📁 Frontend Components Integration

### ✅ Integrated Components

1. **ERP Company List** (`components/erp-company-list.tsx`)
   - Fetches all master records from all workflows
   - Displays companies in a grid layout
   - Shows workflow name, company details, and status
   - Supports search and filtering

2. **ERP Dashboard** (`components/erp-dashboard.tsx`)
   - Loads company statistics from master table data
   - Shows total companies, completed, in progress
   - Displays recent companies

3. **ERP User Management** (`components/erp-user-management.tsx`)
   - Loads companies for user assignment dropdowns
   - Fetches from master table data

4. **Workflow Data View Page** (`components/workflow-data-view-page.tsx`)
   - Displays detailed workflow record data
   - Shows data organized by workflow steps

5. **Workflow Management** (`components/workflow-management.tsx`)
   - Creates and manages workflows
   - Lists all available workflows

## 🔧 API Service Layer

### Dynamic Workflow API Service
**File**: `lib/api/services/dynamic-workflow-api.service.ts`

**Key Methods:**
```typescript
// Get all master table records from all workflows
dynamicWorkflowAPI.getAllMasterTableData(
  companyId?: number,
  limitPerWorkflow?: number,
  offsetPerWorkflow?: number,
  groupByStep?: boolean
): Promise<AllMasterTableDataResponse>

// Get table data for specific workflow
dynamicWorkflowAPI.getTableData(
  workflowId: string,
  companyId?: number,
  limit?: number,
  offset?: number,
  groupByStep?: boolean
): Promise<WorkflowTableDataResponse>

// Create workflow
dynamicWorkflowAPI.createWorkflow(
  data: DynamicWorkflowCreate
): Promise<DynamicWorkflowResponse>
```

## 🎯 Data Flow

1. **Backend Script** (`scripts/create_workflow_and_insert_data.py`)
   - Creates workflow with 9 steps and 54 fields
   - Inserts sample company data
   - Returns workflow ID and record ID

2. **Frontend Components**
   - Call `getAllMasterTableData()` on mount
   - Flatten records from all workflows
   - Display in UI with proper formatting

3. **Data Mapping**
   - Records are mapped to `MasterRecord` interface
   - Fields extracted: `company_name`, `company_code`, `country`, etc.
   - Completion status determined from field presence

## 🚀 Testing

To verify the integration:

1. **Run the script:**
   ```bash
   cd erp_r-main
   python3 scripts/create_workflow_and_insert_data.py
   ```

2. **Check API endpoint:**
   ```bash
   curl -X GET "http://localhost:8000/workflows/builder/table-data/all" \
     -H "Authorization: Bearer <token>"
   ```

3. **View in frontend:**
   - Navigate to Companies page
   - Should see "Acme Corporation" listed
   - Dashboard should show 1 company
   - User management should show company in dropdown

## 📝 Notes

- All data is fetched from the server (no localStorage)
- Components handle errors gracefully
- Loading states are properly managed
- Search and filtering work on master records
- Workflow name is displayed with each company record

## 🔄 Next Steps

To add more companies:
1. Run the script again with different company_id
2. Or use the onboarding wizard in the frontend
3. Data will automatically appear in all integrated components

