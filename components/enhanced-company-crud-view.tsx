"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"
import type { WorkflowTableDataResponse } from "@/lib/api/types/dynamic-workflow.types"
import { useToast } from "@/hooks/use-toast"
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

interface EnhancedCompanyCRUDViewProps {
  workflowId: string
  companyId?: number
  recordId?: string
  companyName?: string
  onBack: () => void
}

export function EnhancedCompanyCRUDView({
  workflowId,
  companyId,
  recordId,
  companyName,
  onBack,
}: EnhancedCompanyCRUDViewProps) {
  const [workflowData, setWorkflowData] = useState<WorkflowTableDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<Record<string, boolean>>({}) // Track edit mode per step
  const [editedData, setEditedData] = useState<Record<string, Record<string, any>>>({}) // Track edited data per step
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; stepIndex?: number; fieldName?: string }>({ open: false })
  const { toast } = useToast()

  const loadEffectTriggeredRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    const effectKey = `${workflowId}-${companyId || 'none'}`
    
    if (loadEffectTriggeredRef.current === effectKey || isLoadingRef.current) {
      return
    }
    
    loadEffectTriggeredRef.current = effectKey
    isLoadingRef.current = true

    loadWorkflowData().finally(() => {
      if (loadEffectTriggeredRef.current === effectKey) {
        isLoadingRef.current = false
      }
    })

    return () => {
      if (loadEffectTriggeredRef.current !== effectKey) {
        loadEffectTriggeredRef.current = null
        isLoadingRef.current = false
      }
    }
  }, [workflowId, companyId])

  const loadWorkflowData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await dynamicWorkflowAPI.getTableData(
        workflowId,
        companyId,
        100,
        0,
        true // group_by_step = true
      )
      setWorkflowData(data)
      
      // Initialize edited data with current values
      if (data.records && data.records.length > 0) {
        const record = recordId
          ? data.records.find((r) => r.id === recordId)
          : data.records[0]
        
        if (record && record.steps) {
          const initialEditedData: Record<string, Record<string, any>> = {}
          record.steps.forEach((step, stepIndex) => {
            initialEditedData[`step-${stepIndex}`] = {}
            if (step.fields) {
              Object.entries(step.fields).forEach(([fieldName, fieldData]: [string, any]) => {
                initialEditedData[`step-${stepIndex}`][fieldName] = fieldData.value
              })
            }
          })
          setEditedData(initialEditedData)
        }
      }
    } catch (error: any) {
      console.error("Failed to load workflow data:", error)
      setError(error.response?.data?.detail || error.message || "Failed to load workflow data")
    } finally {
      setLoading(false)
    }
  }

  const toggleEditMode = (stepIndex: number) => {
    setEditMode(prev => ({
      ...prev,
      [`step-${stepIndex}`]: !prev[`step-${stepIndex}`]
    }))
    
    // If exiting edit mode, reset edited data
    if (editMode[`step-${stepIndex}`]) {
      loadWorkflowData() // Reload to reset
    }
  }

  const handleFieldChange = (stepIndex: number, fieldName: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [`step-${stepIndex}`]: {
        ...prev[`step-${stepIndex}`],
        [fieldName]: value
      }
    }))
  }

  const handleSave = async (stepIndex: number) => {
    if (!workflowData || !workflowData.records || workflowData.records.length === 0) return

    const record = recordId
      ? workflowData.records.find((r) => r.id === recordId)
      : workflowData.records[0]

    if (!record || !record.id) {
      toast({
        title: "Error",
        description: "Record ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const stepData = editedData[`step-${stepIndex}`] || {}
      
      // Prepare update data - map field names to values
      const updateData: Record<string, any> = {}
      Object.entries(stepData).forEach(([fieldName, value]) => {
        updateData[fieldName] = value
      })

      await dynamicWorkflowAPI.updateTableRecord(workflowId, record.id, updateData)
      
      toast({
        title: "Success",
        description: "Data updated successfully",
      })
      
      setEditMode(prev => ({
        ...prev,
        [`step-${stepIndex}`]: false
      }))
      
      // Reload data
      await loadWorkflowData()
    } catch (error: any) {
      console.error("Failed to update record:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to update record",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!workflowData || !workflowData.records || workflowData.records.length === 0) return

    const record = recordId
      ? workflowData.records.find((r) => r.id === recordId)
      : workflowData.records[0]

    if (!record || !record.id) {
      toast({
        title: "Error",
        description: "Record ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      await dynamicWorkflowAPI.deleteTableRecord(workflowId, record.id)
      
      toast({
        title: "Success",
        description: "Record deleted successfully",
      })
      
      // Go back to company list
      onBack()
    } catch (error: any) {
      console.error("Failed to delete record:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to delete record",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setDeleteDialog({ open: false })
    }
  }

  const handleAddNew = async (stepIndex: number) => {
    // For adding new records, we'll use the create endpoint
    // This would typically open a modal or navigate to a form
    // For now, we'll show a toast
    toast({
      title: "Add New Record",
      description: "Use the 'Add New Company' button to create a new record with all steps",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading company data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
              <p className="text-lg font-medium mb-1 text-destructive">Error Loading Data</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={loadWorkflowData}>Try Again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!workflowData || !workflowData.records || workflowData.records.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No data found</p>
                <p className="text-sm">No records available for this company</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const recordToDisplay = recordId
    ? workflowData.records.find((r) => r.id === recordId)
    : workflowData.records[0]

  if (!recordToDisplay) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">Record not found</p>
                <p className="text-sm">The requested record could not be found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isGroupedByStep = workflowData.grouped_by_step && recordToDisplay.steps && recordToDisplay.steps.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - Sticky with CRUD Actions */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-accent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{workflowData.workflow_name || "Company Details"}</h1>
                {companyName && (
                  <p className="text-sm text-muted-foreground mt-0.5">{companyName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                Active
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialog({ open: true })}
                className="ml-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isGroupedByStep ? (
          <Tabs defaultValue={`step-0`} className="w-full">
            {/* Tabs Navigation */}
            <div className="mb-8">
              <div className="border-b border-border">
                <TabsList className="h-auto w-full justify-start bg-transparent p-0 gap-0">
                  <div className="flex gap-0 overflow-x-auto scrollbar-thin">
                    {recordToDisplay.steps!.map((step, stepIndex) => (
                      <TabsTrigger
                        key={step.step_id || stepIndex}
                        value={`step-${stepIndex}`}
                        className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none font-medium transition-all hover:text-primary/80 whitespace-nowrap"
                      >
                        <span className="text-sm">{step.step_name}</span>
                      </TabsTrigger>
                    ))}
                  </div>
                </TabsList>
              </div>
            </div>

            {/* Tab Content with CRUD */}
            {recordToDisplay.steps!.map((step, stepIndex) => {
              const isEditing = editMode[`step-${stepIndex}`]
              const stepData = editedData[`step-${stepIndex}`] || {}

              return (
                <TabsContent
                  key={step.step_id || stepIndex}
                  value={`step-${stepIndex}`}
                  className="mt-0 space-y-6 animate-in fade-in-50 duration-300"
                >
                  <Card className="shadow-md border-2 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl font-bold mb-2">{step.step_name}</CardTitle>
                          {step.description && (
                            <CardDescription className="text-base mt-1">{step.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="secondary" className="shrink-0">
                            Step {step.step_order || stepIndex + 1}
                          </Badge>
                          {!isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleEditMode(stepIndex)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddNew(stepIndex)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSave(stepIndex)}
                                disabled={saving}
                              >
                                {saving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleEditMode(stepIndex)}
                                disabled={saving}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Check if this is an address step with records array (multiple addresses) */}
                      {(() => {
                        const isAddressStep = step.step_name?.toLowerCase().includes("address") || step.step_order === 2
                        const hasRecords = Array.isArray(step.records) && step.records.length > 0
                        
                        if (isAddressStep && hasRecords && !isEditing) {
                          // Render multiple addresses in table format (read-only view mode)
                          console.log(`🔍 [EnhancedCompanyCRUDView] Rendering ${step.records.length} address(es) in table format`)
                          return (
                            <div className="space-y-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12">Sr.</TableHead>
                                    <TableHead>Address Line 1</TableHead>
                                    <TableHead>Address Line 2</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>State/Province</TableHead>
                                    <TableHead>County</TableHead>
                                    <TableHead>Pincode</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Type</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {step.records.map((record: any, index: number) => {
                                    // Extract field values from record (record contains field objects with value property)
                                    const extractFieldValue = (fieldKey: string) => {
                                      const fieldObj = record[fieldKey]
                                      if (fieldObj && typeof fieldObj === 'object' && fieldObj !== null && 'value' in fieldObj) {
                                        return fieldObj.value
                                      }
                                      return record[fieldKey] !== undefined ? record[fieldKey] : null
                                    }
                                    
                                    const addressLine1 = extractFieldValue('address_line_1')
                                    const addressLine2 = extractFieldValue('address_line_2')
                                    const city = extractFieldValue('city')
                                    const stateProvince = extractFieldValue('state_province')
                                    const county = extractFieldValue('county')
                                    const pincode = extractFieldValue('pincode')
                                    const country = extractFieldValue('address_country')
                                    const delivery = extractFieldValue('delivery')
                                    const document = extractFieldValue('document')
                                    const pay = extractFieldValue('pay')
                                    const visit = extractFieldValue('visit')
                                    
                                    // Build address type flags
                                    const addressTypes = []
                                    if (delivery) addressTypes.push('Delivery')
                                    if (document) addressTypes.push('Document')
                                    if (pay) addressTypes.push('Pay')
                                    if (visit) addressTypes.push('Visit')
                                    
                                    return (
                                      <TableRow key={record.id || `address-${index}`}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{addressLine1 || "-"}</TableCell>
                                        <TableCell>{addressLine2 || "-"}</TableCell>
                                        <TableCell>{city || "-"}</TableCell>
                                        <TableCell>{stateProvince || "-"}</TableCell>
                                        <TableCell>{county || "-"}</TableCell>
                                        <TableCell>{pincode || "-"}</TableCell>
                                        <TableCell>{country || "-"}</TableCell>
                                        <TableCell>
                                          {addressTypes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {addressTypes.map((type, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                  {type}
                                                </Badge>
                                              ))}
                                            </div>
                                          ) : (
                                            "-"
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )
                        } else if (step.fields && Object.keys(step.fields).length > 0) {
                          // Render single address or other step fields (backward compatibility)
                          return (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {Object.entries(step.fields)
                                .sort(([, a]: [string, any], [, b]: [string, any]) => {
                                  const orderA = a.field_order || 0
                                  const orderB = b.field_order || 0
                                  return orderA - orderB
                                })
                                .map(([fieldName, fieldData]: [string, any]) => {
                                  const fieldValue = isEditing
                                    ? (stepData[fieldName] !== undefined ? stepData[fieldName] : fieldData.value)
                                    : fieldData.value

                                  return (
                                    <div
                                      key={fieldName}
                                      className="group space-y-2 p-5 rounded-lg border-2 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
                                    >
                                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        {fieldData.field_label || fieldName}
                                        {fieldData.is_required && (
                                          <span className="text-destructive text-xs">*</span>
                                        )}
                                      </Label>
                                      
                                      {isEditing ? (
                                        <div className="space-y-1">
                                          {fieldData.field_type === "textarea" ? (
                                            <Textarea
                                              value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ""}
                                              onChange={(e) => handleFieldChange(stepIndex, fieldName, e.target.value)}
                                              placeholder={`Enter ${fieldData.field_label || fieldName}`}
                                              className="min-h-[100px]"
                                            />
                                          ) : fieldData.field_type === "select" ? (
                                            <Select
                                              value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ""}
                                              onValueChange={(value) => handleFieldChange(stepIndex, fieldName, value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder={`Select ${fieldData.field_label || fieldName}`} />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {fieldData.validation_rules?.options?.map((option: string) => (
                                                  <SelectItem key={option} value={option}>
                                                    {option}
                                                  </SelectItem>
                                                )) || (
                                                  <SelectItem value={String(fieldValue)}>
                                                    {String(fieldValue || "")}
                                                  </SelectItem>
                                                )}
                                              </SelectContent>
                                            </Select>
                                          ) : fieldData.field_type === "checkbox" ? (
                                            <div className="flex items-center space-x-2">
                                              <input
                                                type="checkbox"
                                                checked={fieldValue === true || fieldValue === "true"}
                                                onChange={(e) => handleFieldChange(stepIndex, fieldName, e.target.checked)}
                                                className="h-4 w-4"
                                              />
                                              <Label className="text-sm">Yes</Label>
                                            </div>
                                          ) : (
                                            <Input
                                              type={fieldData.field_type === "number" ? "number" : fieldData.field_type === "email" ? "email" : fieldData.field_type === "phone" ? "tel" : "text"}
                                              value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ""}
                                              onChange={(e) => handleFieldChange(stepIndex, fieldName, e.target.value)}
                                              placeholder={`Enter ${fieldData.field_label || fieldName}`}
                                            />
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-base font-semibold text-foreground break-words">
                                          {fieldValue !== undefined &&
                                          fieldValue !== null &&
                                          fieldValue !== "" ? (
                                            <span className="text-foreground">
                                              {typeof fieldValue === "boolean"
                                                ? fieldValue ? (
                                                    <Badge variant="default" className="bg-green-600">
                                                      Yes
                                                    </Badge>
                                                  ) : (
                                                    <Badge variant="secondary">
                                                      No
                                                    </Badge>
                                                  )
                                                : String(fieldValue)}
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground italic font-normal">Not provided</span>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  )
                                })}
                            </div>
                          )
                        } else {
                          return (
                            <div className="text-center py-16 text-muted-foreground">
                              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm font-medium">No fields defined for this step</p>
                            </div>
                          )
                        }
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        ) : (
          // Fallback: display flat record data
          <Card className="shadow-md border-2">
            <CardHeader className="pb-4 border-b bg-muted/30">
              <CardTitle className="text-2xl">Record Data</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(recordToDisplay)
                  .filter(
                    ([key]) =>
                      !["id", "workflow_id", "workflow_instance_id", "created_at", "updated_at", "steps"].includes(
                        key,
                      ),
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="group space-y-2 p-5 rounded-lg border-2 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
                    >
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Label>
                      <p className="text-base font-semibold text-foreground">
                        {value !== undefined && value !== null && value !== "" ? (
                          <span>{String(value)}</span>
                        ) : (
                          <span className="text-muted-foreground italic font-normal">Not provided</span>
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company record and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {saving ? (
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
