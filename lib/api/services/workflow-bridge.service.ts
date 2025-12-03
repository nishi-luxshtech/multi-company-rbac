/**
 * Workflow Bridge Service
 * Bridges dynamic workflow APIs with existing frontend workflow interface
 * Maps between API types and frontend types for seamless integration
 */

import { dynamicWorkflowAPI } from "./dynamic-workflow-api.service"
import { workflowsApi } from "./workflows-api.service"
import type { WorkflowApiResponse, WorkflowFieldApi, WorkflowStepApi } from "@/lib/api/types/workflow.types"
import {
  DynamicWorkflowResponse,
  DynamicWorkflowCreate,
  FrontendWorkflow,
  FrontendWorkflowStep,
  FrontendWorkflowField,
  FieldType,
  ValidationRule,
  DynamicWorkflowField,
} from "../types/dynamic-workflow.types"

export class WorkflowBridgeService {
  private static optionEnabledTypes = ["select", "radio", "combobox", "multiselect", "multi_select"]

  private static slugifyFieldName(value?: string, fallback: string = "field"): string {
    const normalized = (value ?? "").toString().trim().toLowerCase()
    let slug = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    if (!slug) {
      slug = `${fallback}_${Math.random().toString(36).substring(2, 8)}`
    }
    if (/^[0-9]/.test(slug)) {
      slug = `${fallback}_${slug}`
    }
    return slug.slice(0, 60)
  }

  private static getOrGenerateFieldName(field: FrontendWorkflowField, usedNames: Set<string>): string {
    const source = field.name || field.label || field.id
    let base = WorkflowBridgeService.slugifyFieldName(source, "field")
    if (!base) {
      base = WorkflowBridgeService.slugifyFieldName(field.id, "field")
    }
    let candidate = base
    let counter = 2
    while (usedNames.has(candidate)) {
      candidate = `${base}_${counter++}`
    }
    usedNames.add(candidate)
    return candidate
  }

