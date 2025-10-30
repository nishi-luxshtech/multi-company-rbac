"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, MapPin, Shield, CheckCircle, ArrowRight, ArrowLeft, Briefcase } from "lucide-react"
import { useAuth, type Company, type Department, type Role } from "@/lib/auth-context"
import { storageService } from "@/lib/storage-service"

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface CompanyData {
  name: string
  description: string
  parentId?: string
  industry: string
  currency: string
  timezone: string
}

interface SiteData {
  name: string
  address: string
  type: "headquarters" | "branch" | "warehouse" | "factory" | "retail"
  description: string
}

interface DepartmentRoleData {
  departments: Array<{
    name: string
    description: string
    roles: Array<{
      name: string
      permissions: string[]
      tools: string[]
    }>
  }>
}

const availablePermissions = [
  { id: "view_dashboard", name: "View Dashboard", category: "General" },
  { id: "manage_users", name: "Manage Users", category: "User Management" },
  { id: "manage_roles", name: "Manage Roles", category: "User Management" },
  { id: "manage_companies", name: "Manage Companies", category: "System" },
  { id: "manage_departments", name: "Manage Departments", category: "System" },
  { id: "view_reports", name: "View Reports", category: "Reporting" },
  { id: "manage_inventory", name: "Manage Inventory", category: "Operations" },
  { id: "manage_sales", name: "Manage Sales", category: "Operations" },
  { id: "manage_finance", name: "Manage Finance", category: "Finance" },
  { id: "approve_transactions", name: "Approve Transactions", category: "Finance" },
]

const availableTools = [
  { id: "crm", name: "CRM System", category: "Sales" },
  { id: "inventory", name: "Inventory Management", category: "Operations" },
  { id: "accounting", name: "Accounting Software", category: "Finance" },
  { id: "hr", name: "HR Management", category: "Human Resources" },
  { id: "project", name: "Project Management", category: "Operations" },
  { id: "analytics", name: "Analytics Dashboard", category: "Reporting" },
  { id: "communication", name: "Internal Communication", category: "General" },
  { id: "document", name: "Document Management", category: "General" },
]

const departmentTemplates = [
  {
    name: "Sales",
    description: "Sales and customer relationship management",
    defaultRoles: [
      {
        name: "Sales Manager",
        permissions: ["manage_sales", "view_reports", "manage_users"],
        tools: ["crm", "analytics"],
      },
      { name: "Sales Representative", permissions: ["manage_sales", "view_dashboard"], tools: ["crm"] },
    ],
  },
  {
    name: "Finance",
    description: "Financial management and accounting",
    defaultRoles: [
      {
        name: "Finance Manager",
        permissions: ["manage_finance", "approve_transactions", "view_reports"],
        tools: ["accounting", "analytics"],
      },
      { name: "Accountant", permissions: ["manage_finance", "view_dashboard"], tools: ["accounting"] },
    ],
  },
  {
    name: "Operations",
    description: "Operations and inventory management",
    defaultRoles: [
      {
        name: "Operations Manager",
        permissions: ["manage_inventory", "view_reports", "manage_users"],
        tools: ["inventory", "project", "analytics"],
      },
      { name: "Warehouse Staff", permissions: ["manage_inventory", "view_dashboard"], tools: ["inventory"] },
    ],
  },
  {
    name: "Human Resources",
    description: "Human resources and employee management",
    defaultRoles: [
      { name: "HR Manager", permissions: ["manage_users", "manage_roles", "view_reports"], tools: ["hr", "analytics"] },
      { name: "HR Specialist", permissions: ["manage_users", "view_dashboard"], tools: ["hr"] },
    ],
  },
]

