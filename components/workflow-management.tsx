"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Copy, Settings, Link2, Network } from "lucide-react"
import { workflowStorage, type Workflow, initializeDefaultWorkflow } from "@/lib/workflow-storage"
import { WorkflowBridgeService } from "@/lib/api/services/workflow-bridge.service"
import { FrontendWorkflow, FieldType } from "@/lib/api/types/dynamic-workflow.types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { WorkflowConnector } from "./workflow-connector"
import { WorkflowCanvasBuilder } from "./workflow-canvas-builder"

interface WorkflowManagementProps {
  onCreateWorkflow: () => void
  onEditWorkflow: (workflow: Workflow) => void
}

export function WorkflowManagement({ onCreateWorkflow, onEditWorkflow }: WorkflowManagementProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null)
  const [connectingWorkflowId, setConnectingWorkflowId] = useState<string | null>(null)
  const [showCanvasBuilder, setShowCanvasBuilder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeDefaultWorkflow()
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try to load from dynamic workflow API first
      const dynamicWorkflows = await WorkflowBridgeService.getAllWorkflows()
      
      if (dynamicWorkflows.length > 0) {
        // Convert dynamic workflows to frontend format
        const convertedWorkflows = dynamicWorkflows.map(wf => ({
          id: wf.id,
          name: wf.name,
          description: wf.description,
          steps: wf.steps.map(step => ({
            id: step.id,
            name: step.name,
            description: step.description,
            order: step.order,
            fields: step.fields.map(field => ({
              id: field.id,
              type: field.type as any,
              label: field.label,
              placeholder: field.placeholder,
              required: field.required,
              options: field.options,
              validation: field.validation,
              layout: field.layout,
              config: field.config,
            })),
          })),
          isActive: wf.isActive,
          createdAt: wf.createdAt,
          updatedAt: wf.updatedAt,
          connectedWorkflows: wf.connectedWorkflows,
          triggerType: wf.triggerType,
          category: wf.category,
        }))
        setWorkflows(convertedWorkflows)
      } else {
        // Fallback to localStorage
        const allWorkflows = workflowStorage.getAll()
        setWorkflows(allWorkflows)
      }
    } catch (err) {
      console.error("Failed to load workflows from API, falling back to localStorage:", err)
      // Fallback to localStorage on error
      const allWorkflows = workflowStorage.getAll()
      setWorkflows(allWorkflows)
      setError("Failed to load workflows from server. Using local data.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteWorkflowId) {
      try {
        setLoading(true)
        // Try to delete from API first
        const success = await WorkflowBridgeService.deleteWorkflow(deleteWorkflowId)
        if (success) {
          // Also delete from localStorage as backup
          workflowStorage.delete(deleteWorkflowId)
        } else {
          // Fallback to localStorage only
          workflowStorage.delete(deleteWorkflowId)
        }
        await loadWorkflows()
        setDeleteWorkflowId(null)
      } catch (err) {
        console.error("Failed to delete workflow from API, using localStorage:", err)
        // Fallback to localStorage
        workflowStorage.delete(deleteWorkflowId)
        await loadWorkflows()
        setDeleteWorkflowId(null)
        setError("Failed to delete from server. Deleted locally.")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleActive = async (workflow: Workflow) => {
    try {
      setLoading(true)
      // Try to update via API first
      const updatedWorkflow = await WorkflowBridgeService.updateWorkflow(workflow.id, { 
        isActive: !workflow.isActive 
      })
      if (updatedWorkflow) {
        // Also update localStorage as backup
        workflowStorage.update(workflow.id, { isActive: !workflow.isActive })
      } else {
        // Fallback to localStorage only
        workflowStorage.update(workflow.id, { isActive: !workflow.isActive })
      }
      await loadWorkflows()
    } catch (err) {
      console.error("Failed to update workflow via API, using localStorage:", err)
      // Fallback to localStorage
      workflowStorage.update(workflow.id, { isActive: !workflow.isActive })
      await loadWorkflows()
      setError("Failed to update on server. Updated locally.")
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (workflow: Workflow) => {
    try {
      setLoading(true)
      const { id, createdAt, updatedAt, ...workflowData } = workflow
      const duplicateData = {
        ...workflowData,
        name: `${workflow.name} (Copy)`,
        isActive: false,
      }

      // Try to create via API first
      try {
        // Convert to FrontendWorkflow format for API
        const apiWorkflow: Omit<FrontendWorkflow, "id" | "createdAt" | "updatedAt"> = {
          name: duplicateData.name,
          description: duplicateData.description,
          isActive: duplicateData.isActive,
          steps: duplicateData.steps.map(step => ({
            id: step.id, // Keep original ID for now
            name: step.name,
            order: step.order,
            description: step.description,
            fields: step.fields.map(field => ({
              id: field.id, // Keep original ID for now
              label: field.label,
              type: field.type as FieldType,
              required: field.required,
              placeholder: field.placeholder,
              options: field.options,
              validation: field.validation,
              layout: field.layout,
              config: field.config,
            })),
          })),
          connectedWorkflows: duplicateData.connectedWorkflows,
          triggerType: duplicateData.triggerType,
          category: duplicateData.category,
        }
        await WorkflowBridgeService.createWorkflow(apiWorkflow)
      } catch (apiError) {
        console.error("Failed to create workflow via API, using localStorage:", apiError)
        // Fallback to localStorage
        workflowStorage.create(duplicateData)
        setError("Failed to create on server. Created locally.")
      }
      
      await loadWorkflows()
    } catch (err) {
      console.error("Failed to duplicate workflow:", err)
      setError("Failed to duplicate workflow.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCanvas = (nodes: any[], connections: any[]) => {
    console.log("[v0] ===== WORKFLOW MANAGEMENT: SAVE CANVAS =====")
    console.log("[v0] Received nodes:", nodes.length)
    console.log("[v0] Received connections:", connections.length)

    // Log each node
    nodes.forEach((node, index) => {
      console.log(`[v0] Node ${index + 1}:`, {
        id: node.id,
        workflowId: node.workflowId,
        workflowName: node.workflow.name,
        position: node.position,
      })
    })

    // Log each connection
    connections.forEach((conn, index) => {
      const sourceNode = nodes.find((n: any) => n.id === conn.sourceId)
      const targetNode = nodes.find((n: any) => n.id === conn.targetId)
      console.log(`[v0] Connection ${index + 1}:`, {
        from: sourceNode?.workflow.name,
        to: targetNode?.workflow.name,
      })
    })

    // Save to localStorage
    console.log("[v0] Saving to localStorage...")
    localStorage.setItem("workflow-canvas", JSON.stringify({ nodes, connections }))
    console.log("[v0] ✓ Saved to localStorage")

    // Update workflow connections
    console.log("[v0] Updating workflow connections...")
    let updatedCount = 0
    connections.forEach((conn: any) => {
      const sourceNode = nodes.find((n: any) => n.id === conn.sourceId)
      const targetNode = nodes.find((n: any) => n.id === conn.targetId)

      if (sourceNode && targetNode) {
        const sourceWorkflow = workflows.find((w) => w.id === sourceNode.workflowId)
        if (sourceWorkflow) {
          const connectedIds = sourceWorkflow.connectedWorkflows || []
          if (!connectedIds.includes(targetNode.workflowId)) {
            console.log(`[v0] Connecting: ${sourceWorkflow.name} → ${targetNode.workflow.name}`)
            workflowStorage.update(sourceWorkflow.id, {
              connectedWorkflows: [...connectedIds, targetNode.workflowId],
            })
            updatedCount++
          }
        }
      }
    })

    console.log(`[v0] ✓ Updated ${updatedCount} workflow connections`)
    console.log("[v0] Reloading workflows...")
    loadWorkflows()
    console.log("[v0] ===== SAVE CANVAS COMPLETED =====")
  }

  if (connectingWorkflowId) {
    return (
      <WorkflowConnector
        workflowId={connectingWorkflowId}
        onClose={() => {
          setConnectingWorkflowId(null)
          loadWorkflows()
        }}
      />
    )
  }

  if (showCanvasBuilder) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h2 className="text-lg font-semibold">Workflow Canvas Builder</h2>
          <Button variant="outline" onClick={() => setShowCanvasBuilder(false)}>
            Back to List
          </Button>
        </div>
        <div className="flex-1">
          <WorkflowCanvasBuilder workflows={workflows} onSave={handleSaveCanvas} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dynamic Workflow Management</h2>
          <p className="text-muted-foreground mt-2">Create and manage dynamic workflows with automatic table generation</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCanvasBuilder(true)} 
            size="lg" 
            variant="outline" 
            className="gap-2"
            disabled={loading}
          >
            <Network className="h-5 w-5" />
            Canvas Builder
          </Button>
          <Button 
            onClick={onCreateWorkflow} 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="text-sm text-muted-foreground">Loading workflows...</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{workflows.filter((w) => w.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workflows.reduce((sum, w) => sum + (w.steps?.length || 0), 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <CardDescription className="mt-2">{workflow.description}</CardDescription>
                </div>
                <Badge variant={workflow.isActive ? "default" : "secondary"} className="ml-2">
                  {workflow.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Steps:</span>
                <span className="font-semibold">{workflow.steps?.length || 0}</span>
              </div>
              {/* {workflow.steps && workflow.steps.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Step Orders:</span>
                  <span className="font-semibold">
                    {workflow.steps
                      .map((s) => s.order)
                      .sort((a, b) => a - b)
                      .join(", ")}
                  </span>
                </div>
              )} */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Fields:</span>
                <span className="font-semibold">
                  {workflow.steps?.reduce((sum, step) => sum + (step.fields?.length || 0), 0) || 0}
                </span>
              </div>
              {workflow.connectedWorkflows && workflow.connectedWorkflows.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connected:</span>
                  <Badge variant="outline" className="text-xs">
                    {workflow.connectedWorkflows.length} workflow{workflow.connectedWorkflows.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onEditWorkflow(workflow)} className="flex-1">
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConnectingWorkflowId(workflow.id)}>
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDuplicate(workflow)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(workflow)}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteWorkflowId(workflow.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Settings className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No workflows yet</h3>
              <p className="text-muted-foreground mt-2">Create your first workflow to get started</p>
            </div>
            <Button onClick={onCreateWorkflow} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
