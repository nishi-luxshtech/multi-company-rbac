"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { Building2, MapPin, UserPlus, Settings, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: "pending" | "in-progress" | "completed" | "blocked"
  assignee?: string
  dueDate?: string
  dependencies?: string[]
}

interface WorkflowProcess {
  id: string
  type: "company-creation" | "site-creation" | "user-creation" | "role-assignment" | "access-management"
  title: string
  description: string
  requestedBy: string
  requestedDate: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "draft" | "submitted" | "in-progress" | "completed" | "rejected"
  currentStep: number
  steps: WorkflowStep[]
  metadata?: any
}

const workflowTemplates = {
  "company-creation": {
    title: "Company Creation Process",
    description: "End-to-end process for creating a new company with master data setup",
    steps: [
      {
        id: "request",
        title: "Business Request Submission",
        description: "Business team submits formal company creation request with required documentation",
        status: "pending" as const,
      },
      {
        id: "finance-review",
        title: "Finance Review & Approval",
        description: "Finance team reviews legal/financial readiness and approves creation",
        status: "pending" as const,
      },
      {
        id: "company-setup",
        title: "Company Record Creation",
        description: "Create company record with basic information and configuration",
        status: "pending" as const,
      },
      {
        id: "master-data",
        title: "Master Data Setup",
        description: "Configure or copy master data (customers, suppliers, inventory, etc.)",
        status: "pending" as const,
      },
      {
        id: "validation",
        title: "Validation & Testing",
        description: "Validate company setup and run smoke tests",
        status: "pending" as const,
      },
      {
        id: "activation",
        title: "Company Activation",
        description: "Set company status to Active and send notifications",
        status: "pending" as const,
      },
    ],
  },
  "site-creation": {
    title: "Site Creation Process",
    description: "Process for creating a new operational site under a company",
    steps: [
      {
        id: "request",
        title: "Site Creation Request",
        description: "Operations/Business submits site creation request with location details",
        status: "pending" as const,
      },
      {
        id: "it-review",
        title: "IT Dependency Check",
        description: "IT verifies parent company exists and checks regulatory requirements",
        status: "pending" as const,
      },
      {
        id: "site-setup",
        title: "Site Record Creation",
        description: "Create site record with address, type, and basic configuration",
        status: "pending" as const,
      },
      {
        id: "data-copy",
        title: "Site Data Configuration",
        description: "Copy inventory locations, pricing, and operational setup from template",
        status: "pending" as const,
      },
      {
        id: "testing",
        title: "Operational Testing",
        description: "Run sample transactions (receive/pick) to validate setup",
        status: "pending" as const,
      },
      {
        id: "activation",
        title: "Site Activation",
        description: "Mark site as Active and notify Operations and Finance",
        status: "pending" as const,
      },
    ],
  },
  "user-creation": {
    title: "User Account Creation",
    description: "Complete user onboarding with role assignment and access setup",
    steps: [
      {
        id: "request",
        title: "User Access Request",
        description: "Manager submits new user request with role requirements",
        status: "pending" as const,
      },
      {
        id: "approval",
        title: "Access Approval",
        description: "Admin reviews and approves user access requirements",
        status: "pending" as const,
      },
      {
        id: "account-creation",
        title: "Account Setup",
        description: "Create user account with basic profile and authentication",
        status: "pending" as const,
      },
      {
        id: "role-assignment",
        title: "Role & Permission Assignment",
        description: "Assign roles and configure company/site access",
        status: "pending" as const,
      },
      {
        id: "notification",
        title: "Welcome & Onboarding",
        description: "Send welcome email with login credentials and first-time setup",
        status: "pending" as const,
      },
    ],
  },
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "in-progress":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "blocked":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

export function WorkflowManager() {
  const { user } = useAuth()
  const [processes, setProcesses] = useState<WorkflowProcess[]>([])
  const [selectedProcess, setSelectedProcess] = useState<WorkflowProcess | null>(null)
  const [showNewProcessDialog, setShowNewProcessDialog] = useState(false)
  const [newProcessType, setNewProcessType] = useState<string>("")

  useEffect(() => {
    // Load existing processes from localStorage
    const savedProcesses = localStorage.getItem("workflow-processes")
    if (savedProcesses) {
      setProcesses(JSON.parse(savedProcesses))
    } else {
      // Initialize with sample data
      const sampleProcesses: WorkflowProcess[] = [
        {
          id: "1",
          type: "company-creation",
          title: "Create NOVA Retail Company",
          description: "New retail company setup with LAXMI01 template",
          requestedBy: "Business Team",
          requestedDate: "2024-01-15",
          priority: "high",
          status: "in-progress",
          currentStep: 2,
          steps: workflowTemplates["company-creation"].steps.map((step, index) => ({
            ...step,
            status: index < 2 ? "completed" : index === 2 ? "in-progress" : "pending",
          })),
          metadata: {
            companyCode: "NOVA01",
            templateCompany: "LAXMI01",
            currency: "INR",
          },
        },
        {
          id: "2",
          type: "site-creation",
          title: "Setup DC-NORTH Distribution Center",
          description: "New distribution center under LAXMI01",
          requestedBy: "Operations",
          requestedDate: "2024-01-18",
          priority: "medium",
          status: "submitted",
          currentStep: 0,
          steps: workflowTemplates["site-creation"].steps,
          metadata: {
            parentCompany: "LAXMI01",
            siteType: "warehouse",
            templateSite: "LAXMI01-WH1",
          },
        },
      ]
      setProcesses(sampleProcesses)
      localStorage.setItem("workflow-processes", JSON.stringify(sampleProcesses))
    }
  }, [])

  const saveProcesses = (updatedProcesses: WorkflowProcess[]) => {
    setProcesses(updatedProcesses)
    localStorage.setItem("workflow-processes", JSON.stringify(updatedProcesses))
  }

  const createNewProcess = (type: string, formData: any) => {
    const template = workflowTemplates[type as keyof typeof workflowTemplates]
    if (!template) return

    const newProcess: WorkflowProcess = {
      id: Date.now().toString(),
      type: type as any,
      title: formData.title,
      description: formData.description,
      requestedBy: user?.username || "Unknown",
      requestedDate: new Date().toISOString().split("T")[0],
      priority: formData.priority || "medium",
      status: "draft",
      currentStep: 0,
      steps: template.steps.map((step) => ({ ...step })),
      metadata: formData,
    }

    const updatedProcesses = [...processes, newProcess]
    saveProcesses(updatedProcesses)
    setShowNewProcessDialog(false)
  }

  const updateProcessStep = (processId: string, stepIndex: number, status: WorkflowStep["status"]) => {
    const updatedProcesses = processes.map((process) => {
      if (process.id === processId) {
        const updatedSteps = [...process.steps]
        updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status }

        // Update process status and current step
        let processStatus = process.status
        let currentStep = process.currentStep

        if (status === "completed") {
          // Move to next step if current step is completed
          if (stepIndex === process.currentStep) {
            currentStep = Math.min(stepIndex + 1, process.steps.length - 1)
          }
          // Check if all steps are completed
          if (updatedSteps.every((step) => step.status === "completed")) {
            processStatus = "completed"
          } else if (processStatus === "draft" || processStatus === "submitted") {
            processStatus = "in-progress"
          }
        }

        return {
          ...process,
          steps: updatedSteps,
          status: processStatus,
          currentStep,
        }
      }
      return process
    })
    saveProcesses(updatedProcesses)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in-progress":
        return "bg-blue-500"
      case "blocked":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getProcessIcon = (type: string) => {
    switch (type) {
      case "company-creation":
        return <Building2 className="h-5 w-5" />
      case "site-creation":
        return <MapPin className="h-5 w-5" />
      case "user-creation":
        return <UserPlus className="h-5 w-5" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflow Management</h1>
          <p className="text-muted-foreground mt-2">End-to-end business process management and tracking</p>
        </div>
        <Dialog open={showNewProcessDialog} onOpenChange={setShowNewProcessDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Process
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Process</DialogTitle>
              <DialogDescription>Start a new business process workflow</DialogDescription>
            </DialogHeader>
            <NewProcessForm onSubmit={createNewProcess} onCancel={() => setShowNewProcessDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Processes</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {processes
              .filter((p) => p.status !== "completed")
              .map((process) => (
                <Card
                  key={process.id}
                  className="hover-lift cursor-pointer"
                  onClick={() => setSelectedProcess(process)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getProcessIcon(process.type)}
                        <div>
                          <CardTitle className="text-lg">{process.title}</CardTitle>
                          <CardDescription>{process.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(process.priority)}>{process.priority}</Badge>
                        <Badge variant="outline">{process.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          Progress: {process.steps.filter((s) => s.status === "completed").length} /{" "}
                          {process.steps.length} steps
                        </span>
                        <span>Requested: {process.requestedDate}</span>
                      </div>
                      <Progress
                        value={
                          (process.steps.filter((s) => s.status === "completed").length / process.steps.length) * 100
                        }
                        className="h-2"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Current:</span>
                        <span className="text-sm font-medium">
                          {process.steps[process.currentStep]?.title || "Completed"}
                        </span>
                        {process.steps[process.currentStep] && getStatusIcon(process.steps[process.currentStep].status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {processes
              .filter((p) => p.status === "completed")
              .map((process) => (
                <Card key={process.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getProcessIcon(process.type)}
                        <div>
                          <CardTitle className="text-lg">{process.title}</CardTitle>
                          <CardDescription>{process.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(workflowTemplates).map(([key, template]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getProcessIcon(key)}
                      <div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewProcessType(key)
                        setShowNewProcessDialog(true)
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {template.steps.length} steps • Typical duration: 3-7 days
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processes.filter((p) => p.status !== "completed").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processes.filter((p) => p.status === "completed").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Completion Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2 days</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Process Detail Modal */}
      {selectedProcess && (
        <ProcessDetailModal
          process={selectedProcess}
          onClose={() => setSelectedProcess(null)}
          onUpdateStep={updateProcessStep}
        />
      )}
    </div>
  )
}

function NewProcessForm({ onSubmit, onCancel }: { onSubmit: (type: string, data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    priority: "medium",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData.type, formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Process Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select process type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="company-creation">Company Creation</SelectItem>
            <SelectItem value="site-creation">Site Creation</SelectItem>
            <SelectItem value="user-creation">User Creation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Process Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter process title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter process description"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.type || !formData.title}>
          Create Process
        </Button>
      </div>
    </form>
  )
}

function ProcessDetailModal({
  process,
  onClose,
  onUpdateStep,
}: {
  process: WorkflowProcess
  onClose: () => void
  onUpdateStep: (processId: string, stepIndex: number, status: WorkflowStep["status"]) => void
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getProcessIcon(process.type)}
            {process.title}
          </DialogTitle>
          <DialogDescription>{process.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Requested By</Label>
              <p className="text-sm text-muted-foreground">{process.requestedBy}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Request Date</Label>
              <p className="text-sm text-muted-foreground">{process.requestedDate}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <Badge className={getPriorityColor(process.priority)}>{process.priority}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant="outline">{process.status}</Badge>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Process Steps</Label>
            <div className="space-y-3">
              {process.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">{getStatusIcon(step.status)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {step.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => onUpdateStep(process.id, index, "completed")}>
                        Mark Complete
                      </Button>
                    )}
                    {step.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStep(process.id, index, "in-progress")}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200"
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "medium":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function getProcessIcon(type: string) {
  switch (type) {
    case "company-creation":
      return <Building2 className="h-5 w-5" />
    case "site-creation":
      return <MapPin className="h-5 w-5" />
    case "user-creation":
      return <UserPlus className="h-5 w-5" />
    default:
      return <Settings className="h-5 w-5" />
  }
}
