'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PlanDefinition, UsageMetricType } from '@/lib/billing-plans';

import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface UsageSummaryMetric {
  type: UsageMetricType;
  current: number;
  limit: number;
  percentage: number;
  overage: number;
}

export interface UsageSummaryEstimatedCost {
  base: number;
  usage: number;
  overage: number;
  total: number;
}

export interface UsageSummaryAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: UsageMetricType;
  threshold: number;
  timestamp: string;
}

export interface UsageSummaryPayload {
  brandId: string;
  period: {
    start: string;
    end: string;
    status: 'active' | 'ended' | 'invoiced';
  };
  metrics: UsageSummaryMetric[];
  estimatedCost: UsageSummaryEstimatedCost;
  alerts: UsageSummaryAlert[];
}

export interface UsageSummaryState {
  loading: boolean;
  error: string | null;
  summary: UsageSummaryPayload | null;
  plan: PlanDefinition | null;
  refresh: () => Promise<void>;
}

interface BackendUsageSummaryResponse {
  summary: UsageSummaryPayload;
  plan: PlanDefinition;
}

export function useUsageSummary(autoLoad: boolean = true): UsageSummaryState {
  const [summary, setSummary] = useState<UsageSummaryPayload | null>(null);
  const [plan, setPlan] = useState<PlanDefinition | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<BackendUsageSummaryResponse>('/api/v1/usage-billing/summary');
      setSummary(response.summary);
      setPlan(response.plan);
    } catch (err) {
      logger.error('Failed to load usage summary', {
        error: err,
      });
      setError('Impossible de récupérer votre consommation. Réessayez dans quelques instants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      void load();
    }
  }, [autoLoad, load]);

  return {
    loading,
    error,
    summary,
    plan,
    refresh: load,
  };
}

