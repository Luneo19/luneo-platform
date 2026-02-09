/**
 * ★★★ FUNNEL CHART ★★★
 * Graphique en entonnoir pour visualiser le funnel de conversion
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import type { FunnelData } from '@/hooks/admin/use-analytics';

export interface FunnelChartProps {
  funnel: FunnelData[];
  isLoading?: boolean;
}

export function FunnelChart({ funnel, isLoading }: FunnelChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-white/60">Loading funnel data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (funnel.length === 0) {
    return (
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-white/60">No funnel data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trouver le maximum pour calculer les largeurs relatives
  const maxCount = Math.max(...funnel.map((f) => f.count));

  return (
    <Card className="bg-white/[0.03] border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-white">Conversion Funnel</CardTitle>
        <p className="text-sm text-white/60 mt-2">
          User journey from visitors to paying customers
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel.map((stage, index) => {
            const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const isLast = index === funnel.length - 1;
            const nextStage = !isLast ? funnel[index + 1] : null;
            const dropoffPercent = nextStage
              ? ((stage.count - nextStage.count) / stage.count) * 100
              : 0;

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white w-32">
                      {stage.stage}
                    </span>
                    <span className="text-sm text-white/60">
                      {formatNumber(stage.count)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span>{stage.conversion.toFixed(1)}% conversion</span>
                    {dropoffPercent > 0 && (
                      <span className="text-red-400">
                        {dropoffPercent.toFixed(1)}% dropoff
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  {/* Bar principale */}
                  <div
                    className={cn(
                      'h-12 rounded-lg transition-all duration-500 flex items-center justify-between px-4',
                      index === 0 && 'bg-gradient-to-r from-blue-600 to-blue-500',
                      index === 1 && 'bg-gradient-to-r from-purple-600 to-purple-500',
                      index === 2 && 'bg-gradient-to-r from-pink-600 to-pink-500',
                      index === 3 && 'bg-gradient-to-r from-orange-600 to-orange-500',
                      index === 4 && 'bg-gradient-to-r from-green-600 to-green-500'
                    )}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {formatNumber(stage.count)}
                    </span>
                    <span className="text-white/80 text-xs">
                      {stage.conversion.toFixed(1)}%
                    </span>
                  </div>

                  {/* Dropoff indicator */}
                  {dropoffPercent > 0 && !isLast && (
                    <div
                      className="absolute top-12 left-0 h-2 bg-red-500/30 rounded-b"
                      style={{
                        width: `${widthPercent}%`,
                        marginLeft: `${widthPercent}%`,
                        transform: 'translateX(-100%)',
                      }}
                    >
                      <div
                        className="h-full bg-red-500 rounded-b"
                        style={{ width: `${dropoffPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Arrow vers la prochaine étape */}
                {!isLast && (
                  <div className="flex justify-center py-2">
                    <div className="w-0.5 h-6 bg-white/[0.06]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-white/60">Overall Conversion</span>
            <p className="text-xl font-bold text-white mt-1">
              {funnel.length > 0 && funnel[0].count > 0
                ? ((funnel[funnel.length - 1].count / funnel[0].count) * 100).toFixed(2)
                : 0}
              %
            </p>
          </div>
          <div>
            <span className="text-xs text-white/60">Total Dropoff</span>
            <p className="text-xl font-bold text-red-400 mt-1">
              {funnel.length > 0 && funnel[0].count > 0
                ? (((funnel[0].count - funnel[funnel.length - 1].count) / funnel[0].count) *
                    100
                  ).toFixed(2)
                : 0}
              %
            </p>
          </div>
          <div>
            <span className="text-xs text-white/60">Final Customers</span>
            <p className="text-xl font-bold text-green-400 mt-1">
              {formatNumber(funnel[funnel.length - 1]?.count || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
