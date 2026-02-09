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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          {isDemoMode && (
            <span className="dash-badge dash-badge-pro px-2.5 py-1 rounded-full text-xs font-medium">
              Mode Démo
            </span>
          )}
        </div>
        <p className="text-white/60 mt-1">Bienvenue ! Voici un aperçu de votre activité.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
          {(['24h', '7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
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
          className="border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
        <DemoModeToggle />
      </div>
    </div>
  );
}
