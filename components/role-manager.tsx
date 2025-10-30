"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Shield, Trash2, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { storageService, type Role } from "@/lib/storage-service"

const AVAILABLE_PERMISSIONS = [
  { id: "read", label: "Read", description: "View data and content" },
  { id: "write", label: "Write", description: "Create and edit content" },
  { id: "delete", label: "Delete", description: "Delete content and data" },
  { id: "manage_users", label: "Manage Users", description: "Create, edit, and delete users" },
  { id: "manage_companies", label: "Manage Companies", description: "Manage company settings" },
  { id: "use_calculator", label: "Use Calculator", description: "Access calculator tool" },
]

export function RoleManager() {
  const { hasPermission, currentCompany } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })

  useEffect(() => {
    if (currentCompany) {
      loadRoles()
    }
  }, [currentCompany])

  const loadRoles = () => {
    if (currentCompany) {
      setRoles(storageService.getRolesByCompany(currentCompany.id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentCompany) return

    const role: Role = {
      id: editingRole?.id || `role-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      companyId: currentCompany.id,
      createdAt: editingRole?.createdAt || new Date().toISOString(),
    }

    storageService.saveRole(role)
    loadRoles()
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", permissions: [] })
    setShowForm(false)
    setEditingRole(null)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    })
    setShowForm(true)
  }

  const handleDelete = (roleId: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      storageService.deleteRole(roleId)
      loadRoles()
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permissionId],
      })
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => p !== permissionId),
      })
    }
  }

  if (!hasPermission("manage_users")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You don't have permission to manage roles.</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Please select a company first to manage roles.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-muted-foreground">Manage roles and permissions for {currentCompany.name}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRole ? "Edit Role" : "Add New Role"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">{editingRole ? "Update" : "Create"} Role</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>{role.name}</span>
                </CardTitle>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(role)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(role.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">{role.description}</CardDescription>
              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {AVAILABLE_PERMISSIONS.find((p) => p.id === permission)?.label || permission}
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
