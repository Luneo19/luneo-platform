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
//
// ARCHITECTURE:
//   In the BROWSER on production (HTTPS), we use RELATIVE URLs ("").
//   This sends requests to the same origin (luneo.app), where:
//     - Auth routes (/api/v1/auth/*) hit our Next.js API proxy routes (cookie forwarding)
//     - All other routes (/api/*) hit the Vercel rewrite → api.luneo.app
//   Both paths ensure httpOnly cookies are sent (same-origin policy).
//
//   On the SERVER (SSR/API routes), we use the absolute backend URL directly.
//   In development (localhost), we use the absolute backend URL since there's no Vercel rewrite.
//
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    // Browser on production (HTTPS): relative URLs through Vercel proxy
    // so cookies scoped to luneo.app are always sent automatically.
    if (window.location.protocol === 'https:') {
      return '';
    }
    // Browser on development (HTTP/localhost): direct to backend
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  // Server-side (SSR, API routes): absolute backend URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
})();

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

    // PRODUCTION FIX: Send locale to backend for i18n-aware responses
    if (typeof window !== 'undefined') {
      const locale = localStorage.getItem('luneo_locale') || document.cookie.match(/luneo_locale=([^;]+)/)?.[1] || 'fr';
      config.headers['Accept-Language'] = locale;
    }

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
    // IMPORTANT: Do NOT intercept auth endpoints — login/signup/refresh 401 means
    // "wrong credentials" or "invalid token", NOT "expired session"
    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/signup') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password') ||
      requestUrl.includes('/auth/login/2fa');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // ✅ Use relative URL for refresh so it goes through Vercel proxy (same-origin)
        // This ensures cookies are properly sent and received without cross-origin issues
        const refreshResp = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!refreshResp.ok) {
          throw new Error('Token refresh failed');
        }

        // ✅ New tokens are in httpOnly cookies (set by backend automatically)
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
          
          // Only redirect if not already on the login page
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?session=expired';
          }
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
 * Auth-specific fetch helper.
 * Uses relative URLs + credentials: 'include' to ensure httpOnly cookies
 * are sent through the Next.js proxy (same-origin), NOT directly to the backend.
 * This is CRITICAL because cookies are scoped to the frontend domain only.
 */
async function authFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Request failed' }));
    const error = new Error(errData.message || `HTTP ${response.status}`) as Error & { response?: { data: unknown; status: number } };
    error.response = { data: errData, status: response.status };
    throw error;
  }
  
  // Handle empty responses (204, logout, etc.)
  const text = await response.text();
  if (!text) return undefined as T;
  
  const data = JSON.parse(text);
  // Handle wrapped responses: { success: true, data: {...} }
  return data?.data !== undefined ? data.data : data;
}

/**
 * Type-safe API endpoints
 */
