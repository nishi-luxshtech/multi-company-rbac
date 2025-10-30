"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Trash2, Edit } from "lucide-react"
import { useAuth, type User } from "@/lib/auth-context"
import { storageService, type Role, type Department } from "@/lib/storage-service"

export function UserManager() {
  const { hasPermission, currentCompany } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    department: "",
  })

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

    const user: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      department: formData.department || undefined,
      companyId: currentCompany.id,
      permissions: selectedRole?.permissions || [],
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    }

    storageService.saveUser(user)
    loadData()
    resetForm()
  }

  const resetForm = () => {
    setFormData({ username: "", email: "", role: "", department: "" })
    setShowForm(false)
    setEditingUser(null)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department || "",
    })
    setShowForm(true)
  }

  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      storageService.deleteUser(userId)
      loadData()
    }
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
          <p className="text-muted-foreground">Please select a company first to manage users.</p>
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Edit User" : "Add New User"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="department">Department (Optional)</Label>
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
              <div className="flex space-x-2">
                <Button type="submit">{editingUser ? "Update" : "Create"} User</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5" />
                  <div>
                    <CardTitle>{user.username}</CardTitle>
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
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="default">{user.role}</Badge>
                {user.department && <Badge variant="secondary">{user.department}</Badge>}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
