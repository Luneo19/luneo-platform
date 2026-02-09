/**
 * Header de la page Analytics Advanced
 */

'use client';

import { BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsAdvancedHeaderProps {
  onExport: () => void;
}

export function AnalyticsAdvancedHeader({ onExport }: AnalyticsAdvancedHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[#8b5cf6]" />
          Analytics Avancées
        </h1>
        <p className="mt-1 text-white/60">
          Analyses approfondies : Funnels, Cohortes, Segments
        </p>
      </div>
      <Button onClick={onExport} variant="outline" className="dash-input border-white/[0.06] bg-white/[0.03] text-white hover:bg-white/[0.06]">
        <Sparkles className="w-4 h-4 mr-2" />
        Exporter
      </Button>
    </div>
  );
}



