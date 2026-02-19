'use client';

import { useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  Factory,
  Image,
  AlertCircle,
} from 'lucide-react';

interface PCEOverviewProps {
  pipelines: Array<{
    id: string;
    orderId: string;
    currentStage: string;
    progress: number;
    order?: { orderNumber?: string };
  }>;
}

const STAGE_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  VALIDATION: { icon: CheckCircle, color: 'bg-blue-500', label: 'Validation' },
  RENDER: { icon: Image, color: 'bg-purple-500', label: 'Rendu' },
  PRODUCTION: { icon: Factory, color: 'bg-orange-500', label: 'Production' },
  QUALITY_CHECK: { icon: CheckCircle, color: 'bg-yellow-500', label: 'Contrôle' },
  FULFILLMENT: { icon: Package, color: 'bg-cyan-500', label: 'Préparation' },
  SHIPPING: { icon: Truck, color: 'bg-indigo-500', label: 'Expédition' },
  DELIVERY: { icon: CheckCircle, color: 'bg-teal-500', label: 'Livraison' },
  COMPLETED: { icon: CheckCircle, color: 'bg-green-500', label: 'Terminé' },
  FAILED: { icon: AlertCircle, color: 'bg-red-500', label: 'Échoué' },
};

const FLOW_STAGES = [
  'VALIDATION', 'RENDER', 'PRODUCTION', 'QUALITY_CHECK',
  'FULFILLMENT', 'SHIPPING', 'DELIVERY',
];

export function PCEOverview({ pipelines }: PCEOverviewProps) {
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of pipelines) {
      counts[p.currentStage] = (counts[p.currentStage] || 0) + 1;
    }
    return counts;
  }, [pipelines]);

  const inProgress = pipelines.filter(
    (p) => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(p.currentStage),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {FLOW_STAGES.map((stage, index) => {
          const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG.VALIDATION;
          const count = stageCounts[stage] || 0;
          const Icon = config.icon;

          return (
            <div key={stage} className="flex items-center">
              <div className="flex flex-col items-center min-w-[90px]">
                <div
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center ${config.color} text-white shadow-lg ${count > 0 ? 'ring-4 ring-offset-2 ring-opacity-50' : 'opacity-40'}`}
                >
                  <Icon className="h-6 w-6" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                      {count}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-center">{config.label}</p>
              </div>

              {index < FLOW_STAGES.length - 1 && (
                <div className="flex-1 min-w-[30px] h-0.5 bg-gray-200 mx-1 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[3px] border-b-[3px] border-l-[6px] border-transparent border-l-gray-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
          <p className="text-sm text-muted-foreground">En cours</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stageCounts['COMPLETED'] || 0}</p>
          <p className="text-sm text-muted-foreground">Terminées</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{stageCounts['FAILED'] || 0}</p>
          <p className="text-sm text-muted-foreground">En erreur</p>
        </div>
      </div>

      {pipelines.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Dernières commandes</h4>
          <div className="space-y-2">
            {pipelines.slice(0, 5).map((pipeline) => {
              const config = STAGE_CONFIG[pipeline.currentStage] ?? STAGE_CONFIG.VALIDATION;
              const Icon = config.icon;
              return (
                <div key={pipeline.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${config.color} text-white`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium">
                      #{pipeline.order?.orderNumber || pipeline.orderId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                    <span className="text-xs font-medium">{pipeline.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
