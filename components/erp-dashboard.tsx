"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, CheckCircle2, Clock, TrendingUp, AlertCircle, ShieldAlert } from "lucide-react"
import { companyAPI, userAPI, type Company, type User } from "@/lib/api-services"

interface DashboardStats {
  totalCompanies: number
  completedCompanies: number
  inProgressCompanies: number
  totalUsers: number
}

export function ERPDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    completedCompanies: 0,
    inProgressCompanies: 0,
    totalUsers: 0,
  })
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [companies, users] = await Promise.all([
        companyAPI.getAll().catch((err) => {
          if (err.response?.status === 403) {
            throw new Error("You don't have permission to view companies")
          }
          throw err
        }),
        userAPI.getAll().catch(() => [] as User[]),
      ])

      const completedCompanies = companies.filter((c) => c.is_complete).length
      const inProgressCompanies = companies.filter((c) => !c.is_complete).length

      setStats({
        totalCompanies: companies.length,
        completedCompanies,
        inProgressCompanies,
        totalUsers: users.length,
      })

      setRecentCompanies(companies.slice(0, 5))
    } catch (error: any) {
      console.error("[v0] Failed to load dashboard data:", error)
      if (error.message?.includes("permission")) {
        setError(error.message)
      } else {
        setError("Failed to load dashboard data. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
          <p className="text-muted-foreground text-pretty">Overview of your ERP system and company management</p>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator if you believe you should have access to this information.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground text-pretty">Overview of your ERP system and company management</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Companies</CardDescription>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered companies</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Completed</CardDescription>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">Fully onboarded</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>In Progress</CardDescription>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inProgressCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending completion</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Users</CardDescription>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Recent Companies</span>
          </CardTitle>
          <CardDescription>Latest companies added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No companies found. Create your first company to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{company.company_name}</p>
                      <p className="text-sm text-muted-foreground">{company.company_code || "No code"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {company.is_complete ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Step {company.onboarding_step || 1}/9
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <Building2 className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium">Add New Company</p>
              <p className="text-sm text-muted-foreground">Start company onboarding</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <Users className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-muted-foreground">Add or edit users</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium">View Reports</p>
              <p className="text-sm text-muted-foreground">Analytics and insights</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
