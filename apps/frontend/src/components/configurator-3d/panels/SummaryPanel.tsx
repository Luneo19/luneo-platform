'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShoppingCart, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PriceAnimator } from './PriceAnimator';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { CurrencyFormatter } from '@/lib/configurator-3d/pricing/CurrencyFormatter';
import { cn } from '@/lib/utils';

export interface SummaryPanelProps {
  className?: string;
  /** CTA variant: 'cart' | 'quote' */
  ctaVariant?: 'cart' | 'quote';
  onAddToCart?: () => void;
  onRequestQuote?: () => void;
}

export function SummaryPanel({
  className,
  ctaVariant = 'cart',
  onAddToCart,
  onRequestQuote,
}: SummaryPanelProps) {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const selections = useConfigurator3DStore((s) => s.selections);
  const price = useConfigurator3DStore((s) => s.price);
  const priceBreakdown = useConfigurator3DStore((s) => s.priceBreakdown);
  const validation = useConfigurator3DStore((s) => s.validation);
  const addToCart = useConfigurator3DStore((s) => s.addToCart);

  const currency = configuration?.pricingSettings?.currency ?? 'EUR';
  const enablePricing = configuration?.features?.enablePricing ?? false;

  const summaryItems = React.useMemo(() => {
    if (!configuration) return [];
    return configuration.components
      .filter((c) => c.isVisible && selections[c.id])
      .map((comp) => {
        const sel = selections[comp.id];
        const optionIds = Array.isArray(sel) ? sel : [sel];
        const options = optionIds
          .map((id) => comp.options.find((o) => o.id === id)) as { name: string }[];
        return {
          componentName: comp.name,
          options: options.filter(Boolean).map((o) => o.name),
        };
      });
  }, [configuration, selections]);

  const handleAddToCart = async () => {
    if (onAddToCart) {
      onAddToCart();
      return;
    }
    const result = await addToCart();
    if (!result.success && result.error) {
      // Toast would be shown by parent
    }
  };

  const handleRequestQuote = () => {
    onRequestQuote?.();
  };

  if (!configuration) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validation.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              {validation.errors.map((e) => (
                <p key={e.code}>{e.message}</p>
              ))}
            </div>
          </motion.div>
        )}

        {validation.warnings.length > 0 && validation.errors.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              {validation.warnings.map((w) => (
                <p key={w.code}>{w.message}</p>
              ))}
            </div>
          </motion.div>
        )}

        <ScrollArea className="max-h-[200px]">
          <div className="space-y-3 pr-2">
            {summaryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No selections yet. Configure your product above.
              </p>
            ) : (
              summaryItems.map((item) => (
                <div key={item.componentName}>
                  <p className="text-sm font-medium">{item.componentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.options.join(', ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {enablePricing && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Total</span>
              <PriceAnimator value={price} currency={currency} className="text-lg font-semibold" />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {ctaVariant === 'cart' ? (
            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={!validation.valid}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRequestQuote}
              disabled={!validation.valid}
            >
              <FileText className="mr-2 h-4 w-4" />
              Request Quote
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
