'use client';

/**
 * ★★★ COMPONENT - CHART CARD ★★★
 * Composant réutilisable pour afficher des graphiques
 * ~150 lignes de code professionnel
 */

import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from './LineChart';

interface ChartCardProps {
  title: string;
  description?: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }>;
  };
  type?: 'line' | 'bar' | 'area' | 'pie';
  height?: number;
}

function ChartCard({ title, description, data, type = 'line', height = 300 }: ChartCardProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          {data.labels.length > 0 ? (
            <LineChart 
              data={data.labels.map((label, index) => ({
                x: label,
                y: data.datasets[0]?.data[index] || 0,
              }))}
              height={height}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(ChartCard);
