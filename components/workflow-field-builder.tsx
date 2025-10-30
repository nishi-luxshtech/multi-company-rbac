"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, GripVertical, Settings2, Eye, Sparkles } from "lucide-react"
import type { WorkflowField } from "@/lib/workflow-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface WorkflowFieldBuilderProps {
  fields: WorkflowField[]
  onFieldsChange: (fields: WorkflowField[]) => void
}

const FIELD_TYPES = [
  { value: "text", label: "Text", icon: "📝", description: "Single line text input", category: "Basic" },
  { value: "email", label: "Email", icon: "📧", description: "Email address field", category: "Basic" },
  { value: "number", label: "Number", icon: "🔢", description: "Numeric input", category: "Basic" },
  { value: "phone", label: "Phone", icon: "📞", description: "Phone number", category: "Basic" },
  { value: "url", label: "URL", icon: "🔗", description: "Website link", category: "Basic" },
  { value: "textarea", label: "Long Text", icon: "📄", description: "Multi-line text", category: "Basic" },
  { value: "date", label: "Date", icon: "📅", description: "Date picker", category: "Date & Time" },
  { value: "time", label: "Time", icon: "⏰", description: "Time picker", category: "Date & Time" },
  { value: "daterange", label: "Date Range", icon: "📆", description: "Date range picker", category: "Date & Time" },
  { value: "checkbox", label: "Checkbox", icon: "☑️", description: "Yes/No checkbox", category: "Selection" },
  { value: "switch", label: "Switch", icon: "🔘", description: "Toggle switch", category: "Selection" },
  { value: "select", label: "Dropdown", icon: "📋", description: "Select from options", category: "Selection" },
  { value: "radio", label: "Radio Group", icon: "⭕", description: "Single choice from list", category: "Selection" },
  { value: "combobox", label: "Combobox", icon: "🔍", description: "Searchable select", category: "Selection" },
  {
    value: "multiselect",
    label: "Multi-Select",
    icon: "✅",
    description: "Multiple selections",
    category: "Selection",
  },
  { value: "slider", label: "Slider", icon: "🎚️", description: "Range slider", category: "Advanced" },
  { value: "rating", label: "Rating", icon: "⭐", description: "Star rating", category: "Advanced" },
  { value: "file", label: "File Upload", icon: "📎", description: "File attachment", category: "Advanced" },
  { value: "color", label: "Color Picker", icon: "🎨", description: "Color selection", category: "Advanced" },
]

const FIELD_CATEGORIES = ["Basic", "Date & Time", "Selection", "Advanced"]

