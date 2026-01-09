export interface AnalyticsMetrics {
  totalDesigns: number;
  totalRenders: number;
  activeUsers: number;
  revenue: number;
  conversionRate: number;
  avgSessionDuration: string;
}

export interface AnalyticsChart {
  date: string;
  count?: number;
  amount?: number;
}

export interface AnalyticsDashboard {
  period: string;
  metrics: AnalyticsMetrics;
  charts: {
    designsOverTime: AnalyticsChart[];
    revenueOverTime: AnalyticsChart[];
    viewsOverTime?: AnalyticsChart[];
    conversionChange?: number;
  };
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  brandId?: string;
  userId?: string;
  productId?: string;
  period?: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export interface AnalyticsReport {
  id: string;
  type: 'usage' | 'revenue' | 'performance' | 'custom';
  filters: AnalyticsFilters;
  data: any;
  generatedAt: Date;
  generatedBy: string;
}


