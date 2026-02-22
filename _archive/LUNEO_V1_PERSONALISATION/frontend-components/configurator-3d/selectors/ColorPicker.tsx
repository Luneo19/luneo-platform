'use client';

import React from 'react';
import { SwatchGrid } from './SwatchGrid';
import type { SwatchItem } from './SwatchGrid';
import type { Configurator3DOption } from '@/lib/configurator-3d/types/configurator.types';

export interface ColorCategory {
  id: string;
  name: string;
  colors: Configurator3DOption[];
}

export interface ColorPickerProps {
  options: Configurator3DOption[];
  selectedIds: string[];
  onSelect: (optionId: string) => void;
  /** Optional grouping by category */
  categories?: ColorCategory[];
  columns?: 3 | 4 | 5 | 6;
  showCustomColor?: boolean;
  className?: string;
}

function getColorHex(option: Configurator3DOption): string {
  const val = option.value as { hex?: string } | undefined;
  if (val?.hex) return val.hex;
  // Fallback: check if option has metadata
  const meta = option as unknown as { hex?: string };
  if (meta?.hex) return meta.hex;
  return '#888888';
}

export function ColorPicker({
  options,
  selectedIds,
  onSelect,
  categories,
  columns = 4,
  showCustomColor = false,
  className,
}: ColorPickerProps) {
  const mapToSwatchItems = (opts: Configurator3DOption[]): SwatchItem[] =>
    opts.map((opt) => ({
      id: opt.id,
      name: opt.name,
      swatch: opt.swatchImageUrl ?? getColorHex(opt),
      priceDelta: opt.pricing?.priceDelta ?? 0,
      currency: opt.pricing?.currency ?? 'EUR',
      disabled: !opt.isEnabled,
      outOfStock: opt.inStock === false,
    }));

  if (categories && categories.length > 0) {
    return (
      <div className={className}>
        {categories.map((cat) => (
          <div key={cat.id} className="mb-6 last:mb-0">
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              {cat.name}
            </h4>
            <SwatchGrid
              type="color"
              items={mapToSwatchItems(cat.colors)}
              selectedIds={selectedIds}
              onSelect={onSelect}
              columns={columns}
            />
          </div>
        ))}
        {showCustomColor && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Custom color
            </label>
            <input
              type="color"
              className="h-10 w-full cursor-pointer rounded-lg border border-input"
              onChange={(e) => {
                // Custom color could map to a special option or emit event
                const hex = e.target.value;
                e.currentTarget.style.backgroundColor = hex;
              }}
            />
          </div>
        )}
      </div>
    );
  }

  const items = mapToSwatchItems(options);

  return (
    <div className={className}>
      <SwatchGrid
        type="color"
        items={items}
        selectedIds={selectedIds}
        onSelect={onSelect}
        columns={columns}
      />
      {showCustomColor && (
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Custom color
          </label>
          <input
            type="color"
            className="h-10 w-full cursor-pointer rounded-lg border border-input"
          />
        </div>
      )}
    </div>
  );
}
