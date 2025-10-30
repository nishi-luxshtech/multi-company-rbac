import type { User, Company } from "./auth-context"

export interface Department {
  id: string
  name: string
  description: string
  companyId: string
  parentId?: string
  createdAt: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  companyId: string
  createdAt: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  userId: string
  companyId: string
  permissions: string[]
  createdAt: string
  expiresAt?: string
}

export interface UserCredentials {
  username: string
  password: string
  createdAt: string
}

export interface WorkflowCompany extends Company {
  workflowId: string
  workflowName: string
  formData: Record<string, any>
  completedAt: string
}

class StorageService {
  private getFromStorage<T>(key: string): T[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Users
  getUsers(): User[] {
    return this.getFromStorage<User>("rbac_users")
  }

  saveUser(user: User): void {
    const users = this.getUsers()
    const existingIndex = users.findIndex((u) => u.id === user.id)
    if (existingIndex >= 0) {
      users[existingIndex] = user
    } else {
      users.push(user)
    }
    this.saveToStorage("rbac_users", users)
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId)
    this.saveToStorage("rbac_users", users)
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null
    const data = localStorage.getItem("rbac_current_user")
    return data ? JSON.parse(data) : null
  }

  setCurrentUser(user: User): void {
    if (typeof window === "undefined") return
    localStorage.setItem("rbac_current_user", JSON.stringify(user))
  }

  clearCurrentUser(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("rbac_current_user")
  }

  // Companies
  getCompanies(): Company[] {
    return this.getFromStorage<Company>("rbac_companies")
  }

  getCompany(id: string): Company | null {
    return this.getCompanies().find((c) => c.id === id) || null
  }

  saveCompany(company: Company): void {
    const companies = this.getCompanies()
    const existingIndex = companies.findIndex((c) => c.id === company.id)
    if (existingIndex >= 0) {
      companies[existingIndex] = company
    } else {
      companies.push(company)
    }
    this.saveToStorage("rbac_companies", companies)
  }

  deleteCompany(companyId: string): void {
    const companies = this.getCompanies().filter((c) => c.id !== companyId)
    this.saveToStorage("rbac_companies", companies)
  }

  // Workflow Companies
  getWorkflowCompanies(): WorkflowCompany[] {
    return this.getFromStorage<WorkflowCompany>("workflow_companies")
  }

  saveWorkflowCompany(company: WorkflowCompany): void {
    const companies = this.getWorkflowCompanies()
    const existingIndex = companies.findIndex((c) => c.id === company.id)
    if (existingIndex >= 0) {
      companies[existingIndex] = company
    } else {
      companies.push(company)
    }
    this.saveToStorage("workflow_companies", companies)

    // Also save to regular companies for compatibility
    const simpleCompany: Company = {
      id: company.id,
      name: company.name,
      description: company.description,
      createdAt: company.createdAt,
    }
    this.saveCompany(simpleCompany)

    console.log("Saved workflow company to localStorage:", company.id)
  }

  deleteWorkflowCompany(companyId: string): void {
    const companies = this.getWorkflowCompanies().filter((c) => c.id !== companyId)
    this.saveToStorage("workflow_companies", companies)
  }

  // Departments
  getDepartments(): Department[] {
    return this.getFromStorage<Department>("rbac_departments")
  }

  getDepartmentsByCompany(companyId: string): Department[] {
    return this.getDepartments().filter((d) => d.companyId === companyId)
  }

  saveDepartment(department: Department): void {
    const departments = this.getDepartments()
    const existingIndex = departments.findIndex((d) => d.id === department.id)
    if (existingIndex >= 0) {
      departments[existingIndex] = department
    } else {
      departments.push(department)
    }
    this.saveToStorage("rbac_departments", departments)
  }

  deleteDepartment(departmentId: string): void {
    const departments = this.getDepartments().filter((d) => d.id !== departmentId)
    this.saveToStorage("rbac_departments", departments)
  }

  // Roles
  getRoles(): Role[] {
    return this.getFromStorage<Role>("rbac_roles")
  }

  getRolesByCompany(companyId: string): Role[] {
    return this.getRoles().filter((r) => r.companyId === companyId)
  }

  saveRole(role: Role): void {
    const roles = this.getRoles()
    const existingIndex = roles.findIndex((r) => r.id === role.id)
    if (existingIndex >= 0) {
      roles[existingIndex] = role
    } else {
      roles.push(role)
    }
    this.saveToStorage("rbac_roles", roles)
  }

  deleteRole(roleId: string): void {
    const roles = this.getRoles().filter((r) => r.id !== roleId)
    this.saveToStorage("rbac_roles", roles)
  }

  // API Keys
  getApiKeys(): ApiKey[] {
    return this.getFromStorage<ApiKey>("rbac_api_keys")
  }

  saveApiKey(apiKey: ApiKey): void {
    const apiKeys = this.getApiKeys()
    const existingIndex = apiKeys.findIndex((k) => k.id === apiKey.id)
    if (existingIndex >= 0) {
      apiKeys[existingIndex] = apiKey
    } else {
      apiKeys.push(apiKey)
    }
    this.saveToStorage("rbac_api_keys", apiKeys)
  }

