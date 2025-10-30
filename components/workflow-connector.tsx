"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Plus, X, WorkflowIcon, Link2, Save } from "lucide-react"
import { workflowStorage, type Workflow } from "@/lib/workflow-storage"
import { useToast } from "@/hooks/use-toast"

interface WorkflowConnectorProps {
  workflowId: string
  onClose: () => void
}

export function WorkflowConnector({ workflowId, onClose }: WorkflowConnectorProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [allWorkflows, setAllWorkflows] = useState<Workflow[]>([])
  const [connectedWorkflows, setConnectedWorkflows] = useState<string[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadWorkflows()
  }, [workflowId])

  const loadWorkflows = () => {
    const current = workflowStorage.getById(workflowId)
    if (current) {
      setWorkflow(current)
      setConnectedWorkflows(current.connectedWorkflows || [])
    }

    // Get all workflows except the current one
    const all = workflowStorage.getAll().filter((w) => w.id !== workflowId)
    setAllWorkflows(all)
  }

  const handleAddConnection = () => {
    if (!selectedWorkflow) return

    if (connectedWorkflows.includes(selectedWorkflow)) {
      toast({
        title: "Already Connected",
        description: "This workflow is already connected",
        variant: "destructive",
      })
      return
    }

    setConnectedWorkflows([...connectedWorkflows, selectedWorkflow])
    setSelectedWorkflow("")
  }

  const handleRemoveConnection = (workflowIdToRemove: string) => {
    setConnectedWorkflows(connectedWorkflows.filter((id) => id !== workflowIdToRemove))
  }

  const handleSave = () => {
    if (!workflow) return

    workflowStorage.update(workflowId, {
      connectedWorkflows,
    })

    toast({
      title: "Connections Saved",
      description: "Workflow connections have been updated successfully",
    })

    onClose()
  }

  const getWorkflowById = (id: string) => {
    return allWorkflows.find((w) => w.id === id)
  }

  const availableWorkflows = allWorkflows.filter((w) => !connectedWorkflows.includes(w.id))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Connect Workflows</h2>
        <p className="text-muted-foreground mt-2">
          Link workflows together to create automated sequences. Connected workflows will run automatically after this
          workflow completes.
        </p>
      </div>

      {workflow && (
        <Card className="border-2 border-blue-600">
          <CardHeader>
            <div className="flex items-center gap-2">
              <WorkflowIcon className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Current Workflow</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold">{workflow.name}</h3>
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
              <div className="flex gap-2">
                <Badge variant="secondary">{workflow.steps?.length || 0} steps</Badge>
                <Badge variant={workflow.isActive ? "default" : "secondary"}>
                  {workflow.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Connection</CardTitle>
          <CardDescription>Select a workflow to connect to this one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workflow to connect" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkflows.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No workflows available</div>
                  ) : (
                    availableWorkflows.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.steps?.length || 0} steps)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddConnection} disabled={!selectedWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {connectedWorkflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Workflows</CardTitle>
            <CardDescription>These workflows will run in sequence after the current workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedWorkflows.map((connectedId, index) => {
                const connectedWorkflow = getWorkflowById(connectedId)
                if (!connectedWorkflow) return null

                return (
                  <div key={connectedId} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm font-medium">Step {index + 1}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-4 w-4 text-blue-600" />
                              <h4 className="font-semibold">{connectedWorkflow.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{connectedWorkflow.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {connectedWorkflow.steps?.length || 0} steps
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {connectedWorkflow.steps?.reduce((sum, step) => sum + (step.fields?.length || 0), 0) ||
                                  0}{" "}
                                fields
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveConnection(connectedId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Connections
        </Button>
      </div>
    </div>
  )
}
