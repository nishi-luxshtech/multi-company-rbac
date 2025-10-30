"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  DollarSign,
  FileText,
  CreditCard,
  Package,
  Edit,
} from "lucide-react"
import { companyAPI } from "@/lib/api-services"

interface CompanyDetailsProps {
  companyId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (companyId: number) => void
}

export function ERPCompanyDetails({ companyId, open, onOpenChange, onEdit }: CompanyDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [companyData, setCompanyData] = useState<any>(null)

  useEffect(() => {
    if (open && companyId) {
      loadCompanyDetails()
    }
  }, [open, companyId])

  const loadCompanyDetails = async () => {
    try {
      setLoading(true)
      console.log("Loading company details for ID:", companyId)
      const data = await companyAPI.getById(companyId)
      console.log("Company details loaded:", data)
      setCompanyData(data)
    } catch (error) {
      console.error("Failed to load company details:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>{companyData?.company?.name || "Company Details"}</span>
            </DialogTitle>
            {onEdit && companyData && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  onEdit(companyId)
                  onOpenChange(false)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : companyData ? (
          <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="accounting">Accounting</TabsTrigger>
              <TabsTrigger value="invoice">Invoice</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* General Information Tab */}
              <TabsContent value="general" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-medium">{companyData.company.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company Code</p>
                      <p className="font-medium">{companyData.company.company_code || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Association Number</p>
                      <p className="font-medium">{companyData.company.association_no || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Country</p>
                      <p className="font-medium">{companyData.company.country || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Default Language</p>
                      <p className="font-medium">{companyData.company.default_language || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Form of Business</p>
                      <p className="font-medium">{companyData.company.form_of_business || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{companyData.company.created_by || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Creation Date</p>
                      <p className="font-medium">
                        {companyData.company.creation_date
                          ? new Date(companyData.company.creation_date).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Authorization ID</p>
                      <p className="font-medium">{companyData.company.authorization_id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Auth ID Expire Date</p>
                      <p className="font-medium">
                        {companyData.company.auth_id_expire_date
                          ? new Date(companyData.company.auth_id_expire_date).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Source Company</p>
                      <p className="font-medium">{companyData.company.source_company || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Template Company</p>
                      <Badge variant={companyData.company.template_company ? "default" : "secondary"}>
                        {companyData.company.template_company ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={companyData.company.is_active ? "default" : "secondary"}>
                        {companyData.company.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses" className="space-y-4 mt-0">
                {companyData.addresses && companyData.addresses.length > 0 ? (
                  companyData.addresses.map((address: any) => (
                    <Card key={address.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                            {address.address_type} Address
                          </CardTitle>
                          {address.is_default && <Badge>Default</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Address Identity</p>
                          <p className="font-medium">{address.address_identity || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address 1</p>
                          <p className="font-medium">{address.address1 || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address 2</p>
                          <p className="font-medium">{address.address2 || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">City</p>
                          <p className="font-medium">{address.city || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">County</p>
                          <p className="font-medium">{address.county || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Zip Code</p>
                          <p className="font-medium">{address.zip_code || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Country</p>
                          <p className="font-medium">{address.country || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valid From</p>
                          <p className="font-medium">
                            {address.valid_from ? new Date(address.valid_from).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valid To</p>
                          <p className="font-medium">
                            {address.valid_to ? new Date(address.valid_to).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">No addresses found</CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Communication Methods Tab */}
              <TabsContent value="communication" className="space-y-4 mt-0">
                {companyData.comm_methods && companyData.comm_methods.length > 0 ? (
                  companyData.comm_methods.map((comm: any) => (
                    <Card key={comm.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            {comm.comm_method === "EMAIL" && <Mail className="h-4 w-4 mr-2 text-blue-600" />}
                            {comm.comm_method === "PHONE" && <Phone className="h-4 w-4 mr-2 text-blue-600" />}
                            {comm.comm_method}
                          </CardTitle>
                          {comm.is_primary && <Badge>Primary</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Value</p>
                          <p className="font-medium">{comm.value || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{comm.comm_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valid From</p>
                          <p className="font-medium">
                            {comm.valid_from ? new Date(comm.valid_from).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valid To</p>
                          <p className="font-medium">
                            {comm.valid_to ? new Date(comm.valid_to).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No communication methods found
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Message Setup Tab */}
              <TabsContent value="messages" className="space-y-4 mt-0">
                {companyData.message_setups && companyData.message_setups.length > 0 ? (
                  companyData.message_setups.map((msg: any) => (
                    <Card key={msg.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{msg.message_code}</CardTitle>
                          <Badge variant={msg.active_flag ? "default" : "secondary"}>
                            {msg.active_flag ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Media Code</p>
                          <p className="font-medium">{msg.media_code || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Method Definition</p>
                          <p className="font-medium">{msg.method_def || "N/A"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No message setups found
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Employees Tab */}
              <TabsContent value="employees" className="space-y-4 mt-0">
                {companyData.employees && companyData.employees.length > 0 ? (
                  companyData.employees.map((emp: any) => (
                    <Card key={emp.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-600" />
                            {emp.name}
                          </CardTitle>
                          <Badge variant={emp.is_active ? "default" : "secondary"}>
                            {emp.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Employee ID</p>
                          <p className="font-medium">{emp.employee_id || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Role</p>
                          <p className="font-medium">{emp.role || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Person ID</p>
                          <p className="font-medium">{emp.person_id || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expire Date</p>
                          <p className="font-medium">
                            {emp.expire_date ? new Date(emp.expire_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">No employees found</CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Accounting Rules Tab */}
              <TabsContent value="accounting" className="space-y-4 mt-0">
                {companyData.accounting_rules && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                        Accounting Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Accounting Currency</p>
                        <p className="font-medium">{companyData.accounting_rules.accounting_currency || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Parallel Currency</p>
                        <p className="font-medium">{companyData.accounting_rules.parallel_currency || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valid From</p>
                        <p className="font-medium">
                          {companyData.accounting_rules.valid_from
                            ? new Date(companyData.accounting_rules.valid_from).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cancel Rollback Method</p>
                        <p className="font-medium">{companyData.accounting_rules.cancel_rollback_method || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Default Amount Method</p>
                        <p className="font-medium">{companyData.accounting_rules.default_amount_method || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax Rounding Method</p>
                        <p className="font-medium">{companyData.accounting_rules.tax_rounding_method || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max Overwrite Tax %</p>
                        <p className="font-medium">{companyData.accounting_rules.max_overwrite_tax_percent || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Default Tax City</p>
                        <p className="font-medium">{companyData.accounting_rules.default_tax_city || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Use Voucher Series</p>
                        <Badge variant={companyData.accounting_rules.use_voucher_series ? "default" : "secondary"}>
                          {companyData.accounting_rules.use_voucher_series ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Currency Rate Types */}
                {companyData.currency_rate_types && companyData.currency_rate_types.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Currency Rate Types</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {companyData.currency_rate_types.map((rate: any) => (
                        <div key={rate.id} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Rate Type Buy</p>
                            <p className="font-medium">{rate.rate_type_buy || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Rate Type Sell</p>
                            <p className="font-medium">{rate.rate_type_sell || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tax Buy Rate Type</p>
                            <p className="font-medium">{rate.tax_buy_rate_type || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tax Sell Rate Type</p>
                            <p className="font-medium">{rate.tax_sell_rate_type || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Allow Tax Rate Override</p>
                            <Badge variant={rate.allow_tax_rate_override ? "default" : "secondary"}>
                              {rate.allow_tax_rate_override ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Invoice Settings Tab */}
              <TabsContent value="invoice" className="space-y-4 mt-0">
                {companyData.invoice_settings && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        Invoice Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Default Invoice Type</p>
                        <p className="font-medium">
                          {companyData.invoice_settings.default_invoice_type_instant || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cash Discount Based on Gross</p>
                        <Badge
                          variant={companyData.invoice_settings.cash_discount_based_on_gross ? "default" : "secondary"}
                        >
                          {companyData.invoice_settings.cash_discount_based_on_gross ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Supplier Invoice Auth by Separate Function</p>
                        <Badge
                          variant={
                            companyData.invoice_settings.supp_inv_auth_by_separate_function ? "default" : "secondary"
                          }
                        >
                          {companyData.invoice_settings.supp_inv_auth_by_separate_function ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Invoice Tax */}
                {companyData.invoice_tax && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Invoice Tax</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tax Regime</p>
                        <p className="font-medium">{companyData.invoice_tax.tax_regime || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Method</p>
                        <p className="font-medium">{companyData.invoice_tax.amount_method || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax ID Type</p>
                        <p className="font-medium">{companyData.invoice_tax.tax_id_type || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax ID Number</p>
                        <p className="font-medium">{companyData.invoice_tax.tax_id_number || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax Rounding Level</p>
                        <p className="font-medium">{companyData.invoice_tax.tax_rounding_level || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Post Preliminary Tax Withholding</p>
                        <Badge variant={companyData.invoice_tax.post_prelim_tax_withholding ? "default" : "secondary"}>
                          {companyData.invoice_tax.post_prelim_tax_withholding ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* PO Matching */}
                {companyData.po_matching && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">PO Matching</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">PO Match Tolerance %</p>
                        <p className="font-medium">{companyData.po_matching.po_match_tol_percent || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">PO Match Tolerance Amount</p>
                        <p className="font-medium">{companyData.po_matching.po_match_tol_amount || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">PO Match Tolerance Currency</p>
                        <p className="font-medium">{companyData.po_matching.po_match_tol_currency || "N/A"}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Payment Settings Tab */}
              <TabsContent value="payment" className="space-y-4 mt-0">
                {companyData.payment_settings && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                        Payment Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Include Supplier Negative Balance</p>
                        <Badge
                          variant={companyData.payment_settings.include_supplier_neg_bal ? "default" : "secondary"}
                        >
                          {companyData.payment_settings.include_supplier_neg_bal ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Include Credit Invoices</p>
                        <Badge variant={companyData.payment_settings.include_credit_invoices ? "default" : "secondary"}>
                          {companyData.payment_settings.include_credit_invoices ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percent Tolerance</p>
                        <p className="font-medium">{companyData.payment_settings.percent_tolerance || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Tolerance</p>
                        <p className="font-medium">{companyData.payment_settings.amount_tolerance || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tolerance Currency</p>
                        <p className="font-medium">{companyData.payment_settings.tolerance_currency || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Posting Method</p>
                        <p className="font-medium">{companyData.payment_settings.payment_posting_method || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Create Payment Matching Transaction</p>
                        <Badge
                          variant={companyData.payment_settings.create_payment_matching_txn ? "default" : "secondary"}
                        >
                          {companyData.payment_settings.create_payment_matching_txn ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Distribution Tab */}
              <TabsContent value="distribution" className="space-y-4 mt-0">
                {companyData.distribution && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Package className="h-4 w-4 mr-2 text-blue-600" />
                        Distribution Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Base for Advance Invoice</p>
                        <p className="font-medium">{companyData.distribution.base_for_adv_invoice || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ownership Transfer Point</p>
                        <p className="font-medium">{companyData.distribution.ownership_transfer_point || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax Code</p>
                        <p className="font-medium">{companyData.distribution.tax_code || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax Free Code</p>
                        <p className="font-medium">{companyData.distribution.tax_free_code || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Post Price Diff at Arrival</p>
                        <Badge variant={companyData.distribution.post_price_diff_at_arrival ? "default" : "secondary"}>
                          {companyData.distribution.post_price_diff_at_arrival ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delay COGS to Delivery Confirm</p>
                        <Badge
                          variant={companyData.distribution.delay_cogs_to_delivery_confirm ? "default" : "secondary"}
                        >
                          {companyData.distribution.delay_cogs_to_delivery_confirm ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Use Transit Balancing</p>
                        <Badge variant={companyData.distribution.use_transit_balancing ? "default" : "secondary"}>
                          {companyData.distribution.use_transit_balancing ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Create Receipt Postings Non-Inventory</p>
                        <Badge
                          variant={companyData.distribution.create_receipt_postings_non_inv ? "default" : "secondary"}
                        >
                          {companyData.distribution.create_receipt_postings_non_inv ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxable in Customer Order</p>
                        <Badge variant={companyData.distribution.taxable_in_customer_order ? "default" : "secondary"}>
                          {companyData.distribution.taxable_in_customer_order ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxable in Purchasing</p>
                        <Badge variant={companyData.distribution.taxable_in_purchasing ? "default" : "secondary"}>
                          {companyData.distribution.taxable_in_purchasing ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Failed to load company details</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
