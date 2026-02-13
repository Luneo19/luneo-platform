'use client';

import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';

/**
 * Fetches the current user's variant assignment for an A/B experiment.
 * @param experimentName - Name of the experiment (must be running)
 * @returns { variant, isLoading } - assigned variant id and loading state
 */
export function useExperiment(experimentName: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['experiment', experimentName],
    queryFn: () => endpoints.experiments.getAssignment(experimentName),
    enabled: Boolean(experimentName?.trim()),
    staleTime: 1000 * 60 * 60, // 1h - assignment is sticky
  });

  const response = data as { data?: { variant?: string }; variant?: string } | undefined;
  return {
    variant: response?.data?.variant ?? response?.variant ?? null,
    isLoading,
    error: error ?? null,
  };
}
