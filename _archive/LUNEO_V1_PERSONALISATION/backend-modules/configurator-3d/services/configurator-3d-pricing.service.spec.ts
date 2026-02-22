/**
 * Configurator3DPricingService unit tests
 * Constructor: prisma, rulesService
 * Methods: calculate, getBreakdown, updateSettings, simulate
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PricingType } from '@prisma/client';
import { Configurator3DPricingService } from './configurator-3d-pricing.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DRulesService } from './configurator-3d-rules.service';

describe('Configurator3DPricingService', () => {
  let service: Configurator3DPricingService;
  let _prisma: PrismaService;
  let _rulesService: Configurator3DRulesService;

  const configurationId = 'cfg-1';
  const brandId = 'brand-1';
  const componentId = 'comp-1';
  const optionId = 'opt-1';

  const mockPrisma = {
    configurator3DConfiguration: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockRulesService = {
    evaluateRules: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DPricingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Configurator3DRulesService, useValue: mockRulesService },
      ],
    }).compile();

    service = module.get<Configurator3DPricingService>(Configurator3DPricingService);
    prisma = module.get<PrismaService>(PrismaService);
    rulesService = module.get<Configurator3DRulesService>(Configurator3DRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculate', () => {
    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue(null);

      await expect(service.calculate('missing', {})).rejects.toThrow(NotFoundException);
      await expect(service.calculate('missing', {})).rejects.toThrow(/Configuration missing not found/);
    });

    it('should return base price and zero options when enablePricing false', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: false,
        pricingSettings: { basePrice: 1000, currency: 'EUR', taxRate: 20 },
        components: [],
      });

      const result = await service.calculate(configurationId, {});

      expect(result.basePrice).toBe(1000);
      expect(result.optionsTotal).toBe(0);
      expect(result.subtotal).toBe(1000);
      expect(result.taxAmount).toBe(200);
      expect(result.total).toBe(1200);
      expect(result.currency).toBe('EUR');
      expect(result.breakdown).toEqual([]);
      expect(result.ruleAdjustments).toBe(0);
    });

    it('should use default basePrice 0 and currency EUR when settings empty', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: false,
        pricingSettings: null,
        components: [],
      });

      const result = await service.calculate(configurationId, {});

      expect(result.basePrice).toBe(0);
      expect(result.currency).toBe('EUR');
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should calculate FIXED option price (priceDelta)', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: true,
        pricingSettings: { basePrice: 100, currency: 'EUR', taxRate: 0 },
        components: [
          {
            id: componentId,
            options: [
              {
                id: optionId,
                name: 'Premium',
                priceDelta: 50,
                pricingType: PricingType.FIXED,
                priceModifier: 0,
                priceFormula: null,
                currency: 'EUR',
              },
            ],
          },
        ],
      });
      mockRulesService.evaluateRules.mockResolvedValue({ appliedActions: [], errors: [], warnings: [] });

      const result = await service.calculate(configurationId, { [componentId]: optionId });

      expect(result.basePrice).toBe(100);
      expect(result.optionsTotal).toBe(50);
      expect(result.subtotal).toBe(150);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].calculatedPrice).toBe(50);
      expect(result.breakdown[0].pricingType).toBe(PricingType.FIXED);
    });

    it('should calculate PERCENTAGE option price from basePrice', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: true,
        pricingSettings: { basePrice: 1000, currency: 'EUR', taxRate: 0 },
        components: [
          {
            id: componentId,
            options: [
              {
                id: optionId,
                name: 'Plus 10%',
                priceDelta: 0,
                pricingType: PricingType.PERCENTAGE,
                priceModifier: 10,
                priceFormula: null,
                currency: 'EUR',
              },
            ],
          },
        ],
      });
      mockRulesService.evaluateRules.mockResolvedValue({ appliedActions: [], errors: [], warnings: [] });

      const result = await service.calculate(configurationId, { [componentId]: optionId });

      expect(result.optionsTotal).toBe(100);
      expect(result.subtotal).toBe(1100);
      expect(result.breakdown[0].calculatedPrice).toBe(100);
    });

    it('should include ruleAdjustments when SET_PRICE action applied', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: true,
        pricingSettings: { basePrice: 100, currency: 'EUR', taxRate: 0 },
        components: [],
      });
      mockRulesService.evaluateRules.mockResolvedValue({
        appliedActions: [{ type: 'SET_PRICE', priceModifier: 25 }],
        errors: [],
        warnings: [],
      });

      const result = await service.calculate(configurationId, {});

      expect(result.ruleAdjustments).toBe(25);
      expect(result.subtotal).toBe(125);
    });

    it('should apply tax from pricingSettings.taxRate', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: false,
        pricingSettings: { basePrice: 100, currency: 'EUR', taxRate: 10 },
        components: [],
      });

      const result = await service.calculate(configurationId, {});

      expect(result.taxAmount).toBe(10);
      expect(result.total).toBeCloseTo(110, 10);
    });

    it('should skip option not in selections', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: true,
        pricingSettings: { basePrice: 100, currency: 'EUR', taxRate: 0 },
        components: [
          {
            id: componentId,
            options: [
              { id: optionId, name: 'O1', priceDelta: 10, pricingType: PricingType.FIXED, priceModifier: 0, priceFormula: null, currency: 'EUR' },
            ],
          },
        ],
      });
      mockRulesService.evaluateRules.mockResolvedValue({ appliedActions: [], errors: [], warnings: [] });

      const result = await service.calculate(configurationId, {});

      expect(result.optionsTotal).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });

    it('should only include enabled options', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: true,
        pricingSettings: { basePrice: 100, currency: 'EUR', taxRate: 0 },
        components: [
          {
            id: componentId,
            options: [
              { id: optionId, name: 'O1', priceDelta: 10, pricingType: PricingType.FIXED, priceModifier: 0, priceFormula: null, currency: 'EUR', isEnabled: true },
            ],
          },
        ],
      });
      mockRulesService.evaluateRules.mockResolvedValue({ appliedActions: [], errors: [], warnings: [] });

      const result = await service.calculate(configurationId, { [componentId]: optionId });

      expect(result.breakdown).toHaveLength(1);
    });
  });

  describe('getBreakdown', () => {
    it('should return breakdown from calculate', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: true,
        pricingSettings: { basePrice: 0, currency: 'EUR', taxRate: 0 },
        components: [],
      });
      mockRulesService.evaluateRules.mockResolvedValue({ appliedActions: [], errors: [], warnings: [] });

      const result = await service.getBreakdown(configurationId, {});

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('updateSettings', () => {
    it('should merge and persist pricing settings', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({
        id: configurationId,
        brandId,
        pricingSettings: { basePrice: 100, currency: 'EUR' },
      });
      mockPrisma.configurator3DConfiguration.update.mockResolvedValue({});

      const result = await service.updateSettings(configurationId, brandId, {
        basePrice: 200,
        taxRate: 20,
      });

      expect(result).toMatchObject({ basePrice: 200, currency: 'EUR', taxRate: 20 });
      expect(mockPrisma.configurator3DConfiguration.update).toHaveBeenCalledWith({
        where: { id: configurationId },
        data: { pricingSettings: expect.objectContaining({ basePrice: 200, taxRate: 20 }) },
      });
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSettings('missing', brandId, { basePrice: 100 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateSettings('missing', brandId, { basePrice: 100 }),
      ).rejects.toThrow(/not found or access denied/);
    });
  });

  describe('simulate', () => {
    it('should return array of PriceResult for each scenario', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        enablePricing: false,
        pricingSettings: { basePrice: 50, currency: 'EUR', taxRate: 0 },
        components: [],
      });

      const scenarios: Record<string, string>[] = [{}, { [componentId]: optionId }];
      const result = await service.simulate(configurationId, scenarios);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('total');
      expect(result[0]).toHaveProperty('breakdown');
      expect(result[1]).toHaveProperty('total');
    });
  });
});
