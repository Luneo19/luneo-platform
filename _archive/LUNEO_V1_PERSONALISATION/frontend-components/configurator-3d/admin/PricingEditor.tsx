'use client';

import React, { useState, useCallback } from 'react';
import { DollarSign, Percent, Zap, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type {
  Configurator3DComponent,
  Configurator3DOption,
  PricingType,
  SelectionState,
  PriceBreakdown,
} from '@/lib/configurator-3d/types/configurator.types';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'REPLACEMENT', label: 'Replacement' },
  { value: 'FORMULA', label: 'Formula' },
];

export interface PricingEditorProps {
  configId: string;
  components: Configurator3DComponent[];
  basePrice?: number;
  currency?: string;
  taxRate?: number;
  dynamicPricing?: boolean;
  onSettingsChange?: (settings: {
    basePrice?: number;
    currency?: string;
    taxRate?: number;
    dynamicPricing?: boolean;
  }) => void;
  className?: string;
}

export function PricingEditor({
  configId,
  components,
  basePrice = 0,
  currency = 'EUR',
  taxRate = 20,
  dynamicPricing = true,
  onSettingsChange,
  className,
}: PricingEditorProps) {
  const [localBasePrice, setLocalBasePrice] = useState(basePrice);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localTaxRate, setLocalTaxRate] = useState(taxRate);
  const [localDynamic, setLocalDynamic] = useState(dynamicPricing);
  const [simulationSelections, setSimulationSelections] = useState<SelectionState>({});
  const [simulationResult, setSimulationResult] = useState<PriceBreakdown | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSaveSettings = useCallback(() => {
    configurator3dEndpoints.pricing
      .updateSettings(configId, {
        basePrice: localBasePrice,
        currency: localCurrency,
        taxRate: localTaxRate,
        dynamicPricing: localDynamic,
      })
      .then(() => {
        onSettingsChange?.({
          basePrice: localBasePrice,
          currency: localCurrency,
          taxRate: localTaxRate,
          dynamicPricing: localDynamic,
        });
      })
      .catch(() => {});
  }, [configId, localBasePrice, localCurrency, localTaxRate, localDynamic, onSettingsChange]);

  const handleSimulate = useCallback(() => {
    setIsSimulating(true);
    configurator3dEndpoints.pricing
      .calculate(configId, { selections: simulationSelections })
      .then((res) => {
        const data = (typeof res === 'object' && res !== null && 'total' in res)
          ? (res as PriceBreakdown)
          : (res as { data?: PriceBreakdown })?.data;
        setSimulationResult(data ?? null);
        setIsSimulating(false);
      })
      .catch(() => setIsSimulating(false));
  }, [configId, simulationSelections]);

  const toggleSelection = useCallback((componentId: string, optionId: string) => {
    setSimulationSelections((prev) => {
      const current = prev[componentId];
      if (Array.isArray(current)) {
        const has = current.includes(optionId);
        return {
          ...prev,
          [componentId]: has ? current.filter((id) => id !== optionId) : [...current, optionId],
        };
      }
      if (current === optionId) {
        const next = { ...prev };
        delete next[componentId];
        return next;
      }
      return { ...prev, [componentId]: optionId };
    });
  }, []);

  const allOptions = components.flatMap((c) =>
    (c.options ?? []).map((o) => ({ ...o, componentName: c.name, componentId: c.id }))
  );

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Base Pricing
          </CardTitle>
          <CardDescription>
            Configure base price, currency, and tax
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Base price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={localBasePrice}
                  onChange={(e) => setLocalBasePrice(parseFloat(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={localCurrency} onValueChange={setLocalCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Tax rate ({localTaxRate}%)
              </Label>
              <span className="text-sm text-muted-foreground">{localTaxRate}%</span>
            </div>
            <Slider
              value={[localTaxRate]}
              onValueChange={([v]) => setLocalTaxRate(v ?? 0)}
              min={0}
              max={30}
              step={1}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={localDynamic} onCheckedChange={setLocalDynamic} />
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Dynamic pricing
            </Label>
          </div>
          <Button onClick={handleSaveSettings}>Save settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options pricing</CardTitle>
          <CardDescription>
            Price deltas per option (bulk edit via API)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Option</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Currency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allOptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No options with pricing
                  </TableCell>
                </TableRow>
              ) : (
                allOptions.map((opt) => (
                  <OptionPricingRow
                    key={opt.id}
                    configId={configId}
                    componentId={opt.componentId}
                    option={opt}
                    currency={localCurrency}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Price simulation
          </CardTitle>
          <CardDescription>
            Select options to see calculated price
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {components.map((comp) => (
              <div key={comp.id} className="flex flex-wrap gap-1">
                <span className="text-xs font-medium text-muted-foreground">{comp.name}:</span>
                {(comp.options ?? []).map((opt) => {
                  const sel = simulationSelections[comp.id];
                  const isSelected =
                    (Array.isArray(sel) && sel.includes(opt.id)) || sel === opt.id;
                  return (
                    <Button
                      key={opt.id}
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => toggleSelection(comp.id, opt.id)}
                    >
                      {opt.name}
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
          <Button onClick={handleSimulate} disabled={isSimulating}>
            {isSimulating ? 'Calculating...' : 'Calculate price'}
          </Button>
          {simulationResult && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-2xl font-bold">
                {simulationResult.currency} {simulationResult.total.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Base: {simulationResult.basePrice} + Options: {simulationResult.optionsTotal} +
                Tax: {simulationResult.taxAmount}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OptionPricingRow({
  configId,
  componentId,
  option,
  currency,
}: {
  configId: string;
  componentId: string;
  option: Configurator3DOption & { componentName?: string };
  currency: string;
}) {
  const [priceDelta, setPriceDelta] = useState(option.pricing?.priceDelta ?? 0);
  const [pricingType, setPricingType] = useState<PricingType>(
    option.pricing?.pricingType ?? 'FIXED'
  );

  const handleBlur = () => {
    configurator3dEndpoints.options.update(configId, componentId, option.id, {
      pricing: { priceDelta, pricingType, currency },
    });
  };

  return (
    <TableRow>
      <TableCell>{option.componentName ?? componentId}</TableCell>
      <TableCell>{option.name}</TableCell>
      <TableCell>
        <Select value={pricingType} onValueChange={(v) => setPricingType(v as PricingType)}>
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICING_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={priceDelta}
          onChange={(e) => setPriceDelta(parseFloat(e.target.value) || 0)}
          onBlur={handleBlur}
          className="h-8 w-24"
        />
      </TableCell>
      <TableCell>{currency}</TableCell>
    </TableRow>
  );
}
