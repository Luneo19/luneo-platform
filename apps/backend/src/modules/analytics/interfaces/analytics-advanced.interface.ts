/**
 * ★★★ INTERFACES - ANALYTICS AVANCÉES ★★★
 * Interfaces TypeScript pour les analytics avancées
 * Respecte les patterns existants du projet
 */

// ========================================
// FUNNELS
// ========================================

export interface FunnelStep {
  id: string;
  name: string;
  eventType: string;
  order: number;
  description?: string;
}

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  isActive: boolean;
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelData {
  funnelId: string;
  steps: Array<{
    stepId: string;
    stepName: string;
    users: number;
    conversion: number; // Pourcentage
    dropoff: number; // Pourcentage
    details?: Record<string, any>;
  }>;
  totalConversion: number;
  dropoffPoint?: string;
}

// ========================================
// COHORTES
// ========================================

export interface Cohort {
  id: string;
  cohortDate: Date;
  period: number; // 7, 30, 90, 180, 365
  retention: number; // 0-100
  revenue: number;
  userCount: number;
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CohortAnalysis {
  cohorts: Array<{
    cohort: string; // "Jan 2024"
    users: number;
    retention30: number;
    retention90: number;
    ltv: number;
    revenue: number;
  }>;
  trends: {
    retention: 'up' | 'down' | 'stable';
    revenue: 'up' | 'down' | 'stable';
  };
}

// ========================================
// SEGMENTS
// ========================================

export interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, any>; // Flexible pour différents critères
  userCount: number;
  isActive: boolean;
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// PRÉDICTIONS
// ========================================

export interface Prediction {
  id: string;
  type: 'revenue' | 'conversion' | 'churn' | 'ltv' | 'retention';
  value: number;
  confidence: number; // 0-1
  period: '7d' | '30d' | '90d' | '1y';
  metadata?: Record<string, any>;
  brandId: string;
  createdAt: Date;
}

export interface RevenuePrediction {
  scenario: 'conservative' | 'optimistic' | 'very_optimistic';
  revenue: number;
  probability: number; // 0-100
  factors: string[];
  confidence: number;
}

// ========================================
// CORRÉLATIONS
// ========================================

export interface Correlation {
  metric1: string;
  metric2: string;
  correlation: number; // -1 à 1
  significance: 'high' | 'medium' | 'low';
  insight: string;
}

// ========================================
// ANOMALIES
// ========================================

export interface Anomaly {
  id: string;
  type: string;
  date: Date;
  value: string;
  expected: string;
  severity: 'high' | 'medium' | 'low';
  cause: string;
  action: string;
}

// ========================================
// FILTRES & OPTIONS
// ========================================

export interface AnalyticsAdvancedFilters {
  brandId: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  segmentId?: string;
  period?: 'hour' | 'day' | 'week' | 'month' | 'year';
}










