// Workflow storage utilities using localStorage (prototype - will be replaced with API)

export interface WorkflowField {
  id: string
  type:
    | "text"
    | "email"
    | "number"
    | "date"
    | "checkbox"
    | "select"
    | "textarea"
    | "phone"
    | "url"
    | "switch"
    | "slider"
    | "radio"
    | "combobox"
    | "multiselect"
    | "file"
    | "color"
    | "rating"
    | "time"
    | "daterange"
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select, radio, combobox, multiselect fields
  validation?: {
    min?: number
    max?: number
    pattern?: string
    accept?: string // For file uploads
  }
  layout?: {
    width?: "full" | "half" | "third" // Field width
    columns?: number // For multi-column layouts
  }
  config?: {
    step?: number // For slider and number
    multiple?: boolean // For file uploads
    maxFiles?: number // For file uploads
    maxStars?: number // For rating
  }
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  fields: WorkflowField[]
  order: number
}

export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  connectedWorkflows?: string[] // IDs of workflows that should run after this one
  triggerType?: "manual" | "automatic" // How this workflow is triggered
  category?: "erp" | "onboarding" | "custom" // Workflow category for organization
}

const STORAGE_KEY = "erp_workflows"

export const workflowStorage = {
  getAll(): Workflow[] {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  },

  getById(id: string): Workflow | null {
    const workflows = this.getAll()
    return workflows.find((w) => w.id === id) || null
  },

  create(workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">): Workflow {
    const workflows = this.getAll()
    const newWorkflow: Workflow = {
      ...workflow,
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    workflows.push(newWorkflow)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows))
    return newWorkflow
  },

  update(id: string, updates: Partial<Workflow>): Workflow | null {
    const workflows = this.getAll()
    const index = workflows.findIndex((w) => w.id === id)
    if (index === -1) return null

    workflows[index] = {
      ...workflows[index],
      ...updates,
      id: workflows[index].id, // Preserve ID
      createdAt: workflows[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows))
    return workflows[index]
  },

  delete(id: string): boolean {
    const workflows = this.getAll()
    const filtered = workflows.filter((w) => w.id !== id)
    if (filtered.length === workflows.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  },

  getActive(): Workflow[] {
    return this.getAll().filter((w) => w.isActive)
  },
}