export function WorkflowFieldBuilder({ fields, onFieldsChange }: WorkflowFieldBuilderProps) {
  const [editingField, setEditingField] = useState<WorkflowField | null>(null)
  const [showFieldDialog, setShowFieldDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const handleAddField = (type: WorkflowField["type"]) => {
    const newField: WorkflowField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `New ${type} field`,
      required: false,
      options:
        type === "select" || type === "radio" || type === "combobox" || type === "multiselect"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
      layout: { width: "full" },
      config: type === "rating" ? { maxStars: 5 } : type === "slider" ? { step: 1 } : undefined,
    }
    setEditingField(newField)
    setShowFieldDialog(true)
  }

  const handleEditField = (field: WorkflowField) => {
    setEditingField({ ...field })
    setShowFieldDialog(true)
  }

  const handleSaveField = () => {
    if (!editingField) return

    const existingIndex = fields.findIndex((f) => f.id === editingField.id)
    if (existingIndex >= 0) {
      // Update existing field
      const updated = [...fields]
      updated[existingIndex] = editingField
      onFieldsChange(updated)
    } else {
      // Add new field
      onFieldsChange([...fields, editingField])
    }

    setShowFieldDialog(false)
    setEditingField(null)
  }

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId))
  }

  const handleMoveField = (fieldId: string, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === fieldId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === fields.length - 1) return

    const newFields = [...fields]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
    onFieldsChange(newFields)
  }

  const handleFieldDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFieldDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverFieldId(fieldId)
  }

  const handleFieldDragLeave = () => {
    setDragOverFieldId(null)
  }

  const handleFieldDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault()
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null)
      setDragOverFieldId(null)
      return
    }

    const draggedIndex = fields.findIndex((f) => f.id === draggedFieldId)
    const targetIndex = fields.findIndex((f) => f.id === targetFieldId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newFields = [...fields]
    const [draggedField] = newFields.splice(draggedIndex, 1)
    newFields.splice(targetIndex, 0, draggedField)

    onFieldsChange(newFields)
    setDraggedFieldId(null)
    setDragOverFieldId(null)
  }

  const handleFieldDragEnd = () => {
    setDraggedFieldId(null)
    setDragOverFieldId(null)
  }

  const renderFieldPreview = (field: WorkflowField) => {
    switch (field.type) {
      case "switch":
        return (
          <div className="flex items-center gap-2">
            <Switch disabled />
            <span className="text-sm">{field.label}</span>
          </div>
        )
      case "slider":
        return (
          <div className="space-y-2">
            <Slider
              disabled
              defaultValue={[field.validation?.min || 0]}
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
          <RadioGroup disabled>
            {field.options?.slice(0, 3).map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      case "rating":
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.config?.maxStars || 5 }).map((_, i) => (
              <span key={i} className="text-2xl text-gray-300">
                ⭐
              </span>
            ))}
          </div>
        )
      case "time":
        return <Input type="time" className="h-11" disabled />
      case "daterange":
        return (
          <div className="flex gap-2">
            <Input type="date" className="h-11 flex-1" disabled placeholder="Start date" />
            <Input type="date" className="h-11 flex-1" disabled placeholder="End date" />
          </div>
        )
      case "file":
        return (
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">
              {field.validation?.accept || "Any file type"}
              {field.config?.multiple && " (Multiple files allowed)"}
            </p>
          </div>
        )
      case "color":
        return (
          <div className="flex items-center gap-2">
            <Input type="color" className="h-11 w-20" disabled />
            <Input type="text" placeholder="#000000" className="h-11 flex-1" disabled />
          </div>
        )
      case "combobox":
      case "multiselect":
        return (
          <Select disabled>
            <SelectTrigger className="h-11">
              <SelectValue
                placeholder={field.type === "multiselect" ? "Select multiple options..." : "Search and select..."}
              />
            </SelectTrigger>
          </Select>
        )
      case "text":
      case "email":
      case "phone":
      case "url":
        return <Input placeholder={field.placeholder || field.label} className="h-11" disabled />
      case "number":
        return <Input type="number" placeholder={field.placeholder || field.label} className="h-11" disabled />
      case "date":
        return <Input type="date" className="h-11" disabled />
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox disabled />
            <span className="text-sm">{field.label}</span>
          </div>
        )
      case "select":
        return (
          <Select disabled>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
          </Select>
        )
      case "textarea":
        return <Textarea placeholder={field.placeholder || field.label} rows={3} disabled />
      default:
        return <Input placeholder={field.placeholder || field.label} className="h-11" disabled />
    }
  }

  const filteredFieldTypes =
    selectedCategory === "all" ? FIELD_TYPES : FIELD_TYPES.filter((type) => type.category === selectedCategory)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Fields</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Eye className="mr-2 h-4 w-4" />
          {showPreview ? "Hide" : "Show"} Preview
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          className={selectedCategory === "all" ? "bg-blue-600" : ""}
        >
          All Fields
        </Button>
        {FIELD_CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-blue-600" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredFieldTypes.map((type) => (
          <Button
            key={type.value}
            variant="outline"
            onClick={() => handleAddField(type.value as WorkflowField["type"])}
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50 hover:border-blue-300 transition-all group relative"
            title={type.description}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{type.icon}</span>
            <span className="text-sm font-medium">{type.label}</span>
            {(type.category === "Advanced" || type.category === "Date & Time") && (
              <Badge variant="secondary" className="absolute top-1 right-1 text-xs px-1 py-0">
                <Sparkles className="h-2 w-2" />
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Field List */}
      {fields.length === 0 ? (
        <Card className="p-8 border-2 border-dashed">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">No fields added yet</p>
            <p className="text-sm mt-1">Click a field type above to add your first field</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const isDragging = draggedFieldId === field.id
            const isDragOver = dragOverFieldId === field.id

            return (
              <Card
                key={field.id}
                draggable
                onDragStart={(e) => handleFieldDragStart(e, field.id)}
                onDragOver={(e) => handleFieldDragOver(e, field.id)}
                onDragLeave={handleFieldDragLeave}
                onDrop={(e) => handleFieldDrop(e, field.id)}
                onDragEnd={handleFieldDragEnd}
                className={`p-4 transition-all duration-200 ${isDragging ? "opacity-50 scale-95" : ""} ${
                  isDragOver ? "border-blue-500 border-2 shadow-lg" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1 transition-colors mt-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-base px-2 py-1">
                          {FIELD_TYPES.find((t) => t.value === field.type)?.icon}
                        </Badge>
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                            {field.required && " • Required"}
                            {field.placeholder && ` • "${field.placeholder}"`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-50"
                          onClick={() => handleEditField(field)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Delete this field?")) {
                              handleDeleteField(field.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {showPreview && (
                      <div className="pt-2 border-t">
                        <Label className="text-xs text-muted-foreground mb-2 block">Preview:</Label>
                        {renderFieldPreview(field)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Field Editor Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>{editingField?.id.startsWith("field_") ? "Add Field" : "Edit Field"}</DialogTitle>
          </DialogHeader>

          {editingField && (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Field Type</Label>
                <Select
                  value={editingField.type}
                  onValueChange={(value) => setEditingField({ ...editingField, type: value as WorkflowField["type"] })}
                >
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[300px]">
                    {FIELD_CATEGORIES.map((category) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                        {FIELD_TYPES.filter((t) => t.category === category).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Field Label *</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="e.g., Company Name"
                  className="h-11 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Placeholder Text</Label>
                <Input
                  value={editingField.placeholder || ""}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                  placeholder="e.g., Enter company name..."
                  className="h-11 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Field Width</Label>
                <Select
                  value={editingField.layout?.width || "full"}
                  onValueChange={(value) =>
                    setEditingField({
                      ...editingField,
                      layout: { ...editingField.layout, width: value as "full" | "half" | "third" },
                    })
                  }
                >
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="full">Full Width</SelectItem>
                    <SelectItem value="half">Half Width (50%)</SelectItem>
                    <SelectItem value="third">Third Width (33%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div>
                  <Label className="text-base font-semibold">Required Field</Label>
                  <p className="text-sm text-muted-foreground">Users must fill this field to proceed</p>
                </div>
                <Switch
                  checked={editingField.required}
                  onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                />
              </div>

              {(editingField.type === "select" ||
                editingField.type === "radio" ||
                editingField.type === "combobox" ||
                editingField.type === "multiselect") && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Options</Label>
                  <Textarea
                    value={(editingField.options || []).join("\n")}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        options: e.target.value.split("\n").filter((o) => o.trim()),
                      })
                    }
                    placeholder="Enter one option per line"
                    rows={5}
                    className="bg-white font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Enter one option per line</p>
                </div>
              )}

              {editingField.type === "slider" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Minimum Value</Label>
                    <Input
                      type="number"
                      value={editingField.validation?.min || 0}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          validation: { ...editingField.validation, min: Number.parseInt(e.target.value) || 0 },
                        })
                      }
                      className="h-11 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Maximum Value</Label>
                    <Input
                      type="number"
                      value={editingField.validation?.max || 100}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          validation: { ...editingField.validation, max: Number.parseInt(e.target.value) || 100 },
                        })
                      }
                      className="h-11 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Step</Label>
                    <Input
                      type="number"
                      value={editingField.config?.step || 1}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          config: { ...editingField.config, step: Number.parseInt(e.target.value) || 1 },
                        })
                      }
                      className="h-11 bg-white"
                    />
                  </div>
                </div>
              )}

              {editingField.type === "rating" && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Maximum Stars</Label>
                  <Input
                    type="number"
                    value={editingField.config?.maxStars || 5}
                    min={3}
                    max={10}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        config: { ...editingField.config, maxStars: Number.parseInt(e.target.value) || 5 },
                      })
                    }
                    className="h-11 bg-white"
                  />
                </div>
              )}

              {editingField.type === "file" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Accepted File Types</Label>
                    <Input
                      value={editingField.validation?.accept || ""}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          validation: { ...editingField.validation, accept: e.target.value },
                        })
                      }
                      placeholder="e.g., .pdf,.doc,.docx"
                      className="h-11 bg-white"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to accept all file types</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div>
                      <Label className="text-base font-semibold">Allow Multiple Files</Label>
                      <p className="text-sm text-muted-foreground">Users can upload multiple files</p>
                    </div>
                    <Switch
                      checked={editingField.config?.multiple || false}
                      onCheckedChange={(checked) =>
                        setEditingField({
                          ...editingField,
                          config: { ...editingField.config, multiple: checked },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {(editingField.type === "number" || editingField.type === "text") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      {editingField.type === "number" ? "Minimum Value" : "Minimum Length"}
                    </Label>
                    <Input
                      type="number"
                      value={editingField.validation?.min || ""}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          validation: { ...editingField.validation, min: Number.parseInt(e.target.value) || undefined },
                        })
                      }
                      className="h-11 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      {editingField.type === "number" ? "Maximum Value" : "Maximum Length"}
                    </Label>
                    <Input
                      type="number"
                      value={editingField.validation?.max || ""}
                      onChange={(e) =>
                        setEditingField({
                          ...editingField,
                          validation: { ...editingField.validation, max: Number.parseInt(e.target.value) || undefined },
                        })
                      }
                      className="h-11 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField} className="bg-blue-600 hover:bg-blue-700">
              Save Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
