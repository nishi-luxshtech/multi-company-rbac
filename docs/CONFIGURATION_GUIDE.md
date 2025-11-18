# Configuration Guide

Complete guide for configuring the frontend application, including API endpoints, environment variables, and troubleshooting.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [API Configuration](#api-configuration)
3. [Changing Backend URL](#changing-backend-url)
4. [Authentication Configuration](#authentication-configuration)
5. [Troubleshooting](#troubleshooting)

---

## Environment Variables

### Required Environment Variables

Create a `.env.local` file in the frontend root directory (`frontend/multi-company-rbac/`):

```bash
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# API Version (optional, defaults to v1)
NEXT_PUBLIC_API_VERSION=v1
```

### Environment Variable Locations

**Development**: `.env.local` (not committed to git)
**Production**: Set in your hosting platform (Vercel, Netlify, etc.)

### Loading Environment Variables

Environment variables are automatically loaded by Next.js. They must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

**Location**: `lib/api/config.ts`

```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  timeout: 30000,
}
```

---

## API Configuration

### Base URL Configuration

**File**: `lib/api/config.ts`

```typescript
export const API_CONFIG = {
  // Backend server URL
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  
  // API version for versioned endpoints
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  
  // Request timeout in milliseconds
  timeout: 30000, // 30 seconds
}
```

### Endpoint Configuration

**File**: `lib/api/config.ts`

```typescript
export const API_ENDPOINTS = {
  // Authentication endpoints (root level)
  auth: {
    login: "/auth/token",
    logout: "/auth/logout",
  },
  
  // Workflow builder endpoints (root level)
  dynamicWorkflows: {
    getAllMasterTableData: () => "/workflows/builder/table-data/all",
    // ... other endpoints
  },
}
```

### URL Construction Rules

The HTTP client automatically constructs URLs based on endpoint patterns:

**Root Level Endpoints** (no `/api/v1/` prefix):
- `/auth/*` - Authentication
- `/workflows/builder/*` - Workflow builder
- `/workflows/*` - Workflows

**Versioned Endpoints** (with `/api/v1/` prefix):
- `/api/users` - User management
- `/api/companies` - Company management
- All other endpoints

**Location**: `lib/api/http-client.ts` - `buildUrl()` method

---

## Changing Backend URL

### Method 1: Environment Variable (Recommended)

1. Create or edit `.env.local` in the frontend root:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://your-backend-url:8000
   ```

2. Restart the Next.js development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Verify the change:
   - Open browser DevTools
   - Check Network tab
   - Verify requests go to new URL

### Method 2: Direct Configuration

1. Edit `lib/api/config.ts`:
   ```typescript
   export const API_CONFIG = {
     baseURL: "http://your-backend-url:8000", // Change this
     apiVersion: "v1",
     timeout: 30000,
   }
   ```

2. Restart the development server

### Method 3: Runtime Configuration (Advanced)

For dynamic configuration, modify `lib/api/config.ts`:

```typescript
// Get from window object (set in HTML)
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return (window as any).__API_BASE_URL__ || 
           process.env.NEXT_PUBLIC_API_BASE_URL || 
           "http://localhost:8000"
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
}

export const API_CONFIG = {
  baseURL: getBaseURL(),
  apiVersion: "v1",
  timeout: 30000,
}
```

---

## Authentication Configuration

### Token Storage

**Location**: `localStorage`

**Key**: `auth_token`

**Storage**:
```typescript
// On login
localStorage.setItem("auth_token", response.access_token)

// On logout
localStorage.removeItem("auth_token")
```

**Location**: `lib/erp-auth-context.tsx`

### Token Usage

The HTTP client automatically adds the token to all requests:

```typescript
// Automatic token injection
headers: {
  "Authorization": `Bearer ${token}`
}
```

**Location**: `lib/api/http-client.ts` - Request interceptor

### Token Validation

The app checks for token on component mount:

```typescript
useEffect(() => {
  const token = localStorage.getItem("auth_token")
  if (!token) {
    // Redirect to login
  }
}, [])
```

**Location**: `components/erp-company-list.tsx`

---

## Troubleshooting

### Issue: API calls fail with "Network Error"

**Possible Causes**:
1. Backend server is not running
2. Incorrect baseURL configuration
3. CORS issues
4. Network connectivity problems

**Solutions**:
1. Verify backend is running:
   ```bash
   curl http://localhost:8000/
   ```

2. Check baseURL in browser console:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
   ```

3. Check Network tab in DevTools for actual request URL

4. Verify CORS configuration in backend

### Issue: "Not authenticated" errors

**Possible Causes**:
1. Token not stored in localStorage
2. Token expired
3. Token not sent with requests
4. Backend authentication endpoint issue

**Solutions**:
1. Check token in browser console:
   ```javascript
   localStorage.getItem("auth_token")
   ```

2. Try logging in again

3. Check Network tab - verify `Authorization` header is present

4. Verify `/auth/token` endpoint is accessible

### Issue: 404 errors on API calls

**Possible Causes**:
1. Incorrect endpoint URL
2. Endpoint doesn't exist in backend
3. URL construction issue

**Solutions**:
1. Check actual request URL in Network tab

2. Verify endpoint exists in backend:
   ```bash
   curl -X GET "http://localhost:8000/workflows/builder/" \
     -H "Authorization: Bearer TOKEN"
   ```

3. Check `buildUrl()` method in `lib/api/http-client.ts`

4. Verify endpoint configuration in `lib/api/config.ts`

### Issue: CORS errors

**Error Message**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solutions**:
1. Verify backend CORS configuration allows frontend origin

2. Check backend CORS middleware:
   ```python
   # Backend should allow frontend origin
   allow_origins=["http://localhost:3000", "http://your-frontend-url"]
   ```

3. For development, backend should allow all origins:
   ```python
   allow_origins=["*"]
   ```

### Issue: Timeout errors

**Error Message**: "Request timeout"

**Solutions**:
1. Increase timeout in `lib/api/config.ts`:
   ```typescript
   timeout: 60000, // 60 seconds
   ```

2. Check backend server performance

3. Verify network connectivity

4. Check if backend is processing long-running requests

### Issue: Environment variables not loading

**Solutions**:
1. Ensure variables are prefixed with `NEXT_PUBLIC_`

2. Restart the development server after changing `.env.local`

3. Verify `.env.local` is in the correct location (frontend root)

4. Check Next.js documentation for environment variable loading

---

## Development Setup

### Initial Setup

1. Install dependencies:
   ```bash
   cd frontend/multi-company-rbac
   npm install
   ```

2. Create `.env.local`:
   ```bash
   echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Verify backend is running:
   ```bash
   curl http://localhost:8000/
   ```

### Production Setup

1. Set environment variables in hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Other: Follow platform documentation

2. Build the application:
   ```bash
   npm run build
   ```

3. Start production server:
   ```bash
   npm start
   ```

---

## Configuration Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `lib/api/config.ts` | API configuration | Frontend root |
| `lib/api/http-client.ts` | HTTP client with interceptors | Frontend root |
| `lib/api-services.ts` | API service methods | Frontend root |
| `lib/erp-auth-context.tsx` | Authentication context | Frontend root |
| `.env.local` | Environment variables | Frontend root (not in git) |

---

## Best Practices

1. **Always use environment variables** for configuration
2. **Never commit** `.env.local` to git
3. **Use TypeScript** for type safety
4. **Check Network tab** in DevTools for debugging
5. **Verify backend is running** before testing frontend
6. **Use proper error handling** in all API calls
7. **Log API requests** for debugging (check console)

---

## Related Documentation

- [API Endpoints Reference](./API_ENDPOINTS_REFERENCE.md)
- [Workflow Builder Integration](./WORKFLOW_BUILDER_INTEGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
  

