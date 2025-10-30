"use client"

import { useERPAuth } from "@/lib/erp-auth-context"
import { Button } from "@/components/ui/button"
import { Building2, LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, Workflow } from "lucide-react"
import { useState, useEffect } from "react"

interface ERPSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function ERPSidebar({ activeTab, setActiveTab }: ERPSidebarProps) {
  const { user, logout } = useERPAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMobileOpen])

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "workflows", label: "Workflows", icon: Workflow },
    { id: "users", label: "Users & Admins", icon: Users },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const handleLogout = async () => {
    await logout()
  }

  const SidebarContent = () => (
    <>
      {/* Logo and User Info */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base sm:text-lg truncate">ERP System</h2>
            <p className="text-xs text-muted-foreground truncate">Enterprise Portal</p>
          </div>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium truncate">{user?.username}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email || user?.role}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setIsMobileOpen(false)
              }}
              className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 ${
                isActive ? "bg-blue-600 text-white shadow-md" : "hover:bg-muted text-foreground hover:shadow-sm"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 sm:p-4 border-t">
        <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-muted" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">Logout</span>
        </Button>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-card border-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 sm:w-72 md:w-80 lg:w-72 xl:w-80
          bg-card border-r flex flex-col
          transform transition-transform duration-300 ease-in-out
          shadow-2xl lg:shadow-none
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
