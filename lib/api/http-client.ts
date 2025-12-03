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
    // Normalize baseURL - remove trailing slashes and spaces
    const normalizedBaseURL = API_CONFIG.baseURL.trim().replace(/\/+$/, "")
    
    this.client = axios.create({
      baseURL: normalizedBaseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("[ApiClient] Initialized with baseURL:", normalizedBaseURL)
    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAuthToken()
        const fullUrl = `${config.baseURL || ""}${config.url || ""}`
        const params = config.params ? `?${new URLSearchParams(config.params as any).toString()}` : ""
        const urlWithParams = `${fullUrl}${params}`
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
          console.log(`[API Request] ${config.method?.toUpperCase()} ${urlWithParams}`, {
            hasAuth: true,
            params: config.params,
            data: config.data,
            dataSize: config.data ? JSON.stringify(config.data).length : 0,
          })
        } else {
          console.warn(`[API Request] ${config.method?.toUpperCase()} ${urlWithParams} - No auth token`, {
            params: config.params,
            data: config.data,
          })
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
    // Log detailed error information for debugging
    console.error("API Error Details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      request: error.request ? "Request sent but no response" : "No request sent",
    })

    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data as any
      
      // Extract detailed error message
      let errorMessage = "An error occurred"
      if (data?.detail) {
        // Handle Pydantic validation errors (array format)
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => {
            const loc = err.loc ? err.loc.join(".") : ""
            return `${loc}: ${err.msg}`
          }).join("; ")
        } else if (typeof data.detail === "string") {
          errorMessage = data.detail
        } else if (typeof data.detail === "object") {
          errorMessage = JSON.stringify(data.detail)
        }
      } else if (data?.message) {
        errorMessage = data.message
      } else if (typeof data === "string") {
        errorMessage = data
      }

      return {
        message: errorMessage,
        status,
        code: data?.code || `HTTP_${status}`,
        details: data,
      }
    } else if (error.request) {
      // Request made but no response received
      // Check for specific error codes
      let errorMessage = "Network error. Please check your connection."
      let errorCode = "NETWORK_ERROR"
      
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMessage = "Request timeout. The server took too long to respond. Please try again."
        errorCode = "TIMEOUT_ERROR"
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Network error. Unable to reach the server. Please check if the server is running."
        errorCode = "NETWORK_ERROR"
      } else if (error.code === "ERR_CANCELED") {
        errorMessage = "Request was canceled."
        errorCode = "CANCELED_ERROR"
      }
      
      console.error("Network error details:", {
        code: error.code,
        message: error.message,
        url: error.config?.url,
        timeout: error.config?.timeout,
      })

      return {
        message: errorMessage,
        code: errorCode,
        details: {
          originalError: error.message,
          errorCode: error.code,
          url: error.config?.url,
        },
      }
    } else {
      // Something else happened
      return {
        message: error.message || "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
        details: {
          originalError: error.message,
        },
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