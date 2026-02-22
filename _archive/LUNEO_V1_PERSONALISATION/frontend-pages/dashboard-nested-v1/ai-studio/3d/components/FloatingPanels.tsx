'use client';

import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FloatingPanelsProps {
  credits: number;
  generationsToday?: number;
  successRate?: number;
  avgTimeMinutes?: number;
}

export function FloatingPanels({ credits, generationsToday = 0, successRate, avgTimeMinutes }: FloatingPanelsProps) {
  const displaySuccessRate = successRate != null ? `${successRate.toFixed(1)}%` : '—';
  const displayAvgTime = avgTimeMinutes != null ? `${avgTimeMinutes.toFixed(1)} min` : '—';

  return (
    <>
      <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/90 border border-gray-200 rounded-lg backdrop-blur-sm z-50">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-gray-700">Système opérationnel</span>
        <Badge variant="outline" className="ml-2 border-green-500/50 text-green-600 text-xs">
          Tous les services actifs
        </Badge>
      </div>
      <div className="fixed bottom-4 left-48 text-xs text-gray-500 z-50">
        v2.4.1 · AI Studio 3D · {new Date().getFullYear()}
      </div>
      <Card className="fixed top-20 right-4 w-64 bg-white/95 border-gray-200 backdrop-blur-sm z-40 hidden lg:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques Rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Générations aujourd&apos;hui</span>
            <span className="font-semibold text-gray-900">{generationsToday}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Taux de succès</span>
            <span className="font-semibold text-green-600">{displaySuccessRate}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Temps moyen</span>
            <span className="font-semibold text-gray-900">{displayAvgTime}</span>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Crédits restants</span>
            <span className="font-semibold text-cyan-600">{credits.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
