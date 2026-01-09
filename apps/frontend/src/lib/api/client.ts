import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { Design, DesignSummary, LoginCredentials, RegisterData, User } from '@/lib/types';
import { logger } from '@/lib/logger';

interface AuthSessionResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

interface GenerateDesignResponse {
  designId?: string;
  [key: string]: unknown;
}

/**
 * API Client Configuration
 * Professional enterprise-grade API client with interceptors, error handling, and retry logic
 */

// API Base URL
// Use NEXT_PUBLIC_API_URL from environment variables
// Fallback to localhost for development only
// In production, NEXT_PUBLIC_API_URL must be configured in Vercel
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? null // Should be configured in Vercel - this will cause errors if not set
    : 'http://localhost:3001');

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ IMPORTANT: Required for httpOnly cookies
});

/**
 * Request Interceptor
 * Add authentication token and common headers
 */
apiClient.interceptors.request.use(
  (config) => {
    // ✅ Tokens are now in httpOnly cookies
    // Cookies are automatically sent with each request via withCredentials: true
    // No need to manually add Authorization header - backend reads from cookies first
    // Keep Authorization header as fallback for backward compatibility during migration
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') // Fallback only during migration
      : null;
    
    // Only add Authorization header as fallback if token available in localStorage
    // Primary method is httpOnly cookies (sent automatically)
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp
    config.headers['X-Request-Time'] = new Date().toISOString();

    // Add brand context if available
    const brandId = typeof window !== 'undefined' ? localStorage.getItem('brandId') : null;
    if (brandId) {
      config.headers['X-Brand-Id'] = brandId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle errors, token refresh, and logging
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the access token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // New tokens are in httpOnly cookies (set by backend)
        // No need to store in localStorage
        // Cookies are automatically sent with retry request via withCredentials: true
        
        // Retry original request - cookies will be sent automatically
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        // Cookies are cleared by backend on logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken'); // Cleanup fallback
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      logger.warn('Access forbidden', {
        url: originalRequest.url,
        method: originalRequest.method,
        status: error.response.status,
        data: error.response.data,
      });
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      logger.warn('Rate limit exceeded', {
        url: originalRequest.url,
        method: originalRequest.method,
        retryAfter,
      });
    }

    // Handle 500+ Server Errors
    if (error.response?.status && error.response.status >= 500) {
      logger.error('Server error', {
        url: originalRequest.url,
        method: originalRequest.method,
        status: error.response.status,
        data: error.response.data,
      });
    }

    return Promise.reject(error);
  }
);

/**
 * API Client Methods
 */
export const api = {
  // Generic request method
  request: <T = any>(config: AxiosRequestConfig): Promise<T> => {
    return apiClient.request(config).then(res => res.data);
  },

  // GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get(url, config).then(res => res.data);
  },

  // POST request
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post(url, data, config).then(res => res.data);
  },

  // PUT request
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put(url, data, config).then(res => res.data);
  },

  // PATCH request
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch(url, data, config).then(res => res.data);
  },

  // DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete(url, config).then(res => res.data);
  },
};

/**
 * Type-safe API endpoints
 */
export const endpoints = {
  // Auth
  auth: {
    login: (credentials: LoginCredentials) =>
      api.post<AuthSessionResponse>('/api/v1/auth/login', credentials),
    signup: (data: RegisterData) =>
      api.post<AuthSessionResponse>('/api/v1/auth/signup', data),
    register: (data: RegisterData) =>
      api.post<AuthSessionResponse>('/api/v1/auth/signup', data),
    logout: () => api.post<void>('/api/v1/auth/logout'),
    me: () => api.get<User>('/api/v1/auth/me'),
    refresh: (refreshToken: string) => api.post('/api/v1/auth/refresh', { refreshToken }),
    forgotPassword: (email: string) => api.post('/api/v1/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => 
      api.post('/api/v1/auth/reset-password', { token, password }),
    verifyEmail: (token: string) => 
      api.post<{ message: string; verified: boolean }>('/api/v1/auth/verify-email', { token }),
    oauth: {
      google: () => api.get('/api/v1/auth/google'),
      github: () => api.get('/api/v1/auth/github'),
    },
  },

  // Users
  users: {
    list: (params?: { page?: number; limit?: number }) => 
      api.get('/users', { params }),
    get: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
  },

  // Brands
  brands: {
    current: () => api.get('/brands/current'),
    update: (data: any) => api.put('/brands/current', data),
    settings: () => api.get('/brands/settings'),
    updateSettings: (data: any) => api.put('/brands/settings', data),
  },

  // Products
  products: {
    list: (params?: { page?: number; limit?: number }) => 
      api.get('/products', { params }),
    get: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
  },

  // Designs
  designs: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      api.get<DesignSummary[]>('/designs', { params }),
    get: (id: string) => api.get<Design>(`/designs/${id}`),
    create: (data: Partial<Design>) => api.post<Design>('/designs', data),
    delete: (id: string) => api.delete<void>(`/designs/${id}`),
  },

  // AI
  ai: {
    generate: (data: { prompt: string; productId: string; options?: Record<string, unknown> }) =>
      api.post<GenerateDesignResponse>('/ai/generate', data),
    status: (jobId: string) => api.get(`/ai/status/${jobId}`),
  },

  // Orders
  orders: {
    list: (params?: { page?: number; limit?: number; status?: string }) => 
      api.get('/orders', { params }),
    get: (id: string) => api.get(`/orders/${id}`),
    create: (data: any) => api.post('/orders', data),
    update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  },

  // Analytics
  analytics: {
    overview: () => api.get('/analytics/overview'),
    designs: (params?: { startDate?: string; endDate?: string }) => 
      api.get('/analytics/designs', { params }),
    orders: (params?: { startDate?: string; endDate?: string }) => 
      api.get('/analytics/orders', { params }),
    revenue: (params?: { startDate?: string; endDate?: string }) => 
      api.get('/analytics/revenue', { params }),
  },

  // Billing
  billing: {
    subscription: () => api.get('/billing/subscription'),
    plans: () => api.get('/billing/plans'),
    subscribe: (planId: string) => api.post('/billing/subscribe', { planId }),
    cancel: () => api.post('/billing/cancel'),
    invoices: () => api.get('/billing/invoices'),
    paymentMethods: () => api.get('/billing/payment-methods'),
  },

  // Integrations
  integrations: {
    list: () => api.get('/integrations'),
    enable: (type: string, config: any) => api.post(`/integrations/${type}/enable`, config),
    disable: (type: string) => api.delete(`/integrations/${type}`),
    test: (type: string, config: any) => api.post(`/integrations/${type}/test`, config),
  },

  // Team
  team: {
    members: () => api.get('/team/members'),
    invite: (email: string, role: string) => api.post('/team/invite', { email, role }),
    remove: (userId: string) => api.delete(`/team/members/${userId}`),
    updateRole: (userId: string, role: string) => api.put(`/team/members/${userId}/role`, { role }),
  },

  // Public API
  publicApi: {
    keys: {
      list: () => api.get('/api-keys'),
      create: (data: any) => api.post('/api-keys', data),
      delete: (id: string) => api.delete(`/api-keys/${id}`),
      regenerate: (id: string) => api.post(`/api-keys/${id}/regenerate`),
    },
    webhooks: {
      history: (params?: { page?: number; limit?: number }) => 
        api.get('/webhooks/history', { params }),
      test: (url: string, secret?: string) => 
        api.post('/webhooks/test', { url, secret }),
    },
  },
};

export default api;
export type { AuthSessionResponse, GenerateDesignResponse };