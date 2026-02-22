'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConfigurator3DHistory } from '@/hooks/configurator-3d/useConfigurator3DHistory';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { useConfigurator3DSelection } from '@/hooks/configurator-3d/useConfigurator3DSelection';
import type { HistoryEntry } from '@/lib/configurator-3d/types/configurator.types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface HistoryPanelProps {
  className?: string;
  maxVisible?: number;
}

export function HistoryPanel({
  className,
  maxVisible = 10,
}: HistoryPanelProps) {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const { history, historyIndex, canUndo, canRedo, undo, redo } =
    useConfigurator3DHistory();
  const { clearHistory } = useConfigurator3DHistory();

  const getComponentName = (componentId: string) =>
    configuration?.components.find((c) => c.id === componentId)?.name ?? componentId;

  const getOptionName = (componentId: string, optionId: string) => {
    const comp = configuration?.components.find((c) => c.id === componentId);
    const opt = comp?.options.find((o) => o.id === optionId);
    return opt?.name ?? optionId;
  };

  const formatEntry = (entry: HistoryEntry) => {
    if (entry.action === 'SELECT_OPTION' && entry.componentId && entry.optionId) {
      const comp = getComponentName(entry.componentId);
      const opt = getOptionName(entry.componentId, entry.optionId);
      const prev = entry.previousValue
        ? Array.isArray(entry.previousValue)
          ? entry.previousValue
              .map((id) => getOptionName(entry.componentId!, id))
              .join(', ')
          : getOptionName(entry.componentId, entry.previousValue as string)
        : '—';
      return `${comp}: ${prev} → ${opt}`;
    }
    if (entry.action === 'RESET_ALL') return 'Reset all';
    if (entry.action === 'RESET_COMPONENT' && entry.componentId) {
      return `Reset ${getComponentName(entry.componentId)}`;
    }
    return 'Change';
  };

  const visibleHistory = history.slice(-maxVisible).reverse();

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">History</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearHistory}
                aria-label="Clear history"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-1 pr-2">
            {visibleHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No changes yet
              </p>
            ) : (
              visibleHistory.map((entry, idx) => {
                const actualIndex = history.length - maxVisible + idx;
                const isCurrent =
                  actualIndex === historyIndex ||
                  (historyIndex === -1 && actualIndex === history.length - 1);
                return (
                  <motion.button
                    key={entry.id}
                    type="button"
                    layout
                    onClick={() => {
                      const target = history.length - 1 - idx;
                      const store = useConfigurator3DStore.getState();
                      const diff = store.historyIndex - target;
                      if (diff > 0) {
                        for (let i = 0; i < diff; i++) store.undo();
                      } else if (diff < 0) {
                        for (let i = 0; i < -diff; i++) store.redo();
                      }
                    }}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      isCurrent
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate">{formatEntry(entry)}</span>
                      <span className="shrink-0 text-xs opacity-70">
                        {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
