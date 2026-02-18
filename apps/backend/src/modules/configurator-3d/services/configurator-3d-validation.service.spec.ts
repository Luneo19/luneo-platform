/**
 * Configurator3DValidationService unit tests
 * Constructor: prisma, rulesService
 * Methods: validateForPublish, validateSelections
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Configurator3DValidationService } from './configurator-3d-validation.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DRulesService } from './configurator-3d-rules.service';

describe('Configurator3DValidationService', () => {
  let service: Configurator3DValidationService;
  let prisma: PrismaService;
  let rulesService: Configurator3DRulesService;

  const configurationId = 'cfg-1';

  const mockPrisma = {
    configurator3DConfiguration: {
      findUnique: jest.fn(),
    },
  };

  const mockRulesService = {
    validateConfiguration: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DValidationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Configurator3DRulesService, useValue: mockRulesService },
      ],
    }).compile();

    service = module.get<Configurator3DValidationService>(Configurator3DValidationService);
    prisma = module.get<PrismaService>(PrismaService);
    rulesService = module.get<Configurator3DRulesService>(Configurator3DRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateForPublish', () => {
    it('should return isValid false and error when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue(null);

      const result = await service.validateForPublish('missing');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Configuration not found');
      expect(result.warnings).toEqual([]);
    });

    it('should add error when modelUrl is missing', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: null,
        components: [{ id: 'c1', name: 'C1', isRequired: false, options: [{ id: 'o1', isDefault: false }] }],
        rules: [],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Configuration must have a modelUrl');
    });

    it('should add error when no component has options', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        components: [
          { id: 'c1', name: 'C1', isRequired: false, options: [] },
        ],
        rules: [],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least one component with at least one option'))).toBe(true);
    });

    it('should add error when required component has no options', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        components: [
          { id: 'c1', name: 'Color', isRequired: true, options: [] },
        ],
        rules: [],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Required component') && e.includes('at least one option'))).toBe(
        true,
      );
    });

    it('should add error when required component has no default option', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        components: [
          {
            id: 'c1',
            name: 'Color',
            isRequired: true,
            options: [{ id: 'o1', isDefault: false }],
          },
        ],
        rules: [],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('must have a default option'))).toBe(true);
    });

    it('should add error when rule references invalid componentId', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        components: [
          { id: 'c1', name: 'C1', isRequired: false, options: [{ id: 'o1', isDefault: true }] },
        ],
        rules: [
          {
            id: 'r1',
            name: 'R1',
            conditions: [{ componentId: 'invalid-comp' }],
            actions: [],
          },
        ],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid component ID'))).toBe(true);
    });

    it('should add error when rule references invalid optionId', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        components: [
          { id: 'c1', name: 'C1', isRequired: false, options: [{ id: 'o1', isDefault: true }] },
        ],
        rules: [
          {
            id: 'r1',
            name: 'R1',
            conditions: [{ optionId: 'invalid-opt' }],
            actions: [],
          },
        ],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid option ID'))).toBe(true);
    });

    it('should add error when pricingSettings.basePrice is invalid', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        enablePricing: true,
        pricingSettings: { basePrice: -1 },
        components: [
          { id: 'c1', name: 'C1', isRequired: false, options: [{ id: 'o1', isDefault: true }] },
        ],
        rules: [],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('basePrice'))).toBe(true);
    });

    it('should add warning when pricing enabled but pricingSettings empty', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        enablePricing: true,
        pricingSettings: null,
        components: [
          { id: 'c1', name: 'C1', isRequired: false, options: [{ id: 'o1', isDefault: true }] },
        ],
        rules: [],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.warnings.some((w) => w.includes('pricingSettings is empty'))).toBe(true);
    });

    it('should return isValid true when all checks pass', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: configurationId,
        modelUrl: 'https://model.glb',
        enablePricing: false,
        pricingSettings: {},
        components: [
          { id: 'c1', name: 'C1', isRequired: false, options: [{ id: 'o1', isDefault: true }] },
        ],
        rules: [],
      });

      const result = await service.validateForPublish(configurationId);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateSelections', () => {
    it('should delegate to rulesService.validateConfiguration', async () => {
      mockRulesService.validateConfiguration.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      const result = await service.validateSelections(configurationId, { c1: 'opt1' });

      expect(result.isValid).toBe(true);
      expect(mockRulesService.validateConfiguration).toHaveBeenCalledWith(configurationId, { c1: 'opt1' });
    });
  });
});
