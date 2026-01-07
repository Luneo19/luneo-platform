/**
 * Types pour AB Testing
 */

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type ExperimentMetric = 'conversion' | 'revenue' | 'engagement' | 'custom';

export interface Variant {
  id: string;
  name: string;
  traffic: number; // Percentage
  conversions: number;
  visitors: number;
  revenue: number;
  isControl: boolean;
  isWinner?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  metric: ExperimentMetric;
  confidence: number; // Statistical confidence (0-100)
  startDate: Date;
  endDate?: Date;
  variants: Variant[];
  createdAt: Date;
  updatedAt: Date;
}


