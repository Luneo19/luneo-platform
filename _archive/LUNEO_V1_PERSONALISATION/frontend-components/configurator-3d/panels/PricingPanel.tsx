'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PriceAnimator } from './PriceAnimator';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { CurrencyFormatter } from '@/lib/configurator-3d/pricing/CurrencyFormatter';
import { cn } from '@/lib/utils';

export interface PricingPanelProps {
  className?: string;
  compact?: boolean;
}

export function PricingPanel({ className, compact }: PricingPanelProps) {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const price = useConfigurator3DStore((s) => s.price);
  const priceBreakdown = useConfigurator3DStore((s) => s.priceBreakdown);
  const isPriceCalculating = useConfigurator3DStore((s) => s.isPriceCalculating);
  const selections = useConfigurator3DStore((s) => s.selections);
  const hasSelections = Object.keys(selections).length > 0;

  const enablePricing = configuration?.features?.enablePricing ?? false;
  const showTax = configuration?.pricingSettings?.showTax ?? false;
  const showBasePrice = configuration?.pricingSettings?.showBasePrice ?? true;
  const taxRate = configuration?.pricingSettings?.taxRate ?? 0;
  const currency = configuration?.pricingSettings?.currency ?? 'EUR';

  if (!enablePricing) return null;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isPriceCalculating ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-lg font-semibold">
            {hasSelections ? (
              <PriceAnimator value={price} currency={currency} compact />
            ) : (
              <span className="text-muted-foreground">
                Starting from{' '}
                {CurrencyFormatter.format(
                  priceBreakdown?.basePrice ?? 0,
                  currency
                )}
              </span>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Price</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPriceCalculating ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Calculating...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {hasSelections ? (
                <PriceAnimator value={price} currency={currency} />
              ) : (
                <span className="text-muted-foreground">
                  Starting from{' '}
                  {CurrencyFormatter.format(
                    priceBreakdown?.basePrice ?? 0,
                    currency
                  )}
                </span>
              )}
            </div>

            {priceBreakdown && hasSelections && (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  {showBasePrice && priceBreakdown.basePrice > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Base price</span>
                      <span>
                        {CurrencyFormatter.format(
                          priceBreakdown.basePrice,
                          currency
                        )}
                      </span>
                    </div>
                  )}
                  {priceBreakdown.breakdown?.map((item) => (
                    <div
                      key={`${item.componentId}-${item.optionId}`}
                      className="flex justify-between text-muted-foreground"
                    >
                      <span className="truncate">{item.optionName}</span>
                      <span>
                        {item.priceDelta > 0 ? '+' : ''}
                        {CurrencyFormatter.format(
                          item.priceDelta,
                          item.currency
                        )}
                      </span>
                    </div>
                  ))}
                  {showTax && priceBreakdown.taxAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({taxRate}%)</span>
                      <span>
                        {CurrencyFormatter.format(
                          priceBreakdown.taxAmount,
                          currency
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
