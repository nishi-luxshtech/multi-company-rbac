/**
 * HTTP Client Service for Dynamic Workflow APIs
 * Centralized HTTP client with authentication, error handling, and interceptors
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios"
import { API_CONFIG, getFullUrl } from "./config"

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
    const url = getFullUrl(endpoint)
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = getFullUrl(endpoint)
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = getFullUrl(endpoint)
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const url = getFullUrl(endpoint)
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const url = getFullUrl(endpoint)
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

// Singleton instance
export const apiClient = new ApiClient()