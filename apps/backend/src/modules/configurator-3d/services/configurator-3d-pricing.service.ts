import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PricingType } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DRulesService } from './configurator-3d-rules.service';

export interface PriceBreakdownItem {
  componentId: string;
  optionId: string;
  optionName: string;
  pricingType: PricingType;
  priceDelta: number;
  calculatedPrice: number;
  currency: string;
}

export interface PriceResult {
  basePrice: number;
  optionsTotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  breakdown: PriceBreakdownItem[];
  ruleAdjustments: number;
}

export interface PricingSettings {
  basePrice?: number;
  currency?: string;
  taxRate?: number;
  [key: string]: unknown;
}

@Injectable()
export class Configurator3DPricingService {
  private readonly logger = new Logger(Configurator3DPricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesService: Configurator3DRulesService,
  ) {}

  async calculate(
    configurationId: string,
    selections: Record<string, string>,
  ): Promise<PriceResult> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
      select: {
        id: true,
        enablePricing: true,
        pricingSettings: true,
        components: {
          include: {
            options: { where: { isEnabled: true } },
          },
        },
      },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found`,
      );
    }

    const settings = (config.pricingSettings as PricingSettings) || {};
    const basePrice = settings.basePrice ?? 0;
    const currency = settings.currency ?? 'EUR';
    const taxRate = (settings.taxRate ?? 0) / 100;

    if (!config.enablePricing) {
      return {
        basePrice,
        optionsTotal: 0,
        subtotal: basePrice,
        taxAmount: basePrice * taxRate,
        total: basePrice * (1 + taxRate),
        currency,
        breakdown: [],
        ruleAdjustments: 0,
      };
    }

    const breakdown: PriceBreakdownItem[] = [];
    let optionsTotal = 0;

    for (const component of config.components) {
      const selectedOptionId = selections[component.id];
      if (!selectedOptionId) continue;

      const option = component.options.find((o) => o.id === selectedOptionId);
      if (!option) continue;

      const optionPrice = this.calculateOptionPrice(
        option.priceDelta,
        option.pricingType,
        option.priceModifier,
        option.priceFormula,
        basePrice,
      );

      breakdown.push({
        componentId: component.id,
        optionId: option.id,
        optionName: option.name,
        pricingType: option.pricingType,
        priceDelta: option.priceDelta,
        calculatedPrice: optionPrice,
        currency: option.currency ?? currency,
      });

      optionsTotal += optionPrice;
    }

    let ruleAdjustments = 0;
    try {
      const ruleResult = await this.rulesService.evaluateRules(
        configurationId,
        selections,
      );
      for (const action of ruleResult.appliedActions) {
        if (action.type === 'SET_PRICE' && action.priceModifier !== undefined) {
          ruleAdjustments += action.priceModifier;
        }
      }
    } catch (err) {
      this.logger.warn('Rule evaluation failed during pricing', err);
    }

    const subtotal = basePrice + optionsTotal + ruleAdjustments;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      basePrice,
      optionsTotal,
      subtotal,
      taxAmount,
      total,
      currency,
      breakdown,
      ruleAdjustments,
    };
  }

  private calculateOptionPrice(
    priceDelta: number,
    pricingType: PricingType,
    priceModifier: number,
    priceFormula: string | null,
    basePrice: number,
  ): number {
    switch (pricingType) {
      case PricingType.FIXED:
        return priceDelta;
      case PricingType.PERCENTAGE:
        return (basePrice * (priceModifier || priceDelta / 100)) / 100;
      case PricingType.REPLACEMENT:
        return priceDelta;
      case PricingType.FORMULA:
        if (!priceFormula) return 0;
        try {
          const fn = new Function(
            'base',
            'delta',
            'modifier',
            `return ${priceFormula}`,
          );
          return Number(fn(basePrice, priceDelta, priceModifier)) || 0;
        } catch {
          return priceDelta;
        }
      default:
        return priceDelta;
    }
  }

  async getBreakdown(
    configurationId: string,
    selections: Record<string, string>,
  ) {
    const result = await this.calculate(configurationId, selections);
    return result.breakdown;
  }

  async updateSettings(
    configurationId: string,
    brandId: string,
    settings: Partial<PricingSettings>,
  ) {
    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { id: configurationId, brandId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found or access denied`,
      );
    }

    const current = (config.pricingSettings as PricingSettings) || {};
    const merged = { ...current, ...settings };

    await this.prisma.configurator3DConfiguration.update({
      where: { id: configurationId },
      data: { pricingSettings: merged as object },
    });

    return merged;
  }

  async simulate(
    configurationId: string,
    scenarios: Record<string, string>[],
  ): Promise<PriceResult[]> {
    const results: PriceResult[] = [];
    for (const selections of scenarios) {
      results.push(await this.calculate(configurationId, selections));
    }
    return results;
  }
}
