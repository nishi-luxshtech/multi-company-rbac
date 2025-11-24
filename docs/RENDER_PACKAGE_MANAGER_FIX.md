# Render Package Manager Configuration Guide

## Problem Overview

When deploying to Render, you may encounter errors related to package manager configuration:

```
ERROR  This project is configured to use npm
For help, run: pnpm help install

ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

This happens when there's a mismatch between:
- Your project's package manager configuration
- Render's auto-detection of package manager
- Missing lockfile files

---

## Understanding the Issue

### Root Causes

1. **Package Manager Lock in `package.json`**
   - The `packageManager` field in `package.json` explicitly locks the project to a specific package manager
   - Example: `"packageManager": "npm@10.0.0"` forces npm usage

2. **Missing Lockfile**
   - `pnpm-lock.yaml` is required when using `--frozen-lockfile` flag
   - `package-lock.json` is required for npm

3. **Render Auto-Detection**
   - Render may auto-detect package manager based on lockfile presence
   - Dashboard settings may override `render.yaml` configuration

4. **Configuration Mismatch**
   - `.npmrc` file may force specific package manager behavior
   - `render.yaml` build commands may not match actual package manager

---

## Step-by-Step Resolution

### Step 1: Identify Your Current Configuration

Check these files to understand your current setup:

#### Check `package.json`
```bash
# Look for packageManager field
cat package.json | grep packageManager
```

**If you see:**
```json
"packageManager": "npm@10.0.0"
```
This locks your project to npm.

#### Check for Lockfiles
```bash
# Check for npm lockfile
ls package-lock.json

# Check for pnpm lockfile
ls pnpm-lock.yaml

# Check for yarn lockfile
ls yarn.lock
```

#### Check `.npmrc` (if exists)
```bash
cat .npmrc
```

Look for lines like:
- `package-lock=true` (forces npm)
- `engine-strict=false`

#### Check `render.yaml`
```bash
cat render.yaml
```

Look at the `buildCommand` - does it use `npm` or `pnpm`?

---

### Step 2: Choose Your Package Manager

Decide which package manager you want to use:

- **npm**: More common, simpler setup
- **pnpm**: Faster, more efficient disk usage
- **yarn**: Alternative option

**For this guide, we'll configure for pnpm** (as Render was trying to use it).

---

### Step 3: Remove npm Enforcement

#### 3.1 Remove `packageManager` field from `package.json`

**Before:**
```json
{
  "name": "my-project",
  "version": "0.1.0",
  "packageManager": "npm@10.0.0",  // ← Remove this line
  "scripts": { ... }
}
```

**After:**
```json
{
  "name": "my-project",
  "version": "0.1.0",
  "scripts": { ... }
}
```

#### 3.2 Remove or Update `.npmrc`

If `.npmrc` exists and contains npm-specific settings:

**Option A: Delete `.npmrc`** (if you're switching to pnpm)
```bash
rm .npmrc
```

**Option B: Update `.npmrc`** (if you want to keep it for other purposes)
Remove lines like:
- `package-lock=true`
- Any npm-specific configurations

#### 3.3 Remove npm Lockfile (if switching to pnpm)

```bash
# Remove npm lockfile
rm package-lock.json
```

**Note:** Only do this if you're fully switching to pnpm. Keep it if you might use npm later.

---

### Step 4: Generate pnpm Lockfile

#### 4.1 Install pnpm (if not already installed)

**Using npm:**
```bash
npm install -g pnpm
```

**Using npx (no global install needed):**
```bash
npx pnpm --version
```

#### 4.2 Generate Lockfile

```bash
# Install dependencies and generate pnpm-lock.yaml
pnpm install
```

**Or using npx:**
```bash
npx pnpm install
```

This will:
- Install all dependencies
- Generate `pnpm-lock.yaml` file
- Create `node_modules` directory

**Expected output:**
```
Packages: +316
Done in 46.3s using pnpm v10.23.0
```

#### 4.3 Verify Lockfile Creation

```bash
ls pnpm-lock.yaml
```

You should see the file exists.

---

### Step 5: Configure `render.yaml`

Update your `render.yaml` file to use pnpm:

```yaml
services:
  - type: web
    name: your-service-name
    env: node
    plan: starter
    buildCommand: pnpm install --frozen-lockfile && pnpm run build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
```

**Key points:**
- `buildCommand`: Uses `pnpm install --frozen-lockfile` (requires lockfile)
- `startCommand`: Uses `pnpm start`
- `--frozen-lockfile`: Ensures exact dependency versions (recommended for production)

**Alternative (if lockfile doesn't exist yet):**
```yaml
buildCommand: pnpm install --no-frozen-lockfile && pnpm run build
```

---

### Step 6: Configure Render Dashboard

**Important:** Render dashboard settings may override `render.yaml`. Verify these settings:

1. **Go to Render Dashboard**
   - Navigate to your service
   - Click on "Settings"

2. **Check Build & Deploy Settings**
   - **Build Command:** Should match `render.yaml` or be:
     ```
     pnpm install --frozen-lockfile && pnpm run build
     ```
   - **Start Command:** Should be:
     ```
     pnpm start
     ```

3. **Check Package Manager Setting**
   - Look for "Package Manager" dropdown
   - Select "pnpm" (or ensure it's not set to "npm")
   - If "Auto-detect" is selected, Render will detect based on lockfiles

4. **Save Changes**

---

### Step 7: Commit and Deploy

#### 7.1 Commit All Changes

```bash
# Add new files
git add pnpm-lock.yaml
git add render.yaml
git add package.json

