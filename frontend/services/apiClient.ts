import { apiConfig } from '@/config/api';
import type { ApiError } from '@/types';

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: typeof apiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout;
  }

  private getErrorMessage(error: any): string {
    if (error.name === 'AbortError') {
      return 'Request timed out. Please try again.';
    }
    
    if (!navigator.onLine) {
      return 'No internet connection.';
    }
    
    if (error.response?.status) {
      const status = error.response.status;
      
      if (status >= 500) {
        return 'Server error. Please try again later.';
      }
      
      if (status >= 400) {
        // Try to get error message from response body
        const errorData = error.response.data;
        if (errorData?.message) {
          return errorData.message;
        }
        if (errorData?.detail) {
          return errorData.detail;
        }
        return `Request failed with status ${status}`;
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 409) {
          // Idempotency key conflict - return the existing order
          const data = await response.json();
          return data as T; // Return the existing order data
        }
        const errorData: ApiError = await response.json();
        const error = new Error(this.getErrorMessage({ response, data: errorData }));
        throw error;
      }

      const data = await response.json();
      
      // Some endpoints (e.g. categories) return raw arrays/objects
      // without the {success, data} wrapper. Only check success
      // if the response is a wrapped object with a success field.
      if (data !== null && typeof data === 'object' && !Array.isArray(data) && 'success' in data) {
        if (!data.success) {
          throw new Error(data.message || 'API request failed');
        }
        return data;
      }

      // For raw responses, return them as-is
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(this.getErrorMessage({ name: 'AbortError' }));
      }
      
      const errorMessage = this.getErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== false) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(apiConfig);
