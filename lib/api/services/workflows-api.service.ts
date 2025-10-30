/**
 * Core Workflows API Service (Template Workflows)
 * - Responsible only for template workflow endpoints under /workflows
 * - Keeps separation from dynamic builder APIs
 */

import { apiClient } from "../http-client"
import { API_ENDPOINTS } from "../config"
import type { WorkflowApiResponse } from "@/lib/api/types/workflow.types"

export const workflowsApi = {
  async list(activeOnly: boolean = true): Promise<WorkflowApiResponse[]> {
    return await apiClient.get<WorkflowApiResponse[]>(API_ENDPOINTS.workflows.list(), {
      params: { active_only: activeOnly },
    })
  },

  async get(workflow_id: string): Promise<WorkflowApiResponse> {
    return await apiClient.get<WorkflowApiResponse>(API_ENDPOINTS.workflows.get(workflow_id))
  },

  async update(
    workflow_id: string,
    data: any
  ): Promise<WorkflowApiResponse> {
    // Sends full or partial payload to core /workflows/{id}
    return await apiClient.put<WorkflowApiResponse>(API_ENDPOINTS.workflows.update(workflow_id), data)
  },

  async delete(workflow_id: string): Promise<void> {
    return await apiClient.delete<void>(API_ENDPOINTS.workflows.delete(workflow_id))
  },
}


