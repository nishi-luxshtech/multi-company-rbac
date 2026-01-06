"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit2, Trash2, Save, X, Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

/**
 * Address data structure matching the workflow domain table
 */
export interface CompanyAddress {
  id?: string
  company_id?: string
  workflow_id?: string
  workflow_instance_id?: string | null
  step_id?: string | null
  address_line_1?: string
  address_line_2?: string
  city?: string
  state_province?: string
  pincode?: string
  county?: string
  address_country?: string
  delivery?: boolean
  document?: boolean
  pay?: boolean
  visit?: boolean
  created_at?: string
  updated_at?: string
  created_by?: number
  updated_by?: number
}

interface AddressStepTableProps {
  companyId?: string
  workflowId: string
  workflowInstanceId?: string | null
  stepId?: string | null
  addresses?: CompanyAddress[]
  onAddressesChange?: (addresses: CompanyAddress[]) => void
  isCreateMode?: boolean
  countryOptions?: string[]
  countyOptions?: string[]
  validationErrors?: Record<string, string>
  apiValidationErrors?: Record<string, string>
  workflowFields?: any[]
}

export function AddressStepTable({
  companyId,
  workflowId,
  workflowInstanceId,
  stepId,
  addresses: initialAddresses = [],
  onAddressesChange,
  isCreateMode = true,
  countryOptions = [],
  countyOptions = [],
  validationErrors = {},
  apiValidationErrors = {},
  workflowFields = [],
}: AddressStepTableProps) {
  const [addresses, setAddresses] = useState<CompanyAddress[]>(initialAddresses)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  // Sync with parent when addresses change
  useEffect(() => {
    if (onAddressesChange) {
      onAddressesChange(addresses)
    }
  }, [addresses, onAddressesChange])

  // Sync with initial addresses prop
  useEffect(() => {
    if (initialAddresses && initialAddresses.length > 0) {
      setAddresses(initialAddresses)
    }
  }, [initialAddresses])

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
  }

  const handleEdit = (address: CompanyAddress) => {
    setEditingId(address.id || `temp-${Date.now()}`)
    setIsAdding(false)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
  }

  const handleSave = (addressData: CompanyAddress) => {
    if (isAdding) {
      // Add new address
      const newAddress: CompanyAddress = {
        ...addressData,
        id: `temp-${Date.now()}`,
        company_id: companyId,
        workflow_id: workflowId,
        workflow_instance_id: workflowInstanceId,
        step_id: stepId,
      }
      setAddresses([...addresses, newAddress])
      setIsAdding(false)
      toast({
        title: "Address Added",
        description: "Address added successfully. It will be saved when you submit the form.",
      })
    } else if (editingId) {
      // Update existing address
      setAddresses(addresses.map(addr => 
        addr.id === editingId ? { ...addressData, id: editingId } : addr
      ))
      setEditingId(null)
      toast({
        title: "Address Updated",
        description: "Address updated successfully. It will be saved when you submit the form.",
      })
    }
  }

  const handleDelete = (addressId: string) => {
    setAddresses(addresses.filter(addr => addr.id !== addressId))
    setDeleteConfirmId(null)
    toast({
      title: "Address Removed",
      description: "Address removed from the list.",
    })
  }

  const getAddressTypeFlags = (address: CompanyAddress): string[] => {
    const types: string[] = []
    if (address.delivery) types.push("Delivery")
    if (address.document) types.push("Document")
    if (address.pay) types.push("Pay")
    if (address.visit) types.push("Visit")
    return types.length > 0 ? types : ["None"]
  }

  const getFieldError = (addressIndex: number, fieldName: string): string | undefined => {
    const arrayIndexedKey = `address_${addressIndex}_${fieldName}`
    return validationErrors[arrayIndexedKey] || apiValidationErrors[arrayIndexedKey]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Addresses</h3>
          <p className="text-sm text-muted-foreground">
            Add multiple addresses for this company
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isAdding || editingId !== null}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 && !isAdding && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No addresses added yet. Click "Add Address" to get started.
          </CardContent>
        </Card>
      )}

      {addresses.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sr.</TableHead>
                  <TableHead>Address Line 1</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State/Province</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address, index) => {
                  const isEditing = editingId === address.id
                  const hasErrors = Object.keys(validationErrors).some(key => 
                    key.startsWith(`address_${index}_`)
                  ) || Object.keys(apiValidationErrors).some(key => 
                    key.startsWith(`address_${index}_`)
                  )

                  if (isEditing) {
                    return (
                      <AddressEditRow
                        key={address.id || `edit-${index}`}
                        address={address}
                        index={index}
                        countryOptions={countryOptions}
                        countyOptions={countyOptions}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        validationErrors={validationErrors}
                        apiValidationErrors={apiValidationErrors}
                      />
                    )
                  }

                  return (
                    <TableRow 
                      key={address.id || `row-${index}`}
                      className={hasErrors ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{address.address_line_1 || "-"}</TableCell>
                      <TableCell>
                        {address.city || "-"}
                        {getFieldError(index, "city") && (
                          <p className="text-xs text-red-500 mt-1">
                            {getFieldError(index, "city")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{address.state_province || "-"}</TableCell>
                      <TableCell>
                        {address.pincode || "-"}
                        {getFieldError(index, "pincode") && (
                          <p className="text-xs text-red-500 mt-1">
                            {getFieldError(index, "pincode")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{address.address_country || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getAddressTypeFlags(address).map((type, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(address)}
                            disabled={isAdding}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(address.id || "")}
                            disabled={isAdding}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Render add form inside table if there are existing addresses */}
                {isAdding && addresses.length > 0 && (
                  <AddressEditRow
                    address={{
                      company_id: companyId,
                      workflow_id: workflowId,
                      workflow_instance_id: workflowInstanceId,
                      step_id: stepId,
                    }}
                    index={addresses.length}
                    countryOptions={countryOptions}
                    countyOptions={countyOptions}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    validationErrors={validationErrors}
                    apiValidationErrors={apiValidationErrors}
                  />
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Render add form as Card when there are no addresses yet */}
      {isAdding && addresses.length === 0 && (
        <AddressEditForm
          address={{
            company_id: companyId,
            workflow_id: workflowId,
            workflow_instance_id: workflowInstanceId,
            step_id: stepId,
          }}
          index={0}
          countryOptions={countryOptions}
          countyOptions={countyOptions}
          onSave={handleSave}
          onCancel={handleCancel}
          validationErrors={validationErrors}
          apiValidationErrors={apiValidationErrors}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Separate component for adding first address (renders as Card, not TableRow)
function AddressEditForm({
  address,
  index,
  countryOptions,
  countyOptions,
  onSave,
  onCancel,
  validationErrors,
  apiValidationErrors,
}: AddressEditRowProps) {
  const [formData, setFormData] = useState<CompanyAddress>({
    address_line_1: address.address_line_1 || "",
    address_line_2: address.address_line_2 || "",
    city: address.city || "",
    state_province: address.state_province || "",
    pincode: address.pincode || "",
    county: address.county || "",
    address_country: address.address_country || "",
    delivery: address.delivery || false,
    document: address.document || false,
    pay: address.pay || false,
    visit: address.visit || false,
    ...address,
  })

  const updateField = (field: keyof CompanyAddress, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getFieldError = (fieldName: string): string | undefined => {
    const arrayIndexedKey = `address_${index}_${fieldName}`
    return validationErrors[arrayIndexedKey] || apiValidationErrors[arrayIndexedKey]
  }

  const handleSave = () => {
    // Basic validation
    if (!formData.address_line_1 || !formData.city || !formData.state_province || !formData.pincode || !formData.address_country) {
      return
    }
    onSave(formData)
  }

  const hasError = (fieldName: string) => !!getFieldError(fieldName)

  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address Line 1 */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor={`addr-${index}-line1`}>
              Address Line 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`addr-${index}-line1`}
              value={formData.address_line_1 || ""}
              onChange={(e) => updateField("address_line_1", e.target.value)}
              className={hasError("address_line_1") ? "border-red-500" : ""}
            />
            {getFieldError("address_line_1") && (
              <p className="text-xs text-red-500">{getFieldError("address_line_1")}</p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor={`addr-${index}-line2`}>Address Line 2</Label>
            <Input
              id={`addr-${index}-line2`}
              value={formData.address_line_2 || ""}
              onChange={(e) => updateField("address_line_2", e.target.value)}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor={`addr-${index}-city`}>
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`addr-${index}-city`}
              value={formData.city || ""}
              onChange={(e) => updateField("city", e.target.value)}
              className={hasError("city") ? "border-red-500" : ""}
            />
            {getFieldError("city") && (
              <p className="text-xs text-red-500">{getFieldError("city")}</p>
            )}
          </div>

          {/* State/Province */}
          <div className="space-y-2">
            <Label htmlFor={`addr-${index}-state`}>
              State/Province <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`addr-${index}-state`}
              value={formData.state_province || ""}
              onChange={(e) => updateField("state_province", e.target.value)}
              className={hasError("state_province") ? "border-red-500" : ""}
            />
            {getFieldError("state_province") && (
              <p className="text-xs text-red-500">{getFieldError("state_province")}</p>
            )}
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <Label htmlFor={`addr-${index}-pincode`}>
              Pincode <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`addr-${index}-pincode`}
              value={formData.pincode || ""}
              onChange={(e) => updateField("pincode", e.target.value)}
              className={hasError("pincode") ? "border-red-500" : ""}
            />
            {getFieldError("pincode") && (
              <p className="text-xs text-red-500">{getFieldError("pincode")}</p>
            )}
          </div>

          {/* County */}
          <div className="space-y-2">
            <Label htmlFor={`addr-${index}-county`}>County</Label>
            <Select
              value={formData.county || ""}
              onValueChange={(value) => updateField("county", value)}
            >
              <SelectTrigger id={`addr-${index}-county`}>
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {countyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address Country */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor={`addr-${index}-country`}>
              Address Country <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.address_country || ""}
              onValueChange={(value) => updateField("address_country", value)}
            >
              <SelectTrigger 
                id={`addr-${index}-country`}
                className={hasError("address_country") ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError("address_country") && (
              <p className="text-xs text-red-500">{getFieldError("address_country")}</p>
            )}
          </div>

          {/* Address Type Flags */}
          <div className="md:col-span-2 space-y-2">
            <Label>Address Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`addr-${index}-delivery`}
                  checked={formData.delivery || false}
                  onCheckedChange={(checked) => updateField("delivery", checked)}
                />
                <Label htmlFor={`addr-${index}-delivery`} className="font-normal cursor-pointer">
                  Delivery
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`addr-${index}-document`}
                  checked={formData.document || false}
                  onCheckedChange={(checked) => updateField("document", checked)}
                />
                <Label htmlFor={`addr-${index}-document`} className="font-normal cursor-pointer">
                  Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`addr-${index}-pay`}
                  checked={formData.pay || false}
                  onCheckedChange={(checked) => updateField("pay", checked)}
                />
                <Label htmlFor={`addr-${index}-pay`} className="font-normal cursor-pointer">
                  Pay
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`addr-${index}-visit`}
                  checked={formData.visit || false}
                  onCheckedChange={(checked) => updateField("visit", checked)}
                />
                <Label htmlFor={`addr-${index}-visit`} className="font-normal cursor-pointer">
                  Visit
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={
                !formData.address_line_1 ||
                !formData.city ||
                !formData.state_province ||
                !formData.pincode ||
                !formData.address_country
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface AddressEditRowProps {
  address: CompanyAddress
  index: number
  countryOptions: string[]
  countyOptions: string[]
  onSave: (address: CompanyAddress) => void
  onCancel: () => void
  validationErrors: Record<string, string>
  apiValidationErrors: Record<string, string>
}

function AddressEditRow({
  address,
  index,
  countryOptions,
  countyOptions,
  onSave,
  onCancel,
  validationErrors,
  apiValidationErrors,
}: AddressEditRowProps) {
  const [formData, setFormData] = useState<CompanyAddress>({
    address_line_1: address.address_line_1 || "",
    address_line_2: address.address_line_2 || "",
    city: address.city || "",
    state_province: address.state_province || "",
    pincode: address.pincode || "",
    county: address.county || "",
    address_country: address.address_country || "",
    delivery: address.delivery || false,
    document: address.document || false,
    pay: address.pay || false,
    visit: address.visit || false,
    ...address,
  })

  const updateField = (field: keyof CompanyAddress, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getFieldError = (fieldName: string): string | undefined => {
    const arrayIndexedKey = `address_${index}_${fieldName}`
    return validationErrors[arrayIndexedKey] || apiValidationErrors[arrayIndexedKey]
  }

  const handleSave = () => {
    // Basic validation
    if (!formData.address_line_1 || !formData.city || !formData.state_province || !formData.pincode || !formData.address_country) {
      return
    }
    onSave(formData)
  }

  const hasError = (fieldName: string) => !!getFieldError(fieldName)

  return (
    <TableRow className="bg-blue-50 dark:bg-blue-950/20">
      <TableCell colSpan={8}>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address Line 1 */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`addr-${index}-line1`}>
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`addr-${index}-line1`}
                  value={formData.address_line_1 || ""}
                  onChange={(e) => updateField("address_line_1", e.target.value)}
                  className={hasError("address_line_1") ? "border-red-500" : ""}
                />
                {getFieldError("address_line_1") && (
                  <p className="text-xs text-red-500">{getFieldError("address_line_1")}</p>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`addr-${index}-line2`}>Address Line 2</Label>
                <Input
                  id={`addr-${index}-line2`}
                  value={formData.address_line_2 || ""}
                  onChange={(e) => updateField("address_line_2", e.target.value)}
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor={`addr-${index}-city`}>
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`addr-${index}-city`}
                  value={formData.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={hasError("city") ? "border-red-500" : ""}
                />
                {getFieldError("city") && (
                  <p className="text-xs text-red-500">{getFieldError("city")}</p>
                )}
              </div>

              {/* State/Province */}
              <div className="space-y-2">
                <Label htmlFor={`addr-${index}-state`}>
                  State/Province <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`addr-${index}-state`}
                  value={formData.state_province || ""}
                  onChange={(e) => updateField("state_province", e.target.value)}
                  className={hasError("state_province") ? "border-red-500" : ""}
                />
                {getFieldError("state_province") && (
                  <p className="text-xs text-red-500">{getFieldError("state_province")}</p>
                )}
              </div>

              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor={`addr-${index}-pincode`}>
                  Pincode <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`addr-${index}-pincode`}
                  value={formData.pincode || ""}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  className={hasError("pincode") ? "border-red-500" : ""}
                />
                {getFieldError("pincode") && (
                  <p className="text-xs text-red-500">{getFieldError("pincode")}</p>
                )}
              </div>

              {/* County */}
              <div className="space-y-2">
                <Label htmlFor={`addr-${index}-county`}>County</Label>
                <Select
                  value={formData.county || ""}
                  onValueChange={(value) => updateField("county", value)}
                >
                  <SelectTrigger id={`addr-${index}-county`}>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {countyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Address Country */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`addr-${index}-country`}>
                  Address Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.address_country || ""}
                  onValueChange={(value) => updateField("address_country", value)}
                >
                  <SelectTrigger 
                    id={`addr-${index}-country`}
                    className={hasError("address_country") ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldError("address_country") && (
                  <p className="text-xs text-red-500">{getFieldError("address_country")}</p>
                )}
              </div>

              {/* Address Type Flags */}
              <div className="md:col-span-2 space-y-2">
                <Label>Address Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`addr-${index}-delivery`}
                      checked={formData.delivery || false}
                      onCheckedChange={(checked) => updateField("delivery", checked)}
                    />
                    <Label htmlFor={`addr-${index}-delivery`} className="font-normal cursor-pointer">
                      Delivery
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`addr-${index}-document`}
                      checked={formData.document || false}
                      onCheckedChange={(checked) => updateField("document", checked)}
                    />
                    <Label htmlFor={`addr-${index}-document`} className="font-normal cursor-pointer">
                      Document
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`addr-${index}-pay`}
                      checked={formData.pay || false}
                      onCheckedChange={(checked) => updateField("pay", checked)}
                    />
                    <Label htmlFor={`addr-${index}-pay`} className="font-normal cursor-pointer">
                      Pay
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`addr-${index}-visit`}
                      checked={formData.visit || false}
                      onCheckedChange={(checked) => updateField("visit", checked)}
                    />
                    <Label htmlFor={`addr-${index}-visit`} className="font-normal cursor-pointer">
                      Visit
                    </Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={
                    !formData.address_line_1 ||
                    !formData.city ||
                    !formData.state_province ||
                    !formData.pincode ||
                    !formData.address_country
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TableCell>
    </TableRow>
  )
}

