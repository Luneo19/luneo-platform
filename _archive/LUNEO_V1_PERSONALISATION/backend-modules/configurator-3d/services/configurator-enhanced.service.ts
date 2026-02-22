import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { RuleType } from '@prisma/client';
import { ExportType, ExportStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DRulesService } from './configurator-3d-rules.service';
import type { RuleCondition, RuleAction } from './configurator-3d-rules.service';
import { Configurator3DPricingService } from './configurator-3d-pricing.service';
import type { PricingSettings } from './configurator-3d-pricing.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidateRulesResult {
  valid: boolean;
  errors: Array<{ component: string; rule: string; message: string }>;
  warnings: Array<{ component: string; message: string }>;
}

export interface MaterialLibraryOptions {
  category?: 'wood' | 'metal' | 'fabric' | 'plastic' | 'stone';
}

export interface MaterialLibraryItem {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  albedoMap: string | null;
  normalMap: string | null;
  roughnessMap: string | null;
  metalnessMap: string | null;
}

export type ExportFormat = 'image-hd' | 'model-3d' | 'spec-pdf' | 'ar';

export interface ExportConfigurationResult {
  exportId: string;
  jobId: string;
  format: ExportFormat;
  estimatedDuration: number;
}

export interface OptionPriceItem {
  name: string;
  price: number;
}

