/**
 * @fileoverview Service d'analytics prédictives
 * @module PredictiveService
 *
 * FONCTIONNALITÉS:
 * - Prédiction des tendances
 * - Détection d'anomalies
 * - Recommandations automatiques
 * - Alertes proactives
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService, LLMProvider, LLM_MODELS } from '@/modules/agents/services/llm-router.service';

// ============================================================================
// TYPES
// ============================================================================

export interface TrendPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  horizon: '7d' | '30d' | '90d';
}

export interface Anomaly {
  id: string;
  metric: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
  value: number;
  expectedRange: { min: number; max: number };
}

export interface Recommendation {
  id: string;
  type: 'product' | 'pricing' | 'marketing' | 'operational';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  metrics: string[];
  actionUrl?: string;
}

export interface SeasonalEvent {
  name: string;
  date: Date;
  daysUntil: number;
  expectedImpact: number; // % increase
  recommendations: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class PredictiveService {
  private readonly logger = new Logger(PredictiveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly llmRouter: LLMRouterService,
  ) {}

  /**
   * Génère des prédictions de tendances
   */
  async getTrendPredictions(
    brandId: string,
    horizon: '7d' | '30d' | '90d' = '30d',
  ): Promise<TrendPrediction[]> {
    const cacheKey = `predictive:trends:${brandId}:${horizon}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Récupérer les données historiques
        const days = horizon === '7d' ? 30 : horizon === '30d' ? 90 : 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Utiliser les données de designs comme proxy pour les générations
        const historicalData = await this.prisma.design.findMany({
          where: {
            brandId,
            createdAt: { gte: startDate },
          },
          select: {
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        // ✅ PHASE 2 - Prédictions: Fallback si données faibles
        if (historicalData.length < 7) {
          this.logger.warn(`Insufficient data for trend predictions (${historicalData.length} points, need at least 7). Returning fallback predictions.`);
          return await this.getFallbackPredictions(brandId, horizon);
        }

        // Calculer les tendances pour chaque métrique
        const predictions: TrendPrediction[] = [];

        // Prédiction designs (proxy pour générations)
        const designsTrend = this.calculateTrend(
          historicalData.map((d, i) => ({ date: d.createdAt, value: i + 1 })),
          horizon,
        );
        predictions.push({
          metric: 'generations',
          ...designsTrend,
        });

        // Prédiction revenu (basé sur les commandes)
        const ordersData = await this.prisma.order.findMany({
          where: {
            brandId,
            createdAt: { gte: startDate },
            paymentStatus: 'SUCCEEDED',
          },
          select: {
            createdAt: true,
            totalCents: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        if (ordersData.length > 0) {
          const revenueTrend = this.calculateTrend(
            ordersData.map((o, i) => ({
              date: o.createdAt,
              value: Number(o.totalCents) / 100, // Convert cents to currency
            })),
            horizon,
          );
          predictions.push({
            metric: 'revenue',
            ...revenueTrend,
          });
        }

        return predictions;
      },
      3600 // Cache 1 heure
    );
  }

  /**
   * Détecte les anomalies dans les métriques
   */
  async detectAnomalies(brandId: string): Promise<Anomaly[]> {
    const cacheKey = `predictive:anomalies:${brandId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const anomalies: Anomaly[] = [];

        // Récupérer les 30 derniers jours
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const designs = await this.prisma.design.findMany({
          where: {
            brandId,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            createdAt: true,
          },
        });

        if (designs.length < 7) {
          return [];
        }

        // Analyser chaque métrique
        const values = designs.map((_, i) => i + 1);
        const anomaly = this.detectMetricAnomaly('totalDesigns', values);
        if (anomaly) {
          anomalies.push(anomaly);
        }

        return anomalies;
      },
      1800 // Cache 30 minutes
    );
  }

  /**
   * Génère des recommandations basées sur l'IA
   */
  async getRecommendations(brandId: string): Promise<Recommendation[]> {
    const cacheKey = `predictive:recommendations:${brandId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Récupérer les métriques actuelles
        const [trends, anomalies] = await Promise.all([
          this.getTrendPredictions(brandId, '30d'),
          this.detectAnomalies(brandId),
        ]);

        // Récupérer le contexte du brand
        const brand = await this.prisma.brand.findUnique({
          where: { id: brandId },
          include: {
            products: { take: 20 },
            _count: {
              select: {
                products: true,
                designs: true,
                orders: true,
              },
            },
          },
        });

        if (!brand) return [];

        // Générer des recommandations via LLM
        const prompt = `Analyse ces données d'un shop e-commerce de personnalisation et génère 5 recommandations actionnables.

DONNÉES:
- Nombre de produits: ${brand._count.products}
- Total designs: ${brand._count.designs}
- Total commandes: ${brand._count.orders}
- Tendances: ${JSON.stringify(trends)}
- Anomalies: ${JSON.stringify(anomalies)}

Génère un JSON array avec le format:
[{
  "type": "product|pricing|marketing|operational",
  "title": "Titre court",
  "description": "Description de la recommandation",
  "impact": "low|medium|high",
  "effort": "low|medium|high",
  "metrics": ["metric1", "metric2"]
}]`;

        try {
          const response = await this.llmRouter.chat({
            provider: LLMProvider.OPENAI,
            model: LLM_MODELS.openai.GPT35_TURBO,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            maxTokens: 1024,
            stream: false,
            enableFallback: true,
          });

          const recommendations = JSON.parse(response.content) as Array<Partial<Recommendation>>;
          return recommendations.map((r, index: number) => ({
            id: `rec-${brandId}-${index}`,
            type: r.type || 'operational',
            title: r.title || 'Recommandation',
            description: r.description || '',
            impact: r.impact || 'medium',
            effort: r.effort || 'medium',
            metrics: r.metrics || [],
          })) as Recommendation[];
        } catch (error) {
          this.logger.error('Failed to generate recommendations:', error);
          return this.getDefaultRecommendations(brand);
        }
      },
      7200 // Cache 2 heures
    );
  }

  /**
   * Récupère les événements saisonniers à venir
   */
  async getUpcomingSeasonalEvents(brandId: string): Promise<SeasonalEvent[]> {
    const events: SeasonalEvent[] = [];
    const today = new Date();

    // Événements prédéfinis
    const seasonalEvents = [
      { name: 'Saint-Valentin', month: 1, day: 14, impact: 340 },
      { name: 'Fête des Mères', month: 4, day: 26, impact: 280 },
      { name: 'Fête des Pères', month: 5, day: 16, impact: 180 },
      { name: 'Noël', month: 11, day: 25, impact: 420 },
      { name: 'Black Friday', month: 10, day: 29, impact: 250 },
    ];

    for (const event of seasonalEvents) {
      let eventDate = new Date(today.getFullYear(), event.month, event.day);

      // Si l'événement est passé, prendre l'année prochaine
      if (eventDate < today) {
        eventDate = new Date(today.getFullYear() + 1, event.month, event.day);
      }

      const daysUntil = Math.ceil(
        (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 90) {
        events.push({
          name: event.name,
          date: eventDate,
          daysUntil,
          expectedImpact: event.impact,
          recommendations: this.getSeasonalRecommendations(event.name, daysUntil),
        });
      }
    }

    return events.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Calcule la tendance d'une métrique avec régression linéaire simple
   * Conforme au plan PHASE 2 - Prédictions: Conserver modèles simples (régression) + fallback si données faibles
   */
  private calculateTrend(
    data: Array<{ date: Date; value: number }>,
    horizon: '7d' | '30d' | '90d',
  ): Omit<TrendPrediction, 'metric'> {
    // ✅ Fallback si données insuffisantes
    if (data.length < 2) {
      const lastValue = data[0]?.value || 0;
      return {
        currentValue: lastValue,
        predictedValue: lastValue,
        changePercent: 0,
        confidence: 0.1, // Très faible confiance
        trend: 'stable',
        horizon,
      };
    }

    // ✅ Si données faibles (2-6 points), utiliser moyenne mobile simple
    if (data.length < 7) {
      const lastValue = data[data.length - 1].value;
      const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
      const predictedValue = avgValue; // Utiliser la moyenne comme prédiction simple

      return {
        currentValue: Math.round(lastValue * 100) / 100,
        predictedValue: Math.round(predictedValue * 100) / 100,
        changePercent: lastValue > 0
          ? Math.round(((predictedValue - lastValue) / lastValue) * 100 * 10) / 10
          : 0,
        confidence: 0.3, // Faible confiance pour données limitées
        trend: predictedValue > lastValue * 1.05 ? 'up' : predictedValue < lastValue * 0.95 ? 'down' : 'stable',
        horizon,
      };
    }

    // Régression linéaire simple
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, d) => sum + d.value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    data.forEach((d, i) => {
      numerator += (i - xMean) * (d.value - yMean);
      denominator += (i - xMean) ** 2;
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Prédiction
    const horizonDays = horizon === '7d' ? 7 : horizon === '30d' ? 30 : 90;
    const currentValue = data[data.length - 1].value;
    const predictedValue = intercept + slope * (n + horizonDays);

    const changePercent = currentValue > 0
      ? ((predictedValue - currentValue) / currentValue) * 100
      : 0;

    // Confiance basée sur R²
    const ssRes = data.reduce((sum, d, i) => {
      const predicted = intercept + slope * i;
      return sum + (d.value - predicted) ** 2;
    }, 0);
    const ssTot = data.reduce((sum, d) => sum + (d.value - yMean) ** 2, 0);
    const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

    return {
      currentValue: Math.round(currentValue * 100) / 100,
      predictedValue: Math.max(0, Math.round(predictedValue * 100) / 100),
      changePercent: Math.round(changePercent * 10) / 10,
      confidence: Math.round(Math.max(0, Math.min(1, rSquared)) * 100) / 100,
      trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
      horizon,
    };
  }

  /**
   * Détecte une anomalie dans une métrique
   */
  private detectMetricAnomaly(
    metric: string,
    values: number[],
  ): Anomaly | null {
    if (values.length < 7) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    );

    const latestValue = values[values.length - 1];
    const zScore = stdDev !== 0 ? (latestValue - mean) / stdDev : 0;

    // Anomalie si z-score > 2 ou < -2
    if (Math.abs(zScore) > 2) {
      return {
        id: `anomaly-${metric}-${Date.now()}`,
        metric,
        severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
        description: zScore > 0
          ? `${metric} est anormalement élevé`
          : `${metric} est anormalement bas`,
        detectedAt: new Date(),
        value: latestValue,
        expectedRange: {
          min: mean - 2 * stdDev,
          max: mean + 2 * stdDev,
        },
      };
    }

    return null;
  }

  /**
   * Recommandations par défaut
   */
  private getDefaultRecommendations(brand: {
    _count: { products: number; designs: number; orders: number };
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (brand._count.products < 5) {
      recommendations.push({
        id: 'rec-add-products',
        type: 'product',
        title: 'Ajouter plus de produits',
        description: 'Augmentez votre catalogue pour offrir plus de choix',
        impact: 'high',
        effort: 'medium',
        metrics: ['totalGenerations', 'revenue'],
      });
    }

    if (brand._count.designs > 0 && brand._count.orders / brand._count.designs < 0.1) {
      recommendations.push({
        id: 'rec-improve-conversion',
        type: 'operational',
        title: 'Améliorer le taux de conversion',
        description: 'Optimisez le parcours de personnalisation',
        impact: 'high',
        effort: 'medium',
        metrics: ['conversionRate'],
      });
    }

    return recommendations;
  }

  /**
   * Recommandations saisonnières
   */
  private getSeasonalRecommendations(eventName: string, daysUntil: number): string[] {
    const recommendations: string[] = [];

    if (daysUntil <= 14) {
      recommendations.push('Activer une campagne marketing urgente');
      recommendations.push('Vérifier les stocks de produits populaires');
    } else if (daysUntil <= 30) {
      recommendations.push(`Créer une collection spéciale ${eventName}`);
      recommendations.push('Préparer les templates de personnalisation');
    } else {
      recommendations.push('Analyser les performances de l\'année dernière');
      recommendations.push('Planifier les promotions');
    }

    return recommendations;
  }

  /**
   * Prédictions de fallback si données insuffisantes
   * Conforme au plan PHASE 2 - Prédictions: Fallback si données faibles
   */
  private async getFallbackPredictions(
    brandId: string,
    horizon: '7d' | '30d' | '90d',
  ): Promise<TrendPrediction[]> {
    this.logger.log(`Using fallback predictions for brand ${brandId} (insufficient data)`);

    // ✅ Récupérer au moins les dernières données disponibles
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await Promise.all([
      this.prisma.design.count({
        where: {
          brandId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          brandId,
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'SUCCEEDED',
        },
        _sum: { totalCents: true },
      }),
    ]).then(([designCount, revenueSum]) => {
      const revenue = revenueSum._sum.totalCents ? Number(revenueSum._sum.totalCents) / 100 : 0;

      const predictions: TrendPrediction[] = [];

      // ✅ Prédiction designs (stable si données limitées)
      if (designCount > 0) {
        predictions.push({
          metric: 'generations',
          currentValue: designCount,
          predictedValue: designCount, // Stable par défaut
          changePercent: 0,
          confidence: 0.2, // Très faible confiance
          trend: 'stable',
          horizon,
        });
      }

      // ✅ Prédiction revenue (stable si données limitées)
      if (revenue > 0) {
        predictions.push({
          metric: 'revenue',
          currentValue: revenue,
          predictedValue: revenue, // Stable par défaut
          changePercent: 0,
          confidence: 0.2, // Très faible confiance
          trend: 'stable',
          horizon,
        });
      }

      return predictions;
    }).catch((error) => {
      this.logger.error(`Failed to generate fallback predictions: ${error instanceof Error ? error.message : 'Unknown'}`);
      return []; // Retourner tableau vide en dernier recours
    });
  }
}
