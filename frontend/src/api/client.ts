// frontend/src/api/client.ts
// API client with interceptors and error handling

import type { ApiError } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      });
    }
    return url.toString();
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      credentials: 'include',
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse response
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
      const error: ApiError = {
        error: data?.error || 'An error occurred',
        code: data?.code || 'ERROR',
        details: data?.details,
      };
      throw new ApiClientError(error, response.status);
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  }

  async patch<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  }

  async put<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  }

  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }

  // File upload
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      const error: ApiError = {
        error: data?.error || 'Upload failed',
        code: data?.code || 'UPLOAD_ERROR',
      };
      throw new ApiClientError(error, response.status);
    }

    return response.json();
  }
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: ApiError['details'];

  constructor(error: ApiError, status: number) {
    super(error.error);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

export const api = new ApiClient(API_URL);

// Helper function to handle API errors in components
export function handleApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.details && error.details.length > 0) {
      return error.details.map(d => `${d.field}: ${d.message}`).join(', ');
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}