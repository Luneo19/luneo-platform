'use client';

import { Sparkles } from 'lucide-react';

export function OverviewLoadingState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center dash-bg">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/[0.06] border-t-purple-500 rounded-full animate-spin mx-auto" />
          <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-white/60 mt-4">Chargement de vos données...</p>
        <div className="mt-6 flex justify-center gap-3">
          <div className="dash-kpi-loading h-12 w-32 rounded-xl" />
          <div className="dash-kpi-loading h-12 w-32 rounded-xl" />
          <div className="dash-kpi-loading h-12 w-32 rounded-xl" />
          <div className="dash-kpi-loading h-12 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
