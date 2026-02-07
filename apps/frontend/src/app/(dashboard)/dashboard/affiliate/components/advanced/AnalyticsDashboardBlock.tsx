'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface AnalyticsDashboardBlockProps {
  title: string;
}

export function AnalyticsDashboardBlock({ title }: AnalyticsDashboardBlockProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700 mt-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Clics', 'Conversions', 'Revenus'].map((label, i) => (
            <Card key={label} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">—</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
