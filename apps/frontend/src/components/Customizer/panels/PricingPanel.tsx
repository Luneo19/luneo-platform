'use client';

import { ShoppingCart, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePricing } from '@/hooks/customizer/usePricing';
import type { PriceItem } from '@/lib/customizer';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/formatters';

/**
 * PricingPanel - Price calculator panel
 */
export function PricingPanel() {
  const { toast } = useToast();
  const { totalPrice, priceBreakdown, currency, isCalculating } = usePricing();

  const handleAddToCart = () => {
    toast({
      title: 'Add to Cart',
      description: 'This feature will be implemented soon',
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <CardTitle>Pricing</CardTitle>
        </div>
        <CardDescription>Real-time price calculation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Price */}
        <div className="text-center p-6 rounded-lg border bg-muted/50">
          <div className="text-sm text-muted-foreground mb-1">Total Price</div>
          <div className="text-4xl font-bold">
            {isCalculating ? (
              <span className="text-muted-foreground">Calculating...</span>
            ) : (
              formatCurrency(totalPrice, currency)
            )}
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Price Breakdown</div>
          <ScrollArea className="h-[200px]">
            {priceBreakdown.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No items in breakdown
              </div>
            ) : (
              <div className="space-y-2">
                {priceBreakdown.map((item: PriceItem, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity > 1 && `${item.quantity} × `}
                        {formatCurrency(item.unitPrice, currency)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold ml-4">
                      {formatCurrency(item.total, currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* Add to Cart Button */}
        <Button onClick={handleAddToCart} className="w-full" size="lg">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
