"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Calculator,
  FileText,
  CreditCard,
  Package,
  CheckCircle2,
} from "lucide-react"
import { apiService } from "@/lib/api-services"
import { storageService, type WorkflowCompany } from "@/lib/storage-service"
import { workflowStorage, type Workflow } from "@/lib/workflow-storage"

interface ERPCompanyDetailsPageProps {
  companyId: string | number // Support both string and number IDs
  onBack: () => void
}

export function ERPCompanyDetailsPage({ companyId, onBack }: ERPCompanyDetailsPageProps) {
  const [companyData, setCompanyData] = useState<any>(null)
  const [workflowCompanyData, setWorkflowCompanyData] = useState<WorkflowCompany | null>(null)
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWorkflowCompany, setIsWorkflowCompany] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCompanyDetails()
  }, [companyId])

  const loadCompanyDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const companyIdStr = companyId.toString()
      console.log("Loading company details for ID:", companyIdStr)

      const workflowCompanies = storageService.getWorkflowCompanies()
      console.log(
        "Available workflow companies:",
        workflowCompanies.map((c) => c.id),
      )

      const workflowCompany = workflowCompanies.find((c) => c.id === companyIdStr)

      if (workflowCompany) {
        console.log("Found workflow company:", workflowCompany)
        console.log("Workflow company formData keys:", Object.keys(workflowCompany.formData))

        setWorkflowCompanyData(workflowCompany)
        setIsWorkflowCompany(true)

        const loadedWorkflow = workflowStorage.getById(workflowCompany.workflowId)
        console.log("Loaded workflow:", loadedWorkflow ? loadedWorkflow.name : "not found")

        if (loadedWorkflow) {
          console.log("Workflow has", loadedWorkflow.steps.length, "steps")
          console.log("First step fields:", loadedWorkflow.steps[0]?.fields?.length || 0)
          setWorkflow(loadedWorkflow)
        } else {
          console.error("Workflow not found for ID:", workflowCompany.workflowId)
          setError(`Workflow not found: ${workflowCompany.workflowId}`)
        }
      } else {
        if (typeof companyId === "number") {
          console.log("Loading company from API...")
          const data = await apiService.getCompanyById(companyId)
          console.log("Company details loaded from API")
          setCompanyData(data)
          setIsWorkflowCompany(false)
        } else {
          console.error("Company not found in localStorage or API:", companyIdStr)
          setError(`Company not found: ${companyIdStr}`)
        }
      }
    } catch (error) {
      console.error("Failed to load company details:", error)
      setError(error instanceof Error ? error.message : "Failed to load company details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
      </div>
    )
  }

  if (!companyData && !workflowCompanyData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Company not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
      </div>
    )
  }

  if (isWorkflowCompany && workflowCompanyData && workflow) {
    const { formData } = workflowCompanyData

    console.log("Rendering workflow company with", workflow.steps.length, "steps")

    return (
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 md:gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-balance break-words">{workflowCompanyData.name}</h1>
              <p className="text-sm md:text-base text-muted-foreground break-all">
                Created via: {workflowCompanyData.workflowName}
              </p>
            </div>
          </div>
          <Badge variant="default" className="text-sm shrink-0 self-start sm:self-auto bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Workflow Created
          </Badge>
        </div>

        <Tabs defaultValue="step-0" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList
              className="inline-flex w-auto min-w-full md:grid h-auto flex-nowrap md:flex-wrap"
              style={{ gridTemplateColumns: `repeat(${workflow.steps.length}, minmax(0, 1fr))` }}
            >
              {workflow.steps.map((step, index) => (
                <TabsTrigger key={index} value={`step-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="hidden sm:inline">{step.name}</span>
                  <span className="sm:hidden">Step {index + 1}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {workflow.steps.map((step, stepIndex) => {
            console.log(`Rendering step ${stepIndex}: ${step.name}, fields:`, step.fields?.length || 0)

            return (
              <TabsContent key={stepIndex} value={`step-${stepIndex}`} className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">{step.name}</CardTitle>
                    <CardDescription className="text-sm">{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {step.fields && step.fields.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {step.fields.map((field, fieldIndex) => {
                          const fieldValue = formData[field.id]
                          console.log(`Field ${field.id}:`, fieldValue)

                          return (
                            <div key={fieldIndex} className="space-y-1">
                              <label className="text-sm font-medium text-muted-foreground">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                              </label>
                              <p className="text-base">
                                {fieldValue !== undefined && fieldValue !== null && fieldValue !== "" ? (
                                  String(fieldValue)
                                ) : (
                                  <span className="text-muted-foreground italic">Not provided</span>
                                )}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8 text-sm">No fields defined for this step</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Workflow ID</label>
              <p className="text-sm font-mono break-all">{workflowCompanyData.workflowId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Completed At</label>
              <p className="text-sm">{new Date(workflowCompanyData.completedAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company ID</label>
              <p className="text-sm font-mono break-all">{workflowCompanyData.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Steps</label>
              <p className="text-sm">{workflow.steps.length} steps completed</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Total Fields Submitted</label>
              <p className="text-sm">{Object.keys(formData).length} fields</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    company,
    addresses,
    comm_methods,
    message_setups,
    employees,
    currency_rate_types,
    accounting_rules,
    invoice_settings,
    invoice_tax,
    po_matching,
    payment_settings,
    distribution,
  } = companyData

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-balance break-words">{company.name}</h1>
            <p className="text-sm md:text-base text-muted-foreground break-all">Company Code: {company.company_code}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm shrink-0 self-start sm:self-auto">
          {company.country}
        </Badge>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-9 h-auto flex-nowrap md:flex-wrap">
            <TabsTrigger value="general" className="flex items-center gap-2 whitespace-nowrap">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2 whitespace-nowrap">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Addresses</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2 whitespace-nowrap">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 whitespace-nowrap">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger value="accounting" className="flex items-center gap-2 whitespace-nowrap">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Accounting</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2 whitespace-nowrap">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoice</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2 whitespace-nowrap">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2 whitespace-nowrap">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Distribution</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">General Information</CardTitle>
              <CardDescription className="text-sm">Basic company details and configuration</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                <p className="text-base">{company.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company Code</label>
                <p className="text-base">{company.company_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Association Number</label>
                <p className="text-base">{company.association_number || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created By</label>
                <p className="text-base">{company.created_by || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Default Language</label>
                <p className="text-base">{company.default_language}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <p className="text-base">{company.country}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Form of Business</label>
                <p className="text-base">{company.form_of_business || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Creation Date</label>
                <p className="text-base">
                  {company.creation_date ? new Date(company.creation_date).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Authorization ID</label>
                <p className="text-base">{company.authorization_id || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Auth ID Expire Date</label>
                <p className="text-base">
                  {company.auth_id_expire_date ? new Date(company.auth_id_expire_date).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Source Company</label>
                <p className="text-base">{company.source_company || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Template Company</label>
                <p className="text-base">{company.template_company ? "Yes" : "No"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Addresses</CardTitle>
              <CardDescription className="text-sm">Company locations and addresses</CardDescription>
            </CardHeader>
            <CardContent>
              {addresses && addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="break-all">{address.address_id}</span>
                          <Badge className="self-start sm:self-auto">{address.address_type_db}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Address 1</label>
                          <p className="text-sm">{address.address1}</p>
                        </div>
                        {address.address2 && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Address 2</label>
                            <p className="text-sm">{address.address2}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">City</label>
                          <p className="text-sm">{address.city}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">State</label>
                          <p className="text-sm">{address.state || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Zip Code</label>
                          <p className="text-sm">{address.zip_code}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Country</label>
                          <p className="text-sm">{address.country}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No addresses found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Communication Methods</CardTitle>
              <CardDescription className="text-sm">Contact information and communication channels</CardDescription>
            </CardHeader>
            <CardContent>
              {comm_methods && comm_methods.length > 0 ? (
                <div className="space-y-3">
                  {comm_methods.map((method: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="shrink-0">
                          {method.method_id_db}
                        </Badge>
                        <span className="font-medium break-all">{method.value}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{method.description || "No description"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No communication methods found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Message Setup</CardTitle>
              <CardDescription className="text-sm">Message configuration and settings</CardDescription>
            </CardHeader>
            <CardContent>
              {message_setups && message_setups.length > 0 ? (
                <div className="space-y-3">
                  {message_setups.map((setup: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-6 grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Message Code</label>
                          <p className="text-sm">{setup.message_code}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Media Code</label>
                          <p className="text-sm">{setup.media_code}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Method Definition</label>
                          <p className="text-sm">{setup.method_definition || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Active</label>
                          <Badge variant={setup.active_flag ? "default" : "secondary"}>
                            {setup.active_flag ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No message setups found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Employees</CardTitle>
              <CardDescription className="text-sm">Company employees and staff</CardDescription>
            </CardHeader>
            <CardContent>
              {employees && employees.length > 0 ? (
                <div className="space-y-3">
                  {employees.map((employee: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <p className="text-lg font-semibold">{employee.employee_id}</p>
                        <p className="text-sm text-muted-foreground mt-1">{employee.name || "No name"}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No employees found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounting" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Accounting Rules</CardTitle>
              <CardDescription className="text-sm">Accounting configuration and currency settings</CardDescription>
            </CardHeader>
            <CardContent>
              {accounting_rules && accounting_rules.length > 0 ? (
                <div className="space-y-6">
                  {accounting_rules.map((rule: any, index: number) => (
                    <div key={index} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Accounting Currency</label>
                          <p className="text-base">{rule.accounting_currency}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Parallel Currency</label>
                          <p className="text-base">{rule.parallel_currency || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Valid From</label>
                          <p className="text-base">
                            {rule.valid_from ? new Date(rule.valid_from).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tax Rounding Method</label>
                          <p className="text-base">{rule.tax_rounding_method || "N/A"}</p>
                        </div>
                      </div>

                      {currency_rate_types && currency_rate_types.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Currency Rate Types</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 sm:grid-cols-2">
                            {currency_rate_types.map((rate: any, rateIndex: number) => (
                              <div key={rateIndex} className="space-y-2">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Buy Rate Type</label>
                                  <p className="text-sm">{rate.rate_type_buy}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Sell Rate Type</label>
                                  <p className="text-sm">{rate.rate_type_sell}</p>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No accounting rules found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Invoice Settings</CardTitle>
              <CardDescription className="text-sm">Invoice configuration and tax settings</CardDescription>
            </CardHeader>
            <CardContent>
              {invoice_settings && invoice_settings.length > 0 ? (
                <div className="space-y-6">
                  {invoice_settings.map((setting: any, index: number) => (
                    <div key={index} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Default Invoice Type</label>
                          <p className="text-base">{setting.default_invoice_type_instant || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Cash Discount Based on Gross
                          </label>
                          <Badge variant={setting.cash_discount_based_on_gross ? "default" : "secondary"}>
                            {setting.cash_discount_based_on_gross ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>

                      {invoice_tax && invoice_tax.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Invoice Tax</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 sm:grid-cols-2">
                            {invoice_tax.map((tax: any, taxIndex: number) => (
                              <div key={taxIndex} className="space-y-2">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Tax Regime</label>
                                  <p className="text-sm">{tax.tax_regime}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Tax ID Number</label>
                                  <p className="text-sm">{tax.tax_id_number || "N/A"}</p>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {po_matching && po_matching.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">PO Matching</CardTitle>
                          </CardHeader>
                          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {po_matching.map((po: any, poIndex: number) => (
                              <div key={poIndex} className="space-y-2">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Tolerance %</label>
                                  <p className="text-sm">{po.po_match_tol_percent}%</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Tolerance Amount</label>
                                  <p className="text-sm">
                                    {po.po_match_tol_amount} {po.po_match_tol_currency}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No invoice settings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Payment Settings</CardTitle>
              <CardDescription className="text-sm">Payment configuration and tolerances</CardDescription>
            </CardHeader>
            <CardContent>
              {payment_settings && payment_settings.length > 0 ? (
                <div className="space-y-4">
                  {payment_settings.map((setting: any, index: number) => (
                    <div key={index} className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Percent Tolerance</label>
                        <p className="text-base">{setting.percent_tolerance}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Amount Tolerance</label>
                        <p className="text-base">
                          {setting.amount_tolerance} {setting.tolerance_currency}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Payment Posting Method</label>
                        <p className="text-base">{setting.payment_posting_method || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Include Supplier Negative Balance
                        </label>
                        <Badge variant={setting.include_supplier_neg_bal ? "default" : "secondary"}>
                          {setting.include_supplier_neg_bal ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No payment settings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Distribution</CardTitle>
              <CardDescription className="text-sm">Distribution and logistics settings</CardDescription>
            </CardHeader>
            <CardContent>
              {distribution && distribution.length > 0 ? (
                <div className="space-y-4">
                  {distribution.map((dist: any, index: number) => (
                    <div key={index} className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Base for Advance Invoice</label>
                        <p className="text-base">{dist.base_for_adv_invoice || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ownership Transfer Point</label>
                        <p className="text-base">{dist.ownership_transfer_point || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tax Code</label>
                        <p className="text-base">{dist.tax_code || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Use Transit Balancing</label>
                        <Badge variant={dist.use_transit_balancing ? "default" : "secondary"}>
                          {dist.use_transit_balancing ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No distribution settings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
