"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Users,
  Shield,
  TrendingUp,
  Activity,
  Clock,
  Sparkles,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
  Globe,
  Database,
  Zap,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { storageService } from "@/lib/storage-service"
import { GuidedCompanyWizard } from "./guided-company-wizard"

export function SuperAdminDashboard() {
  const { user, currentCompany } = useAuth()
  const [showWizard, setShowWizard] = useState(false)

  const companies = storageService.getCompanies()
  const departments = storageService.getDepartments()
  const users = storageService.getUsers()
  const roles = storageService.getRoles()

  const currentCompanyDepartments = currentCompany
    ? departments.filter((dept) => dept.companyId === currentCompany.id)
    : []

  const currentCompanyUsers = currentCompany ? users.filter((u) => u.companyId === currentCompany.id) : []

  const stats = [
    {
      title: "Total Companies",
      value: companies.length,
      icon: Building2,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-primary to-primary/80",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Active Users",
      value: users.length,
      icon: Users,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-secondary to-secondary/80",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "System Roles",
      value: roles.length,
      icon: Shield,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-chart-3 to-chart-3/80",
      change: "+3%",
      changeType: "positive",
    },
    {
      title: "Departments",
      value: departments.length,
      icon: Activity,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-chart-2 to-chart-2/80",
      change: "+15%",
      changeType: "positive",
    },
  ]

  return (
    <div className="space-y-8 p-6">
      {/* Enhanced Welcome Section */}
      <div className="relative overflow-hidden">
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 animate-fade-in">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text">Welcome back, {user?.username}!</h1>
                    <p className="text-lg text-muted-foreground">
                      {currentCompany ? `Managing ${currentCompany.name} • ` : ""}
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Multi-Company ERP</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step-by-Step Company Setup Flow */}
      <Card className="border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text">Company Setup Workflow</h2>
                <p className="text-muted-foreground">Follow our guided 3-step process to set up a complete company</p>
              </div>
            </div>
            <Button
              onClick={() => setShowWizard(true)}
              size="lg"
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg px-8 border-0"
            >
              <Plus className="h-5 w-5 mr-2" />
              Start Setup
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-start space-x-4 p-6 bg-white/50 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-foreground flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-primary" />
                    Create Company
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Set up basic company information, branding, and initial configuration
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-primary">
                    <Clock className="h-3 w-3" />
                    <span>~2 minutes</span>
                  </div>
                </div>
              </div>
              {/* Arrow connector */}
              <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-primary/60" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-start space-x-4 p-6 bg-white/50 rounded-xl border border-secondary/20 hover:border-secondary/40 transition-colors">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-foreground flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-secondary" />
                    Setup Sites
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create physical locations, branches, or operational sites for the company
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-secondary">
                    <Clock className="h-3 w-3" />
                    <span>~3 minutes</span>
                  </div>
                </div>
              </div>
              {/* Arrow connector */}
              <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-secondary/60" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-start space-x-4 p-6 bg-white/50 rounded-xl border border-chart-3/20 hover:border-chart-3/40 transition-colors">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-foreground flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-chart-3" />
                    Roles & Permissions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create departments, define roles, assign permissions, and configure tool access
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-chart-3">
                    <Clock className="h-3 w-3" />
                    <span>~5 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
            <h4 className="font-bold text-lg text-foreground mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Why Use Our Guided Setup?
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Systematic Approach</p>
                  <p className="text-xs text-muted-foreground">No missed configurations</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Best Practices</p>
                  <p className="text-xs text-muted-foreground">Industry-standard setup</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-3/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-chart-3" />
                </div>
                <div>
                  <p className="font-medium text-sm">Time Efficient</p>
                  <p className="text-xs text-muted-foreground">Complete setup in 10 mins</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="hover-lift animate-slide-in border-0 shadow-lg"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-3 rounded-xl ${stat.bgColor} shadow-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Company Overview and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Company Details */}
        {currentCompany && (
          <Card className="hover-lift lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">Company Overview</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary hover:text-white transition-colors bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-foreground">{currentCompany.name}</h3>
                    <p className="text-muted-foreground">{currentCompany.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Departments</span>
                      <Badge variant="secondary">{currentCompanyDepartments.length}</Badge>
                    </div>
                    <Progress value={(currentCompanyDepartments.length / 10) * 100} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Users</span>
                      <Badge variant="secondary">{currentCompanyUsers.length}</Badge>
                    </div>
                    <Progress value={(currentCompanyUsers.length / 20) * 100} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New user added</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Role permissions updated</p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Quick Actions */}
        <Card className="hover-lift border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setShowWizard(true)}
              className="w-full justify-between bg-slate-900 hover:bg-slate-800 text-white shadow-lg border-0"
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Setup New Company</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-colors bg-white border-gray-300 text-slate-900"
            >
              <div className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Quick Add Company</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-colors bg-white border-gray-300 text-slate-900"
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Manage Users</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-colors bg-white border-gray-300 text-slate-900"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Role Settings</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:bg-slate-700 hover:text-white hover:border-slate-700 transition-colors bg-white border-gray-300 text-slate-900"
            >
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>System Config</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced User Profile Section */}
      <Card className="hover-lift border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span>Your Admin Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">{user?.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg text-foreground">{user?.username}</p>
                <p className="text-muted-foreground">{user?.email}</p>
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white">{user?.role}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">System Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {user?.permissions.slice(0, 6).map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs border-primary/30 text-primary">
                      {permission.replace("_", " ")}
                    </Badge>
                  ))}
                  {user && user.permissions.length > 6 && (
                    <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
                      +{user.permissions.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <GuidedCompanyWizard open={showWizard} onClose={() => setShowWizard(false)} />
    </div>
  )
}
