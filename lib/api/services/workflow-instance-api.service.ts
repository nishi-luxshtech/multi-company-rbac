/**
 * Workflow Instance API Service
 * Operations for running workflow instances (executing workflows for companies)
 */

import { apiClient } from "../http-client"
import { API_ENDPOINTS } from "../config"
import {
  WorkflowInstanceCreate,
  WorkflowInstanceResponse,
  StepDataSubmit,
  StepSubmitResponse,
} from "../types/dynamic-workflow.types"

export const workflowInstanceAPI = {
  /**
   * Create a workflow instance for a company
   */
  async createInstance(
    data: WorkflowInstanceCreate
  ): Promise<WorkflowInstanceResponse> {
    return await apiClient.post<WorkflowInstanceResponse>(
      API_ENDPOINTS.workflowInstances.create(),
      data
    )
  },

  /**
   * Get a workflow instance by ID
   */
  async getInstance(id: string): Promise<WorkflowInstanceResponse> {
    return await apiClient.get<WorkflowInstanceResponse>(
      API_ENDPOINTS.workflowInstances.get(id)
    )
  },

  /**
   * Get all workflow instances for a company
   */
  async getCompanyInstances(
    companyId: number
  ): Promise<WorkflowInstanceResponse[]> {
    return await apiClient.get<WorkflowInstanceResponse[]>(
      API_ENDPOINTS.workflowInstances.getCompanyInstances(companyId)
    )
  },

  /**
   * Submit data for a workflow step
   */
  async submitStepData(
    instanceId: string,
    data: StepDataSubmit
  ): Promise<StepSubmitResponse> {
    return await apiClient.post<StepSubmitResponse>(
      API_ENDPOINTS.workflowInstances.submitStep(instanceId),
      data
    )
  },
}
