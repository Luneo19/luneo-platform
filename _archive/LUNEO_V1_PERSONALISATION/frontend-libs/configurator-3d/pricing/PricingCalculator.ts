/**
 * Pricing Calculator - Client-side price calculation for 3D Configurator
 * Applies option pricing, rule modifications, tax, and rounding
 */

import type {
  PricingSettings,
  Configurator3DComponent,
  Configurator3DOption,
  SelectionState,
  PriceBreakdown,
  PriceBreakdownItem,
  PricingType,
} from '@/lib/configurator-3d/types/configurator.types';
import type { PriceModification } from '@/lib/configurator-3d/rules/RulesEngine';

// =============================================================================
// PRICING CALCULATOR
// =============================================================================

export class PricingCalculator {
  private pricingSettings: PricingSettings;
  private components: Configurator3DComponent[];
  private basePrice: number;
  private currency: string;
  private taxRate: number;
  private roundTo: number;

  constructor(
    pricingSettings: PricingSettings,
    components: Configurator3DComponent[]
  ) {
    this.pricingSettings = pricingSettings;
    this.components = components;
    this.basePrice = pricingSettings.basePrice ?? 0;
    this.currency = pricingSettings.currency ?? 'EUR';
    this.taxRate = pricingSettings.taxRate ?? 0;
    this.roundTo = pricingSettings.roundTo ?? 2;
  }

  /**
   * Calculate full price breakdown from selections and optional rule modifications
   */
  calculate(
    selections: SelectionState,
    priceModifications?: PriceModification[]
  ): PriceBreakdown {
    const breakdown: PriceBreakdownItem[] = [];
    let optionsTotal = 0;

    // 1. Start with base price
    let runningTotal = this.basePrice;

    // 2. For each selection, find the option and apply pricing
    for (const [componentId, selectionValue] of Object.entries(selections)) {
      if (selectionValue === undefined || selectionValue === null) continue;

      const optionIds = Array.isArray(selectionValue)
        ? selectionValue
        : [selectionValue];

      for (const optionId of optionIds) {
        if (!optionId) continue;

        const option = this.findOption(componentId, optionId);
        if (!option || !option.pricing) continue;

        const contribution = this.calculateOptionPrice(option, this.basePrice);
        optionsTotal += contribution;
        runningTotal += contribution;

        breakdown.push({
          componentId,
          optionId: option.id,
          optionName: option.name,
          pricingType: option.pricing.pricingType ?? 'FIXED',
          priceDelta: contribution,
          calculatedPrice: contribution,
          currency: this.currency,
        });
      }
    }

    let ruleAdjustments = 0;

    // 3. Apply rule-based price modifications
    if (priceModifications && priceModifications.length > 0) {
      for (const mod of priceModifications) {
        if (mod.targetOptionId) {
          const item = breakdown.find(
            (b) => b.componentId === mod.targetComponentId && b.optionId === mod.targetOptionId
          );

          switch (mod.action) {
            case 'SET_PRICE':
              if (item) {
                const delta = mod.value - item.calculatedPrice;
                item.calculatedPrice = mod.value;
                item.priceDelta = mod.value;
                ruleAdjustments += delta;
                runningTotal += delta;
              }
              break;
            case 'ADD_PRICE':
              if (item) {
                item.calculatedPrice += mod.value;
                item.priceDelta += mod.value;
              }
              ruleAdjustments += mod.value;
              runningTotal += mod.value;
              break;
            case 'MULTIPLY_PRICE':
              if (item) {
                const newPrice = item.calculatedPrice * mod.value;
                const delta = newPrice - item.calculatedPrice;
                item.calculatedPrice = newPrice;
                item.priceDelta = newPrice;
                ruleAdjustments += delta;
                runningTotal += delta;
              }
              break;
          }
        } else {
          switch (mod.action) {
            case 'SET_PRICE':
              ruleAdjustments += mod.value - runningTotal;
              runningTotal = mod.value;
              break;
            case 'ADD_PRICE':
              ruleAdjustments += mod.value;
              runningTotal += mod.value;
              break;
            case 'MULTIPLY_PRICE':
              const delta = runningTotal * mod.value - runningTotal;
              ruleAdjustments += delta;
              runningTotal *= mod.value;
              break;
          }
        }
      }
    }

    const subtotal = this.round(runningTotal);
    const taxAmount = this.round(subtotal * this.taxRate);
    const total = this.round(subtotal + taxAmount);

    return {
      basePrice: this.basePrice,
      optionsTotal: this.round(optionsTotal),
      subtotal,
      taxAmount,
      total,
      currency: this.currency,
      breakdown,
      ruleAdjustments: ruleAdjustments !== 0 ? this.round(ruleAdjustments) : undefined,
    };
  }

  /**
   * Calculate individual option price contribution
   */
  calculateOptionPrice(option: Configurator3DOption, basePrice: number): number {
    const pricing = option.pricing;
    if (!pricing) return 0;

    const type = (pricing.pricingType ?? 'FIXED') as PricingType;
    const modifier = pricing.priceModifier ?? pricing.priceDelta ?? 0;

    switch (type) {
      case 'FIXED':
        return modifier;

      case 'PERCENTAGE':
        return (basePrice * modifier) / 100;

      case 'REPLACEMENT':
        return modifier;

      case 'FORMULA':
        return this.evaluateFormula(
          pricing.priceFormula ?? '0',
          basePrice,
          modifier
        );

      default:
        return modifier;
    }
  }

  /**
   * Update pricing settings and components
   */
  update(
    pricingSettings: PricingSettings,
    components: Configurator3DComponent[]
  ): void {
    this.pricingSettings = pricingSettings;
    this.components = components;
    this.basePrice = pricingSettings.basePrice ?? 0;
    this.currency = pricingSettings.currency ?? 'EUR';
    this.taxRate = pricingSettings.taxRate ?? 0;
    this.roundTo = pricingSettings.roundTo ?? 2;
  }

  private findOption(
    componentId: string,
    optionId: string
  ): Configurator3DOption | undefined {
    const component = this.components.find((c) => c.id === componentId);
    return component?.options.find((o) => o.id === optionId);
  }

  private round(value: number): number {
    const factor = Math.pow(10, this.roundTo);
    return Math.round(value * factor) / factor;
  }

  /**
   * Evaluate simple formula - basic math only (+, -, *, /, numbers, base, modifier)
   * e.g. "base * 1.1", "base + modifier", "modifier * 2"
   */
  private evaluateFormula(
    formula: string,
    basePrice: number,
    modifier: number
  ): number {
    try {
      const sanitized = formula
        .replace(/\bbase\b/gi, String(basePrice))
        .replace(/\bmodifier\b/gi, String(modifier))
        .replace(/[^0-9+\-*/().\s]/g, '');

      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${sanitized})`)();
      return typeof result === 'number' && !Number.isNaN(result) ? result : 0;
    } catch {
      return 0;
    }
  }
}
