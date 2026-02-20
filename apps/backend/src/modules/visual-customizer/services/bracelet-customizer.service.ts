import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

const DEFAULT_MAX_CHARMS = 12;
const DEFAULT_MAX_WEIGHT_G = 50;
const BASE_ENGRAVING_CENTS = 500;

export interface BraceletConfig {
  productId: string;
  wristSizes: { value: number; label: string }[];
  materials: { id: string; name: string; pricePerGramCents: number }[];
  maxCharms: number;
  maxWeightG: number;
  engravingEnabled: boolean;
  charmAttachments: { id: string; name: string; compatibleMaterials: string[] }[];
}

export interface BraceletSelections {
  wristSizeCm?: number;
  materialId?: string;
  charms?: string[];
  engravingText?: string;
  stoneIds?: string[];
}

export interface BraceletPriceResult {
  totalCents: number;
  breakdown: { item: string; cents: number }[];
}

export interface BraceletDesignValidation {
  valid: boolean;
  errors: string[];
}

export interface BraceletPreviewResult {
  previewUrl: string;
  expiresAt?: Date;
}

@Injectable()
export class BraceletCustomizerService {
  private readonly logger = new Logger(BraceletCustomizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns bracelet-specific customizer config (wrist size, material, charms).
   */
  async getBraceletConfig(productId: string): Promise<BraceletConfig> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        customizationOptions: true,
        materialOptions: true,
        modelConfig: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const opts = (product.customizationOptions as Record<string, unknown>) ?? {};
    const materials = (product.materialOptions as Array<{ id: string; name: string; pricePerGramCents?: number }>) ?? [];
    const _modelConfig = (product.modelConfig as Record<string, unknown>) ?? {};

    const wristSizes = (opts.wristSizes as Array<{ value: number; label: string }>) ?? [
      { value: 14, label: '14 cm' },
      { value: 16, label: '16 cm' },
      { value: 18, label: '18 cm' },
      { value: 20, label: '20 cm' },
    ];

    const maxCharms = (opts.maxCharms as number) ?? DEFAULT_MAX_CHARMS;
    const maxWeightG = (opts.maxWeightG as number) ?? DEFAULT_MAX_WEIGHT_G;
    const engravingEnabled = (opts.engravingEnabled as boolean) ?? true;

    const charmAttachments = (opts.charmAttachments as Array<{ id: string; name: string; compatibleMaterials?: string[] }>) ?? [];

    const materialsNormalized = materials.map((m) => ({
      id: m.id ?? m.name,
      name: typeof m.name === 'string' ? m.name : 'Material',
      pricePerGramCents: (m as { pricePerGramCents?: number }).pricePerGramCents ?? 20,
    }));

    return {
      productId: product.id,
      wristSizes,
      materials: materialsNormalized,
      maxCharms,
      maxWeightG,
      engravingEnabled,
      charmAttachments: charmAttachments.map((c) => ({
        id: c.id ?? c.name,
        name: c.name,
        compatibleMaterials: c.compatibleMaterials ?? [],
      })),
    };
  }

  /**
   * Price calculation specific to jewelry (metal weight, stones, engraving).
   */
  calculateBraceletPrice(
    config: BraceletConfig,
    selections: BraceletSelections,
  ): BraceletPriceResult {
    const breakdown: { item: string; cents: number }[] = [];
    let totalCents = 0;

    const material = config.materials.find((m) => m.id === selections.materialId);
    if (material) {
      const weightG = (selections.wristSizeCm ?? 16) * 0.5;
      const materialCents = Math.round(weightG * material.pricePerGramCents);
      breakdown.push({ item: `Material (${material.name})`, cents: materialCents });
      totalCents += materialCents;
    }

    const charmCount = selections.charms?.length ?? 0;
    if (charmCount > 0) {
      const charmCents = charmCount * 300;
      breakdown.push({ item: `Charms (${charmCount})`, cents: charmCents });
      totalCents += charmCents;
    }

    const stoneCount = selections.stoneIds?.length ?? 0;
    if (stoneCount > 0) {
      const stoneCents = stoneCount * 200;
      breakdown.push({ item: `Stones (${stoneCount})`, cents: stoneCents });
      totalCents += stoneCents;
    }

    if (selections.engravingText?.trim()) {
      breakdown.push({ item: 'Engraving', cents: BASE_ENGRAVING_CENTS });
      totalCents += BASE_ENGRAVING_CENTS;
    }

    return { totalCents, breakdown };
  }

  /**
   * Validates bracelet design (max charms, compatible attachments, weight limit).
   */
  validateBraceletDesign(designData: Record<string, unknown>): BraceletDesignValidation {
    const errors: string[] = [];

    const charms = designData.charms as string[] | undefined;
    const maxCharms = (designData.maxCharms as number) ?? DEFAULT_MAX_CHARMS;
    if (Array.isArray(charms) && charms.length > maxCharms) {
      errors.push(`Maximum ${maxCharms} charms allowed`);
    }

    const weightG = (designData.weightG as number) ?? 0;
    const maxWeightG = (designData.maxWeightG as number) ?? DEFAULT_MAX_WEIGHT_G;
    if (weightG > maxWeightG) {
      errors.push(`Weight must not exceed ${maxWeightG}g`);
    }

    const materialId = designData.materialId as string | undefined;
    const charmAttachments = (designData.charmAttachments as Array<{ compatibleMaterials?: string[] }>) ?? [];
    if (materialId && charmAttachments.length > 0) {
      const incompatible = charmAttachments.filter(
        (c) => c.compatibleMaterials?.length && !c.compatibleMaterials.includes(materialId),
      );
      if (incompatible.length > 0) {
        errors.push('Some charms are not compatible with the selected material');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates 360-degree bracelet preview (returns placeholder URL; integrate with render pipeline as needed).
   */
  async generateBraceletPreview(designData: Record<string, unknown>): Promise<BraceletPreviewResult> {
    const productId = designData.productId as string | undefined;
    if (!productId) {
      throw new BadRequestException('productId is required for preview');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, baseImageUrl: true, model3dUrl: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const validation = this.validateBraceletDesign(designData);
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const previewUrl =
      (product.model3dUrl as string) ||
      (product.baseImageUrl as string) ||
      `https://placeholder.luneo.app/bracelet-preview?productId=${productId}`;

    this.logger.debug(`Bracelet preview generated for product ${productId}`);

    return {
      previewUrl,
      expiresAt,
    };
  }
}
