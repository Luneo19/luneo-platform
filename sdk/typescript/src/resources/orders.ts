/**
 * Orders Resource
 */

import { AxiosInstance } from 'axios';
import { Order, CreateOrderRequest } from '../types';

export class OrdersResource {
  constructor(private axios: AxiosInstance) {}

  /**
   * Create a new order
   */
  async create(request: CreateOrderRequest): Promise<Order> {
    const response = await this.axios.post('/orders', request);
    return response.data;
  }

  /**
   * Get a specific order by ID
   */
  async get(id: string): Promise<Order> {
    const response = await this.axios.get(`/orders/${id}`);
    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancel(id: string): Promise<Order> {
    const response = await this.axios.post(`/orders/${id}/cancel`);
    return response.data;
  }
}
