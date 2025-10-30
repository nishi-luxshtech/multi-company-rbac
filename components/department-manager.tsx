"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Settings, Trash2, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { storageService, type Department } from "@/lib/storage-service"

export function DepartmentManager() {
  const { hasPermission, currentCompany } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  })

  useEffect(() => {
    if (currentCompany) {
      loadDepartments()
    }
  }, [currentCompany])

  const loadDepartments = () => {
    if (currentCompany) {
      setDepartments(storageService.getDepartmentsByCompany(currentCompany.id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentCompany) return

    const department: Department = {
      id: editingDepartment?.id || `dept-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      companyId: currentCompany.id,
      parentId: formData.parentId || undefined,
      createdAt: editingDepartment?.createdAt || new Date().toISOString(),
    }

    storageService.saveDepartment(department)
    loadDepartments()
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", parentId: "" })
    setShowForm(false)
    setEditingDepartment(null)
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description,
      parentId: department.parentId || "",
    })
    setShowForm(true)
  }

  const handleDelete = (departmentId: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      storageService.deleteDepartment(departmentId)
      loadDepartments()
    }
  }

  if (!hasPermission("write")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">You don't have permission to manage departments.</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Please select a company first to manage departments.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Department Management</h2>
          <p className="text-muted-foreground">Manage departments for {currentCompany.name}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Department (Optional)</Label>
                  <select
                    id="parentId"
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="">No Parent</option>
                    {departments
                      .filter((d) => d.id !== editingDepartment?.id)
                      .map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">{editingDepartment ? "Update" : "Create"} Department</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <Card key={department.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>{department.name}</span>
                </CardTitle>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(department)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(department.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">{department.description}</CardDescription>
              {department.parentId && (
                <p className="text-sm text-muted-foreground">
                  Parent: {departments.find((d) => d.id === department.parentId)?.name}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
