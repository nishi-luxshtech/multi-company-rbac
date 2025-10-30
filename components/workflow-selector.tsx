"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2, Network, WorkflowIcon, LayoutGrid, List } from "lucide-react"
import { workflowStorage, type Workflow, initializeDefaultWorkflow } from "@/lib/workflow-storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WorkflowSelectorProps {
  onSelectWorkflow: (workflowId: string, viewMode: "wizard" | "tabs") => void
  onSelectCanvasWorkflow: (workflowIds: string[], viewMode: "wizard" | "tabs") => void
  onCancel: () => void
}

export function WorkflowSelector({ onSelectWorkflow, onSelectCanvasWorkflow, onCancel }: WorkflowSelectorProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [canvasWorkflows, setCanvasWorkflows] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState<"single" | "canvas">("single")
  const [showViewModeDialog, setShowViewModeDialog] = useState(false)

  const loadCanvasWorkflows = useCallback(() => {
    console.log("[v0] ===== LOADING CANVAS WORKFLOWS =====")
    const savedCanvas = localStorage.getItem("workflow-canvas")
    console.log("[v0] Raw localStorage data:", savedCanvas ? "exists" : "not found")

    if (savedCanvas) {
      try {
        const { nodes, connections } = JSON.parse(savedCanvas)
        console.log("[v0] Parsed canvas data:", {
          nodes: nodes?.length || 0,
          connections: connections?.length || 0,
        })

        // Build workflow chain from connections
        if (connections && connections.length > 0) {
          const workflowChain = buildWorkflowChain(nodes, connections)
          console.log("[v0] Built workflow chain:", workflowChain)
          setCanvasWorkflows(workflowChain)
          console.log("[v0] ✓ Canvas workflows loaded successfully")
        } else {
          console.log("[v0] No connections found in canvas")
          setCanvasWorkflows([])
        }
      } catch (error) {
        console.error("[v0] Error loading canvas workflows:", error)
        setCanvasWorkflows([])
      }
    } else {
      console.log("[v0] No saved canvas found")
      setCanvasWorkflows([])
    }
    console.log("[v0] ===== CANVAS LOADING COMPLETED =====")
  }, [])

  useEffect(() => {
    console.log("[v0] WorkflowSelector mounted")
    initializeDefaultWorkflow()
    const activeWorkflows = workflowStorage.getActive()
    console.log("[v0] Active workflows:", activeWorkflows.length)
    setWorkflows(activeWorkflows)

    loadCanvasWorkflows()

    // Auto-select if only one workflow
    if (activeWorkflows.length === 1) {
      setSelectedWorkflowId(activeWorkflows[0].id)
    }
  }, [loadCanvasWorkflows])

  useEffect(() => {
    const handleCanvasSaved = (event: Event) => {
      console.log("[v0] Received canvas-saved event:", (event as CustomEvent).detail)
      console.log("[v0] Reloading canvas workflows...")
      loadCanvasWorkflows()
    }

    window.addEventListener("workflow-canvas-saved", handleCanvasSaved)
    console.log("[v0] Listening for canvas-saved events")

    return () => {
      window.removeEventListener("workflow-canvas-saved", handleCanvasSaved)
      console.log("[v0] Stopped listening for canvas-saved events")
    }
  }, [loadCanvasWorkflows])

  const buildWorkflowChain = (nodes: any[], connections: any[]): string[] => {
    if (!connections || connections.length === 0) {
      console.log("[v0] buildWorkflowChain: No connections")
      return []
    }

    console.log("[v0] buildWorkflowChain: Building chain from", connections.length, "connections")

    // Find the starting node (node with no incoming connections)
    const targetIds = new Set(connections.map((c: any) => c.targetId))
    const startNode = nodes.find((n: any) => !targetIds.has(n.id))

    if (!startNode) {
      console.log("[v0] buildWorkflowChain: No start node found")
      return []
    }

    console.log("[v0] buildWorkflowChain: Start node:", startNode.workflow.name)

    // Build chain by following connections
    const chain: string[] = [startNode.workflowId]
    let currentNodeId = startNode.id

    while (true) {
      const nextConnection = connections.find((c: any) => c.sourceId === currentNodeId)
      if (!nextConnection) {
        console.log("[v0] buildWorkflowChain: No more connections")
        break
      }

      const nextNode = nodes.find((n: any) => n.id === nextConnection.targetId)
      if (!nextNode) {
        console.log("[v0] buildWorkflowChain: Next node not found")
        break
      }

      console.log("[v0] buildWorkflowChain: Adding node:", nextNode.workflow.name)
      chain.push(nextNode.workflowId)
      currentNodeId = nextNode.id
    }

    console.log("[v0] buildWorkflowChain: Final chain length:", chain.length)
    return chain
  }

  const handleContinue = () => {
    setShowViewModeDialog(true)
  }

  const handleViewModeSelected = (viewMode: "wizard" | "tabs") => {
    setShowViewModeDialog(false)

    if (selectionMode === "canvas" && canvasWorkflows.length > 0) {
      console.log("[v0] Using canvas workflow chain with view mode:", viewMode)
      onSelectCanvasWorkflow(canvasWorkflows, viewMode)
    } else if (selectionMode === "single" && selectedWorkflowId) {
      console.log("[v0] Using single workflow with view mode:", viewMode)
      onSelectWorkflow(selectedWorkflowId, viewMode)
    }
  }

  const getWorkflowById = (id: string) => workflows.find((w) => w.id === id)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Select Onboarding Workflow</h2>
        <p className="text-muted-foreground mt-2">Choose how you want to create your company</p>
      </div>

      {workflows.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No active workflows available</p>
            <p className="text-sm text-muted-foreground">Please contact your administrator to create workflows</p>
            <Button variant="outline" onClick={onCancel}>
              Go Back
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Tabs
            value={selectionMode}
            onValueChange={(v) => setSelectionMode(v as "single" | "canvas")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="gap-2">
                <WorkflowIcon className="h-4 w-4" />
                Single Workflow
              </TabsTrigger>
              <TabsTrigger value="canvas" className="gap-2" disabled={canvasWorkflows.length === 0}>
                <Network className="h-4 w-4" />
                Canvas Builder Workflow
                {canvasWorkflows.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {canvasWorkflows.length} steps
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {workflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedWorkflowId === workflow.id ? "ring-2 ring-blue-600" : ""
                    }`}
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <CardDescription className="mt-2">{workflow.description}</CardDescription>
                        </div>
                        {selectedWorkflowId === workflow.id && (
                          <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Steps:</span>
                        <Badge variant="secondary">{workflow.steps?.length || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Fields:</span>
                        <Badge variant="secondary">
                          {workflow.steps?.reduce((sum, step) => sum + (step.fields?.length || 0), 0) || 0}
                        </Badge>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Steps:</p>
                        <div className="flex flex-wrap gap-1">
                          {(workflow.steps || []).slice(0, 5).map((step) => (
                            <Badge key={step.id} variant="outline" className="text-xs">
                              {step.name}
                            </Badge>
                          ))}
                          {(workflow.steps?.length || 0) > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{(workflow.steps?.length || 0) - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="canvas" className="space-y-4 mt-6">
              {canvasWorkflows.length > 0 ? (
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Connected Workflow Chain</h3>
                      <Badge variant="default">{canvasWorkflows.length} workflows</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This workflow chain was created in the Canvas Builder. The workflows will execute in sequence.
                    </p>

                    <div className="space-y-3 mt-4">
                      {canvasWorkflows.map((workflowId, index) => {
                        const workflow = getWorkflowById(workflowId)
                        if (!workflow) return null

                        return (
                          <div key={workflowId} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <Card className="flex-1 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{workflow.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {workflow.steps?.length || 0} steps
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {workflow.steps?.reduce((sum, step) => sum + (step.fields?.length || 0), 0) || 0}{" "}
                                    fields
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                            {index < canvasWorkflows.length - 1 && (
                              <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-12">
                  <div className="text-center space-y-4">
                    <Network className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No Canvas Workflow Available</h3>
                      <p className="text-muted-foreground mt-2">
                        Create a workflow chain in the Canvas Builder to use this option
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button variant="outline" onClick={onCancel} size="lg">
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={
                (selectionMode === "single" && !selectedWorkflowId) ||
                (selectionMode === "canvas" && canvasWorkflows.length === 0)
              }
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      <Dialog open={showViewModeDialog} onOpenChange={setShowViewModeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose View Mode</DialogTitle>
            <DialogDescription>How would you like to view and fill out the workflow steps?</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-600"
              onClick={() => handleViewModeSelected("wizard")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <List className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Step-by-Step Wizard</CardTitle>
                    <CardDescription className="text-xs mt-1">Navigate through steps one at a time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Complete each step sequentially with clear progress tracking. Best for guided workflows.
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-600"
              onClick={() => handleViewModeSelected("tabs")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <LayoutGrid className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Tab View</CardTitle>
                    <CardDescription className="text-xs mt-1">View all steps as tabs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Access any step directly through tabs. Best for experienced users who want flexibility.
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModeDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
