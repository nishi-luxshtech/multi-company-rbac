# Troubleshooting Guide

Complete troubleshooting guide for common issues in the frontend application.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [API Connection Issues](#api-connection-issues)
3. [Data Loading Issues](#data-loading-issues)
4. [Configuration Issues](#configuration-issues)
5. [Build and Deployment Issues](#build-and-deployment-issues)

---

## Authentication Issues

### Issue: "Not authenticated" Error

**Symptoms**:
- Error message: "Not authenticated"
- Redirected to login page
- Cannot access protected routes

**Possible Causes**:
1. Token not stored in localStorage
2. Token expired
3. Token not sent with requests
4. Backend authentication endpoint issue

**Solutions**:

1. **Check if token exists**:
   ```javascript
   // In browser console
   localStorage.getItem("auth_token")
   ```
   - If `null`, you need to log in
   - If token exists, check if it's valid

2. **Try logging in again**:
   - Go to login page
   - Enter credentials (admin/admin)
   - Check Network tab for `/auth/token` request
   - Verify response contains `access_token`

3. **Check token is being sent**:
   - Open DevTools → Network tab
   - Make an API request
   - Check request headers for `Authorization: Bearer <token>`
   - If missing, check HTTP client interceptor

4. **Verify backend endpoint**:
   ```bash
   curl -X POST "http://localhost:8000/auth/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=admin"
   ```

**Location**: `lib/api/http-client.ts`, `lib/erp-auth-context.tsx`

---

### Issue: "Invalid token" Error

**Symptoms**:
- Error message: "Invalid token" or "Token expired"
- API calls fail with 401/403

**Solutions**:

1. **Clear token and login again**:
   ```javascript
   localStorage.removeItem("auth_token")
   localStorage.removeItem("user")
   // Then login again
   ```

2. **Check token format**:
   - Token should be a JWT string
   - Should start with `eyJ...`

3. **Verify backend token validation**:
   - Check backend logs
   - Verify JWT secret is correct

**Location**: `lib/api/http-client.ts` - Response interceptor

---

### Issue: Login Fails

**Symptoms**:
- Login form shows error
- Cannot authenticate

**Solutions**:

1. **Check backend is running**:
   ```bash
   curl http://localhost:8000/
   ```

2. **Verify credentials**:
   - Default: username=`admin`, password=`admin`
   - Check backend user database

3. **Check Network tab**:
   - Verify request goes to `/auth/token` (not `/api/v1/auth/token`)
   - Check response status and error message

4. **Verify endpoint URL**:
   - Should be `/auth/token` (root level)
   - Check `lib/api/http-client.ts` - `buildUrl()` method

**Location**: `components/erp-login-form.tsx`, `lib/api-services.ts`

---

## API Connection Issues

### Issue: Network Error

**Symptoms**:
- Error message: "Network error. Please check your connection."
- API calls fail

**Solutions**:

1. **Verify backend is running**:
   ```bash
   # Check if backend responds
   curl http://localhost:8000/
   ```

2. **Check baseURL configuration**:
   ```typescript
   // In browser console
   console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
   ```
   - Should match backend URL
   - Default: `http://localhost:8000`

3. **Check Network tab**:
   - See actual request URL
   - Check if request is being made
   - Look for CORS errors

4. **Verify firewall/network**:
   - Check if port 8000 is accessible
   - Verify no firewall blocking

**Location**: `lib/api/config.ts`, `lib/api/http-client.ts`

---

### Issue: CORS Errors

**Symptoms**:
- Error: "Access to XMLHttpRequest has been blocked by CORS policy"
- Requests fail in browser console

**Solutions**:

1. **Check backend CORS configuration**:
   ```python
   # Backend should allow frontend origin
   allow_origins=["http://localhost:3000"]
   ```

2. **For development, allow all origins**:
   ```python
   allow_origins=["*"]
   ```

3. **Verify frontend URL**:
   - Default: `http://localhost:3000`
   - Should match backend CORS allowed origins

4. **Check preflight requests**:
   - Look for OPTIONS requests in Network tab
   - Should return 200 OK

**Location**: Backend CORS middleware

---

### Issue: 404 Errors

**Symptoms**:
- API calls return 404 Not Found
- Endpoint not found

**Solutions**:

1. **Check actual request URL**:
   - Open Network tab
   - See what URL is being requested
   - Verify it matches backend endpoint

2. **Verify endpoint exists in backend**:
   ```bash
   # Check backend routes
   curl http://localhost:8000/docs  # OpenAPI docs
   ```

3. **Check URL construction**:
   - Verify `buildUrl()` method in `lib/api/http-client.ts`
   - Check if endpoint needs `/api/v1/` prefix

4. **Verify endpoint configuration**:
   - Check `lib/api/config.ts`
   - Ensure endpoint path is correct

**Location**: `lib/api/http-client.ts` - `buildUrl()` method

---

## Data Loading Issues

### Issue: Companies Not Showing

**Symptoms**:
- Companies page is empty
- No data displayed

**Solutions**:

1. **Check API response**:
   - Open Network tab
   - Find `/workflows/builder/table-data/all` request
   - Check response data
   - Verify `workflow_data` contains records

2. **Verify workflow has data**:
   ```bash
   # Run the script to create workflow and data
   cd erp_r-main
   python3 scripts/create_workflow_and_insert_data.py
   ```

3. **Check console logs**:
   - Look for "Loading master table records..."
   - Check for errors in console
   - Verify data processing logs

4. **Verify data structure**:
   - Response should have `workflow_data` object
   - Each workflow should have `records` array
   - Records should have `company_name`, `company_code`, etc.

**Location**: `components/erp-company-list.tsx` - `loadMasterRecords()`

---

### Issue: Workflows Not Loading

**Symptoms**:
- Workflow management page shows error
- No workflows displayed

**Solutions**:

1. **Check API response**:
   - Network tab → `/workflows/builder/` request
   - Verify response is array of workflows

2. **Check error message**:
   - If "Invalid token", login again
   - If "Not authenticated", check token

3. **Verify workflows exist**:
   ```bash
   curl -X GET "http://localhost:8000/workflows/builder/" \
     -H "Authorization: Bearer TOKEN"
   ```

4. **Check fallback to localStorage**:
   - Component may use localStorage as fallback
   - Check if workflows are in localStorage

**Location**: `components/workflow-management.tsx` - `loadWorkflows()`

---

## Configuration Issues

### Issue: Environment Variables Not Loading

**Symptoms**:
- API calls use wrong URL
- Environment variables are undefined

**Solutions**:

1. **Verify variable name**:
   - Must start with `NEXT_PUBLIC_`
   - Example: `NEXT_PUBLIC_API_BASE_URL`

2. **Check file location**:
   - `.env.local` should be in frontend root
   - Path: `frontend/multi-company-rbac/.env.local`

3. **Restart development server**:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

4. **Verify in code**:
   ```typescript
   console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
   ```

**Location**: `lib/api/config.ts`

---

### Issue: Wrong Backend URL

**Symptoms**:
- API calls go to wrong server
- Connection errors

**Solutions**:

1. **Check environment variable**:
   ```bash
   # In .env.local
   NEXT_PUBLIC_API_BASE_URL=http://correct-url:8000
   ```

2. **Check config file**:
   ```typescript
   // lib/api/config.ts
   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
   ```

3. **Restart server**:
   ```bash
   npm run dev
   ```

4. **Verify in Network tab**:
   - Check actual request URLs
   - Should match configured baseURL

**Location**: `lib/api/config.ts`

---

## Build and Deployment Issues

### Issue: Build Fails

**Symptoms**:
- `npm run build` fails
- TypeScript errors

**Solutions**:

1. **Check TypeScript errors**:
   ```bash
   npm run type-check
   ```

2. **Fix import errors**:
   - Verify all imports are correct
   - Check file paths

3. **Check for missing dependencies**:
   ```bash
   npm install
   ```

4. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

---

### Issue: Production API Calls Fail

**Symptoms**:
- Works in development, fails in production
- API calls return errors

**Solutions**:

1. **Set environment variables in production**:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Other: Follow platform docs

2. **Verify baseURL in production**:
   - Should be production backend URL
   - Not `http://localhost:8000`

3. **Check CORS in production**:
   - Backend must allow production frontend URL
   - Update CORS configuration

4. **Check network connectivity**:
   - Verify production backend is accessible
   - Check firewall rules

---

## Debugging Tips

### 1. Enable Console Logging

**In components**:
```typescript
console.log("Loading data...")
const response = await apiService.getData()
console.log("Response:", response)
```

### 2. Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Check request/response details

### 3. Check localStorage

```javascript
// In browser console
localStorage.getItem("auth_token")
localStorage.getItem("user")
```

### 4. Test API with curl

```bash
# Get token
TOKEN=$(curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin" | jq -r '.access_token')

# Test endpoint
curl -X GET "http://localhost:8000/workflows/builder/table-data/all" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Check Backend Logs

```bash
# Backend should show request logs
# Check for errors in backend console
```

---

## Quick Reference

### Common Commands

```bash
# Start backend
cd erp_r-main
uvicorn main:app --reload

# Start frontend
cd frontend/multi-company-rbac
npm run dev

# Create workflow and data
cd erp_r-main
python3 scripts/create_workflow_and_insert_data.py

# Check backend health
curl http://localhost:8000/
```

### Common Checks

1. ✅ Backend is running
2. ✅ Frontend is running
3. ✅ Token exists in localStorage
4. ✅ baseURL is correct
5. ✅ CORS is configured
6. ✅ Network tab shows requests
7. ✅ No console errors

---

## Getting Help

If issues persist:

1. **Check logs**:
   - Browser console
   - Network tab
   - Backend logs

2. **Verify setup**:
   - Follow setup guide
   - Check all dependencies installed

3. **Review documentation**:
   - [API Endpoints Reference](./API_ENDPOINTS_REFERENCE.md)
   - [Configuration Guide](./CONFIGURATION_GUIDE.md)
   - [Backend Frontend Integration](./BACKEND_FRONTEND_INTEGRATION.md)

---

## Related Documentation

- [API Endpoints Reference](./API_ENDPOINTS_REFERENCE.md)
- [Configuration Guide](./CONFIGURATION_GUIDE.md)
- [Backend Frontend Integration](./BACKEND_FRONTEND_INTEGRATION.md)
- [Workflow Builder Integration](./WORKFLOW_BUILDER_INTEGRATION.md)

