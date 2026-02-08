'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

interface CreditsData {
  balance: number;
  purchased: number;
  used: number;
}

interface UseCreditsReturn {
  credits: CreditsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isLow: boolean;
  isCritical: boolean;
}

export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      setError(null);
      const data = await endpoints.credits.balance();
      setCredits(data as CreditsData);
    } catch (err) {
      logger.error('Failed to fetch credits', err instanceof Error ? err : new Error(String(err)), {
        hook: 'useCredits',
      });
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
    
    // Refresh every 30s
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [fetchCredits]);

  const isLow = credits ? credits.balance < 20 : false;
  const isCritical = credits ? credits.balance < 5 : false;

  return {
    credits,
    loading,
    error,
    refetch: fetchCredits,
    isLow,
    isCritical,
  };
}













