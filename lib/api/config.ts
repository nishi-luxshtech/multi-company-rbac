/**
 * API Configuration for Dynamic Workflow Builder
 * Centralized configuration for dynamic workflow API endpoints
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/",
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || "v1",
  timeout: 30000, // 30 seconds
} as const

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: "/auth/token",
    logout: "/auth/logout",
  },
  
  // Core Workflow Template endpoints (using workflow builder endpoints)
  workflows: {
    base: "/workflows/builder",
    list: () => "/workflows/builder/",
    get: (workflow_id: string) => `/workflows/builder/${workflow_id}`,
    update: (workflow_id: string) => `/workflows/builder/${workflow_id}`,
    delete: (workflow_id: string) => `/workflows/builder/${workflow_id}`,
    validate: (id: string) => `/workflows/builder/${id}/validation`,
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
    getTableRecord: (id: string, recordId: string) => `/workflows/builder/${id}/table-data/${recordId}`,
    updateTableRecord: (id: string, recordId: string) => `/workflows/builder/${id}/table-data/${recordId}`,
    getAllMasterTableData: () => "/workflows/builder/table-data/all",
    createTableRecord: (id: string) => `/workflows/builder/${id}/table-data`,
    validateTableData: (id: string) => `/workflows/builder/${id}/table-data/validate`,
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
  // If endpoint already includes /api/v1, use it as-is
  // Otherwise, check if it's a workflow builder endpoint (starts with workflows/builder)
  // Workflow builder endpoints don't need /api/v1 prefix
  if (cleanEndpoint.startsWith("api/")) {
    return `${API_CONFIG.baseURL}/${cleanEndpoint}`
  }
  // Workflow builder endpoints are at root level
  if (cleanEndpoint.startsWith("workflows/builder")) {
    return `${API_CONFIG.baseURL}/${cleanEndpoint}`
  }
  // Other endpoints need /api/v1 prefix
  return `${API_CONFIG.baseURL}/api/${API_CONFIG.apiVersion}/${cleanEndpoint}`
}