# Role-Based Access Control (RBAC) for Sidebar Navigation

## Problem Statement

The ERP system needs to display different sidebar menu items based on the user's role:

- **Admin users** should see all menu items: Dashboard, Companies, Workflows, Users & Admins, Reports, Settings
- **Regular users** should see limited menu items: Dashboard, Reports (maybe), Settings (maybe)
- **Other roles** (Manager, Clerk, etc.) may have different permissions

## Current Sidebar Structure

\`\`\`
ERP System
├── Dashboard
├── Companies
├── Workflows
├── Users & Admins
├── Reports
└── Settings
\`\`\`

## Architecture Approach

### 1. Role-Based Menu Configuration

Create a configuration object that defines which menu items are visible for each role:

\`\`\`typescript
// lib/sidebar-config.ts
export type UserRole = 'admin' | 'manager' | 'user' | 'clerk'

export interface MenuItem {
  id: string
  label: string
  icon: string
  path: string
  roles: UserRole[] // Which roles can see this item
}

export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    roles: ['admin', 'manager', 'user', 'clerk'] // Everyone can see
  },
  {
    id: 'companies',
    label: 'Companies',
    icon: 'Building2',
    path: '/companies',
    roles: ['admin', 'manager'] // Only admin and manager
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: 'Workflow',
    path: '/workflows',
    roles: ['admin'] // Only admin
  },
  {
    id: 'users',
    label: 'Users & Admins',
    icon: 'Users',
    path: '/users',
    roles: ['admin'] // Only admin
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'FileText',
    path: '/reports',
    roles: ['admin', 'manager', 'user'] // Most users
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
    roles: ['admin', 'manager', 'user'] // Most users
  }
]
\`\`\`

### 2. Filter Menu Items by Role

In the sidebar component, filter the menu items based on the current user's role:

\`\`\`typescript
// components/erp-sidebar.tsx
import { useAuth } from '@/lib/auth-context'
import { menuItems } from '@/lib/sidebar-config'

export function ERPSidebar() {
  const { user } = useAuth()
  
  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  )
  
  return (
    <div className="sidebar">
      {visibleMenuItems.map(item => (
        <MenuItem key={item.id} {...item} />
      ))}
    </div>
  )
}
\`\`\`

### 3. User Context with Role

Ensure the auth context provides the user's role:

\`\`\`typescript
// lib/auth-context.tsx
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'user' | 'clerk'
  companyId?: string
}

export const AuthContext = createContext<{
  user: User | null
  // ... other auth methods
}>({
  user: null
})
\`\`\`

## Implementation Steps

### Step 1: Create Sidebar Configuration

1. Create `lib/sidebar-config.ts` with menu item definitions
2. Define which roles can access each menu item
3. Export the configuration for use in components

### Step 2: Update Auth Context

1. Ensure `User` type includes `role` field
2. Load user role from API or localStorage
3. Provide role information to all components

### Step 3: Update Sidebar Component

1. Import `useAuth` hook to get current user
2. Import `menuItems` configuration
3. Filter menu items based on user role
4. Render only visible items

### Step 4: Add Route Protection

Don't just hide menu items - also protect routes:

\`\`\`typescript
// components/protected-route.tsx
export function ProtectedRoute({ 
  children, 
  requiredRoles 
}: { 
  children: React.ReactNode
  requiredRoles?: UserRole[]
}) {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />
  }
  
  return <>{children}</>
}
\`\`\`

## Example: Different Sidebars by Role

### Admin Sidebar
\`\`\`
✓ Dashboard
✓ Companies
✓ Workflows
✓ Users & Admins
✓ Reports
✓ Settings
\`\`\`

### Manager Sidebar
\`\`\`
✓ Dashboard
✓ Companies
✗ Workflows (hidden)
✗ Users & Admins (hidden)
✓ Reports
✓ Settings
\`\`\`

### Regular User Sidebar
\`\`\`
✓ Dashboard
✗ Companies (hidden)
✗ Workflows (hidden)
✗ Users & Admins (hidden)
✓ Reports
✓ Settings
\`\`\`

### Clerk Sidebar
\`\`\`
✓ Dashboard
✗ Companies (hidden)
✗ Workflows (hidden)
✗ Users & Admins (hidden)
✗ Reports (hidden)
✓ Settings (limited)
\`\`\`

## Best Practices

### 1. Security First
- **Never rely only on UI hiding** - Always protect routes and API endpoints
- **Validate permissions on the backend** - UI is just for UX, not security
- **Use middleware** - Protect API routes with role checks

### 2. Maintainability
- **Centralize configuration** - Keep all menu definitions in one place
- **Use TypeScript** - Type-safe role definitions prevent errors
- **Document permissions** - Comment why each role has access

### 3. User Experience
- **Show appropriate items** - Don't confuse users with irrelevant options
- **Provide feedback** - If a user tries to access a restricted page, show a clear message
- **Consistent behavior** - If something is hidden in the sidebar, it should be inaccessible everywhere

### 4. Testing
- **Test each role** - Verify menu items appear correctly for each role
- **Test route protection** - Ensure users can't access restricted pages by URL
- **Test role changes** - Verify sidebar updates when user role changes

## Advanced Features

### Dynamic Permissions
For more complex scenarios, use permission-based access instead of role-based:

\`\`\`typescript
export interface MenuItem {
  id: string
  label: string
  icon: string
  path: string
  requiredPermissions: string[] // e.g., ['companies.view', 'companies.edit']
}

// Check if user has required permissions
const hasPermission = (user: User, permissions: string[]) => {
  return permissions.every(p => user.permissions.includes(p))
}
\`\`\`

### Hierarchical Menus
Support nested menu items with role-based visibility:

\`\`\`typescript
export interface MenuItem {
  id: string
  label: string
  icon: string
  path?: string
  roles: UserRole[]
  children?: MenuItem[] // Nested items
}
\`\`\`

### Feature Flags
Combine with feature flags for gradual rollout:

\`\`\`typescript
export interface MenuItem {
  id: string
  label: string
  icon: string
  path: string
  roles: UserRole[]
  featureFlag?: string // e.g., 'enable_workflows'
}
\`\`\`

## Migration Guide

### From Single Sidebar to Role-Based

1. **Audit current menu items** - List all existing menu items
2. **Define roles** - Determine what roles your system needs
3. **Map permissions** - Decide which roles can access which items
4. **Create configuration** - Build the sidebar config file
5. **Update components** - Modify sidebar to use configuration
6. **Test thoroughly** - Verify each role sees correct items
7. **Deploy gradually** - Roll out to test users first

## Troubleshooting

### Menu items not showing
- Check if user role is loaded correctly
- Verify role matches exactly (case-sensitive)
- Check if menuItems array includes the role

### All items showing for regular users
- Ensure filter logic is working
- Check if default role is 'admin'
- Verify auth context is providing correct role

### Items disappear after refresh
- Check if role is persisted in localStorage
- Verify auth context reloads user data
- Ensure role is included in user object

## Code Example: Complete Implementation

\`\`\`typescript
// lib/sidebar-config.ts
export const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/', roles: ['admin', 'manager', 'user', 'clerk'] },
  { id: 'companies', label: 'Companies', icon: 'Building2', path: '/companies', roles: ['admin', 'manager'] },
  { id: 'workflows', label: 'Workflows', icon: 'Workflow', path: '/workflows', roles: ['admin'] },
  { id: 'users', label: 'Users & Admins', icon: 'Users', path: '/users', roles: ['admin'] },
  { id: 'reports', label: 'Reports', icon: 'FileText', path: '/reports', roles: ['admin', 'manager', 'user'] },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings', roles: ['admin', 'manager', 'user'] },
]

// components/erp-sidebar.tsx
export function ERPSidebar() {
  const { user } = useAuth()
  const userRole = user?.role || 'user'
  
  const visibleItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  )
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>ERP System</h1>
        <p>Enterprise Portal</p>
      </div>
      
      <div className="user-info">
        <p>{user?.name}</p>
        <p className="text-sm text-muted">{user?.role}</p>
      </div>
      
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <NavLink 
            key={item.id} 
            to={item.path}
            className="nav-item"
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
\`\`\`

## Conclusion

Role-based sidebar navigation is essential for multi-tenant ERP systems. By following this guide, you can:

1. ✅ Show appropriate menu items for each user role
2. ✅ Maintain a single, reusable sidebar component
3. ✅ Easily add new roles or menu items
4. ✅ Ensure security through route protection
5. ✅ Provide a better user experience

Remember: **UI hiding is for UX, not security. Always protect your backend routes and API endpoints with proper authorization checks.**
