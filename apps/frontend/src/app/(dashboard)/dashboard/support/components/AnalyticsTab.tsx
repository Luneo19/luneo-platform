'use client';

import { Clock, Target, Star, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Temps de réponse moyen</p>
                <p className="text-2xl font-bold text-white">2h 15min</p>
              </div>
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <Progress value={75} className="h-2" />
            <p className="text-xs text-gray-400 mt-2">Objectif: &lt; 2h</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Taux de résolution</p>
                <p className="text-2xl font-bold text-white">87%</p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
            <Progress value={87} className="h-2" />
            <p className="text-xs text-gray-400 mt-2">Objectif: &gt; 85%</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Satisfaction client</p>
                <p className="text-2xl font-bold text-white">4.6/5</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn('w-4 h-4', i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600')}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Tickets par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <PieChart className="w-12 h-12" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Évolution des tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <BarChart3 className="w-12 h-12" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
