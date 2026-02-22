// @ts-nocheck
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type BrandGuidelinesCreateInput = {
  brandId: string;
  organizationId?: string;
  colorPalette?: unknown;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  styleKeywords?: string[];
  negativeKeywords?: string[];
  referenceImages?: string[];
  consistencySeed?: number;
  logoUrl?: string;
  brandVoice?: string;
  industry?: string;
  targetAudience?: string;
  promptPrefix?: string;
  promptSuffix?: string;
  isActive?: boolean;
};

export type BrandGuidelinesUpdateInput = Partial<Omit<BrandGuidelinesCreateInput, 'brandId'>>;

@Injectable()
export class BrandGuidelinesService {
  private readonly logger = new Logger(BrandGuidelinesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: BrandGuidelinesCreateInput) {
    const created = await this.prisma.brandGuidelines.create({
      data: {
        brandId: data.brandId,
        organizationId: data.organizationId,
        colorPalette: (data.colorPalette ?? []) as unknown as InputJsonValue,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        fontFamily: data.fontFamily,
        styleKeywords: data.styleKeywords ?? [],
        negativeKeywords: data.negativeKeywords ?? [],
        referenceImages: data.referenceImages ?? [],
        consistencySeed: data.consistencySeed,
        logoUrl: data.logoUrl,
        brandVoice: data.brandVoice,
        industry: data.industry,
        targetAudience: data.targetAudience,
        promptPrefix: data.promptPrefix,
        promptSuffix: data.promptSuffix,
        isActive: data.isActive ?? true,
      },
    });
    this.logger.log(`Brand guidelines created for brand ${data.brandId}`);
    return created;
  }

  async update(brandId: string, data: BrandGuidelinesUpdateInput) {
    const existing = await this.prisma.brandGuidelines.findUnique({ where: { brandId } });
    if (!existing) throw new NotFoundException('Brand guidelines not found');
    const updated = await this.prisma.brandGuidelines.update({
      where: { brandId },
      data: {
        ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
        ...(data.colorPalette !== undefined && { colorPalette: data.colorPalette as unknown as InputJsonValue }),
        ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
        ...(data.secondaryColor !== undefined && { secondaryColor: data.secondaryColor }),
        ...(data.fontFamily !== undefined && { fontFamily: data.fontFamily }),
        ...(data.styleKeywords !== undefined && { styleKeywords: data.styleKeywords }),
        ...(data.negativeKeywords !== undefined && { negativeKeywords: data.negativeKeywords }),
        ...(data.referenceImages !== undefined && { referenceImages: data.referenceImages }),
        ...(data.consistencySeed !== undefined && { consistencySeed: data.consistencySeed }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.brandVoice !== undefined && { brandVoice: data.brandVoice }),
        ...(data.industry !== undefined && { industry: data.industry }),
        ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience }),
        ...(data.promptPrefix !== undefined && { promptPrefix: data.promptPrefix }),
        ...(data.promptSuffix !== undefined && { promptSuffix: data.promptSuffix }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    this.logger.log(`Brand guidelines updated for brand ${brandId}`);
    return updated;
  }

  async getByBrand(brandId: string) {
    const guidelines = await this.prisma.brandGuidelines.findUnique({
      where: { brandId, isActive: true },
    });
    if (!guidelines) throw new NotFoundException('Brand guidelines not found');
    return guidelines;
  }

  async getByBrandOrNull(brandId: string) {
    return this.prisma.brandGuidelines.findUnique({
      where: { brandId, isActive: true },
    });
  }

  async delete(brandId: string) {
    const existing = await this.prisma.brandGuidelines.findUnique({ where: { brandId } });
    if (!existing) throw new NotFoundException('Brand guidelines not found');
    await this.prisma.brandGuidelines.delete({ where: { brandId } });
    this.logger.log(`Brand guidelines deleted for brand ${brandId}`);
    return { deleted: true };
  }
}
