'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Layers,
  Grid3X3,
  Type,
  Maximize2,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Info,
} from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type {
  Configurator3DComponent,
  ComponentType,
} from '@/lib/configurator-3d/types/configurator.types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const COMPONENT_ICONS: Record<ComponentType, React.ComponentType<{ className?: string }>> = {
  MESH: Layers,
  MATERIAL: Layers,
  TEXTURE: Grid3X3,
  COLOR: Palette,
  DECAL: Type,
  ACCESSORY: Maximize2,
  SIZE: Maximize2,
  ENGRAVING: Type,
};

interface ComponentGroup {
  id: string;
  name: string;
  components: Configurator3DComponent[];
}

export interface ComponentSelectorProps {
  className?: string;
  /** Optional: group components by a custom key (e.g. "type", "category") */
  groupBy?: 'type' | 'none';
}

function groupComponents(
  components: Configurator3DComponent[],
  groupBy: 'type' | 'none'
): ComponentGroup[] {
  if (groupBy === 'none') {
    return [{ id: 'all', name: 'Components', components }];
  }
  const byType = new Map<string, Configurator3DComponent[]>();
  for (const c of components) {
    const key = c.type;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(c);
  }
  return Array.from(byType.entries()).map(([type, comps]) => ({
    id: type,
    name: type.charAt(0) + type.slice(1).toLowerCase(),
    components: comps.sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export function ComponentSelector({
  className,
  groupBy = 'type',
}: ComponentSelectorProps) {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const selectedComponentId = useConfigurator3DStore((s) => s.ui.selectedComponentId);
  const setSelectedComponent = useConfigurator3DStore((s) => s.setSelectedComponent);
  const focusOnComponent = useConfigurator3DStore((s) => s.focusOnComponent);
  const validation = useConfigurator3DStore((s) => s.validation);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['all']));

  const getComponentErrors = (componentId: string) =>
    validation.errors.filter((e) => e.componentId === componentId);
  const getComponentWarnings = (componentId: string) =>
    validation.warnings.filter((w) => w.componentId === componentId);

  const visibleComponents = useMemo(
    () =>
      (configuration?.components ?? []).filter(
        (c) => c.isVisible && c.isEnabled
      ),
    [configuration]
  );

  const groups = useMemo(
    () => groupComponents(visibleComponents, groupBy),
    [visibleComponents, groupBy]
  );

  const handleSelect = (componentId: string) => {
    setSelectedComponent(componentId);
    focusOnComponent(componentId);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  if (visibleComponents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No components to configure.
      </p>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {groups.map((group) => {
        const isOpen = openGroups.has(group.id);

        return (
          <Collapsible.Root
            key={group.id}
            open={isOpen}
            onOpenChange={() => toggleGroup(group.id)}
          >
            <Collapsible.Trigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                  {group.name}
                </span>
              </button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div className="ml-2 mt-1 space-y-0.5 border-l border-muted pl-3">
                {group.components.map((comp) => {
                  const IconComp = COMPONENT_ICONS[comp.type] ?? Layers;
                  const isSelected = selectedComponentId === comp.id;
                  const errors = getComponentErrors(comp.id);
                  const warnings = getComponentWarnings(comp.id);
                  const hasIssue = errors.length > 0 || warnings.length > 0;

                  return (
                    <motion.button
                      key={comp.id}
                      type="button"
                      layout
                      onClick={() => handleSelect(comp.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50',
                        hasIssue && 'border-l-2 border-l-destructive/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        )}
                      >
                        {comp.iconUrl ? (
                          <Image width={200} height={200}
                            src={comp.iconUrl}
                            alt=""
                            className="h-4 w-4 object-contain"
                          unoptimized />
                        ) : (
                          <IconComp className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {comp.name}
                        </span>
                        {comp.description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {comp.description}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {errors.length > 0 && (
                          <span
                            className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive"
                            title={errors[0]?.message}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {warnings.length > 0 && errors.length === 0 && (
                          <span
                            className="rounded bg-warning/10 px-1.5 py-0.5 text-xs text-warning"
                            title={warnings[0]?.message}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            isSelected && 'rotate-90'
                          )}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        );
      })}
    </div>
  );
}
