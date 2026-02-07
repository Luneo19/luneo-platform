'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ComparisonFeature {
  feature: string;
  luneo: string;
  competitors: string;
}

interface ComparisonTabProps {
  features: ComparisonFeature[];
}

export function ComparisonTab({ features }: ComparisonTabProps) {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Comparaison avec la Concurrence</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 font-bold text-gray-900">Fonctionnalité</th>
                <th className="text-center py-4 px-4 font-bold text-blue-600">Luneo</th>
                <th className="text-center py-4 px-4 font-bold text-gray-600">Concurrents</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-semibold text-gray-900">{item.feature}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{item.luneo}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">{item.competitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
