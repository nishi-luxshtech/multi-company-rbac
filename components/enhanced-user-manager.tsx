"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, Trash2, Edit, Key, Shield, Building2, Eye, EyeOff } from "lucide-react"
import { useAuth, type User } from "@/lib/auth-context"
import { storageService, type Role, type Department } from "@/lib/storage-service"

export function EnhancedUserManager() {
  const { hasPermission, currentCompany } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    department: "",
    tools: [] as string[],
  })

  // Available tools that can be assigned to users
  const availableTools = [
    { id: "calculator", name: "Calculator", permission: "use_calculator" },
    { id: "analytics", name: "Analytics", permission: "view_analytics" },
    { id: "reports", name: "Reports", permission: "view_reports" },
    { id: "inventory", name: "Inventory", permission: "manage_inventory" },
    { id: "finance", name: "Finance", permission: "manage_finance" },
  ]

  useEffect(() => {
    if (currentCompany) {
      loadData()
    }
  }, [currentCompany])

  const loadData = () => {
    if (!currentCompany) return

    const allUsers = storageService.getUsers()
    setUsers(allUsers.filter((u) => u.companyId === currentCompany.id))
    setRoles(storageService.getRolesByCompany(currentCompany.id))
    setDepartments(storageService.getDepartmentsByCompany(currentCompany.id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentCompany) return

    const selectedRole = roles.find((r) => r.name === formData.role)
    const selectedDepartment = departments.find((d) => d.name === formData.department)

    // Get department-specific tools
    const departmentTools = selectedDepartment ? getDepartmentTools(selectedDepartment.name) : []
    const allPermissions = [...(selectedRole?.permissions || []), ...departmentTools, ...formData.tools]

    const user: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      department: formData.department || undefined,
      companyId: currentCompany.id,
      permissions: [...new Set(allPermissions)], // Remove duplicates
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    }

    storageService.saveUser(user)

    // Save login credentials if creating new user
    if (!editingUser && formData.password) {
      storageService.saveUserCredentials(user.username, formData.password)
    }

    loadData()
    resetForm()
  }

  const getDepartmentTools = (departmentName: string): string[] => {
    const departmentToolMap: Record<string, string[]> = {
      Sales: ["use_calculator", "view_analytics", "view_reports"],
      Finance: ["manage_finance", "view_analytics", "view_reports"],
      HR: ["manage_users", "view_analytics"],
      IT: ["manage_users", "manage_roles", "view_analytics"],
      Operations: ["manage_inventory", "view_analytics", "view_reports"],
    }
    return departmentToolMap[departmentName] || []
  }

  const resetForm = () => {
    setFormData({ username: "", email: "", password: "", role: "", department: "", tools: [] })
    setShowForm(false)
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department || "",
      tools: user.permissions.filter((p) => availableTools.some((t) => t.permission === p)),
    })
    setShowForm(true)
  }

  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      storageService.deleteUser(userId)
      loadData()
    }
  }

  const toggleTool = (toolPermission: string) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolPermission)
        ? prev.tools.filter((t) => t !== toolPermission)
        : [...prev.tools, toolPermission],
    }))
  }

  if (!hasPermission("manage_users")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You don't have permission to manage users.</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">No Company Selected</h3>
              <p className="text-muted-foreground">Please select a company from the sidebar to manage users.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage users for {currentCompany.name}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="hover-lift">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{editingUser ? "Edit User" : "Create New User"}</span>
            </CardTitle>
            <CardDescription>
              {editingUser
                ? "Update user information and permissions"
                : "Create a new user with login credentials and tool access"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="access">Access & Tools</TabsTrigger>
                <TabsTrigger value="credentials">Login Credentials</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-6">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="access" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        required
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <select
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="">No Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.name}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Additional Tools Access</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableTools.map((tool) => (
                        <div
                          key={tool.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all hover-lift ${
                            formData.tools.includes(tool.permission)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => toggleTool(tool.permission)}
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-4 h-4 rounded border-2 ${
                                formData.tools.includes(tool.permission)
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {formData.tools.includes(tool.permission) && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium">{tool.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="credentials" className="space-y-4">
                  {!editingUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!editingUser}
                          placeholder="Enter secure password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">User will be able to login with these credentials</p>
                    </div>
                  )}

                  {editingUser && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Key className="h-4 w-4" />
                        <span className="text-sm">Login credentials are managed separately for existing users</span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <div className="flex space-x-2 pt-4 border-t">
                  <Button type="submit" className="hover-lift">
                    <Shield className="h-4 w-4 mr-2" />
                    {editingUser ? "Update" : "Create"} User
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{user.username}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.department && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{user.department}</Badge>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Permissions & Tools:</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
