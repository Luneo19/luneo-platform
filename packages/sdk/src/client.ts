import type { Design, Order } from '@luneo/types';
import crossFetch from 'cross-fetch';
import {
  ApiResponse,
  CreateDesignPayload,
  GenerateHighResPayload,
  ListDesignsParams,
  ListOrdersParams,
  LuneoClientOptions,
} from './types';

const DEFAULT_BASE_URL = 'https://app.luneo.app/api/v1';

export class LuneoClient {
  private baseUrl: string;
  private apiKey?: string;
  private organisationId?: string;
  private fetchImpl: typeof fetch;

  constructor(options: LuneoClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.apiKey = options.apiKey;
    this.organisationId = options.organisationId;
    this.fetchImpl = options.fetch ?? crossFetch;
  }

  setApiKey(apiKey: string): this {
    this.apiKey = apiKey;
    return this;
  }

  setOrganisation(organisationId: string): this {
    this.organisationId = organisationId;
    return this;
  }

  async listDesigns(params: ListDesignsParams = {}): Promise<Design[]> {
    const response = await this.request<ApiResponse<{ items: Design[] }>>('/designs', {
      searchParams: params,
    });
    return response.data?.items ?? [];
  }

  async createDesign(payload: CreateDesignPayload): Promise<Design> {
    const response = await this.request<ApiResponse<Design>>('/designs', {
      method: 'POST',
      body: payload,
    });
    if (!response.data) {
      throw new Error(response.error ?? 'Unable to create design');
    }
    return response.data;
  }

  async generateHighRes(payload: GenerateHighResPayload): Promise<{ jobId: string }> {
    const response = await this.request<ApiResponse<{ jobId: string }>>(
      `/designs/${payload.designId}/highres`,
      {
        method: 'POST',
        body: { resolution: payload.resolution },
      },
    );
    if (!response.data) {
      throw new Error(response.error ?? 'Unable to generate high resolution asset');
    }
    return response.data;
  }

  async listOrders(params: ListOrdersParams = {}): Promise<Order[]> {
    const response = await this.request<ApiResponse<{ items: Order[] }>>('/orders', {
      searchParams: params,
    });
    return response.data?.items ?? [];
  }

  async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      searchParams?: Record<string, unknown>;
      headers?: Record<string, string>;
    } = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (options.searchParams) {
      Object.entries(options.searchParams).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        url.searchParams.set(key, String(value));
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    if (this.organisationId) {
      headers['x-luneo-organisation'] = this.organisationId;
    }

    const response = await this.fetchImpl(url.toString(), {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const json = text ? (JSON.parse(text) as T) : ({} as T);

    if (!response.ok) {
      const message = (json as any)?.error ?? response.statusText;
      throw new Error(`Luneo API Error (${response.status}): ${message}`);
    }

    return json;
  }
}

