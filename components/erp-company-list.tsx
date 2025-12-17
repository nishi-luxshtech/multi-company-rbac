"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react"
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"
import { WorkflowBridgeService } from "@/lib/api/services/workflow-bridge.service"
import type { AllMasterTableDataResponse, FrontendWorkflow } from "@/lib/api/types/dynamic-workflow.types"
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
import { ERPCompanyDetails } from "@/components/erp-company-details"
import { WorkflowDataViewPage } from "@/components/workflow-data-view-page"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ERPCompanyListProps {
  onStartOnboarding: (companyId?: string, workflowId?: string, recordId?: string) => void
  onViewCompany?: (companyId: string) => void
}

interface MasterRecord {
  id: string | number
  workflow_id: string
  workflow_name?: string
  company_id?: string
  company_name: string
  company_code?: string
  country?: string
  form_of_business?: string
  accounting_currency?: string
  is_complete?: boolean
  onboarding_step?: number
  is_placeholder?: boolean
  [key: string]: any // For other dynamic fields
}

interface WorkflowDisplayField {
  fieldId: string
  label: string
}

interface WorkflowMetadata {
  displayFields: WorkflowDisplayField[]
  primaryField?: WorkflowDisplayField
}

interface WorkflowOption {
  id: string
  name: string
}

const ALL_WORKFLOWS_VALUE = "all"

const DEFAULT_DISPLAY_FIELDS: WorkflowDisplayField[] = [
  { fieldId: "company_name", label: "Company Name" },
  { fieldId: "country", label: "Country" },
  { fieldId: "form_of_business", label: "Business Type" },
]

const buildWorkflowDisplayMap = (workflows: FrontendWorkflow[]): Record<string, WorkflowMetadata> => {
  const map: Record<string, WorkflowMetadata> = {}

  workflows.forEach((workflow) => {
    const orderedSteps = [...(workflow.steps || [])].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    )

    const flattenedFields = orderedSteps.flatMap((step) =>
      (step.fields || []).map((field) => ({
        fieldId: field.id,
        label: field.label || field.id,
        required: field.required ?? false,
      }))
    )

    const prioritized = prioritizeDisplayFields(flattenedFields)
    const displayFields = prioritized.length > 0 ? prioritized : DEFAULT_DISPLAY_FIELDS

    map[workflow.id] = {
      displayFields,
      primaryField: displayFields[0],
    }
  })

  return map
}

const prioritizeDisplayFields = (
  fields: Array<{ fieldId: string; label: string; required: boolean }>
): WorkflowDisplayField[] => {
  const prioritized: WorkflowDisplayField[] = []
  const pushUnique = (field: { fieldId: string; label: string }) => {
    if (!prioritized.some((f) => f.fieldId === field.fieldId)) {
      prioritized.push({ fieldId: field.fieldId, label: field.label })
    }
  }

  const keywordBuckets = [
    "company",
    "business",
    "type",
    "country",
    "currency",
    "status",
  ]

  keywordBuckets.forEach((keyword) => {
    fields.forEach((field) => {
      if (field.label.toLowerCase().includes(keyword)) {
        pushUnique(field)
      }
    })
  })

  fields
    .filter((field) => field.required)
    .forEach((field) => pushUnique(field))

  fields.forEach((field) => pushUnique(field))

  return prioritized
}

const formatRecordValue = (value: any): string => {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") {
    return value.trim() === "" ? "N/A" : value
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "N/A"
  }
  return String(value)
}

