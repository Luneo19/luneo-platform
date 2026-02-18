/**
 * usePricing
 * Real-time pricing calculation hook
 * Subscribes to layers store changes and recalculates price
 */

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLayersStore } from '@/stores/customizer';
import { useCustomizerStore } from '@/stores/customizer';
import { useSessionStore } from '@/stores/customizer';
import { PricingCalculator } from '@/lib/customizer';
import type { PriceItem, PricingResult } from '@/lib/customizer';
import { logger } from '@/lib/logger';

interface UsePricingReturn {
  totalPrice: number;
  priceBreakdown: PriceItem[];
  currency: string;
  isCalculating: boolean;
  recalculate: () => void;
}

/**
 * Real-time pricing calculation hook
 */
export function usePricing(): UsePricingReturn {
  const layers = useLayersStore((state) => state.layers);
  const config = useCustomizerStore((state) => state.config);
  const updatePrice = useSessionStore((state) => state.updatePrice);

  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);

  const pricingSettings = config?.pricingSettings;
  const currency = pricingSettings?.currency || 'USD';

  // Initialize pricing calculator
  const calculator = useMemo(() => {
    if (!pricingSettings) {
      return null;
    }

    return new PricingCalculator({
      enabled: pricingSettings.enabled,
      basePrice: pricingSettings.basePrice,
      pricePerColor: pricingSettings.pricePerColor,
      pricePerText: pricingSettings.pricePerText,
      pricePerImage: pricingSettings.pricePerImage,
      currency: pricingSettings.currency,
    });
  }, [pricingSettings]);

  const recalculate = useCallback(() => {
    if (!calculator || !pricingSettings?.enabled) {
      setPricingResult({
        total: 0,
        breakdown: [],
      });
      return;
    }

    setIsCalculating(true);

    try {
      // Calculate price based on layers
      const result = calculator.calculate({
        layers: layers.map((layer) => ({
          id: layer.id,
          type: layer.type,
          metadata: layer.metadata || {},
        })),
      });

      setPricingResult(result);
      // Convert PricingCalculator PriceItem to session.store PriceItem format
      const sessionBreakdown: Array<{ id: string; label: string; amount: number; quantity?: number; type: 'base' | 'color' | 'text' | 'image' | 'shipping' | 'discount' | 'tax' }> = result.breakdown.map((item, index) => ({
        id: `item-${index}`,
        label: item.label,
        amount: item.total,
        quantity: item.quantity,
        type: (item.type === 'text' ? 'text' : item.type === 'image' ? 'image' : item.type === 'color' ? 'color' : item.type === 'base' ? 'base' : 'base') as 'base' | 'color' | 'text' | 'image' | 'shipping' | 'discount' | 'tax',
      }));
      updatePrice(result.total, sessionBreakdown);
    } catch (error) {
      logger.error('usePricing: calculation failed', { error });
      setPricingResult({
        total: 0,
        breakdown: [],
      });
    } finally {
      setIsCalculating(false);
    }
  }, [calculator, pricingSettings, layers, currency, updatePrice]);

  // Recalculate when layers change
  useEffect(() => {
    recalculate();
  }, [recalculate]);

  return {
    totalPrice: pricingResult?.total || 0,
    priceBreakdown: pricingResult?.breakdown || [],
    currency,
    isCalculating,
    recalculate,
  };
}
