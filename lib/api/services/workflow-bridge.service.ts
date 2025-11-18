/**
 * Workflow Bridge Service
 * Bridges dynamic workflow APIs with existing frontend workflow interface
 * Maps between API types and frontend types for seamless integration
 */

import { dynamicWorkflowAPI } from "./dynamic-workflow-api.service"
import { workflowsApi } from "./workflows-api.service"
import type { WorkflowApiResponse } from "@/lib/api/types/workflow.types"
import {
  DynamicWorkflowResponse,
  DynamicWorkflowCreate,
  FrontendWorkflow,
  FrontendWorkflowStep,
  FrontendWorkflowField,
  FieldType,
} from "../types/dynamic-workflow.types"

export class WorkflowBridgeService {
  /**
   * Convert API DynamicWorkflowResponse to frontend Workflow type
   */
  static mapApiToFrontend(apiWorkflow: DynamicWorkflowResponse): FrontendWorkflow {
    const steps: FrontendWorkflowStep[] = apiWorkflow.steps.map((apiStep) => ({
      id: apiStep.id,
      name: apiStep.name,
      description: apiStep.description || "",
      order: apiStep.order,
      fields: apiStep.fields.map((apiField) => {
        const field: FrontendWorkflowField = {
          id: apiField.id,
          type: apiField.type,
          label: apiField.label,
          placeholder: apiField.placeholder,
          required: apiField.required,
        }

        // Map validation rules if present
        if (apiField.validation) {
          field.validation = {
            min: apiField.validation.min_value,
            max: apiField.validation.max_value,
            pattern: apiField.validation.pattern,
          }

          // Map options if present
          if (apiField.validation.options) {
            field.options = apiField.validation.options
          }
        }

        // Map additional config
        if (apiField.default_value !== undefined) {
          field.config = {
            step: 1, // Default step
            multiple: Array.isArray(apiField.default_value),
          }
        }

        return field
      }),
    }))

    return {
      id: apiWorkflow.id,
      name: apiWorkflow.name,
      description: apiWorkflow.description || "",
      steps,
      isActive: true, // Dynamic workflows are always active
      createdAt: apiWorkflow.created_at,
      updatedAt: apiWorkflow.updated_at || apiWorkflow.created_at,
      tableName: apiWorkflow.table_name,
      triggerType: "manual",
      category: "custom",
    }
  }

  /**
   * Convert frontend Workflow to API DynamicWorkflowCreate type
   */
  static mapFrontendToApi(
    workflow: Omit<FrontendWorkflow, "id" | "createdAt" | "updatedAt">
  ): DynamicWorkflowCreate {
    return {
      name: workflow.name,
      description: workflow.description,
      generate_table: true, // Always generate table for dynamic workflows
      table_name: workflow.tableName,
      steps: workflow.steps.map((step) => ({
        name: step.name,
        order: step.order,
        description: step.description,
        fields: step.fields.map((field) => ({
          name: field.id,
          label: field.label,
          type: field.type,
          order: 1, // Default order
          required: field.required,
          placeholder: field.placeholder,
          validation: field.validation
            ? {
                min_value: field.validation.min,
                max_value: field.validation.max,
                pattern: field.validation.pattern,
                required: field.required,
                options: field.options,
              }
            : undefined,
        })),
      })),
    }
  }

