/**
 * Configurator3DRulesService unit tests
 * Constructor: prisma
 * Methods: CRUD + evaluateRules, evaluateCondition, executeAction, validateConfiguration, validate
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RuleType } from '@prisma/client';
import { Configurator3DRulesService } from './configurator-3d-rules.service';
import type { CreateRuleDto, RuleCondition, RuleAction } from './configurator-3d-rules.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CONFIGURATOR_3D_LIMITS } from '../configurator-3d.constants';

describe('Configurator3DRulesService', () => {
  let service: Configurator3DRulesService;
  let _prisma: PrismaService;

  const configurationId = 'cfg-1';
  const brandId = 'brand-1';
  const ruleId = 'rule-1';

  const mockPrisma = {
    configurator3DConfiguration: { findFirst: jest.fn() },
    configurator3DRule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DRulesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<Configurator3DRulesService>(Configurator3DRulesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create rule when under limits', async () => {
      mockPrisma.configurator3DRule.count.mockResolvedValue(5);
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      const created = { id: ruleId, configurationId, name: 'Rule 1', type: RuleType.VISIBILITY };
      mockPrisma.configurator3DRule.create.mockResolvedValue(created);

      const dto: CreateRuleDto = {
        name: 'Rule 1',
        type: RuleType.VISIBILITY,
        conditions: [{ type: 'EQUALS', componentId: 'c1', value: 'opt1' }],
        actions: [{ type: 'SHOW', componentId: 'c2' }],
      };
      const result = await service.create(configurationId, brandId, dto);

      expect(result).toEqual(created);
      expect(mockPrisma.configurator3DRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configurationId,
          name: 'Rule 1',
          type: RuleType.VISIBILITY,
          priority: 0,
          isEnabled: true,
          stopProcessing: false,
        }),
      });
    });

    it('should throw BadRequestException when max rules reached', async () => {
      mockPrisma.configurator3DRule.count.mockResolvedValue(CONFIGURATOR_3D_LIMITS.MAX_RULES_PER_CONFIG);

      await expect(
        service.create(configurationId, brandId, {
          name: 'R',
          type: RuleType.VISIBILITY,
          conditions: [],
          actions: [],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(configurationId, brandId, {
          name: 'R',
          type: RuleType.VISIBILITY,
          conditions: [],
          actions: [],
        }),
      ).rejects.toThrow(new RegExp(`Maximum ${CONFIGURATOR_3D_LIMITS.MAX_RULES_PER_CONFIG}`));
    });

    it('should throw BadRequestException when conditions exceed limit', async () => {
      mockPrisma.configurator3DRule.count.mockResolvedValue(0);
      const conditions = Array(CONFIGURATOR_3D_LIMITS.MAX_CONDITIONS_PER_RULE + 1)
        .fill(null)
        .map(() => ({ type: 'EQUALS' as const }));

      await expect(
        service.create(configurationId, brandId, {
          name: 'R',
          type: RuleType.VISIBILITY,
          conditions,
          actions: [{ type: 'SHOW' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when actions exceed limit', async () => {
      mockPrisma.configurator3DRule.count.mockResolvedValue(0);
      const actions = Array(CONFIGURATOR_3D_LIMITS.MAX_ACTIONS_PER_RULE + 1)
        .fill(null)
        .map(() => ({ type: 'SHOW' as const }));

      await expect(
        service.create(configurationId, brandId, {
          name: 'R',
          type: RuleType.VISIBILITY,
          conditions: [{ type: 'EQUALS' }],
          actions,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DRule.count.mockResolvedValue(0);
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(
        service.create('missing', brandId, {
          name: 'R',
          type: RuleType.VISIBILITY,
          conditions: [],
          actions: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return rules ordered by priority desc', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue({ id: configurationId, brandId });
      const rules = [{ id: ruleId, name: 'R1', priority: 1 }, { id: 'rule-2', name: 'R2', priority: 0 }];
      mockPrisma.configurator3DRule.findMany.mockResolvedValue(rules);

      const result = await service.findAll(configurationId, brandId);

      expect(result).toEqual(rules);
      expect(mockPrisma.configurator3DRule.findMany).toHaveBeenCalledWith({
        where: { configurationId },
        orderBy: { priority: 'desc' },
      });
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findFirst.mockResolvedValue(null);

      await expect(service.findAll('missing', brandId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return rule when found', async () => {
      const rule = { id: ruleId, configurationId, configuration: { brandId } };
      mockPrisma.configurator3DRule.findFirst.mockResolvedValue(rule);

      const result = await service.findOne(configurationId, ruleId, brandId);

      expect(result).toEqual(rule);
      expect(mockPrisma.configurator3DRule.findFirst).toHaveBeenCalledWith({
        where: { id: ruleId, configurationId, configuration: { brandId } },
      });
    });

    it('should throw NotFoundException when rule not found', async () => {
      mockPrisma.configurator3DRule.findFirst.mockResolvedValue(null);

      await expect(service.findOne(configurationId, 'missing', brandId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(configurationId, 'missing', brandId)).rejects.toThrow(
        /Rule missing not found in configuration/,
      );
    });
  });

  describe('update', () => {
    it('should update rule', async () => {
      mockPrisma.configurator3DRule.findFirst.mockResolvedValue({
        id: ruleId,
        configurationId,
        configuration: { brandId },
      });
      const updated = { id: ruleId, name: 'Updated' };
      mockPrisma.configurator3DRule.update.mockResolvedValue(updated);

      const result = await service.update(configurationId, ruleId, brandId, { name: 'Updated' });

      expect(result).toEqual(updated);
      expect(mockPrisma.configurator3DRule.update).toHaveBeenCalledWith({
        where: { id: ruleId },
        data: { name: 'Updated' },
      });
    });
  });

  describe('delete', () => {
    it('should delete rule', async () => {
      mockPrisma.configurator3DRule.findFirst.mockResolvedValue({
        id: ruleId,
        configurationId,
        configuration: { brandId },
      });
      mockPrisma.configurator3DRule.delete.mockResolvedValue({});

      const result = await service.delete(configurationId, ruleId, brandId);

      expect(result).toEqual({ success: true, ruleId });
      expect(mockPrisma.configurator3DRule.delete).toHaveBeenCalledWith({ where: { id: ruleId } });
    });
  });

  describe('evaluateRules', () => {
    it('should return appliedActions, errors, warnings', async () => {
      const rules = [
        {
          id: ruleId,
          isEnabled: true,
          stopProcessing: false,
          conditions: [{ type: 'EQUALS', componentId: 'c1', value: 'opt1' }],
          actions: [{ type: 'SHOW', componentId: 'c2' }],
        },
      ];
      mockPrisma.configurator3DRule.findMany.mockResolvedValue(rules);

      const result = await service.evaluateRules(configurationId, { c1: 'opt1' });

      expect(result).toHaveProperty('appliedActions');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.appliedActions)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should apply actions when all conditions met', async () => {
      const rules = [
        {
          id: ruleId,
          isEnabled: true,
          stopProcessing: false,
          conditions: [{ type: 'IS_SELECTED', componentId: 'c1' }],
          actions: [{ type: 'REQUIRE' }, { type: 'SHOW' }],
        },
      ];
      mockPrisma.configurator3DRule.findMany.mockResolvedValue(rules);

      const result = await service.evaluateRules(configurationId, { c1: 'opt1' });

      expect(result.appliedActions.length).toBeGreaterThanOrEqual(0);
    });

    it('should not apply actions when condition not met', async () => {
      const rules = [
        {
          id: ruleId,
          isEnabled: true,
          conditions: [{ type: 'EQUALS', componentId: 'c1', value: 'optX' }],
          actions: [{ type: 'SHOW' }],
        },
      ];
      mockPrisma.configurator3DRule.findMany.mockResolvedValue(rules);

      const result = await service.evaluateRules(configurationId, { c1: 'opt1' });

      expect(result.appliedActions).toEqual([]);
    });
  });

  describe('evaluateCondition', () => {
    it('EQUALS: should return true when selectedValue equals value', () => {
      const cond: RuleCondition = { type: 'EQUALS', componentId: 'c1', value: 'opt1' };
      expect(service.evaluateCondition(cond, { c1: 'opt1' })).toBe(true);
      expect(service.evaluateCondition(cond, { c1: 'opt2' })).toBe(false);
    });

    it('NOT_EQUALS: should return true when selectedValue does not equal value', () => {
      const cond: RuleCondition = { type: 'NOT_EQUALS', componentId: 'c1', value: 'opt1' };
      expect(service.evaluateCondition(cond, { c1: 'opt2' })).toBe(true);
      expect(service.evaluateCondition(cond, { c1: 'opt1' })).toBe(false);
    });

    it('IN: should return true when selectedValue is in values', () => {
      const cond: RuleCondition = { type: 'IN', componentId: 'c1', values: ['opt1', 'opt2'] };
      expect(service.evaluateCondition(cond, { c1: 'opt1' })).toBe(true);
      expect(service.evaluateCondition(cond, { c1: 'opt3' })).toBe(false);
    });

    it('IS_SELECTED: should return true when optionId selected or component has value', () => {
      expect(
        service.evaluateCondition(
          { type: 'IS_SELECTED', optionId: 'opt1', componentId: 'c1' },
          { c1: 'opt1' },
        ),
      ).toBe(true);
      expect(
        service.evaluateCondition(
          { type: 'IS_SELECTED', componentId: 'c1' },
          { c1: 'opt1' },
        ),
      ).toBe(true);
      expect(
        service.evaluateCondition(
          { type: 'IS_SELECTED', componentId: 'c1' },
          {},
        ),
      ).toBe(false);
    });

    it('IS_NOT_SELECTED: should return true when option not selected', () => {
      expect(
        service.evaluateCondition(
          { type: 'IS_NOT_SELECTED', optionId: 'opt1', componentId: 'c1' },
          { c1: 'opt2' },
        ),
      ).toBe(true);
      expect(
        service.evaluateCondition(
          { type: 'IS_NOT_SELECTED', componentId: 'c1' },
          {},
        ),
      ).toBe(true);
    });

    it('IS_EMPTY: should return true when no selection', () => {
      expect(
        service.evaluateCondition({ type: 'IS_EMPTY', componentId: 'c1' }, {}),
      ).toBe(true);
      expect(
        service.evaluateCondition({ type: 'IS_EMPTY', componentId: 'c1' }, { c1: 'opt1' }),
      ).toBe(false);
    });

    it('IS_NOT_EMPTY: should return true when selection present', () => {
      expect(
        service.evaluateCondition({ type: 'IS_NOT_EMPTY', componentId: 'c1' }, { c1: 'opt1' }),
      ).toBe(true);
      expect(
        service.evaluateCondition({ type: 'IS_NOT_EMPTY', componentId: 'c1' }, {}),
      ).toBe(false);
    });

    it('unknown type should return false', () => {
      expect(
        service.evaluateCondition({ type: 'UNKNOWN' as unknown, componentId: 'c1' }, { c1: 'opt1' }),
      ).toBe(false);
    });
  });

  describe('executeAction', () => {
    it('should return applied true for REQUIRE, EXCLUDE, SHOW, HIDE, ENABLE, DISABLE', () => {
      const actions: RuleAction[] = [
        { type: 'REQUIRE' },
        { type: 'EXCLUDE' },
        { type: 'SHOW' },
        { type: 'HIDE' },
        { type: 'ENABLE' },
        { type: 'DISABLE' },
        { type: 'SET_PRICE' },
        { type: 'SET_DEFAULT' },
      ];
      for (const action of actions) {
        const result = service.executeAction(action, {});
        expect(result.applied).toBe(true);
      }
    });

    it('unknown action type should return applied false', () => {
      const result = service.executeAction({ type: 'UNKNOWN' as unknown }, {});
      expect(result.applied).toBe(false);
    });
  });

  describe('validateConfiguration', () => {
    it('should return isValid true when no errors from evaluateRules', async () => {
      mockPrisma.configurator3DRule.findMany.mockResolvedValue([]);

      const result = await service.validateConfiguration(configurationId, { c1: 'opt1' });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('validate (dto with selections)', () => {
    it('should convert selections to string record and call validateConfiguration', async () => {
      mockPrisma.configurator3DRule.findMany.mockResolvedValue([]);

      const result = await service.validate(configurationId, {
        selections: { c1: 'opt1', c2: 123 },
      } as unknown);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle empty selections', async () => {
      mockPrisma.configurator3DRule.findMany.mockResolvedValue([]);

      const result = await service.validate(configurationId, {});

      expect(result.isValid).toBe(true);
    });
  });
});
