"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { storageService } from "./storage-service"

export interface User {
  id: string
  username: string
  email: string
  role: string
  department?: string
  companyId?: string
  permissions: string[]
  createdAt: string
}

export interface Company {
  id: string
  name: string
  description: string
  parentId?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  currentCompany: Company | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  switchCompany: (companyId: string) => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = storageService.getCurrentUser()
    if (savedUser) {
      setUser(savedUser)
      if (savedUser.companyId) {
        const company = storageService.getCompany(savedUser.companyId)
        setCurrentCompany(company)
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const users = storageService.getUsers()
    const foundUser = users.find((u) => u.username === username)

    if (foundUser && storageService.validateUserCredentials(username, password)) {
      setUser(foundUser)
      storageService.setCurrentUser(foundUser)

      if (foundUser.companyId) {
        const company = storageService.getCompany(foundUser.companyId)
        setCurrentCompany(company)
      }

      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    setCurrentCompany(null)
    storageService.clearCurrentUser()
  }

  const switchCompany = (companyId: string) => {
    const company = storageService.getCompany(companyId)
    if (company && user) {
      setCurrentCompany(company)
      const updatedUser = { ...user, companyId }
      setUser(updatedUser)
      storageService.setCurrentUser(updatedUser)
    }
  }

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || user?.role === "admin"
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        currentCompany,
        login,
        logout,
        switchCompany,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
