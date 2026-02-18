'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Save,
  Box,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from './BottomSheet';
import { Configurator3D } from '../core/Configurator3D';
import { cn } from '@/lib/utils';

export interface MobileConfiguratorProps {
  configurationId: string;
  projectId?: string;
  components?: { id: string; name: string; options?: { id: string; name: string }[] }[];
  onAddToCart?: () => void;
  onSave?: () => void;
  onAR?: () => void;
  className?: string;
}

export function MobileConfigurator({
  configurationId,
  projectId,
  components = [],
  onAddToCart,
  onSave,
  onAR,
  className,
}: MobileConfiguratorProps) {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    components[0]?.id ?? null
  );
  const [sheetState, setSheetState] = useState<'collapsed' | 'half' | 'full'>('half');

  const selectedComponent = components.find((c) => c.id === selectedComponentId);
  const options = selectedComponent?.options ?? [];

  return (
    <div
      className={cn(
        'relative flex h-[100dvh] flex-col overflow-hidden bg-background',
        className
      )}
    >
      {/* 3D View - 60% top */}
      <div className="relative h-[60dvh] shrink-0">
        <Configurator3D
          configurationId={configurationId}
          projectId={projectId}
          className="h-full w-full"
        />
      </div>

      {/* Bottom sheet */}
      <BottomSheet
        defaultState="half"
        onStateChange={setSheetState}
        className="flex-1 min-h-0"
      >
        <div className="p-4 pb-8">
          {/* Component tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {components.map((comp) => (
              <Button
                key={comp.id}
                variant={selectedComponentId === comp.id ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => setSelectedComponentId(comp.id)}
              >
                {comp.name}
              </Button>
            ))}
          </div>

          {/* Options - swipeable grid */}
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {selectedComponent?.name ?? 'Select'}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {options.map((opt) => (
                <OptionChip key={opt.id} name={opt.name} />
              ))}
            </div>
          </div>

          {/* FABs */}
          <div className="flex justify-center gap-4">
            <FloatingActionButton
              icon={<Save className="h-5 w-5" />}
              label="Save"
              onClick={onSave}
            />
            <FloatingActionButton
              icon={<Sparkles className="h-5 w-5" />}
              label="AR"
              onClick={onAR}
            />
            <FloatingActionButton
              icon={<ShoppingCart className="h-5 w-5" />}
              label="Add to cart"
              variant="default"
              onClick={onAddToCart}
            />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function OptionChip({ name }: { name: string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className="flex shrink-0 items-center gap-2 rounded-full border bg-muted/50 px-4 py-2"
    >
      <Box className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{name}</span>
    </motion.div>
  );
}

function FloatingActionButton({
  icon,
  label,
  variant = 'outline',
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'outline';
  onClick?: () => void;
}) {
  return (
    <Button
      variant={variant}
      size="lg"
      className="h-14 rounded-full px-6 shadow-lg"
      onClick={onClick}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );
}
