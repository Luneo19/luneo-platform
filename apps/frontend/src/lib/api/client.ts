/**
 * REST API Client - Unified API Layer
 *
 * All frontend API calls go through this REST client.
 * Auth, billing, webhooks, dashboard CRUD, AI agents — everything is REST.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { LoginCredentials, RegisterData, User } from '@/lib/types';
import { logger } from '@/lib/logger';

interface AuthSessionResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  requires2FA?: boolean;
  tempToken?: string;
}

/** Admin client (user + organization subscription); from GET /api/v1/admin/customers */
export interface AdminClient {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name: string;
  role?: string;
  createdAt: string;
  organization?: { id: string; name: string | null; subscriptionPlan: string | null; subscriptionStatus: string | null };
  plan: string;
  status: string;
  planPrice?: number;
  totalRevenue?: number;
  ltv?: number;
  lastSeenAt?: string | null;
  [key: string]: unknown;
}

/** Admin ticket; from GET /api/v1/admin/support/tickets */
export interface AdminTicket {
  id: string;
  ticketNumber?: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt?: string;
  client?: { id: string; email?: string; name?: string; firstName?: string; lastName?: string };
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
    const browserUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return browserUrl === 'http://localhost:3000' ? 'http://localhost:3001' : browserUrl;
  }
  // Server-side (SSR, API routes): absolute backend URL
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return serverUrl === 'http://localhost:3000' ? 'http://localhost:3001' : serverUrl;
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
    config.headers['X-Request-Time'] = new Date().toISOString();

    if (typeof window !== 'undefined') {
      const locale = localStorage.getItem('luneo_locale') || document.cookie.match(/luneo_locale=([^;]+)/)?.[1] || 'fr';
      config.headers['Accept-Language'] = locale;

      // CSRF double-submit: read the non-httpOnly csrf_token cookie and attach it as a header.
      // The backend CsrfGuard compares X-CSRF-Token header with the csrf_token cookie.
      const method = (config.method || '').toUpperCase();
      if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrf_token='))
          ?.split('=')[1];
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = decodeURIComponent(csrfToken);
        }
      }
    }

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

