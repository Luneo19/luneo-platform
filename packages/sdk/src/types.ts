import type { Design, Order } from '@luneo/types';

export interface LuneoClientOptions {
  baseUrl?: string;
  apiKey?: string;
  organisationId?: string;
  /**
   * Custom fetch implementation (falls back to cross-fetch).
   */
  fetch?: typeof fetch;
}

export interface CreateDesignPayload {
  prompt: string;
  productId: string;
  options?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GenerateHighResPayload {
  designId: string;
  resolution?: '2k' | '4k' | '8k';
}

export interface ListDesignsParams extends Record<string, unknown> {
  status?: Design['status'];
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ListOrdersParams extends Record<string, unknown> {
  status?: Order['status'];
  page?: number;
  pageSize?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

