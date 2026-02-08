/**
 * ★★★ SERVICE - AI STUDIO ★★★
 * Service pour AI Studio (générations, modèles, prompts, collections, versioning)
 * Respecte les patterns existants du projet
 */

import { BudgetService } from '@/libs/budgets/budget.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIGenerationStatus as PrismaAIGenerationStatus, AIGenerationType as PrismaAIGenerationType } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import {
    AICollection,
    AIGeneration,
    AIGenerationAnalytics,
    AIGenerationParams,
    AIGenerationStatus,
    AIGenerationType,
    AIModel,
    AIModelPerformance,
    AIVersion,
    ModelComparison,
    PromptOptimization,
    PromptSuggestion,
    PromptTemplate,
} from '../interfaces/ai-studio.interface';
import { AIStudioQueueService } from './ai-studio-queue.service';

@Injectable()
export class AIStudioService {
  private readonly logger = new Logger(AIStudioService.name);
  private readonly openaiApiKey: string;
  private readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetService: BudgetService,
    private readonly queueService: AIStudioQueueService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

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
      const estimatedCost = await this.estimateCost(type, prompt, parameters, model);
      const hasBudget = await this.budgetService.checkBudget(brandId, estimatedCost);
      if (!hasBudget) {
        throw new BadRequestException('Budget insuffisant pour cette génération');
      }

      // Vérifier le quota utilisateur
      const hasQuota = await this.checkUserQuota(userId, estimatedCost);
      if (!hasQuota) {
        throw new BadRequestException('Quota utilisateur insuffisant');
      }

      const provider = this.getProviderFromModel(model);
      const credits = this.calculateCredits(type, model, parameters);

      const created = await this.prisma.aIGeneration.create({
        data: {
          type: type as PrismaAIGenerationType,
          prompt,
          negativePrompt: parameters.negativePrompt ?? null,
          model,
          provider,
          parameters: parameters as object,
          status: PrismaAIGenerationStatus.PENDING,
          credits,
          costCents: estimatedCost,
          userId,
          brandId,
        },
      });

      await this.queueService.queueGeneration(
        created.id,
        type as PrismaAIGenerationType,
        prompt,
        parameters.negativePrompt,
        model,
        provider,
        parameters,
        userId,
        brandId,
      );

