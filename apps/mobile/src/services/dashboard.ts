import { apiService } from './api';

export interface DashboardOverview {
  metrics: {
    designsGenerated: number;
    activeOrders: number;
    revenue: number;
    conversionRate: number;
  };
  revenueTrend: {
    labels: string[];
    values: number[];
  };
  topDesigns: Array<{
    id: string;
    name: string;
    thumbnailUrl?: string;
    status: string;
    createdAt: string;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

const fallbackOverview: DashboardOverview = {
  metrics: {
    designsGenerated: 128,
    activeOrders: 42,
    revenue: 18450,
    conversionRate: 12.4,
  },
  revenueTrend: {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    values: [1200, 1650, 1420, 1800, 2100, 1950, 1750],
  },
  topDesigns: [
    {
      id: 'design-1',
      name: 'Chaise lounge moderne',
      thumbnailUrl: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=400&q=60',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'design-2',
      name: 'Lampe Art Déco',
      thumbnailUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=60',
      status: 'PROCESSING',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ],
  recentOrders: [
    {
      id: 'order-1',
      customer: 'Atelier Nova',
      total: 1299,
      status: 'processing',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'order-2',
      customer: 'Design & Co',
      total: 899,
      status: 'shipped',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ],
};

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    const endpoints = ['/mobile/dashboard/overview', '/analytics/overview'];

    for (const endpoint of endpoints) {
      try {
        const response = await apiService.get<DashboardOverview>(endpoint);
        if (response?.metrics) {
          return response;
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(`Dashboard overview fallback for endpoint ${endpoint}`, error);
        }
      }
    }

    return fallbackOverview;
  },
};
