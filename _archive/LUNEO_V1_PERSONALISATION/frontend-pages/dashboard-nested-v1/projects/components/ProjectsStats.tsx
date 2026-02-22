/**
 * Stats cards for Projects page
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, CheckCircle } from 'lucide-react';

interface ProjectsStatsProps {
  total: number;
  active: number;
}

export function ProjectsStats({ total, active }: ProjectsStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white mt-1">{total}</p>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <FolderKanban className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Actifs</p>
              <p className="text-2xl font-bold text-white mt-1">{active}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
