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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Analyse de Cohortes</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Analyse de Cohortes</CardTitle>
        <CardDescription>Rétention par cohorte</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cohortData.slice(0, 10).map((cohort) => (
            <div
              key={cohort.cohort}
              className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">{cohort.cohort}</p>
                <p className="text-gray-400 text-sm">{formatNumber(cohort.size)} utilisateurs</p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">
                  {cohort.retention[0]?.toFixed(1) || 0}% rétention
                </p>
                <p className="text-gray-400 text-sm">
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


