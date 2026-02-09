/**
 * ★★★ COHORT TABLE ★★★
 * Table avec heatmap pour l'analyse de cohort
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CohortData } from '@/hooks/admin/use-analytics';

export interface CohortTableProps {
  cohorts: CohortData[];
  isLoading?: boolean;
}

export function CohortTable({ cohorts, isLoading }: CohortTableProps) {
  // Préparer les données pour l'affichage
  const maxMonths = useMemo(() => {
    return Math.max(
      ...cohorts.map((c) =>
        Object.keys(c.retention).length > 0
          ? Math.max(...Object.keys(c.retention).map((k) => parseInt(k.replace('month_', ''))))
          : 0
      )
    );
  }, [cohorts]);

  const getRetentionColor = (value: number): string => {
    if (value >= 80) return 'bg-green-600';
    if (value >= 60) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    if (value >= 20) return 'bg-orange-500';
    if (value > 0) return 'bg-red-500';
    return 'bg-white/[0.06]';
  };

  if (isLoading) {
    return (
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white">Cohort Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-white/60">Loading cohort data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cohorts.length === 0) {
    return (
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white">Cohort Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-white/60">No cohort data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/[0.03] border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-white">Cohort Retention Analysis</CardTitle>
        <p className="text-sm text-white/60 mt-2">
          Retention rate by cohort and month
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-3 text-sm font-medium text-white/60">Cohort</th>
                <th className="text-center p-3 text-sm font-medium text-white/60">Customers</th>
                {Array.from({ length: Math.min(maxMonths + 1, 13) }, (_, i) => (
                  <th
                    key={i}
                    className="text-center p-3 text-xs font-medium text-white/60 min-w-[60px]"
                  >
                    M{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohort} className="border-b border-white/[0.06]">
                  <td className="p-3 text-sm text-white font-medium">{cohort.cohort}</td>
                  <td className="p-3 text-center text-sm text-white">{cohort.customers}</td>
                  {Array.from({ length: Math.min(maxMonths + 1, 13) }, (_, month) => {
                    const retentionKey = `month_${month}`;
                    const value = cohort.retention[retentionKey] || 0;
                    return (
                      <td key={month} className="p-2 text-center">
                        <div
                          className={cn(
                            'w-full h-8 rounded flex items-center justify-center text-xs font-medium',
                            getRetentionColor(value),
                            value > 0 ? 'text-white' : 'text-white/40'
                          )}
                          title={`${value.toFixed(1)}% retention`}
                        >
                          {value > 0 ? `${Math.round(value)}%` : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs text-white/60">
          <span>Retention Rate:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>80-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>60-79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>40-59%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>20-39%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>1-19%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/[0.06] rounded"></div>
            <span>0%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
