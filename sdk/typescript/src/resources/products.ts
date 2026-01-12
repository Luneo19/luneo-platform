/**
 * Products Resource
 */

import { AxiosInstance } from 'axios';
import { Product, PaginationParams, PaginatedResponse } from '../types';

export class ProductsResource {
  constructor(private axios: AxiosInstance) {}

  /**
   * List all products
   */
  async list(params?: PaginationParams & { category?: string; search?: string }): Promise<PaginatedResponse<Product>> {
    const response = await this.axios.get('/products', { params });
    return response.data;
  }

  /**
   * Get a specific product by ID
   */
  async get(id: string): Promise<Product> {
    const response = await this.axios.get(`/products/${id}`);
    return response.data;
  }
}
