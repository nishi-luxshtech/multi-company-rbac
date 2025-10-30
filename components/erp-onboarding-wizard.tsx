"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  DollarSign,
  FileText,
  CreditCard,
  Package,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import {
  companyAPI,
  addressAPI,
  communicationAPI,
  employeeAPI,
  type Company,
  type Address,
  type CommunicationMethod,
  type Employee,
} from "@/lib/api-services"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ERPOnboardingWizardProps {
  companyId?: number
  onComplete: () => void
  onCancel: () => void
}

const STEPS = [
  { id: 1, title: "General Info", icon: Building2, description: "Company details" },
  { id: 2, title: "Addresses", icon: MapPin, description: "Business locations" },
  { id: 3, title: "Communications", icon: Phone, description: "Contact methods" },
  { id: 4, title: "Message Setup", icon: Mail, description: "Message configuration" },
  { id: 5, title: "Employees", icon: Users, description: "Staff members" },
  { id: 6, title: "Accounting", icon: DollarSign, description: "Financial rules" },
  { id: 7, title: "Invoicing", icon: FileText, description: "Invoice settings" },
  { id: 8, title: "Payments", icon: CreditCard, description: "Payment configuration" },
  { id: 9, title: "Distribution", icon: Package, description: "Distribution setup" },
]

