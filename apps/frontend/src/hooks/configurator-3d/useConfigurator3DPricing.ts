/**
 * useConfigurator3DPricing - Pricing with debounce
 * Auto-recalculate on selection change with 300ms debounce
 */

import { useEffect, useCallback, useRef } from 'react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { PriceBreakdown } from '@/lib/configurator-3d/types/configurator.types';

const DEBOUNCE_MS = 300;

export interface UseConfigurator3DPricingReturn {
  price: number;
  priceBreakdown: PriceBreakdown | null;
  isPriceCalculating: boolean;
  formatPrice: (value: number, currency?: string) => string;
  recalculate: () => Promise<void>;
}

export function useConfigurator3DPricing(configurationId: string | null): UseConfigurator3DPricingReturn {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const selections = useConfigurator3DStore((s) => s.selections);
  const price = useConfigurator3DStore((s) => s.price);
  const priceBreakdown = useConfigurator3DStore((s) => s.priceBreakdown);
  const isPriceCalculating = useConfigurator3DStore((s) => s.isPriceCalculating);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recalculate = useCallback(async () => {
    if (!configurationId || !configuration?.features?.enablePricing) return;
    await useConfigurator3DStore.getState().calculatePrice();
  }, [configurationId, configuration?.features?.enablePricing]);

  useEffect(() => {
    if (!configurationId || !configuration?.features?.enablePricing) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      recalculate();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [configurationId, configuration?.features?.enablePricing, selections, recalculate]);

  const formatPrice = useCallback((value: number, currency?: string) => {
    const curr = currency ?? priceBreakdown?.currency ?? 'EUR';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, [priceBreakdown?.currency]);

  return {
    price,
    priceBreakdown,
    isPriceCalculating,
    formatPrice,
    recalculate,
  };
}