import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DRulesService } from './configurator-3d-rules.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class Configurator3DValidationService {
  private readonly logger = new Logger(Configurator3DValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesService: Configurator3DRulesService,
  ) {}

  async validateForPublish(configurationId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
      include: {
        components: {
          include: { options: true },
        },
        rules: true,
      },
    });

    if (!config) {
      return {
        isValid: false,
        errors: ['Configuration not found'],
        warnings: [],
      };
    }

    if (!config.modelUrl) {
      errors.push('Configuration must have a modelUrl');
    }

    const componentsWithOptions = config.components.filter(
      (c) => c.options && c.options.length > 0,
    );

    if (componentsWithOptions.length === 0) {
      errors.push(
        'Configuration must have at least one component with at least one option',
      );
    }

    for (const component of config.components) {
      if (component.isRequired && (!component.options || component.options.length === 0)) {
        errors.push(
          `Required component "${component.name}" must have at least one option`,
        );
      }

      if (component.isRequired && component.options) {
        const hasDefault = component.options.some((o) => o.isDefault);
        if (!hasDefault) {
          errors.push(
            `Required component "${component.name}" must have a default option`,
          );
        }
      }
    }

    const componentIds = new Set(config.components.map((c) => c.id));
    const optionIds = new Set(
      config.components.flatMap((c) => (c.options || []).map((o) => o.id)),
    );

    for (const rule of config.rules) {
      const conditions = (rule.conditions as Array<{ componentId?: string; optionId?: string }>) || [];
      const actions = (rule.actions as Array<{ componentId?: string; optionId?: string }>) || [];

      for (const cond of conditions) {
        if (cond.componentId && !componentIds.has(cond.componentId)) {
          errors.push(
            `Rule "${rule.name}" references invalid component ID: ${cond.componentId}`,
          );
        }
        if (cond.optionId && !optionIds.has(cond.optionId)) {
          errors.push(
            `Rule "${rule.name}" references invalid option ID: ${cond.optionId}`,
          );
        }
      }

      for (const action of actions) {
        if (action.componentId && !componentIds.has(action.componentId)) {
          errors.push(
            `Rule "${rule.name}" action references invalid component ID: ${action.componentId}`,
          );
        }
        if (action.optionId && !optionIds.has(action.optionId)) {
          errors.push(
            `Rule "${rule.name}" action references invalid option ID: ${action.optionId}`,
          );
        }
      }
    }

    if (config.enablePricing) {
      const settings = config.pricingSettings as Record<string, unknown> | null;
      if (!settings || typeof settings !== 'object') {
        warnings.push('Pricing is enabled but pricingSettings is empty');
      } else if (
        settings.basePrice !== undefined &&
        (typeof settings.basePrice !== 'number' || settings.basePrice < 0)
      ) {
        errors.push('pricingSettings.basePrice must be a non-negative number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async validateSelections(
    configurationId: string,
    selections: Record<string, string>,
  ): Promise<ValidationResult> {
    return this.rulesService.validateConfiguration(
      configurationId,
      selections,
    );
  }
}