  private static fieldSupportsOptions(fieldType?: string) {
    if (!fieldType) return false
    const normalized = fieldType.replace("-", "_").toLowerCase()
    return WorkflowBridgeService.optionEnabledTypes.includes(normalized)
  }
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
          name: apiField.name || (apiField as any).field_name || apiField.id, // Preserve field name (field_name from backend) with fallbacks
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
    const usedFieldNames = new Set<string>()
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
          name: WorkflowBridgeService.getOrGenerateFieldName(field, usedFieldNames),
          label: field.label,
          type: field.type,
          order: 1, // Default order
          required: field.required,
          placeholder: field.placeholder,
          validation: (() => {
            const supportsOptions = WorkflowBridgeService.fieldSupportsOptions(field.type)
            const validationPayload: ValidationRule = {
              min_value: field.validation?.min,
              max_value: field.validation?.max,
              pattern: field.validation?.pattern,
                required: field.required,
            }
            if (supportsOptions && field.options?.length) {
              validationPayload.options = field.options
              }
            const hasValues = Object.values(validationPayload).some((value) => value !== undefined)
            return hasValues ? validationPayload : undefined
          })(),
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
          fields: (s.fields || [])
            .sort((a: DynamicWorkflowField, b: DynamicWorkflowField) => {
              // Sort fields by order from API to maintain correct sequence
              const orderA = a.order ?? 0
              const orderB = b.order ?? 0
              return orderA - orderB
            })
            .map((f: DynamicWorkflowField) => {
              const vr = f.validation
              const rawOptions = vr?.options || (f as any).options
              const normalizedOptions = Array.isArray(rawOptions)
                ? rawOptions.map((opt: any) => (typeof opt === "string" ? opt : opt?.label ?? opt?.value)).filter(Boolean)
                : undefined
              return {
                id: f.id,
                name: f.name || (f as any).field_name || f.id, // Preserve field name (field_name from backend) with fallbacks
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
          fields: (s.fields || [])
            .sort((a: WorkflowFieldApi, b: WorkflowFieldApi) => {
              // Sort fields by order from API to maintain correct sequence
              const orderA = (a as any).field_order ?? (a as any).order ?? 0
              const orderB = (b as any).field_order ?? (b as any).order ?? 0
              return orderA - orderB
            })
            .map((f: WorkflowFieldApi, index) => {
              const vr = (f as any).validation_rules || (f as any).validation || undefined
              const rawOptions = vr?.options || (f as any).options
              const normalizedOptions = Array.isArray(rawOptions)
                ? rawOptions.map((opt: any) => (typeof opt === "string" ? opt : opt?.label ?? opt?.value)).filter(Boolean)
                : undefined
              // CRITICAL: Preserve order from API (field_order or order), fallback to index+1
              const fieldOrder = (f as any).field_order ?? (f as any).order ?? (index + 1)
              return {
                id: (f as any).id,
                name: (f as any).name ?? (f as any).field_name ?? (f as any).id, // Preserve field name (field_name from backend) with fallbacks
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
                order: fieldOrder, // PRESERVE ORDER FROM API
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
        const usedFieldNames = new Set<string>()
        payload.steps = updates.steps.map((step) => ({
          name: step.name,
          description: step.description,
          step_order: step.order,
          // IMPORTANT: Use fields in their current array order
          // The array index (fieldIndex) becomes the sequential field_order (1, 2, 3...)
          fields: step.fields.map((field, fieldIndex) => {
            const t: any = field.type
            const backendType = t === "multiselect" ? "multi_select" : t
            const sequentialOrder = fieldIndex + 1
            const supportsOptions = WorkflowBridgeService.fieldSupportsOptions(field.type)
            const fieldName = WorkflowBridgeService.getOrGenerateFieldName(field, usedFieldNames)
            return {
              field_name: fieldName,
              field_label: field.label,
              field_type: backendType,
              field_order: sequentialOrder, // Sequential order: 1, 2, 3... based on array position
              is_required: field.required,
              placeholder: field.placeholder,
              validation_rules: (() => {
                const validationPayload: ValidationRule = {
                  min_length: field.validation?.min,
                  max_length: field.validation?.max,
                  min_value: field.validation?.min,
                  max_value: field.validation?.max,
                  pattern: field.validation?.pattern,
                }
                if (supportsOptions && field.options?.length) {
                  validationPayload.options = field.options
                }
                const hasValues = Object.values(validationPayload).some((value) => value !== undefined)
                return hasValues ? validationPayload : undefined
              })(),
            }
          }),
        }))
        
        // Debug: Log the payload to verify field_order values
        console.log("Workflow update payload - field orders:", 
          payload.steps.map((s: any) => ({
            step: s.name,
            fields: s.fields.map((f: any) => ({ label: f.field_label, order: f.field_order }))
          }))
        )
      }

      await workflowsApi.update(id, payload)

      // Fetch full object to ensure we have steps
      const full = await workflowsApi.get(id)
      return {
        id: full.id,
        name: full.name,
        description: full.description || "",
        steps: (full.steps || []).map((s: WorkflowStepApi) => ({
          id: s.id,
          name: s.name,
          description: s.description || "",
          order: s.step_order,
          fields: (s.fields || [])
            .sort((a: WorkflowFieldApi, b: WorkflowFieldApi) => {
              // Sort fields by order from API to maintain correct sequence
              const orderA = (a as any).field_order ?? (a as any).order ?? 0
              const orderB = (b as any).field_order ?? (b as any).order ?? 0
              return orderA - orderB
            })
            .map((f: WorkflowFieldApi) => ({
              id: f.id,
              name: (f as any).name ?? (f as any).field_name ?? undefined, // Preserve field name (field_name from backend)
              label: f.label ?? (f as any).field_label ?? (f as any).field_name ?? "",
              type: (f.type ?? (f as any).field_type ?? "text") as any,
              required: f.required ?? (f as any).is_required ?? false,
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
   * @param id - Workflow ID to delete
   * @param hardDelete - If true, permanently deletes workflow and table. If false, sets is_active=false (soft delete)
   * @returns Promise<boolean> - True if deleted successfully
   */
  static async deleteWorkflow(id: string, hardDelete: boolean = false): Promise<boolean> {
    try {
      await workflowsApi.delete(id, hardDelete)
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
