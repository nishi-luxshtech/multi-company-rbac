"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Trash2, Edit, Users, TrendingUp } from "lucide-react"
import { useAuth, type Company } from "@/lib/auth-context"
import { storageService } from "@/lib/storage-service"

export function CompanyManager() {
  const { hasPermission, switchCompany, currentCompany } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = () => {
    setCompanies(storageService.getCompanies())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const company: Company = {
      id: editingCompany?.id || `comp-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      parentId: formData.parentId || undefined,
      createdAt: editingCompany?.createdAt || new Date().toISOString(),
    }

    storageService.saveCompany(company)
    loadCompanies()
    resetForm()
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", parentId: "" })
    setShowForm(false)
    setEditingCompany(null)
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      description: company.description,
      parentId: company.parentId || "",
    })
    setShowForm(true)
  }

  const handleDelete = (companyId: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      storageService.deleteCompany(companyId)
      loadCompanies()
    }
  }

  const getCompanyStats = (companyId: string) => {
    const departments = storageService.getDepartments().filter((d) => d.companyId === companyId)
    const users = storageService.getUsers().filter((u) => u.companyId === companyId)
    return { departments: departments.length, users: users.length }
  }

  if (!hasPermission("manage_companies")) {
    return (
      <Card className="hover-lift">
        <CardContent className="pt-6 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to manage companies.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-balance">Company Management</h2>
          <p className="text-muted-foreground text-pretty">
            Manage companies and their hierarchies across your organization
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="hover-lift">
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-in hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>{editingCompany ? "Edit Company" : "Add New Company"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Company (Optional)</Label>
                  <select
                    id="parentId"
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md transition-all focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No Parent</option>
                    {companies
                      .filter((c) => c.id !== editingCompany?.id)
                      .map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
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
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" className="hover-lift">
                  {editingCompany ? "Update" : "Create"} Company
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="hover-lift bg-transparent">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company, index) => {
          const stats = getCompanyStats(company.id)
          const isCurrent = currentCompany?.id === company.id

          return (
            <Card
              key={company.id}
              className={`hover-lift animate-slide-in transition-all ${
                isCurrent ? "ring-2 ring-primary bg-primary/10 text-foreground" : "bg-card text-card-foreground"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div
                      className={`p-2 rounded-full ${isCurrent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-balance text-current">{company.name}</span>
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(company)} className="hover-lift">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(company.id)} className="hover-lift">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {isCurrent && (
                  <Badge variant="default" className="w-fit animate-fade-in">
                    Current Company
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-pretty text-muted-foreground">{company.description}</CardDescription>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">{stats.users}</p>
                      <p className="text-xs text-muted-foreground">Users</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-chart-3" />
                    <div>
                      <p className="text-sm font-medium">{stats.departments}</p>
                      <p className="text-xs text-muted-foreground">Departments</p>
                    </div>
                  </div>
                </div>

                {company.parentId && (
                  <p className="text-sm text-muted-foreground">
                    Parent: {companies.find((c) => c.id === company.parentId)?.name}
                  </p>
                )}

                <Button
                  size="sm"
                  variant={isCurrent ? "secondary" : "outline"}
                  onClick={() => switchCompany(company.id)}
                  disabled={isCurrent}
                  className="w-full hover-lift"
                >
                  {isCurrent ? "Current Company" : "Switch to Company"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
