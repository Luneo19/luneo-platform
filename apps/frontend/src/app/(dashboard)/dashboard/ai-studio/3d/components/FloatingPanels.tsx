'use client';

import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FloatingPanelsProps {
  credits: number;
}

export function FloatingPanels({ credits }: FloatingPanelsProps) {
  return (
    <>
      <div className="fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg backdrop-blur-sm z-50">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-slate-300">Système opérationnel</span>
        <Badge variant="outline" className="ml-2 border-green-500/50 text-green-400 text-xs">
          Tous les services actifs
        </Badge>
      </div>
      <div className="fixed bottom-4 left-48 text-xs text-slate-500 z-50">
        v2.4.1 · AI Studio 3D · {new Date().getFullYear()}
      </div>
      <Card className="fixed top-20 right-4 w-64 bg-slate-900/95 border-slate-700 backdrop-blur-sm z-40 hidden lg:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques Rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Générations aujourd&apos;hui</span>
            <span className="font-semibold text-white">12</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Taux de succès</span>
            <span className="font-semibold text-green-400">97.8%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Temps moyen</span>
            <span className="font-semibold text-white">2.3 min</span>
          </div>
          <div className="h-px bg-slate-700" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Crédits restants</span>
            <span className="font-semibold text-cyan-400">{credits.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
