import { useCallback, useEffect, useState } from 'react';
import type { UsageMetricType } from '@/lib/billing-plans';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface TopupHistoryEntry {
  id: string;
  brandId: string;
  metric: UsageMetricType;
  units: number;
  unitPriceCents: number;
  totalPriceCents: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface UseTopupHistoryState {
  data: TopupHistoryEntry[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useTopupHistory(autoLoad: boolean = true): UseTopupHistoryState {
  const [data, setData] = useState<TopupHistoryEntry[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TopupHistoryEntry[]>('/usage-billing/topups/history');
      setData(response ?? []);
    } catch (err) {
      logger.error('Failed to load topup history', {
        error: err,
      });
      setError('Historique indisponible pour le moment.');
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
    data,
    loading,
    error,
    reload: load,
  };
}

