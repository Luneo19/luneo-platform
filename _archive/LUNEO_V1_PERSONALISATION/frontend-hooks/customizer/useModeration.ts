/**
 * useModeration
 * Moderation management hook (admin only)
 * Handles flagged designs, approval, rejection, and escalation
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface FlaggedDesign {
  id: string;
  designId: string;
  reason: string;
  flaggedBy?: string;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  designData?: Record<string, unknown>;
}

interface ModerationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  escalated: number;
}

interface UseModerationReturn {
  flaggedDesigns: FlaggedDesign[];
  isLoading: boolean;
  error: Error | null;
  stats: ModerationStats | null;
  approve: (id: string) => Promise<void>;
  reject: (id: string, reason: string) => Promise<void>;
  escalate: (id: string) => Promise<void>;
  refetch: () => void;
}

/**
 * Moderation management hook (admin)
 */
export function useModeration(): UseModerationReturn {
  const [flaggedDesigns, setFlaggedDesigns] = useState<FlaggedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<ModerationStats | null>(null);

  const fetchFlaggedDesigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get<{ designs: FlaggedDesign[]; stats: ModerationStats }>(
        '/api/v1/visual-customizer/moderation/flagged'
      );

      setFlaggedDesigns(result.designs || []);
      setStats(result.stats || null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch flagged designs');
      setError(errorObj);
      logger.error('useModeration: fetchFlaggedDesigns failed', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approve = useCallback(
    async (id: string): Promise<void> => {
      try {
        await api.post(`/api/v1/visual-customizer/moderation/${id}/approve`);
        await fetchFlaggedDesigns();
        logger.info('useModeration: design approved', { id });
      } catch (err) {
        logger.error('useModeration: approve failed', { error: err, id });
        throw err;
      }
    },
    [fetchFlaggedDesigns]
  );

  const reject = useCallback(
    async (id: string, reason: string): Promise<void> => {
      try {
        await api.post(`/api/v1/visual-customizer/moderation/${id}/reject`, { reason });
        await fetchFlaggedDesigns();
        logger.info('useModeration: design rejected', { id, reason });
      } catch (err) {
        logger.error('useModeration: reject failed', { error: err, id });
        throw err;
      }
    },
    [fetchFlaggedDesigns]
  );

  const escalate = useCallback(
    async (id: string): Promise<void> => {
      try {
        await api.post(`/api/v1/visual-customizer/moderation/${id}/escalate`);
        await fetchFlaggedDesigns();
        logger.info('useModeration: design escalated', { id });
      } catch (err) {
        logger.error('useModeration: escalate failed', { error: err, id });
        throw err;
      }
    },
    [fetchFlaggedDesigns]
  );

  // Initial fetch
  useEffect(() => {
    fetchFlaggedDesigns();
  }, [fetchFlaggedDesigns]);

  return {
    flaggedDesigns,
    isLoading,
    error,
    stats,
    approve,
    reject,
    escalate,
    refetch: fetchFlaggedDesigns,
  };
}
