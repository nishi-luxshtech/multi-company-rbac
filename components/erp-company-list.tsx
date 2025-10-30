"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react"
import { companyAPI, type Company } from "@/lib/api-services"
import { storageService } from "@/lib/storage-service"
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
import { ERPCompanyDetails } from "@/components/erp-company-details"

interface ERPCompanyListProps {
  onStartOnboarding: (companyId?: number) => void
  onViewCompany?: (companyId: number) => void
}

export function ERPCompanyList({ onStartOnboarding, onViewCompany }: ERPCompanyListProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | string | null>(null)
  const [error, setError] = useState<string>("")
  const [isPermissionError, setIsPermissionError] = useState(false)

  useEffect(() => {
    loadCompanies()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "companies" || e.key === "workflow-companies") {
        console.log("Storage changed, reloading companies...")
        loadCompanies()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, []) // Added empty dependency array to prevent infinite loop

  useEffect(() => {
    // Filter companies based on search query
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredCompanies(
        companies.filter(
          (company) =>
            company.company_name.toLowerCase().includes(query) ||
            company.company_code?.toLowerCase().includes(query) ||
            company.country?.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, companies])

  const loadCompanies = async () => {
    try {
      setError("")
      setIsPermissionError(false)
      console.log("Loading companies from API and localStorage...")

      const apiCompanies = await companyAPI.getAll()
      console.log("API companies:", apiCompanies.length)

      const localCompanies = storageService.getCompanies()
      console.log("localStorage companies:", localCompanies.length)

      const allCompanies = [...apiCompanies]

      localCompanies.forEach((localCompany) => {
        const exists = apiCompanies.some((apiCompany) => apiCompany.id === localCompany.id)
        if (!exists) {
          allCompanies.push({
            id: localCompany.id,
            company_name: localCompany.name,
            company_code: localCompany.id,
            country: "N/A",
            is_complete: true,
            onboarding_step: 9,
            form_of_business: "Workflow Created",
            accounting_currency: "N/A",
            is_active: true,
          } as Company)
        }
      })

      console.log("Total companies (API + localStorage):", allCompanies.length)
      setCompanies(allCompanies)
      setFilteredCompanies(allCompanies)
    } catch (error: any) {
      console.error("Failed to load companies:", error)

      if (error.response?.status === 403) {
        setIsPermissionError(true)
        setError("You don't have permission to view companies. Please contact your administrator.")
      } else {
        setError(error.response?.data?.detail || error.message || "Failed to load companies from API")

        const localCompanies = storageService.getCompanies()
        if (localCompanies.length > 0) {
          console.log("API failed, showing localStorage companies only:", localCompanies.length)
          const companies = localCompanies.map(
            (localCompany) =>
              ({
                id: localCompany.id,
                company_name: localCompany.name,
                company_code: localCompany.id,
                country: "N/A",
                is_complete: true,
                onboarding_step: 9,
                form_of_business: "Workflow Created",
                accounting_currency: "N/A",
                is_active: true,
              }) as Company,
          )
          setCompanies(companies)
          setFilteredCompanies(companies)
          setError("") // Clear error if we have localStorage companies
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (companyId: number) => {
    if (onViewCompany) {
      onViewCompany(companyId)
    } else {
      setSelectedCompanyId(companyId)
      setShowDetailsDialog(true)
    }
  }

  const handleDelete = async () => {
    if (!deleteCompanyId) return

    try {
      console.log("Deleting company", deleteCompanyId)

      // Check if it's a workflow company (string ID) or API company (number ID)
      if (typeof deleteCompanyId === "string") {
        // Workflow company - delete from localStorage
        storageService.deleteWorkflowCompany(deleteCompanyId)
        console.log("Deleted workflow company from localStorage:", deleteCompanyId)
      } else {
        // API company - delete via API
        await companyAPI.delete(deleteCompanyId)
        console.log("Deleted API company:", deleteCompanyId)
      }

      // Reload companies list
      await loadCompanies()
      setDeleteCompanyId(null)
    } catch (error) {
      console.error("Failed to delete company:", error)
      // Even if API fails, try to remove from localStorage
      if (typeof deleteCompanyId === "string") {
        storageService.deleteWorkflowCompany(deleteCompanyId)
        await loadCompanies()
        setDeleteCompanyId(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Company Management</h1>
            <p className="text-muted-foreground text-pretty">Manage and onboard companies</p>
          </div>
          {!isPermissionError && (
            <Button onClick={() => onStartOnboarding()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Company
            </Button>
          )}
        </div>
        <Card className={isPermissionError ? "border-destructive" : ""}>
          <CardContent className="py-12">
            <div className="text-center">
              {isPermissionError ? (
                <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-destructive" />
              ) : (
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
              )}
              <p className="text-lg font-medium mb-1 text-destructive">
                {isPermissionError ? "Access Denied" : "Failed to Load Companies"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              {!isPermissionError && (
                <Button onClick={loadCompanies} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">Company Management</h1>
          <p className="text-muted-foreground text-pretty">Manage and onboard companies</p>
        </div>
        <Button onClick={() => onStartOnboarding()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Company
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, code, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Company List */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">{searchQuery ? "No companies found" : "No companies yet"}</p>
              <p className="text-sm">
                {searchQuery ? "Try adjusting your search query" : "Get started by adding your first company"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.company_name}</CardTitle>
                      <CardDescription className="text-xs">{company.company_code || "No code"}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Badge */}
                <div>
                  {company.is_complete ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Step {company.onboarding_step || 1}/9
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {company.country && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Country:</span>
                      <span className="font-medium truncate ml-2">{company.country}</span>
                    </div>
                  )}
                  {company.form_of_business && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Type:</span>
                      <span className="font-medium truncate ml-2">{company.form_of_business}</span>
                    </div>
                  )}
                  {company.accounting_currency && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-medium">{company.accounting_currency}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => handleViewDetails(company.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => onStartOnboarding(company.id)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive bg-transparent"
                    onClick={() => setDeleteCompanyId(company.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Details Dialog */}
      {!onViewCompany && selectedCompanyId && (
        <ERPCompanyDetails
          companyId={selectedCompanyId}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onEdit={onStartOnboarding}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCompanyId !== null} onOpenChange={() => setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
