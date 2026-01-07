/**
 * Types pour la page Analytics
 */

export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'number' | 'currency' | 'percentage';
  icon: React.ElementType;
  color: string;
  description?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
}

export interface AnalyticsData {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  users: number;
  usersChange: number;
  conversions: number;
  conversionsChange: number;
  avgOrderValue: number;
  avgOrderValueChange: number;
  conversionRate: number;
  conversionRateChange: number;
  chartData: ChartData;
  period: {
    start: string;
    end: string;
  };
  compare?: {
    revenue: number;
    orders: number;
    users: number;
    conversions: number;
    avgOrderValue: number;
    conversionRate: number;
    period: {
      start: string;
      end: string;
    };
  };
}


