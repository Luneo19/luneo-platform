import { useEffect, useRef, useState } from 'react';
import type { UsageMetricType } from '@luneo/billing-plans';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface TopupSimulationResult {
  brandId: string;
  metric: UsageMetricType;
  unit: string;
  baseLimit: number;
  bonusUnits: number;
  effectiveLimit: number;
  simulatedLimit: number;
  current: number;
  currentPercentage: number;
  simulatedPercentage: number;
  originalDaysToLimit: number | null;
  simulatedDaysToLimit: number | null;
  regainedDays: number | null;
  estimatedCostCents: number | null;
  overagePolicy: 'block' | 'charge' | 'none';
}

interface UseTopupSimulationState {
  data: TopupSimulationResult | null;
  loading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 300;

export function useTopupSimulation(
  metric: UsageMetricType | null,
  units: number,
  enabled: boolean,
): UseTopupSimulationState {
  const [data, setData] = useState<TopupSimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !metric) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (units === 0) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setError(null);
        const response = await api.post<TopupSimulationResult>('/usage-billing/topups/simulate', {
          metric,
          units,
        });
        setData(response);
      } catch (err) {
        logger.error('Failed to simulate top-up', {
          error: err,
          metric,
          units,
        });
        setError('Simulation indisponible pour le moment.');
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [metric, units, enabled]);

  return { data, loading, error };
}

