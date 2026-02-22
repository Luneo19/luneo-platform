'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComponentSelector } from '../selectors/ComponentSelector';
import { OptionSelector } from '../selectors/OptionSelector';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { cn } from '@/lib/utils';

export interface ComponentPanelProps {
  className?: string;
  /** When true, show compact layout with single component options */
  compact?: boolean;
}

export function ComponentPanel({ className, compact }: ComponentPanelProps) {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const selectedComponentId = useConfigurator3DStore((s) => s.ui.selectedComponentId);

  const selectedComponent = configuration?.components.find(
    (c) => c.id === selectedComponentId
  );

  if (!configuration) return null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Components
        </h3>
        <ComponentSelector groupBy="type" />
      </div>

      {selectedComponent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{selectedComponent.name}</CardTitle>
                  {selectedComponent.description && (
                    <CardDescription className="mt-1">
                      {selectedComponent.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedComponent.isRequired && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {selectedComponent.selectionMode === 'MULTIPLE' && (
                    <Badge variant="outline" className="text-xs">
                      Up to {selectedComponent.maxSelections}
                    </Badge>
                  )}
                  {selectedComponent.selectionMode === 'OPTIONAL' && (
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedComponent.dependencies && selectedComponent.dependencies.length > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Depends on: {selectedComponent.dependencies.join(', ')}
                  </span>
                </div>
              )}
              <OptionSelector component={selectedComponent} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!selectedComponent && (
        <p className="text-center text-sm text-muted-foreground">
          Select a component to configure its options
        </p>
      )}
    </div>
  );
}
