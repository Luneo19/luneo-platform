/**
 * 3D Configurator API Endpoints
 * Standalone endpoints file for configurator-3d module
 * Base URL prefix: /api/v1
 */

import { api } from '@/lib/api/client';
import type {
  Configurator3DConfig,
  Configurator3DComponent,
  Configurator3DOption,
  Configurator3DRule,
  Configurator3DSession,
  PriceBreakdown,
  SelectionState,
  DeviceInfo,
  CalculatePriceRequest,
  StartSessionRequest,
  UpdateSessionRequest,
  SaveDesignRequest,
  ExportPDFOptions,
  ExportAROptions,
  Export3DOptions,
  ExportImageOptions,
} from '@/lib/configurator-3d/types/configurator.types';

const PREFIX = '/api/v1/configurator-3d';

// -----------------------------------------------------------------------------
// Generic params types
// -----------------------------------------------------------------------------

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface EmbedParams {
  width?: number;
  height?: number;
  theme?: string;
}

// -----------------------------------------------------------------------------
// API Response types
// -----------------------------------------------------------------------------

interface ExportJobResponse {
  jobId: string;
  status?: string;
}

interface ExportStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  downloadUrl?: string;
  error?: string;
}

interface SavedDesignResponse {
  id: string;
  name?: string;
  token?: string;
  savedAt: string;
  selections?: SelectionState;
}

// -----------------------------------------------------------------------------
// Configurator 3D Endpoints
// -----------------------------------------------------------------------------

