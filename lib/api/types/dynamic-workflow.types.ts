/**
 * TypeScript Types for Dynamic Workflow Builder API
 * Matching backend Pydantic schemas for /workflows/builder/ endpoints
 */

export type UUID = string

// ===== Field Types =====

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "phone"
  | "url"
  | "file"
  | "multi_select"
  | "rich_text"
  | "switch"
  | "slider"
  | "radio"
  | "combobox"
  | "color"
  | "rating"
  | "time"
  | "daterange"

export type MigrationStrategy = "add_columns" | "recreate_table" | "preserve_data"

export interface ValidationRule {
  min_length?: number
  max_length?: number
  min_value?: number
  max_value?: number
  pattern?: string
  required?: boolean
  options?: string[]
  min_date?: string
  max_date?: string
  file_types?: string[]
  max_file_size?: number
}

// ===== Field Creation =====

export interface FieldCreate {
  name: string
  label: string
  type: FieldType
  order: number
  required: boolean
  placeholder?: string
  validation?: ValidationRule
  default_value?: string | number | boolean | string[]
  help_text?: string
  depends_on?: string
  condition?: Record<string, any>
}

// ===== Step Creation =====

export interface StepCreate {
  name: string
  order: number
  description?: string
  fields: FieldCreate[]
}

// ===== Dynamic Workflow Creation =====

export interface DynamicWorkflowCreate {
  name: string
  description?: string
  generate_table?: boolean
  table_name?: string
  table_config?: Record<string, any>
  steps: StepCreate[]
}

// ===== Dynamic Workflow Response =====

export interface DynamicWorkflowField {
  id: UUID
  name: string
  label: string
  type: FieldType
  order: number
  required: boolean
  placeholder?: string
  validation?: ValidationRule
  default_value?: string | number | boolean | string[]
  help_text?: string
  depends_on?: string
  condition?: Record<string, any>
}

export interface DynamicWorkflowStep {
  id: UUID
  name: string
  order: number
  description?: string
  fields: DynamicWorkflowField[]
}

export interface DynamicWorkflowResponse {
  id: UUID
  name: string
  description?: string
  table_name?: string
  steps: DynamicWorkflowStep[]
  created_at: string
  updated_at?: string
}

// ===== Table Schema =====

export interface TableSchemaResponse {
  workflow_id: UUID
  table_name: string
  schema: {
    columns: Record<string, string>
    indexes: string[]
  }
}

// ===== Migration =====

export interface WorkflowMigrationRequest {
  new_steps: StepCreate[]
  migration_strategy: MigrationStrategy
  backup_data?: boolean
}

export interface WorkflowMigrationResponse {
  workflow_id: UUID
  success: boolean
  message: string
  affected_records?: number
  migration_strategy: MigrationStrategy
}

// ===== Table Data =====

export interface WorkflowTableDataResponse {
  workflow_id: UUID
  table_name: string
  total_records: number
  records: Record<string, any>[]
}

// ===== Validation =====

export interface WorkflowBuilderValidationResponse {
  workflow_id: UUID
  is_valid: boolean
  validation_results: {
    workflow_structure: "valid" | "invalid"
    table_schema: "valid" | "invalid"
    field_types: "valid" | "invalid"
    constraints: "valid" | "invalid"
  }
  warnings: string[]
  errors: string[]
}

// ===== Workflow Instance Types (for running workflows) =====

export interface WorkflowInstanceCreate {
  company_id: number
  workflow_id: UUID
}

export interface StepDataSubmit {
  step_id: UUID
  fields: Array<{
    field_id: UUID
    value: any
  }>
}

export interface WorkflowInstanceResponse {
  id: UUID
  company_id: number
  workflow_id: UUID
  current_step_id?: UUID
  status: "pending" | "in_progress" | "completed" | "blocked"
  step_data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StepSubmitResponse {
  success: boolean
  message: string
  next_step_id?: UUID
  is_complete: boolean
}

// ===== Frontend Workflow Types (for UI compatibility) =====

export interface FrontendWorkflowField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    accept?: string
  }
  layout?: {
    width?: "full" | "half" | "third"
    columns?: number
  }
  config?: {
    step?: number
    multiple?: boolean
    maxFiles?: number
    maxStars?: number
  }
}

export interface FrontendWorkflowStep {
  id: string
  name: string
  description: string
  fields: FrontendWorkflowField[]
  order: number
}

export interface FrontendWorkflow {
  id: string
  name: string
  description: string
  steps: FrontendWorkflowStep[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  connectedWorkflows?: string[]
  triggerType?: "manual" | "automatic"
  category?: "erp" | "onboarding" | "custom"
  tableName?: string // Added for dynamic workflows
}
