'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ColorPicker } from './ColorPicker';
import { MaterialPicker } from './MaterialPicker';
import { SwatchGrid } from './SwatchGrid';
import type { SwatchItem } from './SwatchGrid';
import { useConfigurator3DSelection } from '@/hooks/configurator-3d/useConfigurator3DSelection';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { CurrencyFormatter } from '@/lib/configurator-3d/pricing/CurrencyFormatter';
import type {
  Configurator3DComponent,
  Configurator3DOption,
  OptionType,
} from '@/lib/configurator-3d/types/configurator.types';
import { cn } from '@/lib/utils';

export interface OptionSelectorProps {
  component: Configurator3DComponent;
  className?: string;
}

const COMPONENT_TYPE_ICONS: Record<string, string> = {
  COLOR: 'Palette',
  MATERIAL: 'Layers',
  TEXTURE: 'Grid3X3',
  SIZE: 'Maximize2',
  TEXT: 'Type',
  NUMBER: 'Grid3X3',
  BOOLEAN: 'Check',
};

function getColorHex(option: Configurator3DOption): string {
  const val = option.value as { hex?: string } | undefined;
  if (val?.hex) return val.hex;
  return '#888888';
}

export function OptionSelector({ component, className }: OptionSelectorProps) {
  const {
    isOptionSelected,
    toggleOption,
    selectOption,
    getAvailableOptions,
  } = useConfigurator3DSelection();
  const setHoveredOption = useConfigurator3DStore((s) => s.setHoveredOption);
  const enablePricing = useConfigurator3DStore(
    (s) => s.configuration?.features?.enablePricing ?? false
  );
  const currency =
    useConfigurator3DStore(
      (s) => s.configuration?.pricingSettings?.currency
    ) ?? 'EUR';

  const options = getAvailableOptions(component.id);
  const selected = useConfigurator3DStore((s) => s.selections[component.id]);
  const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : [];

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No options available for this component.
      </p>
    );
  }

  const renderByType = (optType: OptionType) => {
    switch (optType) {
      case 'COLOR':
        return (
          <ColorPicker
            options={options}
            selectedIds={selectedIds}
            onSelect={(id) => selectOption(component.id, id)}
            columns={5}
          />
        );

      case 'MATERIAL':
        return (
          <MaterialPicker
            options={options}
            selectedIds={selectedIds}
            onSelect={(id) => selectOption(component.id, id)}
            columns={3}
          />
        );

      case 'TEXTURE': {
        const textureItems: SwatchItem[] = options.map((opt) => {
          const texUrls = opt.textureUrls;
          let url = opt.previewImageUrl ?? opt.swatchImageUrl ?? '';
          if (Array.isArray(texUrls) && texUrls[0]) url = texUrls[0];
          else if (typeof texUrls === 'object' && texUrls && !Array.isArray(texUrls)) {
            const obj = texUrls as Record<string, string>;
            url = obj.map ?? obj.diffuse ?? obj.base ?? Object.values(obj)[0] ?? url;
          }
          return {
            id: opt.id,
            name: opt.name,
            swatch: url,
            priceDelta: opt.pricing?.priceDelta ?? 0,
            currency: opt.pricing?.currency ?? 'EUR',
            disabled: !opt.isEnabled,
            outOfStock: opt.inStock === false,
          };
        });
        return (
          <SwatchGrid
            type="texture"
            items={textureItems}
            selectedIds={selectedIds}
            onSelect={(id) => selectOption(component.id, id)}
            columns={4}
          />
        );
      }

      case 'SIZE':
        return (
          <Select
            value={selectedIds[0] ?? ''}
            onValueChange={(v) => selectOption(component.id, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  <span className="flex items-center justify-between gap-4">
                    {opt.name}
                    {enablePricing && opt.pricing?.priceDelta !== undefined && opt.pricing.priceDelta !== 0 && (
                      <span className="text-muted-foreground">
                        {opt.pricing.priceDelta > 0 ? '+' : ''}
                        {CurrencyFormatter.format(
                          opt.pricing.priceDelta,
                          opt.pricing.currency ?? currency
                        )}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'TEXT': {
        const textOpt = options[0];
        const val = textOpt?.value as { text?: string } | undefined;
        return (
          <div className="space-y-2">
            <Label>{textOpt?.name}</Label>
            <Input
              placeholder="Enter text"
              defaultValue={val?.text ?? ''}
              maxLength={(val as { maxLength?: number })?.maxLength}
              onChange={(e) => {
                // Text options typically need a custom handler - store may support text value
                // For now we use the first option as the "text" option
                if (textOpt) selectOption(component.id, textOpt.id);
              }}
            />
          </div>
        );
      }

      case 'NUMBER': {
        const numOpt = options[0];
        const val = numOpt?.value as { value?: number; min?: number; max?: number; step?: number } | undefined;
        const [localVal, setLocalVal] = React.useState(val?.value ?? 0);
        const min = val?.min ?? 0;
        const max = val?.max ?? 100;
        const step = val?.step ?? 1;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setLocalVal((v) => Math.max(min, v - step))}
              >
                −
              </Button>
              <Input
                type="number"
                value={localVal}
                min={min}
                max={max}
                step={step}
                onChange={(e) => setLocalVal(Number(e.target.value))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setLocalVal((v) => Math.min(max, v + step))}
              >
                +
              </Button>
            </div>
            <Slider
              value={[localVal]}
              min={min}
              max={max}
              step={step}
              onValueChange={([v]) => setLocalVal(v)}
            />
          </div>
        );
      }

      case 'BOOLEAN': {
        const boolOpt = options[0];
        const val = boolOpt?.value as { value?: boolean } | undefined;
        const [checked, setChecked] = React.useState(val?.value ?? false);
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={checked}
              onCheckedChange={(c) => {
                setChecked(c);
                if (boolOpt) selectOption(component.id, boolOpt.id);
              }}
            />
            <Label>{boolOpt?.name}</Label>
          </div>
        );
      }

      default:
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              const isDisabled = !opt.isEnabled || opt.inStock === false;
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  onClick={() => !isDisabled && toggleOption(component.id, opt.id)}
                  onMouseEnter={() => setHoveredOption(opt.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:border-muted-foreground/30',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {opt.type === 'COLOR' && (
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: getColorHex(opt) }}
                    />
                  )}
                  <span>{opt.name}</span>
                  {enablePricing && opt.pricing?.priceDelta !== undefined && opt.pricing.priceDelta !== 0 && (
                    <span className="text-xs text-muted-foreground">
                      {opt.pricing.priceDelta > 0 ? '+' : ''}
                      {CurrencyFormatter.format(
                        opt.pricing.priceDelta,
                        opt.pricing.currency ?? currency
                      )}
                    </span>
                  )}
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                  {opt.inStock === false && (
                    <span className="text-xs text-destructive">Out of stock</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        );
    }
  };

  const optionType = options[0]?.type ?? 'COLOR';

  return (
    <div className={cn('space-y-4', className)}>
      {renderByType(optionType)}
    </div>
  );
}