  deleteApiKey(apiKeyId: string): void {
    const apiKeys = this.getApiKeys().filter((k) => k.id !== apiKeyId)
    this.saveToStorage("rbac_api_keys", apiKeys)
  }

  getUserCredentials(): UserCredentials[] {
    return this.getFromStorage<UserCredentials>("rbac_user_credentials")
  }

  saveUserCredentials(username: string, password: string): void {
    const credentials = this.getUserCredentials()
    const existingIndex = credentials.findIndex((c) => c.username === username)
    const newCredential: UserCredentials = {
      username,
      password,
      createdAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      credentials[existingIndex] = newCredential
    } else {
      credentials.push(newCredential)
    }
    this.saveToStorage("rbac_user_credentials", credentials)
  }

  validateUserCredentials(username: string, password: string): boolean {
    const credentials = this.getUserCredentials()
    const userCredential = credentials.find((c) => c.username === username)
    return userCredential ? userCredential.password === password : false
  }

  deleteUserCredentials(username: string): void {
    const credentials = this.getUserCredentials().filter((c) => c.username !== username)
    this.saveToStorage("rbac_user_credentials", credentials)
  }

  // Initialize with sample data
  initializeSampleData(): void {
    if (this.getUsers().length === 0) {
      // Create sample company
      const sampleCompany: Company = {
        id: "comp-1",
        name: "Acme Corporation",
        description: "Main company for demonstration",
        createdAt: new Date().toISOString(),
      }
      this.saveCompany(sampleCompany)

      const sampleCompany2: Company = {
        id: "comp-2",
        name: "LAXMI Industries",
        description: "Manufacturing and retail company",
        createdAt: new Date().toISOString(),
      }
      this.saveCompany(sampleCompany2)

      // Create sample departments
      const departments: Department[] = [
        {
          id: "dept-1",
          name: "IT Department",
          description: "Information Technology",
          companyId: "comp-1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "dept-2",
          name: "HR Department",
          description: "Human Resources",
          companyId: "comp-1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "dept-3",
          name: "Manufacturing",
          description: "Production and Manufacturing",
          companyId: "comp-2",
          createdAt: new Date().toISOString(),
        },
        {
          id: "dept-4",
          name: "Sales",
          description: "Sales and Marketing",
          companyId: "comp-2",
          createdAt: new Date().toISOString(),
        },
      ]
      departments.forEach((dept) => this.saveDepartment(dept))

      // Create sample roles
      const roles: Role[] = [
        {
          id: "role-1",
          name: "admin",
          description: "System Administrator",
          permissions: [
            "read",
            "write",
            "delete",
            "manage_users",
            "manage_companies",
            "manage_departments",
            "manage_roles",
            "use_calculator",
            "view_analytics",
            "manage_workflows",
          ],
          companyId: "comp-1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "role-2",
          name: "manager",
          description: "Department Manager",
          permissions: ["read", "write", "manage_users", "manage_departments", "use_calculator", "manage_workflows"],
          companyId: "comp-1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "role-3",
          name: "employee",
          description: "Regular Employee",
          permissions: ["read", "use_calculator"],
          companyId: "comp-1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "role-4",
          name: "admin",
          description: "System Administrator",
          permissions: [
            "read",
            "write",
            "delete",
            "manage_users",
            "manage_companies",
            "manage_departments",
            "manage_roles",
            "use_calculator",
            "view_analytics",
            "manage_workflows",
          ],
          companyId: "comp-2",
          createdAt: new Date().toISOString(),
        },
      ]
      roles.forEach((role) => this.saveRole(role))

      // Create sample users
      const users: User[] = [
        {
          id: "user-1",
          username: "admin",
          email: "admin@acme.com",
          role: "admin",
          department: "IT Department",
          companyId: "comp-1",
          permissions: [
            "read",
            "write",
            "delete",
            "manage_users",
            "manage_companies",
            "manage_departments",
            "manage_roles",
            "use_calculator",
            "view_analytics",
            "manage_workflows",
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: "user-2",
          username: "manager",
          email: "manager@acme.com",
          role: "manager",
          department: "HR Department",
          companyId: "comp-1",
          permissions: ["read", "write", "manage_users", "manage_departments", "use_calculator", "manage_workflows"],
          createdAt: new Date().toISOString(),
        },
        {
          id: "user-3",
          username: "employee",
          email: "employee@acme.com",
          role: "employee",
          department: "IT Department",
          companyId: "comp-1",
          permissions: ["read", "use_calculator"],
          createdAt: new Date().toISOString(),
        },
      ]
      users.forEach((user) => this.saveUser(user))

      const sampleCredentials: UserCredentials[] = [
        { username: "admin", password: "password", createdAt: new Date().toISOString() },
        { username: "manager", password: "password", createdAt: new Date().toISOString() },
        { username: "employee", password: "password", createdAt: new Date().toISOString() },
      ]
      sampleCredentials.forEach((cred) => this.saveUserCredentials(cred.username, cred.password))
    }
  }
}

export const storageService = new StorageService()

// Initialize sample data on first load
if (typeof window !== "undefined") {
  storageService.initializeSampleData()
}
