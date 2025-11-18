"use client"

import { useEffect, useState } from "react"
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
import type { AllMasterTableDataResponse } from "@/lib/api/types/dynamic-workflow.types"
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

interface ERPCompanyListProps {
  onStartOnboarding: (companyId?: number) => void
  onViewCompany?: (companyId: number) => void
}

interface MasterRecord {
  id: string | number
  workflow_id: string
  workflow_name?: string
  company_id?: number
  company_name: string
  company_code?: string
  country?: string
  form_of_business?: string
  accounting_currency?: string
  is_complete?: boolean
  onboarding_step?: number
  [key: string]: any // For other dynamic fields
}

export function ERPCompanyList({ onStartOnboarding, onViewCompany }: ERPCompanyListProps) {
  const [masterRecords, setMasterRecords] = useState<MasterRecord[]>([])
  const [filteredMasterRecords, setFilteredMasterRecords] = useState<MasterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | string | null>(null)
  const [error, setError] = useState<string>("")
  const [isPermissionError, setIsPermissionError] = useState(false)
  const [viewWorkflowData, setViewWorkflowData] = useState<{
    show: boolean
    workflowId: string | null
    companyId: number | null
    recordId: string | null
    companyName: string | null
  }>({
    show: false,
    workflowId: null,
    companyId: null,
    recordId: null,
    companyName: null,
  })

  useEffect(() => {
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
    loadMasterRecords()
  }, []) // Load master records from server on mount

  useEffect(() => {
    // Filter master records based on search query
    if (searchQuery.trim() === "") {
      setFilteredMasterRecords(masterRecords)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredMasterRecords(
        masterRecords.filter(
          (record) =>
            record.company_name?.toLowerCase().includes(query) ||
            record.company_code?.toLowerCase().includes(query) ||
            record.country?.toLowerCase().includes(query) ||
            record.workflow_name?.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, masterRecords])


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
        
        // Only process workflows that have records
        if (!workflow.records || workflow.records.length === 0) {
          console.log(`Skipping workflow ${workflow.workflow_id} - no records`)
          return
        }
        
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
            // Direct field access - these fields exist in the API response
            company_name: record.company_name || "N/A",
            company_code: record.company_code || String(record.company_id || record.id || "N/A"),
            country: record.country || record.address_country || "N/A",
            form_of_business: record.form_of_business || "N/A",
            accounting_currency: record.accounting_currency || "N/A",
            // Determine completion status - assume complete if all required fields are present
            is_complete: record.is_complete !== undefined 
              ? record.is_complete 
              : !!(record.company_name && record.company_code),
            onboarding_step: record.onboarding_step || 9,
          }
          
          console.log("Mapped master record:", masterRecord)
          allRecords.push(masterRecord)
        })
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

  const handleViewDetails = (companyId: number) => {
    if (onViewCompany) {
      onViewCompany(companyId)
    } else {
      setSelectedCompanyId(companyId)
      setShowDetailsDialog(true)
    }
  }

  const handleViewMasterRecord = (record: MasterRecord) => {
    const workflowId = record.workflow_id
    // Extract company_id from the record (it might be in the record object itself)
    const companyId = record.company_id || (typeof record.id === "number" ? record.id : undefined)
    
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
      console.log("Deleting master record", deleteCompanyId)
      
      // Find the record to get workflow_id
      const record = masterRecords.find(r => r.id === deleteCompanyId || r.company_id === deleteCompanyId)
      
      if (!record || !record.workflow_id) {
        console.error("Cannot delete: record or workflow_id not found")
        setError("Cannot delete: record not found")
        setDeleteCompanyId(null)
        return
      }

      // Delete via workflow builder API
      // Note: The backend should have a DELETE endpoint for table-data records
      // For now, we'll reload the data after attempting deletion
      // TODO: Implement DELETE /workflows/builder/{workflow_id}/table-data/{record_id} endpoint call
      console.log(`Would delete record ${deleteCompanyId} from workflow ${record.workflow_id}`)
      
      // Reload master records from server
      await loadMasterRecords()
      setDeleteCompanyId(null)
    } catch (error) {
      console.error("Failed to delete record:", error)
      setError("Failed to delete record. Please try again.")
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
            <Button onClick={() => onStartOnboarding()} className="bg-blue-600 hover:bg-blue-700">
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
        <Button onClick={() => onStartOnboarding()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Company
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, code, country, or workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
          {filteredMasterRecords.map((record, index) => (
            <Card key={`master-${record.workflow_id}-${record.id}-${index}`} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{record.company_name || "N/A"}</CardTitle>
                      <CardDescription className="text-xs">{record.company_code || record.id || "No code"}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Badge */}
                <div>
                  {record.is_complete ? (
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-medium truncate ml-2">
                      {record.country || record.address_country || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Business Type:</span>
                    <span className="font-medium truncate ml-2">
                      {record.form_of_business || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-medium">
                      {record.accounting_currency || "N/A"}
                    </span>
                  </div>
                  {record.workflow_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workflow:</span>
                      <span className="font-medium truncate ml-2 text-xs">{record.workflow_name}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
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
                      const companyId = typeof record.id === "number" ? record.id : undefined
                      onStartOnboarding(companyId)
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Details Dialog */}
      {!onViewCompany && selectedCompanyId && (
        <ERPCompanyDetails
          companyId={selectedCompanyId}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onEdit={onStartOnboarding}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCompanyId !== null} onOpenChange={() => setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
