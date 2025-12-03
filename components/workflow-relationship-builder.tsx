"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  Save,
  X,
  Plus,
  Trash2,
  Settings,
  CheckCircle2,
  AlertCircle,
  Network,
  MapPin,
  Database,
} from "lucide-react"
import { workflowRelationshipsAPI } from "@/lib/api/services/workflow-relationships-api.service"
import type {
  StepRelationship,
  StepDomainMapping,
  WorkflowRelationships,
  RelationshipType,
  CreateRelationshipRequest,
} from "@/lib/api/types/workflow-relationships.types"
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"
import { WorkflowBridgeService } from "@/lib/api/services/workflow-bridge.service"
import { workflowsApi } from "@/lib/api/services/workflows-api.service"
import type { DynamicWorkflowResponse } from "@/lib/api/types/dynamic-workflow.types"
import type { FrontendWorkflow } from "@/lib/api/types/dynamic-workflow.types"

// Custom Step Node Component
function StepNode({
  data,
}: {
  data: {
    stepId: string
    stepName: string
    stepOrder: number
    domainTable?: string
    fieldCount: number
    isMapped: boolean
    onConfigure: (stepId: string) => void
  }
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      <Card
        className={`relative bg-white shadow-md hover:shadow-lg transition-all duration-200 min-w-[240px] border-2 rounded-lg overflow-hidden ${
          data.isMapped
            ? "border-green-500"
            : isHovered
              ? "border-blue-400"
              : "border-gray-300"
        }`}
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded">
                <Network className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">
                  {data.stepName}
                </h3>
                <p className="text-xs text-gray-500">Step {data.stepOrder}</p>
              </div>
            </div>
            {isHovered && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => data.onConfigure(data.stepId)}
                title="Configure domain mapping"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 bg-white">
          {data.domainTable ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600 font-mono">
                  {data.domainTable}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {data.fieldCount} fields
              </Badge>
              <Badge className="text-xs bg-green-100 text-green-700">
                Mapped
              </Badge>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {data.fieldCount} fields
              </Badge>
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                Not Mapped
              </Badge>
            </div>
          )}
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  stepNode: StepNode,
}

interface WorkflowRelationshipBuilderProps {
  workflowId: string
  onClose?: () => void
}

