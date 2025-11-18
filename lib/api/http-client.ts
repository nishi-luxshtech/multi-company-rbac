/**
 * HTTP Client Service for Dynamic Workflow APIs
 * Centralized HTTP client with authentication, error handling, and interceptors
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios"
import { API_CONFIG } from "./config"

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

export class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAuthToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
          console.log("Request with token:", config.url)
        } else {
          console.warn("No auth token found for request:", config.url)
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor: Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401/403 errors - token might be invalid or expired
        if (error.response?.status === 401 || error.response?.status === 403) {
          const errorMessage = error.response?.data as any
          const errorDetail = errorMessage?.detail || errorMessage?.message || ""
          const errorLower = errorDetail.toLowerCase()
          
          // Check for various authentication error messages
          if (
            errorLower.includes("token") || 
            errorLower.includes("invalid") || 
            errorLower.includes("expired") ||
            errorLower.includes("not authenticated") ||
            errorLower.includes("authentication") ||
            errorDetail === "Not authenticated"
          ) {
            // Clear invalid token
            if (typeof window !== "undefined") {
              console.warn("Authentication error detected, clearing token and redirecting to login")
              localStorage.removeItem("auth_token")
              localStorage.removeItem("user")
              // Redirect to login if not already there
              if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
                setTimeout(() => {
                  window.location.href = "/"
                }, 1000)
              }
            }
          }
        }
        return Promise.reject(this.handleError(error))
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data as any

      return {
        message: data?.detail || data?.message || "An error occurred",
        status,
        code: data?.code,
        details: data,
      }
    } else if (error.request) {
      // Request made but no response received
      return {
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
      }
    } else {
      // Something else happened
      return {
        message: error.message || "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      }
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const url = this.buildUrl(endpoint)
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  /**
   * Build the correct URL for the request
   * Since axios has baseURL set, we need to return relative paths
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
    
    // If endpoint already includes /api/v1, use it as-is (relative to baseURL)
    if (cleanEndpoint.startsWith("api/")) {
      return `/${cleanEndpoint}`
    }
    
    // Auth endpoints are at root level (no /api/v1 prefix)
    if (cleanEndpoint.startsWith("auth/")) {
      return `/${cleanEndpoint}`
    }
    
    // Workflow builder endpoints and workflows endpoints are at root level (no /api/v1 prefix)
    if (cleanEndpoint.startsWith("workflows/builder") || cleanEndpoint.startsWith("workflows/")) {
      return `/${cleanEndpoint}`
    }
    
    // Other endpoints need /api/v1 prefix (relative to baseURL)
    return `/api/${API_CONFIG.apiVersion}/${cleanEndpoint}`
  }
}

// Singleton instance
export const apiClient = new ApiClient()