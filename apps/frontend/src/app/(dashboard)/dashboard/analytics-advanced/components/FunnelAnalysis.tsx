/**
 * Analyse de funnel
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingDown } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import type { FunnelStep } from '../types';

interface FunnelAnalysisProps {
  funnelData: FunnelStep[];
}

export function FunnelAnalysis({ funnelData }: FunnelAnalysisProps) {
  if (funnelData.length === 0) {
    return (
      <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-white">Analyse de Funnel</CardTitle>
          <CardDescription className="text-white/60">Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="text-white">Analyse de Funnel</CardTitle>
        <CardDescription className="text-white/60">Parcours de conversion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnelData.map((step, index) => (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b82f6]/20 font-medium text-sm text-[#3b82f6]">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-white">{step.name}</p>
                  <p className="text-sm text-white/60">
                    {formatNumber(step.users)} utilisateurs ({step.percentage}%)
                  </p>
                </div>
              </div>
              {step.dropOff > 0 && (
                <div className="flex items-center gap-1 text-sm text-[#ef4444]">
                  <TrendingDown className="w-4 h-4" />
                  {step.dropOff}% drop-off
                </div>
              )}
            </div>
            <Progress value={step.percentage} className="h-2 bg-white/[0.08]" indicatorClassName="bg-[#8b5cf6]" />
            {index < funnelData.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="h-4 w-px bg-white/[0.06]" />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}



