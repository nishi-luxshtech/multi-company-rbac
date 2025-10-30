"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Trash2, Edit, Building2, ChevronRight, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { storageService, type Department, type Role } from "@/lib/storage-service"

export function EnhancedDepartmentManager() {
  const { hasPermission, currentCompany } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  })

  useEffect(() => {
    if (currentCompany) {
      loadData()
    }
  }, [currentCompany])

  const loadData = () => {
    if (!currentCompany) return
    setDepartments(storageService.getDepartmentsByCompany(currentCompany.id))
    setRoles(storageService.getRolesByCompany(currentCompany.id))
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
    loadData()
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
      loadData()
    }
  }

  const getDepartmentRoles = (departmentName: string): string[] => {
    const departmentRoleMap: Record<string, string[]> = {
      Sales: ["Sales Manager", "Sales Representative", "Account Manager"],
      Finance: ["Finance Manager", "Accountant", "Financial Analyst"],
      HR: ["HR Manager", "HR Specialist", "Recruiter"],
      IT: ["IT Manager", "Developer", "System Administrator"],
      Operations: ["Operations Manager", "Supervisor", "Coordinator"],
      Manufacturing: ["Production Manager", "Quality Control", "Machine Operator"],
    }
    return departmentRoleMap[departmentName] || ["Department Manager", "Team Lead", "Staff"]
  }

  const getChildDepartments = (parentId: string) => {
    return departments.filter((dept) => dept.parentId === parentId)
  }

  if (!hasPermission("manage_departments")) {
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
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">No Company Selected</h3>
              <p className="text-muted-foreground">Please select a company from the sidebar to manage departments.</p>
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
          <h2 className="text-2xl font-bold">Department Management</h2>
          <p className="text-muted-foreground">Manage departments for {currentCompany.name}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="hover-lift">
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-in">
          <CardHeader>
            <CardTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</CardTitle>
            <CardDescription>Create organizational departments with hierarchical structure</CardDescription>
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
                      .filter((dept) => dept.id !== editingDepartment?.id)
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
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="hover-lift">
                  {editingDepartment ? "Update" : "Create"} Department
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {departments
          .filter((dept) => !dept.parentId)
          .map((department) => (
            <Card key={department.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{department.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getChildDepartments(department.id).length} sub-depts
                        </Badge>
                      </CardTitle>
                      <CardDescription>{department.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setSelectedDepartment(selectedDepartment?.id === department.id ? null : department)
                      }
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
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
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      {currentCompany.name}
                    </Badge>
                  </div>

                  {/* Child Departments */}
                  {getChildDepartments(department.id).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sub-departments:</p>
                      <div className="pl-4 space-y-1">
                        {getChildDepartments(department.id).map((childDept) => (
                          <div key={childDept.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <ChevronRight className="h-3 w-3" />
                            <span>{childDept.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Department Roles */}
                  {selectedDepartment?.id === department.id && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg animate-fade-in">
                      <p className="text-sm font-medium">Available Roles:</p>
                      <div className="flex flex-wrap gap-1">
                        {getDepartmentRoles(department.name).map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