// Helper function to get field value from record, checking both UUID key and snake_case key
const getFieldValue = (record: MasterRecord, fieldId: string, workflows?: FrontendWorkflow[]): any => {
  // First try UUID key (direct match)
  if (record[fieldId] !== undefined && record[fieldId] !== null) {
    return record[fieldId]
  }

  // If not found, try to find the field label and check snake_case version
  if (workflows) {
    for (const workflow of workflows) {
      for (const step of workflow.steps || []) {
        for (const field of step.fields || []) {
          if (field.id === fieldId) {
            // Convert label to snake_case
            const snakeCaseKey = field.label
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "") || ""

            if (snakeCaseKey && record[snakeCaseKey] !== undefined && record[snakeCaseKey] !== null) {
              return record[snakeCaseKey]
            }
            break
          }
        }
      }
    }
  }

  // Fallback: try common snake_case field names
  const commonFields: Record<string, string[]> = {
    "company_name": ["company_name"],
    "company_code": ["company_code"],
    "country": ["country"],
    "form_of_business": ["form_of_business"],
    "association_number": ["association_number"],
    "default_language": ["default_language"],
    "company_creation_date": ["company_creation_date"],
  }

  for (const [key, aliases] of Object.entries(commonFields)) {
    if (aliases.some(alias => record[alias] !== undefined && record[alias] !== null)) {
      return record[aliases.find(alias => record[alias] !== undefined && record[alias] !== null)!]
    }
  }

  return undefined
}

