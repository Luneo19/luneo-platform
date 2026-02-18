/**
 * PricingCalculator tests
 * Base price, FIXED/PERCENTAGE/REPLACEMENT, multiple options, tax, rounding, rule modifications.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PricingCalculator } from '@/lib/configurator-3d/pricing/PricingCalculator';
import type {
  PricingSettings,
  Configurator3DComponent,
  Configurator3DOption,
  SelectionState,
} from '@/lib/configurator-3d/types/configurator.types';
import type { PriceModification } from '@/lib/configurator-3d/rules/RulesEngine';

const baseSettings: PricingSettings = {
  basePrice: 100,
  currency: 'EUR',
  taxRate: 0.2,
  roundTo: 2,
};

function option(id: string, name: string, pricing: Configurator3DOption['pricing']): Configurator3DOption {
  return {
    id,
    componentId: 'comp-1',
    name,
    type: 'COLOR',
    sortOrder: 0,
    isDefault: false,
    isEnabled: true,
    isVisible: true,
    pricing,
  };
}

const compWithOptions: Configurator3DComponent = {
  id: 'comp-1',
  name: 'Options',
  type: 'COLOR',
  selectionMode: 'SINGLE',
  isRequired: false,
  minSelections: 0,
  maxSelections: 1,
  sortOrder: 0,
  isVisible: true,
  isEnabled: true,
  options: [
    option('opt-fixed', 'Fixed', { priceDelta: 20, pricingType: 'FIXED', priceModifier: 20 }),
    option('opt-pct', 'Percent', { priceDelta: 10, pricingType: 'PERCENTAGE', priceModifier: 10 }),
    option('opt-replace', 'Replace', { priceDelta: 50, pricingType: 'REPLACEMENT', priceModifier: 50 }),
    option('opt-none', 'None', undefined),
  ],
};

const components: Configurator3DComponent[] = [compWithOptions];

describe('PricingCalculator', () => {
  let calculator: PricingCalculator;

  beforeEach(() => {
    calculator = new PricingCalculator(baseSettings, components);
  });

  it('base price with no options returns base in breakdown', () => {
    const result = calculator.calculate({});
    expect(result.basePrice).toBe(100);
    expect(result.subtotal).toBe(100);
    expect(result.taxAmount).toBe(20);
    expect(result.total).toBe(120);
    expect(result.breakdown).toHaveLength(0);
    expect(result.optionsTotal).toBe(0);
  });

  it('FIXED pricing type adds flat amount', () => {
    const result = calculator.calculate({ 'comp-1': 'opt-fixed' });
    expect(result.basePrice).toBe(100);
    expect(result.optionsTotal).toBe(20);
    expect(result.subtotal).toBe(120);
    expect(result.taxAmount).toBe(24);
    expect(result.total).toBe(144);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].priceDelta).toBe(20);
    expect(result.breakdown[0].pricingType).toBe('FIXED');
  });

  it('PERCENTAGE pricing type adds percentage of base', () => {
    const result = calculator.calculate({ 'comp-1': 'opt-pct' });
    expect(result.optionsTotal).toBe(10);
    expect(result.subtotal).toBe(110);
    expect(result.taxAmount).toBe(22);
    expect(result.total).toBe(132);
    expect(result.breakdown[0].pricingType).toBe('PERCENTAGE');
  });

  it('REPLACEMENT pricing type uses modifier as contribution', () => {
    const result = calculator.calculate({ 'comp-1': 'opt-replace' });
    expect(result.optionsTotal).toBe(50);
    expect(result.subtotal).toBe(150);
    expect(result.breakdown[0].pricingType).toBe('REPLACEMENT');
  });

  it('option without pricing contributes zero', () => {
    const result = calculator.calculate({ 'comp-1': 'opt-none' });
    expect(result.optionsTotal).toBe(0);
    expect(result.breakdown).toHaveLength(0);
    expect(result.subtotal).toBe(100);
  });

  it('multiple options sum correctly', () => {
    const multiComp: Configurator3DComponent = {
      ...compWithOptions,
      id: 'comp-multi',
      selectionMode: 'MULTIPLE',
      maxSelections: 3,
      options: [
        option('a', 'A', { priceDelta: 5, pricingType: 'FIXED', priceModifier: 5 }),
        option('b', 'B', { priceDelta: 10, pricingType: 'FIXED', priceModifier: 10 }),
      ],
    };
    const calc = new PricingCalculator(baseSettings, [multiComp]);
    const result = calc.calculate({ 'comp-multi': ['a', 'b'] });
    expect(result.optionsTotal).toBe(15);
    expect(result.subtotal).toBe(115);
    expect(result.breakdown).toHaveLength(2);
  });

  it('tax calculation uses configured tax rate', () => {
    const settings: PricingSettings = { ...baseSettings, taxRate: 0.1, basePrice: 100 };
    const calc = new PricingCalculator(settings, []);
    const result = calc.calculate({});
    expect(result.taxAmount).toBe(10);
    expect(result.total).toBe(110);
  });

  it('rounding behavior respects roundTo', () => {
    const settings: PricingSettings = { ...baseSettings, basePrice: 100, taxRate: 0.199, roundTo: 2 };
    const calc = new PricingCalculator(settings, []);
    const result = calc.calculate({});
    expect(result.subtotal).toBe(100);
    expect(result.taxAmount).toBe(19.9);
    expect(result.total).toBe(119.9);
    expect(Number(result.total.toFixed(2))).toBe(119.9);
  });

  it('price with rule modification SET_PRICE on total', () => {
    const result = calculator.calculate(
      { 'comp-1': 'opt-fixed' },
      [{ targetComponentId: 'comp-1', action: 'SET_PRICE', value: 200 }]
    );
    expect(result.subtotal).toBe(200);
    expect(result.ruleAdjustments).toBeDefined();
  });

  it('price with rule modification ADD_PRICE', () => {
    const result = calculator.calculate(
      { 'comp-1': 'opt-fixed' },
      [{ targetComponentId: 'comp-1', action: 'ADD_PRICE', value: 15 }]
    );
    expect(result.subtotal).toBe(135);
  });

  it('price with rule modification MULTIPLY_PRICE on total', () => {
    const result = calculator.calculate(
      { 'comp-1': 'opt-fixed' },
      [{ targetComponentId: 'comp-1', action: 'MULTIPLY_PRICE', value: 1.5 }]
    );
    expect(result.subtotal).toBe(180);
  });

  it('update() applies new settings and components', () => {
    calculator.update({ basePrice: 200, currency: 'USD', taxRate: 0 }, []);
    const result = calculator.calculate({});
    expect(result.basePrice).toBe(200);
    expect(result.currency).toBe('USD');
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(200);
  });

  it('zero base price with options still calculates option contributions', () => {
    const settings: PricingSettings = { ...baseSettings, basePrice: 0 };
    const calc = new PricingCalculator(settings, components);
    const result = calc.calculate({ 'comp-1': 'opt-fixed' });
    expect(result.basePrice).toBe(0);
    expect(result.optionsTotal).toBe(20);
    expect(result.subtotal).toBe(20);
  });
});
