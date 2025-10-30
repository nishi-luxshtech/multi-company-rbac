/**
 * API Configuration for Dynamic Workflow Builder
 * Centralized configuration for dynamic workflow API endpoints
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://erp-r.onrender.com",
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  timeout: 30000, // 30 seconds
} as const

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: "/auth/token",
    logout: "/auth/logout",
  },
  
  // Core Workflow Template endpoints (not builder)
  workflows: {
    base: "/workflows",
    list: () => "/workflows/",
    get: (workflow_id: string) => `/workflows/${workflow_id}`,
    update: (workflow_id: string) => `/workflows/${workflow_id}`,
    delete: (workflow_id: string) => `/workflows/${workflow_id}`,
    validate: (id: string) => `/workflows/${id}/validate`,
  },
  
  // Dynamic Workflow Builder endpoints (primary focus)
  dynamicWorkflows: {
    base: "/workflows/builder",
    create: () => "/workflows/builder/",
    get: (id: string) => `/workflows/builder/${id}`,
    update: (id: string) => `/workflows/builder/${id}`,
    delete: (id: string) => `/workflows/builder/${id}`,
    getTableSchema: (id: string) => `/workflows/builder/${id}/table-schema`,
    migrate: (id: string) => `/workflows/builder/${id}/migrate`,
    regenerateTable: (id: string) => `/workflows/builder/${id}/regenerate-table`,
    getTableData: (id: string) => `/workflows/builder/${id}/table-data`,
    deleteTable: (id: string) => `/workflows/builder/${id}/table`,
    validate: (id: string) => `/workflows/builder/${id}/validation`,
  },
  
  // Workflow instance endpoints (for running workflows)
  workflowInstances: {
    create: () => "/workflows/instances",
    get: (id: string) => `/workflows/instances/${id}`,
    getCompanyInstances: (companyId: number) => `/workflows/companies/${companyId}/instances`,
    submitStep: (id: string) => `/workflows/instances/${id}/submit-step`,
  },
} as const

export const getFullUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
  return `${API_CONFIG.baseURL}/${cleanEndpoint}`
}