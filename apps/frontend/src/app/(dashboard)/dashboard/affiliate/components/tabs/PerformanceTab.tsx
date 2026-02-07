'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

export function PerformanceTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Performance
          </CardTitle>
          <CardDescription className="text-gray-400">
            Métriques de performance de vos liens et campagnes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Score global</span>
              <span className="text-sm font-medium text-white">—</span>
            </div>
            <Progress value={0} className="h-2 bg-gray-700" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Temps de chargement</span>
              <span className="text-sm font-medium text-white">—</span>
            </div>
            <Progress value={0} className="h-2 bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
