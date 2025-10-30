/**
 * Dynamic Workflow Builder API Service
 * Complete CRUD operations for dynamic workflows with table generation
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only handles dynamic workflow operations
 * - Open/Closed: Extensible without modification
 */

import { apiClient } from "../http-client"
import { API_ENDPOINTS } from "../config"
import {
  DynamicWorkflowCreate,
  DynamicWorkflowResponse,
  TableSchemaResponse,
  WorkflowMigrationRequest,
  WorkflowMigrationResponse,
  WorkflowTableDataResponse,
  WorkflowBuilderValidationResponse,
} from "../types/dynamic-workflow.types"

export const dynamicWorkflowAPI = {
  /**
   * Create a new dynamic workflow with automatic table generation
   */
  async createWorkflow(data: DynamicWorkflowCreate): Promise<DynamicWorkflowResponse> {
    return await apiClient.post<DynamicWorkflowResponse>(
      API_ENDPOINTS.dynamicWorkflows.create(),
      data
    )
  },

  /**
   * Get a specific dynamic workflow by ID
   */
  async getWorkflow(id: string): Promise<DynamicWorkflowResponse> {
    return await apiClient.get<DynamicWorkflowResponse>(
      API_ENDPOINTS.dynamicWorkflows.get(id)
    )
  },

  /**
   * Update a dynamic workflow
   */
  async updateWorkflow(
    id: string,
    data: Partial<DynamicWorkflowCreate>
  ): Promise<DynamicWorkflowResponse> {
    return await apiClient.put<DynamicWorkflowResponse>(
      API_ENDPOINTS.dynamicWorkflows.update(id),
      data
    )
  },

  /**
   * Delete a dynamic workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    return await apiClient.delete<void>(
      API_ENDPOINTS.dynamicWorkflows.delete(id)
    )
  },

  /**
   * Get the generated table schema for a workflow
   */
  async getTableSchema(id: string): Promise<TableSchemaResponse> {
    return await apiClient.get<TableSchemaResponse>(
      API_ENDPOINTS.dynamicWorkflows.getTableSchema(id)
    )
  },

  /**
   * Migrate a workflow table to a new schema
   */
  async migrateWorkflow(
    id: string,
    data: WorkflowMigrationRequest
  ): Promise<WorkflowMigrationResponse> {
    return await apiClient.put<WorkflowMigrationResponse>(
      API_ENDPOINTS.dynamicWorkflows.migrate(id),
      data
    )
  },

  /**
   * Regenerate the database table for a workflow
   */
  async regenerateTable(
    id: string,
    forceRecreate: boolean = false
  ): Promise<TableSchemaResponse> {
    return await apiClient.post<TableSchemaResponse>(
      API_ENDPOINTS.dynamicWorkflows.regenerateTable(id),
      {},
      {
        params: { force_recreate: forceRecreate },
      }
    )
  },

  /**
   * Get data from the workflow's dynamic table
   */
  async getTableData(
    id: string,
    companyId?: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<WorkflowTableDataResponse> {
    return await apiClient.get<WorkflowTableDataResponse>(
      API_ENDPOINTS.dynamicWorkflows.getTableData(id),
      {
        params: {
          company_id: companyId,
          limit,
          offset,
        },
      }
    )
  },

  /**
   * Delete the database table associated with a workflow
   */
  async deleteTable(id: string): Promise<void> {
    return await apiClient.delete<void>(
      API_ENDPOINTS.dynamicWorkflows.deleteTable(id),
      {
        params: { confirm_deletion: true },
      }
    )
  },

  /**
   * Validate workflow structure and table compatibility
   */
  async validateWorkflow(id: string): Promise<WorkflowBuilderValidationResponse> {
    return await apiClient.get<WorkflowBuilderValidationResponse>(
      API_ENDPOINTS.dynamicWorkflows.validate(id)
    )
  },
}
