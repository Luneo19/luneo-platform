'use client';

import React from 'react';
import { SwatchGrid } from './SwatchGrid';
import type { SwatchItem } from './SwatchGrid';
import type { Configurator3DOption } from '@/lib/configurator-3d/types/configurator.types';

export interface MaterialPickerProps {
  options: Configurator3DOption[];
  selectedIds: string[];
  onSelect: (optionId: string) => void;
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}

export function MaterialPicker({
  options,
  selectedIds,
  onSelect,
  columns = 4,
  className,
}: MaterialPickerProps) {
  const items: SwatchItem[] = options.map((opt) => ({
    id: opt.id,
    name: opt.name,
    swatch:
      opt.swatchImageUrl ??
      opt.previewImageUrl ??
      'https://placehold.co/80x80/1a1a1a/666?text=',
    priceDelta: opt.pricing?.priceDelta ?? 0,
    currency: opt.pricing?.currency ?? 'EUR',
    disabled: !opt.isEnabled,
    outOfStock: opt.inStock === false,
  }));

  return (
    <SwatchGrid
      type="material"
      items={items}
      selectedIds={selectedIds}
      onSelect={onSelect}
      columns={columns}
      className={className}
    />
  );
}
