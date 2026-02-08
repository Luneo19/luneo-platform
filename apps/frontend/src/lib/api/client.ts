/**
 * REST API Client - Public & Auth API Layer
 *
 * ARCHITECTURE BOUNDARY:
 * - REST is used for public API, auth flows, Stripe, and external integrations.
 * - tRPC (@/lib/trpc/client.ts) is used for internal dashboard pages.
 *
 * RULE: Auth, billing, webhooks, and public API = REST.
 *       Dashboard CRUD, AI studio, editor = tRPC.
 *       Do NOT duplicate endpoints across both layers.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { LunaResponse, LunaAction, AriaResponse, AriaSuggestion, AgentConversation, NovaResponse } from '@/types/agents';
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
// For production: set NEXT_PUBLIC_API_URL (e.g. https://api.luneo.app)
// For development: falls back to http://localhost:3001
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    // ✅ Tokens are in httpOnly cookies — sent automatically via withCredentials: true
    // No Authorization header needed — backend reads tokens from cookies

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
        // ✅ Refresh token is in httpOnly cookie (sent automatically with withCredentials: true)
        // Backend reads refreshToken from cookie OR body - we send empty body, cookie is sent automatically
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {}, // Empty body - refreshToken is in httpOnly cookie
          { 
            withCredentials: true, // ✅ Required to send httpOnly cookies
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // ✅ New tokens are in httpOnly cookies (set by backend automatically)
        // No need to store in localStorage - cookies are automatically sent with next requests
        // Cookies are automatically sent with retry request via withCredentials: true
        
        // Cleanup any old localStorage tokens (migration from old system)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        
        // Retry original request - cookies will be sent automatically via withCredentials: true
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        // Cookies will be cleared by backend on logout
        if (typeof window !== 'undefined') {
          // Cleanup localStorage (migration from old system)
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // Redirect to login - backend will handle cookie cleanup
          window.location.href = '/login?session=expired';
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
 * Retry logic for 5xx errors and network failures
 * Does NOT retry 4xx (client errors) — only server errors and network failures
 */
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isAxiosErr = axios.isAxiosError(error);
      const status = isAxiosErr ? error.response?.status : undefined;

      // Don't retry client errors (4xx)
      if (status && status >= 400 && status < 500) {
        throw error;
      }

      // Exhausted retries
      if (attempt === retries) {
        throw error;
      }

      // Retry on 5xx or network error (no status = network failure)
      const isRetryable = !status || status >= 500;
      if (!isRetryable) {
        throw error;
      }

      const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry logic exhausted');
}

/**
 * API Client Methods — all methods use automatic retry for 5xx/network errors
 */
