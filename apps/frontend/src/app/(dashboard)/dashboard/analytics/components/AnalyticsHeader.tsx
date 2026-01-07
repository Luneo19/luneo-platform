/**
 * Header de la page Analytics
 */

'use client';

import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TimeRange } from '../types';

interface AnalyticsHeaderProps {
  onExport: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function AnalyticsHeader({
  onExport,
  onRefresh,
  isRefreshing = false,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-cyan-400" />
          Analytics
        </h1>
        <p className="text-gray-400 mt-1">
          Insights et métriques pour optimiser vos performances
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="border-gray-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button
          variant="outline"
          onClick={onExport}
          className="border-gray-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  );
}


