// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface DesignDNAData {
  designId: string;
  story?: string;
  tags?: string[];
  parameters?: Record<string, unknown>; // Paramètres retenus (ce qui a été cliqué)
  conversionData?: {
    clicks?: number;
    timeSpent?: number;
    variantsViewed?: number;
    selectedVariant?: string;
  };
  productionData?: {
    qcScore?: number;
    defects?: string[];
    returnRate?: number;
  };
}

@Injectable()
export class DesignDNAService {
  private readonly logger = new Logger(DesignDNAService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée ou met à jour le Design DNA
   */
  async saveDNA(data: DesignDNAData): Promise<unknown> {
    try {
      const existing = await this.prisma.designDNA.findUnique({
        where: { designId: data.designId },
      });

      if (existing) {
        // Mettre à jour
        return this.prisma.designDNA.update({
          where: { designId: data.designId },
          data: {
            story: data.story,
            tags: data.tags || [],
            parameters: (data.parameters || {}) as Prisma.InputJsonValue,
            conversionData: (data.conversionData || {}) as Prisma.InputJsonValue,
            productionData: (data.productionData || {}) as Prisma.InputJsonValue,
          },
        });
      } else {
        // Créer
        return this.prisma.designDNA.create({
          data: {
            designId: data.designId,
            story: data.story,
            tags: data.tags || [],
            parameters: (data.parameters || {}) as Prisma.InputJsonValue,
            conversionData: (data.conversionData || {}) as Prisma.InputJsonValue,
            productionData: (data.productionData || {}) as Prisma.InputJsonValue,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to save Design DNA for ${data.designId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère le Design DNA
   */
  async getDNA(designId: string): Promise<unknown> {
    return this.prisma.designDNA.findUnique({
      where: { designId },
    });
  }

  /**
   * Recherche des designs similaires par tags/paramètres
   */
  async findSimilarDesigns(designId: string, limit: number = 10): Promise<unknown[]> {
    const dna = await this.getDNA(designId) as { tags?: string[] } | null;
    if (!dna) {
      return [];
    }

    // Recherche par tags
    const similar = await this.prisma.designDNA.findMany({
      where: {
        designId: { not: designId },
        tags: {
          hasSome: dna.tags || [],
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return similar;
  }

  /**
   * Analyse les paramètres qui convertissent le mieux à partir des conversions
   */
  async analyzeConversionPatterns(_brandId?: string): Promise<{
    topParameters: Array<{ parameter: string; conversionRate: number }>;
    topTags: Array<{ tag: string; conversionRate: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const conversions = await this.prisma.conversion.findMany({
      where: { timestamp: { gte: startDate } },
      select: { eventType: true, attribution: true },
    });

    const byEvent = new Map<string, number>();
    const byTag = new Map<string, number>();
    for (const c of conversions) {
      byEvent.set(c.eventType, (byEvent.get(c.eventType) ?? 0) + 1);
      const att = c.attribution as Record<string, unknown> | null;
      if (att?.tags && Array.isArray(att.tags)) {
        for (const t of att.tags as string[]) {
          byTag.set(t, (byTag.get(t) ?? 0) + 1);
        }
      }
      if (att?.parameter && typeof att.parameter === 'string') {
        byEvent.set(`param:${att.parameter}`, (byEvent.get(`param:${att.parameter}`) ?? 0) + 1);
      }
    }

    const total = conversions.length;
    const rate = (n: number) => (total > 0 ? n / total : 0);

    const topParameters = Array.from(byEvent.entries())
      .filter(([k]) => k.startsWith('param:'))
      .map(([parameter, count]) => ({ parameter: parameter.replace('param:', ''), conversionRate: rate(count) }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 10);

    const topTags = Array.from(byTag.entries())
      .map(([tag, count]) => ({ tag, conversionRate: rate(count) }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 10);

    return { topParameters, topTags };
  }

  /**
   * Génère des tags à partir d'une story
   */
  generateTagsFromStory(story: string): string[] {
    const tags: string[] = [];
    const storyLower = story.toLowerCase();

    // Tags par occasion
    const occasions = ['birth', 'engagement', 'wedding', 'anniversary', 'mourning', 'friendship'];
    for (const occasion of occasions) {
      if (storyLower.includes(occasion)) {
        tags.push(occasion);
      }
    }

    // Tags par style
    const styles = ['minimal', 'baroque', 'art-deco', 'modern', 'vintage', 'classic'];
    for (const style of styles) {
      if (storyLower.includes(style)) {
        tags.push(style);
      }
    }

    // Tags par matériau
    const materials = ['gold', 'silver', 'platinum', 'rose-gold', 'diamond', 'pearl'];
    for (const material of materials) {
      if (storyLower.includes(material)) {
        tags.push(material);
      }
    }

    return tags;
  }
}

