# Remove old files (if switching from npm)
git rm package-lock.json
git rm .npmrc  # if you deleted it

# Commit
git commit -m "Configure project for pnpm package manager"
```

#### 7.2 Push to Repository

```bash
git push origin main
```

#### 7.3 Monitor Deployment

- Go to Render dashboard
- Watch the build logs
- Verify the build succeeds

---

## Troubleshooting

### Issue: Render Still Uses Wrong Package Manager

**Symptoms:**
```
ERROR  This project is configured to use npm
```

**Solutions:**

1. **Check Render Dashboard Settings**
   - Manually set Build Command in dashboard
   - Ensure Package Manager is set correctly

2. **Verify `render.yaml` Location**
   - File must be in repository root
   - File must be committed to git

3. **Check Service Configuration**
   - Ensure service is using `render.yaml` (not manual settings)
   - Some Render plans require explicit configuration

### Issue: Missing Lockfile Error

**Symptoms:**
```
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

**Solutions:**

1. **Generate Lockfile Locally**
   ```bash
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "Add pnpm lockfile"
   git push
   ```

2. **Temporarily Use `--no-frozen-lockfile`**
   ```yaml
   buildCommand: pnpm install --no-frozen-lockfile && pnpm run build
   ```
   Then generate lockfile after first successful build.

### Issue: Build Fails with "command not found"

**Symptoms:**
```
sh: 1: next: not found
ELIFECYCLE  Command failed
```

**Cause:** Dependencies weren't installed properly.

**Solution:**
- Ensure `pnpm install` completes successfully
- Check build logs for installation errors
- Verify `node_modules` directory is created

### Issue: Mixed Package Managers

**Symptoms:**
- Warnings about packages installed by different package manager
- Inconsistent dependency resolution

**Solution:**
1. **Clean Installation:**
   ```bash
   # Remove node_modules and lockfiles
   rm -rf node_modules
   rm package-lock.json  # if exists
   rm yarn.lock  # if exists
   
   # Fresh install with pnpm
   pnpm install
   ```

2. **Verify Lockfile:**
   ```bash
   # Ensure only pnpm-lock.yaml exists
   ls -la | grep -E "(lock|yarn)"
   ```

---

## Quick Reference: Switching Between Package Managers

### From npm to pnpm

```bash
# 1. Remove npm lockfile
rm package-lock.json

# 2. Remove packageManager field from package.json
# (Edit manually)

# 3. Install pnpm
npm install -g pnpm

# 4. Generate pnpm lockfile
pnpm install

# 5. Update render.yaml
# (Change npm commands to pnpm)

# 6. Commit and push
git add .
git commit -m "Switch to pnpm"
git push
```

### From pnpm to npm

```bash
# 1. Remove pnpm lockfile
rm pnpm-lock.yaml

# 2. Add packageManager to package.json
# "packageManager": "npm@10.0.0"

# 3. Generate npm lockfile
npm install

# 4. Update render.yaml
# (Change pnpm commands to npm)

# 5. Commit and push
git add .
git commit -m "Switch to npm"
git push
```

---

## Best Practices

### 1. Always Commit Lockfiles

Lockfiles ensure consistent dependency versions across environments:
- ✅ Commit `pnpm-lock.yaml`
- ✅ Commit `package-lock.json` (if using npm)
- ✅ Commit `yarn.lock` (if using yarn)

### 2. Use `--frozen-lockfile` in Production

This ensures exact dependency versions:
```yaml
buildCommand: pnpm install --frozen-lockfile && pnpm run build
```

### 3. Keep Package Manager Consistent

- Use the same package manager locally and in CI/CD
- Document which package manager your project uses
- Update team documentation

### 4. Verify Configuration

Before deploying:
```bash
# Check lockfile exists
ls pnpm-lock.yaml

# Verify render.yaml syntax
cat render.yaml

# Test build locally
pnpm install
pnpm run build
```

---

## Summary Checklist

Before deploying to Render, ensure:

- [ ] `package.json` doesn't have conflicting `packageManager` field
- [ ] Appropriate lockfile exists (`pnpm-lock.yaml`, `package-lock.json`, etc.)
- [ ] `render.yaml` build commands match chosen package manager
- [ ] Render dashboard settings match `render.yaml`
- [ ] Lockfile is committed to repository
- [ ] Local build succeeds with chosen package manager
- [ ] No conflicting lockfiles from other package managers

---

## Additional Resources

- [Render Documentation - Node.js](https://render.com/docs/node-version)
- [pnpm Documentation](https://pnpm.io/)
- [npm Documentation](https://docs.npmjs.com/)
- [Render Troubleshooting Guide](https://render.com/docs/troubleshooting-deploys)

---

## Example: Complete Configuration Files

### `package.json` (No packageManager field)
```json
{
  "name": "multi-company-rbac-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "lint": "next lint",
    "start": "next start"
  },
  "dependencies": {
    // ... your dependencies
  }
}
```

### `render.yaml` (pnpm configuration)
```yaml
services:
  - type: web
    name: multi-company-rbac-frontend
    env: node
    plan: starter
    buildCommand: pnpm install --frozen-lockfile && pnpm run build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
```

### `.gitignore` (Ensure lockfiles are NOT ignored)
```gitignore
# Dependencies
node_modules/

# Lockfiles should be committed
# !pnpm-lock.yaml
# !package-lock.json
```

---

**Last Updated:** Based on resolution of Render deployment issue with npm/pnpm configuration mismatch.

