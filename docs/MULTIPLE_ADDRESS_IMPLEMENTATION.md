# Multiple Address Support Implementation

## Overview

This document describes the complete implementation of multiple address support for the Company Onboarding workflow. The implementation allows companies to have multiple addresses while maintaining full backward compatibility with existing single-address functionality.

**Implementation Date:** January 2026  
**Status:** ✅ Complete and Tested


## Table of Contents

1. [Features](#features)
2. [Architecture Overview](#architecture-overview)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Response Format](#api-response-format)
6. [Issues Faced and Solutions](#issues-faced-and-solutions)
7. [Testing Guide](#testing-guide)
8. [Backward Compatibility](#backward-compatibility)


## Features

### Implemented Features

1. **Multiple Address Creation**
   - Users can add multiple addresses during company creation
   - Each address is stored independently in the `company_address` domain table
   - Address validation is bypassed as per requirements

2. **Multiple Address Display**
   - View mode: Table format showing all addresses
   - Edit mode: Interactive table with add/edit/delete functionality
   - Read-only mode: Clean table view in view pages

3. **Backend Support**
   - API accepts array-indexed address fields (`address_0_*`, `address_1_*`, etc.)
   - Multiple addresses are inserted using transaction savepoints
   - API response includes `steps[].records` array for multiple addresses

4. **Backward Compatibility**
   - Single address from `step.fields` still works
   - Existing companies with single addresses continue to function
   - Non-address steps unaffected


## Architecture Overview

### Data Flow

```
Frontend (AddressStepTable)
    ↓
Formats addresses as: address_0_address_line_1, address_1_city, etc.
    ↓
POST /workflows/builder/{workflow_id}/table-data
    ↓
Backend (dynamic_workflow_service.py)
    ↓
Separates address fields → Direct insertion into company_address table
    ↓
Returns: domain_tables.company_address = [address1, address2, ...]
    ↓
GET /workflows/builder/{workflow_id}/table-data/{record_id}
    ↓
Returns: steps[].records = [address1, address2, ...]
    ↓
Frontend (View Components)
    ↓
Renders table with all addresses
```

### Key Components

**Backend:**
- `erp_r/services/v1/dynamic_workflow_service.py`
  - `_is_address_field()` - Detects address fields
  - `_parse_array_indexed_field()` - Parses array-indexed field names
  - `_insert_addresses_direct()` - Inserts multiple addresses with savepoints
  - `_get_domain_table_data()` - Retrieves all address records

**Frontend:**
- `multi-company-rbac/components/address-step-table.tsx` - Main address management component
- `multi-company-rbac/components/dynamic-company-wizard.tsx` - Wizard integration
- `multi-company-rbac/components/workflow-data-view-page.tsx` - View page component
- `multi-company-rbac/components/enhanced-company-crud-view.tsx` - CRUD view component


## Backend Implementation

### 1. Address Field Detection

**File:** `erp_r/services/v1/dynamic_workflow_service.py`

**Method:** `_is_address_field(key: str) -> bool`

Detects if a field belongs to an address step:
- Array-indexed format: `address_0_*`, `address_1_*`, etc.
- Direct format: `address_line_1`, `city`, `pincode`, etc.

```python
def _is_address_field(self, key: str) -> bool:
    """Check if a field key belongs to an address"""
    key_lower = key.lower()
    address_keywords = [
        'address_line_1', 'address_line_2', 'city', 'state_province',
        'pincode', 'county', 'address_country', 'delivery', 'document',
        'pay', 'visit'
    ]
    # Check array-indexed format: address_0_city
    if key_lower.startswith('address_') and any(kw in key_lower for kw in address_keywords):
        return True
    # Check direct format: city, address_line_1, etc.
    return any(kw in key_lower for kw in address_keywords)
```

### 2. Array-Indexed Field Parsing

**Method:** `_parse_array_indexed_field(key: str) -> Optional[Tuple[str, int, str]]`

Parses array-indexed field names:
- Input: `address_0_city`
- Output: `("address", 0, "city")`

### 3. Multiple Address Insertion

**Method:** `_insert_addresses_direct(...) -> List[Dict[str, Any]]`

**Key Features:**
- Groups array-indexed fields by index (`address_0_*`, `address_1_*`)
- Maps field names to database column UUIDs
- Uses **transaction savepoints** (`db.begin_nested()`) for each address
- Ensures partial failures don't prevent other addresses from being saved

**Transaction Management:**
```python
for address_index, address_fields in grouped_addresses.items():
    savepoint = self.db.begin_nested()  # Create savepoint
    try:
        # Insert address
        # ...
        savepoint.commit()  # Commit savepoint
    except Exception as e:
        savepoint.rollback()  # Rollback only this address
        # Log error, continue with next address
```

### 4. Address Field Separation (Critical Fix)

**Method:** `create_table_record()`

**Issue:** Array-indexed address fields were being filtered out during general field validation.

**Solution:** Moved address field separation to occur **BEFORE** general field mapping:

```python
# STEP 1: Separate address fields FIRST (before validation)
address_data_raw = {}
non_address_data_raw = {}

for key, value in data.items():
    if self._is_address_field(key):
        address_data_raw[key] = value
    else:
        non_address_data_raw[key] = value

# STEP 2: Process non-address fields through normal validation
validated_data = self._validate_and_map_fields(non_address_data_raw)

# STEP 3: Process address fields directly (bypass validation)
if address_data_raw:
    address_records = self._insert_addresses_direct(address_data_raw)
```

### 5. GET Endpoint Enhancement

**Method:** `_get_domain_table_data()`

**Changes:**
- Collects **ALL** records for address domain tables (not just first one)
- Stores addresses as arrays: `company_data_map[company_id][table_name] = [record1, record2, ...]`
- Formats response with `steps[].records` array for address steps

**Response Format:**
```json
{
  "steps": [
    {
      "step_name": "Address",
      "fields": {...},  // Backward compatibility - first address
      "records": [      // NEW - all addresses
        {
          "address_line_1": {"value": "..."},
          "city": {"value": "..."},
          ...
        },
        {...}
      ]
    }
  ]
}
```


## Frontend Implementation

### 1. AddressStepTable Component

**File:** `multi-company-rbac/components/address-step-table.tsx`

**Purpose:** Dedicated component for managing multiple addresses

**Features:**
- Add new addresses
- Edit existing addresses
- Delete addresses
- Inline validation
- Table view for multiple addresses
- Card view for first address (when no addresses exist)

**Key State Management:**
```typescript
const [addresses, setAddresses] = useState<CompanyAddress[]>(initialAddresses)

// Sync with parent component
useEffect(() => {
  if (onAddressesChange) {
    onAddressesChange(addresses)
  }
}, [addresses, onAddressesChange])

// Sync with prop changes (critical for loading addresses)
useEffect(() => {
  // Deep comparison to detect changes
  const currentStr = JSON.stringify(addresses.map(a => a.id).sort())
  const newStr = JSON.stringify((initialAddresses || []).map(a => a.id).sort())
  
  if (currentStr !== newStr) {
    setAddresses(initialAddresses || [])
  }
}, [initialAddresses])
```

### 2. DynamicCompanyWizard Integration

**File:** `multi-company-rbac/components/dynamic-company-wizard.tsx`

**Address Loading Logic (Priority Order):**

1. **Priority 1:** `domain_tables.company_address` (array or object)
2. **Priority 2A:** `steps[].records` array (NEW FORMAT)
3. **Priority 2B:** `steps[].fields` object (backward compatibility)
4. **Priority 3:** Flat structure (backward compatibility)

**Key Implementation:**
```typescript
// Priority 2A: Check steps[].records array (NEW FORMAT)
if (Array.isArray(addressStep.records) && addressStep.records.length > 0) {
  addressStep.records.forEach((record: any, idx: number) => {
    const extractFieldValue = (fieldKey: string) => {
      // Handle nested structure: { field_key: { value: "..." } }
      const fieldObj = record[fieldKey]
      if (fieldObj && typeof fieldObj === 'object' && 'value' in fieldObj) {
        return fieldObj.value
      }
      return record[fieldKey] || null
    }
    
    loadedAddresses.push({
      id: record.id,
      address_line_1: extractFieldValue('address_line_1'),
      city: extractFieldValue('city'),
      // ... other fields
    })
  })
}
```

**Address Formatting for Submission:**
```typescript
// Format addresses as array-indexed fields
addresses.forEach((address, index) => {
  completeData[`address_${index}_address_line_1`] = address.address_line_1
  completeData[`address_${index}_city`] = address.city
  // ... all fields, even if empty
})
```

### 3. View Page Components

**Files:**
- `workflow-data-view-page.tsx`
- `enhanced-company-crud-view.tsx`

**Implementation:**
```typescript
// Check if address step with records array
const isAddressStep = step.step_name?.toLowerCase().includes("address") || step.step_order === 2
const hasRecords = Array.isArray(step.records) && step.records.length > 0

if (isAddressStep && hasRecords) {
  // Render table with all addresses
  return (
    <Table>
      <TableHeader>...</TableHeader>
      <TableBody>
        {step.records.map((record, index) => (
          <TableRow key={record.id || `address-${index}`}>
            {/* Extract and display address fields */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} else {
  // Fallback to fields grid (backward compatibility)
  return <FieldsGrid step={step} />
}
```


## API Response Format

### POST Response (Create/Update)

```json
{
  "id": "...",
  "workflow_id": "...",
  "company_id": "...",
  "domain_tables": {
    "company_address": [
      {
        "id": "...",
        "address_line_1": "Address 1",
        "city": "City 1",
        ...
      },
      {
        "id": "...",
        "address_line_1": "Address 2",
        "city": "City 2",
        ...
      }
    ]
  },
  "address_count": 2
}
```

### GET Response (View)

```json
{
  "id": "...",
  "workflow_id": "...",
  "company_id": "...",
  "steps": [
    {
      "step_id": "...",
      "step_name": "Address",
      "step_order": 2,
      "fields": {
        "address_line_1": {
          "field_id": "...",
          "field_label": "Address Line 1",
          "value": "Address 1"
        },
        ...
      },
      "records": [
        {
          "id": "...",
          "address_line_1": {
            "field_id": "...",
            "value": "Address 1"
          },
          "city": {
            "field_id": "...",
            "value": "City 1"
          },
          ...
        },
        {
          "id": "...",
          "address_line_1": {
            "field_id": "...",
            "value": "Address 2"
          },
          ...
        }
      ]
    }
  ]
}
```

**Key Points:**
- `fields` object: Contains first address (backward compatibility)
- `records` array: Contains ALL addresses (new format)
- Field values are nested objects with `value` property


## Issues Faced and Solutions

### Issue 1: Array-Indexed Fields Being Filtered Out

**Problem:**
- Array-indexed address fields (`address_0_city`, `address_1_address_line_1`) were being removed during general field validation
- Fields didn't match workflow field UUIDs, so they were added to `unmapped_fields` and dropped

**Root Cause:**
- Address field separation happened **AFTER** general field mapping
- By the time address fields were checked, they were already filtered out

**Solution:**
- Moved address field separation to occur **BEFORE** general field validation
- Address fields are now preserved and processed separately

**Code Location:**
- `erp_r/services/v1/dynamic_workflow_service.py` - `create_table_record()` method


### Issue 2: Only First Address Being Inserted

**Problem:**
- Frontend sent multiple addresses (`address_0_*`, `address_1_*`, `address_2_*`)
- Backend only inserted the first address

**Root Cause:**
- Transaction rollback on error was preventing subsequent addresses from being inserted
- Field mapping issues for array-indexed fields

**Solution:**
1. **Transaction Savepoints:** Use `db.begin_nested()` for each address insertion
2. **Early Field Separation:** Separate address fields before validation
3. **Robust Field Mapping:** Enhanced fuzzy matching for field names

**Code Location:**
- `erp_r/services/v1/dynamic_workflow_service.py` - `_insert_addresses_direct()` method


### Issue 3: Frontend Not Showing Multiple Address UI

**Problem:**
- AddressStepTable component was not rendering
- UI showed single address form instead of table

**Root Cause:**
1. Component not integrated into wizard
2. Address step detection logic missing
3. Conditional rendering not implemented

**Solution:**
1. Integrated `AddressStepTable` into `DynamicCompanyWizard`
2. Added address step detection: `step.name.includes("address") || step.order === 2`
3. Conditional rendering for both wizard and tabs view modes

**Code Location:**
- `multi-company-rbac/components/dynamic-company-wizard.tsx`


### Issue 4: Validation Errors for Address Fields

**Problem:**
- Validation errors for `City`, `Pincode` even when filled
- Address validation was not being bypassed

**Root Cause:**
- `validate_table_data()` method didn't detect address fields
- Array-indexed fields weren't recognized

**Solution:**
1. Added address field detection to `validate_table_data()`
2. Added array-indexed field parsing
3. Bypassed required field validation for address fields
4. Excluded address fields from "unknown fields" check

**Code Location:**
- `erp_r/services/v1/dynamic_workflow_service.py` - `validate_table_data()` method


### Issue 5: Addresses Not Loading in View Mode

**Problem:**
- API response had `steps[].records` array with 2 addresses
- View page only showed single address from `step.fields`

**Root Cause:**
- View components (`WorkflowDataViewPage`, `EnhancedCompanyCRUDView`) only checked `step.fields`
- Didn't check for `step.records` array

**Solution:**
1. Added logic to detect address steps
2. Check for `step.records` array first
3. Render table format when multiple addresses exist
4. Fall back to `step.fields` for backward compatibility

**Code Location:**
- `multi-company-rbac/components/workflow-data-view-page.tsx`
- `multi-company-rbac/components/enhanced-company-crud-view.tsx`


### Issue 6: AddressStepTable Not Syncing with Prop Changes

**Problem:**
- Addresses loaded from API but AddressStepTable didn't update
- useEffect not triggering when addresses prop changed

**Root Cause:**
- useEffect only checked `initialAddresses.length > 0`
- Array reference equality issues
- Timing: addresses loaded after component mount

**Solution:**
1. Enhanced useEffect with deep comparison (ID-based)
2. Always sync when prop changes (even empty arrays)
3. Added key prop to force re-render when addresses change
4. Create new array reference: `setAddresses([...loadedAddresses])`

**Code Location:**
- `multi-company-rbac/components/address-step-table.tsx` - useEffect hooks
- `multi-company-rbac/components/dynamic-company-wizard.tsx` - setAddresses calls


### Issue 7: Hydration Error - Table Row in Div

**Problem:**
- Error: `In HTML, <tr> cannot be a child of <div>`
- AddressEditRow always rendered `<tr>`, but was placed in `<div>` when no addresses existed

**Root Cause:**
- When adding first address, `AddressEditRow` (table row) was rendered outside table structure

**Solution:**
- Created `AddressEditForm` component (Card-based) for first address
- `AddressEditRow` only used when addresses exist (inside TableBody)

**Code Location:**
- `multi-company-rbac/components/address-step-table.tsx`


## Testing Guide

### 1. Create Company with Multiple Addresses

**Steps:**
1. Navigate to Company Creation
2. Fill General Information step
3. Go to Address step
4. Click "Add Address"
5. Fill address 1 details
6. Click "Add Address" again
7. Fill address 2 details
8. Submit all steps

**Expected Result:**
- Both addresses saved successfully
- API response shows `address_count: 2`
- `domain_tables.company_address` contains array with 2 addresses

### 2. View Company with Multiple Addresses

**Steps:**
1. Open existing company with multiple addresses
2. Navigate to Address tab
3. Verify table displays all addresses

**Expected Result:**
- Table shows all addresses in rows
- Each address displays: Address Line 1, City, State, Pincode, Country, Type flags
- Console logs show: `Rendering X address(es) in table format`

### 3. Edit Company with Multiple Addresses

**Steps:**
1. Open company in edit mode
2. Navigate to Address step
3. Verify AddressStepTable shows all addresses
4. Edit an address
5. Add a new address
6. Delete an address
7. Save changes

**Expected Result:**
- All addresses displayed in table
- Edit/Add/Delete functionality works
- Changes saved correctly

### 4. Backward Compatibility Test

**Steps:**
1. Open company with single address (old format)
2. Verify it displays correctly
3. Verify it can be edited

**Expected Result:**
- Single address displays in table (1 row)
- Edit functionality works
- No errors or warnings

### 5. API Response Verification

**Check POST Response:**
```bash
POST /workflows/builder/{workflow_id}/table-data
```
- Verify `domain_tables.company_address` is an array
- Verify `address_count` matches number of addresses

**Check GET Response:**
```bash
GET /workflows/builder/{workflow_id}/table-data/{record_id}
```
- Verify `steps[].records` array exists for Address step
- Verify all addresses are in the array
- Verify `step.fields` contains first address (backward compatibility)


## Backward Compatibility

### ✅ Maintained Compatibility

1. **Single Address Format:**
   - Companies with single address in `step.fields` still work
   - View pages display single address correctly
   - Edit functionality preserved

2. **API Response:**
   - `step.fields` object always present (contains first address)
   - `step.records` array added for multiple addresses
   - Existing API consumers can use `step.fields` without changes

3. **Non-Address Steps:**
   - All other workflow steps unaffected
   - No changes to General Information, Communication, Accounting steps

4. **Database Schema:**
   - No schema changes required
   - Uses existing `company_address` domain table
   - Multiple records per company supported

### Migration Notes

**No migration required:**
- Existing companies continue to work
- New companies can use multiple addresses
- Old and new formats coexist

**Optional Enhancement:**
- Can migrate existing single addresses to `records` array format
- Not required for functionality


## File Changes Summary

### Backend Files Modified

1. **`erp_r/services/v1/dynamic_workflow_service.py`**
   - Added `_is_address_field()` method
   - Added `_parse_array_indexed_field()` method
   - Enhanced `_create_address_field_mapping()` method
   - Modified `_insert_addresses_direct()` with savepoints
   - Modified `create_table_record()` - moved address separation earlier
   - Modified `validate_table_data()` - bypass address validation
   - Modified `_get_domain_table_data()` - collect all address records
   - Modified `get_table_record()` - include records array in response

### Frontend Files Modified

1. **`multi-company-rbac/components/address-step-table.tsx`** (NEW)
   - Complete address management component
   - Table view for multiple addresses
   - Add/Edit/Delete functionality

2. **`multi-company-rbac/components/dynamic-company-wizard.tsx`**
   - Integrated AddressStepTable
   - Added address loading logic (Priority 1-3)
   - Added address formatting for submission
   - Enhanced address step detection

3. **`multi-company-rbac/components/workflow-data-view-page.tsx`**
   - Added table rendering for multiple addresses
   - Added address step detection
   - Added field value extraction logic

4. **`multi-company-rbac/components/enhanced-company-crud-view.tsx`**
   - Added table rendering for multiple addresses (view mode)
   - Added address step detection
   - Preserved edit mode functionality

5. **`multi-company-rbac/components/ui/table.tsx`** (NEW)
   - Shadcn UI Table component


## API Endpoints

### Create/Update Company

**Endpoint:** `POST /workflows/builder/{workflow_id}/table-data`

**Request Format:**
```json
{
  "company_name": "Test Company",
  "address_0_address_line_1": "Address 1",
  "address_0_city": "City 1",
  "address_0_pincode": "12345",
  "address_1_address_line_1": "Address 2",
  "address_1_city": "City 2",
  "address_1_pincode": "67890",
  ...
}
```

**Response Format:**
```json
{
  "domain_tables": {
    "company_address": [
      { "id": "...", "address_line_1": "Address 1", ... },
      { "id": "...", "address_line_1": "Address 2", ... }
    ]
  },
  "address_count": 2
}
```

### Get Company Data

**Endpoint:** `GET /workflows/builder/{workflow_id}/table-data/{record_id}`

**Response Format:**
```json
{
  "steps": [
    {
      "step_name": "Address",
      "fields": {...},  // First address (backward compatibility)
      "records": [      // All addresses (new format)
        {...},
        {...}
      ]
    }
  ]
}
```


## Debugging Tips

### Backend Debugging

**Enable Debug Logging:**
- Check console for `DEBUG:` prefixed logs
- Look for address field separation logs
- Check address insertion logs

**Common Issues:**
1. **No addresses inserted:**
   - Check if address fields are being separated correctly
   - Verify array-indexed fields are not filtered out
   - Check transaction savepoint logs

2. **Only first address inserted:**
   - Verify all address indices are being parsed
   - Check for exceptions in address insertion loop
   - Verify savepoints are working correctly

### Frontend Debugging

**Enable Console Logging:**
- Check browser console for `🔍` prefixed logs
- Look for address loading logs
- Check AddressStepTable sync logs

**Common Issues:**
1. **Addresses not loading:**
   - Check Priority 1-3 logs
   - Verify API response has `steps[].records` array
   - Check AddressStepTable useEffect logs

2. **Table not showing:**
   - Verify `addresses.length > 0`
   - Check address step detection
   - Verify conditional rendering logic


## Performance Considerations

### Backend

1. **Transaction Savepoints:**
   - Each address insertion uses a savepoint
   - Minimal performance impact
   - Ensures data integrity

2. **Query Optimization:**
   - Batch queries for multiple addresses
   - Indexed lookups on `company_id`

### Frontend

1. **State Management:**
   - Addresses stored in component state
   - Efficient re-renders with proper keys
   - Memoization where applicable

2. **Rendering:**
   - Table renders only when addresses exist
   - Conditional rendering prevents unnecessary renders


## Future Enhancements

### Potential Improvements

1. **Address Validation:**
   - Add client-side validation rules
   - Custom validation per address type

2. **Address Types:**
   - Support for different address types (Billing, Shipping, etc.)
   - Type-based filtering and display

3. **Bulk Operations:**
   - Import addresses from CSV
   - Export addresses to CSV

4. **Address Templates:**
   - Save common addresses as templates
   - Quick address insertion from templates


## Conclusion

The multiple address support implementation is complete and fully functional. The solution:

✅ Supports multiple addresses per company  
✅ Maintains full backward compatibility  
✅ Provides intuitive UI for address management  
✅ Handles edge cases and errors gracefully  
✅ Includes comprehensive logging for debugging  

All existing functionality continues to work, and new companies can take advantage of multiple address support.


## Related Documentation

- [BYPASS_VALIDATION_MULTIPLE_ADDRESSES.md](../BYPASS_VALIDATION_MULTIPLE_ADDRESSES%201.md) - Original requirements document
- [Dynamic Workflow Service Documentation](../../erp_r/docs/workflow-management/) - Backend service documentation
- [AddressStepTable Component](../components/address-step-table.tsx) - Component source code


**Last Updated:** January 6, 2026  
**Version:** 1.0.0

