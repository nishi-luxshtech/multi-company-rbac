/**
 * API Services
 * Centralized API services for companies, users, and general API operations
 * Uses the existing HTTP client infrastructure
 */

import { apiClient } from "./api/http-client"
import { API_CONFIG } from "./api/config"
import { dynamicWorkflowAPI } from "./api/services/dynamic-workflow-api.service"
import type { AllMasterTableDataResponse } from "./api/types/dynamic-workflow.types"

// ===== Types =====

export interface User {
  id: number | string
  username: string
  email?: string
  role: "user" | "admin" | "super_admin"
  permissions?: string[]
  is_active?: boolean
  company_id?: number | null
}

export interface Company {
  id: number
  name: string
  company_code?: string
  association_no?: string
  is_active?: boolean
  [key: string]: any // Allow additional properties
}

export interface CompanyListResponse {
  results: Company[]
  total_count: number
  limit: number
  offset: number
  has_more: boolean
}

export interface Address {
  id?: number
  company_id: number
  address_type?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  [key: string]: any
}

export interface CommunicationMethod {
  id?: number
  company_id: number
  comm_type?: string
  comm_value?: string
  is_primary?: boolean
  [key: string]: any
}

export interface Employee {
  id?: number
  company_id: number
  employee_id?: string
  name?: string
  email?: string
  phone?: string
  role?: string
  [key: string]: any
}

// ===== Auth API =====

export const authAPI = {
  /**
   * Login user and get access token
   */
  async login(credentials: { username: string; password: string }): Promise<{
    access_token: string
    token_type: string
  }> {
    // OAuth2 password flow uses form data
    const formData = new URLSearchParams()
    formData.append("username", credentials.username)
    formData.append("password", credentials.password)

    return await apiClient.post<{ access_token: string; token_type: string }>(
      "/auth/token",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
  },

  /**
   * Logout user and invalidate token
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    return await apiClient.post<{ success: boolean; message: string }>("/auth/logout")
  },
}

// ===== Company API =====

export const companyAPI = {
  /**
   * Get all companies
   * Now uses workflow-based endpoint: /workflows/builder/table-data/all
   * Transforms the response to match the expected CompanyListResponse format
   */
  async getAllCompanies(
    limit: number = 100,
    offset: number = 0,
    fullData: boolean = true
  ): Promise<CompanyListResponse> {
    try {
      // Use workflow-based endpoint to get all master table data
      const response: AllMasterTableDataResponse = await dynamicWorkflowAPI.getAllMasterTableData(
        undefined, // company_id - get all companies
        limit, // limit_per_workflow
        offset, // offset_per_workflow
        fullData // group_by_step - if fullData is true, organize by steps
      )

      // Validate response structure
      if (!response || typeof response !== 'object') {
        console.warn("Invalid response structure from getAllMasterTableData:", response)
        return {
          results: [],
          total_count: 0,
          limit,
          offset,
          has_more: false,
        }
      }

      // Flatten all records from all workflows into a single array
      const allRecords: Company[] = []
      
      // Handle case where workflow_data might be undefined or null
      const workflowData = response.workflow_data || {}
      
      Object.values(workflowData).forEach((workflow) => {
        if (workflow && workflow.records && Array.isArray(workflow.records) && workflow.records.length > 0) {
          workflow.records.forEach((record: any) => {
            if (!record || typeof record !== 'object') {
              return // Skip invalid records
            }
            
            // Transform record to Company format
            // Handle both flat records and grouped-by-step records
            let flatRecord = record
            if (record.steps && Array.isArray(record.steps)) {
              // Flatten grouped-by-step records
              flatRecord = { ...record }
              delete flatRecord.steps
              record.steps.forEach((step: any) => {
                if (step.fields && typeof step.fields === 'object') {
                  Object.entries(step.fields).forEach(([fieldName, fieldData]: [string, any]) => {
                    if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
                      flatRecord[fieldName] = fieldData.value
                    } else {
                      flatRecord[fieldName] = fieldData
                    }
                  })
                }
              })
            }
            
            const company: Company = {
              id: flatRecord.company_id || flatRecord.id || 0,
              name: flatRecord.company_name || flatRecord.name || "N/A",
              company_code: flatRecord.company_code || undefined,
              association_no: flatRecord.association_number || flatRecord.association_no || undefined,
              is_active: flatRecord.is_active !== undefined ? flatRecord.is_active : true,
              // Include all other fields from the record
              ...flatRecord,
            }
            allRecords.push(company)
          })
        }
      })

      // Apply client-side pagination if needed (backend already applies per-workflow pagination)
      // Since we're getting data from multiple workflows, we need to handle pagination here
      const totalCount = allRecords.length
      const paginatedResults = allRecords.slice(offset, offset + limit)
      const hasMore = offset + limit < totalCount

      return {
        results: paginatedResults,
        total_count: totalCount,
        limit,
        offset,
        has_more: hasMore,
      }
    } catch (error: any) {
      // Enhanced error logging
      console.error("Error fetching companies from workflow endpoint:", {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      })
      
      // Re-throw authentication/authorization errors so they can be handled upstream
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        throw error
      }
      
      // Return empty response on other errors to maintain compatibility
      return {
        results: [],
        total_count: 0,
        limit,
        offset,
        has_more: false,
      }
    }
  },

  /**
   * Get company by ID
   */
  async getCompanyById(companyId: number): Promise<Company> {
    return await apiClient.get<Company>(`/api/companies/${companyId}`)
  },

  /**
   * Create a new company
   */
  async createCompany(companyData: Partial<Company>): Promise<Company> {
    return await apiClient.post<Company>("/api/companies", companyData)
  },

  /**
   * Update a company
   */
  async updateCompany(companyId: number, companyData: Partial<Company>): Promise<Company> {
    return await apiClient.put<Company>(`/api/companies/${companyId}`, companyData)
  },

  /**
   * Delete a company
   */
  async deleteCompany(companyId: number): Promise<void> {
    return await apiClient.delete<void>(`/api/companies/${companyId}`)
  },

  /**
   * Search companies
   */
  async searchCompanies(
    search: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<CompanyListResponse> {
    return await apiClient.get<CompanyListResponse>("/api/companies/find", {
      params: {
        search,
        limit,
        offset,
      },
    })
  },
}