export function GuidedCompanyWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasPermission } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    description: "",
    industry: "",
    currency: "USD",
    timezone: "UTC",
  })
  const [siteData, setSiteData] = useState<SiteData>({
    name: "",
    address: "",
    type: "headquarters",
    description: "",
  })
  const [departmentRoleData, setDepartmentRoleData] = useState<DepartmentRoleData>({
    departments: [],
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const steps: WizardStep[] = [
    {
      id: "company",
      title: "Create Company",
      description: "Set up basic company information and configuration",
      icon: <Building2 className="h-5 w-5" />,
      completed: companyData.name !== "" && companyData.description !== "",
    },
    {
      id: "site",
      title: "Create Primary Site",
      description: "Set up the main operational site for your company",
      icon: <MapPin className="h-5 w-5" />,
      completed: siteData.name !== "" && siteData.address !== "",
    },
    {
      id: "departments",
      title: "Setup Departments & Roles",
      description: "Create departments, roles, and assign permissions with tool access",
      icon: <Shield className="h-5 w-5" />,
      completed: departmentRoleData.departments.length > 0,
    },
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsProcessing(true)

    try {
      const company: Company = {
        id: `comp-${Date.now()}`,
        name: companyData.name,
        description: companyData.description,
        parentId: companyData.parentId,
        createdAt: new Date().toISOString(),
      }

      storageService.saveCompany(company)

      const site = {
        id: `site-${Date.now()}`,
        name: siteData.name,
        address: siteData.address,
        type: siteData.type,
        description: siteData.description,
        companyId: company.id,
        createdAt: new Date().toISOString(),
      }

      // Save site to localStorage (extending storage service functionality)
      const sites = JSON.parse(localStorage.getItem("sites") || "[]")
      sites.push(site)
      localStorage.setItem("sites", JSON.stringify(sites))

      departmentRoleData.departments.forEach((dept) => {
        const department: Department = {
          id: `dept-${Date.now()}-${Math.random()}`,
          name: dept.name,
          description: dept.description,
          companyId: company.id,
          createdAt: new Date().toISOString(),
        }

        storageService.saveDepartment(department)

        // Create roles for this department
        dept.roles.forEach((roleData) => {
          const role: Role = {
            id: `role-${Date.now()}-${Math.random()}`,
            name: roleData.name,
            permissions: roleData.permissions,
            departmentId: department.id,
            companyId: company.id,
            createdAt: new Date().toISOString(),
          }

          storageService.saveRole(role)

          // Save tool assignments
          const toolAssignments = JSON.parse(localStorage.getItem("tool-assignments") || "[]")
          roleData.tools.forEach((toolId) => {
            toolAssignments.push({
              id: `tool-${Date.now()}-${Math.random()}`,
              roleId: role.id,
              toolId,
              companyId: company.id,
              departmentId: department.id,
            })
          })
          localStorage.setItem("tool-assignments", JSON.stringify(toolAssignments))
        })
      })

      // Reset form and close
      setTimeout(() => {
        setIsProcessing(false)
        onClose()
        // Reset all form data
        setCompanyData({ name: "", description: "", industry: "", currency: "USD", timezone: "UTC" })
        setSiteData({ name: "", address: "", type: "headquarters", description: "" })
        setDepartmentRoleData({ departments: [] })
        setCurrentStep(0)
      }, 2000)
    } catch (error) {
      console.error("Error creating company setup:", error)
      setIsProcessing(false)
    }
  }

  const addDepartmentFromTemplate = (template: (typeof departmentTemplates)[0]) => {
    const newDepartment = {
      name: template.name,
      description: template.description,
      roles: template.defaultRoles.map((role) => ({
        name: role.name,
        permissions: role.permissions,
        tools: role.tools,
      })),
    }

    setDepartmentRoleData({
      departments: [...departmentRoleData.departments, newDepartment],
    })
  }

  const removeDepartment = (index: number) => {
    const updatedDepartments = departmentRoleData.departments.filter((_, i) => i !== index)
    setDepartmentRoleData({ departments: updatedDepartments })
  }

  if (!hasPermission("manage_companies")) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Company Setup Wizard
          </DialogTitle>
          <DialogDescription>
            Follow this guided process to set up your company with sites, departments, and roles
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-muted"
                } ${step.completed ? "bg-green-500 border-green-500" : ""}`}
              >
                {step.completed ? <CheckCircle className="h-5 w-5" /> : step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${index < currentStep ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Create Your Company</h3>
                <p className="text-muted-foreground">Set up the basic information for your new company</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <select
                    id="industry"
                    value={companyData.industry}
                    onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="">Select Industry</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={companyData.currency}
                    onChange={(e) => setCompanyData({ ...companyData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={companyData.timezone}
                    onChange={(e) => setCompanyData({ ...companyData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Kolkata">India</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-description">Description *</Label>
                <Textarea
                  id="company-description"
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  placeholder="Describe your company's purpose and activities"
                  rows={3}
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Create Primary Site</h3>
                <p className="text-muted-foreground">Set up the main operational location for {companyData.name}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name *</Label>
                  <Input
                    id="site-name"
                    value={siteData.name}
                    onChange={(e) => setSiteData({ ...siteData, name: e.target.value })}
                    placeholder="e.g., Main Office, Headquarters"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-type">Site Type</Label>
                  <select
                    id="site-type"
                    value={siteData.type}
                    onChange={(e) => setSiteData({ ...siteData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="headquarters">Headquarters</option>
                    <option value="branch">Branch Office</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="factory">Factory</option>
                    <option value="retail">Retail Store</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-address">Address *</Label>
                <Textarea
                  id="site-address"
                  value={siteData.address}
                  onChange={(e) => setSiteData({ ...siteData, address: e.target.value })}
                  placeholder="Enter complete address including city, state, and postal code"
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Description</Label>
                <Textarea
                  id="site-description"
                  value={siteData.description}
                  onChange={(e) => setSiteData({ ...siteData, description: e.target.value })}
                  placeholder="Additional details about this site"
                  rows={2}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Setup Departments & Roles</h3>
                <p className="text-muted-foreground">
                  Create departments and assign roles with permissions and tool access
                </p>
              </div>

              {/* Department Templates */}
              <div>
                <h4 className="font-medium mb-3">Quick Setup - Add Department Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {departmentTemplates.map((template) => (
                    <Card
                      key={template.name}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => addDepartmentFromTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{template.name}</h5>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.defaultRoles.length} roles included
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Added Departments */}
              <div>
                <h4 className="font-medium mb-3">Configured Departments ({departmentRoleData.departments.length})</h4>
                {departmentRoleData.departments.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No departments added yet. Use the templates above to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {departmentRoleData.departments.map((dept, deptIndex) => (
                      <Card key={deptIndex}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{dept.name}</CardTitle>
                              <CardDescription>{dept.description}</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => removeDepartment(deptIndex)}>
                              Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {dept.roles.map((role, roleIndex) => (
                              <div key={roleIndex} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="font-medium">{role.name}</h6>
                                  <Badge variant="secondary">{role.permissions.length} permissions</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="font-medium text-muted-foreground mb-1">Permissions:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {role.permissions.map((perm) => (
                                        <Badge key={perm} variant="outline" className="text-xs">
                                          {availablePermissions.find((p) => p.id === perm)?.name || perm}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-medium text-muted-foreground mb-1">Tools:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {role.tools.map((tool) => (
                                        <Badge key={tool} variant="outline" className="text-xs">
                                          {availableTools.find((t) => t.id === tool)?.name || tool}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={!steps[currentStep].completed || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
