"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Search,
  Plus,
  Shield,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  UserIcon,
  Building2,
} from "lucide-react"
import { userAPI, companyAPI, type User, type Company } from "@/lib/api-services"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ERPUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
    company_id: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, users])

  const loadData = async () => {
    try {
      const [usersData, companiesData] = await Promise.all([userAPI.getAll(), companyAPI.getAll()])
      setUsers(usersData)
      setFilteredUsers(usersData)
      setCompanies(companiesData)
    } catch (error) {
      console.error("[v0] Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "user",
      company_id: null,
    })
    setError("")
    setShowUserDialog(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email || "",
      password: "", // Don't populate password for editing
      role: user.role as "user" | "admin",
      company_id: user.company_id || null,
    })
    setError("")
    setShowUserDialog(true)
  }

  const handleSaveUser = async () => {
    if (!formData.username.trim()) {
      setError("Username is required")
      return
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }
    // Administrators must be assigned to a company
    if (formData.role === "admin" && !formData.company_id) {
      setError("Company is required for administrators")
      return
    }
    if (!editingUser && !formData.password.trim()) {
      setError("Password is required for new users")
      return
    }
    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setSaving(true)
    setError("")

    try {
      const payload: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
      }

      // Only include company_id if it's not null
      if (formData.company_id !== null) {
        payload.company_id = formData.company_id
      }

      // Only include password if it's provided
      if (formData.password.trim()) {
        payload.password = formData.password
      }

      console.log("[v0] Saving user with payload:", payload)

      if (editingUser) {
        await userAPI.update(editingUser.id, payload)
      } else {
        await userAPI.create(payload)
      }

      await loadData()
      setShowUserDialog(false)
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
        company_id: null,
      })
    } catch (error: any) {
      console.error("[v0] Failed to save user:", error)
      const errorMessage = error.response?.data?.detail || "Failed to save user. Please try again."
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    try {
      await userAPI.delete(deleteUserId)
      await loadData()
      setDeleteUserId(null)
    } catch (error) {
      console.error("[v0] Failed to delete user:", error)
    }
  }

  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return "No Company"
    const company = companies.find((c) => c.id === companyId)
    return company?.company_name || "Unknown"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">User Management</h1>
          <p className="text-muted-foreground text-pretty mt-1">Manage users and administrators</p>
        </div>
        <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700 h-10">
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Total Users</CardDescription>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Administrators</CardDescription>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Regular Users</CardDescription>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.filter((u) => u.role === "user").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">{searchQuery ? "No users found" : "No users yet"}</p>
              <p className="text-sm">
                {searchQuery ? "Try adjusting your search query" : "Get started by adding your first user"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">All Users</CardTitle>
            <CardDescription className="text-sm">Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-lg ${
                        user.role === "admin"
                          ? "bg-purple-100 dark:bg-purple-900/20"
                          : "bg-blue-100 dark:bg-blue-900/20"
                      }`}
                    >
                      {user.role === "admin" ? (
                        <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-base">{user.username}</p>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground gap-1">
                        {user.email && (
                          <span className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </span>
                        )}
                        {user.company_id && (
                          <span className="flex items-center">
                            <Building2 className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                            {getCompanyName(user.company_id)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} className="h-9">
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 bg-transparent"
                      onClick={() => setDeleteUserId(user.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950 border-2">
          <DialogHeader className="space-y-3 pb-6 border-b-2">
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
              {editingUser ? "Update user information and permissions" : "Create a new user account"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Username <span className="text-red-600">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                disabled={saving}
                className="h-12 text-base bg-white dark:bg-gray-900 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Email <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                disabled={saving}
                className="h-12 text-base bg-white dark:bg-gray-900 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Password{" "}
                {editingUser ? (
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">
                    (leave blank to keep current)
                  </span>
                ) : (
                  <span className="text-red-600">*</span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Enter new password" : "Enter password"}
                disabled={saving}
                className="h-12 text-base bg-white dark:bg-gray-900 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {formData.password && formData.password.length < 6 && (
                <p className="text-sm text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="role" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Role <span className="text-red-600">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "user" | "admin") => setFormData({ ...formData, role: value })}
                disabled={saving}
              >
                <SelectTrigger className="h-12 text-base bg-white dark:bg-gray-900 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950 border-2">
                  <SelectItem value="user" className="text-base py-3">
                    User
                  </SelectItem>
                  <SelectItem value="admin" className="text-base py-3">
                    Administrator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="company" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Company{" "}
                {formData.role === "admin" ? (
                  <span className="text-red-600">*</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">(Optional)</span>
                )}
              </Label>
              {formData.role === "admin" && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Administrators must be assigned to a company
                </p>
              )}
              <Select
                value={formData.company_id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, company_id: value === "none" ? null : Number.parseInt(value) })
                }
                disabled={saving}
              >
                <SelectTrigger className="h-12 text-base bg-white dark:bg-gray-900 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-950 border-2">
                  {formData.role !== "admin" && (
                    <SelectItem value="none" className="text-base py-3">
                      No Company
                    </SelectItem>
                  )}
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()} className="text-base py-3">
                      {company.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.company_id && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {getCompanyName(formData.company_id)}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
              >
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base font-medium text-red-900 dark:text-red-100">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-3 pt-6 border-t-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowUserDialog(false)}
              disabled={saving}
              className="h-12 text-base w-full sm:w-auto border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 h-12 text-base w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingUser ? "Update User" : "Create User"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