export const api = {
  // Generic request method
  request: <T = unknown>(config: AxiosRequestConfig): Promise<T> => {
    return withRetry(() => apiClient.request(config).then(res => res.data));
  },

  // GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return withRetry(() => apiClient.get(url, config).then(res => res.data));
  },

  // POST request
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return withRetry(() => apiClient.post(url, data, config).then(res => res.data));
  },

  // PUT request
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return withRetry(() => apiClient.put(url, data, config).then(res => res.data));
  },

  // PATCH request
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return withRetry(() => apiClient.patch(url, data, config).then(res => res.data));
  },

  // DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return withRetry(() => apiClient.delete(url, config).then(res => res.data));
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
    update: (id: string, data: Record<string, unknown>) => api.put(`/api/v1/users/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/users/${id}`),
  },

  // Settings
  settings: {
    notifications: (preferences: Record<string, unknown>) =>
      api.put<{ success: boolean }>('/api/v1/settings/notifications', preferences),
  },

  // Brands (backend: GET/PUT /brands/settings)
  brands: {
    current: () => api.get('/api/v1/brands/settings'),
    update: (data: Record<string, unknown>) => api.put('/api/v1/brands/settings', data),
    settings: () => api.get('/api/v1/brands/settings'),
    updateSettings: (data: Record<string, unknown>) => api.put('/api/v1/brands/settings', data),
  },

  // Products
  products: {
    list: (params?: { page?: number; limit?: number }) => 
      api.get('/api/v1/products', { params }),
    get: (id: string) => api.get(`/api/v1/products/${id}`),
    create: (data: Record<string, unknown>) => api.post('/api/v1/products', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/api/v1/products/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/products/${id}`),
  },

  // Designs
  designs: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      api.get<DesignSummary[] | { designs: DesignSummary[]; pagination: { hasNext: boolean; total: number } }>('/api/v1/designs', { params }),
    get: (id: string) => api.get<Design>(`/api/v1/designs/${id}`),
    create: (data: Partial<Design>) => api.post<Design>('/api/v1/designs', data),
    delete: (id: string) => api.delete<void>(`/api/v1/designs/${id}`),
  },

  // AI
  ai: {
    generate: (data: { prompt: string; productId: string; options?: Record<string, unknown> }) =>
      api.post<GenerateDesignResponse>('/api/v1/ai/generate', data),
    /** Generation status: param is the job/generation publicId (backend uses :publicId in route). */
    status: (publicId: string) => api.get(`/api/v1/generation/${publicId}/status`),
    upscale: (designId: string) => api.post(`/api/v1/ai/upscale`, { designId }),
    removeBackground: (designId: string) => api.post(`/api/v1/ai/background-removal`, { designId }),
    extractColors: (imageUrl: string) => api.post(`/api/v1/ai/extract-colors`, { imageUrl }),
    smartCrop: (data: { imageUrl: string; aspectRatio: string }) => api.post(`/api/v1/ai/smart-crop`, data),
  },

  // Orders
  orders: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      api.get('/api/v1/orders', { params }),
    get: (id: string) => api.get(`/api/v1/orders/${id}`),
    create: (data: Record<string, unknown>) => api.post('/api/v1/orders', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/api/v1/orders/${id}`, data),
    cancel: (id: string) => api.post(`/api/v1/orders/${id}/cancel`),
    updateStatus: (id: string, status: string) => api.put(`/api/v1/orders/${id}/status`, { status }),
    tracking: (id: string) => api.get(`/api/v1/orders/${id}/tracking`),
    refund: (id: string, reason: string) => api.post(`/api/v1/orders/${id}/refund`, { reason }),
  },

  // Analytics (backend: GET /analytics/dashboard, /revenue, /realtime, designs, orders, etc.)
  analytics: {
    overview: (params?: { period?: string }) =>
      api.get('/api/v1/analytics/dashboard', { params }),
    designs: (params?: { startDate?: string; endDate?: string }) =>
      api.get<{ data: unknown[]; total: number }>('/api/v1/analytics/designs', { params }),
    orders: (params?: { startDate?: string; endDate?: string }) =>
      api.get<{ data: unknown[]; total: number }>('/api/v1/analytics/orders', { params }),
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

  // Credits (AI credits balance, packs, buy)
  credits: {
    balance: () =>
      api.get<{ balance: number; purchased?: number; used?: number }>('/api/v1/credits/balance'),
    packs: () =>
      api.get<{ packs?: Array<{ id: string; name: string; credits: number; price: number; priceCents?: number; stripePriceId?: string; badge?: string; savings?: number }> }>('/api/v1/credits/packs'),
    buy: (data: { packId?: string; packSize?: number }) =>
      api.post<{ success: boolean; url?: string; sessionId?: string; pack?: unknown }>('/api/v1/credits/buy', data),
    transactions: (params?: { limit?: number; offset?: number }) =>
      api.get('/api/v1/credits/transactions', { params }),
  },

  // Billing (list plans: GET /pricing/plans; current: GET /plans/current)
  billing: {
    subscription: () => api.get('/api/v1/billing/subscription'),
    plans: () => api.get('/api/v1/pricing/plans'),
    subscribe: (planId: string, email?: string) => api.post('/api/v1/billing/create-checkout-session', { planId, email }),
    cancel: () => api.post('/api/v1/billing/cancel-downgrade'),
    cancelSubscription: (immediate?: boolean) =>
      api.post<{ success: boolean; message?: string; cancelAt?: string }>('/api/v1/billing/cancel-subscription', { immediate: !!immediate }),
    invoices: () => api.get('/api/v1/billing/invoices'),
    paymentMethods: () => api.get('/api/v1/billing/payment-methods'),
    addPaymentMethod: (paymentMethodId: string) => api.post('/api/v1/billing/payment-methods', { paymentMethodId }),
    removePaymentMethod: () => api.delete('/api/v1/billing/payment-methods'),
    customerPortal: () => api.get('/api/v1/billing/customer-portal'),
    changePlan: (data: { planId: string; billingInterval?: string }) => api.post('/api/v1/billing/change-plan', data),
    previewPlanChange: (planId: string, billingInterval?: string) => 
      api.get('/api/v1/billing/preview-plan-change', { params: { planId, billingInterval } }),
    scheduledChanges: () => api.get('/api/v1/billing/scheduled-changes'),
  },

  // Notifications (backend: GET list, POST :id/read, POST read-all, DELETE :id)
  notifications: {
    list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      api.get<{ notifications: unknown[]; pagination: { total: number } }>('/api/v1/notifications', { params }),
    markAsRead: (id: string) => api.post(`/api/v1/notifications/${id}/read`, {}),
    markAllAsRead: () => api.post('/api/v1/notifications/read-all', {}),
    delete: (id: string) => api.delete(`/api/v1/notifications/${id}`),
  },

  // Security & GDPR
  security: {
    exportData: () => api.get<Blob | { url?: string; data?: unknown }>('/api/v1/security/gdpr/export'),
    deleteAccount: (data: { password: string; reason?: string }) =>
      api.delete<{ success: boolean; message?: string }>('/api/v1/security/gdpr/delete-account', { data }),
    sessions: () =>
      api.get<Array<{ id: string; device?: string; browser?: string; location?: string; ip?: string; lastActive?: string; current?: boolean }>>('/api/v1/security/sessions'),
    revokeSession: (sessionId: string) =>
      api.delete<void>(`/api/v1/security/sessions/${sessionId}`),
  },

  // Integrations
  integrations: {
    list: () => api.get('/api/v1/integrations'),
    enable: (type: string, config: Record<string, unknown>) => api.post(`/api/v1/integrations/${type}/enable`, config),
    disable: (type: string) => api.delete(`/api/v1/integrations/${type}`),
    test: (type: string, config: Record<string, unknown>) => api.post(`/api/v1/integrations/${type}/test`, config),
  },

  // Team
  team: {
    members: () => api.get('/api/v1/team'),
    invite: (email: string, role: string) => api.post('/api/v1/team/invite', { email, role }),
    invites: () => api.get('/api/v1/team/invite'),
    cancelInvite: (id: string) => api.delete(`/api/v1/team/invite/${id}`),
    get: (id: string) => api.get(`/api/v1/team/${id}`),
    update: (id: string, data: Record<string, unknown>) => api.put(`/api/v1/team/${id}`, data),
    remove: (userId: string) => api.delete(`/api/v1/team/${userId}`),
  },

  // Public API
  publicApi: {
    keys: {
      list: () => api.get('/api/v1/api-keys'),
      create: (data: Record<string, unknown>) => api.post('/api/v1/api-keys', data),
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

  // Marketplace (templates listing, detail, reviews)
  marketplace: {
    templates: (params?: Record<string, unknown>) =>
      api.get<{ items?: unknown[]; templates?: unknown[] }>('/api/v1/marketplace/templates', { params }),
    template: (slug: string) => api.get(`/api/v1/marketplace/templates/${encodeURIComponent(slug)}`),
    reviews: (templateId: string) =>
      api.get<{ reviews?: unknown[]; items?: unknown[] }>(`/api/v1/marketplace/templates/${templateId}/reviews`),
  },

  // AI Studio (3D templates, etc.)
  aiStudio: {
    templates: () => api.get<{ templates?: unknown[]; data?: unknown[] }>('/api/v1/ai-studio/templates'),
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
        options?: Record<string, unknown>;
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
      chat: (data: { message: string; brandId?: string; userId?: string; context?: unknown }) =>
        api.post<{ success: boolean; data: NovaResponse }>('/api/v1/agents/nova/chat', data),
      faq: (query: string, limit?: number) =>
        api.get<{ success: boolean; data: Array<{ id: string; title: string; slug: string; content: string }> }>(`/api/v1/agents/nova/faq?query=${encodeURIComponent(query)}&limit=${limit || 5}`),
      ticket: (data: { subject: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent'; category?: 'TECHNICAL' | 'BILLING' | 'FEATURE' | 'OTHER' }) =>
        api.post<{ success: boolean; data: { id: string; ticketNumber: string } }>('/api/v1/agents/nova/ticket', data),
    },
  },
};

export default api;
export type { AuthSessionResponse, GenerateDesignResponse };