export const endpoints = {
  // Auth
  // ★ Auth endpoints use relative URLs to go through the Next.js proxy (same-origin).
  // This is REQUIRED because httpOnly cookies are scoped to the frontend domain (luneo.app)
  // and would NOT be sent to api.luneo.app directly.
  auth: {
    login: (credentials: LoginCredentials) =>
      authFetch<AuthSessionResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    signup: (data: RegisterData) =>
      authFetch<AuthSessionResponse>('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: RegisterData) =>
      authFetch<AuthSessionResponse>('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => authFetch<void>('/api/v1/auth/logout', { method: 'POST' }),
    me: () => authFetch<User>('/api/v1/auth/me'),
    refresh: (refreshToken: string) => authFetch('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    forgotPassword: (email: string) => authFetch('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) => 
      authFetch('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
    verifyEmail: (token: string) => 
      authFetch<{ message: string; verified: boolean }>('/api/v1/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
    resendVerification: (email: string) =>
      authFetch<{ message: string }>('/api/v1/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
    setup2FA: () => authFetch<{ secret: string; qrCodeUrl: string; backupCodes: string[] }>('/api/v1/auth/2fa/setup', { method: 'POST' }),
    verify2FA: (token: string) => authFetch<{ message: string; backupCodes: string[] }>('/api/v1/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ token }) }),
    disable2FA: () => authFetch<{ message: string }>('/api/v1/auth/2fa/disable', { method: 'POST' }),
    loginWith2FA: (tempToken: string, token: string) => 
      authFetch<AuthSessionResponse>('/api/v1/auth/login/2fa', { method: 'POST', body: JSON.stringify({ tempToken, token }) }),
    // OAuth: handled via window.location.href redirect in login page (not API calls).
    // See apps/frontend/src/app/(auth)/login/page.tsx handleOAuthLogin().
  },

  // Users
  users: {
    list: (params?: { page?: number; limit?: number }) =>
      api.get('/api/v1/users', { params }),
    get: (id: string) => api.get(`/api/v1/users/${id}`),
    update: (_id: string, data: Record<string, unknown>) => api.patch('/api/v1/users/me', data),
    delete: (_id: string, data: { password: string; reason?: string }) =>
      api.delete<{ success?: boolean; message?: string }>('/api/v1/security/gdpr/delete-account', { data }),
  },

  // Settings
  settings: {
    getNotifications: () =>
      api.get<{ email?: { orders?: boolean; designs?: boolean; marketing?: boolean; securityAlerts?: boolean }; push?: { orders?: boolean; designs?: boolean }; inApp?: { orders?: boolean; designs?: boolean; system?: boolean } }>('/api/v1/settings/notifications'),
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
    update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/products/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/products/${id}`),
    variants: {
      list: (productId: string) => api.get(`/api/v1/products/${productId}/variants`),
      create: (productId: string, data: Record<string, unknown>) =>
        api.post(`/api/v1/products/${productId}/variants`, data),
      update: (productId: string, variantId: string, data: Record<string, unknown>) =>
        api.patch(`/api/v1/products/${productId}/variants/${variantId}`, data),
      updateStock: (productId: string, variantId: string, stock: number) =>
        api.patch(`/api/v1/products/${productId}/variants/${variantId}/stock`, { stock }),
      delete: (productId: string, variantId: string) =>
        api.delete(`/api/v1/products/${productId}/variants/${variantId}`),
      bulkCreate: (productId: string, data: { attributeOptions: Record<string, string[]>; basePrice?: number; baseStock?: number }) =>
        api.post(`/api/v1/products/${productId}/variants/bulk`, data),
    },
  },

  // Projects / Workspaces
  projects: {
    list: (params?: { page?: number; limit?: number; type?: string; status?: string; search?: string }) =>
      api.get<{ data: unknown[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }>('/api/v1/projects', { params }),
    get: (id: string) => api.get(`/api/v1/projects/${id}`),
    create: (data: { name: string; slug: string; type: string; description?: string; settings?: Record<string, unknown>; webhookUrl?: string }) =>
      api.post('/api/v1/projects', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/projects/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/projects/${id}`),
    regenerateApiKey: (id: string) => api.post(`/api/v1/projects/${id}/regenerate-api-key`),
    workspaces: {
      list: (projectId: string) => api.get(`/api/v1/projects/${projectId}/workspaces`),
      get: (projectId: string, workspaceId: string) => api.get(`/api/v1/projects/${projectId}/workspaces/${workspaceId}`),
      create: (projectId: string, data: Record<string, unknown>) => api.post(`/api/v1/projects/${projectId}/workspaces`, data),
      update: (projectId: string, workspaceId: string, data: Record<string, unknown>) =>
        api.patch(`/api/v1/projects/${projectId}/workspaces/${workspaceId}`, data),
      delete: (projectId: string, workspaceId: string) =>
        api.delete(`/api/v1/projects/${projectId}/workspaces/${workspaceId}`),
    },
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
    cancel: (orderId: string, reason?: string) =>
      api.post(`/api/v1/orders/${orderId}/cancel`, { reason }),
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

  // Billing (list plans: GET /plans/all; current: GET /plans/current)
  billing: {
    subscription: () => api.get('/api/v1/billing/subscription'),
    plans: () => api.get('/api/v1/plans/all'),
    subscribe: (planId: string, email?: string, billingInterval?: 'monthly' | 'yearly') =>
      api.post('/api/v1/billing/create-checkout-session', { planId, email, billingInterval: billingInterval || 'monthly' }),
    cancel: () => api.post('/api/v1/billing/cancel-downgrade'),
    cancelSubscription: (immediate?: boolean) =>
      api.post<{ success: boolean; message?: string; cancelAt?: string }>('/api/v1/billing/cancel-subscription', { immediate: !!immediate }),
    invoices: () => api.get('/api/v1/billing/invoices'),
    exportInvoicesCSV: () => api.get<{ csv: string; filename: string }>('/api/v1/billing/invoices/export/csv'),
    paymentMethods: () => api.get('/api/v1/billing/payment-methods'),
    addPaymentMethod: (paymentMethodId: string) => api.post('/api/v1/billing/payment-methods', { paymentMethodId }),
    removePaymentMethod: () => api.delete('/api/v1/billing/payment-methods'),
    customerPortal: () => api.get<{ url?: string }>('/api/v1/billing/customer-portal'),
    portal: () => api.get<{ url?: string }>('/api/v1/billing/customer-portal'),
    changePlan: (data: { planId: string; billingInterval?: string }) => api.post('/api/v1/billing/change-plan', data),
    previewPlanChange: (planId: string, billingInterval?: string) => 
      api.get('/api/v1/billing/preview-plan-change', { params: { planId, interval: billingInterval } }),
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
      api.get<Array<{ id: string; device?: string; browser?: string; location?: string; ip?: string; lastActive?: string; current?: boolean }>>('/api/v1/users/me/sessions'),
    revokeSession: (sessionId: string) =>
      api.delete<void>(`/api/v1/users/me/sessions/${sessionId}`),
  },

  // Integrations
  integrations: {
    list: () => api.get('/api/v1/integrations'),
    enable: (type: string, config: Record<string, unknown>) => api.post(`/api/v1/integrations/${type}/enable`, config),
    disable: (type: string) => api.delete(`/api/v1/integrations/${type}`),
    test: (type: string, config: Record<string, unknown>) => api.post(`/api/v1/integrations/${type}/test`, config),
    shopifyStatus: () =>
      api.get<{ connected: boolean; shopDomain?: string; status?: string; lastSyncAt?: string | null; syncedProductsCount?: number }>('/api/v1/integrations/shopify/status'),
    woocommerceStatus: () =>
      api.get<{ connected: boolean; siteUrl?: string; status: string; lastSyncAt?: string | null; syncedProductsCount?: number }>('/api/v1/integrations/woocommerce/status'),
    zapierSubscriptions: () =>
      api.get<Array<{ id: string; event?: string; targetUrl?: string }>>('/api/v1/integrations/zapier/subscriptions'),
    analytics: (params?: { brandId?: string; startDate?: string; endDate?: string }) =>
      api.get<{
        totalIntegrations: number;
        connectedIntegrations: number;
        totalSyncs: number;
        successRate: number;
        avgLatency: number;
        errorCount: number;
        byPlatform: Record<string, number>;
        byCategory: Record<string, number>;
        recentActivity: Array<{
          id: string;
          type: string;
          status: string;
          createdAt: string;
        }>;
      }>('/api/v1/ecommerce/analytics', { params }),
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
      get: (id: string) => api.get(`/api/v1/api-keys/${id}`),
      getUsage: (id: string, period?: '24h' | '7d' | '30d') =>
        api.get<{ requests: number; errors: number; rateLimitHits: number; period: string }>(
          `/api/v1/api-keys/${id}/usage`,
          { params: period ? { period } : undefined }
        ),
      create: (data: Record<string, unknown>) => api.post('/api/v1/api-keys', data),
      update: (id: string, data: Record<string, unknown>) => api.put(`/api/v1/api-keys/${id}`, data),
      delete: (id: string) => api.delete(`/api/v1/api-keys/${id}`),
      regenerate: (id: string) => api.post<{ secret: string }>(`/api/v1/api-keys/${id}/regenerate`),
    },
    webhooks: {
      list: () => api.get('/api/v1/public-api/webhooks'),
      get: (id: string) => api.get(`/api/v1/public-api/webhooks/${id}`),
      create: (data: {
        name: string;
        url: string;
        secret?: string;
        events: string[];
        isActive?: boolean;
      }) => api.post('/api/v1/public-api/webhooks', data),
      update: (id: string, data: {
        name?: string;
        url?: string;
        secret?: string;
        events?: string[];
        isActive?: boolean;
      }) => api.put(`/api/v1/public-api/webhooks/${id}`, data),
      delete: (id: string) => api.delete(`/api/v1/public-api/webhooks/${id}`),
      test: (url: string, secret?: string) =>
        api.post('/api/v1/public-api/webhooks/test', { url, secret }),
      logs: (id: string, params?: { page?: number; limit?: number }) =>
        api.get(`/api/v1/public-api/webhooks/${id}/logs`, { params }),
      history: (params?: { page?: number; limit?: number }) =>
        api.get('/api/v1/public-api/webhooks/history', { params }),
      retry: (logId: string) => api.post(`/api/v1/public-api/webhooks/${logId}/retry`),
    },
  },

  // Webhooks (alias direct pour compatibilité)
  webhooks: {
    list: () => api.get('/api/v1/public-api/webhooks'),
    get: (id: string) => api.get(`/api/v1/public-api/webhooks/${id}`),
    create: (data: {
      name: string;
      url: string;
      secret?: string;
      events: string[];
      isActive?: boolean;
    }) => api.post('/api/v1/public-api/webhooks', data),
    update: (id: string, data: {
      name?: string;
      url?: string;
      secret?: string;
      events?: string[];
      isActive?: boolean;
    }) => api.put(`/api/v1/public-api/webhooks/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/public-api/webhooks/${id}`),
    test: (url: string, secret?: string) =>
      api.post('/api/v1/public-api/webhooks/test', { url, secret }),
    logs: (id: string, params?: { page?: number; limit?: number }) =>
      api.get(`/api/v1/public-api/webhooks/${id}/logs`, { params }),
    history: (params?: { page?: number; limit?: number }) =>
      api.get('/api/v1/public-api/webhooks/history', { params }),
    retry: (logId: string) => api.post(`/api/v1/public-api/webhooks/${logId}/retry`),
  },

  // Support
  support: {
    submitCSAT: (ticketId: string, data: { rating: number; comment?: string }) =>
      api.post<{ success: boolean; rating: number }>(`/api/v1/support/tickets/${ticketId}/csat`, data),
  },

  // Discount codes
  discountCodes: {
    validate: (code: string, subtotalCents?: number, brandId?: string) =>
      api.post<{ discountId: string; code: string; discountCents: number; type: string; description?: string }>('/api/v1/discount-codes/validate', { code, subtotalCents, brandId }),
  },

  // Referral / Affiliate
  referral: {
    stats: () =>
      api.get<{
        referralCode: string;
        referralLink: string;
        totalReferrals: number;
        activeReferrals: number;
        totalEarnings: number;
        pendingEarnings: number;
        recentReferrals?: unknown[];
      }>('/api/v1/referral/stats'),
    join: (email: string) => api.post('/api/v1/referral/join', { email }),
    withdraw: () => api.post('/api/v1/referral/withdraw'),
  },

  // Virtual Try-On (sessions & configurations)
  tryOn: {
    // Sessions
    createSession: (body: { configurationId: string; visitorId: string; deviceInfo?: Record<string, unknown> }) =>
      api.post<{ id: string; sessionId?: string }>('/api/v1/try-on/sessions', body),
    getSession: (sessionId: string) =>
      api.get<{ id: string; sessionId?: string; status: string }>(`/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}`),
    endSession: (sessionId: string, body?: { conversionAction?: string; renderQuality?: string }) =>
      api.post(`/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}/end`, body || {}),

    // Configurations
    createConfiguration: (projectId: string, body: { name: string; productType: string; settings?: Record<string, unknown> }) =>
      api.post('/api/v1/try-on/configurations', body, { params: { projectId } }),
    getConfigurations: (projectId: string) =>
      api.get('/api/v1/try-on/configurations', { params: { projectId } }),
    getConfiguration: (id: string, projectId: string) =>
      api.get(`/api/v1/try-on/configurations/${encodeURIComponent(id)}`, { params: { projectId } }),
    updateConfiguration: (id: string, projectId: string, body: Record<string, unknown>) =>
      api.patch(`/api/v1/try-on/configurations/${encodeURIComponent(id)}`, body, { params: { projectId } }),
    deleteConfiguration: (id: string, projectId: string) =>
      api.delete(`/api/v1/try-on/configurations/${encodeURIComponent(id)}`, { params: { projectId } }),

    // Product mappings
    addProduct: (configId: string, projectId: string, body: { productId: string }) =>
      api.post(`/api/v1/try-on/configurations/${encodeURIComponent(configId)}/products`, body, { params: { projectId } }),
    removeProduct: (configId: string, projectId: string, productId: string) =>
      api.delete(`/api/v1/try-on/configurations/${encodeURIComponent(configId)}/products/${encodeURIComponent(productId)}`, { params: { projectId } }),

    // 3D Model management
    uploadModel: (configId: string, formData: FormData) =>
      api.post(`/api/v1/try-on/configurations/${encodeURIComponent(configId)}/model`, formData),
    deleteModel: (configId: string, productId: string, format?: string) =>
      api.delete(`/api/v1/try-on/configurations/${encodeURIComponent(configId)}/model`, { params: { productId, format } }),
    getModelPreview: (configId: string, productId: string) =>
      api.get(`/api/v1/try-on/configurations/${encodeURIComponent(configId)}/model/preview`, { params: { productId } }),

    // Screenshots
    getScreenshots: (sessionId: string) =>
      api.get(`/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}/screenshots`),
    batchUploadScreenshots: (sessionId: string, body: { screenshots: Array<{ imageBase64: string; productId: string; metadata?: Record<string, unknown> }> }) =>
      api.post<{ created: number; failed: number; total: number }>(`/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}/screenshots/batch`, body),

    // Product tracking
    trackProductTried: (sessionId: string, productId: string) =>
      api.post(`/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}/product-tried`, { productId }),

    // Performance
    submitPerformance: (sessionId: string, body: { metrics: Array<{ fps: number; detectionLatencyMs: number; renderLatencyMs: number; gpuInfo?: string; deviceType: string; browserInfo?: string }> }) =>
      api.post(`/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}/performance`, body),
    getDeviceStats: (days?: number) =>
      api.get('/api/v1/try-on/performance/device-stats', { params: { days } }),

    // Calibration
    submitCalibration: (sessionId: string, body: Record<string, unknown>) =>
      api.post(`/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}/calibration`, body),

    // Device compatibility
    checkDeviceCompatibility: (deviceType: string, gpuInfo?: string) =>
      api.get('/api/v1/try-on/device-compatibility', { params: { deviceType, gpuInfo } }),

    // Analytics
    getAnalytics: (days?: number) =>
      api.get('/api/v1/try-on/analytics', { params: { days } }),
    getAnalyticsROI: (days?: number) =>
      api.get('/api/v1/try-on/analytics/roi', { params: { days } }),
    getAnalyticsFunnel: (days?: number) =>
      api.get('/api/v1/try-on/analytics/funnel', { params: { days } }),
    getAnalyticsProducts: (days?: number) =>
      api.get('/api/v1/try-on/analytics/products', { params: { days } }),
    getAnalyticsDevices: (days?: number) =>
      api.get('/api/v1/try-on/analytics/devices', { params: { days } }),
    getAnalyticsTrend: (days?: number) =>
      api.get('/api/v1/try-on/analytics/trend', { params: { days } }),
    getAnalyticsShares: (days?: number) =>
      api.get('/api/v1/try-on/analytics/shares', { params: { days } }),

    // Conversions
    getConversions: (params?: { days?: number; action?: string }) =>
      api.get('/api/v1/try-on/conversions', { params }),
    getConversionReport: (days?: number) =>
      api.get('/api/v1/try-on/conversions/report', { params: { days } }),
    attributeRevenue: (conversionId: string, body: { revenue: number; orderId?: string; commissionRate?: number }) =>
      api.post(`/api/v1/try-on/conversions/${encodeURIComponent(conversionId)}/revenue`, body),

    // Widget config
    getWidgetConfig: () =>
      api.get('/api/v1/try-on/widget-config'),
    updateWidgetConfig: (body: Record<string, unknown>) =>
      api.patch('/api/v1/try-on/widget-config', body),
    getEmbedCode: (params?: { format?: string }) =>
      api.get('/api/v1/try-on/widget-config/embed-code', { params }),
  },

  // Experiments (A/B)
  experiments: {
    getAssignment: (experimentName: string) =>
      api.get<{ variant: string }>(`/api/v1/experiments/assignment/${encodeURIComponent(experimentName)}`),
    recordConversion: (payload: { experimentName: string; value?: number; sessionId?: string; eventType?: string }) =>
      api.post('/api/v1/experiments/conversion', payload),
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

  // ORION Super Admin - Retention (ARTEMIS) + Admin Tools
  orion: {
    auditLog: (params?: { page?: number; pageSize?: number; action?: string; userId?: string; dateFrom?: string; dateTo?: string }) =>
      api.get<{ items: Array<{ id: string; adminId: string; action: string; resource: string; resourceId: string | null; changes: unknown; ipAddress: string | null; createdAt: string; user: { email: string; name: string } }>; total: number; page: number; pageSize: number; totalPages: number }>('/api/v1/orion/audit-log', { params }),
    notifications: (params?: { page?: number; pageSize?: number; type?: string; read?: boolean }) =>
      api.get<{ items: Array<{ id: string; type: string; title: string; message: string; read: boolean; readAt: string | null; createdAt: string }>; total: number; page: number; pageSize: number; totalPages: number }>('/api/v1/orion/notifications', { params }),
    notificationCount: () => api.get<{ count: number }>('/api/v1/orion/notifications/count'),
    markNotificationRead: (id: string) => api.put<{ id: string; read: boolean }>(`/api/v1/orion/notifications/${id}/read`),
    markAllNotificationsRead: () => api.put<{ success: boolean }>('/api/v1/orion/notifications/read-all'),
    export: (type: string, params?: { format?: 'csv' | 'json'; dateFrom?: string; dateTo?: string; limit?: number }) =>
      api.get<string | { data: unknown[] }>(`/api/v1/orion/export/${type}`, { params }),
    retention: {
      dashboard: () => api.get<{
        totalUsers: number;
        avgHealthScore: number;
        atRiskCount: number;
        atRiskPercent: number;
        distribution: Array<{ level: string; count: number }>;
        trend: Array<{ date: string; count: number; avgScore: number }>;
      }>('/api/v1/orion/retention/dashboard'),
      atRisk: (params?: { limit?: number }) =>
        api.get<Array<{
          id: string;
          userId: string;
          healthScore: number;
          churnRisk: string;
          lastActivityAt: string | null;
          user: { id: string; email: string; firstName: string | null; lastName: string | null; lastLoginAt: string | null };
        }>>('/api/v1/orion/retention/at-risk', { params }),
      healthScore: (userId: string) =>
        api.get<{
          id: string;
          userId: string;
          healthScore: number;
          churnRisk: string;
          lastActivityAt: string | null;
          user: { id: string; email: string; firstName: string | null; lastName: string | null; lastLoginAt: string | null };
        }>(`/api/v1/orion/retention/health/${userId}`),
      calculate: (userId: string) =>
        api.post<{ id: string; healthScore: number; churnRisk: string }>(`/api/v1/orion/retention/calculate/${userId}`),
      winBackCampaigns: () =>
        api.get<Array<{
          id: string;
          name: string;
          description: string | null;
          trigger: string;
          status: string;
          stepsCount: number;
          runsCount: number;
        }>>('/api/v1/orion/retention/win-back'),
      triggerWinBack: (userIds: string[]) =>
        api.post<{ triggered: number; runIds?: string[]; message?: string }>('/api/v1/orion/retention/win-back/trigger', { userIds }),
    },
    quickWins: {
      status: () =>
        api.get<{
          welcomeEmail: { configured: boolean; templateId: string | null; lastSentCount: number };
          lowCreditsAlert: { usersAtRisk: number };
          churnAlert: { inactiveUsers: number };
          trialReminder: { trialEnding: number };
        }>('/api/v1/orion/quick-wins/status'),
      welcomeSetup: () =>
        api.post<{ template: { id: string }; status: string }>('/api/v1/orion/quick-wins/welcome-setup'),
      lowCredits: () =>
        api.get<{ usersAtRisk: number; users: Array<{ id: string; email: string; firstName: string | null; aiCredits: number }> }>(
          '/api/v1/orion/quick-wins/low-credits'
        ),
      inactive: (params?: { days?: number }) =>
        api.get<{
          inactiveUsers: number;
          users: Array<{ id: string; email: string; firstName: string | null; lastLoginAt: string | null }>;
          thresholdDays: number;
        }>('/api/v1/orion/quick-wins/inactive', { params }),
      trialEnding: () =>
        api.get<{
          trialEnding: number;
          users: Array<{ id: string; email: string; firstName: string | null; trialEndsAt: Date | null; brandName: string }>;
          brands: number;
        }>('/api/v1/orion/quick-wins/trial-ending'),
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
    // Shared endpoints
    conversations: (agentType?: string) =>
      api.get<{ success: boolean; data: { conversations: AgentConversation[] } }>(`/api/v1/agents/conversations${agentType ? `?agentType=${agentType}` : ''}`),
    conversation: (conversationId: string) =>
      api.get<{ success: boolean; data: AgentConversation }>(`/api/v1/agents/conversations/${conversationId}`),
    feedback: (data: { messageId: string; rating: number; comment?: string; category?: string }) =>
      api.post<{ success: boolean }>('/api/v1/agents/feedback', data),
  },

  // AR Studio
  ar: {
    /** Resolve short code: follows redirect manually and returns redirect URL + parsed modelId if path is /ar/viewer/:modelId */
    view: {
      resolve: async (shortCode: string): Promise<{ redirectUrl: string; modelId?: string; platform?: string; method?: string }> => {
        const url = `${API_BASE_URL}/api/v1/ar/view/${encodeURIComponent(shortCode)}`;
        const res = await axios.get(url, { maxRedirects: 0, validateStatus: (s) => s === 302 || s === 404 });
        if (res.status === 404) {
          const err = new Error('Short link not found or expired');
          (err as Error & { response?: { status: number } }).response = { status: 404 };
          throw err;
        }
        const location = res.headers?.location;
        if (!location) {
          throw new Error('Invalid response from AR view');
        }
        try {
          const parsed = new URL(location, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
          const match = parsed.pathname.match(/\/ar\/viewer\/([^/]+)/);
          return {
            redirectUrl: location,
            modelId: match?.[1],
            platform: parsed.searchParams.get('platform') ?? undefined,
            method: parsed.searchParams.get('method') ?? undefined,
          };
        } catch {
          return { redirectUrl: location };
        }
      },
    },
    /** Get viewer config for a model (URLs per platform, features). Public. */
    viewerConfig: (modelId: string) =>
      api.get<{
        platform: string;
        method: string;
        format: string;
        features: Record<string, boolean>;
        ios: { arQuickLookUrl: string; ready: boolean };
        android: { intentUrl: string; modelUrl: string; webxrFallback: boolean };
        web: unknown;
        desktop: { qrTargetUrl: string; landingPageUrl: string };
      }>(`/api/v1/ar/viewer/${modelId}`),
    embedConfig: (projectId: string) =>
      api.get<{ projectId: string; embedUrl: string; models: Array<{ id: string; name: string; viewerUrl: string }> }>(`/api/v1/ar/embed/${projectId}`),
    projects: {
      get: (projectId: string) => api.get(`/api/v1/ar/projects/${projectId}`),
      models: {
        list: (projectId: string, params?: { page?: number; limit?: number }) =>
          api.get<{ data: unknown[]; meta?: { total: number; page: number; limit: number } }>(`/api/v1/ar/projects/${projectId}/models`, { params }),
        upload: (projectId: string, formData: FormData) =>
          api.post<{ id: string; name: string; status: string }>(`/api/v1/ar/projects/${projectId}/models`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
        convert: (projectId: string, modelId: string) =>
          api.post(`/api/v1/ar/projects/${projectId}/models/${modelId}/convert`, {}),
        optimize: (projectId: string, modelId: string) =>
          api.post(`/api/v1/ar/projects/${projectId}/models/${modelId}/optimize`, {}),
        delete: (projectId: string, modelId: string) =>
          api.delete(`/api/v1/ar/projects/${projectId}/models/${modelId}`),
      },
      targets: {
        list: (projectId: string) => api.get<{ data: unknown[] }>(`/api/v1/ar/projects/${projectId}/targets`),
        create: (projectId: string, formData: FormData) =>
          api.post(`/api/v1/ar/projects/${projectId}/targets`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
        analyze: (projectId: string, targetId: string) =>
          api.post<{ qualityScore: number; trackingQuality: string }>(`/api/v1/ar/projects/${projectId}/targets/${targetId}/analyze`, {}),
        linkModel: (projectId: string, targetId: string, modelId: string) =>
          api.patch(`/api/v1/ar/projects/${projectId}/targets/${targetId}/link`, { modelId }),
      },
      qrCodes: {
        list: (projectId: string) => api.get<{ data: unknown[] }>(`/api/v1/ar/projects/${projectId}/qr-codes`),
        create: (projectId: string, data: { url: string; options?: { fgColor?: string; bgColor?: string; logo?: string; style?: string } }) =>
          api.post<{ id: string; imageUrl: string }>(`/api/v1/ar/projects/${projectId}/qr-codes`, data),
        download: (projectId: string, qrId: string, format: 'png' | 'svg' | 'pdf') =>
          api.get<Blob>(`/api/v1/ar/projects/${projectId}/qr-codes/${qrId}/download`, { params: { format }, responseType: 'blob' }),
      },
      analytics: (projectId: string, params?: { startDate?: string; endDate?: string }) =>
        api.get<{ sessions: number; avgDuration: number; placements: number; conversions: number; sessionsOverTime?: unknown[]; platformDistribution?: unknown[] }>(`/api/v1/ar/projects/${projectId}/analytics`, { params }),
    },
    analytics: {
      dashboard: (params?: { startDate?: string; endDate?: string }) =>
        api.get<{ totalSessions: number; avgDuration: number; conversionRate: number; revenue: number; sessionsTrend?: unknown[]; platformDistribution?: unknown[]; topModels?: unknown[] }>(`/api/v1/ar/analytics/dashboard`, { params }),
      sessions: (params?: { startDate?: string; endDate?: string; platform?: string; projectId?: string; page?: number; limit?: number }) =>
        api.get<{ data: unknown[]; meta?: { total: number; page: number; limit: number } }>(`/api/v1/ar/analytics/sessions`, { params }),
      conversions: (params?: { startDate?: string; endDate?: string }) =>
        api.get<{ funnel: unknown[]; rates: Record<string, number>; revenue: number }>(`/api/v1/ar/analytics/conversions`, { params }),
      heatmaps: (params?: { modelId?: string }) =>
        api.get<{ viewAngleDistribution?: unknown[]; scaleDistribution?: unknown[]; placementZones?: unknown[] }>(`/api/v1/ar/analytics/heatmaps`, { params }),
    },
  },
};

export default api;
export type { AuthSessionResponse, GenerateDesignResponse };