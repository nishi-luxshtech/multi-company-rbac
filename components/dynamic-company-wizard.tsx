"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, X, Loader2, AlertCircle } from "lucide-react"
import { workflowStorage, type Workflow, type WorkflowField } from "@/lib/workflow-storage"
import { WorkflowBridgeService } from "@/lib/api/services/workflow-bridge.service"
import { workflowInstanceAPI } from "@/lib/api/services/workflow-instance-api.service"
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { storageService, type WorkflowCompany } from "@/lib/storage-service"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { validateStep as validateStepUtil, validateField } from "@/lib/validation-utils"
import { useContext } from "react"
import { AuthContext, type Company } from "@/lib/auth-context"

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
  const [validatedSteps, setValidatedSteps] = useState<Set<number>>(new Set())
  const [stepValidationErrors, setStepValidationErrors] = useState<Record<number, string[]>>({})
  const [apiValidationErrors, setApiValidationErrors] = useState<Record<string, string>>({})
  const [apiValidationErrorFields, setApiValidationErrorFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()
  
  // Safely get currentCompany from auth context if available
  // Use useContext directly to avoid throwing error if not in provider
  const authContext = useContext(AuthContext)
  const currentCompany: Company | null = authContext?.currentCompany || null

  useEffect(() => {
    setCurrentStep(0)
    setErrors({})
    setCompletedSteps(new Set())
    setValidatedSteps(new Set())
    setStepValidationErrors({})
    setApiValidationErrors({})
    setApiValidationErrorFields(new Set())
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

  const progress = (validatedSteps.size / workflow.steps.length) * 100

  const isCurrentStepValid = () => {
    const requiredFields = (currentStepData.fields || []).filter((field) => field.required)
    return requiredFields.every((field) => {
      const value = formData[field.id]
      if (field.type === "checkbox") return value === true
      return value && value.toString().trim() !== ""
    })
  }

  const validateStep = () => {
    const newErrors = validateStepUtil(
      currentStepData.fields || [],
      formData
    )
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStepSubmit = () => {
    // Only use frontend validation for each step
    const isValid = validateStep()
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding.",
        variant: "destructive",
      })
      return
    }

    // Mark step as validated (frontend validation only)
    setValidatedSteps((prev) => new Set(prev).add(currentStep))
    setCompletedSteps((prev) => new Set(prev).add(currentStep))
    
    // Clear API validation errors for this step if user fixes them
    const stepFields = currentStepData.fields || []
    const updatedApiErrors = { ...apiValidationErrors }
    const updatedErrorFields = new Set(apiValidationErrorFields)
    let hasChanges = false

    stepFields.forEach((field) => {
      if (updatedApiErrors[field.id]) {
        delete updatedApiErrors[field.id]
        updatedErrorFields.delete(field.id)
        hasChanges = true
      }
    })

    if (hasChanges) {
      setApiValidationErrors(updatedApiErrors)
      setApiValidationErrorFields(updatedErrorFields)
    }

    // Clear step validation errors if fixed
    setStepValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[currentStep]
      return newErrors
    })

    console.log(`Step ${currentStep + 1} validated (frontend):`, currentStepData.name)

    toast({
      title: "Step Validated",
      description: `${currentStepData.name} has been validated and is ready for submission.`,
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
    // Check if all steps are validated (frontend validation)
    if (validatedSteps.size !== workflow.steps.length) {
      toast({
        title: "Incomplete Validation",
        description: `Please validate all ${workflow.steps.length} steps before final submission. ${validatedSteps.size}/${workflow.steps.length} validated.`,
        variant: "destructive",
      })
      return
    }

    // Final validation with API using all form data before submitting
    setIsSubmitting(true)
    setIsValidating(true)
    
    try {
      // Prepare complete data for validation
      const completeData: Record<string, any> = {
        company_id: currentCompany?.id ? parseInt(currentCompany.id) : companyId || 1,
      }

      // Map all form data to field names
      // The API expects field names in snake_case format (matching workflow field labels)
      workflow.steps.forEach((step) => {
        step.fields.forEach((field) => {
          const value = formData[field.id]
          if (value !== undefined && value !== null && value !== "") {
            // Convert field label to snake_case for API (e.g., "State/Province" -> "state_province")
            // This matches what the backend expects
            const fieldName = field.label
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "") || field.id
            completeData[fieldName] = value
          }
        })
      })

      // Validate all data with API before submitting
      console.log("Validating all data with API before submission...")
      const finalValidation = await dynamicWorkflowAPI.validateTableData(
        workflowId,
        completeData,
        false
      )

      if (!finalValidation.is_valid) {
        // Map API validation errors to form fields
        const apiErrors: Record<string, string> = {}
        const errorFieldIds = new Set<string>()
        const stepErrors: Record<number, string[]> = {}

        finalValidation.errors.forEach((error) => {
          // Normalize error field name (remove special chars, convert to lowercase)
          const errorFieldName = error.field_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
          
          // Search through all workflow steps to find matching field
          workflow.steps.forEach((step, stepIndex) => {
            step.fields.forEach((field) => {
              // Try multiple matching strategies
              const fieldLabelSnake = field.label
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") || ""
              const fieldNameSnake = field.id
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
              
              // Match by:
              // 1. Field name (snake_case of label) - most common
              // 2. Field ID (if it matches)
              // 3. Exact label match
              // 4. Field name from API matches field label
              if (
                errorFieldName === fieldLabelSnake ||
                errorFieldName === fieldNameSnake ||
                error.field_name === field.id ||
                error.field_label === field.label ||
                error.field_name.toLowerCase() === field.label?.toLowerCase()
              ) {
                apiErrors[field.id] = error.error_message
                errorFieldIds.add(field.id)
                
                // Track which step has errors
                if (!stepErrors[stepIndex]) {
                  stepErrors[stepIndex] = []
                }
                stepErrors[stepIndex].push(`${field.label || field.id}: ${error.error_message}`)
              }
            })
          })
        })

        // Set errors in state
        setApiValidationErrors(apiErrors)
        setApiValidationErrorFields(errorFieldIds)
        setStepValidationErrors(stepErrors)
        setErrors(apiErrors)

        // Find the first step with errors and navigate to it
        const firstErrorStep = Object.keys(stepErrors)[0]
        if (firstErrorStep) {
          setCurrentStep(parseInt(firstErrorStep))
        }

        // Show validation errors
        const errorMessages = finalValidation.errors.map((e) => `${e.field_label}: ${e.error_message}`).join(", ")
        toast({
          title: "Validation Failed",
          description: `Please fix ${finalValidation.errors.length} error(s). Navigate to the highlighted fields to fix them.`,
          variant: "destructive",
        })
        setIsValidating(false)
        setIsSubmitting(false)
        return
      }

      // Clear any previous API validation errors if validation passes
      setApiValidationErrors({})
      setApiValidationErrorFields(new Set())
      setStepValidationErrors({})

      // All validations passed, now submit to API
      console.log("All validations passed, submitting to API...")
      
      const result = await dynamicWorkflowAPI.createTableRecord(workflowId, completeData)
      
      console.log("Company created successfully:", result)

      toast({
        title: "Company Created Successfully",
        description: `Company has been created using workflow: ${workflow.name}`,
      })

      onComplete()
    } catch (error: any) {
      console.error("Final submission error:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to create company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsValidating(false)
    }
  }

  // Helper function to update form data and clear API errors for that field
  const updateFormData = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value })
    
    // Clear API validation error for this field if user is fixing it
    if (apiValidationErrors[fieldId]) {
      const updatedApiErrors = { ...apiValidationErrors }
      delete updatedApiErrors[fieldId]
      setApiValidationErrors(updatedApiErrors)
      
      const updatedErrorFields = new Set(apiValidationErrorFields)
      updatedErrorFields.delete(fieldId)
      setApiValidationErrorFields(updatedErrorFields)
      
      // Also clear from step errors if this field's error is resolved
      if (workflow) {
        workflow.steps.forEach((step, stepIndex) => {
          if (step.fields.some((f) => f.id === fieldId) && stepValidationErrors[stepIndex]) {
            const stepFields = step.fields || []
            const hasOtherErrors = stepFields.some(
              (f) => f.id !== fieldId && updatedApiErrors[f.id]
            )
            if (!hasOtherErrors) {
              setStepValidationErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[stepIndex]
                return newErrors
              })
            }
          }
        })
      }
    }
  }

  const renderField = (field: WorkflowField) => {
    const value = formData[field.id]
    const error = errors[field.id] || apiValidationErrors[field.id]
    const hasApiError = apiValidationErrorFields.has(field.id)

    const commonProps = {
      id: field.id,
      className: `h-11 ${error || hasApiError ? "border-red-500 ring-2 ring-red-200" : ""}`,
    }

    switch (field.type) {
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => updateFormData(field.id, checked)}
            />
            <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
              {field.label}
            </Label>
          </div>
        )

      case "select":
        return (
          <Select value={value || ""} onValueChange={(val) => updateFormData(field.id, val)}>
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
            onChange={(e) => updateFormData(field.id, e.target.value)}
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
            onChange={(e) => updateFormData(field.id, e.target.value)}
          />
        )

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            value={value || ""}
            onChange={(e) => updateFormData(field.id, e.target.value)}
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
              onCheckedChange={(checked) => updateFormData(field.id, checked)}
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
              onValueChange={(vals) => updateFormData(field.id, vals[0])}
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
          <RadioGroup value={value || ""} onValueChange={(val) => updateFormData(field.id, val)}>
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
                onClick={() => updateFormData(field.id, i + 1)}
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
            onChange={(e) => updateFormData(field.id, e.target.value)}
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
                onChange={(e) => updateFormData(field.id, { ...value, start: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">End Date</Label>
              <Input
                type="date"
                className={`h-11 mt-1 ${error ? "border-red-500" : ""}`}
                value={value?.end || ""}
                onChange={(e) => updateFormData(field.id, { ...value, end: e.target.value })}
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
                updateFormData(field.id, files)
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
              onChange={(e) => updateFormData(field.id, e.target.value)}
              className="h-11 w-20"
            />
            <Input
              type="text"
              value={value || ""}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              placeholder="#000000"
              className="h-11 flex-1"
            />
          </div>
        )

      case "combobox":
      case "multiselect":
        return (
          <Select value={value || ""} onValueChange={(val) => updateFormData(field.id, val)}>
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
            onChange={(e) => updateFormData(field.id, e.target.value)}
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
                {validatedSteps.size} of {workflow.steps.length} steps validated
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
                  className={`gap-2 ${
                  validatedSteps.has(index) && !stepValidationErrors[index]
                    ? "bg-green-50 text-green-700 data-[state=active]:bg-green-100"
                    : stepValidationErrors[index]
                      ? "bg-red-50 text-red-700 data-[state=active]:bg-red-100 border-2 border-red-300"
                      : ""
                }`}
              >
                {validatedSteps.has(index) && !stepValidationErrors[index] && <Check className="h-3 w-3" />}
                {stepValidationErrors[index] && <AlertCircle className="h-3 w-3" />}
                <span>{step.name}</span>
                {stepValidationErrors[index] && (
                  <span className="ml-1 text-xs">({stepValidationErrors[index].length})</span>
                )}
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
                      {validatedSteps.has(index) && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <Check className="h-4 w-4" />
                          Validated
                        </div>
                      )}
                      {stepValidationErrors[index] && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          <AlertCircle className="h-4 w-4" />
                          {stepValidationErrors[index].length} Error(s)
                        </div>
                      )}
                      {apiValidationErrorFields.size > 0 && Object.keys(stepValidationErrors).includes(index.toString()) && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-2">API Validation Errors:</p>
                          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            {stepValidationErrors[index]?.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
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
                            {(errors[field.id] || apiValidationErrors[field.id]) && (
                              <p className="text-sm text-red-600 font-medium">
                                {errors[field.id] || apiValidationErrors[field.id]}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-muted-foreground">
                  {validatedSteps.has(index)
                    ? "This step has been validated. You can edit and revalidate if needed."
                    : stepValidationErrors[index]
                      ? `Please fix ${stepValidationErrors[index].length} error(s) before validating.`
                    : "Complete all required fields and validate this step."}
                </div>
                <Button
                  onClick={handleStepSubmit}
                  size="lg"
                  disabled={!isCurrentStepValid() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {validatedSteps.has(index) ? "Revalidate Step" : "Validate Step"}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-3">
          {apiValidationErrorFields.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>
                {apiValidationErrorFields.size} field(s) need to be fixed before submission
              </span>
            </div>
          )}
          <Button
            onClick={handleFinalSubmit}
            size="lg"
            disabled={validatedSteps.size !== workflow.steps.length || isSubmitting || isValidating || apiValidationErrorFields.size > 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isValidating ? "Validating..." : "Submitting..."}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Submit All {workflow.steps.length} Steps
                {validatedSteps.size !== workflow.steps.length && ` (${validatedSteps.size}/${workflow.steps.length})`}
                {apiValidationErrorFields.size > 0 && ` - ${apiValidationErrorFields.size} error(s) to fix`}
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
                      : validatedSteps.has(index) && !stepValidationErrors[index]
                        ? "bg-green-100 text-green-700"
                        : stepValidationErrors[index]
                          ? "bg-red-100 text-red-700 border-2 border-red-300"
                          : index < currentStep
                            ? "bg-gray-200 text-gray-600"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {validatedSteps.has(index) && !stepValidationErrors[index] && <Check className="h-3 w-3" />}
                  {stepValidationErrors[index] && <AlertCircle className="h-3 w-3" />}
                  <span>{step.name}</span>
                  {stepValidationErrors[index] && (
                    <span className="ml-1 text-xs font-bold">({stepValidationErrors[index].length})</span>
                  )}
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
                    {(errors[field.id] || apiValidationErrors[field.id]) && (
                      <p className="text-sm text-red-600 font-medium">
                        {errors[field.id] || apiValidationErrors[field.id]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show API validation errors summary if any */}
      {apiValidationErrorFields.size > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  {apiValidationErrorFields.size} field(s) need to be fixed before submission
                </h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {Object.entries(apiValidationErrors).map(([fieldId, errorMsg]) => {
                    const field = workflow.steps
                      .flatMap((s) => s.fields || [])
                      .find((f) => f.id === fieldId)
                    return (
                      <li key={fieldId}>
                        <strong>{field?.label || fieldId}:</strong> {errorMsg}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <div className="flex gap-3">
          {apiValidationErrorFields.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{apiValidationErrorFields.size} error(s) to fix</span>
            </div>
          )}
          <Button
            onClick={handleFinalSubmit}
            size="lg"
            disabled={validatedSteps.size !== workflow.steps.length || isSubmitting || isValidating || apiValidationErrorFields.size > 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isValidating ? "Validating..." : "Submitting..."}
            </>
          ) : (
            <>
                <Check className="mr-2 h-4 w-4" />
                Submit All Steps
                {apiValidationErrorFields.size > 0 && ` (${apiValidationErrorFields.size} errors)`}
            </>
          )}
        </Button>
        </div>
      </div>
    </div>
  )
}
