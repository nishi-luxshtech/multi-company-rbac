"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Panel,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Workflow, Save, CheckCircle2, X, Layers, Search, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Workflow as WorkflowType } from "@/lib/workflow-storage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function WorkflowNode({ data }: { data: { workflow: WorkflowType; nodeId: string; onDelete: (id: string) => void } }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      <Card className="relative bg-white shadow-md hover:shadow-lg transition-all duration-200 min-w-[280px] border border-gray-300 hover:border-blue-400 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-gray-900">{data.workflow.name}</h3>
            </div>
            {isHovered && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log("Delete button clicked for node:", data.nodeId)
                  data.onDelete(data.nodeId)
                }}
                title="Delete workflow"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-3 bg-white">
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 min-h-[32px]">
            {data.workflow.description || "No description"}
          </p>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {data.workflow.steps?.length || 0} steps
            </Badge>
            {data.workflow.isActive && <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>}
          </div>
        </div>
      </Card>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
}

interface WorkflowCanvasBuilderProps {
  workflows: WorkflowType[]
  onSave?: (nodes: any[], connections: any[]) => void
}

export function WorkflowCanvasBuilder({ workflows, onSave }: WorkflowCanvasBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveDetails, setSaveDetails] = useState({ nodes: 0, connections: 0, workflows: [] as string[] })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)

  const deleteNode = useCallback(
    (nodeId: string) => {
      console.log("Deleting node:", nodeId)

      setNodes((nds) => {
        console.log(
          "Current nodes before deletion:",
          nds.map((n) => n.id),
        )
        const filtered = nds.filter((n) => n.id !== nodeId)
        console.log(
          "Nodes after deletion:",
          filtered.map((n) => n.id),
        )
        return filtered
      })

      setEdges((eds) => {
        const filtered = eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
        console.log("Edges after deletion:", filtered.length)
        return filtered
      })

      toast({
        title: "Workflow Removed",
        description: "Workflow removed from canvas",
      })
    },
    [setNodes, setEdges],
  )

  useEffect(() => {
    const savedCanvas = localStorage.getItem("workflow-canvas")
    if (savedCanvas) {
      try {
        const { nodes: savedNodes, connections: savedConnections } = JSON.parse(savedCanvas)
        console.log("Loading saved canvas:", { nodes: savedNodes.length, connections: savedConnections.length })

        const flowNodes: Node[] = savedNodes.map((node: any) => ({
          id: node.id,
          type: "workflowNode",
          position: node.position,
          data: {
            workflow: node.workflow,
            nodeId: node.id,
            onDelete: deleteNode,
          },
        }))

        const flowEdges: Edge[] = savedConnections.map((conn: any) => ({
          id: conn.id,
          source: conn.sourceId,
          target: conn.targetId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#3b82f6",
          },
        }))

        setNodes(flowNodes)
        setEdges(flowEdges)
      } catch (error) {
        console.error("Error loading canvas:", error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: deleteNode,
        },
      })),
    )
  }, [deleteNode, setNodes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete" && selectedEdge) {
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge))
        setSelectedEdge(null)
        toast({
          title: "Connection Deleted",
          description: "Workflow connection removed",
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedEdge, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3b82f6",
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
      toast({
        title: "Workflows Connected",
        description: "Workflows linked successfully",
      })
    },
    [setEdges],
  )

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation()
      setSelectedEdge(edge.id)
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edge.id
            ? { ...e, style: { ...e.style, stroke: "#ef4444", strokeWidth: 3 } }
            : { ...e, style: { ...e.style, stroke: "#3b82f6", strokeWidth: 2 } },
        ),
      )
    },
    [setEdges],
  )

  const onPaneClick = useCallback(() => {
    if (selectedEdge) {
      setSelectedEdge(null)
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          style: { ...e.style, stroke: "#3b82f6", strokeWidth: 2 },
        })),
      )
    }
  }, [selectedEdge, setEdges])

  const addWorkflowNode = useCallback(
    (workflow: WorkflowType) => {
      const centerX = window.innerWidth / 2 - 150
      const centerY = window.innerHeight / 2 - 100
      const offset = nodes.length * 50

      const nodeId = `node-${Date.now()}`

      const newNode: Node = {
        id: nodeId,
        type: "workflowNode",
        position: { x: centerX + offset, y: centerY + offset },
        data: {
          workflow,
          nodeId: nodeId,
          onDelete: deleteNode,
        },
      }

      console.log("Adding new node:", nodeId)
      setNodes((nds) => [...nds, newNode])
      setShowWorkflowSelector(false)
      setSearchQuery("")
      toast({
        title: "Workflow Added",
        description: `${workflow.name} added to canvas`,
      })
    },
    [setNodes, nodes.length, deleteNode],
  )

  const handleSave = () => {
    console.log("===== SAVE CANVAS STARTED =====")
    console.log("Total nodes:", nodes.length)
    console.log("Total edges:", edges.length)

    const savedNodes = nodes.map((node) => ({
      id: node.id,
      workflowId: node.data.workflow.id,
      workflow: node.data.workflow,
      position: node.position,
    }))

    const savedConnections = edges.map((edge) => ({
      id: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
    }))

    const workflowNames = nodes.map((node) => node.data.workflow.name)
    console.log("Workflows in canvas:", workflowNames)

    setSaveDetails({
      nodes: nodes.length,
      connections: edges.length,
      workflows: workflowNames,
    })

    console.log("Calling onSave callback...")
    onSave?.(savedNodes, savedConnections)
    console.log("onSave callback completed")

    console.log("Dispatching canvas-saved event...")
    window.dispatchEvent(
      new CustomEvent("workflow-canvas-saved", {
        detail: { nodes: nodes.length, connections: edges.length },
      }),
    )
    console.log("Event dispatched")

    setShowSaveDialog(true)
    console.log("===== SAVE CANVAS COMPLETED =====")
  }

  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Workflow className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workflow Canvas</h2>
            <p className="text-xs text-gray-500">
              {nodes.length} workflow{nodes.length !== 1 ? "s" : ""} • {edges.length} connection
              {edges.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Canvas
          </Button>
        </div>
      </div>

      {showWorkflowSelector && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 transition-opacity"
            onClick={() => {
              setShowWorkflowSelector(false)
              setSearchQuery("")
            }}
          />
          {/* Side Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Add Workflow</h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setShowWorkflowSelector(false)
                  setSearchQuery("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Workflow List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredWorkflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all border group"
                    onClick={() => addWorkflowNode(workflow)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded group-hover:bg-blue-100 transition-colors">
                        <Layers className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 mb-1">{workflow.name}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{workflow.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {workflow.steps?.length || 0} steps
                          </Badge>
                          {workflow.isActive && <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredWorkflows.length === 0 && (
                  <div className="text-center py-12">
                    <Workflow className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      {searchQuery ? "No workflows found" : "No workflows available"}
                    </p>
                    {searchQuery && <p className="text-xs text-gray-400">Try adjusting your search</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-gray-50"
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#3b82f6",
            },
          }}
          connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
          connectionLineType="smoothstep"
        >
          <Background gap={16} size={1} color="#d1d5db" />
          <Controls className="bg-white border rounded-lg shadow" />
          <MiniMap nodeColor={(node) => "#3b82f6"} className="bg-white border rounded-lg shadow" />

          <Panel position="bottom-center" className="mb-4">
            <Button
              onClick={() => setShowWorkflowSelector(!showWorkflowSelector)}
              size="lg"
              className="gap-2 shadow-lg rounded-full"
            >
              <Plus className="h-5 w-5" />
              Add Workflow
            </Button>
          </Panel>

          <Panel position="top-center">
            {nodes.length === 0 && (
              <Card className="p-6 max-w-md text-center bg-white shadow-lg border">
                <div className="p-3 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                  <Workflow className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-base mb-2 text-gray-900">Start Building Your Workflow</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click the + button below to add workflows. Connect them by dragging from one handle to another.
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                    <span>Connection points</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trash2 className="h-3 w-3" />
                    <span>Click edge + Delete</span>
                  </div>
                </div>
              </Card>
            )}
            {selectedEdge && (
              <Card className="p-3 bg-red-50 border-red-200 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span className="text-red-900 font-medium">Press Delete to remove connection</span>
                </div>
              </Card>
            )}
          </Panel>
        </ReactFlow>
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <AlertDialogTitle>Canvas Saved Successfully</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-4">
                <div className="text-base text-foreground">
                  Your workflow canvas has been saved with the following configuration:
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Workflows:</span>
                    <Badge variant="secondary">{saveDetails.nodes}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Connections:</span>
                    <Badge variant="secondary">{saveDetails.connections}</Badge>
                  </div>
                </div>

                {saveDetails.workflows.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Workflows in canvas:</div>
                    <div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {saveDetails.workflows.map((name, index) => (
                          <li key={index} className="text-muted-foreground">
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground pt-2">
                  You can now use this canvas workflow when creating new companies.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSaveDialog(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
