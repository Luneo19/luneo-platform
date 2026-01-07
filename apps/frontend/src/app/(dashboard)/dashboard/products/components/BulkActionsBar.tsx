/**
 * Barre d'actions en masse
 */

'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { BULK_ACTIONS } from '../constants/products';
import type { BulkAction } from '../types';

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
  if (selectedCount === 0) return null;

  return (
    <motion
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
    >
      <div className="flex items-center gap-4">
        <span className="text-white font-medium">
          {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné
          {selectedCount > 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {BULK_ACTIONS.map((action: BulkAction) => {
          const Icon = action.icon;
          const actionLabel = action.label as string;
          const actionVariant = action.variant as 'default' | 'destructive' | 'outline';
          return (
            <Button
              key={action.type}
              variant={actionVariant}
              size="sm"
              onClick={() => onBulkAction(action.type)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          );
        })}
      </div>
    </motion>
  );
}