export function WorkflowRelationshipBuilder({
  workflowId,
  onClose,
}: WorkflowRelationshipBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [workflow, setWorkflow] = useState<DynamicWorkflowResponse | FrontendWorkflow | null>(null)
  const [relationships, setRelationships] = useState<StepRelationship[]>([])
  const [domainMappings, setDomainMappings] = useState<Map<string, StepDomainMapping>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog states
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false)
  const [showDomainMappingDialog, setShowDomainMappingDialog] = useState(false)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<{
    source: string
    target: string
  } | null>(null)

  // Relationship form state
  const [relationshipForm, setRelationshipForm] = useState<Partial<CreateRelationshipRequest>>({
    relationship_type: "one_to_many",
    is_required: false,
    cascade_delete: false,
    min_records: 0,
  })

  // Domain mapping form state
  const [domainMappingForm, setDomainMappingForm] = useState({
    domain_table: "",
    primary_key: "id",
    field_mappings: {} as Record<string, string>,
  })

  // Load workflow and relationships
  useEffect(() => {
    loadData()
  }, [workflowId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load workflow first (required)
      // Try builder endpoint first, then fall back to regular workflows endpoint
      let workflowData: DynamicWorkflowResponse | FrontendWorkflow | null = null
      let errorMessage = ""
      
      try {
        // Try dynamic workflow builder endpoint first
        workflowData = await dynamicWorkflowAPI.getWorkflow(workflowId)
        console.log("✅ Workflow loaded from builder API:", workflowData)
        console.log("✅ Steps count:", workflowData.steps?.length || 0)
      } catch (builderError: any) {
        console.warn("⚠️ Builder API failed, trying regular workflows API:", builderError)
        errorMessage = builderError.response?.data?.detail || builderError.message || ""
        
        try {
          // Fall back to regular workflows endpoint
          const regularWorkflow = await WorkflowBridgeService.getWorkflowById(workflowId)
          if (regularWorkflow) {
            // Convert FrontendWorkflow to DynamicWorkflowResponse format
            workflowData = {
              id: regularWorkflow.id,
              name: regularWorkflow.name,
              description: regularWorkflow.description,
              table_name: regularWorkflow.tableName,
              steps: regularWorkflow.steps.map((step) => ({
                id: step.id,
                name: step.name,
                order: step.order,
                description: step.description,
                fields: step.fields.map((field) => ({
                  id: field.id,
                  name: field.id, // Use id as name for compatibility
                  label: field.label,
                  type: field.type,
                  order: 1,
                  required: field.required,
                  placeholder: field.placeholder,
                  validation: field.validation ? {
                    min_value: field.validation.min,
                    max_value: field.validation.max,
                    pattern: field.validation.pattern,
                    options: field.options,
                  } : undefined,
                  default_value: undefined,
                })),
              })),
              created_at: regularWorkflow.createdAt,
              updated_at: regularWorkflow.updatedAt,
            }
            console.log("✅ Workflow loaded from regular API:", workflowData)
            console.log("✅ Steps count:", workflowData.steps?.length || 0)
          } else {
            throw new Error("Workflow not found")
          }
        } catch (regularError: any) {
          console.error("❌ Both API endpoints failed:", { builderError, regularError })
          toast({
            title: "Error",
            description: errorMessage || regularError.response?.data?.detail || `Failed to load workflow: ${workflowId}`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      setWorkflow(workflowData)

      // Load relationships (optional - can work without them)
      let relationshipsData: WorkflowRelationships = {
        workflow_id: workflowId,
        relationships: [],
        domain_mappings: [],
      }

      try {
        relationshipsData = await workflowRelationshipsAPI.getWorkflowRelationships(workflowId)
        console.log("✅ Relationships loaded:", relationshipsData)
      } catch (error: any) {
        console.warn("⚠️ Failed to load relationships (continuing anyway):", error)
        // Don't show error toast - relationships are optional
        // Just use empty arrays
      }

      setRelationships(relationshipsData.relationships || [])

      // Create domain mappings map
      const mappingsMap = new Map<string, StepDomainMapping>()
      if (relationshipsData.domain_mappings) {
        relationshipsData.domain_mappings.forEach((mapping) => {
          mappingsMap.set(mapping.step_id, mapping)
        })
      }
      setDomainMappings(mappingsMap)

      // Build nodes and edges - always show steps even if no relationships
      if (workflowData.steps && workflowData.steps.length > 0) {
        console.log("✅ Building canvas with", workflowData.steps.length, "steps")
        buildCanvas(workflowData, relationshipsData.relationships || [], mappingsMap)
      } else {
        console.warn("⚠️ Workflow has no steps!")
        toast({
          title: "Warning",
          description: "This workflow has no steps to display",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("❌ Unexpected error loading data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load workflow data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const buildCanvas = (
    workflowData: DynamicWorkflowResponse | FrontendWorkflow,
    relationshipsData: StepRelationship[],
    mappings: Map<string, StepDomainMapping>
  ) => {
    if (!workflowData.steps || workflowData.steps.length === 0) {
      console.warn("⚠️ No steps to display")
      setNodes([])
      setEdges([])
      return
    }

    console.log("🔨 Building canvas with", workflowData.steps.length, "steps")

    // Create nodes for each step
    const stepNodes: Node[] = workflowData.steps
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((step, index) => {
        const mapping = mappings.get(step.id)
        const isRoot = step.order === 1

        // Better layout: arrange in a grid/flow pattern
        // For 9 steps, arrange in 3x3 or vertical flow
        const stepsPerRow = Math.ceil(Math.sqrt(workflowData.steps.length))
        const row = Math.floor(index / stepsPerRow)
        const col = index % stepsPerRow
        
        const x = 100 + col * 300
        const y = 100 + row * 200

        const node = {
          id: step.id,
          type: "stepNode",
          position: { x, y },
          data: {
            stepId: step.id,
            stepName: step.name,
            stepOrder: step.order || index + 1,
            domainTable: mapping?.domain_table,
            fieldCount: step.fields?.length || 0,
            isMapped: !!mapping,
            onConfigure: handleConfigureDomainMapping,
          },
        }

        console.log(`  📍 Step ${step.order || index + 1}: ${step.name} at (${x}, ${y})`)
        return node
      })

    console.log("✅ Created", stepNodes.length, "nodes")

    // Create edges for relationships
    const relationshipEdges: Edge[] = (relationshipsData || []).map((rel) => {
      const edgeStyle = getEdgeStyle(rel.relationship_type)
      return {
        id: rel.id,
        source: rel.source_step_id,
        target: rel.target_step_id,
        type: "smoothstep",
        animated: true,
        style: edgeStyle,
        label: getRelationshipLabel(rel.relationship_type),
        labelStyle: { fill: edgeStyle.stroke, fontWeight: 600 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.stroke,
        },
        data: {
          relationshipId: rel.id,
          relationship: rel,
        },
      }
    })

    console.log("✅ Created", relationshipEdges.length, "edges")

    setNodes(stepNodes)
    setEdges(relationshipEdges)

    // Force fit view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      const reactFlowInstance = document.querySelector('.react-flow')
      if (reactFlowInstance) {
        console.log("✅ Canvas ready")
      }
    }, 100)
  }

  const getEdgeStyle = (type: RelationshipType) => {
    switch (type) {
      case "one_to_one":
        return { stroke: "#10B981", strokeWidth: 3 } // Green solid
      case "one_to_many":
        return { stroke: "#F59E0B", strokeWidth: 2, strokeDasharray: "5,5" } // Orange dotted
      case "many_to_many":
        return { stroke: "#8B5CF6", strokeWidth: 3 } // Purple double (simulated with thicker)
      default:
        return { stroke: "#3B82F6", strokeWidth: 2 }
    }
  }

  const getRelationshipLabel = (type: RelationshipType) => {
    switch (type) {
      case "one_to_one":
        return "1→1"
      case "one_to_many":
        return "1→*"
      case "many_to_many":
        return "*→*"
      default:
        return ""
    }
  }

  const handleConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return

      // Check if relationship already exists
      const existing = edges.find(
        (e) => e.source === params.source && e.target === params.target
      )

      if (existing) {
        toast({
          title: "Relationship Exists",
          description: "A relationship already exists between these steps",
          variant: "destructive",
        })
        return
      }

      // Open relationship configuration dialog
      setSelectedConnection({
        source: params.source!,
        target: params.target!,
      })
      setRelationshipForm({
        source_step_id: params.source,
        target_step_id: params.target,
        relationship_type: "one_to_many",
        is_required: false,
        cascade_delete: false,
        min_records: 0,
      })
      setShowRelationshipDialog(true)
    },
    [edges]
  )

  const handleConfigureDomainMapping = (stepId: string) => {
    setSelectedStepId(stepId)
    const existing = domainMappings.get(stepId)
    if (existing) {
      setDomainMappingForm({
        domain_table: existing.domain_table,
        primary_key: existing.primary_key,
        field_mappings: existing.field_mappings || {},
      })
    } else {
      setDomainMappingForm({
        domain_table: "",
        primary_key: "id",
        field_mappings: {},
      })
    }
    setShowDomainMappingDialog(true)
  }

  const handleSaveRelationship = async () => {
    if (!selectedConnection) return

    try {
      setSaving(true)
      const sourceMapping = domainMappings.get(selectedConnection.source)
      const targetMapping = domainMappings.get(selectedConnection.target)

      // Check if updating existing relationship
      const existingRelationship = relationships.find(
        (r) => r.source_step_id === selectedConnection.source && r.target_step_id === selectedConnection.target
      )

      let updated: StepRelationship

      if (existingRelationship) {
        // Update existing relationship
        updated = await workflowRelationshipsAPI.updateRelationship(existingRelationship.id, {
          relationship_type: relationshipForm.relationship_type,
          source_table: relationshipForm.source_table || sourceMapping?.domain_table,
          target_table: relationshipForm.target_table || targetMapping?.domain_table,
          source_key: relationshipForm.source_key || sourceMapping?.primary_key || "id",
          target_key: relationshipForm.target_key || "company_id",
          field_mappings: relationshipForm.field_mappings || [],
          is_required: relationshipForm.is_required || false,
          cascade_delete: relationshipForm.cascade_delete || false,
          min_records: relationshipForm.min_records || 0,
          max_records: relationshipForm.max_records,
          description: relationshipForm.description,
        })

        setRelationships(relationships.map((r) => (r.id === existingRelationship.id ? updated : r)))
        
        // Update edge
        setEdges((eds) =>
          eds.map((e) =>
            e.id === existingRelationship.id
              ? {
                  ...e,
                  style: getEdgeStyle(updated.relationship_type),
                  label: getRelationshipLabel(updated.relationship_type),
                  labelStyle: { fill: getEdgeStyle(updated.relationship_type).stroke, fontWeight: 600 },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: getEdgeStyle(updated.relationship_type).stroke,
                  },
                  data: {
                    relationshipId: updated.id,
                    relationship: updated,
                  },
                }
              : e
          )
        )
      } else {
        // Create new relationship
        const relationshipData: CreateRelationshipRequest = {
          workflow_id: workflowId,
          source_step_id: selectedConnection.source,
          target_step_id: selectedConnection.target,
          relationship_type: relationshipForm.relationship_type || "one_to_many",
          source_table: relationshipForm.source_table || sourceMapping?.domain_table,
          target_table: relationshipForm.target_table || targetMapping?.domain_table,
          source_key: relationshipForm.source_key || sourceMapping?.primary_key || "id",
          target_key: relationshipForm.target_key || "company_id",
          field_mappings: relationshipForm.field_mappings || [],
          is_required: relationshipForm.is_required || false,
          cascade_delete: relationshipForm.cascade_delete || false,
          min_records: relationshipForm.min_records || 0,
          max_records: relationshipForm.max_records,
          description: relationshipForm.description,
        }

        updated = await workflowRelationshipsAPI.createRelationship(workflowId, relationshipData)
        setRelationships([...relationships, updated])

        // Add edge to canvas
        const newEdge: Edge = {
          id: updated.id,
          source: updated.source_step_id,
          target: updated.target_step_id,
          type: "smoothstep",
          animated: true,
          style: getEdgeStyle(updated.relationship_type),
          label: getRelationshipLabel(updated.relationship_type),
          labelStyle: { fill: getEdgeStyle(updated.relationship_type).stroke, fontWeight: 600 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: getEdgeStyle(updated.relationship_type).stroke,
          },
          data: {
            relationshipId: updated.id,
            relationship: updated,
          },
        }

        setEdges((eds) => addEdge(newEdge, eds))
      }

      setShowRelationshipDialog(false)
      setSelectedConnection(null)

      toast({
        title: "Success",
        description: existingRelationship ? "Relationship updated successfully" : "Relationship created successfully",
      })
    } catch (error: any) {
      console.error("Error saving relationship:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save relationship",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDomainMapping = async () => {
    if (!selectedStepId) return

    try {
      setSaving(true)
      const step = workflow?.steps.find((s) => s.id === selectedStepId)
      if (!step) return

      // Auto-map fields if not provided
      const autoMappings: Record<string, string> = { ...domainMappingForm.field_mappings }
      step.fields.forEach((field) => {
        if (!autoMappings[field.name]) {
          // Try to match field name to column name
          const columnName = field.name.toLowerCase().replace(/\s+/g, "_")
          autoMappings[field.name] = columnName
        }
      })

      const mappingData = {
        domain_table: domainMappingForm.domain_table,
        primary_key: domainMappingForm.primary_key,
        field_mappings: autoMappings,
      }

      let mapping: StepDomainMapping
      const existing = domainMappings.get(selectedStepId)
      if (existing) {
        mapping = await workflowRelationshipsAPI.updateDomainMapping(selectedStepId, mappingData)
      } else {
        mapping = await workflowRelationshipsAPI.createDomainMapping(
          workflowId,
          selectedStepId,
          mappingData
        )
      }

      // Update mappings map
      const newMappings = new Map(domainMappings)
      newMappings.set(selectedStepId, mapping)
      setDomainMappings(newMappings)

      // Update node to show mapped status
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedStepId
            ? {
                ...node,
                data: {
                  ...node.data,
                  domainTable: mapping.domain_table,
                  isMapped: true,
                },
              }
            : node
        )
      )

      setShowDomainMappingDialog(false)
      setSelectedStepId(null)

      toast({
        title: "Success",
        description: "Domain mapping saved successfully",
      })
    } catch (error: any) {
      console.error("Error saving domain mapping:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save domain mapping",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm("Are you sure you want to delete this relationship?")) return

    try {
      await workflowRelationshipsAPI.deleteRelationship(relationshipId)
      setRelationships(relationships.filter((r) => r.id !== relationshipId))
      setEdges((eds) => eds.filter((e) => e.id !== relationshipId))

      toast({
        title: "Success",
        description: "Relationship deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting relationship:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete relationship",
        variant: "destructive",
      })
    }
  }

  const handleEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    const relationship = relationships.find((r) => r.id === edge.id)
    if (relationship) {
      // Open edit dialog
      setSelectedConnection({
        source: relationship.source_step_id,
        target: relationship.target_step_id,
      })
      setRelationshipForm({
        relationship_type: relationship.relationship_type,
        source_table: relationship.source_table,
        target_table: relationship.target_table,
        source_key: relationship.source_key,
        target_key: relationship.target_key,
        field_mappings: relationship.field_mappings,
        is_required: relationship.is_required,
        cascade_delete: relationship.cascade_delete,
        min_records: relationship.min_records,
        max_records: relationship.max_records,
        description: relationship.description,
      })
      setShowRelationshipDialog(true)
    }
  }

  const handleEdgeContextMenu = (event: React.MouseEvent, edge: Edge) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (confirm("Delete this relationship?")) {
      handleDeleteRelationship(edge.id)
    }
  }

  const handleDeleteEdge = async (edgeId: string) => {
    if (!confirm("Are you sure you want to delete this relationship?")) return
    await handleDeleteRelationship(edgeId)
  }

  const handleValidate = async () => {
    try {
      const validation = await workflowRelationshipsAPI.validateRelationships(workflowId)
      
      if (validation.valid) {
        toast({
          title: "Validation Passed",
          description: "All relationships are valid",
        })
      } else {
        toast({
          title: "Validation Issues",
          description: `${validation.errors.length} error(s), ${validation.warnings.length} warning(s)`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error validating:", error)
      toast({
        title: "Error",
        description: "Failed to validate relationships",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflow relationships...</p>
          <p className="text-sm text-gray-400 mt-2">Workflow ID: {workflowId}</p>
        </div>
      </div>
    )
  }

  // Show error if no workflow loaded
  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Workflow</h2>
          <p className="text-gray-600 mb-4">
            Could not load workflow with ID: {workflowId}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Please check:
            <br />• Backend server is running
            <br />• Workflow ID is correct
            <br />• You have proper authentication
          </p>
          <Button onClick={loadData} variant="outline">
            Retry
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" className="ml-2">
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Show message if no steps
  if (!workflow.steps || workflow.steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Steps Found</h2>
          <p className="text-gray-600 mb-4">
            This workflow has no steps to display.
          </p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Relationship Builder</h1>
          <p className="text-sm text-gray-600">
            {workflow?.name} - {workflow?.steps.length} steps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleValidate}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Validate
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No steps to display</p>
              <p className="text-sm text-gray-400 mt-2">
                Workflow has {workflow.steps?.length || 0} steps
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onEdgeClick={handleEdgeClick}
            onEdgeContextMenu={handleEdgeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
            className="bg-gray-50"
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-10">
          <h3 className="font-semibold text-sm mb-2">Relationship Types</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-green-500"></div>
              <span>1→1 (One-to-One)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-orange-500 border-dashed border-t-2"></div>
              <span>1→* (One-to-Many)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-purple-500"></div>
              <span>*→* (Many-to-Many)</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            <div>Steps: {nodes.length}</div>
            <div>Relationships: {edges.length}</div>
          </div>
        </div>
      </div>

      {/* Relationship Configuration Dialog */}
      <Dialog open={showRelationshipDialog} onOpenChange={setShowRelationshipDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Relationship</DialogTitle>
            <DialogDescription>
              Define the relationship between steps
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Relationship Type</Label>
              <Select
                value={relationshipForm.relationship_type}
                onValueChange={(value: RelationshipType) =>
                  setRelationshipForm({ ...relationshipForm, relationship_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_to_one">One-to-One (1→1)</SelectItem>
                  <SelectItem value="one_to_many">One-to-Many (1→*)</SelectItem>
                  <SelectItem value="many_to_many">Many-to-Many (*→*)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Table</Label>
                <Input
                  value={relationshipForm.source_table || ""}
                  onChange={(e) =>
                    setRelationshipForm({ ...relationshipForm, source_table: e.target.value })
                  }
                  placeholder="e.g., companies"
                />
              </div>
              <div>
                <Label>Target Table</Label>
                <Input
                  value={relationshipForm.target_table || ""}
                  onChange={(e) =>
                    setRelationshipForm({ ...relationshipForm, target_table: e.target.value })
                  }
                  placeholder="e.g., company_address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Key</Label>
                <Input
                  value={relationshipForm.source_key || "id"}
                  onChange={(e) =>
                    setRelationshipForm({ ...relationshipForm, source_key: e.target.value })
                  }
                  placeholder="e.g., id"
                />
              </div>
              <div>
                <Label>Target Key</Label>
                <Input
                  value={relationshipForm.target_key || "company_id"}
                  onChange={(e) =>
                    setRelationshipForm({ ...relationshipForm, target_key: e.target.value })
                  }
                  placeholder="e.g., company_id"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={relationshipForm.is_required}
                  onCheckedChange={(checked) =>
                    setRelationshipForm({ ...relationshipForm, is_required: !!checked })
                  }
                />
                <Label>Is Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={relationshipForm.cascade_delete}
                  onCheckedChange={(checked) =>
                    setRelationshipForm({ ...relationshipForm, cascade_delete: !!checked })
                  }
                />
                <Label>Cascade Delete</Label>
              </div>
            </div>

            {relationshipForm.relationship_type === "one_to_many" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Records</Label>
                  <Input
                    type="number"
                    value={relationshipForm.min_records || 0}
                    onChange={(e) =>
                      setRelationshipForm({
                        ...relationshipForm,
                        min_records: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Max Records (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    value={relationshipForm.max_records || ""}
                    onChange={(e) =>
                      setRelationshipForm({
                        ...relationshipForm,
                        max_records: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={relationshipForm.description || ""}
                onChange={(e) =>
                  setRelationshipForm({ ...relationshipForm, description: e.target.value })
                }
                placeholder="Describe this relationship..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRelationshipDialog(false)}>
              Cancel
            </Button>
            {selectedConnection && relationships.find(
              (r) => r.source_step_id === selectedConnection.source && r.target_step_id === selectedConnection.target
            ) && (
              <Button
                variant="destructive"
                onClick={async () => {
                  const rel = relationships.find(
                    (r) => r.source_step_id === selectedConnection.source && r.target_step_id === selectedConnection.target
                  )
                  if (rel) {
                    await handleDeleteRelationship(rel.id)
                    setShowRelationshipDialog(false)
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button onClick={handleSaveRelationship} disabled={saving}>
              {saving ? "Saving..." : selectedConnection && relationships.find(
                (r) => r.source_step_id === selectedConnection.source && r.target_step_id === selectedConnection.target
              ) ? "Update Relationship" : "Save Relationship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Mapping Dialog */}
      <Dialog open={showDomainMappingDialog} onOpenChange={setShowDomainMappingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Domain Table Mapping</DialogTitle>
            <DialogDescription>
              Map this step to a domain table
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Domain Table Name *</Label>
              <Input
                value={domainMappingForm.domain_table}
                onChange={(e) =>
                  setDomainMappingForm({ ...domainMappingForm, domain_table: e.target.value })
                }
                placeholder="e.g., companies, company_address"
                required
              />
            </div>

            <div>
              <Label>Primary Key Column</Label>
              <Input
                value={domainMappingForm.primary_key}
                onChange={(e) =>
                  setDomainMappingForm({ ...domainMappingForm, primary_key: e.target.value })
                }
                placeholder="e.g., id"
              />
            </div>

            {workflow && selectedStepId && (
              <div>
                <Label>Field Mappings (Auto-mapped if empty)</Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                  {workflow.steps
                    .find((s) => s.id === selectedStepId)
                    ?.fields.map((field) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 w-32 truncate">
                          {field.label}:
                        </span>
                        <Input
                          className="flex-1"
                          value={domainMappingForm.field_mappings[field.name] || ""}
                          onChange={(e) =>
                            setDomainMappingForm({
                              ...domainMappingForm,
                              field_mappings: {
                                ...domainMappingForm.field_mappings,
                                [field.name]: e.target.value,
                              },
                            })
                          }
                          placeholder={field.name.toLowerCase().replace(/\s+/g, "_")}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDomainMappingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDomainMapping} disabled={saving || !domainMappingForm.domain_table}>
              {saving ? "Saving..." : "Save Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