export const configurator3dEndpoints = {
  configurations: {
    list: <T = unknown>(params?: ListParams) =>
      api.get<T>(`${PREFIX}/configurations`, { params }),

    get: <T = Configurator3DConfig>(id: string, params?: { projectId?: string }) =>
      api.get<T>(`${PREFIX}/configurations/${id}`, { params }),

    getPublic: <T = Configurator3DConfig>(id: string, params?: { projectId?: string }) =>
      api.get<T>(`${PREFIX}/public/configurations/${id}`, { params }),

    create: <T = Configurator3DConfig>(data: Record<string, unknown>, params?: { projectId?: string }) =>
      api.post<T>(`${PREFIX}/configurations`, data, { params }),

    update: <T = Configurator3DConfig>(id: string, data: Record<string, unknown>, params?: { projectId?: string }) =>
      api.put<T>(`${PREFIX}/configurations/${id}`, data, { params }),

    patch: <T = Configurator3DConfig>(id: string, data: Record<string, unknown>, params?: { projectId?: string }) =>
      api.patch<T>(`${PREFIX}/configurations/${id}`, data, { params }),

    delete: <T = void>(id: string, params?: { projectId?: string }) =>
      api.delete<T>(`${PREFIX}/configurations/${id}`, { params }),

    clone: <T = Configurator3DConfig>(id: string, data?: Record<string, unknown>, params?: { projectId?: string }) =>
      api.post<T>(`${PREFIX}/configurations/${id}/clone`, data ?? {}, { params }),

    publish: <T = Configurator3DConfig>(id: string, params?: { projectId?: string }) =>
      api.post<T>(`${PREFIX}/configurations/${id}/publish`, {}, { params }),

    unpublish: <T = Configurator3DConfig>(id: string, params?: { projectId?: string }) =>
      api.post<T>(`${PREFIX}/configurations/${id}/unpublish`, {}, { params }),

    archive: <T = Configurator3DConfig>(id: string, params?: { projectId?: string }) =>
      api.post<T>(`${PREFIX}/configurations/${id}/archive`, {}, { params }),

    validate: <T = { valid: boolean; errors: unknown[]; warnings: unknown[] }>(id: string, data: { selections: SelectionState }) =>
      api.post<T>(`${PREFIX}/configurations/${id}/validate`, data),

    embed: <T = unknown>(id: string, params?: EmbedParams) =>
      api.get<T>(`${PREFIX}/configurations/${id}/embed`, { params }),
  },

  components: {
    list: <T = Configurator3DComponent[]>(configId: string, params?: ListParams) =>
      api.get<T>(`${PREFIX}/configurations/${configId}/components`, { params }),

    get: <T = Configurator3DComponent>(configId: string, id: string) =>
      api.get<T>(`${PREFIX}/configurations/${configId}/components/${id}`),

    create: <T = Configurator3DComponent>(configId: string, data: Record<string, unknown>) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/components`, data),

    bulkCreate: <T = Configurator3DComponent[]>(configId: string, data: { components: Record<string, unknown>[] }) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/components/bulk`, data),

    update: <T = Configurator3DComponent>(configId: string, id: string, data: Record<string, unknown>) =>
      api.put<T>(`${PREFIX}/configurations/${configId}/components/${id}`, data),

    delete: <T = void>(configId: string, id: string) =>
      api.delete<T>(`${PREFIX}/configurations/${configId}/components/${id}`),

    reorder: <T = Configurator3DComponent[]>(configId: string, data: { componentIds: string[] }) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/components/reorder`, data),
  },

  options: {
    list: <T = Configurator3DOption[]>(configId: string, componentId: string, params?: ListParams) =>
      api.get<T>(`${PREFIX}/configurations/${configId}/components/${componentId}/options`, { params }),

    get: <T = Configurator3DOption>(configId: string, componentId: string, id: string) =>
      api.get<T>(`${PREFIX}/configurations/${configId}/components/${componentId}/options/${id}`),

    create: <T = Configurator3DOption>(configId: string, componentId: string, data: Record<string, unknown>) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/components/${componentId}/options`, data),

    bulkCreate: <T = Configurator3DOption[]>(configId: string, componentId: string, data: { options: Record<string, unknown>[] }) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/components/${componentId}/options/bulk`, data),

    update: <T = Configurator3DOption>(configId: string, componentId: string, id: string, data: Record<string, unknown>) =>
      api.put<T>(`${PREFIX}/configurations/${configId}/components/${componentId}/options/${id}`, data),

    delete: <T = void>(configId: string, componentId: string, id: string) =>
      api.delete<T>(`${PREFIX}/configurations/${configId}/components/${componentId}/options/${id}`),
  },

  rules: {
    list: <T = Configurator3DRule[]>(configId: string) =>
      api.get<T>(`${PREFIX}/configurations/${configId}/rules`),

    get: <T = Configurator3DRule>(configId: string, id: string) =>
      api.get<T>(`${PREFIX}/configurations/${configId}/rules/${id}`),

    create: <T = Configurator3DRule>(configId: string, data: Record<string, unknown>) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/rules`, data),

    update: <T = Configurator3DRule>(configId: string, id: string, data: Record<string, unknown>) =>
      api.put<T>(`${PREFIX}/configurations/${configId}/rules/${id}`, data),

    delete: <T = void>(configId: string, id: string) =>
      api.delete<T>(`${PREFIX}/configurations/${configId}/rules/${id}`),

    validate: <T = { valid: boolean; errors: unknown[] }>(configId: string, data: { rule: Record<string, unknown> }) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/rules/validate`, data),
  },

  sessions: {
    start: <T = { id: string; sessionId: string; configurationId: string; status: string }>(data: StartSessionRequest) =>
      api.post<T>(`${PREFIX}/sessions`, data),

    get: <T = Configurator3DSession>(id: string) =>
      api.get<T>(`${PREFIX}/sessions/${id}`),

    update: <T = Configurator3DSession>(id: string, data: UpdateSessionRequest) =>
      api.put<T>(`${PREFIX}/sessions/${id}`, data),

    interaction: <T = void>(id: string, data: { type: string; timestamp?: number; data?: Record<string, unknown> }) =>
      api.post<T>(`${PREFIX}/sessions/${id}/interactions`, data),

    save: <T = { id: string; name?: string; savedAt: string }>(id: string, data: SaveDesignRequest) =>
      api.post<T>(`${PREFIX}/sessions/${id}/save`, data),

    complete: <T = void>(id: string) =>
      api.post<T>(`${PREFIX}/sessions/${id}/complete`),

    addToCart: <T = { success: boolean; cartId?: string }>(id: string, data?: Record<string, unknown>) =>
      api.post<T>(`${PREFIX}/sessions/${id}/add-to-cart`, data ?? {}),

    delete: <T = void>(id: string) =>
      api.delete<T>(`${PREFIX}/sessions/${id}`),

    listAll: <T = unknown>(params?: ListParams) =>
      api.get<T>(`${PREFIX}/sessions`, { params }),
  },

  pricing: {
    calculate: <T = PriceBreakdown>(configId: string, data: CalculatePriceRequest) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/calculate-price`, data),

    breakdown: <T = PriceBreakdown>(configId: string) =>
      api.get<T>(`${PREFIX}/configurations/${configId}/pricing/breakdown`),

    updateSettings: <T = unknown>(configId: string, data: Record<string, unknown>) =>
      api.put<T>(`${PREFIX}/configurations/${configId}/pricing`, data),

    simulate: <T = PriceBreakdown>(configId: string, data: CalculatePriceRequest) =>
      api.post<T>(`${PREFIX}/configurations/${configId}/pricing/simulate`, data),
  },

  export: {
    pdf: (sessionId: string, data?: ExportPDFOptions) =>
      api.post<ExportJobResponse>(`${PREFIX}/sessions/${sessionId}/export/pdf`, data ?? {}),

    ar: (sessionId: string, data?: ExportAROptions) =>
      api.post<ExportJobResponse>(`${PREFIX}/sessions/${sessionId}/export/ar`, data ?? {}),

    threeD: (sessionId: string, data?: Export3DOptions) =>
      api.post<ExportJobResponse>(`${PREFIX}/sessions/${sessionId}/export/3d`, data ?? {}),

    image: (sessionId: string, data?: ExportImageOptions) =>
      api.post<ExportJobResponse>(`${PREFIX}/sessions/${sessionId}/export/image`, data ?? {}),

    status: (sessionId: string, jobId: string) =>
      api.get<ExportStatusResponse>(`${PREFIX}/sessions/${sessionId}/export/${jobId}/status`),

    download: (sessionId: string, jobId: string) =>
      api.get<Blob>(`${PREFIX}/sessions/${sessionId}/export/${jobId}/download`, { responseType: 'blob' }),
  },

  analytics: {
    dashboard: <T = unknown>(params?: ListParams & { startDate?: string; endDate?: string }) =>
      api.get<T>(`${PREFIX}/analytics/dashboard`, { params }),

    sessions: <T = unknown>(params?: ListParams & { startDate?: string; endDate?: string }) =>
      api.get<T>(`${PREFIX}/analytics/sessions`, { params }),

    options: <T = unknown>(configId: string) =>
      api.get<T>(`${PREFIX}/analytics/options/${configId}`),

    funnel: <T = unknown>(configId: string, params?: { startDate?: string; endDate?: string }) =>
      api.get<T>(`${PREFIX}/analytics/funnel/${configId}`, { params }),

    export: <T = unknown>(params?: ListParams & { format?: string; startDate?: string; endDate?: string }) =>
      api.get<T>(`${PREFIX}/analytics/export`, { params }),
  },

  savedDesigns: {
    get: <T = SavedDesignResponse>(id: string) =>
      api.get<T>(`${PREFIX}/saved-designs/${id}`),

    getByToken: <T = SavedDesignResponse>(token: string) =>
      api.get<T>(`${PREFIX}/saved-designs/token/${token}`),

    list: <T = unknown>(params?: ListParams) =>
      api.get<T>(`${PREFIX}/saved-designs`, { params }),

    delete: <T = void>(id: string) =>
      api.delete<T>(`${PREFIX}/saved-designs/${id}`),
  },
};