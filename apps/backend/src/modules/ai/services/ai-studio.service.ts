/**
 * ★★★ SERVICE - AI STUDIO ★★★
 * Service pour AI Studio (générations, modèles, prompts, collections, versioning)
 * Respecte les patterns existants du projet
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BudgetService } from '@/libs/budgets/budget.service';
import {
  AIGeneration,
  AIGenerationType,
  AIGenerationStatus,
  AIGenerationParams,
  AIModel,
  ModelComparison,
  PromptTemplate,
  PromptSuggestion,
  PromptOptimization,
  AICollection,
  AIVersion,
  AIGenerationAnalytics,
  AIModelPerformance,
} from '../interfaces/ai-studio.interface';

@Injectable()
export class AIStudioService {
  private readonly logger = new Logger(AIStudioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetService: BudgetService,
  ) {}

  // ========================================
  // GÉNÉRATIONS
  // ========================================

  /**
   * Génère une création IA (2D, 3D, animation, template)
   */
  async generate(
    userId: string,
    brandId: string,
    type: AIGenerationType,
    prompt: string,
    model: string,
    parameters: AIGenerationParams,
  ): Promise<AIGeneration> {
    try {
      this.logger.log(`Generating ${type} for user: ${userId}, brand: ${brandId}`);

      // Vérifier le budget
      const estimatedCost = await this.estimateCost(prompt, parameters, model);
      const hasBudget = await this.budgetService.checkBudget(brandId, estimatedCost);
      if (!hasBudget) {
        throw new BadRequestException('Budget insuffisant pour cette génération');
      }

      // Vérifier le quota utilisateur
      const hasQuota = await this.checkUserQuota(userId, estimatedCost);
      if (!hasQuota) {
        throw new BadRequestException('Quota utilisateur insuffisant');
      }

      // TODO: Appeler le vrai service de génération IA
      // Pour l'instant, retourne une génération mockée
      const generation: AIGeneration = {
        id: `ai-gen-${Date.now()}`,
        type,
        prompt,
        negativePrompt: parameters.negativePrompt,
        model,
        provider: this.getProviderFromModel(model),
        parameters,
        status: AIGenerationStatus.PROCESSING,
        credits: this.calculateCredits(type, model, parameters),
        costCents: estimatedCost,
        userId,
        brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Lancer la génération en background job
      // Pour l'instant, simule un résultat immédiat
      setTimeout(async () => {
        generation.status = AIGenerationStatus.COMPLETED;
        generation.resultUrl = `https://storage.example.com/generations/${generation.id}.png`;
        generation.thumbnailUrl = `https://storage.example.com/generations/${generation.id}_thumb.png`;
        generation.completedAt = new Date();
        generation.duration = Math.floor(Math.random() * 10) + 3; // 3-12 secondes
        generation.quality = 85 + Math.random() * 15; // 85-100

        // Mettre à jour le quota et le budget
        await this.updateUserQuota(userId, estimatedCost);
        await this.recordAICost(brandId, generation.provider, model, estimatedCost, {
          tokens: null,
          duration: generation.duration,
        });
      }, 1000);

      return generation;
    } catch (error) {
      this.logger.error(`Failed to generate: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les générations d'un utilisateur
   */
  async getGenerations(
    userId: string,
    brandId: string,
    filters?: {
      type?: AIGenerationType;
      status?: AIGenerationStatus;
      model?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ generations: AIGeneration[]; total: number }> {
    try {
      this.logger.log(`Getting generations for user: ${userId}, brand: ${brandId}`);

      // TODO: Implémenter avec Prisma
      const mockGenerations: AIGeneration[] = [
        {
          id: 'gen-1',
          type: AIGenerationType.IMAGE_2D,
          prompt: 'Professional portrait, studio lighting, high quality, 8k',
          model: 'stable-diffusion-xl',
          provider: 'stability',
          parameters: { steps: 50, guidance: 7.5, quality: 'high' },
          status: AIGenerationStatus.COMPLETED,
          resultUrl: 'https://storage.example.com/generations/gen-1.png',
          thumbnailUrl: 'https://storage.example.com/generations/gen-1_thumb.png',
          credits: 2,
          costCents: 8,
          duration: 4,
          quality: 96,
          userId,
          brandId,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 4000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ];

      return {
        generations: mockGenerations,
        total: mockGenerations.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get generations: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // MODÈLES IA
  // ========================================

  /**
   * Récupère tous les modèles IA disponibles
   */
  async getModels(type?: AIGenerationType): Promise<AIModel[]> {
    try {
      this.logger.log(`Getting AI models${type ? ` for type: ${type}` : ''}`);

      // TODO: Implémenter avec vraie base de données ou config
      const mockModels: AIModel[] = [
        {
          id: 'model-1',
          name: 'Stable Diffusion XL',
          provider: 'stability',
          type: AIGenerationType.IMAGE_2D,
          costPerGeneration: 0.08,
          avgTime: 3.2,
          quality: 94.5,
          isActive: true,
          metadata: { resolution: '1024x1024', maxSteps: 50 },
        },
        {
          id: 'model-2',
          name: 'DALL-E 3',
          provider: 'openai',
          type: AIGenerationType.IMAGE_2D,
          costPerGeneration: 0.12,
          avgTime: 4.5,
          quality: 96.8,
          isActive: true,
          metadata: { resolution: '1024x1024', maxSteps: 50 },
        },
        {
          id: 'model-3',
          name: 'Midjourney v6',
          provider: 'midjourney',
          type: AIGenerationType.IMAGE_2D,
          costPerGeneration: 0.15,
          avgTime: 5.8,
          quality: 98.2,
          isActive: true,
          metadata: { resolution: '2048x2048', maxSteps: 50 },
        },
      ];

      return type ? mockModels.filter(m => m.type === type) : mockModels;
    } catch (error) {
      this.logger.error(`Failed to get models: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Compare deux modèles IA
   */
  async compareModels(model1: string, model2: string, metric: string): Promise<ModelComparison> {
    try {
      this.logger.log(`Comparing models: ${model1} vs ${model2} on metric: ${metric}`);

      // TODO: Implémenter avec vraies données
      const comparison: ModelComparison = {
        model1,
        model2,
        metric,
        winner: model2,
        insight: `${model2} meilleure qualité mais plus coûteux`,
        data: {
          model1: { value: 94.5, cost: 0.08, time: 3.2 },
          model2: { value: 96.8, cost: 0.12, time: 4.5 },
        },
      };

      return comparison;
    } catch (error) {
      this.logger.error(`Failed to compare models: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // PROMPTS
  // ========================================

  /**
   * Optimise un prompt automatiquement
   */
  async optimizePrompt(prompt: string): Promise<PromptOptimization> {
    try {
      this.logger.log(`Optimizing prompt`);

      // TODO: Implémenter avec ML/NLP
      const optimization: PromptOptimization = {
        original: prompt,
        optimized: `${prompt}, high quality, 8k resolution, natural colors`,
        improvement: '+18.5% qualité',
        before: 78,
        after: 96,
      };

      return optimization;
    } catch (error) {
      this.logger.error(`Failed to optimize prompt: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère des suggestions de prompts
   */
  async getPromptSuggestions(input: string): Promise<PromptSuggestion[]> {
    try {
      this.logger.log(`Getting prompt suggestions for: ${input}`);

      // TODO: Implémenter avec ML
      return [
        {
          input,
          suggestions: ['studio lighting', 'high quality', '8k resolution', 'natural colors'],
          confidence: 92.5,
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to get prompt suggestions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les templates de prompts
   */
  async getPromptTemplates(category?: string, userId?: string, brandId?: string): Promise<PromptTemplate[]> {
    try {
      this.logger.log(`Getting prompt templates${category ? ` for category: ${category}` : ''}`);

      // Récupérer depuis Prisma (table PromptTemplate)
      const templates = await this.prisma.promptTemplate.findMany({
        where: {
          isActive: true,
          ...(category && { style: category }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return templates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.style || 'general',
        prompt: t.prompt,
        variables: (t.variables as any) || {},
        successRate: 0, // TODO: Calculer depuis les générations
        usageCount: 0, // TODO: Compter depuis les générations
        createdAt: t.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to get prompt templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // TEMPLATES (AI Templates Library)
  // ========================================

  /**
   * Récupère les templates AI (depuis AIGeneration avec type TEMPLATE)
   */
  async getTemplates(
    brandId: string,
    filters: { category?: string; search?: string; page: number; limit: number; offset: number },
  ) {
    try {
      this.logger.log(`Getting AI templates for brand: ${brandId}`);

      const where: any = {
        brandId,
        type: 'TEMPLATE',
      };

      if (filters.category && filters.category !== 'all') {
        // Utiliser les paramètres JSON pour filtrer par catégorie
        where.parameters = {
          path: ['category'],
          equals: filters.category,
        };
      }

      const [templates, total] = await Promise.all([
        this.prisma.aIGeneration.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: filters.offset,
          take: filters.limit,
        }),
        this.prisma.aIGeneration.count({ where }),
      ]);

      // Transformer les résultats
      const result = templates.map(t => {
        const params = (t.parameters as any) || {};
        return {
          id: t.id,
          name: params.name || 'Untitled Template',
          category: params.category || 'general',
          subcategory: params.subcategory,
          prompt: t.prompt,
          style: params.style,
          thumbnailUrl: t.thumbnailUrl || '',
          previewUrl: t.resultUrl,
          price: params.price || 0,
          isPremium: params.isPremium || false,
          downloads: 0, // TODO: Compter depuis les téléchargements
          views: 0, // TODO: Compter depuis les vues
          rating: 0, // TODO: Calculer depuis les ratings
          tags: params.tags || [],
          createdAt: t.createdAt,
        };
      });

      return {
        templates: result,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.offset + filters.limit < total,
          hasPrev: filters.page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère un template spécifique
   */
  async getTemplate(id: string, brandId: string) {
    try {
      this.logger.log(`Getting template: ${id}`);

      const template = await this.prisma.aIGeneration.findFirst({
        where: {
          id,
          brandId,
          type: 'TEMPLATE',
        },
      });

      if (!template) {
        throw new Error(`Template ${id} not found`);
      }

      const params = (template.parameters as any) || {};
      return {
        id: template.id,
        name: params.name || 'Untitled Template',
        category: params.category || 'general',
        subcategory: params.subcategory,
        prompt: template.prompt,
        style: params.style,
        thumbnailUrl: template.thumbnailUrl || '',
        previewUrl: template.resultUrl,
        price: params.price || 0,
        isPremium: params.isPremium || false,
        downloads: 0,
        views: 0,
        rating: 0,
        tags: params.tags || [],
        createdAt: template.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Crée un nouveau template
   */
  async createTemplate(brandId: string, userId: string, dto: any) {
    try {
      this.logger.log(`Creating template for brand: ${brandId}`);

      const template = await this.prisma.aIGeneration.create({
        data: {
          type: 'TEMPLATE',
          prompt: dto.prompt,
          model: 'template-generator',
          provider: 'luneo',
          parameters: {
            name: dto.name,
            category: dto.category,
            subcategory: dto.subcategory,
            style: dto.style,
            price: dto.price || 0,
            isPremium: dto.isPremium || false,
            tags: dto.tags || [],
          },
          status: 'COMPLETED',
          thumbnailUrl: dto.thumbnailUrl,
          resultUrl: dto.previewUrl,
          credits: 0,
          costCents: 0,
          userId,
          brandId,
        },
      });

      const params = (template.parameters as any) || {};
      return {
        id: template.id,
        name: params.name,
        category: params.category,
        subcategory: params.subcategory,
        prompt: template.prompt,
        style: params.style,
        thumbnailUrl: template.thumbnailUrl || '',
        previewUrl: template.resultUrl,
        price: params.price || 0,
        isPremium: params.isPremium || false,
        downloads: 0,
        views: 0,
        rating: 0,
        tags: params.tags || [],
        createdAt: template.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Met à jour un template
   */
  async updateTemplate(id: string, brandId: string, dto: any) {
    try {
      this.logger.log(`Updating template: ${id}`);

      const existing = await this.prisma.aIGeneration.findFirst({
        where: { id, brandId, type: 'TEMPLATE' },
      });

      if (!existing) {
        throw new Error(`Template ${id} not found`);
      }

      const existingParams = (existing.parameters as any) || {};
      const updatedParams = {
        ...existingParams,
        ...(dto.name && { name: dto.name }),
        ...(dto.category && { category: dto.category }),
        ...(dto.subcategory !== undefined && { subcategory: dto.subcategory }),
        ...(dto.style !== undefined && { style: dto.style }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isPremium !== undefined && { isPremium: dto.isPremium }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      };

      const template = await this.prisma.aIGeneration.update({
        where: { id },
        data: {
          ...(dto.prompt && { prompt: dto.prompt }),
          ...(dto.thumbnailUrl && { thumbnailUrl: dto.thumbnailUrl }),
          ...(dto.previewUrl && { resultUrl: dto.previewUrl }),
          parameters: updatedParams,
        },
      });

      const params = (template.parameters as any) || {};
      return {
        id: template.id,
        name: params.name,
        category: params.category,
        subcategory: params.subcategory,
        prompt: template.prompt,
        style: params.style,
        thumbnailUrl: template.thumbnailUrl || '',
        previewUrl: template.resultUrl,
        price: params.price || 0,
        isPremium: params.isPremium || false,
        downloads: 0,
        views: 0,
        rating: 0,
        tags: params.tags || [],
        createdAt: template.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Supprime un template
   */
  async deleteTemplate(id: string, brandId: string) {
    try {
      this.logger.log(`Deleting template: ${id}`);

      const template = await this.prisma.aIGeneration.findFirst({
        where: { id, brandId, type: 'TEMPLATE' },
      });

      if (!template) {
        throw new Error(`Template ${id} not found`);
      }

      await this.prisma.aIGeneration.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete template: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // ANIMATIONS
  // ========================================

  /**
   * Récupère les animations (depuis AIGeneration avec type ANIMATION)
   */
  async getAnimations(
    brandId: string,
    userId: string,
    filters: { status?: string; page: number; limit: number; offset: number },
  ) {
    try {
      this.logger.log(`Getting animations for brand: ${brandId}, user: ${userId}`);

      const where: any = {
        brandId,
        userId,
        type: 'ANIMATION',
      };

      if (filters.status && filters.status !== 'all') {
        where.status = filters.status.toUpperCase();
      }

      const [animations, total] = await Promise.all([
        this.prisma.aIGeneration.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: filters.offset,
          take: filters.limit,
        }),
        this.prisma.aIGeneration.count({ where }),
      ]);

      const result = animations.map(a => {
        const params = (a.parameters as any) || {};
        return {
          id: a.id,
          prompt: a.prompt,
          status: a.status.toLowerCase(),
          result: a.resultUrl,
          thumbnail: a.thumbnailUrl,
          duration: params.duration || 5,
          fps: params.fps || 30,
          resolution: params.resolution || '1080p',
          credits: a.credits,
          createdAt: a.createdAt,
        };
      });

      return {
        animations: result,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.offset + filters.limit < total,
          hasPrev: filters.page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get animations: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère une animation spécifique
   */
  async getAnimation(id: string, brandId: string, userId: string) {
    try {
      this.logger.log(`Getting animation: ${id}`);

      const animation = await this.prisma.aIGeneration.findFirst({
        where: {
          id,
          brandId,
          userId,
          type: 'ANIMATION',
        },
      });

      if (!animation) {
        throw new Error(`Animation ${id} not found`);
      }

      const params = (animation.parameters as any) || {};
      return {
        id: animation.id,
        prompt: animation.prompt,
        status: animation.status.toLowerCase(),
        result: animation.resultUrl,
        thumbnail: animation.thumbnailUrl,
        duration: params.duration || 5,
        fps: params.fps || 30,
        resolution: params.resolution || '1080p',
        credits: animation.credits,
        createdAt: animation.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get animation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Génère une nouvelle animation
   */
  async generateAnimation(brandId: string, userId: string, dto: any) {
    try {
      this.logger.log(`Generating animation for brand: ${brandId}, user: ${userId}`);

      // Vérifier le budget
      const estimatedCost = (dto.duration || 5) * 10; // 10 crédits par seconde
      const hasBudget = await this.budgetService.checkBudget(brandId, estimatedCost);
      if (!hasBudget) {
        throw new Error('Budget insuffisant pour cette génération');
      }

      // Créer la génération
      const animation = await this.prisma.aIGeneration.create({
        data: {
          type: 'ANIMATION',
          prompt: dto.prompt,
          model: 'animation-generator',
          provider: 'luneo',
          parameters: {
            style: dto.style,
            duration: dto.duration || 5,
            fps: dto.fps || 30,
            resolution: dto.resolution || '1080p',
          },
          status: 'PROCESSING',
          credits: estimatedCost,
          costCents: estimatedCost * 10, // 10 centimes par crédit
          userId,
          brandId,
        },
      });

      // TODO: Lancer la génération en background job
      // Pour l'instant, simuler un résultat après un délai
      setTimeout(async () => {
        await this.prisma.aIGeneration.update({
          where: { id: animation.id },
          data: {
            status: 'COMPLETED',
            resultUrl: `https://storage.example.com/animations/${animation.id}.mp4`,
            thumbnailUrl: `https://storage.example.com/animations/${animation.id}_thumb.jpg`,
            completedAt: new Date(),
            duration: dto.duration || 5,
          },
        });
      }, 5000);

      const params = (animation.parameters as any) || {};
      return {
        id: animation.id,
        prompt: animation.prompt,
        status: animation.status.toLowerCase(),
        result: animation.resultUrl,
        thumbnail: animation.thumbnailUrl,
        duration: params.duration || 5,
        fps: params.fps || 30,
        resolution: params.resolution || '1080p',
        credits: animation.credits,
        createdAt: animation.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to generate animation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Supprime une animation
   */
  async deleteAnimation(id: string, brandId: string, userId: string) {
    try {
      this.logger.log(`Deleting animation: ${id}`);

      const animation = await this.prisma.aIGeneration.findFirst({
        where: { id, brandId, userId, type: 'ANIMATION' },
      });

      if (!animation) {
        throw new Error(`Animation ${id} not found`);
      }

      await this.prisma.aIGeneration.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete animation: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // COLLECTIONS
  // ========================================

  /**
   * Récupère les collections d'un utilisateur
   */
  async getCollections(userId: string, brandId: string): Promise<AICollection[]> {
    try {
      this.logger.log(`Getting collections for user: ${userId}, brand: ${brandId}`);

      // TODO: Implémenter avec Prisma
      const mockCollections: AICollection[] = [
        {
          id: 'collection-1',
          name: 'Collection Design Q1',
          description: 'Designs créés au Q1',
          isShared: true,
          userId,
          brandId,
          generationCount: 24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return mockCollections;
    } catch (error) {
      this.logger.error(`Failed to get collections: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Crée une nouvelle collection
   */
  async createCollection(
    userId: string,
    brandId: string,
    data: Omit<AICollection, 'id' | 'userId' | 'brandId' | 'generationCount' | 'createdAt' | 'updatedAt'>,
  ): Promise<AICollection> {
    try {
      this.logger.log(`Creating collection for user: ${userId}, brand: ${brandId}`);

      // TODO: Implémenter avec Prisma
      const newCollection: AICollection = {
        id: `collection-${Date.now()}`,
        ...data,
        userId,
        brandId,
        generationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newCollection;
    } catch (error) {
      this.logger.error(`Failed to create collection: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // VERSIONING
  // ========================================

  /**
   * Récupère les versions d'une génération
   */
  async getVersions(generationId: string): Promise<AIVersion[]> {
    try {
      this.logger.log(`Getting versions for generation: ${generationId}`);

      // TODO: Implémenter avec Prisma
      const mockVersions: AIVersion[] = [
        {
          id: 'version-1',
          generationId,
          version: 1,
          prompt: 'Professional portrait, studio lighting',
          parameters: { steps: 50, guidance: 7.5 },
          resultUrl: 'https://storage.example.com/versions/v1.png',
          quality: 85,
          credits: 2,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'version-2',
          generationId,
          version: 2,
          prompt: 'Professional portrait, studio lighting, high quality',
          parameters: { steps: 50, guidance: 7.5, quality: 'high' },
          resultUrl: 'https://storage.example.com/versions/v2.png',
          quality: 92,
          credits: 2,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      return mockVersions;
    } catch (error) {
      this.logger.error(`Failed to get versions: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // ANALYTICS IA
  // ========================================

  /**
   * Récupère les analytics de génération
   */
  async getGenerationAnalytics(brandId: string): Promise<AIGenerationAnalytics> {
    try {
      this.logger.log(`Getting generation analytics for brand: ${brandId}`);

      // TODO: Implémenter avec Prisma et agrégations
      return {
        totalGenerations: 12450,
        successRate: 94.8,
        avgTime: 4.8,
        avgCost: 0.12,
        totalCost: 1494,
        satisfaction: 4.7,
        trends: {
          generations: '+18.5%',
          success: '+2.3%',
          cost: '+12%',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get generation analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère la performance par modèle
   */
  async getModelPerformance(brandId: string, model: string): Promise<AIModelPerformance> {
    try {
      this.logger.log(`Getting model performance for brand: ${brandId}, model: ${model}`);

      // TODO: Implémenter avec Prisma et agrégations
      return {
        model,
        totalGenerations: 2340,
        successRate: 94.2,
        avgTime: 3.2,
        avgCost: 0.08,
        totalCost: 187.20,
        satisfaction: 4.6,
        bestFor: ['Portraits', 'Landscapes', 'General purpose'],
        worstFor: ['Abstract art', 'Highly creative'],
      };
    } catch (error) {
      this.logger.error(`Failed to get model performance: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // HELPERS PRIVÉS
  // ========================================

  private async estimateCost(prompt: string, parameters: AIGenerationParams, model: string): Promise<number> {
    // TODO: Implémenter vraie estimation basée sur le modèle
    const baseCost = 0.01;
    const promptCost = prompt.length * baseCost;
    const optionsCost = parameters.quality === 'ultra' ? 0.05 : parameters.quality === 'high' ? 0.03 : 0.02;
    return Math.round((promptCost + optionsCost) * 100); // Retourne en centimes
  }

  private async checkUserQuota(userId: string, estimatedCost: number): Promise<boolean> {
    const quota = await this.prisma.userQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      return false;
    }

    return quota.monthlyUsed < quota.monthlyLimit &&
           quota.costUsedCents + estimatedCost <= quota.costLimitCents;
  }

  private async updateUserQuota(userId: string, cost: number): Promise<void> {
    await this.prisma.userQuota.update({
      where: { userId },
      data: {
        monthlyUsed: { increment: 1 },
        costUsedCents: { increment: cost },
      },
    });
  }

  private async recordAICost(brandId: string, provider: string, model: string, cost: number, metadata: any): Promise<void> {
    await this.prisma.aICost.create({
      data: {
        brandId,
        provider,
        model,
        costCents: cost,
        tokens: metadata.tokens,
        duration: metadata.duration,
      },
    });

    await this.budgetService.enforceBudget(brandId, cost);
  }

  private getProviderFromModel(model: string): string {
    if (model.includes('dall-e') || model.includes('gpt')) return 'openai';
    if (model.includes('stable-diffusion')) return 'stability';
    if (model.includes('midjourney')) return 'midjourney';
    if (model.includes('runway')) return 'runway';
    return 'custom';
  }

  private calculateCredits(type: AIGenerationType, model: string, parameters: AIGenerationParams): number {
    // TODO: Implémenter vraie logique de calcul de crédits
    let baseCredits = 2;
    if (type === AIGenerationType.MODEL_3D) baseCredits = 4;
    if (type === AIGenerationType.ANIMATION) baseCredits = 5;
    if (parameters.quality === 'ultra') baseCredits *= 2;
    return baseCredits;
  }
}







