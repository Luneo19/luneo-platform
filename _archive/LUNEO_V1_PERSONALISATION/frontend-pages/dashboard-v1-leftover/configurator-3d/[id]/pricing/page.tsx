/**
 * Pricing Editor Page - Base price, per-option pricing, simulation
 */

'use client';

import { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Calculator, Loader2 } from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { Configurator3DConfig, Configurator3DComponent, PriceBreakdown } from '@/lib/configurator-3d/types/configurator.types';

export default function PricingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localPricing, setLocalPricing] = useState({
    basePrice: 0,
    currency: 'EUR',
    taxRate: 20,
    dynamicPricing: true,
  });
  const [simulationSelections, setSimulationSelections] = useState<Record<string, string>>({});

  const { data: config, isLoading } = useQuery({
    queryKey: ['configurator3d', 'config', id],
    queryFn: () => configurator3dEndpoints.configurations.get<Configurator3DConfig>(id),
  });

  const { data: priceBreakdown } = useQuery({
    queryKey: ['configurator3d', 'pricing', 'breakdown', id],
    queryFn: () => configurator3dEndpoints.pricing.breakdown(id),
    enabled: !!id,
  });

  const { data: simulatedPrice, isLoading: isSimulating } = useQuery({
    queryKey: ['configurator3d', 'pricing', 'simulate', id, simulationSelections],
    queryFn: () =>
      configurator3dEndpoints.pricing.simulate(id, { selections: simulationSelections }),
    enabled: Object.keys(simulationSelections).length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      configurator3dEndpoints.pricing.updateSettings(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'config', id] });
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'pricing', 'breakdown', id] });
      toast({ title: 'Pricing updated' });
    },
    onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
  });

  const effectiveConfig = config ?? undefined;
  const ps = effectiveConfig?.pricingSettings;

  useEffect(() => {
    if (config?.pricingSettings) {
      setLocalPricing((p) => ({
        ...p,
        basePrice: config.pricingSettings?.basePrice ?? p.basePrice,
        currency: config.pricingSettings?.currency ?? p.currency,
        taxRate: config.pricingSettings?.taxRate ?? p.taxRate,
        dynamicPricing: config.pricingSettings?.dynamicPricing ?? p.dynamicPricing,
      }));
    }
  }, [config]);
  const basePrice = localPricing.basePrice || (ps?.basePrice ?? 0);
  const currency = localPricing.currency || (ps?.currency ?? 'EUR');
  const taxRate = localPricing.taxRate ?? (ps?.taxRate ?? 0);

  const components = effectiveConfig?.components ?? [];
  const breakdown = (priceBreakdown as PriceBreakdown) ?? null;
  const simResult = simulatedPrice as PriceBreakdown | undefined;

  const handleSave = () => {
    updateMutation.mutate({
      basePrice: localPricing.basePrice,
      currency: localPricing.currency,
      taxRate: localPricing.taxRate,
      dynamicPricing: localPricing.dynamicPricing,
    });
  };

  if (isLoading || !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pricing</h1>
            <p className="text-muted-foreground">Configure base price and per-option pricing</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Base Settings</CardTitle>
            <CardDescription>Base price, currency, and tax</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Base price</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={localPricing.basePrice || (ps?.basePrice ?? '')}
                onChange={(e) =>
                  setLocalPricing((p) => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={localPricing.currency || (ps?.currency ?? 'EUR')}
                onValueChange={(v) => setLocalPricing((p) => ({ ...p, currency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={(localPricing.taxRate ?? ps?.taxRate) ?? ''}
                onChange={(e) =>
                  setLocalPricing((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Dynamic pricing</Label>
                <p className="text-sm text-muted-foreground">Calculate price from options</p>
              </div>
              <Switch
                checked={localPricing.dynamicPricing ?? ps?.dynamicPricing ?? true}
                onCheckedChange={(v) => setLocalPricing((p) => ({ ...p, dynamicPricing: v }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Simulation</CardTitle>
            <CardDescription>Select options to see calculated price</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {components.map((c: Configurator3DComponent) => (
              <div key={c.id} className="space-y-2">
                <Label>{c.name}</Label>
                <Select
                  value={simulationSelections[c.id] ?? ''}
                  onValueChange={(v) =>
                    setSimulationSelections((s) => ({ ...s, [c.id]: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {c.options?.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {Object.keys(simulationSelections).length > 0 && (
              <div className="rounded-lg border p-4">
                {isSimulating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </div>
                ) : simResult ? (
                  <div>
                    <p className="text-2xl font-bold">
                      {simResult.total} {simResult.currency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Base: {simResult.basePrice} · Options: {simResult.optionsTotal} · Tax: {simResult.taxAmount}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per-Option Pricing</CardTitle>
          <CardDescription>Price deltas by component and option</CardDescription>
        </CardHeader>
        <CardContent>
          {breakdown?.breakdown && breakdown.breakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Option</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.breakdown.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.componentId}</TableCell>
                    <TableCell>{item.optionName}</TableCell>
                    <TableCell>{item.pricingType}</TableCell>
                    <TableCell>
                      {item.priceDelta} {item.currency}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Configure option pricing in each component. Options can have priceDelta, pricingType (FIXED, PERCENTAGE, etc.).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Distribution</CardTitle>
          <CardDescription>Visual breakdown (placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
            Chart: Base {basePrice} {currency} + options
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
