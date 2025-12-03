/**
 * TypeScript types for workflow step relationships
 */

export type RelationshipType = "one_to_one" | "one_to_many" | "many_to_many"

export interface FieldMapping {
  source_field: string
  target_field: string
  transform?: string
  condition?: Record<string, any>
}

export interface StepRelationship {
  id: string
  workflow_id: string
  source_step_id: string
  target_step_id: string
  relationship_type: RelationshipType
  source_table?: string
  target_table?: string
  source_key?: string
  target_key?: string
  field_mappings: FieldMapping[]
  is_required: boolean
  cascade_delete: boolean
  min_records: number
  max_records?: number
  junction_table?: string
  junction_source_key?: string
  junction_target_key?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface StepDomainMapping {
  id: string
  workflow_id: string
  step_id: string
  domain_table: string
  primary_key: string
  field_mappings: Record<string, string>
  created_at: string
  updated_at: string
}

export interface WorkflowRelationships {
  workflow_id: string
  relationships: StepRelationship[]
  domain_mappings: StepDomainMapping[]
}

export interface CreateRelationshipRequest {
  workflow_id: string
  source_step_id: string
  target_step_id: string
  relationship_type: RelationshipType
  source_table?: string
  target_table?: string
  source_key?: string
  target_key?: string
  field_mappings?: FieldMapping[]
  is_required?: boolean
  cascade_delete?: boolean
  min_records?: number
  max_records?: number
  junction_table?: string
  junction_source_key?: string
  junction_target_key?: string
  description?: string
}

export interface UpdateRelationshipRequest {
  relationship_type?: RelationshipType
  source_table?: string
  target_table?: string
  source_key?: string
  target_key?: string
  field_mappings?: FieldMapping[]
  is_required?: boolean
  cascade_delete?: boolean
  min_records?: number
  max_records?: number
  junction_table?: string
  junction_source_key?: string
  junction_target_key?: string
  description?: string
}

export interface CreateDomainMappingRequest {
  workflow_id: string
  step_id: string
  domain_table: string
  primary_key?: string
  field_mappings?: Record<string, string>
}

export interface RelationshipValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Visual representation types for canvas
export interface RelationshipNode {
  id: string
  type: "step"
  position: { x: number; y: number }
  data: {
    stepId: string
    stepName: string
    stepOrder: number
    domainTable?: string
    fieldCount: number
    isMapped: boolean
  }
}

export interface RelationshipEdge {
  id: string
  source: string
  target: string
  type: RelationshipType
  data: {
    relationshipId?: string
    sourceTable?: string
    targetTable?: string
    fieldMappings: FieldMapping[]
  }
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
  }
  markerEnd?: {
    type: string
  }
}

