"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { dynamicWorkflowAPI } from "@/lib/api/services/dynamic-workflow-api.service"
import type { WorkflowTableDataResponse } from "@/lib/api/types/dynamic-workflow.types"

interface WorkflowDataViewPageProps {
  workflowId: string
  companyId?: number
  recordId?: string
  companyName?: string
  onBack: () => void
}

export function WorkflowDataViewPage({
  workflowId,
  companyId,
  recordId,
  companyName,
  onBack,
}: WorkflowDataViewPageProps) {
  const [workflowData, setWorkflowData] = useState<WorkflowTableDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ref to track if the effect has already been triggered (prevents duplicate API calls in React StrictMode)
  const loadEffectTriggeredRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    const effectKey = `${workflowId}-${companyId || 'none'}`
    
    // Skip duplicate load triggered by React StrictMode for the same workflowId and companyId
    if (loadEffectTriggeredRef.current === effectKey || isLoadingRef.current) {
      return
    }
    
    // Mark as triggered and loading immediately (before async call)
    loadEffectTriggeredRef.current = effectKey
    isLoadingRef.current = true

    loadWorkflowData().finally(() => {
      // Only reset loading flag if we're still on the same workflowId and companyId
      if (loadEffectTriggeredRef.current === effectKey) {
        isLoadingRef.current = false
      }
    })

    // Cleanup function to reset when workflowId or companyId changes
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
      console.log("Loading workflow data:", { workflowId, companyId, recordId })

      const data = await dynamicWorkflowAPI.getTableData(
        workflowId,
        companyId,
        100,
        0,
        true // group_by_step = true
      )
      console.log("Workflow data fetched:", data)
      setWorkflowData(data)
    } catch (error: any) {
      console.error("Failed to load workflow data:", error)
      setError(error.response?.data?.detail || error.message || "Failed to load workflow data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workflow data...</p>
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
                <p className="text-sm">No records available for this workflow</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get the record to display (filter by recordId if available, otherwise first record)
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

  // Check if data is grouped by steps
  const isGroupedByStep = workflowData.grouped_by_step && recordToDisplay.steps && recordToDisplay.steps.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - Sticky */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-accent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Companies
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{workflowData.workflow_name || "Workflow Data"}</h1>
                {companyName && (
                  <p className="text-sm text-muted-foreground mt-0.5">{companyName}</p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1.5" />
              Complete
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isGroupedByStep ? (
          <Tabs defaultValue={`step-0`} className="w-full">
            {/* Tabs Navigation - Improved Styling */}
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

            {/* Tab Content - Enhanced Cards */}
            {recordToDisplay.steps!.map((step, stepIndex) => (
              <TabsContent
                key={step.step_id || stepIndex}
                value={`step-${stepIndex}`}
                className="mt-0 space-y-6 animate-in fade-in-50 duration-300"
              >
                <Card className="shadow-md border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4 border-b bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold mb-2">{step.step_name}</CardTitle>
                        {step.description && (
                          <CardDescription className="text-base mt-1">{step.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-4">
                        Step {step.step_order || stepIndex + 1}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {step.fields && Object.keys(step.fields).length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(step.fields)
                          .sort(([, a]: [string, any], [, b]: [string, any]) => {
                            const orderA = a.field_order || 0
                            const orderB = b.field_order || 0
                            return orderA - orderB
                          })
                          .map(([fieldName, fieldData]: [string, any]) => (
                            <div
                              key={fieldName}
                              className="group space-y-2 p-5 rounded-lg border-2 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
                            >
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                {fieldData.field_label || fieldName}
                                {fieldData.is_required && (
                                  <span className="text-destructive text-xs">*</span>
                                )}
                              </label>
                              <p className="text-base font-semibold text-foreground break-words">
                                {fieldData.value !== undefined &&
                                fieldData.value !== null &&
                                fieldData.value !== "" ? (
                                  <span className="text-foreground">
                                    {typeof fieldData.value === "boolean"
                                      ? fieldData.value
                                        ? (
                                            <Badge variant="default" className="bg-green-600">
                                              Yes
                                            </Badge>
                                          )
                                        : (
                                            <Badge variant="secondary">
                                              No
                                            </Badge>
                                          )
                                      : String(fieldData.value)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic font-normal">Not provided</span>
                                )}
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No fields defined for this step</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
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
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </label>
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
    </div>
  )
}

