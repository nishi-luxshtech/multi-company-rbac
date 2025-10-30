"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authAPI, type User } from "./api-services"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function ERPAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user")

      if (token && storedUser) {
        try {
          // Try to parse stored user data
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (error) {
          console.error("Failed to parse stored user:", error)
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user")
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login for:", username)
      const response = await authAPI.login({ username, password })
      console.log("Login response received:", response)

      // Store token
      localStorage.setItem("auth_token", response.access_token)

      // Since the backend might not have a /auth/me endpoint, we'll create a basic user object
      const currentUser: User = {
        id: username, // Use username as ID for now
        username: username,
        email: username, // Assume username might be email
        role: "user", // Default role
        is_active: true,
      }

      setUser(currentUser)
      localStorage.setItem("user", JSON.stringify(currentUser))
      console.log("Login successful, user set:", currentUser)

      return true
    } catch (error: any) {
      console.error("Login failed:", error?.response?.data || error?.message || error)
      return false
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout API call failed:", error)
    } finally {
      // Clear local state regardless of API call success
      setUser(null)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useERPAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useERPAuth must be used within an ERPAuthProvider")
  }
  return context
}