  /**
   * Get all dynamic workflows (mapped to frontend format)
   */
  static async getAllWorkflows(): Promise<FrontendWorkflow[]> {
    try {
      // Use dynamic workflow builder endpoint: GET /workflows/builder/?active_only=true
      // This returns DynamicWorkflowResponse[] which is the correct format
      const { dynamicWorkflowAPI } = await import("./dynamic-workflow-api.service")
      const apiWorkflows = await dynamicWorkflowAPI.listWorkflows(true)
      
      return apiWorkflows.map((wf) => ({
        id: wf.id,
        name: wf.name,
        description: wf.description || "",
        steps: (wf.steps || []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          order: s.order || 0, // DynamicWorkflowStep uses 'order' field
          fields: (s.fields || []).map((f) => {
            const vr = f.validation
            const rawOptions = vr?.options || f.options
            const normalizedOptions = Array.isArray(rawOptions)
              ? rawOptions.map((opt: any) => (typeof opt === "string" ? opt : opt?.label ?? opt?.value)).filter(Boolean)
              : undefined
            return {
              id: f.id,
              label: f.label,
              type: f.type as any,
              required: f.required,
              placeholder: f.placeholder,
              validation: vr
                ? {
                    min: vr.min ?? vr.min_value ?? vr.min_length,
                    max: vr.max ?? vr.max_value ?? vr.max_length,
                    pattern: vr.pattern,
                    accept: undefined,
                  }
                : undefined,
              options: normalizedOptions,
            }
          }),
        })),
        isActive: wf.is_active ?? true,
        createdAt: wf.created_at,
        updatedAt: wf.updated_at || wf.created_at,
        triggerType: "manual",
        category: "custom",
      }))
    } catch (error) {
      console.error("Failed to get workflows:", error)
      throw error
    }
  }

  /**
   * Get a specific workflow by ID
   */
  static async getWorkflowById(id: string): Promise<FrontendWorkflow | null> {
    try {
      const wf: WorkflowApiResponse = await workflowsApi.get(id)
      return {
        id: wf.id,
        name: wf.name,
        description: wf.description || "",
        steps: (wf.steps || []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          order: s.step_order,
          fields: (s.fields || []).map((f) => {
            const vr = (f as any).validation_rules || (f as any).validation || undefined
            const rawOptions = vr?.options || (f as any).options
            const normalizedOptions = Array.isArray(rawOptions)
              ? rawOptions.map((opt: any) => (typeof opt === "string" ? opt : opt?.label ?? opt?.value)).filter(Boolean)
              : undefined
            return {
              id: (f as any).id,
              label: (f as any).label ?? (f as any).field_label ?? (f as any).field_name ?? "",
              type: ((f as any).type ?? (f as any).field_type ?? "text") as any,
              required: (f as any).required ?? (f as any).is_required ?? false,
              placeholder: (f as any).placeholder,
              validation: vr
                ? {
                    min: vr.min ?? vr.min_value ?? vr.min_length,
                    max: vr.max ?? vr.max_value ?? vr.max_length,
                    pattern: vr.pattern,
                    accept: undefined,
                  }
                : undefined,
              options: normalizedOptions,
            }
          }),
        })),
        isActive: wf.is_active ?? true,
        createdAt: wf.created_at,
        updatedAt: wf.updated_at || wf.created_at,
        triggerType: "manual",
        category: "custom",
      }
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Create a new workflow
   */
  static async createWorkflow(
    workflow: Omit<FrontendWorkflow, "id" | "createdAt" | "updatedAt">
  ): Promise<FrontendWorkflow> {
    const createData = this.mapFrontendToApi(workflow)
    const apiWorkflow = await dynamicWorkflowAPI.createWorkflow(createData)
    return this.mapApiToFrontend(apiWorkflow)
  }

  /**
   * Update a workflow
   */
  static async updateWorkflow(
    id: string,
    updates: Partial<FrontendWorkflow>
  ): Promise<FrontendWorkflow | null> {
    try {
      // Build a single payload compatible with core /workflows/{id}
      const payload: any = {}
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.isActive !== undefined) payload.is_active = updates.isActive
      if (updates.steps !== undefined) {
        payload.steps = updates.steps.map((step) => ({
          name: step.name,
          description: step.description,
          step_order: step.order,
          fields: step.fields.map((field) => {
            const t: any = field.type
            const backendType = t === "multiselect" ? "multi_select" : t
            return {
              field_name: field.id,
              field_label: field.label,
              field_type: backendType,
              field_order: 1,
              is_required: field.required,
              placeholder: field.placeholder,
              validation_rules: field.validation
                ? {
                    min_length: field.validation.min,
                    max_length: field.validation.max,
                    min_value: field.validation.min,
                    max_value: field.validation.max,
                    pattern: field.validation.pattern,
                    options: field.options,
                  }
                : undefined,
            }
          }),
        }))
      }

      await workflowsApi.update(id, payload)

      // Fetch full object to ensure we have steps
      const full = await workflowsApi.get(id)
      return {
        id: full.id,
        name: full.name,
        description: full.description || "",
        steps: (full.steps || []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          order: s.step_order,
          fields: (s.fields || []).map((f) => ({
            id: (f as any).id,
            label: (f as any).label ?? (f as any).field_label ?? (f as any).field_name ?? "",
            type: ((f as any).type ?? (f as any).field_type ?? "text") as any,
            required: (f as any).required ?? (f as any).is_required ?? false,
          })),
        })),
        isActive: full.is_active ?? updates.isActive ?? true,
        createdAt: full.created_at,
        updatedAt: full.updated_at || full.created_at,
        triggerType: "manual",
        category: "custom",
      }
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Delete a workflow
   */
  static async deleteWorkflow(id: string): Promise<boolean> {
    try {
      await workflowsApi.delete(id)
      return true
    } catch (error: any) {
      if (error.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Get active workflows (all dynamic workflows are considered active)
   */
  static async getActiveWorkflows(): Promise<FrontendWorkflow[]> {
    return this.getAllWorkflows()
  }

  /**
   * Validate a workflow
   */
  static async validateWorkflow(id: string): Promise<boolean> {
    try {
      const validation = await dynamicWorkflowAPI.validateWorkflow(id)
      return validation.is_valid
    } catch (error) {
      console.error("Failed to validate workflow:", error)
      return false
    }
  }
}
