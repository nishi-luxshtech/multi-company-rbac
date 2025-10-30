"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Calculator,
  BarChart3,
  Home,
  GitBranch,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { storageService } from "@/lib/storage-service"

interface EnhancedSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function EnhancedSidebar({ activeTab, setActiveTab }: EnhancedSidebarProps) {
  const { user, currentCompany, switchCompany, hasPermission, logout } = useAuth()
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())

  const companies = storageService.getCompanies()
  const departments = storageService.getDepartments()

  const toggleCompanyExpansion = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId)
    } else {
      newExpanded.add(companyId)
    }
    setExpandedCompanies(newExpanded)
  }

  const getCompanyDepartments = (companyId: string) => {
    return departments.filter((dept) => dept.companyId === companyId)
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout()
    }
  }

  const menuItems = [
    { id: "overview", label: "Dashboard", icon: Home, permission: null },
    { id: "workflows", label: "Workflows", icon: GitBranch, permission: "manage_workflows" },
    { id: "companies", label: "Companies", icon: Building2, permission: "manage_companies" },
    { id: "departments", label: "Departments", icon: Users, permission: "manage_departments" },
    { id: "roles", label: "Roles", icon: Shield, permission: "manage_roles" },
    { id: "users", label: "Users", icon: Users, permission: "manage_users" },
    { id: "calculator", label: "Calculator", icon: Calculator, permission: "use_calculator" },
    { id: "analytics", label: "Analytics", icon: BarChart3, permission: "view_analytics" },
  ]

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl font-bold text-sidebar-foreground">ERP System</h2>
        <p className="text-sm text-muted-foreground">Multi-Company RBAC</p>
      </div>

      {/* Current User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">{user?.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-sidebar-foreground">{user?.username}</p>
              <Badge variant="secondary" className="text-xs">
                {user?.role}
              </Badge>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) return null

            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start hover-lift"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Company Explorer */}
      <div className="p-4 border-t border-sidebar-border">
        <h3 className="font-semibold text-sidebar-foreground mb-3">Company Explorer</h3>
        <div className="space-y-2">
          {companies.map((company) => {
            const isExpanded = expandedCompanies.has(company.id)
            const companyDepartments = getCompanyDepartments(company.id)
            const isCurrent = currentCompany?.id === company.id

            return (
              <div key={company.id} className="animate-slide-in">
                <Card
                  className={`hover-lift cursor-pointer transition-all ${
                    isCurrent ? "ring-2 ring-primary border-primary shadow-md" : "border-border"
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1" onClick={() => switchCompany(company.id)}>
                        <Building2 className={`h-4 w-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                        <span
                          className={`font-medium text-sm ${isCurrent ? "text-primary font-semibold" : "text-foreground"}`}
                        >
                          {company.name}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      {companyDepartments.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCompanyExpansion(company.id)
                          }}
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>

                    {isExpanded && companyDepartments.length > 0 && (
                      <div className="mt-3 pl-4 space-y-1 animate-fade-in">
                        {companyDepartments.map((dept) => (
                          <div
                            key={dept.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer group"
                            onClick={() => {
                              switchCompany(company.id)
                              setActiveTab("departments")
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                                {dept.name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              View
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
