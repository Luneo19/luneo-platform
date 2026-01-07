/**
 * Stats cards pour la page Products
 */

import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  CheckCircle2,
  FileText,
  Archive,
  DollarSign,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatters';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';

interface ProductsStatsProps {
  stats: {
    total: number;
    active: number;
    draft: number;
    archived: number;
    totalRevenue: number;
  };
}

export function ProductsStats({ stats }: ProductsStatsProps) {
  const statCards = [
    { label: 'Total', value: stats.total.toString(), icon: Package, color: 'cyan' },
    { label: 'Actifs', value: stats.active.toString(), icon: CheckCircle2, color: 'green' },
    { label: 'Brouillons', value: stats.draft.toString(), icon: FileText, color: 'yellow' },
    { label: 'Archivés', value: stats.archived.toString(), icon: Archive, color: 'gray' },
    {
      label: 'Revenus',
      value: formatPrice(stats.totalRevenue, 'EUR'),
      icon: DollarSign,
      color: 'blue',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 bg-gray-800/50 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400 mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
              </div>
            </Card>
          </motion>
        );
      })}
    </div>
  );
}