export interface RealtimePriceResult {
  basePrice: number;
  optionPrices: OptionPriceItem[];
  materialSurcharge: number;
  discount: number;
  totalPrice: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ConfiguratorEnhancedService {
  private readonly logger = new Logger(ConfiguratorEnhancedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rulesService: Configurator3DRulesService,
    private readonly pricingService: Configurator3DPricingService,
    @InjectQueue('configurator-export') private readonly exportQueue: Queue,
  ) {}

  /**
   * Rules engine: compatibility (exclusions) and dependencies.
   */
  async validateRules(
    configId: string,
    selectedOptions: Record<string, string>,
  ): Promise<ValidateRulesResult> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configId },
      include: {
        rules: { where: { isEnabled: true }, orderBy: { priority: 'desc' } },
        components: { include: { options: true } },
      },
    });

    if (!config) {
      throw new NotFoundException(`Configuration ${configId} not found`);
    }

    const componentById = new Map(config.components.map((c) => [c.id, c]));
    const errors: ValidateRulesResult['errors'] = [];
    const warnings: ValidateRulesResult['warnings'] = [];

    for (const rule of config.rules) {
      const conditions = (rule.conditions as unknown) as RuleCondition[];
      const actions = (rule.actions as unknown) as RuleAction[];
      const allConditionsMet = (conditions.length === 0) || conditions.every((cond) =>
        this.rulesService.evaluateCondition(cond, selectedOptions),
      );

      if (!allConditionsMet) continue;

      for (const action of actions) {
        if (action.type === 'EXCLUDE' && action.optionId) {
          const excludedOptId = action.optionId;
          const componentIdWithExcluded = Object.entries(selectedOptions).find(
            ([_, optId]) => optId === excludedOptId,
          )?.[0];
          if (componentIdWithExcluded) {
            const comp = componentById.get(componentIdWithExcluded);
            const compName = comp?.name ?? componentIdWithExcluded;
            errors.push({
              component: compName,
              rule: rule.name,
              message: `Option is not compatible with current selection (excluded by rule).`,
            });
          }
        }
        if (action.type === 'REQUIRE' && action.componentId) {
          const compId = action.componentId;
          const requiredOptId = action.optionId;
          const selected = selectedOptions[compId];
          const required = requiredOptId ? selected === requiredOptId : !!selected;
          if (!required) {
            const comp = componentById.get(compId);
            const compName = comp?.name ?? compId;
            errors.push({
              component: compName,
              rule: rule.name,
              message: requiredOptId
                ? `This option is required when another option is selected.`
                : `A selection is required for ${compName}.`,
            });
          }
        }
      }

      if (rule.type === RuleType.VALIDATION && actions.some((a) => a.type === 'WARNING')) {
        const compId = actions[0]?.componentId;
        const comp = compId ? componentById.get(compId) : undefined;
        warnings.push({
          component: comp?.name ?? compId ?? 'configuration',
          message: rule.description ?? 'Validation warning.',
        });
      }

      if (rule.stopProcessing && errors.length > 0) break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Material library: PBR materials by brand, optional category filter.
   */
  async getMaterialLibrary(
    brandId: string,
    options?: MaterialLibraryOptions,
  ): Promise<MaterialLibraryItem[]> {
    await this.prisma.brand.findUniqueOrThrow({
      where: { id: brandId },
      select: { id: true },
    });

    const config = await this.prisma.configurator3DConfiguration.findFirst({
      where: { brandId, deletedAt: null },
      select: { sceneConfig: true, settings: true },
    });

    type SceneMaterial = {
      id: string;
      name: string;
      category?: string;
      previewUrl?: string;
      albedoMap?: string;
      normalMap?: string;
      roughnessMap?: string;
      metalnessMap?: string;
    };

    const raw = (config?.sceneConfig as { materialLibrary?: SceneMaterial[] })?.materialLibrary
      ?? (config?.settings as { materialLibrary?: SceneMaterial[] })?.materialLibrary
      ?? this.getDefaultMaterialLibrary();

    let materials = Array.isArray(raw) ? raw : [];
    if (options?.category) {
      materials = materials.filter(
        (m) => (m.category ?? '').toLowerCase() === options.category!.toLowerCase(),
      );
    }

    return materials.map((m) => ({
      id: m.id ?? `mat-${m.name}`,
      name: m.name ?? 'Unnamed',
      category: m.category ?? 'other',
      previewUrl: m.previewUrl ?? '',
      albedoMap: m.albedoMap ?? null,
      normalMap: m.normalMap ?? null,
      roughnessMap: m.roughnessMap ?? null,
      metalnessMap: m.metalnessMap ?? null,
    }));
  }

  /**
   * Export configured product: image-hd, model-3d, spec-pdf, ar.
   */
  async exportConfiguration(
    configId: string,
    sessionId: string | null,
    format: ExportFormat,
    userId?: string,
  ): Promise<ExportConfigurationResult> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(`Configuration ${configId} not found`);
    }

    const { exportType, queueJobName, estimatedDuration } = this.mapFormatToExport(format);

    const exportRecord = await this.prisma.configurator3DExport.create({
      data: {
        configurationId: configId,
        sessionId,
        userId: userId ?? 'system',
        type: exportType,
        format,
        status: ExportStatus.PENDING,
        options: { format, sessionId } as object,
      },
    });

    const job = await this.exportQueue.add(
      queueJobName,
      {
        exportId: exportRecord.id,
        configurationId: configId,
        sessionId,
        format,
        options: { format },
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`Export job queued: ${job.id} (${format}) for config ${configId}`);

    return {
      exportId: exportRecord.id,
      jobId: (job.id as string) ?? exportRecord.id,
      format,
      estimatedDuration,
    };
  }

  /**
   * Real-time price: base + options + material surcharge - discount.
   */
  async calculateRealtimePrice(
    configId: string,
    selectedOptions: Record<string, string>,
  ): Promise<RealtimePriceResult> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configId },
      select: { pricingSettings: true, enablePricing: true, components: { include: { options: true } } },
    });

    if (!config) {
      throw new NotFoundException(`Configuration ${configId} not found`);
    }

    const settings = (config.pricingSettings as PricingSettings) || {};
    const basePrice = Number(settings.basePrice ?? 0);
    const currency = (settings.currency as string) ?? 'EUR';

    const priceResult = await this.pricingService.calculate(configId, selectedOptions);
    const optionPrices: OptionPriceItem[] = priceResult.breakdown.map((b) => ({
      name: b.optionName,
      price: b.calculatedPrice,
    }));

    const materialSurcharge = Number(settings.materialSurcharge ?? 0);
    const discount =
      priceResult.ruleAdjustments < 0 ? Math.abs(priceResult.ruleAdjustments) : 0;
    const totalPrice = Math.max(
      0,
      priceResult.subtotal + materialSurcharge - discount,
    );

    return {
      basePrice,
      optionPrices,
      materialSurcharge,
      discount,
      totalPrice,
      currency,
    };
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private getDefaultMaterialLibrary(): Array<{
    id: string;
    name: string;
    category: string;
    previewUrl: string;
    albedoMap?: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
  }> {
    const categories = ['wood', 'metal', 'fabric', 'plastic', 'stone'] as const;
    return categories.map((cat, i) => ({
      id: `default-${cat}-${i}`,
      name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} ${i + 1}`,
      category: cat,
      previewUrl: '',
      albedoMap: undefined,
      normalMap: undefined,
      roughnessMap: undefined,
      metalnessMap: undefined,
    }));
  }

  private mapFormatToExport(
    format: ExportFormat,
  ): { exportType: ExportType; queueJobName: string; estimatedDuration: number } {
    switch (format) {
      case 'image-hd':
        return { exportType: ExportType.IMAGE, queueJobName: 'image-hd', estimatedDuration: 45 };
      case 'model-3d':
        return { exportType: ExportType.MODEL_3D, queueJobName: 'model-3d', estimatedDuration: 15 };
      case 'spec-pdf':
        return { exportType: ExportType.PDF, queueJobName: 'spec-pdf', estimatedDuration: 20 };
      case 'ar':
        return { exportType: ExportType.AR_IOS, queueJobName: 'ar', estimatedDuration: 30 };
      default:
        throw new BadRequestException(`Unsupported export format: ${format}`);
    }
  }
}
