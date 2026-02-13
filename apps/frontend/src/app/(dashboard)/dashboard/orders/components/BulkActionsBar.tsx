/**
 * Barre d'actions en masse pour les commandes
 */

'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { useI18n } from '@/i18n/useI18n';
import type { OrderStatus } from '../types';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction: (action: 'updateStatus' | 'export') => void;
}

const BULK_ACTIONS = [
  { type: 'updateStatus' as const, labelKey: 'orders.bulkUpdateStatus' as const, variant: 'default' as const },
  { type: 'export' as const, labelKey: 'common.export' as const, variant: 'outline' as const },
];

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkAction,
}: BulkActionsBarProps) {
  const { t } = useI18n();
  if (selectedCount === 0) return null;

  return (
    <motion
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
    >
      <div className="flex items-center gap-4">
        <span className="text-white font-medium">
          {t('orders.bulkSelected', { count: selectedCount })}
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {BULK_ACTIONS.map((action) => (
          <Button
            key={action.type}
            variant={action.variant}
            size="sm"
            onClick={() => onBulkAction(action.type)}
          >
            {t(action.labelKey)}
          </Button>
        ))}
      </div>
    </motion>
  );
}



