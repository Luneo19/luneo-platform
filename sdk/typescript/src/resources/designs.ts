/**
 * Designs Resource
 */

import { AxiosInstance } from 'axios';
import { Design, CreateDesignRequest } from '../types';

export class DesignsResource {
  constructor(private axios: AxiosInstance) {}

  /**
   * Create a new design with AI
   */
  async create(request: CreateDesignRequest): Promise<Design> {
    const response = await this.axios.post('/designs', request);
    return response.data;
  }

  /**
   * Get a specific design by ID
   */
  async get(id: string): Promise<Design> {
    const response = await this.axios.get(`/designs/${id}`);
    return response.data;
  }

  /**
   * Wait for design completion (polling)
   */
  async waitForCompletion(
    id: string,
    options?: { interval?: number; timeout?: number }
  ): Promise<Design> {
    const interval = options?.interval || 2000; // 2 seconds
    const timeout = options?.timeout || 300000; // 5 minutes
    const startTime = Date.now();

    while (true) {
      const design = await this.get(id);

      if (design.status === 'completed') {
        return design;
      }

      if (design.status === 'failed') {
        throw new Error('Design generation failed');
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Design generation timeout');
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}
