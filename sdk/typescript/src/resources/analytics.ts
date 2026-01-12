/**
 * Analytics Resource
 */

import { AxiosInstance } from 'axios';
import { AnalyticsOverview } from '../types';

export class AnalyticsResource {
  constructor(private axios: AxiosInstance) {}

  /**
   * Get analytics overview
   */
  async overview(params?: { start?: string; end?: string }): Promise<AnalyticsOverview> {
    const response = await this.axios.get('/analytics/overview', { params });
    return response.data;
  }
}