export function ERPCompanyList({ onStartOnboarding, onViewCompany }: ERPCompanyListProps) {
  const { toast } = useToast()
  const [masterRecords, setMasterRecords] = useState<MasterRecord[]>([])
  const [filteredMasterRecords, setFilteredMasterRecords] = useState<MasterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>("")
  const [isPermissionError, setIsPermissionError] = useState(false)
  const [viewWorkflowData, setViewWorkflowData] = useState<{
    show: boolean
    workflowId: string | null
    companyId: string | null
    recordId: string | null
    companyName: string | null
  }>({
    show: false,
    workflowId: null,
    companyId: null,
    recordId: null,
    companyName: null,
  })
  const [workflowMetadata, setWorkflowMetadata] = useState<Record<string, WorkflowMetadata>>({})
  const [availableWorkflows, setAvailableWorkflows] = useState<FrontendWorkflow[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(ALL_WORKFLOWS_VALUE)

  // Ref to track if the effect has already been triggered (prevents duplicate API calls in React StrictMode)
  const loadEffectTriggeredRef = useRef(false)

  useEffect(() => {
    // Skip duplicate load triggered by React StrictMode
    if (loadEffectTriggeredRef.current) {
      return
    }
    loadEffectTriggeredRef.current = true

    // Check if user is authenticated before loading data
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (!token) {
      setError("Not authenticated. Please log in to continue.")
      setIsPermissionError(false)
      setLoading(false)
      // Redirect to login
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      }, 1500)
      return
    }
    loadWorkflowMetadata()
    loadMasterRecords()
  }, []) // Load master records from server on mount

  useEffect(() => {
    let records = masterRecords
    if (selectedWorkflowId !== ALL_WORKFLOWS_VALUE) {
      records = records.filter((record) => record.workflow_id === selectedWorkflowId)
    }

    const trimmedQuery = searchQuery.trim().toLowerCase()
    if (trimmedQuery === "") {
      setFilteredMasterRecords(records)
    } else {
      setFilteredMasterRecords(
        records.filter((record) => {
          return (
            record.company_name?.toLowerCase().includes(trimmedQuery) ||
            record.company_code?.toLowerCase().includes(trimmedQuery) ||
            record.country?.toLowerCase().includes(trimmedQuery) ||
            record.workflow_name?.toLowerCase().includes(trimmedQuery)
          )
        }),
      )
    }
  }, [searchQuery, masterRecords, selectedWorkflowId])

  const workflowSelectOptions = useMemo<WorkflowOption[]>(() => {
    if (availableWorkflows.length > 0) {
      return availableWorkflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
      }))
    }

    const unique = new Map<string, WorkflowOption>()
    masterRecords.forEach((record) => {
      if (record.workflow_id && !unique.has(record.workflow_id)) {
        unique.set(record.workflow_id, {
          id: record.workflow_id,
          name: record.workflow_name || record.workflow_id,
        })
      }
    })

    return Array.from(unique.values())
  }, [availableWorkflows, masterRecords])

  const loadWorkflowMetadata = async () => {
    try {
      const workflows = await WorkflowBridgeService.getAllWorkflows()
      setAvailableWorkflows(workflows)
      setWorkflowMetadata(buildWorkflowDisplayMap(workflows))
    } catch (error) {
      console.error("Failed to load workflow metadata for company list:", error)
    }
  }


  const loadMasterRecords = async () => {
    try {
      setLoading(true)
      setError("")
      setIsPermissionError(false)
      console.log("Loading master table records from all workflows...")

      const response: AllMasterTableDataResponse = await dynamicWorkflowAPI.getAllMasterTableData(
        undefined, // company_id - undefined to get all
        100, // limit_per_workflow
        0, // offset_per_workflow
        false // group_by_step
      )

      console.log("Master records response:", response)

      // Flatten all records from all workflows into a single array
      // response.workflow_data is a dictionary, so we need to iterate over its values
      const allRecords: MasterRecord[] = []

      Object.values(response.workflow_data || {}).forEach((workflow) => {
        console.log(`Processing workflow: ${workflow.workflow_name}`, workflow)

        // Process workflows that have records
        if (workflow.records && workflow.records.length > 0) {
          workflow.records.forEach((record) => {
            console.log("Processing record:", record)

            // Extract fields directly from the record - API returns fields with exact names
            // Based on API response: company_name, company_code, country, form_of_business, accounting_currency
            // Spread record first, then override with our mapped fields to ensure correct values
            const masterRecord: MasterRecord = {
              ...record, // Include all fields from the record first
              // Then override with our mapped/processed fields
              id: record.id || record.company_id || `${workflow.workflow_id}-${Math.random()}`,
              workflow_id: workflow.workflow_id,
              workflow_name: workflow.workflow_name,
              company_id: record.company_id, // Preserve company_id from record
              // Direct field access - keep undefined so UI can fall back gracefully
              company_name: record.company_name ?? "",
              company_code: record.company_code ?? String(record.company_id || record.id || ""),
              country: record.country ?? record.address_country ?? "",
              form_of_business: record.form_of_business ?? "",
              accounting_currency: record.accounting_currency ?? "",
              // Determine completion status - assume complete if all required fields are present
              is_complete: record.is_complete !== undefined
                ? record.is_complete
                : !!(record.company_name && record.company_code),
              onboarding_step: record.onboarding_step || 9,
            }

            console.log("Mapped master record:", masterRecord)
            allRecords.push(masterRecord)
          })
        } else {
          // For workflows without records, create a placeholder record for onboarding
          console.log(`Creating placeholder for workflow ${workflow.workflow_id} - no records yet`)
          const placeholderRecord: MasterRecord = {
            id: `placeholder-${workflow.workflow_id}`,
            workflow_id: workflow.workflow_id,
            workflow_name: workflow.workflow_name,
            company_id: "", // Empty for placeholder
            company_name: `Start ${workflow.workflow_name} Onboarding`,
            company_code: "",
            country: "",
            form_of_business: "",
            accounting_currency: "",
            is_complete: false,
            onboarding_step: 0,
            // Mark as placeholder
            is_placeholder: true,
          }
          allRecords.push(placeholderRecord)
        }
      })

      console.log("Total master records:", allRecords.length)
      if (allRecords.length > 0) {
        console.log("Sample master record:", allRecords[0])
        console.log("Master record fields:", {
          company_name: allRecords[0].company_name,
          company_code: allRecords[0].company_code,
          country: allRecords[0].country,
          form_of_business: allRecords[0].form_of_business,
          accounting_currency: allRecords[0].accounting_currency,
        })
      } else {
        console.warn("⚠️ No master records found! Check if workflow has data inserted.")
      }
      setMasterRecords(allRecords)
      setFilteredMasterRecords(allRecords)
    } catch (error: any) {
      console.error("Failed to load master records:", error)
      console.error("Error details:", error.response?.data || error.message)

      if (error.response?.status === 401 || error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || ""
        const errorLower = errorDetail.toLowerCase()

        // Check for authentication errors
        if (
          errorLower.includes("token") ||
          errorLower.includes("invalid") ||
          errorLower.includes("expired") ||
          errorLower.includes("not authenticated") ||
          errorLower.includes("authentication") ||
          errorDetail === "Not authenticated"
        ) {
          setIsPermissionError(false)
          setError("Not authenticated. Please log in to continue.")
          // Clear invalid token
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token")
            localStorage.removeItem("user")
            // Redirect to login after a short delay
            setTimeout(() => {
              window.location.href = "/"
            }, 2000)
          }
        } else {
          setIsPermissionError(true)
          setError("You don't have permission to view companies. Please contact your administrator.")
        }
      } else {
        setError(error.response?.data?.detail || error.response?.data?.message || error.message || "Failed to load companies from server")
      }

      setMasterRecords([])
      setFilteredMasterRecords([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (companyId: string) => {
    if (onViewCompany) {
      onViewCompany(companyId)
    } else {
      setSelectedCompanyId(companyId)
      setShowDetailsDialog(true)
    }
  }

  const handleViewMasterRecord = (record: MasterRecord) => {
    // Don't allow viewing placeholder records
    if (record.is_placeholder) {
      return
    }

    const workflowId = record.workflow_id
    // Extract company_id from the record (it should be a string UUID now)
    const companyId = record.company_id || (typeof record.id === "string" ? record.id : String(record.id))

    if (!workflowId) {
      console.error("No workflow ID found in record")
      return
    }

    setViewWorkflowData({
      show: true,
      workflowId,
      companyId: companyId || null,
      recordId: typeof record.id === "string" ? record.id : null,
      companyName: record.company_name || null,
    })
  }

  const handleDelete = async () => {
    if (!deleteCompanyId) return

    try {
      setIsDeleting(true)
      console.log("Deleting master record", deleteCompanyId)

      // Find the record to get workflow_id and record_id
      const record = masterRecords.find(r => r.id === deleteCompanyId || r.company_id === deleteCompanyId)

      if (!record) {
        console.error("Cannot delete: record not found")
        toast({
          title: "Error",
          description: "Cannot delete: record not found",
          variant: "destructive",
        })
        setDeleteCompanyId(null)
        setIsDeleting(false)
        return
      }

      // Don't allow deleting placeholder records
      if (record.is_placeholder) {
        toast({
          title: "Cannot Delete",
          description: "Cannot delete placeholder records. Start onboarding first to create actual company data.",
          variant: "destructive",
        })
        setDeleteCompanyId(null)
        setIsDeleting(false)
        return
      }

      if (!record.workflow_id) {
        console.error("Cannot delete: workflow_id not found")
        toast({
          title: "Error",
          description: "Cannot delete: workflow not found",
          variant: "destructive",
        })
        setDeleteCompanyId(null)
        setIsDeleting(false)
        return
      }

      // Get the record_id (convert to string if needed)
      const recordId = typeof record.id === "string" ? record.id : String(record.id)
      const workflowId = record.workflow_id
      const companyName = record.company_name || "Company"

      // Delete via workflow builder API
      // DELETE /workflows/builder/{workflow_id}/table-data/{record_id}
      await dynamicWorkflowAPI.deleteTableRecord(workflowId, recordId)

      console.log(`Successfully deleted record ${recordId} from workflow ${workflowId}`)

      // Show success message
      toast({
        title: "Company Deleted",
        description: `${companyName} has been permanently deleted.`,
      })

      // Reload master records from server to reflect the deletion
      await loadMasterRecords()

      // Close the dialog
      setDeleteCompanyId(null)
    } catch (error: any) {
      console.error("Failed to delete record:", error)
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to delete record. Please try again."
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Company Management</h1>
            <p className="text-muted-foreground text-pretty">Manage and onboard companies</p>
          </div>
          {!isPermissionError && (
            <Button onClick={() => onStartOnboarding(undefined, undefined)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Company
            </Button>
          )}
        </div>
        <Card className={isPermissionError ? "border-destructive" : ""}>
          <CardContent className="py-12">
            <div className="text-center">
              {isPermissionError ? (
                <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-destructive" />
              ) : (
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
              )}
              <p className="text-lg font-medium mb-1 text-destructive">
                {isPermissionError ? "Access Denied" : "Failed to Load Companies"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              {!isPermissionError && (
                <Button
                  onClick={() => {
                    // Check token before retrying
                    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
                    if (!token) {
                      window.location.href = "/"
                    } else {
                      loadMasterRecords()
                    }
                  }}
                  variant="outline"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show full-screen workflow data view if requested
  if (viewWorkflowData.show && viewWorkflowData.workflowId) {
    return (
      <WorkflowDataViewPage
        workflowId={viewWorkflowData.workflowId}
        companyId={viewWorkflowData.companyId || undefined}
        recordId={viewWorkflowData.recordId || undefined}
        companyName={viewWorkflowData.companyName || undefined}
        onBack={() => {
          setViewWorkflowData({
            show: false,
            workflowId: null,
            companyId: null,
            recordId: null,
            companyName: null,
          })
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">Company Management</h1>
          <p className="text-muted-foreground text-pretty">Manage and onboard companies</p>
        </div>
        <Button onClick={() => onStartOnboarding(undefined, undefined)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Company
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name, code, country, or workflow..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="md:w-64">
              <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_WORKFLOWS_VALUE}>All workflows</SelectItem>
                  {workflowSelectOptions.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Records List (from all workflows) */}
      {filteredMasterRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">{searchQuery ? "No records found" : "No records yet"}</p>
              <p className="text-sm">
                {searchQuery ? "Try adjusting your search query" : "Get started by adding your first company"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Display Master Records First - These have the actual workflow data */}
          {filteredMasterRecords.map((record, index) => {
            const workflowMeta = workflowMetadata[record.workflow_id]
            const fieldsToRender =
              (workflowMeta?.displayFields?.length ? workflowMeta.displayFields : DEFAULT_DISPLAY_FIELDS).slice(0, 3)
            const fallbackTitle = workflowMeta?.primaryField
              ? formatRecordValue(getFieldValue(record, workflowMeta.primaryField.fieldId, availableWorkflows))
              : undefined
            const companyName = getFieldValue(record, "company_name", availableWorkflows) || record.company_name
            const companyCode = getFieldValue(record, "company_code", availableWorkflows) || record.company_code
            const cardTitle = companyName && String(companyName).trim()
              ? String(companyName).trim()
              : fallbackTitle && fallbackTitle !== "N/A"
                ? fallbackTitle
                : "N/A"
            const cardSubtitle = companyCode && String(companyCode).trim() ? String(companyCode).trim() : formatRecordValue(record.id)

            return (
              <Card key={`master-${record.workflow_id}-${record.id}-${index}`} className="hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cardTitle}</CardTitle>
                        <CardDescription className="text-xs">{cardSubtitle || "No code"}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <div>
                    {record.is_placeholder ? (
                      <Badge variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Not Started
                      </Badge>
                    ) : record.is_complete ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {record.onboarding_step ? `Step ${record.onboarding_step}/9` : "In Progress"}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {fieldsToRender.map((field) => {
                      const fieldValue = getFieldValue(record, field.fieldId, availableWorkflows)
                      return (
                        <div className="flex justify-between" key={`${record.workflow_id}-${field.fieldId}`}>
                          <span className="text-muted-foreground">{field.label}:</span>
                          <span className="font-medium truncate ml-2">
                            {formatRecordValue(fieldValue)}
                          </span>
                        </div>
                      )
                    })}
                    {record.workflow_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Workflow:</span>
                        <span className="font-medium truncate ml-2 text-xs">{record.workflow_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    {record.is_placeholder ? (
                      // For placeholder records, show Start Onboarding button
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const workflowId = record.workflow_id
                          onStartOnboarding(undefined, workflowId, undefined)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Start Onboarding
                      </Button>
                    ) : (
                      // For real records, show normal actions
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleViewMasterRecord(record)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            // Use company_id if available, otherwise try to parse id as number
                            const companyId = record.company_id || (typeof record.id === "number" ? record.id : undefined)
                            const workflowId = record.workflow_id
                            // Use record.id as recordId (convert to string if needed)
                            const recordId = typeof record.id === "string" ? record.id : String(record.id)
                            onStartOnboarding(companyId, workflowId, recordId)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive bg-transparent"
                          onClick={() => setDeleteCompanyId(record.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Company Details Dialog */}
      {!onViewCompany && selectedCompanyId && (
        <ERPCompanyDetails
          companyId={selectedCompanyId}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onEdit={(companyId) => onStartOnboarding(companyId, undefined, undefined)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCompanyId !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
