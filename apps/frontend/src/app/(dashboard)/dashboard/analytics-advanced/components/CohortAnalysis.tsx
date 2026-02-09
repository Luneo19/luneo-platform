/**
 * Analyse de cohortes
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils/formatters';
import type { CohortData } from '../types';

interface CohortAnalysisProps {
  cohortData: CohortData[];
}

export function CohortAnalysis({ cohortData }: CohortAnalysisProps) {
  if (cohortData.length === 0) {
    return (
      <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-white">Analyse de Cohortes</CardTitle>
          <CardDescription className="text-white/60">Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="text-white">Analyse de Cohortes</CardTitle>
        <CardDescription className="text-white/60">Rétention par cohorte</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cohortData.slice(0, 10).map((cohort) => (
            <div
              key={cohort.cohort}
              className="flex items-center justify-between rounded-lg bg-white/[0.04] p-3"
            >
              <div>
                <p className="font-medium text-white">{cohort.cohort}</p>
                <p className="text-sm text-white/60">{formatNumber(cohort.size)} utilisateurs</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">
                  {cohort.retention[0]?.toFixed(1) || 0}% rétention
                </p>
                <p className="text-sm text-white/60">
                  {formatNumber(cohort.revenue.reduce((a, b) => a + b, 0))}€ revenus
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



