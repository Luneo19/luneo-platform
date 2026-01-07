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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Analyse Géographique</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          Analyse Géographique
        </CardTitle>
        <CardDescription>Répartition par pays</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {geographicData.slice(0, 10).map((country) => (
            <div
              key={country.country}
              className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-white font-medium">{country.country}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                  <span>{formatNumber(country.users)} utilisateurs</span>
                  <span>•</span>
                  <span>{formatPrice(country.revenue, 'EUR')}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-400 font-medium">{country.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


