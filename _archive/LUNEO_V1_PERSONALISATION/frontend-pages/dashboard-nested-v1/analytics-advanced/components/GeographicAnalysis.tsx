/**
 * Analyse géographique
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { formatNumber, formatPrice } from '@/lib/utils/formatters';
import type { GeographicData } from '../types';

interface GeographicAnalysisProps {
  geographicData: GeographicData[];
}

export function GeographicAnalysis({ geographicData }: GeographicAnalysisProps) {
  if (geographicData.length === 0) {
    return (
      <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-white">Analyse Géographique</CardTitle>
          <CardDescription className="text-white/60">Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Globe className="h-5 w-5 text-[#3b82f6]" />
          Analyse Géographique
        </CardTitle>
        <CardDescription className="text-white/60">Répartition par pays</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {geographicData.slice(0, 10).map((country) => (
            <div
              key={country.country}
              className="flex items-center justify-between rounded-lg bg-white/[0.04] p-3"
            >
              <div className="flex-1">
                <p className="font-medium text-white">{country.country}</p>
                <div className="mt-1 flex items-center gap-4 text-sm text-white/60">
                  <span>{formatNumber(country.users)} utilisateurs</span>
                  <span>•</span>
                  <span>{formatPrice(country.revenue, 'EUR')}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-[#3b82f6]">{country.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



