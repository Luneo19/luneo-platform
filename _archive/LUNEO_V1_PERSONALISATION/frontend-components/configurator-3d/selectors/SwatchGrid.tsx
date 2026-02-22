'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CurrencyFormatter } from '@/lib/configurator-3d/pricing/CurrencyFormatter';

export interface SwatchItem {
  id: string;
  name: string;
  /** Hex color for color swatches, or image URL for material swatches */
  swatch: string;
  priceDelta?: number;
  currency?: string;
  disabled?: boolean;
  outOfStock?: boolean;
}

export interface SwatchGridProps {
  items: SwatchItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  columns?: 3 | 4 | 5 | 6;
  type?: 'color' | 'material' | 'texture';
  className?: string;
}

const columnClasses = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export function SwatchGrid({
  items,
  selectedIds,
  onSelect,
  columns = 4,
  type = 'color',
  className,
}: SwatchGridProps) {
  const isColor = type === 'color';

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'grid gap-2',
          columnClasses[columns],
          className
        )}
      >
        {items.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          const isDisabled = item.disabled || item.outOfStock;

          const tooltipContent = (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{item.name}</span>
              {item.priceDelta !== undefined && item.priceDelta !== 0 && (
                <span className="text-xs text-muted-foreground">
                  {item.priceDelta > 0 ? '+' : ''}
                  {CurrencyFormatter.format(
                    item.priceDelta,
                    item.currency ?? 'EUR'
                  )}
                </span>
              )}
              {item.outOfStock && (
                <span className="text-xs text-destructive">Out of stock</span>
              )}
            </div>
          );

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => !isDisabled && onSelect(item.id)}
                  disabled={isDisabled}
                  className={cn(
                    'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-muted-foreground/30',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {isColor ? (
                    <div
                      className="h-full w-full"
                      style={{ backgroundColor: item.swatch }}
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.swatch})` }}
                    />
                  )}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20"
                    >
                      <div className="rounded-full bg-primary p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </motion.div>
                  )}
                  {item.outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <span className="text-xs font-medium text-destructive">
                        Out
                      </span>
                    </div>
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
