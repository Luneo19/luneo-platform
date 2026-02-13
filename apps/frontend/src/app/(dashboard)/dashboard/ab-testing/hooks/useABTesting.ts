/**
 * Hook personnalisé pour gérer les tests A/B
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import type { Experiment, ExperimentStatus, ExperimentMetric } from '../types';

export function useABTesting(
  searchTerm: string,
  filterStatus: string
) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  const experimentsQuery = (trpc.abTesting as { list?: { useQuery: () => { data?: { experiments?: unknown[] }; isLoading: boolean; error: unknown; refetch: () => Promise<unknown> } } })?.list?.useQuery?.() ?? {
    data: { experiments: [] },
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };

  useEffect(() => {
    if (experimentsQuery.data?.experiments) {
      type ExpLike = { id: string; name?: string; description?: string; status?: string; metric?: string; confidence?: number; startDate?: string | Date; endDate?: string | Date; variants?: { id: string; name?: string; traffic?: number; conversions?: number; visitors?: number; revenue?: number; isControl?: boolean; isWinner?: boolean }[]; createdAt?: string | Date; updatedAt?: string | Date };
      const transformed: Experiment[] = (experimentsQuery.data.experiments as ExpLike[]).map((exp) => ({
        id: exp.id,
        name: exp.name || 'Test sans nom',
        description: exp.description || '',
        status: (exp.status || 'draft') as ExperimentStatus,
        metric: (exp.metric === 'conversions' ? 'conversion' : (exp.metric || 'conversion')) as ExperimentMetric,
        confidence: exp.confidence || 0,
        startDate: exp.startDate ? new Date(exp.startDate as string) : new Date(),
        endDate: exp.endDate ? new Date(exp.endDate as string) : undefined,
        variants: (exp.variants || []).map((v) => ({
          id: v.id,
          name: v.name || 'Variante',
          traffic: v.traffic || 50,
          conversions: v.conversions || 0,
          visitors: v.visitors || 0,
          revenue: v.revenue || 0,
          isControl: v.isControl || false,
          isWinner: v.isWinner || false,
        })),
        createdAt: exp.createdAt ? new Date(exp.createdAt) : new Date(),
        updatedAt: exp.updatedAt ? new Date(exp.updatedAt) : new Date(),
      }));
      setExperiments(transformed);
    }
  }, [experimentsQuery.data]);

  const filteredExperiments = useMemo(() => {
    return experiments.filter((exp) => {
      const matchesSearch =
        searchTerm === '' ||
        exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || exp.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [experiments, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const getConversionRate = (variant: { visitors: number; conversions: number }) => {
      if (variant.visitors === 0) return 0;
      return (variant.conversions / variant.visitors) * 100;
    };

    const getUplift = (experiment: Experiment) => {
      const control = experiment.variants.find((v) => v.isControl);
      const treatment = experiment.variants.find((v) => !v.isControl);

      if (!control || !treatment || control.visitors === 0) return null;

      const controlRate = control.conversions / control.visitors;
      const treatmentRate = treatment.conversions / treatment.visitors;

      if (controlRate === 0) return null;

      return ((treatmentRate - controlRate) / controlRate) * 100;
    };

    return {
      total: experiments.length,
      running: experiments.filter((e) => e.status === 'running').length,
      completed: experiments.filter((e) => e.status === 'completed').length,
      totalVisitors: experiments.reduce(
        (acc, e) => acc + e.variants.reduce((sum, v) => sum + v.visitors, 0),
        0
      ),
      totalConversions: experiments.reduce(
        (acc, e) => acc + e.variants.reduce((sum, v) => sum + v.conversions, 0),
        0
      ),
      avgConfidence:
        experiments.length > 0
          ? experiments.reduce((acc, e) => acc + e.confidence, 0) / experiments.length
          : 0,
      avgUplift:
        experiments.filter((e) => getUplift(e) !== null).length > 0
          ? experiments
              .filter((e) => getUplift(e) !== null)
              .reduce((acc, e) => acc + (getUplift(e) || 0), 0) /
            experiments.filter((e) => getUplift(e) !== null).length
          : 0,
    };
  }, [experiments]);

  const updateMutation = (trpc.abTesting as { update?: { useMutation: () => { mutateAsync: (input: { id: string; status: ExperimentStatus }) => Promise<unknown> } } })?.update?.useMutation?.();

  const toggleExperiment = async (id: string, status: ExperimentStatus) => {
    try {
      if (!updateMutation) {
        throw new Error('Update mutation not available');
      }

      logger.info('Toggle experiment', { id, status });
      
      await updateMutation.mutateAsync({
        id,
        status,
      });

      // Update local state optimistically
      setExperiments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
      
      toast({ title: t('common.success'), description: t('common.success') });
      return { success: true };
    } catch (error: unknown) {
      logger.error('Failed to toggle experiment', { error });
      const message = getErrorDisplayMessage(error);
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  };

  return {
    experiments: filteredExperiments,
    allExperiments: experiments,
    stats,
    isLoading: experimentsQuery.isLoading,
    error: experimentsQuery.error,
    refetch: experimentsQuery.refetch,
    toggleExperiment,
  };
}



