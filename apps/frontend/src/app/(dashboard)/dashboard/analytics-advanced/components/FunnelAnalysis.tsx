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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Analyse de Funnel</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Analyse de Funnel</CardTitle>
        <CardDescription>Parcours de conversion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnelData.map((step, index) => (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-medium text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="text-white font-medium">{step.name}</p>
                  <p className="text-gray-400 text-sm">
                    {formatNumber(step.users)} utilisateurs ({step.percentage}%)
                  </p>
                </div>
              </div>
              {step.dropOff > 0 && (
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <TrendingDown className="w-4 h-4" />
                  {step.dropOff}% drop-off
                </div>
              )}
            </div>
            <Progress value={step.percentage} className="h-2" />
            {index < funnelData.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="w-px h-4 bg-gray-700" />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}



