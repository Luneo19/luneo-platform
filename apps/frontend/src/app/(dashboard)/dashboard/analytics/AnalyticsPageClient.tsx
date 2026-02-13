/**
 * Client Component pour la page Analytics
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Palette, Sparkles, Box, Camera } from 'lucide-react';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { AnalyticsFilters } from './components/AnalyticsFilters';
import { AnalyticsKPIs } from './components/AnalyticsKPIs';
import { MetricSelector } from './components/MetricSelector';
import { ExportAnalyticsModal } from './components/modals/ExportAnalyticsModal';
import { ExportButton } from '@/components/analytics/ExportButton';
import { Button } from '@/components/ui/button';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { useAnalyticsExport } from './hooks/useAnalyticsExport';
import { useI18n } from '@/i18n/useI18n';
import type { TimeRange, AnalyticsData } from './types';

// Lazy load AnalyticsCharts (Recharts is heavy ~200KB)
function AnalyticsChartsLoading() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center h-96 bg-gray-800/50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">{t('analytics.loadingCharts')}</p>
      </div>
    </div>
  );
}
const AnalyticsCharts = dynamic(() => import('./components/AnalyticsCharts').then(mod => ({ default: mod.AnalyticsCharts })), {
  ssr: false,
  loading: () => <AnalyticsChartsLoading />,
});

export function AnalyticsPageClient() {
  const { t } = useI18n();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [comparePeriod, setComparePeriod] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(['revenue', 'orders', 'users', 'conversions'])
  );
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  // États pour le debounce des dates personnalisées
  const [debouncedDateFrom, setDebouncedDateFrom] = useState('');
  const [debouncedDateTo, setDebouncedDateTo] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  
  // Debounce pour les dates personnalisées (évite trop de requêtes)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (timeRange === 'custom') {
      // Clear le timeout précédent
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Débouncer les changements de dates (500ms)
      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedDateFrom(customDateFrom);
        setDebouncedDateTo(customDateTo);
      }, 500);
      
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    } else {
      // Si on n'est plus en mode custom, mettre à jour immédiatement
      setDebouncedDateFrom('');
      setDebouncedDateTo('');
    }
  }, [customDateFrom, customDateTo, timeRange]);

  // Utiliser les dates débouncées pour éviter trop de requêtes
  const { data, metrics, isLoading, error, refetch } = useAnalyticsData(
    timeRange,
    comparePeriod,
    selectedMetrics,
    debouncedDateFrom,
    debouncedDateTo
  );

  const { exportAnalytics } = useAnalyticsExport();

  const handleToggleMetric = useCallback((metricId: string) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedMetrics(new Set(['revenue', 'orders', 'users', 'conversions', 'avgOrderValue', 'conversionRate']));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedMetrics(new Set());
  }, []);

  const handleExport = useCallback(() => {
    if (!data || !metrics.length) return;
    exportAnalytics(data as AnalyticsData, metrics, exportFormat);
    setShowExportModal(false);
  }, [data, metrics, exportFormat, exportAnalytics]);

  const chartData = useMemo(() => {
    if (!data?.chartData) {
      return { labels: [], datasets: [] };
    }
    return data.chartData;
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{t('analytics.errorLoading')}</p>
          <Button onClick={() => refetch()} className="bg-cyan-600 hover:bg-cyan-700">
            {t('analytics.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const moduleLinks = [
    { title: t('analytics.designs'), href: '/dashboard/analytics/designs', icon: Palette, description: t('analytics.designsDescription') },
    { title: t('analytics.ai'), href: '/dashboard/analytics/ai', icon: Sparkles, description: t('analytics.aiDescription') },
    { title: t('analytics.configurator'), href: '/dashboard/analytics/configurator', icon: Box, description: t('analytics.configuratorDescription') },
    { title: t('analytics.tryOn'), href: '/dashboard/analytics/try-on', icon: Camera, description: t('analytics.tryOnDescription') },
  ];

  return (
    <PlanGate
      minimumPlan="professional"
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <UpgradePrompt
            requiredPlan="professional"
            feature="Analytics"
            description={t('analytics.upgradeDescription')}
            variant="default"
          />
        </div>
      }
    >
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {moduleLinks.map(({ title, href, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:bg-gray-800 hover:border-cyan-500/50 transition-colors"
          >
            <Icon className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <AnalyticsHeader
          onExport={() => setShowExportModal(true)}
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
        />
        <ExportButton
          startDate={debouncedDateFrom ? new Date(debouncedDateFrom) : undefined}
          endDate={debouncedDateTo ? new Date(debouncedDateTo) : undefined}
        />
      </div>

      <AnalyticsFilters
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        comparePeriod={comparePeriod}
        onCompareChange={setComparePeriod}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        onCustomDateFromChange={setCustomDateFrom}
        onCustomDateToChange={setCustomDateTo}
      />

      <AnalyticsKPIs metrics={metrics} selectedMetrics={selectedMetrics} />

      <MetricSelector
        selectedMetrics={selectedMetrics}
        onToggleMetric={handleToggleMetric}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      <AnalyticsCharts chartData={chartData} isLoading={isLoading} />

      <ExportAnalyticsModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        exportFormat={exportFormat}
        onFormatChange={setExportFormat}
        onExport={handleExport}
      />
    </div>
    </PlanGate>
  );
}

