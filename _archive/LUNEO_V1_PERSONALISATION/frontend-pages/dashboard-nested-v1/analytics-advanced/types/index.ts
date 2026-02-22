/**
 * Types pour Analytics Advanced
 */

export type AnalyticsView = 'overview' | 'funnel' | 'cohort' | 'segments' | 'geographic' | 'behavioral';
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface FunnelStep {
  id: string;
  name: string;
  users: number;
  percentage: number;
  dropOff: number;
}

export interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
  revenue: number[];
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  userCount: number;
  criteria: Record<string, unknown>;
}

export interface GeographicData {
  country: string;
  users: number;
  revenue: number;
  percentage: number;
}

export interface BehavioralEvent {
  id: string;
  name: string;
  count: number;
  uniqueUsers: number;
  conversionRate: number;
}