let refreshPromise: Promise<Response> | null = null;

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
        if (!refreshPromise) {
          refreshPromise = fetch('/api/v1/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
        }

        const refreshResp = await refreshPromise;
        refreshPromise = null;

        if (!refreshResp.ok) {
          throw new Error('Token refresh failed');
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // CSRF double-submit for mutative requests
  if (typeof window !== 'undefined') {
    const method = (init?.method || 'GET').toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1];
      if (csrfToken) {
        headers['X-CSRF-Token'] = decodeURIComponent(csrfToken);
      }
    }
  }

  const response = await fetch(path, {
    credentials: 'include',
    headers: { ...headers, ...init?.headers },
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

  // Organizations (renamed from brands)
  organizations: {
    current: () => api.get('/api/v1/organizations/settings'),
    update: (data: Record<string, unknown>) => api.put('/api/v1/organizations/settings', data),
  },

  // Agents V2
  agents: {
    list: (params?: { status?: string; page?: number; limit?: number }) =>
      api.get('/api/v1/agents', { params }),
    get: (id: string) => api.get(`/api/v1/agents/${id}`),
    create: (data: {
      name: string;
      description?: string;
      templateId?: string;
      model?: string;
      temperature?: number;
      tone?: string;
      languages?: string[];
      greeting?: string;
      systemPrompt?: string;
      customInstructions?: string;
      maxTokensPerReply?: number;
    }) => api.post<{ id: string; data?: { id: string } }>('/api/v1/agents', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/agents/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/agents/${id}`),
    publish: (id: string) => api.post(`/api/v1/agents/${id}/publish`),
    pause: (id: string) => api.post(`/api/v1/agents/${id}/pause`),
    test: (id: string, data: { message: string; context?: { visitorName?: string; visitorEmail?: string } }) =>
      api.post<{ response: string; sources?: Array<{ title: string; url?: string; score?: number; preview?: string }>; metadata?: { model?: string; tokensIn?: number; tokensOut?: number; costUsd?: number; latencyMs?: number; confidence?: number } }>(`/api/v1/agents/${id}/test`, data),
    attachKnowledgeBase: (agentId: string, knowledgeBaseId: string) =>
      api.post(`/api/v1/agents/${agentId}/knowledge-bases`, { knowledgeBaseId }),
    detachKnowledgeBase: (agentId: string, kbId: string) =>
      api.delete(`/api/v1/agents/${agentId}/knowledge-bases/${kbId}`),
  },

  // Agent Templates
  agentTemplates: {
    list: (params?: { category?: string; plan?: string }) =>
      api.get('/api/v1/agent-templates', { params }),
    get: (slug: string) => api.get(`/api/v1/agent-templates/${slug}`),
  },

  // Conversations
  conversations: {
    list: (params?: { status?: string; agentId?: string; search?: string; cursor?: string; limit?: number }) =>
      api.get('/api/v1/conversations', { params }),
    get: (id: string) => api.get(`/api/v1/conversations/${id}`),
    create: (data: { agentId: string; channelType: string; visitorEmail?: string; visitorName?: string }) =>
      api.post('/api/v1/conversations', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/conversations/${id}`, data),
    addMessage: (id: string, data: { content: string; role?: string }) =>
      api.post(`/api/v1/conversations/${id}/messages`, data),
    escalate: (id: string) => api.post(`/api/v1/conversations/${id}/escalate`),
    resolve: (id: string) => api.post(`/api/v1/conversations/${id}/resolve`),
    stats: () => api.get('/api/v1/conversations/stats'),
  },

  // Channels
  channels: {
    list: (agentId: string) => api.get('/api/v1/channels', { params: { agentId } }),
    create: (data: { agentId: string; type: string; widgetColor?: string; widgetPosition?: string }) =>
      api.post('/api/v1/channels', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/channels/${id}`, data),
    delete: (id: string) => api.delete(`/api/v1/channels/${id}`),
  },

  // Knowledge Bases
  knowledge: {
    bases: {
      list: () => api.get('/api/v1/knowledge/bases'),
      get: (id: string) => api.get(`/api/v1/knowledge/bases/${id}`),
      create: (data: { name: string; description?: string; language?: string }) =>
        api.post('/api/v1/knowledge/bases', data),
      update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/knowledge/bases/${id}`, data),
      delete: (id: string) => api.delete(`/api/v1/knowledge/bases/${id}`),
    },
    sources: {
      list: (baseId: string) => api.get(`/api/v1/knowledge/bases/${baseId}/sources`),
      create: (baseId: string, data: { name: string; type: string; fileUrl?: string; websiteUrl?: string; textContent?: string }) =>
        api.post(`/api/v1/knowledge/bases/${baseId}/sources`, data),
      upload: (baseId: string, formData: FormData) =>
        api.post(`/api/v1/knowledge/bases/${baseId}/sources/upload`, formData),
      delete: (id: string) => api.delete(`/api/v1/knowledge/sources/${id}`),
      reindex: (id: string) => api.post(`/api/v1/knowledge/sources/${id}/reindex`),
    },
  },

  // Agent Analytics
  agentAnalytics: {
    get: (agentId: string, params?: { startDate?: string; endDate?: string }) =>
      api.get(`/api/v1/agent-analytics/agents/${agentId}/analytics`, { params }),
    summary: (agentId: string, params?: { startDate?: string; endDate?: string }) =>
      api.get(`/api/v1/agent-analytics/agents/${agentId}/analytics/summary`, { params }),
    overview: (params?: { from?: string; to?: string }) =>
      api.get('/api/v1/agent-analytics/overview', { params }),
    timeseries: (params: { metric: string; from?: string; to?: string; granularity?: 'day' | 'week' | 'month' }) =>
      api.get<Array<{ date: string; value: number }>>('/api/v1/agent-analytics/timeseries', { params }),
    agentsComparison: (params?: { from?: string; to?: string }) =>
      api.get('/api/v1/agent-analytics/agents/comparison', { params }),
    topTopics: (params?: { from?: string; to?: string; limit?: number }) =>
      api.get('/api/v1/agent-analytics/topics', { params }),
  },

  // Analytics (kept for dashboard-level metrics)
  analytics: {
    overview: (params?: { period?: string }) =>
      api.get('/api/v1/analytics/dashboard', { params }),
    pipeline: () =>
      api.get<{ products: number; selling: number; orders: number; inProduction: number; delivered: number }>('/api/v1/analytics/pipeline'),
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
    shopifyV2: {
      connect: (data: { shopDomain: string; accessToken: string }) =>
        api.post<{ success: boolean; message?: string }>('/api/v1/integrations/shopify-v2/connect', data),
      disconnect: () =>
        api.delete<{ success: boolean; message?: string }>('/api/v1/integrations/shopify-v2/disconnect'),
      status: () =>
        api.get<{ connected: boolean; shopDomain?: string; shopName?: string; status?: string; lastSyncAt?: string | null }>('/api/v1/integrations/shopify-v2/status'),
    },
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
    clients: {
      list: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        plan?: string;
        status?: string;
        country?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      }) => api.get<{ data: AdminClient[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/api/v1/admin/customers', { params }),
      get: (id: string) => api.get<AdminClient>(`/api/v1/admin/customers/${id}`),
      updatePlan: (orgId: string, plan: string) =>
        api.patch(`/api/v1/admin/organizations/${orgId}`, { subscriptionPlan: plan, plan }),
      offerSubscription: (body: { organizationId: string; plan: string; durationMonths: number; reason?: string }) =>
        api.post('/api/v1/admin/billing/offer-subscription', body),
      suspend: (orgId: string, reason?: string) =>
        api.post(`/api/v1/admin/organizations/${orgId}/suspend`, { reason }),
      unsuspend: (orgId: string) =>
        api.post(`/api/v1/admin/organizations/${orgId}/unsuspend`),
    },
    tickets: (params?: { page?: number; limit?: number; status?: string; priority?: string }) =>
      api.get<{ data: AdminTicket[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/api/v1/admin/support/tickets', { params }),
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
    prometheus: {
      stats: () => api.get<unknown>('/api/v1/orion/prometheus/stats'),
      analyzeTicket: (ticketId: string) => api.post<unknown>(`/api/v1/orion/prometheus/tickets/${ticketId}/analyze`),
      generateResponse: (ticketId: string) => api.post<unknown>(`/api/v1/orion/prometheus/tickets/${ticketId}/generate`),
      reviewQueue: (params?: { status?: string; page?: number; limit?: number }) => api.get<unknown>('/api/v1/orion/prometheus/review-queue', { params }),
      reviewStats: () => api.get<unknown>('/api/v1/orion/prometheus/review-queue/stats'),
      approveResponse: (responseId: string, body?: { notes?: string; editedContent?: string }) => api.post<unknown>(`/api/v1/orion/prometheus/review-queue/${responseId}/approve`, body),
      rejectResponse: (responseId: string, body?: { notes?: string }) => api.post<unknown>(`/api/v1/orion/prometheus/review-queue/${responseId}/reject`, body),
      bulkApprove: (responseIds: string[]) => api.post<unknown>('/api/v1/orion/prometheus/review-queue/bulk-approve', { responseIds }),
      submitFeedback: (responseId: string, rating: number, comment?: string) => api.put<unknown>(`/api/v1/orion/prometheus/responses/${responseId}/feedback`, { rating, comment }),
    },
    zeus: {
      dashboard: () => api.get<unknown>('/api/v1/orion/zeus/dashboard'),
      alerts: () => api.get<unknown>('/api/v1/orion/zeus/alerts'),
      decisions: () => api.get<unknown>('/api/v1/orion/zeus/decisions'),
      override: (actionId: string, approved: boolean) => api.post<unknown>(`/api/v1/orion/zeus/override/${actionId}`, { approved }),
    },
    athena: {
      dashboard: () => api.get<unknown>('/api/v1/orion/athena/dashboard'),
      distribution: () => api.get<unknown>('/api/v1/orion/athena/distribution'),
      customerHealth: (userId: string) => api.get<unknown>(`/api/v1/orion/athena/customer/${userId}`),
      calculateHealth: (userId: string) => api.post<unknown>(`/api/v1/orion/athena/calculate/${userId}`),
      generateInsights: () => api.post<unknown>('/api/v1/orion/athena/insights/generate'),
    },
    apollo: {
      dashboard: () => api.get<unknown>('/api/v1/orion/apollo/dashboard'),
      services: () => api.get<unknown>('/api/v1/orion/apollo/services'),
      incidents: (status?: string) => api.get<unknown>('/api/v1/orion/apollo/incidents', { params: { status } }),
      metrics: (hours?: number) => api.get<unknown>('/api/v1/orion/apollo/metrics', { params: { hours } }),
    },
    artemis: {
      dashboard: () => api.get<unknown>('/api/v1/orion/artemis/dashboard'),
      threats: () => api.get<unknown>('/api/v1/orion/artemis/threats'),
      resolveThreat: (id: string) => api.post<unknown>(`/api/v1/orion/artemis/threats/${id}/resolve`),
      blockedIPs: () => api.get<unknown>('/api/v1/orion/artemis/blocked-ips'),
      blockIP: (data: { ipAddress: string; reason: string; expiresAt?: string }) => api.post<unknown>('/api/v1/orion/artemis/block-ip', data),
      unblockIP: (ip: string) => api.delete<unknown>(`/api/v1/orion/artemis/blocked-ips/${ip}`),
      fraudChecks: () => api.get<unknown>('/api/v1/orion/artemis/fraud-checks'),
    },
    hermes: {
      dashboard: () => api.get<unknown>('/api/v1/orion/hermes/dashboard'),
      pending: () => api.get<unknown>('/api/v1/orion/hermes/pending'),
      campaigns: () => api.get<unknown>('/api/v1/orion/hermes/campaigns'),
      stats: () => api.get<unknown>('/api/v1/orion/hermes/stats'),
    },
    hades: {
      dashboard: () => api.get<unknown>('/api/v1/orion/hades/dashboard'),
      atRisk: () => api.get<unknown>('/api/v1/orion/hades/at-risk'),
      winBack: () => api.get<unknown>('/api/v1/orion/hades/win-back'),
      mrrAtRisk: () => api.get<unknown>('/api/v1/orion/hades/mrr-at-risk'),
      actions: () => api.get<unknown>('/api/v1/orion/hades/actions'),
    },
    insights: (params?: Record<string, string | number | boolean | undefined>) => api.get<unknown>('/api/v1/orion/insights', { params }),
    actions: (params?: Record<string, string | number | boolean | undefined>) => api.get<unknown>('/api/v1/orion/actions', { params }),
    activityFeed: (limit?: number) => api.get<unknown>('/api/v1/orion/activity-feed', { params: { limit } }),
    automationsV2: {
      list: (brandId?: string) => api.get<unknown>('/api/v1/orion/automations-v2', { params: { brandId } }),
      get: (id: string) => api.get<unknown>(`/api/v1/orion/automations-v2/${id}`),
      create: (data: Record<string, unknown>) => api.post<unknown>('/api/v1/orion/automations-v2', data),
      update: (id: string, data: Record<string, unknown>) => api.put<unknown>(`/api/v1/orion/automations-v2/${id}`, data),
      toggle: (id: string) => api.post<unknown>(`/api/v1/orion/automations-v2/${id}/toggle`),
      delete: (id: string) => api.delete<unknown>(`/api/v1/orion/automations-v2/${id}`),
      test: (id: string, testData: Record<string, unknown>) => api.post<unknown>(`/api/v1/orion/automations-v2/${id}/test`, { testData }),
      runs: (id: string) => api.get<unknown>(`/api/v1/orion/automations-v2/${id}/runs`),
      triggers: () => api.get<unknown>('/api/v1/orion/automations-v2/triggers'),
      actions: () => api.get<unknown>('/api/v1/orion/automations-v2/actions'),
    },
  },

};

export default api;
export type { AuthSessionResponse };