      return this.mapPrismaToAIGeneration(created);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to generate: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  private mapPrismaToAIGeneration(row: {
    id: string;
    type: string;
    prompt: string;
    negativePrompt: string | null;
    model: string;
    provider: string;
    parameters: unknown;
    status: string;
    resultUrl: string | null;
    thumbnailUrl: string | null;
    credits: number;
    costCents: number;
    duration: number | null;
    quality: number | null;
    error: string | null;
    userId: string;
    brandId: string;
    parentGenerationId: string | null;
    createdAt: Date;
    completedAt: Date | null;
    updatedAt: Date;
  }): AIGeneration {
    return {
      id: row.id,
      type: row.type as AIGenerationType,
      prompt: row.prompt,
      negativePrompt: row.negativePrompt ?? undefined,
      model: row.model,
      provider: row.provider,
      parameters: (row.parameters as AIGenerationParams) || {},
      status: row.status as AIGenerationStatus,
      resultUrl: row.resultUrl ?? undefined,
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      credits: row.credits,
      costCents: row.costCents,
      duration: row.duration ?? undefined,
      quality: row.quality ?? undefined,
      error: row.error ?? undefined,
      userId: row.userId,
      brandId: row.brandId,
      parentGenerationId: row.parentGenerationId ?? undefined,
      createdAt: row.createdAt,
      completedAt: row.completedAt ?? undefined,
      updatedAt: row.updatedAt,
    };
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

      const limit = Math.min(filters?.limit ?? 50, 100);
      const offset = filters?.offset ?? 0;
      const where: Record<string, unknown> = { userId, brandId };
      if (filters?.type) where.type = filters.type;
      if (filters?.status) where.status = filters.status;
      if (filters?.model) where.model = filters.model;

      const [rows, total] = await Promise.all([
        this.prisma.aIGeneration.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.aIGeneration.count({ where }),
      ]);

      return {
        generations: rows.map(r => this.mapPrismaToAIGeneration(r)),
        total,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get generations: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Statistiques AI Studio (pour dashboard)
   */
  async getStats(
    brandId: string,
    options?: { userId?: string; period?: 'day' | 'week' | 'month' },
  ): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    completedLast24h: number;
    failedLast24h: number;
    totalCreditsUsed: number;
    totalCostCents: number;
  }> {
    const since = new Date();
    if (options?.period === 'day') since.setDate(since.getDate() - 1);
    else if (options?.period === 'week') since.setDate(since.getDate() - 7);
    else if (options?.period === 'month') since.setMonth(since.getMonth() - 1);
    else since.setDate(since.getDate() - 1);

    const where: Record<string, unknown> = { brandId };
    if (options?.userId) where.userId = options.userId;

    const [byStatus, byType, total, last24h, aggregates] = await Promise.all([
      this.prisma.aIGeneration.groupBy({
        by: ['status'],
        where: { ...where, createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.aIGeneration.groupBy({
        by: ['type'],
        where: { ...where, createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.aIGeneration.count({ where: { ...where, createdAt: { gte: since } } }),
      this.prisma.aIGeneration.findMany({
        where: {
          ...where,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: { in: ['COMPLETED', 'FAILED'] },
        },
        select: { status: true },
      }),
      this.prisma.aIGeneration.aggregate({
        where: { ...where, createdAt: { gte: since } },
        _sum: { credits: true, costCents: true },
      }),
    ]);

    const completedLast24h = last24h.filter(r => r.status === 'COMPLETED').length;
    const failedLast24h = last24h.filter(r => r.status === 'FAILED').length;

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      byType: Object.fromEntries(byType.map(t => [t.type, t._count.id])),
      completedLast24h,
      failedLast24h,
      totalCreditsUsed: aggregates._sum.credits ?? 0,
      totalCostCents: aggregates._sum.costCents ?? 0,
    };
  }

  // ========================================
  // MODÈLES IA
  // ========================================

  /**
   * Récupère les modèles IA : liste de référence + stats réelles depuis Prisma (AIGeneration).
   */
  async getModels(type?: AIGenerationType): Promise<AIModel[]> {
    try {
      this.logger.log(`Getting AI models${type ? ` for type: ${type}` : ''}`);

      const refModels: Array<{ id: string; name: string; provider: string; type: AIGenerationType }> = [
        { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'stability', type: AIGenerationType.IMAGE_2D },
        { id: 'dall-e-3', name: 'DALL-E 3', provider: 'openai', type: AIGenerationType.IMAGE_2D },
        { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'midjourney', type: AIGenerationType.IMAGE_2D },
      ];

      const modelIds = refModels.map((m) => m.id);
      const whereModel = { model: { in: modelIds } };
      if (type) (whereModel as Record<string, unknown>).type = type;

      const stats = await this.prisma.aIGeneration.groupBy({
        by: ['model'],
        where: whereModel,
        _count: { id: true },
        _avg: { costCents: true, duration: true, quality: true },
        _sum: { costCents: true },
      });

      const statsByModel = Object.fromEntries(
        stats.map((s) => [
          s.model,
          {
            count: s._count.id,
            avgCost: s._avg.costCents ?? 0,
            avgTime: s._avg.duration ?? 0,
            avgQuality: s._avg.quality ?? 0,
          },
        ]),
      );

      const baseCents: Record<string, number> = {
        'stable-diffusion-xl': 8,
        'dall-e-3': 12,
        'midjourney-v6': 15,
      };

      const list = refModels
        .filter((m) => !type || m.type === type)
        .map((m) => {
          const s = statsByModel[m.id];
          const costPerGen = s ? s.avgCost / 100 : (baseCents[m.id] ?? 10) / 100;
          return {
            id: m.id,
            name: m.name,
            provider: m.provider,
            type: m.type,
            costPerGeneration: Math.round(costPerGen * 100) / 100,
            avgTime: s ? Math.round(s.avgTime * 10) / 10 : 4,
            quality: s && s.avgQuality > 0 ? Math.round(s.avgQuality * 10) / 10 : 92,
            isActive: true,
            metadata: { resolution: '1024x1024' },
          };
        });

      return list;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get models: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Compare deux modèles IA (agrégations Prisma)
   */
  async compareModels(model1: string, model2: string, metric: string): Promise<ModelComparison> {
    try {
      this.logger.log(`Comparing models: ${model1} vs ${model2} on metric: ${metric}`);

      const [agg1, agg2] = await Promise.all([
        this.prisma.aIGeneration.aggregate({
          where: { model: model1, status: 'COMPLETED' },
          _avg: { costCents: true, duration: true, quality: true },
          _count: { id: true },
          _sum: { costCents: true },
        }),
        this.prisma.aIGeneration.aggregate({
          where: { model: model2, status: 'COMPLETED' },
          _avg: { costCents: true, duration: true, quality: true },
          _count: { id: true },
          _sum: { costCents: true },
        }),
      ]);

      const d1 = {
        value: agg1._avg.quality ?? 0,
        cost: (agg1._avg.costCents ?? 0) / 100,
        time: agg1._avg.duration ?? 0,
      };
      const d2 = {
        value: agg2._avg.quality ?? 0,
        cost: (agg2._avg.costCents ?? 0) / 100,
        time: agg2._avg.duration ?? 0,
      };

      let winner = model1;
      let insight = `${model1} vs ${model2}`;
      if (metric === 'quality' && d2.value > d1.value) winner = model2;
      else if (metric === 'cost' && d2.cost < d1.cost) winner = model2;
      else if (metric === 'time' && d2.time < d1.time) winner = model2;
      if (winner === model2) insight = `${model2} meilleur sur ${metric}`;
      else insight = `${model1} meilleur sur ${metric}`;

      return {
        model1,
        model2,
        metric,
        winner,
        insight,
        data: { model1: d1, model2: d2 },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to compare models: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  // ========================================
  // PROMPTS
  // ========================================

  /**
   * Optimise un prompt automatiquement avec GPT-4o-mini
   */
  async optimizePrompt(prompt: string): Promise<PromptOptimization> {
    try {
      this.logger.log(`Optimizing prompt with AI`);

      // Vérifier si OpenAI est configuré
      if (!this.openaiApiKey || this.openaiApiKey === 'sk-placeholder') {
        this.logger.warn('OpenAI API key not configured, using fallback optimization');
        return this.fallbackOptimizePrompt(prompt);
      }

      const systemPrompt = `You are an expert AI image prompt engineer. Your task is to optimize prompts for image generation.
      
Rules:
1. Enhance the prompt with quality modifiers (lighting, resolution, style)
2. Add technical details that improve generation quality
3. Keep the core intent of the original prompt
4. Be concise but descriptive
5. Return ONLY the optimized prompt, no explanations`;

      const response = await firstValueFrom(
        this.httpService.post(
          this.OPENAI_URL,
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Optimize this image generation prompt:\n\n"${prompt}"` },
            ],
            temperature: 0.7,
            max_tokens: 500,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const optimizedPrompt = response.data.choices[0]?.message?.content?.trim() || prompt;
      
      // Calculer l'amélioration estimée basée sur la longueur et les mots-clés
      const beforeScore = this.calculatePromptScore(prompt);
      const afterScore = this.calculatePromptScore(optimizedPrompt);
      const improvement = afterScore - beforeScore;

      return {
        original: prompt,
        optimized: optimizedPrompt,
        improvement: `+${improvement.toFixed(1)}% qualité`,
        before: beforeScore,
        after: afterScore,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to optimize prompt with AI: ${errorMessage}`, errorStack);
      // Fallback to basic optimization
      return this.fallbackOptimizePrompt(prompt);
    }
  }

  /**
   * Fallback pour optimisation de prompt sans API
   */
  private fallbackOptimizePrompt(prompt: string): PromptOptimization {
    const qualityModifiers = [
      'high quality',
      '8k resolution',
      'detailed',
      'professional lighting',
      'sharp focus',
    ];
    
    // Vérifier quels modifiers ne sont pas déjà présents
    const lowercasePrompt = prompt.toLowerCase();
    const missingModifiers = qualityModifiers.filter(
      m => !lowercasePrompt.includes(m.toLowerCase())
    );
    
    const optimized = missingModifiers.length > 0
      ? `${prompt}, ${missingModifiers.slice(0, 3).join(', ')}`
      : prompt;

    const beforeScore = this.calculatePromptScore(prompt);
    const afterScore = this.calculatePromptScore(optimized);

    return {
      original: prompt,
      optimized,
      improvement: `+${(afterScore - beforeScore).toFixed(1)}% qualité`,
      before: beforeScore,
      after: afterScore,
    };
  }

  /**
   * Calcule un score de qualité pour un prompt
   */
  private calculatePromptScore(prompt: string): number {
    let score = 50; // Score de base

    const qualityKeywords = [
      { keyword: 'high quality', weight: 5 },
      { keyword: '8k', weight: 4 },
      { keyword: '4k', weight: 3 },
      { keyword: 'detailed', weight: 4 },
      { keyword: 'professional', weight: 3 },
      { keyword: 'lighting', weight: 4 },
      { keyword: 'sharp', weight: 3 },
      { keyword: 'realistic', weight: 4 },
      { keyword: 'vivid', weight: 3 },
      { keyword: 'natural', weight: 2 },
      { keyword: 'studio', weight: 3 },
      { keyword: 'cinematic', weight: 4 },
      { keyword: 'masterpiece', weight: 5 },
    ];

    const lowercasePrompt = prompt.toLowerCase();
    for (const { keyword, weight } of qualityKeywords) {
      if (lowercasePrompt.includes(keyword)) {
        score += weight;
      }
    }

    // Bonus pour la longueur appropriée (50-200 caractères)
    if (prompt.length >= 50 && prompt.length <= 200) {
      score += 5;
    }

    // Pénalité pour prompt trop court
    if (prompt.length < 20) {
      score -= 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Récupère des suggestions de prompts avec GPT-4o-mini
   */
  async getPromptSuggestions(input: string): Promise<PromptSuggestion[]> {
    try {
      this.logger.log(`Getting prompt suggestions for: ${input}`);

      // Vérifier si OpenAI est configuré
      if (!this.openaiApiKey || this.openaiApiKey === 'sk-placeholder') {
        this.logger.warn('OpenAI API key not configured, using fallback suggestions');
        return this.fallbackPromptSuggestions(input);
      }

      const systemPrompt = `You are an AI image generation expert. Given a partial prompt or topic, suggest relevant modifiers and enhancements.

Return a JSON array with exactly 6 short modifier suggestions (2-4 words each) that would improve the image quality.
Example output: ["studio lighting", "high resolution", "detailed texture", "vibrant colors", "cinematic composition", "sharp focus"]

Only return the JSON array, no other text.`;

      const response = await firstValueFrom(
        this.httpService.post(
          this.OPENAI_URL,
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Suggest modifiers for this image prompt:\n\n"${input}"` },
            ],
            temperature: 0.8,
            max_tokens: 200,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const content = response.data.choices[0]?.message?.content?.trim() || '[]';
      
      // Parser les suggestions JSON
      let suggestions: string[];
      try {
        suggestions = JSON.parse(content);
        if (!Array.isArray(suggestions)) {
          suggestions = [];
        }
      } catch {
        // Essayer d'extraire des suggestions du texte brut
        suggestions = content
          .replace(/[\[\]"]/g, '')
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0 && s.length < 50);
      }

      // Limiter à 6 suggestions
      suggestions = suggestions.slice(0, 6);

      // Calculer la confiance basée sur la pertinence
      const confidence = suggestions.length >= 4 ? 95 : suggestions.length >= 2 ? 85 : 70;

      return [
        {
          input,
          suggestions,
          confidence,
        },
      ];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get prompt suggestions with AI: ${errorMessage}`, errorStack);
      return this.fallbackPromptSuggestions(input);
    }
  }

  /**
   * Fallback pour suggestions de prompts sans API
   */
  private fallbackPromptSuggestions(input: string): PromptSuggestion[] {
    // Suggestions génériques basées sur des catégories communes
    const categories: Record<string, string[]> = {
      portrait: ['soft lighting', 'shallow depth of field', 'natural expression', 'studio background'],
      landscape: ['golden hour', 'wide angle', 'dramatic sky', 'vibrant nature'],
      product: ['clean background', 'professional lighting', 'sharp details', 'commercial quality'],
      abstract: ['vibrant colors', 'fluid shapes', 'artistic composition', 'high contrast'],
      default: ['high quality', 'detailed', 'professional', 'sharp focus', '8k resolution', 'natural lighting'],
    };

    const lowercaseInput = input.toLowerCase();
    let selectedSuggestions: string[] = categories.default;

    for (const [category, suggestions] of Object.entries(categories)) {
      if (lowercaseInput.includes(category)) {
        selectedSuggestions = suggestions;
        break;
      }
    }

    return [
      {
        input,
        suggestions: selectedSuggestions,
        confidence: 75,
      },
    ];
  }

  /**
   * Récupère les templates de prompts avec taux de succès global (depuis AIGeneration).
   * usageCount par template nécessiterait AIGeneration.promptTemplateId (non présent en schéma).
   */
  async getPromptTemplates(category?: string, userId?: string, brandId?: string): Promise<PromptTemplate[]> {
    try {
      this.logger.log(`Getting prompt templates${category ? ` for category: ${category}` : ''}`);

      const [templates, aggregate] = await Promise.all([
        this.prisma.promptTemplate.findMany({
          where: {
            isActive: true,
            ...(category && { style: category }),
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.aIGeneration.groupBy({
          by: ['status'],
          where: {
            status: { in: ['COMPLETED', 'FAILED', 'PROCESSING', 'PENDING'] },
            ...(brandId && brandId.trim() ? { brandId: brandId.trim() } : {}),
          },
          _count: { id: true },
        }),
      ]);

      const byStatus = Object.fromEntries(aggregate.map((a) => [a.status, a._count.id]));
      const completed = byStatus.COMPLETED ?? 0;
      const failed = byStatus.FAILED ?? 0;
      const totalFinished = completed + failed;
      const successRate = totalFinished > 0 ? Math.round((completed / totalFinished) * 1000) / 10 : 0;

      return templates.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.style || 'general',
        prompt: t.prompt,
        variables: (t.variables as Record<string, string>) ?? {},
        successRate,
        usageCount: 0,
        createdAt: t.createdAt,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get prompt templates: ${errorMessage}`, errorStack);
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

      const where: {
        brandId: string;
        type: 'TEMPLATE';
        parameters?: { path: string[]; equals: string };
      } = {
        brandId,
        type: 'TEMPLATE',
      };

      if (filters.category && filters.category !== 'all') {
        where.parameters = { path: ['category'], equals: filters.category };
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

      const paramsTyped = (p: unknown): Record<string, unknown> => (p && typeof p === 'object' ? (p as Record<string, unknown>) : {});

      const result = templates.map((t) => {
        const params = paramsTyped(t.parameters);
        return {
          id: t.id,
          name: (params.name as string) || 'Untitled Template',
          category: (params.category as string) || 'general',
          subcategory: params.subcategory as string | undefined,
          prompt: t.prompt,
          style: params.style as string | undefined,
          thumbnailUrl: t.thumbnailUrl || '',
          previewUrl: t.resultUrl,
          price: typeof params.price === 'number' ? params.price : 0,
          isPremium: Boolean(params.isPremium),
          downloads: 0,
          views: 0,
          rating: 0,
          tags: Array.isArray(params.tags) ? (params.tags as string[]) : [],
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get templates: ${errorMessage}`, errorStack);
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
        throw new NotFoundException(`Template ${id} not found`);
      }

      const params = (template.parameters as Record<string, unknown>) || {};
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get template: ${errorMessage}`, errorStack);
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

      const params = (template.parameters as Record<string, unknown>) || {};
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to create template: ${errorMessage}`, errorStack);
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
        throw new NotFoundException(`Template ${id} not found`);
      }

      const existingParams = (existing.parameters as Record<string, unknown>) || {};
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

      const params = (template.parameters as Record<string, unknown>) || {};
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to update template: ${errorMessage}`, errorStack);
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
        throw new NotFoundException(`Template ${id} not found`);
      }

      await this.prisma.aIGeneration.delete({
        where: { id },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to delete template: ${errorMessage}`, errorStack);
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
        const params = (a.parameters as Record<string, unknown>) || {};
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get animations: ${errorMessage}`, errorStack);
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
        throw new NotFoundException(`Animation ${id} not found`);
      }

      const params = (animation.parameters as Record<string, unknown>) || {};
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get animation: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Génère une nouvelle animation via BullMQ background job
   */
  async generateAnimation(brandId: string, userId: string, dto: any) {
    try {
      this.logger.log(`Generating animation for brand: ${brandId}, user: ${userId}`);

      // Vérifier le budget
      const estimatedCost = (dto.duration || 5) * 10; // 10 crédits par seconde
      const hasBudget = await this.budgetService.checkBudget(brandId, estimatedCost);
      if (!hasBudget) {
        throw new BadRequestException('Budget insuffisant pour cette génération');
      }

      // Vérifier le quota utilisateur
      const hasQuota = await this.checkUserQuota(userId, estimatedCost);
      if (!hasQuota) {
        throw new BadRequestException('Quota utilisateur insuffisant');
      }

      const parameters = {
        style: dto.style,
        duration: dto.duration || 5,
        fps: dto.fps || 30,
        resolution: dto.resolution || '1080p',
      };

      // Créer la génération avec statut PENDING
      const animation = await this.prisma.aIGeneration.create({
        data: {
          type: 'ANIMATION',
          prompt: dto.prompt,
          model: 'animation-generator',
          provider: 'luneo',
          parameters,
          status: 'PENDING',
          credits: estimatedCost,
          costCents: estimatedCost * 10, // 10 centimes par crédit
          userId,
          brandId,
        },
      });

      // Lancer la génération via BullMQ background job
      await this.queueService.queueGeneration(
        animation.id,
        'ANIMATION' as PrismaAIGenerationType,
        dto.prompt,
        undefined,
        'animation-generator',
        'luneo',
        parameters,
        userId,
        brandId,
      );

      this.logger.log(`Animation ${animation.id} queued for background processing`);

      const params = (animation.parameters as Record<string, unknown>) || {};
      return {
        id: animation.id,
        prompt: animation.prompt,
        status: 'pending', // Statut initial avant traitement
        result: animation.resultUrl,
        thumbnail: animation.thumbnailUrl,
        duration: params.duration || 5,
        fps: params.fps || 30,
        resolution: params.resolution || '1080p',
        credits: animation.credits,
        createdAt: animation.createdAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to generate animation: ${errorMessage}`, errorStack);
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
        throw new NotFoundException(`Animation ${id} not found`);
      }

      await this.prisma.aIGeneration.delete({
        where: { id },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to delete animation: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  // ========================================
  // COLLECTIONS
  // ========================================

  /**
   * Récupère les collections d'un utilisateur (Prisma)
   */
  async getCollections(userId: string, brandId: string): Promise<AICollection[]> {
    try {
      this.logger.log(`Getting collections for user: ${userId}, brand: ${brandId}`);

      const rows = await this.prisma.aICollection.findMany({
        where: { userId, brandId },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { generations: true } },
        },
      });

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        isShared: r.isShared,
        userId: r.userId,
        brandId: r.brandId,
        generationCount: r._count.generations,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get collections: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Crée une nouvelle collection (Prisma)
   */
  async createCollection(
    userId: string,
    brandId: string,
    data: Omit<AICollection, 'id' | 'userId' | 'brandId' | 'generationCount' | 'createdAt' | 'updatedAt'>,
  ): Promise<AICollection> {
    try {
      this.logger.log(`Creating collection for user: ${userId}, brand: ${brandId}`);

      const created = await this.prisma.aICollection.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          isShared: data.isShared ?? false,
          userId,
          brandId,
        },
      });

      return {
        id: created.id,
        name: created.name,
        description: created.description ?? undefined,
        isShared: created.isShared,
        userId: created.userId,
        brandId: created.brandId,
        generationCount: 0,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to create collection: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  // ========================================
  // VERSIONING
  // ========================================

  /**
   * Récupère les versions d'une génération (Prisma AIVersion)
   */
  async getVersions(generationId: string): Promise<AIVersion[]> {
    try {
      this.logger.log(`Getting versions for generation: ${generationId}`);

      const rows = await this.prisma.aIVersion.findMany({
        where: { generationId },
        orderBy: { version: 'asc' },
      });

      return rows.map((r) => ({
        id: r.id,
        generationId: r.generationId,
        version: r.version,
        prompt: r.prompt,
        parameters: (r.parameters as Record<string, unknown>) || {},
        resultUrl: r.resultUrl,
        quality: r.quality ?? undefined,
        credits: r.credits,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get versions: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  // ========================================
  // ANALYTICS IA
  // ========================================

  /**
   * Récupère les analytics de génération (Prisma agrégations)
   */
  async getGenerationAnalytics(brandId: string): Promise<AIGenerationAnalytics> {
    try {
      this.logger.log(`Getting generation analytics for brand: ${brandId}`);

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const prevSince = new Date();
      prevSince.setDate(prevSince.getDate() - 60);

      const [totalAgg, completedAgg, prevTotal, prevCompleted] = await Promise.all([
        this.prisma.aIGeneration.aggregate({
          where: { brandId, createdAt: { gte: since } },
          _count: { id: true },
          _avg: { costCents: true, duration: true },
          _sum: { costCents: true },
        }),
        this.prisma.aIGeneration.count({
          where: { brandId, createdAt: { gte: since }, status: 'COMPLETED' },
        }),
        this.prisma.aIGeneration.count({
          where: { brandId, createdAt: { gte: prevSince, lt: since } },
        }),
        this.prisma.aIGeneration.count({
          where: { brandId, createdAt: { gte: prevSince, lt: since }, status: 'COMPLETED' },
        }),
      ]);

      const total = totalAgg._count.id;
      const totalCost = (totalAgg._sum.costCents ?? 0) / 100;
      const avgCost = total > 0 ? (totalAgg._avg.costCents ?? 0) / 100 : 0;
      const avgTime = totalAgg._avg.duration ?? 0;
      const successRate = total > 0 ? (completedAgg / total) * 100 : 0;
      const prevSuccessRate = prevTotal > 0 ? (prevCompleted / prevTotal) * 100 : 0;
      const trendGen = prevTotal > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) + '%' : '0%';
      const trendSuccess = prevSuccessRate > 0 ? ((successRate - prevSuccessRate) / prevSuccessRate * 100).toFixed(1) + '%' : '0%';

      return {
        totalGenerations: total,
        successRate: Math.round(successRate * 10) / 10,
        avgTime: Math.round(avgTime * 10) / 10,
        avgCost: Math.round(avgCost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        satisfaction: successRate / 20,
        trends: {
          generations: (Number(trendGen) >= 0 ? '+' : '') + trendGen,
          success: (Number(trendSuccess) >= 0 ? '+' : '') + trendSuccess,
          cost: '+0%',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get generation analytics: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Récupère la performance par modèle (Prisma agrégations)
   */
  async getModelPerformance(brandId: string, model: string): Promise<AIModelPerformance> {
    try {
      this.logger.log(`Getting model performance for brand: ${brandId}, model: ${model}`);

      const [agg, completed] = await Promise.all([
        this.prisma.aIGeneration.aggregate({
          where: { brandId, model },
          _count: { id: true },
          _avg: { costCents: true, duration: true, quality: true },
          _sum: { costCents: true },
        }),
        this.prisma.aIGeneration.count({
          where: { brandId, model, status: 'COMPLETED' },
        }),
      ]);

      const total = agg._count.id;
      const totalCost = (agg._sum.costCents ?? 0) / 100;
      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        model,
        totalGenerations: total,
        successRate: Math.round(successRate * 10) / 10,
        avgTime: Math.round((agg._avg.duration ?? 0) * 10) / 10,
        avgCost: Math.round((agg._avg.costCents ?? 0) / 100 * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        satisfaction: Math.round((successRate / 20) * 10) / 10,
        bestFor: ['Portraits', 'Landscapes', 'General purpose'],
        worstFor: ['Abstract art', 'Highly creative'],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get model performance: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Récupère l'usage IA de l'utilisateur (générations, coûts, quotas)
   */
  async getUsage(userId: string, brandId: string): Promise<{
    quota: {
      monthlyLimit: number;
      monthlyUsed: number;
      costLimitCents: number;
      costUsedCents: number;
      resetAt: Date;
    };
    stats: {
      totalGenerations: number;
      generationsThisMonth: number;
      totalCostCents: number;
      costThisMonth: number;
      byType: Record<string, number>;
      byModel: Record<string, number>;
    };
    recentGenerations: Array<{
      id: string;
      type: string;
      model: string;
      status: string;
      costCents: number;
      createdAt: Date;
    }>;
  }> {
    try {
      // Récupérer le quota utilisateur
      const quota = await this.prisma.userQuota.findUnique({
        where: { userId },
      });

      // Récupérer les générations de l'utilisateur
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [allGenerations, monthlyGenerations, brandCosts] = await Promise.all([
        this.prisma.aIGeneration.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            model: true,
            status: true,
            costCents: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100, // Dernières 100 générations
        }),
        this.prisma.aIGeneration.findMany({
          where: {
            userId,
            createdAt: { gte: startOfMonth },
          },
          select: {
            type: true,
            model: true,
            costCents: true,
          },
        }),
        this.prisma.aICost.findMany({
          where: {
            brandId,
            createdAt: { gte: startOfMonth },
          },
          select: {
            costCents: true,
          },
        }),
      ]);

      // Calculer les statistiques
      const byType: Record<string, number> = {};
      const byModel: Record<string, number> = {};
      let totalCostCents = 0;
      let costThisMonth = 0;

      monthlyGenerations.forEach((gen) => {
        byType[gen.type] = (byType[gen.type] || 0) + 1;
        byModel[gen.model || 'unknown'] = (byModel[gen.model || 'unknown'] || 0) + 1;
        costThisMonth += gen.costCents || 0;
      });

      allGenerations.forEach((gen) => {
        totalCostCents += gen.costCents || 0;
      });

      brandCosts.forEach((cost) => {
        costThisMonth += cost.costCents || 0;
      });

      return {
        quota: quota
          ? {
              monthlyLimit: quota.monthlyLimit,
              monthlyUsed: quota.monthlyUsed,
              costLimitCents: quota.costLimitCents,
              costUsedCents: quota.costUsedCents,
              resetAt: quota.resetAt,
            }
          : {
              monthlyLimit: 100,
              monthlyUsed: 0,
              costLimitCents: 5000,
              costUsedCents: 0,
              resetAt: now,
            },
        stats: {
          totalGenerations: allGenerations.length,
          generationsThisMonth: monthlyGenerations.length,
          totalCostCents,
          costThisMonth,
          byType,
          byModel,
        },
        recentGenerations: allGenerations.slice(0, 10).map((gen) => ({
          id: gen.id,
          type: gen.type,
          model: gen.model || 'unknown',
          status: gen.status,
          costCents: gen.costCents || 0,
          createdAt: gen.createdAt,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get usage: ${errorMessage}`);
      throw error;
    }
  }

  // ========================================
  // HELPERS PRIVÉS
  // ========================================

  /**
   * Estimation du coût en centimes basée sur le modèle, type et qualité (Prisma / jobs).
   */
  private async estimateCost(
    type: AIGenerationType,
    prompt: string,
    parameters: AIGenerationParams,
    model: string,
  ): Promise<number> {
    const baseCentsByType: Record<string, number> = {
      IMAGE_2D: 8,
      MODEL_3D: 15,
      ANIMATION: 25,
      TEMPLATE: 5,
    };
    const baseCents = baseCentsByType[type as string] ?? 8;
    const modelMultiplier = this.getModelCostMultiplier(model);
    const qualityMultiplier = parameters.quality === 'ultra' ? 2 : parameters.quality === 'high' ? 1.5 : 1;
    const promptFactor = Math.min(1 + prompt.length / 5000, 1.5);
    return Math.round(baseCents * modelMultiplier * qualityMultiplier * promptFactor);
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

  private async recordAICost(
    brandId: string,
    provider: string,
    model: string,
    cost: number,
    metadata: { tokens?: number; duration?: number },
  ): Promise<void> {
    await this.prisma.aICost.create({
      data: {
        brandId,
        provider,
        model,
        costCents: cost,
        tokens: metadata.tokens ?? null,
        duration: metadata.duration ?? null,
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

  /**
   * Calcul des crédits consommés (cohérent avec stats et jobs).
   * Public pour usage par le worker AI Studio.
   */
  calculateCredits(type: AIGenerationType, model: string, parameters: AIGenerationParams): number {
    const baseByType: Record<AIGenerationType, number> = {
      [AIGenerationType.IMAGE_2D]: 2,
      [AIGenerationType.MODEL_3D]: 4,
      [AIGenerationType.ANIMATION]: 5,
      [AIGenerationType.TEMPLATE]: 1,
    };
    let credits = baseByType[type] ?? 2;
    const modelFactor = this.getModelCreditMultiplier(model);
    if (parameters.quality === 'ultra') credits *= 2;
    else if (parameters.quality === 'high') credits = Math.ceil(credits * 1.5);
    if (type === AIGenerationType.ANIMATION && typeof (parameters as { duration?: number }).duration === 'number') {
      credits += Math.max(0, Math.floor((parameters as { duration: number }).duration / 5));
    }
    return Math.max(1, Math.round(credits * modelFactor));
  }

  /**
   * Estimation publique pour le frontend (coût + crédits sans lancer de génération).
   */
  async getEstimation(
    type: AIGenerationType,
    model: string,
    parameters: AIGenerationParams,
    prompt?: string,
  ): Promise<{ costCents: number; credits: number }> {
    const costCents = await this.estimateCost(type, prompt ?? '', parameters, model);
    const credits = this.calculateCredits(type, model, parameters);
    return { costCents, credits };
  }

  private getModelCostMultiplier(model: string): number {
    const m = model.toLowerCase();
    if (m.includes('dall-e-3') || m.includes('gpt-4')) return 1.5;
    if (m.includes('dall-e') || m.includes('midjourney')) return 1.2;
    if (m.includes('stable-diffusion') || m.includes('sdxl')) return 1;
    if (m.includes('runway') || m.includes('animation')) return 1.4;
    return 1;
  }

  private getModelCreditMultiplier(model: string): number {
    const m = model.toLowerCase();
    if (m.includes('dall-e-3') || m.includes('gpt-4')) return 1.5;
    if (m.includes('midjourney')) return 1.3;
    return 1;
  }
}







