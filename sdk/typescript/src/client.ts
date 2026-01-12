/**
 * Luneo API Client
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { LuneoClientConfig, LuneoError, LuneoAPIError } from './types';
import { ProductsResource } from './resources/products';
import { DesignsResource } from './resources/designs';
import { OrdersResource } from './resources/orders';
import { AnalyticsResource } from './resources/analytics';

export class LuneoClient {
  private axiosInstance: AxiosInstance;
  public products: ProductsResource;
  public designs: DesignsResource;
  public orders: OrdersResource;
  public analytics: AnalyticsResource;

  constructor(config: LuneoClientConfig) {
    const baseURL = config.baseURL || 'https://api.luneo.com/api/v1';
    const timeout = config.timeout || 30000;

    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });

    // Add request interceptor for retries
    this.axiosInstance.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<LuneoError>) => {
        if (error.response?.data?.error) {
          throw new LuneoAPIError(
            error.response.data.error,
            error.response.status
          );
        }
        throw error;
      }
    );

    // Initialize resources
    this.products = new ProductsResource(this.axiosInstance);
    this.designs = new DesignsResource(this.axiosInstance);
    this.orders = new OrdersResource(this.axiosInstance);
    this.analytics = new AnalyticsResource(this.axiosInstance);
  }

  /**
   * Health check endpoint
   */
  async health(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await this.axiosInstance.get('/health');
    return response.data;
  }

  /**
   * Get rate limit information from response headers
   */
  getRateLimitInfo(): {
    limit: number;
    remaining: number;
    reset: number;
  } | null {
    const headers = this.axiosInstance.defaults.headers.common;
    const limit = headers['X-RateLimit-Limit'];
    const remaining = headers['X-RateLimit-Remaining'];
    const reset = headers['X-RateLimit-Reset'];

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit as string, 10),
        remaining: parseInt(remaining as string, 10),
        reset: parseInt(reset as string, 10),
      };
    }

    return null;
  }
}
