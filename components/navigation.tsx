"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { Building2, Users, Shield, Calculator, Settings, LogOut, Home } from "lucide-react"

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { user, currentCompany, logout, hasPermission } = useAuth()

  const navItems = [
    { id: "overview", label: "Overview", icon: Home, permission: "read" },
    { id: "companies", label: "Companies", icon: Building2, permission: "manage_companies" },
    { id: "departments", label: "Departments", icon: Settings, permission: "write" },
    { id: "roles", label: "Roles", icon: Shield, permission: "manage_users" },
    { id: "users", label: "Users", icon: Users, permission: "manage_users" },
    { id: "calculator", label: "Calculator", icon: Calculator, permission: "use_calculator" },
  ]

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6" />
              <span className="font-semibold">RBAC System</span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const canAccess = hasPermission(item.permission)

                if (!canAccess) return null

                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(item.id)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <Badge variant="outline">{user?.role}</Badge>
              {currentCompany && <Badge variant="secondary">{currentCompany.name}</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
