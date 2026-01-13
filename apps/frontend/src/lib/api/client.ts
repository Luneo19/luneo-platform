import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { LunaResponse, LunaAction, AriaResponse, AriaSuggestion, AgentConversation } from '@/types/agents';
import type { Design, DesignSummary, LoginCredentials, RegisterData, User } from '@/lib/types';
import { logger } from '@/lib/logger';

interface AuthSessionResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  requires2FA?: boolean;
  tempToken?: string;
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
// IMPORTANT: Do NOT include /api in NEXT_PUBLIC_API_URL - endpoints already include /api/v1
// For production: NEXT_PUBLIC_API_URL=https://api.luneo.app
// For development: NEXT_PUBLIC_API_URL=http://localhost:3001
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.luneo.app' // Fallback for production
    : 'http://localhost:3001'); // Fallback for development

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
          `${API_BASE_URL}/api/v1/auth/refresh`,
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
    setup2FA: () => api.post<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>('/api/v1/auth/2fa/setup'),
    verify2FA: (token: string) => api.post<{ message: string; backupCodes: string[] }>('/api/v1/auth/2fa/verify', { token }),
    disable2FA: () => api.post<{ message: string }>('/api/v1/auth/2fa/disable'),
    loginWith2FA: (tempToken: string, token: string) => 
      api.post<AuthSessionResponse>('/api/v1/auth/login/2fa', { tempToken, token }),
    oauth: {
      google: () => api.get('/api/v1/auth/google'),
      github: () => api.get('/api/v1/auth/github'),
    },
  },

  // Users
  users: {
    list: (params?: { page?: number; limit?: number }) => 
      api.get('/api/v1/users', { params }),
    get: (id: string) => api.get(`/api/v1/users/${id}`),
    update: (id: string, data: any) => api.put(`/api/v1/users/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/users/${id}`),
  },

  // Brands
  brands: {
    current: () => api.get('/api/v1/brands/current'),
    update: (data: any) => api.put('/api/v1/brands/current', data),
    settings: () => api.get('/api/v1/brands/settings'),
    updateSettings: (data: any) => api.put('/api/v1/brands/settings', data),
  },

  // Products
  products: {
    list: (params?: { page?: number; limit?: number }) => 
      api.get('/api/v1/products', { params }),
    get: (id: string) => api.get(`/api/v1/products/${id}`),
    create: (data: any) => api.post('/api/v1/products', data),
    update: (id: string, data: any) => api.put(`/api/v1/products/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/products/${id}`),
  },

  // Designs
  designs: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      api.get<DesignSummary[]>('/api/v1/designs', { params }),
    get: (id: string) => api.get<Design>(`/api/v1/designs/${id}`),
    create: (data: Partial<Design>) => api.post<Design>('/api/v1/designs', data),
    delete: (id: string) => api.delete<void>(`/api/v1/designs/${id}`),
  },

  // AI
  ai: {
    generate: (data: { prompt: string; productId: string; options?: Record<string, unknown> }) =>
      api.post<GenerateDesignResponse>('/api/v1/ai/generate', data),
    status: (jobId: string) => api.get(`/api/v1/ai/status/${jobId}`),
  },

  // Orders
  orders: {
    list: (params?: { page?: number; limit?: number; status?: string }) => 
      api.get('/api/v1/orders', { params }),
    get: (id: string) => api.get(`/api/v1/orders/${id}`),
    create: (data: any) => api.post('/api/v1/orders', data),
    update: (id: string, data: any) => api.put(`/api/v1/orders/${id}`, data),
  },

  // Analytics
  analytics: {
    overview: () => api.get('/api/v1/analytics/overview'),
    designs: (params?: { startDate?: string; endDate?: string }) => 
      api.get('/api/v1/analytics/designs', { params }),
    orders: (params?: { startDate?: string; endDate?: string }) => 
      api.get('/api/v1/analytics/orders', { params }),
    revenue: (params?: { startDate?: string; endDate?: string }) => 
      api.get('/api/v1/analytics/revenue', { params }),
    export: {
      csv: (params: { metrics: string; timeRange: string; startDate?: string; endDate?: string }) =>
        api.get('/api/v1/analytics/export/csv', { params }),
      excel: (params: { metrics: string; timeRange: string; startDate?: string; endDate?: string }) =>
        api.get('/api/v1/analytics/export/excel', { params }),
      pdf: (params: { metrics: string; timeRange: string; startDate?: string; endDate?: string }) =>
        api.get('/api/v1/analytics/export/pdf', { params }),
    },
  },

  // Billing
  billing: {
    subscription: () => api.get('/api/v1/billing/subscription'),
    plans: () => api.get('/api/v1/billing/plans'),
    subscribe: (planId: string) => api.post('/api/v1/billing/subscribe', { planId }),
    cancel: () => api.post('/api/v1/billing/cancel'),
    invoices: () => api.get('/api/v1/billing/invoices'),
    paymentMethods: () => api.get('/api/v1/billing/payment-methods'),
  },

  // Integrations
  integrations: {
    list: () => api.get('/api/v1/integrations'),
    enable: (type: string, config: any) => api.post(`/api/v1/integrations/${type}/enable`, config),
    disable: (type: string) => api.delete(`/api/v1/integrations/${type}`),
    test: (type: string, config: any) => api.post(`/api/v1/integrations/${type}/test`, config),
  },

  // Team
  team: {
    members: () => api.get('/api/v1/team/members'),
    invite: (email: string, role: string) => api.post('/api/v1/team/invite', { email, role }),
    remove: (userId: string) => api.delete(`/api/v1/team/members/${userId}`),
    updateRole: (userId: string, role: string) => api.put(`/api/v1/team/members/${userId}/role`, { role }),
  },

  // Public API
  publicApi: {
    keys: {
      list: () => api.get('/api/v1/api-keys'),
      create: (data: any) => api.post('/api/v1/api-keys', data),
      delete: (id: string) => api.delete(`/api/v1/api-keys/${id}`),
      regenerate: (id: string) => api.post(`/api/v1/api-keys/${id}/regenerate`),
    },
    webhooks: {
      list: () => api.get('/api/v1/webhooks'),
      get: (id: string) => api.get(`/api/v1/webhooks/${id}`),
      create: (data: {
        name: string;
        url: string;
        secret?: string;
        events: string[];
        isActive?: boolean;
      }) => api.post('/api/v1/webhooks', data),
      update: (id: string, data: {
        name?: string;
        url?: string;
        secret?: string;
        events?: string[];
        isActive?: boolean;
      }) => api.put(`/api/v1/webhooks/${id}`, data),
      delete: (id: string) => api.delete(`/api/v1/webhooks/${id}`),
      test: (url: string, secret?: string) =>
        api.post('/api/v1/webhooks/test', { url, secret }),
      logs: (id: string, params?: { page?: number; limit?: number }) =>
        api.get(`/api/v1/webhooks/${id}/logs`, { params }),
      history: (params?: { page?: number; limit?: number }) =>
        api.get('/api/v1/webhooks/history', { params }),
      retry: (logId: string) => api.post(`/api/v1/webhooks/${logId}/retry`),
    },
  },

  // Webhooks (alias direct pour compatibilité)
  webhooks: {
    list: () => api.get('/api/v1/webhooks'),
    get: (id: string) => api.get(`/api/v1/webhooks/${id}`),
    create: (data: {
      name: string;
      url: string;
      secret?: string;
      events: string[];
      isActive?: boolean;
    }) => api.post('/api/v1/webhooks', data),
    update: (id: string, data: {
      name?: string;
      url?: string;
      secret?: string;
      events?: string[];
      isActive?: boolean;
    }) => api.put(`/api/v1/webhooks/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/webhooks/${id}`),
    test: (url: string, secret?: string) =>
      api.post('/api/v1/webhooks/test', { url, secret }),
    logs: (id: string, params?: { page?: number; limit?: number }) =>
      api.get(`/api/v1/webhooks/${id}/logs`, { params }),
    history: (params?: { page?: number; limit?: number }) =>
      api.get('/api/v1/webhooks/history', { params }),
    retry: (logId: string) => api.post(`/api/v1/webhooks/${logId}/retry`),
  },

  // Admin
  admin: {
    metrics: () => api.get('/api/v1/admin/metrics'),
    aiCosts: (period?: string) => api.get('/api/v1/admin/ai/costs', { params: { period } }),
    addBlacklistedPrompt: (term: string) => api.post('/api/v1/admin/ai/blacklist', { term }),
    customers: {
      bulkAction: (data: {
        customerIds: string[];
        action: 'email' | 'export' | 'tag' | 'segment' | 'delete';
        options?: Record<string, any>;
      }) => api.post('/api/v1/admin/customers/bulk-action', data),
    },
  },

  // Agents
  agents: {
    luna: {
      chat: (data: { message: string; conversationId?: string; context?: unknown }) =>
        api.post<{ success: boolean; data: LunaResponse }>('/api/v1/agents/luna/chat', data),
      action: (data: { action: LunaAction }) =>
        api.post<{ success: boolean; data: unknown }>('/api/v1/agents/luna/action', data),
      conversations: () =>
        api.get<{ success: boolean; data: { conversations: AgentConversation[] } }>('/api/v1/agents/luna/conversations'),
      conversationMessages: (conversationId: string) =>
        api.get<{ success: boolean; data: { conversationId: string; messages: Array<{ role: string; content: string; createdAt: string }> } }>(`/api/v1/agents/luna/conversations/${conversationId}`),
    },
    aria: {
      chat: (data: { sessionId: string; productId: string; message: string; context?: unknown }) =>
        api.post<{ success: boolean; data: AriaResponse }>('/api/v1/agents/aria/chat', data),
      quickSuggest: (productId: string, occasion: string, language?: string) =>
        api.get<{ success: boolean; data: AriaSuggestion[] }>(`/api/v1/agents/aria/quick-suggest?productId=${productId}&occasion=${occasion}&language=${language || 'fr'}`),
      improveText: (data: { text: string; style: string; language?: string; productId?: string }) =>
        api.post<{ success: boolean; data: { original: string; improved: string; variations: string[] } }>('/api/v1/agents/aria/improve', data),
      recommendStyle: (data: { text: string; occasion: string; productType?: string }) =>
        api.post<{ success: boolean; data: Array<{ font: string; color: string; reason: string }> }>('/api/v1/agents/aria/recommend-style', data),
      translate: (data: { text: string; targetLanguage: string; sourceLanguage?: string }) =>
        api.post<{ success: boolean; data: { original: string; translated: string; sourceLanguage: string; targetLanguage: string } }>('/api/v1/agents/aria/translate', data),
      spellCheck: (data: { text: string; language?: string }) =>
        api.post<{ success: boolean; data: { original: string; corrected: string; errors: Array<{ word: string; suggestion: string; position: number }> } }>('/api/v1/agents/aria/spell-check', data),
      giftIdeas: (data: { occasion: string; recipient: string; budget?: string; preferences?: string }) =>
        api.post<{ success: boolean; data: Array<{ idea: string; product: string; personalization: string; reason: string }> }>('/api/v1/agents/aria/gift-ideas', data),
    },
    nova: {
      chat: (data: { message: string }) =>
        api.post<{ success: boolean; data: { message: string; intent: string; resolved: boolean; ticketId?: string; articles?: Array<{ id: string; title: string; url: string }>; escalated: boolean } }>('/api/v1/agents/nova/chat', data),
      faq: (query: string, limit?: number) =>
        api.get<{ success: boolean; data: Array<{ id: string; title: string; slug: string; content: string }> }>(`/api/v1/agents/nova/faq?query=${encodeURIComponent(query)}&limit=${limit || 5}`),
      ticket: (data: { subject: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent'; category?: 'TECHNICAL' | 'BILLING' | 'FEATURE' | 'OTHER' }) =>
        api.post<{ success: boolean; data: { id: string; ticketNumber: string } }>('/api/v1/agents/nova/ticket', data),
    },
  },
};

export default api;
export type { AuthSessionResponse, GenerateDesignResponse };