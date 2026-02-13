/**
 * Barre d'actions en masse
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { useI18n } from '@/i18n/useI18n';
import { BULK_ACTIONS } from '../constants/products';
import type { BulkAction } from '../types';

const BULK_LABEL_KEYS: Record<string, string> = {
  activate: 'products.bulkActivate',
  deactivate: 'products.bulkDeactivate',
  archive: 'products.bulkArchive',
  export: 'products.bulkExport',
  delete: 'products.delete',
};

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction: (action: BulkAction['type']) => void;
}

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
          {t('products.selectedCount', { count: selectedCount })}
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {BULK_ACTIONS.map((action: BulkAction) => {
          const Icon = action.icon;
          const actionLabel = BULK_LABEL_KEYS[action.type] ? t(BULK_LABEL_KEYS[action.type]) : (action.label as string);
          const actionVariant = action.variant as 'default' | 'destructive' | 'outline';
          return (
            <Button
              key={action.type}
              variant={actionVariant}
              size="sm"
              onClick={() => onBulkAction(action.type)}
            >
              {Icon && React.createElement(Icon as React.ElementType, { className: 'w-4 h-4 mr-2' })}
              {actionLabel}
            </Button>
          );
        })}
      </div>
    </motion>
  );
}

