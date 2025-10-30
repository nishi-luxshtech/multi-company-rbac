// Types mirroring backend schemas.v1.workflow.WorkflowResponse (subset for listing)

export type UUID = string

export interface WorkflowFieldApi {
  id: UUID
  label: string
  type: string
  required: boolean
  placeholder?: string
  validation?: {
    min_length?: number
    max_length?: number
    min_value?: number
    max_value?: number
    pattern?: string
    required?: boolean
    options?: string[]
    [key: string]: any
  }
  options?: string[]
}

export interface WorkflowStepApi {
  id: UUID
  name: string
  description?: string
  step_order: number
  fields: WorkflowFieldApi[]
}

export interface WorkflowApiResponse {
  id: UUID
  name: string
  description?: string
  is_active?: boolean
  steps: WorkflowStepApi[]
  created_at: string
  updated_at?: string
}


