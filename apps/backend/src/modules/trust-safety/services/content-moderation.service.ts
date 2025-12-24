import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';

export interface ModerationResult {
  approved: boolean;
  confidence: number;
  categories: string[];
  reason?: string;
  action: 'allow' | 'review' | 'block';
}

export interface ModerationRequest {
  type: 'text' | 'image' | 'ai_generation';
  content: string; // Text or image URL
  context?: {
    userId?: string;
    brandId?: string;
    designId?: string;
  };
}

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private openaiInstance: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Lazy load OpenAI
   */
  private async getOpenAI(): Promise<OpenAI> {
    if (!this.openaiInstance) {
      const openaiModule = await import('openai');
      this.openaiInstance = new openaiModule.default({
        apiKey: this.configService.get<string>('ai.openaiApiKey'),
      });
    }
    return this.openaiInstance;
  }

  /**
   * Modère du contenu
   */
  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    this.logger.log(`Moderating ${request.type} content`);

    try {
      let result: ModerationResult;

      switch (request.type) {
        case 'text':
          result = await this.moderateText(request.content, request.context);
          break;
        case 'image':
          result = await this.moderateImage(request.content, request.context);
          break;
        case 'ai_generation':
          result = await this.moderateAIGeneration(request.content, request.context);
          break;
        default:
          throw new Error(`Unsupported moderation type: ${request.type}`);
      }

      // Sauvegarder le résultat
      await this.saveModerationResult(request, result);

      return result;
    } catch (error) {
      this.logger.error(`Moderation failed:`, error);
      // En cas d'erreur, bloquer par sécurité
      return {
        approved: false,
        confidence: 0.5,
        categories: ['error'],
        reason: error.message,
        action: 'block',
      };
    }
  }

  /**
   * Modère du texte
   */
  private async moderateText(
    text: string,
    context?: ModerationRequest['context'],
  ): Promise<ModerationResult> {
    const openai = await this.getOpenAI();

    // Modération OpenAI
    const moderation = await openai.moderations.create({
      input: text,
    });

    const result = moderation.results[0];
    const flagged = result.flagged;

    // Vérifier blacklist brand
    if (context?.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: context.brandId },
        select: { settings: true },
      });

      const blacklist = (brand?.settings as any)?.blacklist || [];
      const hasBlacklistedWords = blacklist.some((word: string) =>
        text.toLowerCase().includes(word.toLowerCase()),
      );

      if (hasBlacklistedWords) {
        return {
          approved: false,
          confidence: 1.0,
          categories: ['blacklist'],
          reason: 'Contains blacklisted words',
          action: 'block',
        };
      }
    }

    // Déterminer l'action
    let action: 'allow' | 'review' | 'block' = 'allow';
    if (flagged) {
      const categories = Object.entries(result.categories)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      // Catégories critiques = block, autres = review
      const criticalCategories = ['hate', 'harassment', 'self-harm', 'sexual', 'violence'];
      action = categories.some((cat) => criticalCategories.includes(cat)) ? 'block' : 'review';
    }

    return {
      approved: !flagged,
      confidence: result.category_scores ? Math.max(...Object.values(result.category_scores as unknown as Record<string, number>)) : 0.5,
      categories: Object.entries(result.categories)
        .filter(([_, value]) => value)
        .map(([key]) => key),
      reason: flagged ? 'Content flagged by moderation API' : undefined,
      action,
    };
  }

  /**
   * Modère une image
   */
  private async moderateImage(
    imageUrl: string,
    context?: ModerationRequest['context'],
  ): Promise<ModerationResult> {
    // TODO: Utiliser Vision API pour modération image
    // Pour l'instant, approuver par défaut
    return {
      approved: true,
      confidence: 0.8,
      categories: [],
      action: 'allow',
    };
  }

  /**
   * Modère une génération IA
   */
  private async moderateAIGeneration(
    imageUrl: string,
    context?: ModerationRequest['context'],
  ): Promise<ModerationResult> {
    // Modérer l'image générée
    return this.moderateImage(imageUrl, context);
  }

  /**
   * Sauvegarde le résultat de modération
   */
  private async saveModerationResult(
    request: ModerationRequest,
    result: ModerationResult,
  ): Promise<void> {
    // TODO: Créer table ModerationRecord dans Prisma
    // Pour l'instant, log seulement
    if (!result.approved) {
      this.logger.warn(`Content moderation blocked:`, {
        type: request.type,
        action: result.action,
        categories: result.categories,
        context: request.context,
      });
    }
  }

  /**
   * Récupère l'historique de modération
   */
  async getModerationHistory(
    userId?: string,
    brandId?: string,
    limit: number = 100,
  ): Promise<any[]> {
    // TODO: Récupérer depuis table ModerationRecord
    return [];
  }
}




















