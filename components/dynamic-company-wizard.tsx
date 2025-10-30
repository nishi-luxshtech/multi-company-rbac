"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, X, Loader2 } from "lucide-react"
import { workflowStorage, type Workflow, type WorkflowField } from "@/lib/workflow-storage"
import { WorkflowBridgeService } from "@/lib/api/services/workflow-bridge.service"
import { workflowInstanceAPI } from "@/lib/api/services/workflow-instance-api.service"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { storageService, type WorkflowCompany } from "@/lib/storage-service"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DynamicCompanyWizardProps {
  workflowId: string
  companyId?: number
  viewMode?: "wizard" | "tabs"
  onComplete: () => void
  onCancel: () => void
}

export function DynamicCompanyWizard({
  workflowId,
  companyId,
  viewMode = "wizard",
  onComplete,
  onCancel,
}: DynamicCompanyWizardProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setCurrentStep(0)
    setErrors({})
    setCompletedSteps(new Set())
    loadWorkflow()
  }, [workflowId])

  const loadWorkflow = async () => {
    try {
      // Try to load from dynamic workflow API first
      const dynamicWorkflow = await WorkflowBridgeService.getWorkflowById(workflowId)
      
      if (dynamicWorkflow) {
        // Convert to frontend format
        const convertedWorkflow: Workflow = {
          id: dynamicWorkflow.id,
          name: dynamicWorkflow.name,
          description: dynamicWorkflow.description,
          steps: dynamicWorkflow.steps.map(step => ({
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
          isActive: dynamicWorkflow.isActive,
          createdAt: dynamicWorkflow.createdAt,
          updatedAt: dynamicWorkflow.updatedAt,
          connectedWorkflows: dynamicWorkflow.connectedWorkflows,
          triggerType: dynamicWorkflow.triggerType,
          category: dynamicWorkflow.category,
        }
        setWorkflow(convertedWorkflow)
        console.log("DynamicCompanyWizard: Loaded dynamic workflow", workflowId)
        
        // Initialize form data
        const initialData: Record<string, any> = {}
        convertedWorkflow.steps.forEach((step) => {
          step.fields.forEach((field) => {
            initialData[field.id] = field.type === "checkbox" ? false : ""
          })
        })
        setFormData(initialData)
      } else {
        // Fallback to localStorage
        const wf = workflowStorage.getById(workflowId)
        console.log("DynamicCompanyWizard: Loading workflow from localStorage", workflowId, wf ? "found" : "not found")
        
        if (wf) {
          console.log("DynamicCompanyWizard: Workflow has", wf.steps?.length || 0, "steps")
          setWorkflow(wf)
          const initialData: Record<string, any> = {}
          ;(wf.steps || []).forEach((step) => {
            ;(step.fields || []).forEach((field) => {
              initialData[field.id] = field.type === "checkbox" ? false : ""
            })
          })
          setFormData(initialData)
        } else {
          console.error("DynamicCompanyWizard: Workflow not found:", workflowId)
          setWorkflow(null)
          toast({
            title: "Error",
            description: "Workflow not found",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("DynamicCompanyWizard: Failed to load workflow from API, using localStorage:", error)
      // Fallback to localStorage
      const wf = workflowStorage.getById(workflowId)
      if (wf) {
        setWorkflow(wf)
        const initialData: Record<string, any> = {}
        ;(wf.steps || []).forEach((step) => {
          ;(step.fields || []).forEach((field) => {
            initialData[field.id] = field.type === "checkbox" ? false : ""
          })
        })
        setFormData(initialData)
      } else {
        toast({
          title: "Error",
          description: "Workflow not found",
          variant: "destructive",
        })
      }
    }
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    )
  }

  if (!workflow.steps || workflow.steps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Error: Workflow has no steps</p>
          <Button onClick={onCancel} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const currentStepData = workflow.steps[currentStep]

  if (!currentStepData) {
    console.error(
      "DynamicCompanyWizard: Current step data not found. Step:",
      currentStep,
      "Total steps:",
      workflow.steps.length,
    )
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Error: Invalid step</p>
          <Button onClick={onCancel} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const progress = (completedSteps.size / workflow.steps.length) * 100

  const isCurrentStepValid = () => {
    const requiredFields = (currentStepData.fields || []).filter((field) => field.required)
    return requiredFields.every((field) => {
      const value = formData[field.id]
      if (field.type === "checkbox") return value === true
      return value && value.toString().trim() !== ""
    })
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    ;(currentStepData.fields || []).forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`
      }
      if (field.type === "email" && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = "Invalid email address"
        }
      }
      if (field.type === "url" && formData[field.id]) {
        try {
          new URL(formData[field.id])
        } catch {
          newErrors[field.id] = "Invalid URL"
        }
      }
      if (field.validation) {
        const value = formData[field.id]
        if (field.validation.min !== undefined && value && value.length < field.validation.min) {
          newErrors[field.id] = `Minimum ${field.validation.min} characters required`
        }
        if (field.validation.max !== undefined && value && value.length > field.validation.max) {
          newErrors[field.id] = `Maximum ${field.validation.max} characters allowed`
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStepSubmit = () => {
    if (!validateStep()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    console.log(`Marking step ${currentStep + 1} as complete:`, currentStepData.name)
    setCompletedSteps((prev) => new Set(prev).add(currentStep))

    toast({
      title: "Step Validated",
      description: `${currentStepData.name} is ready for submission.`,
    })
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < workflow.steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleFinalSubmit = async () => {
    if (completedSteps.size !== workflow.steps.length) {
      toast({
        title: "Incomplete Workflow",
        description: "Please complete and validate all steps before final submission.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("Starting batch submission of all steps...")

    const stepApiEndpoints: Record<string, string> = {
      "General Information": "/api/company/general-info",
      "Company Information": "/api/company/basic-info",
      Addresses: "/api/company/address",
      "Address Details": "/api/company/address",
      Communication: "/api/company/communication",
      "Message Setup": "/api/company/message-setup",
      Currency: "/api/company/currency",
      "Currency Rates": "/api/company/currency-rates",
      Employees: "/api/company/employees",
      Managers: "/api/company/managers",
      Admins: "/api/company/admins",
      "Site Creation": "/api/company/site",
    }

    try {
      const apiCalls = workflow.steps.map((step, index) => {
        const stepFields = step.fields || []
        const stepData: Record<string, any> = {}

        // Extract only the fields for this step
        stepFields.forEach((field) => {
          stepData[field.id] = formData[field.id]
        })

        const apiEndpoint = stepApiEndpoints[step.name] || `/api/company/step-${index + 1}`

        console.log(`Preparing API call for step ${index + 1}: ${step.name} -> ${apiEndpoint}`)

        // Return the API call promise
        return fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepName: step.name,
            stepIndex: index,
            stepData: stepData,
            allFormData: formData,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`API call failed for ${step.name}`)
            }
            return response.json()
          })
          .then((data) => {
            console.log(`✓ Step ${index + 1} (${step.name}) submitted successfully`)
            return { success: true, stepName: step.name, data }
          })
          .catch((error) => {
            console.error(`✗ Step ${index + 1} (${step.name}) failed:`, error)
            return { success: false, stepName: step.name, error: error.message }
          })
      })

      console.log(`Executing ${apiCalls.length} API calls in parallel...`)
      const results = await Promise.all(apiCalls)

      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      console.log(`Batch submission complete: ${successCount} succeeded, ${failureCount} failed`)

      const companyId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const companyName =
        formData.company_name || formData.name || formData.companyName || `Company ${new Date().toLocaleDateString()}`

      const workflowCompany: WorkflowCompany = {
        id: companyId,
        name: companyName,
        description: `Created via ${workflow?.name || "workflow"}`,
        workflowId: workflowId,
        workflowName: workflow?.name || "Unknown Workflow",
        formData: formData,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }

      storageService.saveWorkflowCompany(workflowCompany)
      console.log("Company saved to localStorage:", companyId)

      if (failureCount > 0) {
        const failedSteps = results.filter((r) => !r.success).map((r) => r.stepName)
        toast({
          title: "Company Saved (API Errors)",
          description: `${companyName} saved to localStorage. API calls failed (expected in prototype): ${failedSteps.join(", ")}`,
        })
      } else {
        toast({
          title: "Company Created Successfully",
          description: `${companyName} has been created. All ${workflow.steps.length} steps submitted successfully.`,
        })
      }

      onComplete()
    } catch (error) {
      console.error("Batch submission error:", error)

      const companyId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const companyName =
        formData.company_name || formData.name || formData.companyName || `Company ${new Date().toLocaleDateString()}`

      const workflowCompany: WorkflowCompany = {
        id: companyId,
        name: companyName,
        description: `Created via ${workflow?.name || "workflow"}`,
        workflowId: workflowId,
        workflowName: workflow?.name || "Unknown Workflow",
        formData: formData,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }

      storageService.saveWorkflowCompany(workflowCompany)
      console.log("Company saved to localStorage despite errors:", companyId)

      toast({
        title: "Company Saved Locally",
        description: `${companyName} has been saved to localStorage. API submission failed (expected in prototype).`,
      })

      onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: WorkflowField) => {
    const value = formData[field.id]
    const error = errors[field.id]

    const commonProps = {
      id: field.id,
      className: `h-11 ${error ? "border-red-500" : ""}`,
    }

    switch (field.type) {
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => setFormData({ ...formData, [field.id]: checked })}
            />
            <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
              {field.label}
            </Label>
          </div>
        )

      case "select":
        return (
          <Select value={value || ""} onValueChange={(val) => setFormData({ ...formData, [field.id]: val })}>
            <SelectTrigger {...commonProps}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "textarea":
        return (
          <Textarea
            {...commonProps}
            value={value || ""}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            rows={4}
            className={error ? "border-red-500" : ""}
          />
        )

      case "date":
        return (
          <Input
            {...commonProps}
            type="date"
            value={value || ""}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
          />
        )

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            value={value || ""}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case "switch":
        return (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.label}
            </Label>
            <Switch
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => setFormData({ ...formData, [field.id]: checked })}
            />
          </div>
        )

      case "slider":
        return (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Value: {value || field.validation?.min || 0}</span>
            </div>
            <Slider
              value={[value || field.validation?.min || 0]}
              onValueChange={(vals) => setFormData({ ...formData, [field.id]: vals[0] })}
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
              step={field.config?.step || 1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.validation?.min || 0}</span>
              <span>{field.validation?.max || 100}</span>
            </div>
          </div>
        )

      case "radio":
        return (
          <RadioGroup value={value || ""} onValueChange={(val) => setFormData({ ...formData, [field.id]: val })}>
            {field.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                <Label htmlFor={`${field.id}-${idx}`} className="font-normal cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "rating":
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.config?.maxStars || 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFormData({ ...formData, [field.id]: i + 1 })}
                className="text-3xl hover:scale-110 transition-transform"
              >
                {i < (value || 0) ? "⭐" : "☆"}
              </button>
            ))}
            {value > 0 && <span className="ml-2 text-sm text-muted-foreground">({value} stars)</span>}
          </div>
        )

      case "time":
        return (
          <Input
            {...commonProps}
            type="time"
            value={value || ""}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
          />
        )

      case "daterange":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-muted-foreground">Start Date</Label>
              <Input
                type="date"
                className={`h-11 mt-1 ${error ? "border-red-500" : ""}`}
                value={value?.start || ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: { ...value, start: e.target.value } })}
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">End Date</Label>
              <Input
                type="date"
                className={`h-11 mt-1 ${error ? "border-red-500" : ""}`}
                value={value?.end || ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: { ...value, end: e.target.value } })}
              />
            </div>
          </div>
        )

      case "file":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept={field.validation?.accept}
              multiple={field.config?.multiple}
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setFormData({ ...formData, [field.id]: files })
              }}
              className="h-11"
            />
            {value && value.length > 0 && (
              <p className="text-sm text-muted-foreground">{value.length} file(s) selected</p>
            )}
          </div>
        )

      case "color":
        return (
          <div className="flex gap-3">
            <Input
              type="color"
              value={value || "#000000"}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              className="h-11 w-20"
            />
            <Input
              type="text"
              value={value || ""}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              placeholder="#000000"
              className="h-11 flex-1"
            />
          </div>
        )

      case "combobox":
      case "multiselect":
        return (
          <Select value={value || ""} onValueChange={(val) => setFormData({ ...formData, [field.id]: val })}>
            <SelectTrigger {...commonProps}>
              <SelectValue
                placeholder={
                  field.type === "multiselect"
                    ? field.placeholder || "Select multiple options..."
                    : field.placeholder || "Search and select..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
            value={value || ""}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            placeholder={field.placeholder}
          />
        )
    }
  }

  if (viewMode === "tabs") {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{companyId ? "Edit Company" : "Create Company"}</h2>
            <p className="text-muted-foreground mt-2">Using workflow: {workflow.name}</p>
          </div>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Tab View Mode</span>
                <span className="text-muted-foreground">
                  {completedSteps.size} of {workflow.steps.length} steps validated
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs View */}
        <Tabs value={currentStep.toString()} onValueChange={(v) => setCurrentStep(Number.parseInt(v))}>
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            {workflow.steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={index.toString()}
                className={`gap-2 ${completedSteps.has(index) ? "bg-green-50 text-green-700 data-[state=active]:bg-green-100" : ""}`}
              >
                {completedSteps.has(index) && <Check className="h-3 w-3" />}
                <span>{step.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {workflow.steps.map((step, index) => (
            <TabsContent key={step.id} value={index.toString()} className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{step.name}</h3>
                        {step.description && <p className="text-muted-foreground mt-1">{step.description}</p>}
                      </div>
                      {completedSteps.has(index) && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <Check className="h-4 w-4" />
                          Validated
                        </div>
                      )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-12">
                      {(step.fields || []).map((field) => {
                        const widthClass =
                          field.layout?.width === "half"
                            ? "md:col-span-6"
                            : field.layout?.width === "third"
                              ? "md:col-span-4"
                              : "md:col-span-12"

                        return (
                          <div key={field.id} className={`space-y-2 ${widthClass}`}>
                            {field.type !== "checkbox" && field.type !== "switch" && (
                              <Label htmlFor={field.id} className="text-base font-semibold">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                            )}
                            {renderField(field)}
                            {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-muted-foreground">
                  {completedSteps.has(index)
                    ? "This step has been validated. You can edit and revalidate if needed."
                    : "Complete all required fields and validate this step."}
                </div>
                <Button
                  onClick={handleStepSubmit}
                  size="lg"
                  disabled={!isCurrentStepValid() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {completedSteps.has(index) ? "Revalidate Step" : "Validate Step"}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end">
          <Button
            onClick={handleFinalSubmit}
            size="lg"
            disabled={completedSteps.size !== workflow.steps.length || isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting All Steps...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Submit All {workflow.steps.length} Steps
                {completedSteps.size !== workflow.steps.length && ` (${completedSteps.size}/${workflow.steps.length})`}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{companyId ? "Edit Company" : "Create Company"}</h2>
          <p className="text-muted-foreground mt-2">Using workflow: {workflow.name}</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStep + 1} of {workflow.steps.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-2 flex-wrap">
              {workflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                    index === currentStep
                      ? "bg-blue-600 text-white"
                      : index < currentStep
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {index < currentStep && <Check className="h-3 w-3" />}
                  <span>{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">{currentStepData.name}</h3>
              {currentStepData.description && (
                <p className="text-muted-foreground mt-1">{currentStepData.description}</p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-12">
              {(currentStepData.fields || []).map((field) => {
                const widthClass =
                  field.layout?.width === "half"
                    ? "md:col-span-6"
                    : field.layout?.width === "third"
                      ? "md:col-span-4"
                      : "md:col-span-12"

                return (
                  <div key={field.id} className={`space-y-2 ${widthClass}`}>
                    {field.type !== "checkbox" && field.type !== "switch" && (
                      <Label htmlFor={field.id} className="text-base font-semibold">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                    )}
                    {renderField(field)}
                    {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} size="lg" className="bg-blue-600 hover:bg-blue-700">
          {currentStep === workflow.steps.length - 1 ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Complete
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