// ===== User API =====

export const userAPI = {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return await apiClient.get<User[]>("/api/users")
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    return await apiClient.get<User>(`/api/users/${userId}`)
  },

  /**
   * Create a new user
   */
  async createUser(userData: {
    username: string
    password: string
    role: "user" | "admin"
    permissions?: string[]
    company_id?: number | null
    email?: string
  }): Promise<User> {
    return await apiClient.post<User>("/api/users", userData)
  },

  /**
   * Update a user
   */
  async updateUser(
    userId: number | string,
    userData: {
      username?: string
      password?: string
      role?: "user" | "admin"
      permissions?: string[]
      company_id?: number | null
      email?: string
    }
  ): Promise<User> {
    return await apiClient.put<User>(`/api/users/${userId}`, userData)
  },

  /**
   * Delete a user
   */
  async deleteUser(userId: number | string): Promise<void> {
    return await apiClient.delete<void>(`/api/users/${userId}`)
  },
}

// ===== Address API =====

export const addressAPI = {
  /**
   * Add company address
   */
  async addAddress(companyId: number, addressData: Partial<Address>): Promise<Address> {
    return await apiClient.post<Address>(`/api/companies/${companyId}/addresses`, addressData)
  },

  /**
   * Update company address
   */
  async updateAddress(
    companyId: number,
    addressId: number,
    addressData: Partial<Address>
  ): Promise<Address> {
    return await apiClient.put<Address>(
      `/api/companies/${companyId}/addresses/${addressId}`,
      addressData
    )
  },

  /**
   * Delete company address
   */
  async deleteAddress(companyId: number, addressId: number): Promise<void> {
    return await apiClient.delete<void>(`/api/companies/${companyId}/addresses/${addressId}`)
  },
}

// ===== Communication API =====

export const communicationAPI = {
  /**
   * Add company communication method
   */
  async addCommMethod(
    companyId: number,
    commData: Partial<CommunicationMethod>
  ): Promise<CommunicationMethod> {
    return await apiClient.post<CommunicationMethod>(
      `/api/companies/${companyId}/comm-methods`,
      commData
    )
  },

  /**
   * Update company communication method
   */
  async updateCommMethod(
    companyId: number,
    commId: number,
    commData: Partial<CommunicationMethod>
  ): Promise<CommunicationMethod> {
    return await apiClient.put<CommunicationMethod>(
      `/api/companies/${companyId}/comm-methods/${commId}`,
      commData
    )
  },

  /**
   * Delete company communication method
   */
  async deleteCommMethod(companyId: number, commId: number): Promise<void> {
    return await apiClient.delete<void>(`/api/companies/${companyId}/comm-methods/${commId}`)
  },
}

// ===== Employee API =====

export const employeeAPI = {
  /**
   * Add company employee
   */
  async addEmployee(companyId: number, employeeData: Partial<Employee>): Promise<Employee> {
    return await apiClient.post<Employee>(`/api/companies/${companyId}/employees`, employeeData)
  },

  /**
   * Update company employee
   */
  async updateEmployee(
    companyId: number,
    employeeId: number,
    employeeData: Partial<Employee>
  ): Promise<Employee> {
    return await apiClient.put<Employee>(
      `/api/companies/${companyId}/employees/${employeeId}`,
      employeeData
    )
  },

  /**
   * Delete company employee
   */
  async deleteEmployee(companyId: number, employeeId: number): Promise<void> {
    return await apiClient.delete<void>(`/api/companies/${companyId}/employees/${employeeId}`)
  },
}

// ===== General API Service =====

export const apiService = {
  /**
   * Get company by ID (alias for companyAPI.getCompanyById)
   */
  async getCompanyById(companyId: number): Promise<Company> {
    return companyAPI.getCompanyById(companyId)
  },

  /**
   * Get all companies (alias for companyAPI.getAllCompanies)
   */
  async getAllCompanies(
    limit?: number,
    offset?: number,
    fullData?: boolean
  ): Promise<CompanyListResponse> {
    return companyAPI.getAllCompanies(limit, offset, fullData)
  },

  /**
   * Create company (alias for companyAPI.createCompany)
   */
  async createCompany(companyData: Partial<Company>): Promise<Company> {
    return companyAPI.createCompany(companyData)
  },

  /**
   * Update company (alias for companyAPI.updateCompany)
   */
  async updateCompany(companyId: number, companyData: Partial<Company>): Promise<Company> {
    return companyAPI.updateCompany(companyId, companyData)
  },

  /**
   * Delete company (alias for companyAPI.deleteCompany)
   */
  async deleteCompany(companyId: number): Promise<void> {
    return companyAPI.deleteCompany(companyId)
  },
}

