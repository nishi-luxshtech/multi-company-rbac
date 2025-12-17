# Troubleshooting Company Creation from Frontend

## Issue

When creating a company from the frontend, you see empty error objects `{}` in the console instead of actual error messages.

## Fixes Applied

### 1. Enhanced Error Logging

**File:** `lib/api/http-client.ts`

- Added safe error serialization to avoid circular reference issues
- Improved error detail extraction
- Better network error detection

**File:** `components/dynamic-company-wizard.tsx`

- Enhanced error message extraction from multiple error structures
- Added priority-based error message extraction:
  1. ApiError message (from http-client)
  2. Axios response.data.detail
  3. response.data.message
  4. response.statusText
  5. error.code

### 2. Better Error Display

The error handling now:
- Safely serializes error objects
- Extracts meaningful error messages
- Shows user-friendly error messages in toast notifications

## How to Debug

### Step 1: Check Browser Console

After the fix, you should now see detailed error information:

```
Final submission error - Raw error: [Error object]
Final submission error - Parsed: {
  message: "...",
  status: 400,
  response: { ... },
  ...
}
```

### Step 2: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try creating a company
4. Look for the POST request to `/workflows/builder/{workflow_id}/table-data`
5. Check:
   - **Status Code** (should be 200 for success, 400/500 for errors)
   - **Response** tab - see the actual error message from backend
   - **Request** tab - verify the payload being sent

### Step 3: Check Backend Logs

Look at the backend console for:
- Any error messages
- SQL errors
- Validation errors
- Domain table creation issues

### Step 4: Common Issues

#### Issue 1: Network Error
**Symptoms:** `ERR_NETWORK` or "Network error"
**Solution:**
- Check if backend server is running
- Check backend URL in frontend config
- Check CORS settings

#### Issue 2: 400 Bad Request
**Symptoms:** Status 400, validation errors
**Solution:**
- Check the error message in Network tab → Response
- Verify all required fields are filled
- Check field name mappings

#### Issue 3: 401/403 Unauthorized
**Symptoms:** Status 401 or 403
**Solution:**
- Check if auth token is valid
- Re-login if token expired
- Check backend authentication

#### Issue 4: 500 Internal Server Error
**Symptoms:** Status 500
**Solution:**
- Check backend logs for detailed error
- Verify database connection
- Check domain tables exist

## Testing the Fix

1. **Open browser console** (F12 → Console tab)
2. **Try creating a company**
3. **Check console logs** - you should now see:
   ```
   Final submission error - Parsed: {
     message: "Actual error message here",
     status: 400,
     response: { ... }
   }
   ```
4. **Check Network tab** - verify the actual HTTP response

## Expected Behavior After Fix

### Success Case
```
✅ Company created successfully
✅ Toast notification: "Company Created Successfully"
✅ Company appears in Company Management page
```

### Error Case
```
❌ Detailed error message in console
❌ Toast notification with specific error message
❌ Error details logged for debugging
```

## Next Steps

1. **Try creating a company again**
2. **Check the console** - you should see detailed error info
3. **Check Network tab** - see the actual HTTP response
4. **Share the error message** - the actual error text will help diagnose the issue

## Common Error Messages

### "Failed to insert into domain table..."
- **Cause:** Domain table missing or column mismatch
- **Fix:** Run domain table creation script or check table schema

### "Network error. Unable to reach the server..."
- **Cause:** Backend server not running or wrong URL
- **Fix:** Start backend server, check API_CONFIG.baseURL

### "Validation error..."
- **Cause:** Required fields missing or invalid data
- **Fix:** Check which fields are failing validation

### "Not authenticated"
- **Cause:** Auth token expired or invalid
- **Fix:** Re-login to get new token

## Files Modified

1. `lib/api/http-client.ts` - Enhanced error handling
2. `components/dynamic-company-wizard.tsx` - Better error extraction

The fixes ensure you'll see actual error messages instead of empty objects!
