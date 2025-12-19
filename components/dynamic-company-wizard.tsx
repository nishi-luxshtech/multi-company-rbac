"use client"

import { useState, useEffect, useRef } from "react"
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
  recordId?: string
  viewMode?: "wizard" | "tabs"
  onComplete: () => void
  onCancel: () => void
}

export function DynamicCompanyWizard({
  workflowId,
  companyId,
  recordId,
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
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const { toast } = useToast()
  
  // Refs to track loading state and prevent duplicate API calls
  const isLoadingWorkflowRef = useRef(false)
  const isLoadingDataRef = useRef(false)
  const dataLoadedRef = useRef(false)
  const countryFieldCheckRef = useRef(false)
  const workflowEffectTriggeredRef = useRef<Set<string>>(new Set())
  const recordEffectTriggeredRef = useRef<Set<string>>(new Set())
  
  // Safely get currentCompany from auth context if available
  // Use useContext directly to avoid throwing error if not in provider
  const authContext = useContext(AuthContext)
  const currentCompany: Company | null = authContext?.currentCompany || null

  useEffect(() => {
    const workflowKey = workflowId || "default-workflow"
    
    if (workflowEffectTriggeredRef.current.has(workflowKey)) {
      // Skip duplicate load triggered by React StrictMode
      return
    }
    
    workflowEffectTriggeredRef.current.add(workflowKey)
    
    // Reset state for new workflow load
    setCurrentStep(0)
    setErrors({})
    setCompletedSteps(new Set())
    setValidatedSteps(new Set())
    setStepValidationErrors({})
    setApiValidationErrors({})
    setApiValidationErrorFields(new Set())
    setLoadError(null)
    setDataLoaded(false)
    setIsLoadingWorkflow(true)
    setIsLoadingData(false)
    
    // Reset refs
    isLoadingDataRef.current = false
    dataLoadedRef.current = false
    countryFieldCheckRef.current = false
    
    loadWorkflow()
  }, [workflowId])

  // Load existing company data when editing (recordId is provided)
  useEffect(() => {
    if (!workflow) return
    
    if (recordId) {
      const recordKey = `${workflowId || "default-workflow"}-${recordId}`
      if (recordEffectTriggeredRef.current.has(recordKey)) {
        // Skip duplicate load triggered by React StrictMode
        return
      }
      recordEffectTriggeredRef.current.add(recordKey)
      loadExistingCompanyData()
    } else {
      // If no recordId, we're creating new - data is ready
      setDataLoaded(true)
      dataLoadedRef.current = true
      setIsLoadingData(false)
    }
  }, [workflow, recordId, workflowId])
  
  /**
   * ====================================================================
   * useEffect: Monitor Country Field Value
   * ====================================================================
   * 
   * This useEffect monitors formData changes and verifies the Country field has a value.
   * If the Country field is empty but we're in edit mode (recordId exists),
   * it means the value wasn't loaded properly.
   * 
   * This is a safety net to catch cases where:
   * - The value was set but React state didn't update properly
   * - The mapping failed but we can still recover
   * - The Select component rendered before the value was set
   * 
   * ====================================================================
   */
  useEffect(() => {
    // Skip if data is still loading, not loaded yet, or already checked
    if (!workflow || !recordId || isLoadingDataRef.current || !dataLoadedRef.current || countryFieldCheckRef.current) {
      return
    }
    
    // Mark as checked to prevent duplicate calls
    countryFieldCheckRef.current = true
    
    // Find ALL Country fields (Step 1 AND Step 2)
    const allCountryFields = workflow.steps
      .flatMap((step, stepIndex) => 
        step.fields
          .filter(f => f.label?.toLowerCase().includes("country"))
          .map(field => ({ field, step, stepIndex }))
      )
    
    if (allCountryFields.length === 0) return
    
    // Check each Country field
    const emptyCountryFields = allCountryFields.filter(({ field, stepIndex }) => {
      const value = formData[field.id]
      if (value && value !== "") {
        console.log(`✅ Step ${stepIndex + 1} Country field value confirmed in formData:`, value)
        return false
      }
      return true
    })
    
    // If any Country field is empty, try to fix it
    // BUT only if data has finished loading (not during initial load)
    if (emptyCountryFields.length > 0 && dataLoadedRef.current) {
      console.warn(`⚠️ ${emptyCountryFields.length} Country field(s) are EMPTY in formData!`)
      emptyCountryFields.forEach(({ field, step, stepIndex }) => {
        console.warn(`   - Step ${stepIndex + 1} (${step.name}): Field ID ${field.id}`)
      })
      console.warn(`   This should not happen if data was loaded correctly.`)
      console.warn(`   Check the loadExistingCompanyData function logs above.`)
      
      // Try to fetch and set the value one more time as a last resort
      // This will only run if the value is still empty after all other attempts
      // Only run once - prevent duplicate API calls
      const fetchAndSetCountry = async () => {
        // Double check - skip if data is loading
        if (isLoadingDataRef.current) {
          return
        }
        
        try {
          // Use getTableRecord API if recordId is available (more efficient)
          // Otherwise fall back to getTableData
          let record: any = null
          
          if (recordId) {
            try {
              record = await dynamicWorkflowAPI.getTableRecord(workflowId, recordId)
              console.log("Last resort: Fetched record using getTableRecord:", record)
            } catch (error) {
              console.warn("getTableRecord failed in fetchAndSetCountry, falling back to getTableData:", error)
              // Fall through to getTableData
            }
          }
          
          if (!record) {
            // Fallback to getTableData
            const tableDataResponse = await dynamicWorkflowAPI.getTableData(
              workflowId,
              companyId,
              100,
              0,
              true // group_by_step = true
            )
            
            // Find the matching record
            if (tableDataResponse.records && tableDataResponse.records.length > 0) {
              if (recordId) {
                record = tableDataResponse.records.find(r => 
                  r.id === recordId || String(r.id) === String(recordId)
                )
              }
              if (!record && companyId) {
                record = tableDataResponse.records.find(r => 
                  r.company_id === companyId || String(r.company_id) === String(companyId)
                )
              }
              if (!record && tableDataResponse.records.length === 1) {
                record = tableDataResponse.records[0]
              }
            }
          }
          
          if (!record) {
            console.error("Record not found in fetchAndSetCountry fallback")
            return
          }
          
          setFormData(prev => {
            const updated = { ...prev }
            let hasChanges = false
            
            emptyCountryFields.forEach(({ field, step, stepIndex }) => {
              // For Step 2 (Addresses), prefer address_country
              if (stepIndex === 1 || step.name?.toLowerCase().includes("address")) {
                if (record.address_country && !prev[field.id]) {
                  updated[field.id] = String(record.address_country)
                  hasChanges = true
                  console.log(`🔄 Last resort: Setting Step ${stepIndex + 1} (${step.name}) Country from address_country:`, record.address_country)
                } else if (record.country && !prev[field.id]) {
                  updated[field.id] = String(record.country)
                  hasChanges = true
                  console.log(`🔄 Last resort: Setting Step ${stepIndex + 1} (${step.name}) Country from country:`, record.country)
                }
              } else {
                // For Step 1 (General Information), prefer country
                if (record.country && !prev[field.id]) {
                  updated[field.id] = String(record.country)
                  hasChanges = true
                  console.log(`🔄 Last resort: Setting Step ${stepIndex + 1} (${step.name}) Country from country:`, record.country)
                } else if (record.address_country && !prev[field.id]) {
                  updated[field.id] = String(record.address_country)
                  hasChanges = true
                  console.log(`🔄 Last resort: Setting Step ${stepIndex + 1} (${step.name}) Country from address_country:`, record.address_country)
                }
              }
            })
            
            return hasChanges ? updated : prev
          })
        } catch (error) {
          console.error("Error in last resort Country field fetch:", error)
        }
      }
      
      // Only try once, after a delay to avoid infinite loops
      const timeoutId = setTimeout(fetchAndSetCountry, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [formData, workflow, recordId, workflowId])

  const loadWorkflow = async () => {
    // Prevent duplicate calls
    if (isLoadingWorkflowRef.current) {
      console.log("Workflow already loading, skipping duplicate call")
      return
    }
    
    try {
      isLoadingWorkflowRef.current = true
      setIsLoadingWorkflow(true)
      setLoadError(null)
      
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
          const errorMsg = "Workflow not found"
          setWorkflow(null)
          setLoadError(errorMsg)
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error("DynamicCompanyWizard: Failed to load workflow:", error)
      const errorMsg = error?.response?.data?.detail || error?.message || "Failed to load workflow"
      setLoadError(errorMsg)
      
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
        // Still show warning but continue
        toast({
          title: "Warning",
          description: "Loaded workflow from cache. Some features may not be available.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } finally {
      isLoadingWorkflowRef.current = false
      setIsLoadingWorkflow(false)
    }
  }
  
  const loadExistingCompanyData = async () => {
    // Prevent duplicate calls
    // Allow loading if recordId OR companyId is available (backward compatibility)
    if (isLoadingDataRef.current || dataLoadedRef.current || !workflow || (!recordId && !companyId)) {
      console.log("Data already loading or loaded, skipping duplicate call", {
        isLoading: isLoadingDataRef.current,
        isLoaded: dataLoadedRef.current,
        hasWorkflow: !!workflow,
        hasRecordId: !!recordId,
        hasCompanyId: !!companyId
      })
      return
    }

    try {
      isLoadingDataRef.current = true
      setIsLoadingData(true)
      setLoadError(null)
      console.log("Loading existing company data for editing:", { workflowId, recordId, companyId })
      
      let existingRecord: any = null
      
      // Use getTableRecord API if recordId is provided (more efficient and accurate)
      if (recordId) {
        console.log("Using getTableRecord API for specific record:", recordId)
        try {
          existingRecord = await dynamicWorkflowAPI.getTableRecord(workflowId, recordId)
          console.log("Record fetched from getTableRecord:", existingRecord)
        } catch (error: any) {
          // If getTableRecord fails (e.g., record not found), fall back to getTableData
          console.warn("getTableRecord failed, falling back to getTableData:", error)
          const tableDataResponse = await dynamicWorkflowAPI.getTableData(
            workflowId,
            companyId,
            100,
            0,
            true
          )
          
          if (tableDataResponse.records && tableDataResponse.records.length > 0) {
            existingRecord = tableDataResponse.records.find(r => 
              r.id === recordId || String(r.id) === String(recordId)
            ) || tableDataResponse.records[0]
          }
        }
      } else {
        // Fallback to getTableData if no recordId (backward compatibility)
        console.log("Using getTableData API (no recordId provided, using companyId)")
        const tableDataResponse = await dynamicWorkflowAPI.getTableData(
          workflowId,
          companyId, // Filter by company_id if available
          100, // limit
          0, // offset
          true // group_by_step = true
        )
        
        console.log("Table data response:", {
          total_records: tableDataResponse.total_records,
          records_count: tableDataResponse.records?.length || 0,
          grouped_by_step: tableDataResponse.grouped_by_step
        })
        
        // Find the matching record by companyId
        if (tableDataResponse.records && tableDataResponse.records.length > 0) {
          if (companyId) {
            existingRecord = tableDataResponse.records.find(r => 
              r.company_id === companyId || String(r.company_id) === String(companyId)
            )
          }
          
          // If still not found, use the first record (fallback)
          if (!existingRecord && tableDataResponse.records.length === 1) {
            existingRecord = tableDataResponse.records[0]
            console.log("Using first (and only) record as fallback")
          }
        }
      }
      
      if (!existingRecord) {
        throw new Error(
          `Record not found. ` +
          `Searched for recordId: ${recordId || 'none'}, companyId: ${companyId || 'none'}`
        )
      }
      
      console.log("Found matching record:", {
        id: existingRecord.id,
        company_id: existingRecord.company_id,
        has_steps: !!existingRecord.steps,
        steps_count: existingRecord.steps?.length || 0
      })
      
      console.log("=== LOADING EXISTING DATA ===")
      console.log("Full API Response:", JSON.stringify(existingRecord, null, 2))
      console.log("Workflow steps:", workflow.steps.map(s => ({ 
        name: s.name, 
        fields: s.fields.map(f => ({ id: f.id, label: f.label, type: f.type })) 
      })))
      
      // ====================================================================
      // DIRECT COUNTRY EXTRACTION FROM API - PRIORITY #1
      // ====================================================================
      // Extract country values per step from API response
      // CRITICAL: Extract country values separately for each step to avoid cross-contamination
      // ====================================================================
      let countryValueForGeneralInfo: string | null = null
      let countryValueForAddress: string | null = null
      
      // Method 1: Check flat structure
      if (existingRecord.country) {
        countryValueForGeneralInfo = String(existingRecord.country).trim()
        console.log("🎯 DIRECT EXTRACTION: Found country in flat structure (for General Info):", countryValueForGeneralInfo)
      }
      if (existingRecord.address_country) {
        countryValueForAddress = String(existingRecord.address_country).trim()
        console.log("🎯 DIRECT EXTRACTION: Found address_country in flat structure (for Address):", countryValueForAddress)
      }
      
      // Method 2: Check structured steps format - extract per step
      if (existingRecord.steps && Array.isArray(existingRecord.steps)) {
        for (const step of existingRecord.steps) {
          const stepName = (step.name || step.step_name || "").toLowerCase()
          const isAddressStep = stepName.includes("address") || step.order === 2 || step.step_order === 2
          const isGeneralInfoStep = stepName.includes("general") || step.order === 1 || step.step_order === 1
          
          if (step.fields) {
            let fieldsToCheck: any[] = []
            
            if (Array.isArray(step.fields)) {
              // Legacy format: fields is an array
              fieldsToCheck = step.fields
            } else if (typeof step.fields === 'object') {
              // New format (group_by_step=true): fields is an object { [fieldName]: { value, ... } }
              fieldsToCheck = Object.entries(step.fields).map(([fieldName, fieldData]: [string, any]) => ({
                name: fieldName,
                field_name: fieldName,
                value: fieldData?.value
              }))
            }
            
            for (const field of fieldsToCheck) {
              const fieldName = (field.name || field.field_name || "").toLowerCase()
              const fieldValue = field.value
              
              // Extract address_country for Address step
              if (isAddressStep && fieldName === "address_country" && fieldValue && fieldValue !== "" && fieldValue !== null) {
                countryValueForAddress = String(fieldValue).trim()
                console.log("🎯 DIRECT EXTRACTION: Found address_country in Address step:", {
                  stepName: step.name || step.step_name,
                  value: countryValueForAddress
                })
              }
              // Extract country for General Info step
              else if (isGeneralInfoStep && fieldName === "country" && fieldValue && fieldValue !== "" && fieldValue !== null) {
                countryValueForGeneralInfo = String(fieldValue).trim()
                console.log("🎯 DIRECT EXTRACTION: Found country in General Info step:", {
                  stepName: step.name || step.step_name,
                  value: countryValueForGeneralInfo
                })
              }
            }
          }
        }
      }
      
      // Method 3: Fallback - search all keys in the response
      if (!countryValueForGeneralInfo && existingRecord.country) {
        countryValueForGeneralInfo = String(existingRecord.country).trim()
      }
      if (!countryValueForAddress && existingRecord.address_country) {
        countryValueForAddress = String(existingRecord.address_country).trim()
      }
      
      // ====================================================================
      // FIND ALL COUNTRY FIELDS IN WORKFLOW (Step 1 AND Step 2)
      // ====================================================================
      const allCountryFields = workflow.steps
        .flatMap((step, stepIndex) => 
          step.fields
            .filter(f => f.label?.toLowerCase().includes("country"))
            .map(field => ({ field, step, stepIndex }))
        )
      
      console.log("🔍 Found Country fields in workflow:", allCountryFields.map(cf => ({
        stepIndex: cf.stepIndex,
        stepName: cf.step.name,
        fieldId: cf.field.id,
        fieldLabel: cf.field.label
      })))
      
      // Set country values per step - CRITICAL: Use step-specific values
      if (allCountryFields.length > 0) {
        console.log("✅ DIRECT SET: Setting country values per step:", {
          generalInfo: countryValueForGeneralInfo,
          address: countryValueForAddress,
          fieldsCount: allCountryFields.length
        })
        
        // Set it directly in formData immediately (before any other mapping)
        setFormData(prev => {
          const updated = { ...prev }
          
          // Set the value for each Country field based on its step
          allCountryFields.forEach(({ field, step, stepIndex }) => {
            const isAddressStep = stepIndex === 1 || step.name?.toLowerCase().includes("address")
            const isGeneralInfoStep = stepIndex === 0 || step.name?.toLowerCase().includes("general")
            
            let valueToSet: string | null = null
            
            // For Address step, ONLY use address_country value
            if (isAddressStep) {
              valueToSet = countryValueForAddress
              if (valueToSet) {
                console.log(`  ✅ Setting Address step (${step.name}) Country field ${field.id} = "${valueToSet}"`)
              } else {
                console.warn(`  ⚠️ Address step Country field ${field.id} has no value (address_country not found)`)
              }
            }
            // For General Info step, ONLY use country value
            else if (isGeneralInfoStep) {
              valueToSet = countryValueForGeneralInfo
              if (valueToSet) {
                console.log(`  ✅ Setting General Info step (${step.name}) Country field ${field.id} = "${valueToSet}"`)
              } else {
                console.warn(`  ⚠️ General Info step Country field ${field.id} has no value (country not found)`)
              }
            }
            // For other steps, try to determine based on step name
            else {
              if (step.name?.toLowerCase().includes("address")) {
                valueToSet = countryValueForAddress
              } else {
                valueToSet = countryValueForGeneralInfo
              }
            }
            
            if (valueToSet) {
              updated[field.id] = valueToSet
              console.log(`    Field ID: ${field.id}, Label: ${field.label}, Value: ${valueToSet}`)
            }
          })
          
          console.log("✅ DIRECT SET: Updated formData with country values per step")
          return updated
        })
      } else {
        console.error("❌ DIRECT SET FAILED: No Country fields found in workflow!")
        console.error("   Workflow fields:", workflow.steps.flatMap(s => s.fields).map(f => ({ id: f.id, label: f.label })))
      }
      
      // Find Country field specifically for debugging
      const countryFields = workflow.steps.flatMap(s => s.fields).filter(f => 
        f.label?.toLowerCase().includes("country") || f.id?.toLowerCase().includes("country")
      )
      console.log("Country-related fields in workflow:", countryFields)

      // Map the existing data to form fields
      const existingFormData: Record<string, any> = {}
      
      // Helper function to match API field to workflow field
      // stepContext: { step_id?: string, step_name?: string } - optional step context to search within specific step
      const findWorkflowField = (apiFieldName: string, apiFieldId?: string, apiFieldLabel?: string, stepContext?: { step_id?: string, step_name?: string }) => {
        const isCountryField = apiFieldName?.toLowerCase().includes("country") || apiFieldLabel?.toLowerCase().includes("country")
        if (isCountryField) {
          console.log("🔍 Searching for Country field match:", { apiFieldName, apiFieldId, apiFieldLabel, stepContext })
        }
        
        // Determine which steps to search in
        let stepsToSearch: typeof workflow.steps = []
        
        if (stepContext) {
          // If step context is provided, find the matching step first
          const matchingStep = workflow.steps.find(step => {
            if (stepContext.step_id && step.id === stepContext.step_id) return true
            if (stepContext.step_name && (step.name?.toLowerCase() === stepContext.step_name.toLowerCase() || 
                step.name?.toLowerCase().includes(stepContext.step_name.toLowerCase()))) return true
            return false
          })
          
          if (matchingStep) {
            // Search only within the matching step
            stepsToSearch = [matchingStep]
            if (isCountryField) {
              console.log(`  📍 Searching within step: ${matchingStep.name} (ID: ${matchingStep.id})`)
            }
          } else {
            // Step not found, fall back to searching all steps (backward compatibility)
            console.warn(`  ⚠️ Step context provided but step not found, falling back to all steps:`, stepContext)
            stepsToSearch = workflow.steps
          }
        } else {
          // No step context provided, search all steps (backward compatibility)
          stepsToSearch = workflow.steps
          if (isCountryField) {
            console.log("  📍 No step context, searching all steps")
          }
        }
        
        const matched = stepsToSearch
          .flatMap(s => s.fields)
          .find(f => {
            // 1. Match by field_id (most reliable)
            if (apiFieldId && f.id === apiFieldId) {
              if (isCountryField) console.log("  ✓ Matched by field_id:", f.id)
              return true
            }

            // 2. Allow normalized ID comparison
            if (apiFieldId) {
              const normalizedApiFieldId = apiFieldId
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
              const normalizedFieldId = f.id
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
              if (normalizedApiFieldId === normalizedFieldId) {
                if (isCountryField) console.log("  ✓ Matched by normalized ID:", f.id)
                return true
              }
            }

            // 3. Check if field ID matches the API field name
            if (f.id === apiFieldName) {
              if (isCountryField) console.log("  ✓ Matched by field ID:", f.id)
              return true
            }

            // 4. Check if field has a name property that matches
            const fieldName = (f as any).name
            if (fieldName === apiFieldName) {
              if (isCountryField) console.log("  ✓ Matched by field.name:", f.id)
              return true
            }
            
            // 5. Try matching by converting label to snake_case (exact match)
            if (f.label) {
              const labelSnakeCase = f.label
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
              if (labelSnakeCase === apiFieldName) {
                if (isCountryField) console.log("  ✓ Matched by exact label snake_case:", f.id, "label:", f.label)
                return true
              }
              
              // 6. Try matching by checking if API field name ends with label (handles prefixes like "address_country")
              const apiFieldNameLower = apiFieldName.toLowerCase()
              const labelSnakeCaseLower = labelSnakeCase.toLowerCase()
              
              // Check if API field name ends with the label (e.g., "address_country" ends with "country")
              if (apiFieldNameLower.endsWith("_" + labelSnakeCaseLower) || apiFieldNameLower === labelSnakeCaseLower) {
                if (isCountryField) console.log("  ✓ Matched by endsWith:", f.id, "label:", f.label, "apiName:", apiFieldName)
                return true
              }
              
              // Check if API field name contains the label (for cases like "address_country" containing "country")
              if (apiFieldNameLower.includes("_" + labelSnakeCaseLower) || apiFieldNameLower.includes(labelSnakeCaseLower)) {
                // Make sure it's not just a partial match (e.g., "country_code" shouldn't match "country")
                // But "address_country" should match "country"
                const parts = apiFieldNameLower.split("_")
                if (parts.includes(labelSnakeCaseLower)) {
                  if (isCountryField) console.log("  ✓ Matched by contains (word part):", f.id, "label:", f.label, "apiName:", apiFieldName)
                  return true
                }
              }
            }
            
            return false
          })
        
        if (isCountryField) {
          if (matched) {
            console.log("  ✅ Country field MATCHED:", { id: matched.id, label: matched.label })
          } else {
            console.log("  ❌ Country field NOT MATCHED")
            console.log("  Available workflow fields:", workflow.steps.flatMap(s => s.fields).map(f => ({ id: f.id, label: f.label })))
          }
        }
        
        return matched
      }
      
      // Process structured steps format if available
      // When group_by_step=true, fields is an object { [fieldName]: { field_id, field_label, value, ... } }
      // When group_by_step=false or from getTableRecord, fields might be an array
      if (existingRecord.steps && Array.isArray(existingRecord.steps)) {
        console.log("Processing steps from API response:", existingRecord.steps.length)
        
        existingRecord.steps.forEach((apiStep: any) => {
          const stepName = apiStep.name || apiStep.step_name
          const stepId = apiStep.step_id
          const fieldsCount = apiStep.fields 
            ? (Array.isArray(apiStep.fields) ? apiStep.fields.length : Object.keys(apiStep.fields).length)
            : 0
          console.log("Processing step:", stepName, "Step ID:", stepId, "Fields:", fieldsCount)
          
          // Prepare step context for field matching
          const stepContext = stepId || stepName ? { step_id: stepId, step_name: stepName } : undefined
          
          if (apiStep.fields) {
            // Handle both formats: object (group_by_step=true) and array (legacy)
            const fieldsToProcess: any[] = []
            
            if (Array.isArray(apiStep.fields)) {
              // Legacy format: fields is an array
              fieldsToProcess.push(...apiStep.fields.map((field: any) => ({
                name: field.name,
                field_id: field.field_id,
                value: field.value,
                label: field.label || field.field_label
              })))
            } else if (typeof apiStep.fields === 'object') {
              // New format (group_by_step=true): fields is an object { [fieldName]: { field_id, field_label, value, ... } }
              Object.entries(apiStep.fields).forEach(([fieldName, fieldData]: [string, any]) => {
                if (fieldData && typeof fieldData === 'object') {
                  fieldsToProcess.push({
                    name: fieldName, // Use the key as the field name
                    field_id: fieldData.field_id,
                    value: fieldData.value,
                    label: fieldData.field_label || fieldData.label
                  })
                }
              })
            }
            
            fieldsToProcess.forEach((apiField: any) => {
              const apiFieldName = apiField.name
              const apiFieldId = apiField.field_id
              const apiFieldValue = apiField.value
              const apiFieldLabel = apiField.label
              
              console.log("Processing API field:", { name: apiFieldName, id: apiFieldId, value: apiFieldValue, label: apiFieldLabel, step: stepName })
              
              // Process field if it has a name and a non-empty value
              if (apiFieldName && apiFieldValue !== undefined && apiFieldValue !== null && apiFieldValue !== "") {
                // Pass step context to ensure field is matched within the correct step
                const workflowField = findWorkflowField(apiFieldName, apiFieldId, apiFieldLabel, stepContext)
                
                if (workflowField) {
                  console.log("Matched workflow field:", { id: workflowField.id, label: workflowField.label, type: workflowField.type, apiName: apiFieldName })
                  
                  let value = apiFieldValue
                  
                  // Handle different field types
                  if (workflowField.type === "checkbox") {
                    value = Boolean(value)
                  } else if (workflowField.type === "number" || workflowField.type === "slider") {
                    value = value !== null && value !== undefined ? Number(value) : ""
                  } else if (value === null || value === undefined) {
                    value = ""
                  } else {
                    value = String(value)
                  }
                  
                  // Use workflow field ID as the key (this is what the form uses)
                  existingFormData[workflowField.id] = value
                  console.log("✓ Mapped field:", workflowField.id, "=", value, "(from API name:", apiFieldName, ")")
                } else {
                  console.warn("⚠ Could not find workflow field for API field:", { name: apiFieldName, id: apiFieldId, label: apiFieldLabel, value: apiFieldValue })
                  
                  // SPECIAL HANDLING: If this is address_country, directly map to Country field within the same step
                  if (apiFieldName === "address_country" || apiFieldName.toLowerCase().includes("country")) {
                    // Search for country field within the same step context (if available)
                    let countryField: WorkflowField | undefined
                    if (stepContext) {
                      // Find country field within the matching step
                      const matchingStep = workflow.steps.find(step => {
                        if (stepContext.step_id && step.id === stepContext.step_id) return true
                        if (stepContext.step_name && (step.name?.toLowerCase() === stepContext.step_name.toLowerCase() || 
                            step.name?.toLowerCase().includes(stepContext.step_name.toLowerCase()))) return true
                        return false
                      })
                      if (matchingStep) {
                        countryField = matchingStep.fields.find(f => f.label?.toLowerCase().includes("country"))
                        console.log(`  📍 Searching for Country field within step: ${matchingStep.name}`)
                      }
                    }
                    
                    // Fallback: if not found in step context or no context, search all steps (backward compatibility)
                    if (!countryField) {
                      countryField = workflow.steps
                        .flatMap(s => s.fields)
                        .find(f => f.label?.toLowerCase().includes("country"))
                      console.log(`  ⚠️ Country field not found in step context, searching all steps`)
                    }
                    
                    if (countryField && !existingFormData[countryField.id]) {
                      existingFormData[countryField.id] = String(apiFieldValue)
                      console.log(`✅ DIRECTLY mapped ${apiFieldName} to Country field ${countryField.id} in step ${stepName}:`, apiFieldValue)
                    }
                  } else {
                    // Try to find by label match as fallback
                    const fieldByLabel = workflow.steps
                      .flatMap(s => s.fields)
                      .find(f => {
                        if (apiFieldLabel && f.label === apiFieldLabel) return true
                        const labelSnake = f.label?.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
                        const apiNameLower = apiFieldName.toLowerCase()
                        return labelSnake && (apiNameLower.endsWith("_" + labelSnake) || apiNameLower.includes("_" + labelSnake))
                      })
                    if (fieldByLabel) {
                      let value = String(apiFieldValue)
                      existingFormData[fieldByLabel.id] = value
                      console.log("✓ Fallback mapped field by label:", fieldByLabel.id, "=", value)
                    }
                  }
                }
              } else {
                // Log why field was skipped
                if (!apiFieldName) {
                  console.log("Skipped field: no name")
                } else if (apiFieldValue === undefined || apiFieldValue === null || apiFieldValue === "") {
                  console.log("Skipped field:", apiFieldName, "- empty value:", apiFieldValue)
                }
              }
            })
          }
        })
      }
      
      // Also check flat structure for any fields that might not be in the steps format
      // This handles cases where the API returns both formats or only flat format
      console.log("=== CHECKING FLAT STRUCTURE ===")
      console.log("Flat record keys:", Object.keys(existingRecord))
      console.log("Full flat record (first 20 keys):", Object.fromEntries(Object.entries(existingRecord).slice(0, 20)))
      
      // PRIORITY FIX: Check for address_country directly in flat structure FIRST
      // This ensures we catch it even if steps format doesn't have it
      // IMPORTANT: address_country should only map to Address step's Country field
      if (existingRecord.address_country !== undefined && existingRecord.address_country !== null && existingRecord.address_country !== "") {
        console.log("🎯 Found address_country in flat structure:", existingRecord.address_country)
        // Find Country field in Address step (Step 2) only
        const addressStep = workflow.steps.find(step => 
          step.name?.toLowerCase().includes("address") || 
          step.order === 2 ||
          (workflow.steps.indexOf(step) === 1) // Second step (0-indexed)
        )
        if (addressStep) {
          const countryField = addressStep.fields.find(f => f.label?.toLowerCase().includes("country"))
          if (countryField && !existingFormData[countryField.id]) {
            existingFormData[countryField.id] = String(existingRecord.address_country)
            console.log(`✅ DIRECTLY mapped address_country to Address step Country field ${countryField.id}:`, existingRecord.address_country)
          }
        } else {
          // Fallback: search all steps but log warning
          console.warn("⚠️ Address step not found, falling back to all steps for address_country mapping")
          const countryField = workflow.steps
            .flatMap(s => s.fields)
            .find(f => f.label?.toLowerCase().includes("country"))
          if (countryField && !existingFormData[countryField.id]) {
            existingFormData[countryField.id] = String(existingRecord.address_country)
            console.log(`✅ DIRECTLY mapped address_country to Country field ${countryField.id} (fallback):`, existingRecord.address_country)
          }
        }
      }
      
      workflow.steps.forEach((step, stepIndex) => {
        // Determine if this is an Address step
        const isAddressStep = step.name?.toLowerCase().includes("address") || stepIndex === 1
        const isGeneralInfoStep = step.name?.toLowerCase().includes("general") || stepIndex === 0
        
        step.fields.forEach((field) => {
          // Skip if already mapped from steps format
          if (existingFormData[field.id] !== undefined) {
            if (field.label?.toLowerCase().includes("country")) {
              console.log(`⏭️ Country field ${field.id} already mapped, skipping flat structure check`)
            }
            return
          }
          
          const isCountryField = field.label?.toLowerCase().includes("country")
          if (isCountryField) {
            console.log(`🔍 Checking flat structure for Country field:`, { id: field.id, label: field.label, step: step.name, stepIndex })
          }
          
          // Try to find the field in the flat record
          // Convert label to snake_case
          const labelSnakeCase = field.label
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || ""
          
          if (isCountryField) {
            console.log(`  Label snake_case: "${labelSnakeCase}"`)
          }
          
          // Try exact match first
          if (existingRecord[labelSnakeCase] !== undefined && existingRecord[labelSnakeCase] !== null && existingRecord[labelSnakeCase] !== "") {
            let value = existingRecord[labelSnakeCase]
            
            // Handle different field types
            if (field.type === "checkbox") {
              value = Boolean(value)
            } else if (field.type === "number" || field.type === "slider") {
              value = value !== null && value !== undefined ? Number(value) : ""
            } else if (value === null || value === undefined) {
              value = ""
            } else {
              value = String(value)
            }
            
            existingFormData[field.id] = value
            console.log("✓ Mapped from flat structure (exact match):", field.id, "=", value, "(from key:", labelSnakeCase, ")")
            if (isCountryField) {
              console.log(`✅ Country field mapped via exact match!`)
            }
            return
          }
          
          // Try matching with common prefixes (e.g., "address_country" for "Country" field)
          // Check all keys in the record that might match
          let foundMatch = false
          for (const key in existingRecord) {
            // Skip non-data keys
            if (['id', 'workflow_id', 'company_id', 'workflow_instance_id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'steps'].includes(key)) {
              continue
            }
            
            const keyLower = key.toLowerCase()
            const labelSnakeLower = labelSnakeCase.toLowerCase()
            
            // CRITICAL FIX: For country fields, ensure step-specific matching
            if (isCountryField) {
              // If this is Address step's Country field, only match address_country
              if (isAddressStep) {
                if (keyLower !== "address_country") {
                  // Skip non-address_country keys for Address step
                  continue
                }
              }
              // If this is General Info step's Country field, only match country (not address_country)
              else if (isGeneralInfoStep) {
                if (keyLower === "address_country") {
                  // Skip address_country for General Info step
                  continue
                }
              }
            }
            
            // Check multiple matching patterns
            const exactMatch = keyLower === labelSnakeLower
            const endsWithMatch = keyLower.endsWith("_" + labelSnakeLower)
            // Split key into parts (using lowercase) and check if label is one of the parts
            const keyParts = keyLower.split("_")
            const containsAsWordPart = keyLower.includes("_" + labelSnakeLower) && keyParts.includes(labelSnakeLower)
            const anyPartMatches = labelSnakeLower && keyLower.includes(labelSnakeLower) && keyParts.some(part => part === labelSnakeLower)
            
            const matches = exactMatch || endsWithMatch || containsAsWordPart || anyPartMatches
            
            if (isCountryField && (keyLower.includes("country") || labelSnakeLower === "country")) {
              console.log(`  Checking key "${key}":`, {
                exactMatch,
                endsWithMatch,
                containsAsWordPart,
                anyPartMatches,
                matches,
                value: existingRecord[key],
                stepContext: { step: step.name, stepIndex, isAddressStep, isGeneralInfoStep }
              })
            }
            
            if (matches) {
              const value = existingRecord[key]
              if (value !== undefined && value !== null && value !== "") {
                let processedValue = value
                
                // Handle different field types
                if (field.type === "checkbox") {
                  processedValue = Boolean(processedValue)
                } else if (field.type === "number" || field.type === "slider") {
                  processedValue = processedValue !== null && processedValue !== undefined ? Number(processedValue) : ""
                } else if (processedValue === null || processedValue === undefined) {
                  processedValue = ""
                } else {
                  processedValue = String(processedValue)
                }
                
                existingFormData[field.id] = processedValue
                foundMatch = true
                console.log("✓ Mapped from flat structure with prefix:", field.id, "=", processedValue, "(from key:", key, ", label:", field.label, ", step:", step.name, ")")
                if (isCountryField) {
                  console.log(`✅ Country field mapped via prefix match! Key: "${key}", Value: "${processedValue}", Step: ${step.name}`)
                }
                break
              } else {
                if (isCountryField) {
                  console.log(`  ⚠️ Key "${key}" matched but value is empty/null:`, value)
                }
              }
            }
          }
          
          if (isCountryField && !foundMatch) {
            console.log(`❌ Country field NOT found in flat structure after checking all keys`)
            console.log(`  Searched for label snake_case: "${labelSnakeCase}"`)
            console.log(`  Available keys with "country":`, Object.keys(existingRecord).filter(k => k.toLowerCase().includes("country")))
            
            // Last resort: Direct check for common country field names with step context
            if (isAddressStep) {
              // For Address step, only use address_country
              if (existingRecord.address_country !== undefined && existingRecord.address_country !== null && existingRecord.address_country !== "") {
                const value = String(existingRecord.address_country)
                existingFormData[field.id] = value
                foundMatch = true
                console.log(`✅ Address step Country field mapped via direct key check! Key: "address_country", Value: "${value}"`)
              }
            } else if (isGeneralInfoStep) {
              // For General Info step, only use country (not address_country)
              if (existingRecord.country !== undefined && existingRecord.country !== null && existingRecord.country !== "") {
                const value = String(existingRecord.country)
                existingFormData[field.id] = value
                foundMatch = true
                console.log(`✅ General Info step Country field mapped via direct key check! Key: "country", Value: "${value}"`)
              }
            } else {
              // For other steps, try all country keys
              const countryKeys = ['address_country', 'country', 'country_name', 'country_code']
              for (const countryKey of countryKeys) {
                if (existingRecord[countryKey] !== undefined && existingRecord[countryKey] !== null && existingRecord[countryKey] !== "") {
                  const value = String(existingRecord[countryKey])
                  existingFormData[field.id] = value
                  foundMatch = true
                  console.log(`✅ Country field mapped via direct key check! Key: "${countryKey}", Value: "${value}"`)
                  break
                }
              }
            }
          }
        })
      })

      console.log("=== FINAL MAPPING RESULTS ===")
      console.log("Final mapped existing form data:", existingFormData)
      console.log("Form data keys:", Object.keys(existingFormData))
      
      // Check specifically for Country field
      const countryFieldIds = workflow.steps.flatMap(s => s.fields)
        .filter(f => f.label?.toLowerCase().includes("country"))
        .map(f => f.id)
      console.log("=== COUNTRY FIELD DIAGNOSTICS ===")
      console.log("Country field IDs in workflow:", countryFieldIds)
      console.log("address_country in API response:", existingRecord.address_country)
      console.log("country in API response:", existingRecord.country)
      
      countryFieldIds.forEach(fieldId => {
        if (existingFormData[fieldId]) {
          console.log(`✅ Country value found for field ${fieldId}:`, existingFormData[fieldId])
        } else {
          console.log(`❌ Country value NOT found for field ${fieldId}`)
          console.log(`   Attempting emergency mapping...`)
          // Emergency fallback: Try to map address_country directly
          if (existingRecord.address_country) {
            existingFormData[fieldId] = String(existingRecord.address_country)
            console.log(`   ✅ Emergency mapped address_country to field ${fieldId}:`, existingRecord.address_country)
          }
        }
      })
      
      // ====================================================================
      // FINAL AGGRESSIVE FIX: Ensure ALL Country fields are definitely set
      // ====================================================================
      // This is the LAST CHANCE to set the Country value before updating formData.
      // If address_country exists in API response but wasn't mapped, set it now.
      // Handle ALL Country fields (Step 1 AND Step 2)
      const allCountryFieldsForFinalCheck = workflow.steps
        .flatMap((step, stepIndex) => 
          step.fields
            .filter(f => f.label?.toLowerCase().includes("country"))
            .map(field => ({ field, step, stepIndex }))
        )
      
      allCountryFieldsForFinalCheck.forEach(({ field, step, stepIndex }) => {
        // Check if Country field is still empty in existingFormData
        if (!existingFormData[field.id] || existingFormData[field.id] === "") {
          const isAddressStep = stepIndex === 1 || step.name?.toLowerCase().includes("address")
          const isGeneralInfoStep = stepIndex === 0 || step.name?.toLowerCase().includes("general")
          
          // For Step 2 (Addresses), ONLY use address_country (never use country from Step 1)
          if (isAddressStep) {
            if (existingRecord.address_country) {
              existingFormData[field.id] = String(existingRecord.address_country)
              console.log(`🚨 FINAL FIX: Setting Address step (${step.name}) Country field ${field.id} = "${existingRecord.address_country}"`)
            } else {
              console.warn(`⚠️ FINAL FIX: Address step Country field ${field.id} is empty but address_country not found in API response`)
            }
          } 
          // For Step 1 (General Information), ONLY use country (never use address_country)
          else if (isGeneralInfoStep) {
            if (existingRecord.country) {
              existingFormData[field.id] = String(existingRecord.country)
              console.log(`🚨 FINAL FIX: Setting General Info step (${step.name}) Country field ${field.id} = "${existingRecord.country}"`)
            } else {
              console.warn(`⚠️ FINAL FIX: General Info step Country field ${field.id} is empty but country not found in API response`)
            }
          }
          // For other steps, try both but prefer step-appropriate value
          else {
            // Try to determine which value to use based on step name or context
            if (step.name?.toLowerCase().includes("address")) {
              if (existingRecord.address_country) {
                existingFormData[field.id] = String(existingRecord.address_country)
                console.log(`🚨 FINAL FIX: Setting ${step.name} step Country field ${field.id} = "${existingRecord.address_country}"`)
              }
            } else if (existingRecord.country) {
              existingFormData[field.id] = String(existingRecord.country)
              console.log(`🚨 FINAL FIX: Setting ${step.name} step Country field ${field.id} = "${existingRecord.country}"`)
            }
          }
        } else {
          console.log(`✅ Step ${stepIndex + 1} (${step.name}) Country field already has value in existingFormData: ${existingFormData[field.id]}`)
        }
      })
      
      // Update form data with existing values
      // Use functional update to ensure we have the latest state
      // IMPORTANT: Preserve country values that were set directly from API
      setFormData((prevData) => {
        const updated = {
          ...prevData,
          ...existingFormData,
        }
        
        // CRITICAL: Preserve ALL country values that were already set directly from API
        allCountryFieldsForFinalCheck.forEach(({ field }) => {
          const alreadySetCountryValue = prevData[field.id]
          if (alreadySetCountryValue && alreadySetCountryValue !== "") {
            updated[field.id] = alreadySetCountryValue
            console.log(`🛡️ PRESERVING directly set country value for ${field.id}: ${alreadySetCountryValue}`)
          }
        })
        
        console.log("=== UPDATED FORM DATA ===")
        console.log("Updated form data:", updated)
        countryFieldIds.forEach(fieldId => {
          const value = updated[fieldId]
          if (value && value !== "") {
            console.log(`✅ Country field ${fieldId} in updated formData:`, value)
          } else {
            console.error(`❌ Country field ${fieldId} is STILL EMPTY in updated formData!`)
            console.error(`   This means the value was not found in API response or mapping failed.`)
          }
        })
        return updated
      })
      
      // CRITICAL FIX: Force a second update to ensure React picks up the change
      // This handles cases where the Select component doesn't re-render with the new value
      // Use the directly extracted country value if available
      // Handle ALL Country fields (Step 1 AND Step 2)
      setTimeout(() => {
        setFormData((prevData) => {
          // Only update if Country field is missing or different
          let needsUpdate = false
          const newData = { ...prevData }
          
          // Get all Country fields with their step information
          const allCountryFieldsForUpdate = workflow.steps
            .flatMap((step, stepIndex) => 
              step.fields
                .filter(f => f.label?.toLowerCase().includes("country"))
                .map(field => ({ field, step, stepIndex }))
            )
          
          allCountryFieldsForUpdate.forEach(({ field, step, stepIndex }) => {
            const currentValue = prevData[field.id]
            
            // Determine the correct value for this step
            let expectedValue: string | null = null
            
            // For Step 2 (Addresses), prefer address_country
            if (stepIndex === 1 || step.name?.toLowerCase().includes("address")) {
              expectedValue = existingRecord.address_country 
                ? String(existingRecord.address_country).trim()
                : (countryValueForAddress || existingFormData[field.id] || null)
            } else {
              // For Step 1 (General Information), prefer country
              expectedValue = existingRecord.country
                ? String(existingRecord.country).trim()
                : (countryValueForGeneralInfo || existingFormData[field.id] || null)
            }
            
            if (expectedValue && expectedValue !== "" && currentValue !== expectedValue) {
              newData[field.id] = expectedValue
              needsUpdate = true
              console.log(`🔄 Force updating Step ${stepIndex + 1} (${step.name}) Country field ${field.id}: "${currentValue}" -> "${expectedValue}"`)
            } else if (!currentValue || currentValue === "") {
              // If still empty, try to set from direct extraction or API
              if (expectedValue) {
                newData[field.id] = expectedValue
                needsUpdate = true
                console.log(`🔄 Force setting Step ${stepIndex + 1} (${step.name}) Country field ${field.id} from API: "${expectedValue}"`)
              } else {
                // Use step-specific values as fallback
                const fallbackValue = (stepIndex === 1 || step.name?.toLowerCase().includes("address")) 
                  ? countryValueForAddress 
                  : countryValueForGeneralInfo
                if (fallbackValue) {
                  newData[field.id] = fallbackValue
                  needsUpdate = true
                  console.log(`🔄 Force setting Step ${stepIndex + 1} (${step.name}) Country field ${field.id} from step-specific value: "${fallbackValue}"`)
                }
              }
            }
          })
          
          if (needsUpdate) {
            console.log("🔄 Force updated formData for ALL Country fields")
            return newData
          }
          return prevData
        })
      }, 100)

      // Mark steps as completed if they have data
      const completedStepsSet = new Set<number>()
      workflow.steps.forEach((step, stepIndex) => {
        const stepHasData = step.fields.some((field) => {
          const value = existingFormData[field.id]
          return value !== undefined && value !== null && value !== ""
        })
        if (stepHasData) {
          completedStepsSet.add(stepIndex)
        }
      })
      setCompletedSteps(completedStepsSet)

      // Mark as loaded using both state and ref
      dataLoadedRef.current = true
      setDataLoaded(true)
      toast({
        title: "Data Loaded",
        description: "Existing company data has been loaded for editing.",
      })
    } catch (error: any) {
      console.error("Failed to load existing company data:", error)
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Failed to load existing company data"
      setLoadError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      // Don't set dataLoaded to true if there was an error
      // This allows the user to retry or cancel
      dataLoadedRef.current = false
    } finally {
      isLoadingDataRef.current = false
      setIsLoadingData(false)
    }
  }

  // Show loading state while workflow or data is loading
  const isLoading = isLoadingWorkflow || isLoadingData
  const isReady = workflow && (!recordId || (recordId && dataLoaded))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading company data...</p>
            <p className="text-sm text-muted-foreground">
              {isLoadingWorkflow && "Loading workflow configuration"}
              {isLoadingWorkflow && isLoadingData && " and "}
              {isLoadingData && "Loading existing company data"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if there was a load error
  if (loadError && !workflow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-destructive">Failed to Load Data</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
          <Button onClick={onCancel} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Workflow not found</p>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // If we're in edit mode but data failed to load and we're not loading anymore
  // Show error and don't show form - user requirement: only show fully loaded pre-filled data
  if (recordId && !dataLoaded && loadError && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-destructive">Failed to Load Company Data</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please check your connection and try again, or contact support if the issue persists.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
            <Button
              onClick={() => {
                setLoadError(null)
                setDataLoaded(false)
                dataLoadedRef.current = false
                setIsLoadingData(false)
                isLoadingDataRef.current = false
                countryFieldCheckRef.current = false
                if (workflow && recordId) {
                  loadExistingCompanyData()
                }
              }}
              variant="default"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If we're in edit mode but data hasn't loaded yet (edge case - shouldn't happen due to loading check above)
  // This is a safety check to prevent showing empty form in edit mode
  if (recordId && !dataLoaded && !isLoading && !loadError) {
    // This shouldn't happen, but if it does, wait a bit more or show loading
    // Actually, this case shouldn't occur - if recordId exists and we're not loading,
    // either dataLoaded should be true or loadError should be set
    // So we can safely show the form here as a fallback
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
    // Frontend validation only - no API calls
    const newErrors = validateStepUtil(
      currentStepData.fields || [],
      formData
    )
    // Only set frontend validation errors, don't touch API errors here
    // API errors will only be set after final submit
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStepSubmit = async () => {
    // 1) Frontend validation first (cheap, instant)
    const isFrontendValid = validateStep()
    if (!isFrontendValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields before validating with the server.",
        variant: "destructive",
      })
      return
    }

    // 2) Backend (API) validation for THIS STEP only
    setIsValidating(true)

    try {
      // Build step-level payload: only current step's fields
      // company_id is generated by backend as UUID - don't send it unless we have a valid UUID
      const stepData: Record<string, any> = {}
      
      // Only include company_id if we have a valid UUID value (not integer 1)
      // Backend will generate UUID if not provided
      if (currentCompany?.id) {
        // If currentCompany.id is a UUID string, use it; otherwise let backend generate
        const companyIdValue = currentCompany.id
        // Only include if it looks like a UUID (contains hyphens) or is a valid UUID format
        if (typeof companyIdValue === 'string' && companyIdValue.includes('-')) {
          stepData.company_id = companyIdValue
        }
      } else if (companyId && typeof companyId === 'string' && companyId.includes('-')) {
        // Only include if it's a valid UUID format
        stepData.company_id = companyId
      }
      // If no valid company_id, omit it - backend will generate UUID

      const stepFieldMap: Record<string, string> = {} // fieldId -> fieldName

      currentStepData.fields.forEach((field) => {
        const value = formData[field.id]

        const hasValue = value !== undefined && value !== null && value !== ""
        if (!hasValue) return

        // Use a readable snake_case key derived from the label.
        // Example: "Company Name" -> "company_name"
        const labelKey =
          field.label
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || ""

        if (labelKey) {
          stepData[labelKey] = value
          stepFieldMap[field.id] = labelKey
        } else {
          // Fallback: if label is missing for some reason, use field.id (rare)
          stepData[field.id] = value
          stepFieldMap[field.id] = field.id
        }
      })

      console.log(`🔍 Step ${currentStep + 1} API validation payload:`, {
        stepName: currentStepData.name,
        stepIndex: currentStep,
        payload: stepData,
      })

      // IMPORTANT: use isUpdate=true so other steps' required fields are ignored
      const stepValidation = await dynamicWorkflowAPI.validateTableData(
        workflowId,
        stepData,
        true
      )

      console.log(`📥 Step ${currentStep + 1} API Validation Response:`, {
        isValid: stepValidation.is_valid,
        totalErrors: stepValidation.errors.length,
        errors: stepValidation.errors.map((e) => ({
          field_name: e.field_name,
          field_label: e.field_label,
          error_message: e.error_message,
        })),
      })

      if (!stepValidation.is_valid) {
        // Map ONLY this step's API errors back to its fields
        const stepApiErrors: Record<string, string> = {}
        const stepErrorFieldIds = new Set<string>()
        const stepErrorMessages: string[] = []

        stepValidation.errors.forEach((error) => {
          const errorFieldNameNorm = error.field_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")

          currentStepData.fields.forEach((field) => {
            const fieldName = (field as any).name
            const fieldLabel = field.label || ""
            const fieldNameNorm = (fieldName || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "")
            const fieldLabelNorm = fieldLabel
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "")

            // Match by field.name, snake_case(field.label), or direct ID/label
            const matches =
              error.field_name === fieldName ||
              errorFieldNameNorm === fieldNameNorm ||
              errorFieldNameNorm === fieldLabelNorm ||
              error.field_name === field.id ||
              error.field_label === field.label

            if (matches) {
              stepApiErrors[field.id] = error.error_message
              stepErrorFieldIds.add(field.id)
              stepErrorMessages.push(`${field.label || field.id}: ${error.error_message}`)
            }
          })
        })

        // Merge step errors into global API error state
        setApiValidationErrors((prev) => ({ ...prev, ...stepApiErrors }))
        setApiValidationErrorFields((prev) => {
          const updated = new Set(prev)
          stepErrorFieldIds.forEach((id) => updated.add(id))
          return updated
        })
        setStepValidationErrors((prev) => ({
          ...prev,
          [currentStep]: stepErrorMessages,
        }))
        setErrors((prev) => ({ ...prev, ...stepApiErrors }))

        toast({
          title: "Step Validation Failed",
          description: `This step has ${stepValidation.errors.length} server-side validation error(s). Please fix them before continuing.`,
          variant: "destructive",
        })

        return
      }

      // 3) If API validation passed for this step, clear its API errors and mark as validated
      const thisStepFieldIds = currentStepData.fields.map((f) => f.id)

      setApiValidationErrors((prev) => {
        const updated = { ...prev }
        thisStepFieldIds.forEach((id) => delete updated[id])
        return updated
      })

      setApiValidationErrorFields((prev) => {
        const updated = new Set(prev)
        thisStepFieldIds.forEach((id) => updated.delete(id))
        return updated
      })

      setStepValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[currentStep]
        return updated
      })

      setValidatedSteps((prev) => new Set(prev).add(currentStep))
      setCompletedSteps((prev) => new Set(prev).add(currentStep))

      console.log(`✅ Step ${currentStep + 1} validated (frontend + API):`, currentStepData.name)

      toast({
        title: "Step Validated",
        description: `${currentStepData.name} has passed both frontend and API validation.`,
        variant: "default",
      })

      // Move to next step if not last step
      if (currentStep < workflow.steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error: any) {
      console.error("Step API validation error:", error)
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate this step with the server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
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

    // NOW call API validation - this is the ONLY place API validation happens
    setIsSubmitting(true)
    setIsValidating(true)
    
    // Clear any previous API validation errors before new validation
    setApiValidationErrors({})
    setApiValidationErrorFields(new Set())
    setStepValidationErrors({})
    
    try {
      // Prepare complete data for validation
      // company_id is generated by backend as UUID - don't send it unless we have a valid UUID
      const completeData: Record<string, any> = {}
      
      // Only include company_id if we have a valid UUID value (not integer 1)
      // Backend will generate UUID if not provided
      if (currentCompany?.id) {
        // If currentCompany.id is a UUID string, use it; otherwise let backend generate
        const companyIdValue = currentCompany.id
        // Only include if it looks like a UUID (contains hyphens) or is a valid UUID format
        if (typeof companyIdValue === 'string' && companyIdValue.includes('-')) {
          completeData.company_id = companyIdValue
        }
      } else if (companyId && typeof companyId === 'string' && companyId.includes('-')) {
        // Only include if it's a valid UUID format
        completeData.company_id = companyId
      }
      // If no valid company_id, omit it - backend will generate UUID

      // Map all form data to field names
      // The API expects field_name (actual column names like "company_name", "address_line_1") as keys
      // NOT UUIDs (field.id). The field.name property contains the field_name from the backend.
      const fieldMapping: Record<string, { fieldId: string; fieldName: string; value: any; label: string }> = {}
      
      workflow.steps.forEach((step) => {
        step.fields.forEach((field) => {
          const value = formData[field.id]
          
          // Check if value exists (including false for checkboxes, 0 for numbers)
          // Only exclude: undefined, null, and empty strings
          const hasValue = value !== undefined && value !== null && value !== ""
          
          if (hasValue) {
            // Use a readable snake_case key derived from the label as the primary key.
            const labelKey =
              field.label
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") || ""

            const payloadKey = labelKey || field.id

            completeData[payloadKey] = value
            fieldMapping[payloadKey] = {
              fieldId: field.id,
              fieldName: labelKey || 'N/A',
              value: value,
              label: field.label
            }
          } else if (field.required) {
            // Log missing required fields for debugging - check if it's in formData but empty
            const formDataValue = formData[field.id]
            console.warn(`⚠️ Required field "${field.label}" is missing value:`, {
              value: formDataValue,
              type: typeof formDataValue,
              isEmpty: formDataValue === "",
              isNull: formDataValue === null,
              isUndefined: formDataValue === undefined,
              fieldId: field.id,
              formDataKey: field.id,
              hasValueInFormData: formData[field.id] !== undefined,
              allFormDataKeys: Object.keys(formData).filter(k => 
                k.toLowerCase().includes(field.label.toLowerCase().substring(0, 5)) ||
                field.label.toLowerCase().includes(k.toLowerCase().substring(0, 5))
              )
            })
          }
        })
      })
      
      // Log field mappings for debugging
      console.log("🔍 Field Value Mapping:", {
        totalMapped: Object.keys(fieldMapping).length,
        mappings: Object.entries(fieldMapping).slice(0, 10).map(([key, info]) => ({
          payloadKey: key,
          fieldLabel: info.label,
          value: info.value,
          sourceFieldId: info.fieldId
        }))
      })

      // Log payload structure to verify field names are used (not UUIDs)
      const payloadKeys = Object.keys(completeData).filter(k => k !== "company_id")
      const uuidKeys = payloadKeys.filter(k => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
      const fieldNameKeys = payloadKeys.filter(k => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
      
      // Check for "Accepted Payment Methods" field specifically
      const paymentMethodsKey = payloadKeys.find(k => 
        k.toLowerCase().includes('payment') && 
        (k.toLowerCase().includes('method') || k.toLowerCase().includes('accepted'))
      )
      
      console.log("📦 Payload Structure:", {
        totalFields: payloadKeys.length,
        fieldNameKeys: fieldNameKeys.length,
        uuidKeys: uuidKeys.length,
        sampleFieldNames: fieldNameKeys.slice(0, 10),
        sampleUuidKeys: uuidKeys.slice(0, 3),
        paymentMethodsField: paymentMethodsKey ? {
          key: paymentMethodsKey,
          value: completeData[paymentMethodsKey]
        } : "NOT FOUND in payload",
        warning: uuidKeys.length > 0 ? "⚠️ Some fields still using UUIDs - check field.name mapping" : "✅ All fields using field names"
      })
      
      // Log full payload for debugging (truncated)
      console.log("📋 Full Payload (first 20 fields):", 
        Object.entries(completeData).slice(0, 20).reduce((acc, [key, value]) => {
          acc[key] = value
          return acc
        }, {} as Record<string, any>)
      )

      // Validate all data with API before submitting
      console.log("🔍 Validating all data with API before submission...")
      console.log("📤 Sending payload with", Object.keys(completeData).length, "fields")
      const finalValidation = await dynamicWorkflowAPI.validateTableData(
        workflowId,
        completeData,
        Boolean(recordId)
      )
      
      console.log("📥 API Validation Response:", {
        isValid: finalValidation.is_valid,
        totalErrors: finalValidation.errors.length,
        errors: finalValidation.errors.map(e => ({
          field_name: e.field_name,
          field_label: e.field_label,
          error_message: e.error_message
        }))
      })

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
              const fieldName = (field as any).name // The actual field_name from backend
              const fieldLabelSnake = field.label
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") || ""
              const fieldNameSnake = fieldName
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") || ""
              
              // Match by priority:
              // 1. Direct field.name match (most reliable - exact field_name from backend)
              // 2. Normalized field.name match (snake_case comparison)
              // 3. Field label (snake_case of label)
              // 4. Field ID (UUID) - fallback
              // 5. Exact label match
              const matches = 
                error.field_name === fieldName || // Exact match with field.name
                errorFieldName === fieldNameSnake || // Normalized match with field.name
                errorFieldName === fieldLabelSnake || // Match with label
                error.field_name === field.id || // Match with UUID (fallback)
                error.field_label === field.label || // Exact label match
                error.field_name.toLowerCase() === field.label?.toLowerCase() // Case-insensitive label match
              
              if (matches) {
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
      
      let result: Record<string, any>
      if (recordId) {
        result = await dynamicWorkflowAPI.updateTableRecord(workflowId, recordId, completeData)
        console.log("Company updated successfully:", result)
        toast({
          title: "Company Updated Successfully",
          description: `Company data has been updated using workflow: ${workflow.name}`,
        })
      } else {
        result = await dynamicWorkflowAPI.createTableRecord(workflowId, completeData)
        console.log("Company created successfully:", result)
        toast({
          title: "Company Created Successfully",
          description: `Company has been created using workflow: ${workflow.name}`,
        })
      }

      onComplete()
    } catch (error: any) {
      // Enhanced error logging with safe serialization
      console.error("Final submission error - Raw error:", error)
      
      // Helper to safely extract error info
      const getErrorInfo = (err: any): any => {
        if (!err) return null
        try {
          return {
            message: err.message,
            name: err.name,
            code: err.code,
            stack: err.stack?.substring(0, 200), // First 200 chars of stack
            response: err.response ? {
              status: err.response.status,
              statusText: err.response.statusText,
              data: err.response.data,
            } : null,
            request: err.request ? "Request object exists" : null,
            config: err.config ? {
              url: err.config.url,
              method: err.config.method,
            } : null,
          }
        } catch (e) {
          return { error: "Could not serialize error", originalError: String(err) }
        }
      }
      
      const errorInfo = getErrorInfo(error)
      console.error("Final submission error - Parsed:", errorInfo)
      
      // Extract error message from various possible structures
      let errorMessage = "Failed to create company. Please try again."
      
      if (error) {
        // Priority 1: Check ApiError message (from http-client)
        if (error.message && typeof error.message === "string") {
          errorMessage = error.message
        } 
        // Priority 2: Check Axios response data.detail
        else if (error.response?.data?.detail) {
          const detail = error.response.data.detail
          if (typeof detail === "string") {
            errorMessage = detail
          } else if (Array.isArray(detail)) {
            errorMessage = detail.map((err: any) => `${err.loc?.join(".") || ""}: ${err.msg || ""}`).join("; ")
          } else {
            try {
              errorMessage = JSON.stringify(detail)
            } catch {
              errorMessage = "Validation error (see console for details)"
            }
          }
        }
        // Priority 3: Check response data.message
        else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        }
        // Priority 4: Check response status text
        else if (error.response?.statusText) {
          errorMessage = `${error.response.status} ${error.response.statusText}`
        }
        // Priority 5: Check error code
        else if (error.code) {
          if (error.code === "ERR_CANCELED" || error.code === "CANCELED_ERROR") {
            errorMessage = "Request was canceled. This may happen if the request takes too long. Please try again and ensure you have a stable connection."
          } else if (error.code === "ERR_NETWORK") {
            errorMessage = "Network error. Please check if the backend server is running."
          } else if (error.code === "ECONNABORTED") {
            errorMessage = "Request timeout. The server took too long to respond."
          } else {
            errorMessage = `Error: ${error.code}`
          }
        }
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
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
    // Frontend validation errors show during step validation
    // API validation errors only show after final submit fails
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
        /**
         * ====================================================================
         * SELECT COMPONENT RENDERING - COUNTRY FIELD ISSUE
         * ====================================================================
         * 
         * This is where the Country dropdown is rendered.
         * 
         * THE PROBLEM:
         * The Select component shows "Select Country" (placeholder) instead of the actual value
         * even though the value might be set in formData.
         * 
         * WHY IT HAPPENS:
         * 1. Select component reads: const value = formData[field.id]
         * 2. If formData[field.id] is undefined, null, or empty string, Select shows placeholder
         * 3. React state updates are asynchronous - Select might render before formData is updated
         * 4. The value might not exactly match the options (case sensitivity, whitespace, etc.)
         * 
         * THE FIX:
         * 1. Check if value exists in formData
         * 2. Try to match value to options (exact match first, then case-insensitive)
         * 3. If match found, use the matched option value (ensures exact match)
         * 4. If no match, log warning and show placeholder
         * 5. Use key prop to force re-render when value changes
         * 
         * DEBUGGING:
         * Check console logs for:
         * - "🌍 Rendering Country Select" - Shows what value Select is receiving
         * - "✅ Country value matches option exactly" - Value matched successfully
         * - "⚠️ Country Select has no value" - Value is empty (THIS IS THE PROBLEM)
         * - "❌ Country value not found in options" - Value doesn't match any option
         * 
         * ====================================================================
         */
        
        // Ensure value matches one of the options (case-insensitive, trimmed)
        let selectValue = value || ""
        
        // Debug Country field specifically
        const isCountryField = field.label?.toLowerCase().includes("country")
        if (isCountryField) {
          console.log(`🌍 Rendering Country Select:`, {
            fieldId: field.id,
            fieldLabel: field.label,
            rawValue: value,
            selectValue: selectValue,
            options: field.options,
            formDataValue: formData[field.id],
            typeofValue: typeof value,
            isEmpty: !value || value === "",
            hasOptions: field.options && field.options.length > 0
          })
          
          // Note: Empty values are normal for unfilled fields and will be filtered out in payload building
        }
        
        if (selectValue && field.options && field.options.length > 0) {
          // Try to find exact match first
          const exactMatch = field.options.find(opt => opt === selectValue)
          if (exactMatch) {
            if (isCountryField) {
              console.log(`✅ Country value "${selectValue}" matches option exactly`)
            }
          } else {
            // Try case-insensitive match
            const caseInsensitiveMatch = field.options.find(opt => 
              String(opt).toLowerCase().trim() === String(selectValue).toLowerCase().trim()
            )
            if (caseInsensitiveMatch) {
              if (isCountryField) {
                console.log(`🌍 Country value case corrected: "${selectValue}" -> "${caseInsensitiveMatch}"`)
              }
              selectValue = caseInsensitiveMatch
              // Update form data with the correct case immediately
              if (formData[field.id] !== caseInsensitiveMatch) {
                // Use functional update to avoid stale closure
                setFormData(prev => ({ ...prev, [field.id]: caseInsensitiveMatch }))
              }
            } else {
              // Log warning if value doesn't match any option
              console.warn(`⚠️ Select field "${field.label}" (${field.id}) has value "${selectValue}" that doesn't match any option. Options:`, field.options)
              if (isCountryField) {
                console.error(`❌ Country value "${selectValue}" not found in options!`)
                console.error(`   Available options:`, field.options)
                console.error(`   Value type:`, typeof selectValue)
                // Try to find partial match
                const partialMatch = field.options.find(opt => 
                  String(opt).toLowerCase().includes(String(selectValue).toLowerCase()) ||
                  String(selectValue).toLowerCase().includes(String(opt).toLowerCase())
                )
                if (partialMatch) {
                  console.log(`   Found partial match: "${partialMatch}", updating...`)
                  selectValue = partialMatch
                  setFormData(prev => ({ ...prev, [field.id]: partialMatch }))
                }
              }
            }
          }
        } else {
          if (isCountryField) {
            console.log(`⚠️ Country Select has no value or no options. Value: "${selectValue}", Options:`, field.options)
          }
        }
        
        // Use key prop to force re-render when value changes (important for controlled components)
        const selectKey = `${field.id}-${selectValue || 'empty'}`
        return (
          <Select 
            key={selectKey}
            value={selectValue} 
            onValueChange={(val) => {
              console.log(`Select value changed for ${field.label}:`, val)
              updateFormData(field.id, val)
            }}
          >
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
