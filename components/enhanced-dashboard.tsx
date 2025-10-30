"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, Users, Shield, TrendingUp, Activity, Calendar, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { storageService } from "@/lib/storage-service"

export function EnhancedDashboard() {
  const { user, currentCompany } = useAuth()

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
      bgColor: "bg-primary",
    },
    {
      title: "Active Users",
      value: users.length,
      icon: Users,
      color: "text-white",
      bgColor: "bg-secondary",
    },
    {
      title: "System Roles",
      value: roles.length,
      icon: Shield,
      color: "text-white",
      bgColor: "bg-chart-3",
    },
    {
      title: "Departments",
      value: departments.length,
      icon: Activity,
      color: "text-white",
      bgColor: "bg-chart-4",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="animate-fade-in border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance text-foreground">Welcome back, {user?.username}!</h1>
              <p className="text-muted-foreground mt-2">
                {currentCompany ? `Currently managing ${currentCompany.name}` : "Select a company to get started"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="hover-lift animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Company Details */}
      {currentCompany && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Company Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{currentCompany.name}</h3>
                <p className="text-muted-foreground">{currentCompany.description}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Departments</span>
                  <span className="font-medium">{currentCompanyDepartments.length}</span>
                </div>
                <Progress value={(currentCompanyDepartments.length / 10) * 100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Users</span>
                  <span className="font-medium">{currentCompanyUsers.length}</span>
                </div>
                <Progress value={(currentCompanyUsers.length / 20) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-secondary" />
                <span>Your Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{user?.username}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Role</span>
                  <Badge variant="secondary">{user?.role}</Badge>
                </div>
                {user?.department && (
                  <div className="flex justify-between">
                    <span className="text-sm">Department</span>
                    <span className="text-sm font-medium">{user.department}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Permissions</p>
                <div className="flex flex-wrap gap-1">
                  {user?.permissions.slice(0, 4).map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission.replace("_", " ")}
                    </Badge>
                  ))}
                  {user && user.permissions.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.permissions.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Building2 className="h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Manage Companies</h4>
              <p className="text-sm text-muted-foreground">Add or edit company information</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Users className="h-8 w-8 text-secondary mb-2" />
              <h4 className="font-medium">User Management</h4>
              <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Shield className="h-8 w-8 text-chart-3 mb-2" />
              <h4 className="font-medium">Security Settings</h4>
              <p className="text-sm text-muted-foreground">Configure access controls</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
