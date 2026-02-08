'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { DemoModeToggle } from '@/components/demo/DemoModeToggle';

type Period = '24h' | '7d' | '30d' | '90d';

export function OverviewHeader({
  selectedPeriod,
  onPeriodChange,
  onRefresh,
  isDemoMode,
}: {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  onRefresh: () => void;
  isDemoMode: boolean;
}) {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          {isDemoMode && (
            <span className="px-2.5 py-1 bg-purple-100 border border-purple-200 rounded-full text-xs font-medium text-purple-700">
              Mode Démo
            </span>
          )}
        </div>
        <p className="text-gray-600 mt-1">Bienvenue ! Voici un aperçu de votre activité.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {(['24h', '7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === period ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="bg-slate-800/50 border-slate-700 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
        <DemoModeToggle />
      </div>
    </div>
  );
}
