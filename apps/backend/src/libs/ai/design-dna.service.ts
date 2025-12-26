import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createHash } from 'crypto';

export interface DesignDNAData {
  designId: string;
  story?: string;
  tags?: string[];
  parameters?: any; // Paramètres retenus (ce qui a été cliqué)
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
  async saveDNA(data: DesignDNAData): Promise<any> {
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
            parameters: data.parameters || {},
            conversionData: data.conversionData || {},
            productionData: data.productionData || {},
          },
        });
      } else {
        // Créer
        return this.prisma.designDNA.create({
          data: {
            designId: data.designId,
            story: data.story,
            tags: data.tags || [],
            parameters: data.parameters || {},
            conversionData: data.conversionData || {},
            productionData: data.productionData || {},
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
  async getDNA(designId: string): Promise<any | null> {
    return this.prisma.designDNA.findUnique({
      where: { designId },
    });
  }

  /**
   * Recherche des designs similaires par tags/paramètres
   */
  async findSimilarDesigns(designId: string, limit: number = 10): Promise<any[]> {
    const dna = await this.getDNA(designId);
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
   * Analyse les paramètres qui convertissent le mieux
   */
  async analyzeConversionPatterns(brandId?: string): Promise<{
    topParameters: Array<{ parameter: string; conversionRate: number }>;
    topTags: Array<{ tag: string; conversionRate: number }>;
  }> {
    // TODO: Implémenter analyse des patterns de conversion
    // Pour l'instant, retourner des données vides
    return {
      topParameters: [],
      topTags: [],
    };
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





















