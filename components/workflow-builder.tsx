"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, GripVertical, Save, ChevronDown, ChevronUp } from "lucide-react"
import { workflowStorage, type WorkflowStep } from "@/lib/workflow-storage"
import { WorkflowBridgeService } from "@/lib/api/services/workflow-bridge.service"
import { FrontendWorkflow, FieldType } from "@/lib/api/types/dynamic-workflow.types"
import { Switch } from "@/components/ui/switch"
import { WorkflowFieldBuilder } from "./workflow-field-builder"

interface WorkflowBuilderProps {
  workflowId?: string
  onBack: () => void
  onSave: () => void
}

export function WorkflowBuilder({ workflowId, onBack, onSave }: WorkflowBuilderProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null)
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWorkflow = async () => {
      if (workflowId) {
        try {
          // Try to load from API first
          const apiWorkflow = await WorkflowBridgeService.getWorkflowById(workflowId)
          if (apiWorkflow) {
            setName(apiWorkflow.name)
            setDescription(apiWorkflow.description)
            setIsActive(apiWorkflow.isActive)
            // Normalize step orders to start from 1 (fix for steps with order 0)
            const stepsWithFields = apiWorkflow.steps.map((step, index) => ({
              ...step,
              order: step.order && step.order > 0 ? step.order : index + 1,
              fields: (step.fields || []).map((field) => ({
                id: field.id,
                label: field.label,
                type: field.type as any,
                required: field.required,
                placeholder: field.placeholder,
                validation: field.validation,
                options: (field as any).options,
              })),
            }))
            setSteps(stepsWithFields)
            // Expand first step by default
            if (apiWorkflow.steps.length > 0) {
              setExpandedSteps(new Set([apiWorkflow.steps[0].id]))
            }
            return
          }
        } catch (apiError) {
          console.error("Failed to load workflow from API, trying localStorage:", apiError)
        }

        // Fallback to localStorage
        const workflow = workflowStorage.getById(workflowId)
        if (workflow) {
          setName(workflow.name)
          setDescription(workflow.description)
          setIsActive(workflow.isActive)
          // Normalize step orders to start from 1
          const stepsWithFields = workflow.steps.map((step, index) => ({
            ...step,
            order: step.order && step.order > 0 ? step.order : index + 1,
            fields: step.fields || [],
          }))
          setSteps(stepsWithFields)
          // Expand first step by default
          if (workflow.steps.length > 0) {
            setExpandedSteps(new Set([workflow.steps[0].id]))
          }
        }
      }
    }

    loadWorkflow()
  }, [workflowId])

  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Step ${steps.length + 1}`,
      description: "",
      order: steps.length + 1,
      fields: [],
    }
    setSteps([...steps, newStep])
    setExpandedSteps(new Set([...expandedSteps, newStep.id]))
  }

  const handleDeleteStep = (stepId: string) => {
    const filtered = steps.filter((s) => s.id !== stepId)
    // Reorder remaining steps
    const reordered = filtered.map((step, index) => ({ ...step, order: index + 1 }))
    setSteps(reordered)
    const newExpanded = new Set(expandedSteps)
    newExpanded.delete(stepId)
    setExpandedSteps(newExpanded)
  }

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)))
  }

  const handleMoveStep = (stepId: string, direction: "up" | "down") => {
    const index = steps.findIndex((s) => s.id === stepId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === steps.length - 1) return

    const newSteps = [...steps]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]

    // Update order numbers
    const reordered = newSteps.map((step, idx) => ({ ...step, order: idx + 1 }))
    setSteps(reordered)
  }

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a workflow name")
      return
    }

    setIsSaving(true)
    setError(null)
    
    try {
      const workflowData = {
        name: name.trim(),
        description: description.trim(),
        isActive,
        steps,
      }

      if (workflowId) {
        // Update existing workflow
        try {
          // Update full workflow including steps and fields via bridge
          await WorkflowBridgeService.updateWorkflow(workflowId, {
            name: workflowData.name,
            description: workflowData.description,
            isActive: workflowData.isActive,
            steps: workflowData.steps.map(step => ({
              id: step.id,
              name: step.name,
              description: step.description,
              order: step.order,
              fields: step.fields.map(field => ({
                id: field.id,
                label: field.label,
                type: (field.type === "multiselect" ? "multi_select" : field.type) as any,
                required: field.required,
                placeholder: field.placeholder,
                validation: field.validation,
                options: field.options,
              })),
            })) as any,
          })
          console.log("Workflow updated via API")
        } catch (apiError) {
          console.error("Failed to update workflow via API, using localStorage:", apiError)
          workflowStorage.update(workflowId, workflowData)
        }
      } else {
        // Create new workflow
        try {
          // Convert to FrontendWorkflow format for API
          const apiWorkflow: Omit<FrontendWorkflow, "id" | "createdAt" | "updatedAt"> = {
            name: workflowData.name,
            description: workflowData.description,
            isActive: workflowData.isActive,
            steps: workflowData.steps.map(step => ({
              id: step.id,
              name: step.name,
              description: step.description,
              order: step.order,
              fields: step.fields.map(field => ({
                id: field.id,
                name: field.id, // Use field.id as name for API
                label: field.label,
                type: field.type as FieldType,
                order: 1, // Default order
                required: field.required,
                placeholder: field.placeholder,
                validation: field.validation ? {
                  min_value: field.validation.min,
                  max_value: field.validation.max,
                  pattern: field.validation.pattern,
                  required: field.required,
                  options: []
                } : undefined
              }))
            }))
          }
          
          await WorkflowBridgeService.createWorkflow(apiWorkflow)
          console.log("Workflow created via API")
        } catch (apiError) {
          console.error("Failed to create workflow via API, using localStorage:", apiError)
          workflowStorage.create(workflowData)
        }
      }

      onSave()
    } catch (error) {
      console.error("Failed to save workflow:", error)
      setError("Failed to save workflow")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", stepId)
  }

  const handleDragOver = (e: React.DragEvent, stepId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStepId(stepId)
  }

  const handleDragLeave = () => {
    setDragOverStepId(null)
  }

  const handleDrop = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault()
    if (!draggedStepId || draggedStepId === targetStepId) {
      setDraggedStepId(null)
      setDragOverStepId(null)
      return
    }

    const draggedIndex = steps.findIndex((s) => s.id === draggedStepId)
    const targetIndex = steps.findIndex((s) => s.id === targetStepId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newSteps = [...steps]
    const [draggedStep] = newSteps.splice(draggedIndex, 1)
    newSteps.splice(targetIndex, 0, draggedStep)

    // Update order numbers
    const reordered = newSteps.map((step, idx) => ({ ...step, order: idx + 1 }))
    setSteps(reordered)
    setDraggedStepId(null)
    setDragOverStepId(null)
  }

  const handleDragEnd = () => {
    setDraggedStepId(null)
    setDragOverStepId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{workflowId ? "Edit Workflow" : "Create Workflow"}</h2>
            <p className="text-muted-foreground mt-2">Configure steps and fields for company onboarding</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-5 w-5" />
          {isSaving ? "Saving..." : "Save Workflow"}
        </Button>
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

      {/* Workflow Details */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
          <CardDescription>Basic information about this workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="workflow-name" className="text-base font-semibold">
              Workflow Name *
            </Label>
            <Input
              id="workflow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Company Onboarding"
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workflow-description" className="text-base font-semibold">
              Description
            </Label>
            <Textarea
              id="workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this workflow..."
              rows={3}
              className="text-base resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="workflow-active" className="text-base font-semibold">
                Active Status
              </Label>
              <p className="text-sm text-muted-foreground">Active workflows can be selected when creating companies</p>
            </div>
            <Switch id="workflow-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Workflow Steps</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop to reorder • Click to expand and configure
            </p>
          </div>
          <Button onClick={handleAddStep} variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>

        {steps.length === 0 ? (
          <Card className="p-12 border-2 border-dashed">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">No steps added yet</div>
              <Button onClick={handleAddStep} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add First Step
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isExpanded = expandedSteps.has(step.id)
              const isDragging = draggedStepId === step.id
              const isDragOver = dragOverStepId === step.id

              return (
                <Card
                  key={step.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, step.id)}
                  onDragOver={(e) => handleDragOver(e, step.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, step.id)}
                  onDragEnd={handleDragEnd}
                  className={`overflow-hidden transition-all duration-200 ${
                    isDragging ? "opacity-50 scale-95 rotate-2" : ""
                  } ${isDragOver ? "border-blue-500 border-2 shadow-lg" : ""}`}
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleStepExpanded(step.id)}
                  >
                    <div className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1 transition-colors">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge variant="secondary" className="font-mono text-base px-3 py-1">
                      {step.order}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-semibold text-base">{step.name || `Step ${step.order}`}</div>
                      {step.description && <div className="text-sm text-muted-foreground mt-1">{step.description}</div>}
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {step.fields?.length || 0} fields
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm("Delete this step?")) {
                            handleDeleteStep(step.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-gradient-to-b from-muted/20 to-muted/5 p-6 space-y-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">Step Name *</Label>
                          <Input
                            value={step.name}
                            onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                            placeholder="e.g., General Information"
                            className="h-11 bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">Description</Label>
                          <Input
                            value={step.description}
                            onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                            placeholder="e.g., Basic company details"
                            className="h-11 bg-white"
                          />
                        </div>
                      </div>

                      <WorkflowFieldBuilder
                        fields={step.fields || []}
                        onFieldsChange={(fields) => handleUpdateStep(step.id, { fields })}
                      />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
