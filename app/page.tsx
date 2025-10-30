"use client"

import { useState } from "react"
import { ERPAuthProvider } from "@/lib/erp-auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { ERPDashboard } from "@/components/erp-dashboard"
import { ERPSidebar } from "@/components/erp-sidebar"
import { ERPCompanyList } from "@/components/erp-company-list"
import { ERPUserManagement } from "@/components/erp-user-management"
import { ERPCompanyDetailsPage } from "@/components/erp-company-details-page"
import { WorkflowManagement } from "@/components/workflow-management"
import { WorkflowBuilder } from "@/components/workflow-builder"
import { WorkflowSelector } from "@/components/workflow-selector"
import { DynamicCompanyWizard } from "@/components/dynamic-company-wizard"
import type { Workflow } from "@/lib/workflow-storage"

function ERPApp() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [onboardingCompanyId, setOnboardingCompanyId] = useState<number | undefined>()
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>()
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false)
  const [workflowChain, setWorkflowChain] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"wizard" | "tabs">("wizard")

  const handleStartOnboarding = (companyId?: number) => {
    setOnboardingCompanyId(companyId)
    setShowWorkflowSelector(true)
  }

  const handleWorkflowSelected = (workflowId: string, selectedViewMode: "wizard" | "tabs") => {
    setSelectedWorkflowId(workflowId)
    setWorkflowChain([])
    setViewMode(selectedViewMode)
    setShowWorkflowSelector(false)
    setActiveTab("onboarding")
  }

  const handleCanvasWorkflowSelected = (workflowIds: string[], selectedViewMode: "wizard" | "tabs") => {
    console.log("Canvas workflow chain selected:", workflowIds)
    if (workflowIds.length > 0) {
      setSelectedWorkflowId(workflowIds[0])
      setWorkflowChain(workflowIds)
      setViewMode(selectedViewMode)
      setShowWorkflowSelector(false)
      setActiveTab("onboarding")
    }
  }

  const handleOnboardingComplete = () => {
    if (workflowChain.length > 1) {
      const remainingWorkflows = workflowChain.slice(1)
      console.log("Moving to next workflow in chain:", remainingWorkflows[0])
      setSelectedWorkflowId(remainingWorkflows[0])
      setWorkflowChain(remainingWorkflows)
    } else {
      console.log("All workflows in chain completed")
      setOnboardingCompanyId(undefined)
      setSelectedWorkflowId(null)
      setWorkflowChain([])
      setShowWorkflowSelector(false)
      setActiveTab("companies")
    }
  }

  const handleOnboardingCancel = () => {
    setOnboardingCompanyId(undefined)
    setSelectedWorkflowId(null)
    setWorkflowChain([])
    setShowWorkflowSelector(false)
    setActiveTab("companies")
  }

  const handleViewCompany = (companyId: number) => {
    setSelectedCompanyId(companyId)
    setActiveTab("company-details")
  }

  const handleBackToCompanies = () => {
    setSelectedCompanyId(undefined)
    setActiveTab("companies")
  }

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null)
    setShowWorkflowBuilder(true)
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow)
    setShowWorkflowBuilder(true)
  }

  const handleWorkflowSaved = () => {
    setShowWorkflowBuilder(false)
    setEditingWorkflow(null)
    setActiveTab("workflows")
  }

  const handleBackToWorkflows = () => {
    setShowWorkflowBuilder(false)
    setEditingWorkflow(null)
  }

  const renderContent = () => {
    if (showWorkflowSelector) {
      return (
        <WorkflowSelector
          onSelectWorkflow={handleWorkflowSelected}
          onSelectCanvasWorkflow={handleCanvasWorkflowSelected}
          onCancel={handleOnboardingCancel}
        />
      )
    }

    if (showWorkflowBuilder) {
      return (
        <WorkflowBuilder workflowId={editingWorkflow?.id} onBack={handleBackToWorkflows} onSave={handleWorkflowSaved} />
      )
    }

    switch (activeTab) {
      case "companies":
        return <ERPCompanyList onStartOnboarding={handleStartOnboarding} onViewCompany={handleViewCompany} />
      case "company-details":
        return selectedCompanyId ? (
          <ERPCompanyDetailsPage companyId={selectedCompanyId} onBack={handleBackToCompanies} />
        ) : null
      case "onboarding":
        return selectedWorkflowId ? (
          <DynamicCompanyWizard
            workflowId={selectedWorkflowId}
            companyId={onboardingCompanyId}
            viewMode={viewMode}
            onComplete={handleOnboardingComplete}
            onCancel={handleOnboardingCancel}
          />
        ) : null
      case "workflows":
        return <WorkflowManagement onCreateWorkflow={handleCreateWorkflow} onEditWorkflow={handleEditWorkflow} />
      case "users":
        return <ERPUserManagement />
      case "reports":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Reports</h2>
            <p className="text-muted-foreground">Coming soon - Analytics and reporting</p>
          </div>
        )
      case "settings":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-muted-foreground">Coming soon - System settings</p>
          </div>
        )
      default:
        return <ERPDashboard />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ERPSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:px-8">{renderContent()}</div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <ERPAuthProvider>
      <ProtectedRoute>
        <ERPApp />
      </ProtectedRoute>
    </ERPAuthProvider>
  )
}
