/**
 * Workflow Relationships API Service
 * Complete CRUD operations for workflow step relationships
 */

import { apiClient } from "../http-client"
import type {
  StepRelationship,
  StepDomainMapping,
  WorkflowRelationships,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  CreateDomainMappingRequest,
  RelationshipValidation,
} from "../types/workflow-relationships.types"

export const workflowRelationshipsAPI = {
  /**
   * Get all relationships for a workflow
   */
  async getWorkflowRelationships(workflowId: string): Promise<WorkflowRelationships> {
    return await apiClient.get<WorkflowRelationships>(
      `/workflows/${workflowId}/relationships`
    )
  },

  /**
   * Create a new relationship between steps
   */
  async createRelationship(
    workflowId: string,
    data: Omit<CreateRelationshipRequest, "workflow_id">
  ): Promise<StepRelationship> {
    return await apiClient.post<StepRelationship>(
      `/workflows/${workflowId}/relationships`,
      {
        ...data,
        workflow_id: workflowId,
      }
    )
  },

  /**
   * Get a specific relationship by ID
   */
  async getRelationship(relationshipId: string): Promise<StepRelationship> {
    return await apiClient.get<StepRelationship>(
      `/workflows/relationships/${relationshipId}`
    )
  },

  /**
   * Update a relationship
   */
  async updateRelationship(
    relationshipId: string,
    data: UpdateRelationshipRequest
  ): Promise<StepRelationship> {
    return await apiClient.put<StepRelationship>(
      `/workflows/relationships/${relationshipId}`,
      data
    )
  },

  /**
   * Delete a relationship
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    return await apiClient.delete<void>(
      `/workflows/relationships/${relationshipId}`
    )
  },

  /**
   * Create a domain mapping for a step
   */
  async createDomainMapping(
    workflowId: string,
    stepId: string,
    data: Omit<CreateDomainMappingRequest, "workflow_id" | "step_id">
  ): Promise<StepDomainMapping> {
    return await apiClient.post<StepDomainMapping>(
      `/workflows/${workflowId}/steps/${stepId}/domain-mapping`,
      {
        ...data,
        workflow_id: workflowId,
        step_id: stepId,
      }
    )
  },

  /**
   * Get domain mapping for a step
   */
  async getDomainMapping(stepId: string): Promise<StepDomainMapping | null> {
    try {
      return await apiClient.get<StepDomainMapping>(
        `/workflows/steps/${stepId}/domain-mapping`
      )
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Update a domain mapping
   */
  async updateDomainMapping(
    stepId: string,
    data: {
      domain_table?: string
      primary_key?: string
      field_mappings?: Record<string, string>
    }
  ): Promise<StepDomainMapping> {
    return await apiClient.put<StepDomainMapping>(
      `/workflows/steps/${stepId}/domain-mapping`,
      data
    )
  },

  /**
   * Delete a domain mapping
   */
  async deleteDomainMapping(stepId: string): Promise<void> {
    return await apiClient.delete<void>(
      `/workflows/steps/${stepId}/domain-mapping`
    )
  },

  /**
   * Validate all relationships for a workflow
   */
  async validateRelationships(workflowId: string): Promise<RelationshipValidation> {
    return await apiClient.get<RelationshipValidation>(
      `/workflows/${workflowId}/relationships/validate`
    )
  },
}