export function ERPOnboardingWizard({ companyId, onComplete, onCancel }: ERPOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [createdCompanyId, setCreatedCompanyId] = useState<number | undefined>(companyId)

  // Step 1: General Information
  const [generalInfo, setGeneralInfo] = useState({
    company_name: "",
    company_code: "",
    association_number: "",
    created_by: "",
    default_language: "EN",
    country: "",
    form_of_business: "",
    creation_date: new Date().toISOString().split("T")[0],
    authorization_id: "",
    auth_id_expire_date: "",
    source_company: "",
    source_template_id: "",
    template_company: false,
    identifier_reference: "",
    identifier_ref_validation: "",
  })

  // Step 2: Addresses
  const [addresses, setAddresses] = useState<Partial<Address>[]>([])

  // Step 3: Communication Methods
  const [communications, setCommunications] = useState<Partial<CommunicationMethod>[]>([])

  // Step 4: Message Setup
  const [messageSetup, setMessageSetup] = useState({
    message_code: "",
    media_code: "",
    method_definition: "",
    active_flag: true,
  })

  // Step 5: Employees
  const [employees, setEmployees] = useState<Partial<Employee>[]>([])

  // Step 6: Accounting Rules & 6b: Currency Rate Types
  const [accountingRules, setAccountingRules] = useState({
    accounting_currency: "",
    parallel_currency: "",
    valid_from: new Date().toISOString().split("T")[0],
    cancel_rollback_method: "",
    default_amount_method: "",
    tax_rounding_method: "",
    max_overwrite_tax_percent: 0,
    default_tax_city: "",
    use_voucher_series: false,
    // Step 6b: Currency Rate Types
    rate_type_buy: "",
    rate_type_sell: "",
    allow_tax_rate_override: false,
    tax_buy_rate_type: "",
    tax_sell_rate_type: "",
  })

  // Step 7: Invoice Settings, 7b: Invoice Tax, 7c: PO Matching
  const [invoiceSettings, setInvoiceSettings] = useState({
    default_invoice_type_instant: "",
    supp_inv_auth_by_separate_function: false,
    cash_discount_based_on_gross: false,
    // Step 7b: Invoice Tax
    tax_regime: "",
    amount_method: "",
    tax_id_type: "",
    tax_id_number: "",
    tax_rounding_level: "",
    post_prelim_tax_withholding: false,
    // Step 7c: PO Matching
    po_match_tol_percent: 0,
    po_match_tol_amount: 0,
    po_match_tol_currency: "",
  })

  // Step 8: Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    include_supplier_neg_bal: false,
    include_credit_invoices: false,
    percent_tolerance: 0,
    amount_tolerance: 0,
    tolerance_currency: "",
    payment_posting_method: "",
    create_payment_matching_txn: false,
  })

  // Step 9: Distribution
  const [distribution, setDistribution] = useState({
    base_for_adv_invoice: "",
    ownership_transfer_point: "",
    tax_code: "",
    tax_free_code: "",
    post_price_diff_at_arrival: false,
    delay_cogs_to_delivery_confirm: false,
    use_transit_balancing: false,
    create_receipt_postings_non_inv: false,
    taxable_in_customer_order: false,
    taxable_in_purchasing: false,
  })

  useEffect(() => {
    if (companyId) {
      loadCompany()
    }
  }, [companyId])

  const loadCompany = async () => {
    if (!companyId) return

    setLoading(true)
    try {
      const company = await companyAPI.getById(companyId)

      // Load general info
      setGeneralInfo({
        company_name: company.company_name || "",
        company_code: company.company_code || "",
        association_number: company.association_number || "",
        created_by: company.created_by || "",
        default_language: company.default_language || "EN",
        country: company.country || "",
        form_of_business: company.form_of_business || "",
        creation_date: company.creation_date || new Date().toISOString().split("T")[0],
        authorization_id: company.authorization_id || "",
        auth_id_expire_date: company.auth_id_expire_date || "",
        source_company: company.source_company || "",
        source_template_id: company.source_template_id || "",
        template_company: company.template_company || false,
        identifier_reference: company.identifier_reference || "",
        identifier_ref_validation: company.identifier_ref_validation || "",
      })

      // Load other steps
      setMessageSetup({
        message_code: company.message_code || "",
        media_code: company.media_code || "",
        method_definition: company.method_definition || "",
        active_flag: company.active_flag ?? true,
      })

      setAccountingRules({
        accounting_currency: company.accounting_currency || "",
        parallel_currency: company.parallel_currency || "",
        valid_from: company.valid_from || new Date().toISOString().split("T")[0],
        cancel_rollback_method: company.cancel_rollback_method || "",
        default_amount_method: company.default_amount_method || "",
        tax_rounding_method: company.tax_rounding_method || "",
        max_overwrite_tax_percent: company.max_overwrite_tax_percent || 0,
        default_tax_city: company.default_tax_city || "",
        use_voucher_series: company.use_voucher_series || false,
        rate_type_buy: company.rate_type_buy || "",
        rate_type_sell: company.rate_type_sell || "",
        allow_tax_rate_override: company.allow_tax_rate_override || false,
        tax_buy_rate_type: company.tax_buy_rate_type || "",
        tax_sell_rate_type: company.tax_sell_rate_type || "",
      })

      setInvoiceSettings({
        default_invoice_type_instant: company.default_invoice_type_instant || "",
        supp_inv_auth_by_separate_function: company.supp_inv_auth_by_separate_function || false,
        cash_discount_based_on_gross: company.cash_discount_based_on_gross || false,
        tax_regime: company.tax_regime || "",
        amount_method: company.amount_method || "",
        tax_id_type: company.tax_id_type || "",
        tax_id_number: company.tax_id_number || "",
        tax_rounding_level: company.tax_rounding_level || "",
        post_prelim_tax_withholding: company.post_prelim_tax_withholding || false,
        po_match_tol_percent: company.po_match_tol_percent || 0,
        po_match_tol_amount: company.po_match_tol_amount || 0,
        po_match_tol_currency: company.po_match_tol_currency || "",
      })

      setPaymentSettings({
        include_supplier_neg_bal: company.include_supplier_neg_bal || false,
        include_credit_invoices: company.include_credit_invoices || false,
        percent_tolerance: company.percent_tolerance || 0,
        amount_tolerance: company.amount_tolerance || 0,
        tolerance_currency: company.tolerance_currency || "",
        payment_posting_method: company.payment_posting_method || "",
        create_payment_matching_txn: company.create_payment_matching_txn || false,
      })

      setDistribution({
        base_for_adv_invoice: company.base_for_adv_invoice || "",
        ownership_transfer_point: company.ownership_transfer_point || "",
        tax_code: company.tax_code || "",
        tax_free_code: company.tax_free_code || "",
        post_price_diff_at_arrival: company.post_price_diff_at_arrival || false,
        delay_cogs_to_delivery_confirm: company.delay_cogs_to_delivery_confirm || false,
        use_transit_balancing: company.use_transit_balancing || false,
        create_receipt_postings_non_inv: company.create_receipt_postings_non_inv || false,
        taxable_in_customer_order: company.taxable_in_customer_order || false,
        taxable_in_purchasing: company.taxable_in_purchasing || false,
      })

      // Load related data
      try {
        const [addressData, commData, empData] = await Promise.all([
          addressAPI.getByCompany(companyId),
          communicationAPI.getByCompany(companyId),
          employeeAPI.getByCompany(companyId),
        ])
        setAddresses(addressData)
        setCommunications(commData)
        setEmployees(empData)
      } catch (err) {
        console.log("Could not load related data:", err)
      }

      setCurrentStep(company.onboarding_step || 1)
    } catch (error) {
      console.error("Failed to load company:", error)
      setError("Failed to load company data")
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async (nextStep?: number) => {
    setSaving(true)
    setError("")

    try {
      const payload: Partial<Company> = {
        ...generalInfo,
        ...messageSetup,
        ...accountingRules,
        ...invoiceSettings,
        ...paymentSettings,
        ...distribution,
        onboarding_step: nextStep || currentStep,
        is_complete: nextStep === 10,
      }

      let companyId = createdCompanyId

      if (companyId) {
        await companyAPI.update(companyId, payload)
      } else {
        const newCompany = await companyAPI.create(payload)
        companyId = newCompany.id
        setCreatedCompanyId(companyId)
      }

      // Save related data if company exists
      if (companyId) {
        // Save addresses
        for (const addr of addresses) {
          if (addr.id) {
            await addressAPI.update(addr.id, addr)
          } else if (addr.address_line_1) {
            await addressAPI.create({ ...addr, company_id: companyId } as Address)
          }
        }

        // Save communications
        for (const comm of communications) {
          if (comm.id) {
            await communicationAPI.update(comm.id, comm)
          } else if (comm.value) {
            await communicationAPI.create({ ...comm, company_id: companyId } as CommunicationMethod)
          }
        }

        // Save employees
        for (const emp of employees) {
          if (emp.id) {
            await employeeAPI.update(emp.id, emp)
          } else if (emp.employee_id) {
            await employeeAPI.create({ ...emp, company_id: companyId } as Employee)
          }
        }
      }

      if (nextStep === 10) {
        onComplete()
      } else if (nextStep) {
        setCurrentStep(nextStep)
      }
    } catch (error: any) {
      console.error("Failed to save progress:", error)
      setError(error.response?.data?.detail || "Failed to save progress. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    const validation = validateStep(currentStep)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    await saveProgress(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError("")
    }
  }

  const handleSubmit = async () => {
    await saveProgress(10)
  }

  const validateStep = (step: number): { valid: boolean; message: string } => {
    switch (step) {
      case 1:
        if (!generalInfo.company_name.trim()) return { valid: false, message: "Company name is required" }
        break
      case 2:
        if (addresses.length === 0) return { valid: false, message: "At least one address is required" }
        if (addresses.some((a) => !a.address_line_1))
          return { valid: false, message: "Address line 1 is required for all addresses" }
        break
      case 3:
        if (communications.length === 0)
          return { valid: false, message: "At least one communication method is required" }
        if (communications.some((c) => !c.value))
          return { valid: false, message: "Value is required for all communication methods" }
        break
      case 4:
        if (!messageSetup.message_code) return { valid: false, message: "Message code is required" }
        if (!messageSetup.media_code) return { valid: false, message: "Media code is required" }
        break
      case 5:
        if (employees.length === 0) return { valid: false, message: "At least one employee is required" }
        if (employees.some((e) => !e.employee_id))
          return { valid: false, message: "Employee ID is required for all employees" }
        break
      case 6:
        if (!accountingRules.accounting_currency) return { valid: false, message: "Accounting currency is required" }
        if (accountingRules.accounting_currency.length !== 3)
          return { valid: false, message: "Currency must be 3 characters" }
        break
      case 8:
        if (paymentSettings.tolerance_currency && paymentSettings.tolerance_currency.length !== 3) {
          return { valid: false, message: "Tolerance currency must be 3 characters" }
        }
        break
    }
    return { valid: true, message: "" }
  }

  const renderStepContent = () => {
    const StepIcon = STEPS[currentStep - 1].icon

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Company General Information</h3>
                <p className="text-sm text-muted-foreground">Basic company identification and details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={generalInfo.company_name}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_code">Company Code</Label>
                <Input
                  id="company_code"
                  value={generalInfo.company_code}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, company_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., COMP001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="association_number">Association Number</Label>
                <Input
                  id="association_number"
                  value={generalInfo.association_number}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, association_number: e.target.value })}
                  placeholder="Enter association number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="created_by">Created By</Label>
                <Input
                  id="created_by"
                  value={generalInfo.created_by}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, created_by: e.target.value })}
                  placeholder="Creator name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_language">Default Language</Label>
                <Select
                  value={generalInfo.default_language}
                  onValueChange={(v) => setGeneralInfo({ ...generalInfo, default_language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="ES">Spanish</SelectItem>
                    <SelectItem value="FR">French</SelectItem>
                    <SelectItem value="DE">German</SelectItem>
                    <SelectItem value="IT">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={generalInfo.country}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, country: e.target.value.toUpperCase() })}
                  placeholder="e.g., US, GB, DE"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form_of_business">Form of Business</Label>
                <Input
                  id="form_of_business"
                  value={generalInfo.form_of_business}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, form_of_business: e.target.value })}
                  placeholder="e.g., LLC, Corporation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creation_date">Creation Date</Label>
                <Input
                  id="creation_date"
                  type="date"
                  value={generalInfo.creation_date}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, creation_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorization_id">Authorization ID</Label>
                <Input
                  id="authorization_id"
                  value={generalInfo.authorization_id}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, authorization_id: e.target.value })}
                  placeholder="Authorization ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth_id_expire_date">Auth ID Expire Date</Label>
                <Input
                  id="auth_id_expire_date"
                  type="date"
                  value={generalInfo.auth_id_expire_date}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, auth_id_expire_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_company">Source Company</Label>
                <Input
                  id="source_company"
                  value={generalInfo.source_company}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, source_company: e.target.value })}
                  placeholder="Source company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_template_id">Source Template ID</Label>
                <Input
                  id="source_template_id"
                  value={generalInfo.source_template_id}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, source_template_id: e.target.value })}
                  placeholder="Template ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier_reference">Identifier Reference</Label>
                <Input
                  id="identifier_reference"
                  value={generalInfo.identifier_reference}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, identifier_reference: e.target.value })}
                  placeholder="Identifier reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier_ref_validation">Identifier Ref Validation</Label>
                <Input
                  id="identifier_ref_validation"
                  value={generalInfo.identifier_ref_validation}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, identifier_ref_validation: e.target.value })}
                  placeholder="Validation rule"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="template_company"
                checked={generalInfo.template_company}
                onCheckedChange={(checked) => setGeneralInfo({ ...generalInfo, template_company: checked as boolean })}
              />
              <Label htmlFor="template_company" className="cursor-pointer">
                Template Company
              </Label>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Addresses</h3>
                  <p className="text-sm text-muted-foreground">Add business addresses</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAddresses([
                    ...addresses,
                    { address_line_1: "", address_type: "DELIVERY", company_id: createdCompanyId || 0 },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </div>

            <div className="space-y-4">
              {addresses.map((addr, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Address {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAddresses(addresses.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Address Identity</Label>
                        <Input
                          value={addr.address_identity || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], address_identity: e.target.value }
                            setAddresses(newAddrs)
                          }}
                          placeholder="Address identifier"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Address Type *</Label>
                        <Select
                          value={addr.address_type}
                          onValueChange={(v) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], address_type: v as any }
                            setAddresses(newAddrs)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DELIVERY">Delivery</SelectItem>
                            <SelectItem value="DOCUMENT">Document</SelectItem>
                            <SelectItem value="PAY">Payment</SelectItem>
                            <SelectItem value="VISIT">Visit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Address Line 1 *</Label>
                        <Input
                          value={addr.address_line_1 || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], address_line_1: e.target.value }
                            setAddresses(newAddrs)
                          }}
                          placeholder="Street address"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Address Line 2</Label>
                        <Input
                          value={addr.address_line_2 || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], address_line_2: e.target.value }
                            setAddresses(newAddrs)
                          }}
                          placeholder="Apartment, suite, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={addr.city || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], city: e.target.value }
                            setAddresses(newAddrs)
                          }}
                          placeholder="City"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>County</Label>
                        <Input
                          value={addr.county || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], county: e.target.value }
                            setAddresses(newAddrs)
                          }}
                          placeholder="County/State"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Zip Code</Label>
                        <Input
                          value={addr.zip_code || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], zip_code: e.target.value }
                            setAddresses(newAddrs)
                          }}
                          placeholder="Postal code"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={addr.country || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], country: e.target.value.toUpperCase() }
                            setAddresses(newAddrs)
                          }}
                          placeholder="Country code"
                          maxLength={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valid From</Label>
                        <Input
                          type="date"
                          value={addr.valid_from || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], valid_from: e.target.value }
                            setAddresses(newAddrs)
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valid To</Label>
                        <Input
                          type="date"
                          value={addr.valid_to || ""}
                          onChange={(e) => {
                            const newAddrs = [...addresses]
                            newAddrs[index] = { ...newAddrs[index], valid_to: e.target.value }
                            setAddresses(newAddrs)
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={addr.is_default || false}
                        onCheckedChange={(checked) => {
                          const newAddrs = [...addresses]
                          newAddrs[index] = { ...newAddrs[index], is_default: checked as boolean }
                          setAddresses(newAddrs)
                        }}
                      />
                      <Label className="cursor-pointer">Set as default for this type</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {addresses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No addresses added yet. Click "Add Address" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Communication Methods</h3>
                  <p className="text-sm text-muted-foreground">Add contact methods</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCommunications([
                    ...communications,
                    { communication_method: "EMAIL", value: "", company_id: createdCompanyId || 0 },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Communication
              </Button>
            </div>

            <div className="space-y-4">
              {communications.map((comm, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Communication {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCommunications(communications.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Communication Name</Label>
                        <Input
                          value={comm.communication_name || ""}
                          onChange={(e) => {
                            const newComms = [...communications]
                            newComms[index] = { ...newComms[index], communication_name: e.target.value }
                            setCommunications(newComms)
                          }}
                          placeholder="e.g., Main Office"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Method *</Label>
                        <Select
                          value={comm.communication_method}
                          onValueChange={(v) => {
                            const newComms = [...communications]
                            newComms[index] = { ...newComms[index], communication_method: v as any }
                            setCommunications(newComms)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMAIL">Email</SelectItem>
                            <SelectItem value="PHONE">Phone</SelectItem>
                            <SelectItem value="FAX">Fax</SelectItem>
                            <SelectItem value="EDI">EDI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Value *</Label>
                        <Input
                          value={comm.value || ""}
                          onChange={(e) => {
                            const newComms = [...communications]
                            newComms[index] = { ...newComms[index], value: e.target.value }
                            setCommunications(newComms)
                          }}
                          placeholder={comm.communication_method === "EMAIL" ? "email@example.com" : "+1 234 567 8900"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valid From</Label>
                        <Input
                          type="date"
                          value={comm.valid_from || ""}
                          onChange={(e) => {
                            const newComms = [...communications]
                            newComms[index] = { ...newComms[index], valid_from: e.target.value }
                            setCommunications(newComms)
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valid To</Label>
                        <Input
                          type="date"
                          value={comm.valid_to || ""}
                          onChange={(e) => {
                            const newComms = [...communications]
                            newComms[index] = { ...newComms[index], valid_to: e.target.value }
                            setCommunications(newComms)
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={comm.is_primary || false}
                        onCheckedChange={(checked) => {
                          const newComms = [...communications]
                          newComms[index] = { ...newComms[index], is_primary: checked as boolean }
                          setCommunications(newComms)
                        }}
                      />
                      <Label className="cursor-pointer">Set as primary</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {communications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No communication methods added yet. Click "Add Communication" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Message Setup</h3>
                <p className="text-sm text-muted-foreground">Configure message settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="message_code">Message Code *</Label>
                <Input
                  id="message_code"
                  value={messageSetup.message_code}
                  onChange={(e) => setMessageSetup({ ...messageSetup, message_code: e.target.value })}
                  placeholder="Enter message code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media_code">Media Code *</Label>
                <Input
                  id="media_code"
                  value={messageSetup.media_code}
                  onChange={(e) => setMessageSetup({ ...messageSetup, media_code: e.target.value })}
                  placeholder="Enter media code"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="method_definition">Method Definition</Label>
                <Textarea
                  id="method_definition"
                  value={messageSetup.method_definition}
                  onChange={(e) => setMessageSetup({ ...messageSetup, method_definition: e.target.value })}
                  placeholder="Define the method"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active_flag"
                checked={messageSetup.active_flag}
                onCheckedChange={(checked) => setMessageSetup({ ...messageSetup, active_flag: checked as boolean })}
              />
              <Label htmlFor="active_flag" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Employees</h3>
                  <p className="text-sm text-muted-foreground">Add company employees</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setEmployees([...employees, { employee_id: "", company_id: createdCompanyId || 0, is_active: true }])
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>

            <div className="space-y-4">
              {employees.map((emp, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Employee {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEmployees(employees.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Employee ID *</Label>
                        <Input
                          value={emp.employee_id || ""}
                          onChange={(e) => {
                            const newEmps = [...employees]
                            newEmps[index] = { ...newEmps[index], employee_id: e.target.value }
                            setEmployees(newEmps)
                          }}
                          placeholder="EMP001"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Person ID</Label>
                        <Input
                          value={emp.person_id || ""}
                          onChange={(e) => {
                            const newEmps = [...employees]
                            newEmps[index] = { ...newEmps[index], person_id: e.target.value }
                            setEmployees(newEmps)
                          }}
                          placeholder="Person identifier"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={emp.name || ""}
                          onChange={(e) => {
                            const newEmps = [...employees]
                            newEmps[index] = { ...newEmps[index], name: e.target.value }
                            setEmployees(newEmps)
                          }}
                          placeholder="Employee name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={emp.role || ""}
                          onChange={(e) => {
                            const newEmps = [...employees]
                            newEmps[index] = { ...newEmps[index], role: e.target.value }
                            setEmployees(newEmps)
                          }}
                          placeholder="Job role"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expire Date</Label>
                        <Input
                          type="date"
                          value={emp.expire_date || ""}
                          onChange={(e) => {
                            const newEmps = [...employees]
                            newEmps[index] = { ...newEmps[index], expire_date: e.target.value }
                            setEmployees(newEmps)
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={emp.is_active ?? true}
                        onCheckedChange={(checked) => {
                          const newEmps = [...employees]
                          newEmps[index] = { ...newEmps[index], is_active: checked as boolean }
                          setEmployees(newEmps)
                        }}
                      />
                      <Label className="cursor-pointer">Active</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {employees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No employees added yet. Click "Add Employee" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Accounting Rules & Currency Rate Types</h3>
                <p className="text-sm text-muted-foreground">Configure accounting and currency settings</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Accounting Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accounting_currency">Accounting Currency * (3 chars)</Label>
                    <Input
                      id="accounting_currency"
                      value={accountingRules.accounting_currency}
                      onChange={(e) =>
                        setAccountingRules({ ...accountingRules, accounting_currency: e.target.value.toUpperCase() })
                      }
                      placeholder="USD"
                      maxLength={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parallel_currency">Parallel Currency (3 chars)</Label>
                    <Input
                      id="parallel_currency"
                      value={accountingRules.parallel_currency}
                      onChange={(e) =>
                        setAccountingRules({ ...accountingRules, parallel_currency: e.target.value.toUpperCase() })
                      }
                      placeholder="EUR"
                      maxLength={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valid_from">Valid From</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={accountingRules.valid_from}
                      onChange={(e) => setAccountingRules({ ...accountingRules, valid_from: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancel_rollback_method">Cancel Rollback Method</Label>
                    <Input
                      id="cancel_rollback_method"
                      value={accountingRules.cancel_rollback_method}
                      onChange={(e) =>
                        setAccountingRules({ ...accountingRules, cancel_rollback_method: e.target.value })
                      }
                      placeholder="Rollback method"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_amount_method">Default Amount Method</Label>
                    <Input
                      id="default_amount_method"
                      value={accountingRules.default_amount_method}
                      onChange={(e) =>
                        setAccountingRules({ ...accountingRules, default_amount_method: e.target.value })
                      }
                      placeholder="Amount method"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_rounding_method">Tax Rounding Method</Label>
                    <Input
                      id="tax_rounding_method"
                      value={accountingRules.tax_rounding_method}
                      onChange={(e) => setAccountingRules({ ...accountingRules, tax_rounding_method: e.target.value })}
                      placeholder="Rounding method"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_overwrite_tax_percent">Max Overwrite Tax Percent</Label>
                    <Input
                      id="max_overwrite_tax_percent"
                      type="number"
                      value={accountingRules.max_overwrite_tax_percent}
                      onChange={(e) =>
                        setAccountingRules({
                          ...accountingRules,
                          max_overwrite_tax_percent: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_tax_city">Default Tax City</Label>
                    <Input
                      id="default_tax_city"
                      value={accountingRules.default_tax_city}
                      onChange={(e) => setAccountingRules({ ...accountingRules, default_tax_city: e.target.value })}
                      placeholder="City name"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="use_voucher_series"
                    checked={accountingRules.use_voucher_series}
                    onCheckedChange={(checked) =>
                      setAccountingRules({ ...accountingRules, use_voucher_series: checked as boolean })
                    }
                  />
                  <Label htmlFor="use_voucher_series" className="cursor-pointer">
                    Use Voucher Series
                  </Label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Currency Rate Types (Step 6b)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate_type_buy">Rate Type Buy</Label>
                    <Input
                      id="rate_type_buy"
                      value={accountingRules.rate_type_buy}
                      onChange={(e) => setAccountingRules({ ...accountingRules, rate_type_buy: e.target.value })}
                      placeholder="Buy rate type"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate_type_sell">Rate Type Sell</Label>
                    <Input
                      id="rate_type_sell"
                      value={accountingRules.rate_type_sell}
                      onChange={(e) => setAccountingRules({ ...accountingRules, rate_type_sell: e.target.value })}
                      placeholder="Sell rate type"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_buy_rate_type">Tax Buy Rate Type</Label>
                    <Input
                      id="tax_buy_rate_type"
                      value={accountingRules.tax_buy_rate_type}
                      onChange={(e) => setAccountingRules({ ...accountingRules, tax_buy_rate_type: e.target.value })}
                      placeholder="Tax buy rate"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_sell_rate_type">Tax Sell Rate Type</Label>
                    <Input
                      id="tax_sell_rate_type"
                      value={accountingRules.tax_sell_rate_type}
                      onChange={(e) => setAccountingRules({ ...accountingRules, tax_sell_rate_type: e.target.value })}
                      placeholder="Tax sell rate"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="allow_tax_rate_override"
                    checked={accountingRules.allow_tax_rate_override}
                    onCheckedChange={(checked) =>
                      setAccountingRules({ ...accountingRules, allow_tax_rate_override: checked as boolean })
                    }
                  />
                  <Label htmlFor="allow_tax_rate_override" className="cursor-pointer">
                    Allow Tax Rate Override
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Invoice Settings, Tax & PO Matching</h3>
                <p className="text-sm text-muted-foreground">Configure invoice and tax settings</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Invoice Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_invoice_type_instant">Default Invoice Type Instant</Label>
                    <Input
                      id="default_invoice_type_instant"
                      value={invoiceSettings.default_invoice_type_instant}
                      onChange={(e) =>
                        setInvoiceSettings({ ...invoiceSettings, default_invoice_type_instant: e.target.value })
                      }
                      placeholder="Invoice type"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="supp_inv_auth"
                      checked={invoiceSettings.supp_inv_auth_by_separate_function}
                      onCheckedChange={(checked) =>
                        setInvoiceSettings({
                          ...invoiceSettings,
                          supp_inv_auth_by_separate_function: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="supp_inv_auth" className="cursor-pointer">
                      Supplier Invoice Auth By Separate Function
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cash_discount"
                      checked={invoiceSettings.cash_discount_based_on_gross}
                      onCheckedChange={(checked) =>
                        setInvoiceSettings({ ...invoiceSettings, cash_discount_based_on_gross: checked as boolean })
                      }
                    />
                    <Label htmlFor="cash_discount" className="cursor-pointer">
                      Cash Discount Based On Gross
                    </Label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Invoice Tax (Step 7b)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_regime">Tax Regime</Label>
                    <Input
                      id="tax_regime"
                      value={invoiceSettings.tax_regime}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, tax_regime: e.target.value })}
                      placeholder="Tax regime"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount_method">Amount Method</Label>
                    <Input
                      id="amount_method"
                      value={invoiceSettings.amount_method}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, amount_method: e.target.value })}
                      placeholder="Amount method"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id_type">Tax ID Type</Label>
                    <Input
                      id="tax_id_type"
                      value={invoiceSettings.tax_id_type}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, tax_id_type: e.target.value })}
                      placeholder="Tax ID type"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id_number">Tax ID Number</Label>
                    <Input
                      id="tax_id_number"
                      value={invoiceSettings.tax_id_number}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, tax_id_number: e.target.value })}
                      placeholder="Tax ID number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_rounding_level">Tax Rounding Level</Label>
                    <Input
                      id="tax_rounding_level"
                      value={invoiceSettings.tax_rounding_level}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, tax_rounding_level: e.target.value })}
                      placeholder="Rounding level"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="post_prelim_tax"
                    checked={invoiceSettings.post_prelim_tax_withholding}
                    onCheckedChange={(checked) =>
                      setInvoiceSettings({ ...invoiceSettings, post_prelim_tax_withholding: checked as boolean })
                    }
                  />
                  <Label htmlFor="post_prelim_tax" className="cursor-pointer">
                    Post Preliminary Tax Withholding
                  </Label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">PO Matching (Step 7c)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="po_match_tol_percent">PO Match Tolerance Percent</Label>
                    <Input
                      id="po_match_tol_percent"
                      type="number"
                      value={invoiceSettings.po_match_tol_percent}
                      onChange={(e) =>
                        setInvoiceSettings({
                          ...invoiceSettings,
                          po_match_tol_percent: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="po_match_tol_amount">PO Match Tolerance Amount</Label>
                    <Input
                      id="po_match_tol_amount"
                      type="number"
                      value={invoiceSettings.po_match_tol_amount}
                      onChange={(e) =>
                        setInvoiceSettings({
                          ...invoiceSettings,
                          po_match_tol_amount: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="po_match_tol_currency">PO Match Tolerance Currency (3 chars)</Label>
                    <Input
                      id="po_match_tol_currency"
                      value={invoiceSettings.po_match_tol_currency}
                      onChange={(e) =>
                        setInvoiceSettings({ ...invoiceSettings, po_match_tol_currency: e.target.value.toUpperCase() })
                      }
                      placeholder="USD"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Payment Settings</h3>
                <p className="text-sm text-muted-foreground">Configure payment processing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percent_tolerance">Percent Tolerance</Label>
                <Input
                  id="percent_tolerance"
                  type="number"
                  value={paymentSettings.percent_tolerance}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      percent_tolerance: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount_tolerance">Amount Tolerance</Label>
                <Input
                  id="amount_tolerance"
                  type="number"
                  value={paymentSettings.amount_tolerance}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, amount_tolerance: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tolerance_currency">Tolerance Currency (3 chars)</Label>
                <Input
                  id="tolerance_currency"
                  value={paymentSettings.tolerance_currency}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, tolerance_currency: e.target.value.toUpperCase() })
                  }
                  placeholder="USD"
                  maxLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_posting_method">Payment Posting Method</Label>
                <Input
                  id="payment_posting_method"
                  value={paymentSettings.payment_posting_method}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, payment_posting_method: e.target.value })}
                  placeholder="Posting method"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_supplier_neg_bal"
                  checked={paymentSettings.include_supplier_neg_bal}
                  onCheckedChange={(checked) =>
                    setPaymentSettings({ ...paymentSettings, include_supplier_neg_bal: checked as boolean })
                  }
                />
                <Label htmlFor="include_supplier_neg_bal" className="cursor-pointer">
                  Include Supplier Negative Balance
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_credit_invoices"
                  checked={paymentSettings.include_credit_invoices}
                  onCheckedChange={(checked) =>
                    setPaymentSettings({ ...paymentSettings, include_credit_invoices: checked as boolean })
                  }
                />
                <Label htmlFor="include_credit_invoices" className="cursor-pointer">
                  Include Credit Invoices
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_payment_matching_txn"
                  checked={paymentSettings.create_payment_matching_txn}
                  onCheckedChange={(checked) =>
                    setPaymentSettings({ ...paymentSettings, create_payment_matching_txn: checked as boolean })
                  }
                />
                <Label htmlFor="create_payment_matching_txn" className="cursor-pointer">
                  Create Payment Matching Transaction
                </Label>
              </div>
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <StepIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Distribution</h3>
                <p className="text-sm text-muted-foreground">Configure distribution settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_for_adv_invoice">Base For Advance Invoice</Label>
                <Input
                  id="base_for_adv_invoice"
                  value={distribution.base_for_adv_invoice}
                  onChange={(e) => setDistribution({ ...distribution, base_for_adv_invoice: e.target.value })}
                  placeholder="Base for advance invoice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownership_transfer_point">Ownership Transfer Point</Label>
                <Input
                  id="ownership_transfer_point"
                  value={distribution.ownership_transfer_point}
                  onChange={(e) => setDistribution({ ...distribution, ownership_transfer_point: e.target.value })}
                  placeholder="Transfer point"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_code">Tax Code</Label>
                <Input
                  id="tax_code"
                  value={distribution.tax_code}
                  onChange={(e) => setDistribution({ ...distribution, tax_code: e.target.value })}
                  placeholder="Tax code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_free_code">Tax Free Code</Label>
                <Input
                  id="tax_free_code"
                  value={distribution.tax_free_code}
                  onChange={(e) => setDistribution({ ...distribution, tax_free_code: e.target.value })}
                  placeholder="Tax free code"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post_price_diff"
                  checked={distribution.post_price_diff_at_arrival}
                  onCheckedChange={(checked) =>
                    setDistribution({ ...distribution, post_price_diff_at_arrival: checked as boolean })
                  }
                />
                <Label htmlFor="post_price_diff" className="cursor-pointer">
                  Post Price Difference At Arrival
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delay_cogs"
                  checked={distribution.delay_cogs_to_delivery_confirm}
                  onCheckedChange={(checked) =>
                    setDistribution({ ...distribution, delay_cogs_to_delivery_confirm: checked as boolean })
                  }
                />
                <Label htmlFor="delay_cogs" className="cursor-pointer">
                  Delay COGS To Delivery Confirmation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use_transit_balancing"
                  checked={distribution.use_transit_balancing}
                  onCheckedChange={(checked) =>
                    setDistribution({ ...distribution, use_transit_balancing: checked as boolean })
                  }
                />
                <Label htmlFor="use_transit_balancing" className="cursor-pointer">
                  Use Transit Balancing
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_receipt_postings"
                  checked={distribution.create_receipt_postings_non_inv}
                  onCheckedChange={(checked) =>
                    setDistribution({ ...distribution, create_receipt_postings_non_inv: checked as boolean })
                  }
                />
                <Label htmlFor="create_receipt_postings" className="cursor-pointer">
                  Create Receipt Postings Non-Inventory
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxable_customer_order"
                  checked={distribution.taxable_in_customer_order}
                  onCheckedChange={(checked) =>
                    setDistribution({ ...distribution, taxable_in_customer_order: checked as boolean })
                  }
                />
                <Label htmlFor="taxable_customer_order" className="cursor-pointer">
                  Taxable In Customer Order
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxable_purchasing"
                  checked={distribution.taxable_in_purchasing}
                  onCheckedChange={(checked) =>
                    setDistribution({ ...distribution, taxable_in_purchasing: checked as boolean })
                  }
                />
                <Label htmlFor="taxable_purchasing" className="cursor-pointer">
                  Taxable In Purchasing
                </Label>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Ready to complete onboarding</p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                Review all information and click "Complete Onboarding" to finish the setup process.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const progress = (currentStep / 9) * 100

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-balance">
            {createdCompanyId ? "Edit Company" : "Company Onboarding"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground text-pretty">
            {createdCompanyId ? "Update company information" : "Complete the 9-step onboarding process"}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel} className="self-start sm:self-auto bg-transparent">
          Cancel
        </Button>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {currentStep} of {STEPS.length}
              </span>
              <Badge variant="secondary">{Math.round(progress)}% Complete</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="hidden lg:block">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = step.id < currentStep
            const isCurrent = step.id === currentStep

            return (
              <div key={step.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? "bg-green-600 text-white"
                        : isCurrent
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-[80px] text-muted-foreground">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-12 mx-2 transition-colors ${isCompleted ? "bg-green-600" : "bg-muted"}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="min-h-[400px]">{renderStepContent()}</div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 md:mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || saving}
              className="w-full sm:w-auto bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => saveProgress()}
                disabled={saving}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </>
                )}
              </Button>

              {currentStep < 9 ? (
                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Onboarding
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