// Initialize with default 9-step workflow if none exists
export const initializeDefaultWorkflow = () => {
  const workflows = workflowStorage.getAll()

  const defaultWorkflow = workflows.find((w) => w.name === "Standard Company Onboarding")

  // If default workflow doesn't exist or has no fields, create/update it
  const needsInitialization =
    !defaultWorkflow ||
    !defaultWorkflow.steps ||
    defaultWorkflow.steps.length === 0 ||
    defaultWorkflow.steps.every((step) => !step.fields || step.fields.length === 0)

  if (needsInitialization) {
    // If it exists but needs update, delete it first
    if (defaultWorkflow) {
      workflowStorage.delete(defaultWorkflow.id)
    }

    // Create the comprehensive default workflow
    workflowStorage.create({
      name: "Standard Company Onboarding",
      description: "Comprehensive 9-step company onboarding process with all field types",
      isActive: true,
      steps: [
        {
          id: "step_1",
          name: "General Information",
          description: "Basic company details and identification",
          order: 1,
          fields: [
            {
              id: "company_name",
              type: "text",
              label: "Company Name",
              placeholder: "Enter company name",
              required: true,
            },
            {
              id: "company_code",
              type: "text",
              label: "Company Code",
              placeholder: "e.g., COMP001",
              required: true,
              validation: { pattern: "^[A-Z0-9]{4,10}$" },
            },
            {
              id: "association_number",
              type: "text",
              label: "Association Number",
              placeholder: "Registration number",
              required: false,
            },
            {
              id: "country",
              type: "select",
              label: "Country",
              required: true,
              options: [
                "United States",
                "United Kingdom",
                "Canada",
                "Germany",
                "France",
                "India",
                "China",
                "Japan",
                "Australia",
              ],
            },
            {
              id: "default_language",
              type: "select",
              label: "Default Language",
              required: true,
              options: ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Hindi"],
            },
            {
              id: "form_of_business",
              type: "select",
              label: "Form of Business",
              required: true,
              options: ["Corporation", "LLC", "Partnership", "Sole Proprietorship", "Non-Profit"],
            },
            {
              id: "creation_date",
              type: "date",
              label: "Company Creation Date",
              required: true,
            },
            {
              id: "website",
              type: "url",
              label: "Company Website",
              placeholder: "https://example.com",
              required: false,
            },
          ],
        },
        {
          id: "step_2",
          name: "Addresses",
          description: "Company physical and mailing addresses",
          order: 2,
          fields: [
            {
              id: "address_type",
              type: "select",
              label: "Address Type",
              required: true,
              options: ["Headquarters", "Branch Office", "Warehouse", "Mailing Address"],
            },
            {
              id: "address1",
              type: "text",
              label: "Address Line 1",
              placeholder: "Street address",
              required: true,
            },
            {
              id: "address2",
              type: "text",
              label: "Address Line 2",
              placeholder: "Apt, suite, unit, etc.",
              required: false,
            },
            {
              id: "city",
              type: "text",
              label: "City",
              placeholder: "City name",
              required: true,
            },
            {
              id: "state",
              type: "text",
              label: "State/Province",
              placeholder: "State or province",
              required: true,
            },
            {
              id: "postal_code",
              type: "text",
              label: "Postal Code",
              placeholder: "ZIP or postal code",
              required: true,
            },
            {
              id: "country_address",
              type: "select",
              label: "Country",
              required: true,
              options: [
                "United States",
                "United Kingdom",
                "Canada",
                "Germany",
                "France",
                "India",
                "China",
                "Japan",
                "Australia",
              ],
            },
          ],
        },
        {
          id: "step_3",
          name: "Communication Methods",
          description: "Contact information and communication channels",
          order: 3,
          fields: [
            {
              id: "primary_email",
              type: "email",
              label: "Primary Email",
              placeholder: "contact@company.com",
              required: true,
            },
            {
              id: "secondary_email",
              type: "email",
              label: "Secondary Email",
              placeholder: "support@company.com",
              required: false,
            },
            {
              id: "primary_phone",
              type: "phone",
              label: "Primary Phone",
              placeholder: "+1 (555) 123-4567",
              required: true,
            },
            {
              id: "fax",
              type: "phone",
              label: "Fax Number",
              placeholder: "+1 (555) 123-4568",
              required: false,
            },
            {
              id: "communication_preference",
              type: "select",
              label: "Preferred Communication Method",
              required: true,
              options: ["Email", "Phone", "Fax", "Mail", "EDI"],
            },
          ],
        },
        {
          id: "step_4",
          name: "Message Setup",
          description: "Configure messaging and notification settings",
          order: 4,
          fields: [
            {
              id: "message_code",
              type: "text",
              label: "Message Code",
              placeholder: "MSG001",
              required: false,
            },
            {
              id: "media_code",
              type: "select",
              label: "Media Code",
              required: false,
              options: ["Email", "SMS", "Push Notification", "In-App"],
            },
            {
              id: "active_flag",
              type: "checkbox",
              label: "Enable Messaging",
              required: false,
            },
            {
              id: "notification_email",
              type: "email",
              label: "Notification Email",
              placeholder: "notifications@company.com",
              required: false,
            },
          ],
        },
        {
          id: "step_5",
          name: "Employees",
          description: "Add company employees and staff members",
          order: 5,
          fields: [
            {
              id: "employee_id",
              type: "text",
              label: "Employee ID",
              placeholder: "EMP001",
              required: true,
              validation: { pattern: "^EMP[0-9]{3,6}$" },
            },
            {
              id: "employee_name",
              type: "text",
              label: "Full Name",
              placeholder: "John Doe",
              required: true,
            },
            {
              id: "employee_email",
              type: "email",
              label: "Employee Email",
              placeholder: "john.doe@company.com",
              required: true,
            },
            {
              id: "employee_role",
              type: "select",
              label: "Role",
              required: true,
              options: ["Manager", "Supervisor", "Staff", "Contractor", "Intern"],
            },
            {
              id: "hire_date",
              type: "date",
              label: "Hire Date",
              required: true,
            },
            {
              id: "is_active",
              type: "checkbox",
              label: "Active Employee",
              required: false,
            },
          ],
        },
        {
          id: "step_6",
          name: "Accounting Rules",
          description: "Configure accounting and financial settings",
          order: 6,
          fields: [
            {
              id: "accounting_currency",
              type: "select",
              label: "Accounting Currency",
              required: true,
              options: ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "CAD", "AUD"],
            },
            {
              id: "parallel_currency",
              type: "select",
              label: "Parallel Currency",
              required: false,
              options: ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "CAD", "AUD"],
            },
            {
              id: "fiscal_year_start",
              type: "date",
              label: "Fiscal Year Start Date",
              required: true,
            },
            {
              id: "tax_rounding_method",
              type: "select",
              label: "Tax Rounding Method",
              required: true,
              options: ["Round Up", "Round Down", "Round to Nearest", "No Rounding"],
            },
            {
              id: "max_tax_percent",
              type: "number",
              label: "Maximum Tax Percentage",
              placeholder: "25",
              required: false,
              validation: { min: 0, max: 100 },
            },
            {
              id: "use_voucher_series",
              type: "checkbox",
              label: "Use Voucher Series",
              required: false,
            },
          ],
        },
        {
          id: "step_7",
          name: "Invoice Settings",
          description: "Configure invoice and billing preferences",
          order: 7,
          fields: [
            {
              id: "default_invoice_type",
              type: "select",
              label: "Default Invoice Type",
              required: true,
              options: ["Standard", "Proforma", "Credit Note", "Debit Note", "Commercial"],
            },
            {
              id: "invoice_prefix",
              type: "text",
              label: "Invoice Number Prefix",
              placeholder: "INV-",
              required: false,
            },
            {
              id: "tax_regime",
              type: "select",
              label: "Tax Regime",
              required: true,
              options: ["VAT", "GST", "Sales Tax", "No Tax"],
            },
            {
              id: "tax_id_number",
              type: "text",
              label: "Tax ID Number",
              placeholder: "Tax identification number",
              required: true,
            },
            {
              id: "payment_terms_days",
              type: "number",
              label: "Default Payment Terms (Days)",
              placeholder: "30",
              required: true,
              validation: { min: 0, max: 365 },
            },
            {
              id: "cash_discount_enabled",
              type: "checkbox",
              label: "Enable Cash Discount",
              required: false,
            },
          ],
        },
        {
          id: "step_8",
          name: "Payment Settings",
          description: "Configure payment methods and preferences",
          order: 8,
          fields: [
            {
              id: "payment_methods",
              type: "select",
              label: "Accepted Payment Methods",
              required: true,
              options: ["Bank Transfer", "Credit Card", "Check", "Cash", "PayPal", "Stripe"],
            },
            {
              id: "bank_name",
              type: "text",
              label: "Bank Name",
              placeholder: "Primary bank name",
              required: false,
            },
            {
              id: "account_number",
              type: "text",
              label: "Account Number",
              placeholder: "Bank account number",
              required: false,
            },
            {
              id: "routing_number",
              type: "text",
              label: "Routing Number",
              placeholder: "Bank routing number",
              required: false,
            },
            {
              id: "payment_tolerance_percent",
              type: "number",
              label: "Payment Tolerance (%)",
              placeholder: "5",
              required: false,
              validation: { min: 0, max: 100 },
            },
            {
              id: "auto_payment_matching",
              type: "checkbox",
              label: "Enable Automatic Payment Matching",
              required: false,
            },
          ],
        },
        {
          id: "step_9",
          name: "Distribution",
          description: "Configure distribution and logistics settings",
          order: 9,
          fields: [
            {
              id: "distribution_method",
              type: "select",
              label: "Distribution Method",
              required: true,
              options: ["Direct Shipping", "Warehouse", "Drop Shipping", "Third-Party Logistics"],
            },
            {
              id: "warehouse_location",
              type: "text",
              label: "Primary Warehouse Location",
              placeholder: "Warehouse address",
              required: false,
            },
            {
              id: "shipping_carrier",
              type: "select",
              label: "Preferred Shipping Carrier",
              required: false,
              options: ["FedEx", "UPS", "DHL", "USPS", "Local Courier"],
            },
            {
              id: "ownership_transfer_point",
              type: "select",
              label: "Ownership Transfer Point",
              required: true,
              options: ["On Shipment", "On Delivery", "On Payment", "On Acceptance"],
            },
            {
              id: "use_transit_balancing",
              type: "checkbox",
              label: "Use Transit Balancing",
              required: false,
            },
            {
              id: "create_receipt_postings",
              type: "checkbox",
              label: "Create Receipt Postings for Non-Invoiced Items",
              required: false,
            },
          ],
        },
      ],
      connectedWorkflows: [], // IDs of workflows that should run after this one
      triggerType: "manual", // How this workflow is triggered
      category: "onboarding", // Workflow category for organization
    })
  }
}
