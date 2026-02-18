import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RuleType } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CONFIGURATOR_3D_LIMITS } from '../configurator-3d.constants';

export interface RuleCondition {
  type: string;
  componentId?: string;
  optionId?: string;
  value?: unknown;
  values?: unknown[];
}

export interface RuleAction {
  type: string;
  componentId?: string;
  optionId?: string;
  value?: unknown;
  priceModifier?: number;
}

export interface CreateRuleDto {
  name: string;
  description?: string;
  type: RuleType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number;
  isEnabled?: boolean;
  stopProcessing?: boolean;
}

export interface RuleEvaluationResult {
  appliedActions: RuleAction[];
  errors: string[];
  warnings: string[];
}

@Injectable()
export class Configurator3DRulesService {
  private readonly logger = new Logger(Configurator3DRulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(configurationId: string, brandId: string, dto: CreateRuleDto) {
    const count = await this.prisma.configurator3DRule.count({
      where: { configurationId },
    });

    if (count >= CONFIGURATOR_3D_LIMITS.MAX_RULES_PER_CONFIG) {
      throw new BadRequestException(
        `Maximum ${CONFIGURATOR_3D_LIMITS.MAX_RULES_PER_CONFIG} rules per configuration reached`,
      );
    }

    if (dto.conditions.length > CONFIGURATOR_3D_LIMITS.MAX_CONDITIONS_PER_RULE) {
      throw new BadRequestException(
        `Maximum ${CONFIGURATOR_3D_LIMITS.MAX_CONDITIONS_PER_RULE} conditions per rule`,
      );
    }

    if (dto.actions.length > CONFIGURATOR_3D_LIMITS.MAX_ACTIONS_PER_RULE) {
      throw new BadRequestException(
        `Maximum ${CONFIGURATOR_3D_LIMITS.MAX_ACTIONS_PER_RULE} actions per rule`,
      );
    }

    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { id: configurationId, brandId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found or access denied`,
      );
    }

    const rule = await this.prisma.configurator3DRule.create({
      data: {
        configurationId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        conditions: dto.conditions as unknown as Prisma.InputJsonValue,
        actions: dto.actions as unknown as Prisma.InputJsonValue,
        priority: dto.priority ?? 0,
        isEnabled: dto.isEnabled ?? true,
        stopProcessing: dto.stopProcessing ?? false,
      },
    });

    this.logger.log(`Rule ${rule.id} created for configuration ${configurationId}`);

    return rule;
  }

  async findAll(configurationId: string, brandId: string) {
    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { id: configurationId, brandId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found or access denied`,
      );
    }

    return this.prisma.configurator3DRule.findMany({
      where: { configurationId },
      orderBy: { priority: 'desc' },
    });
  }

  async findOne(
    configurationId: string,
    ruleId: string,
    brandId: string,
  ) {
    const rule = await this.prisma.configurator3DRule.findFirst({
      where: {
        id: ruleId,
        configurationId,
        configuration: { brandId },
      },
    });

    if (!rule) {
      throw new NotFoundException(
        `Rule ${ruleId} not found in configuration ${configurationId}`,
      );
    }

    return rule;
  }

  async update(
    configurationId: string,
    ruleId: string,
    brandId: string,
    dto: Partial<CreateRuleDto>,
  ) {
    await this.findOne(configurationId, ruleId, brandId);

    const updateData: Prisma.Configurator3DRuleUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.conditions !== undefined)
      updateData.conditions = dto.conditions as unknown as Prisma.InputJsonValue;
    if (dto.actions !== undefined)
      updateData.actions = dto.actions as unknown as Prisma.InputJsonValue;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.isEnabled !== undefined) updateData.isEnabled = dto.isEnabled;
    if (dto.stopProcessing !== undefined)
      updateData.stopProcessing = dto.stopProcessing;

    return this.prisma.configurator3DRule.update({
      where: { id: ruleId },
      data: updateData,
    });
  }

  async delete(configurationId: string, ruleId: string, brandId: string) {
    await this.findOne(configurationId, ruleId, brandId);

    await this.prisma.configurator3DRule.delete({
      where: { id: ruleId },
    });

    this.logger.log(`Rule ${ruleId} deleted from configuration ${configurationId}`);

    return { success: true, ruleId };
  }

  async evaluateRules(
    configurationId: string,
    selections: Record<string, string>,
  ): Promise<RuleEvaluationResult> {
    const rules = await this.prisma.configurator3DRule.findMany({
      where: { configurationId, isEnabled: true },
      orderBy: { priority: 'desc' },
    });

    const appliedActions: RuleAction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      const conditions = (rule.conditions as unknown) as RuleCondition[];
      const actions = (rule.actions as unknown) as RuleAction[];

      const allConditionsMet = conditions.every((cond) =>
        this.evaluateCondition(cond, selections),
      );

      if (allConditionsMet) {
        for (const action of actions) {
          const result = this.executeAction(action, selections);
          if (result.applied) {
            appliedActions.push(action);
          }
          if (result.error) errors.push(result.error);
          if (result.warning) warnings.push(result.warning);
        }

        if (rule.stopProcessing) break;
      }
    }

    return { appliedActions, errors, warnings };
  }

  evaluateCondition(
    condition: RuleCondition,
    selections: Record<string, string>,
  ): boolean {
    const { type, componentId, optionId, value, values } = condition;

    const selectedValue = componentId ? selections[componentId] : undefined;

    switch (type) {
      case 'EQUALS':
        return selectedValue === String(value);
      case 'NOT_EQUALS':
        return selectedValue !== String(value);
      case 'IN':
        return (
          Array.isArray(values) &&
          selectedValue !== undefined &&
          values.map(String).includes(selectedValue)
        );
      case 'IS_SELECTED':
        return optionId
          ? selectedValue === optionId
          : componentId
            ? selectedValue !== undefined && selectedValue !== ''
            : false;
      case 'IS_NOT_SELECTED':
        return optionId
          ? selectedValue !== optionId
          : componentId
            ? selectedValue === undefined || selectedValue === ''
            : true;
      case 'IS_EMPTY':
        return !selectedValue || selectedValue === '';
      case 'IS_NOT_EMPTY':
        return !!selectedValue && selectedValue !== '';
      default:
        return false;
    }
  }

  executeAction(
    action: RuleAction,
    selections: Record<string, string>,
  ): { applied: boolean; error?: string; warning?: string } {
    switch (action.type) {
      case 'REQUIRE':
      case 'EXCLUDE':
      case 'SHOW':
      case 'HIDE':
      case 'ENABLE':
      case 'DISABLE':
        return { applied: true };
      case 'SET_PRICE':
      case 'SET_DEFAULT':
        return { applied: true };
      default:
        return { applied: false };
    }
  }

  async validateConfiguration(
    configurationId: string,
    selections: Record<string, string>,
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const result = await this.evaluateRules(configurationId, selections);
    return {
      isValid: result.errors.length === 0,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  async validate(
    configurationId: string,
    dto: { selections?: Record<string, unknown> },
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const selections: Record<string, string> = {};
    if (dto.selections && typeof dto.selections === 'object') {
      for (const [k, v] of Object.entries(dto.selections)) {
        if (v != null) selections[k] = String(v);
      }
    }
    return this.validateConfiguration(configurationId, selections);
  }
}
