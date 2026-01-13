/**
 * ★★★ ML PREDICTION SERVICE ★★★
 * Service pour les prédictions ML (churn, LTV, conversion, etc.)
 * Structure préparée pour intégration de modèles ML réels
 * 
 * TODO: Intégrer avec TensorFlow.js, PyTorch, ou API ML externe (AWS SageMaker, Google AI Platform)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface MLPredictionRequest {
  type: 'churn' | 'ltv' | 'conversion' | 'engagement' | 'revenue';
  brandId?: string;
  userId?: string;
  features?: Record<string, any>;
}

export interface MLPredictionResult {
  type: string;
  value: number;
  confidence: number;
  period: string;
  factors: Array<{ name: string; impact: number }>;
  metadata?: Record<string, any>;
}

@Injectable()
export class MLPredictionService {
  private readonly logger = new Logger(MLPredictionService.name);
  private readonly mlApiUrl: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // TODO: Configure ML API endpoint (TensorFlow Serving, SageMaker, etc.)
    this.mlApiUrl = this.configService.get<string>('ML_API_URL') || null;
  }

  /**
   * Prédire le risque de churn pour un utilisateur
   * 
   * TODO: Implémenter avec modèle ML réel
   * - Entraîner modèle sur données historiques
   * - Features: engagement score, days since last login, plan, revenue, etc.
   * - Utiliser TensorFlow.js ou API ML externe
   */
  async predictChurn(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting churn for user: ${request.userId}`);

    if (!request.userId) {
      throw new Error('userId is required for churn prediction');
    }

    // TODO: Récupérer features réelles depuis la DB
    const features = await this.getChurnFeatures(request.userId);

    // TODO: Appeler modèle ML réel
    // const prediction = await this.callMLModel('churn', features);
    
    // Placeholder: Calcul basique basé sur heuristiques
    const churnRisk = this.calculateChurnRiskHeuristic(features);

    return {
      type: 'churn',
      value: churnRisk.risk,
      confidence: churnRisk.confidence,
      period: '30d',
      factors: churnRisk.factors,
      metadata: {
        method: 'heuristic',
        note: 'ML model not yet integrated - using heuristic calculation',
      },
    };
  }

  /**
   * Prédire la Lifetime Value (LTV) d'un utilisateur
   * 
   * TODO: Implémenter avec modèle ML réel
   * - Modèle de régression pour prédire revenus futurs
   * - Features: historique de commandes, engagement, plan, etc.
   */
  async predictLTV(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting LTV for user: ${request.userId}`);

    if (!request.userId) {
      throw new Error('userId is required for LTV prediction');
    }

    // TODO: Récupérer features réelles
    const features = await this.getLTVFeatures(request.userId);

    // TODO: Appeler modèle ML réel
    // const prediction = await this.callMLModel('ltv', features);
    
    // Placeholder: Calcul basique
    const ltv = this.calculateLTVHeuristic(features);

    return {
      type: 'ltv',
      value: ltv.value,
      confidence: ltv.confidence,
      period: '12m',
      factors: ltv.factors,
      metadata: {
        method: 'heuristic',
        note: 'ML model not yet integrated',
      },
    };
  }

  /**
   * Prédire la probabilité de conversion
   * 
   * TODO: Implémenter avec modèle ML réel
   * - Classification binaire (convertira ou non)
   * - Features: comportement utilisateur, source d'acquisition, etc.
   */
  async predictConversion(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting conversion for user: ${request.userId}`);

    if (!request.userId) {
      throw new Error('userId is required for conversion prediction');
    }

    const features = await this.getConversionFeatures(request.userId);
    const conversion = this.calculateConversionHeuristic(features);

    return {
      type: 'conversion',
      value: conversion.probability,
      confidence: conversion.confidence,
      period: '7d',
      factors: conversion.factors,
      metadata: {
        method: 'heuristic',
        note: 'ML model not yet integrated',
      },
    };
  }

  /**
   * Prédire le revenu futur
   * 
   * TODO: Implémenter avec modèle ML réel
   * - Time series forecasting (ARIMA, Prophet, LSTM)
   * - Features: historique de revenus, saisonnalité, événements, etc.
   */
  async predictRevenue(request: MLPredictionRequest): Promise<MLPredictionResult> {
    this.logger.log(`Predicting revenue for brand: ${request.brandId}`);

    if (!request.brandId) {
      throw new Error('brandId is required for revenue prediction');
    }

    const features = await this.getRevenueFeatures(request.brandId);
    const revenue = this.calculateRevenueHeuristic(features);

    return {
      type: 'revenue',
      value: revenue.value,
      confidence: revenue.confidence,
      period: '30d',
      factors: revenue.factors,
      metadata: {
        method: 'heuristic',
        note: 'ML model not yet integrated',
      },
    };
  }

  /**
   * Appeler un modèle ML externe (placeholder)
   * 
   * TODO: Implémenter selon l'infrastructure ML choisie:
   * - TensorFlow Serving: POST /v1/models/{model}:predict
   * - AWS SageMaker: InvokeEndpoint
   * - Google AI Platform: projects.predict
   * - PyTorch Serve: POST /predictions/{model}
   */
  private async callMLModel(
    modelType: string,
    features: Record<string, any>,
  ): Promise<any> {
    if (!this.mlApiUrl) {
      this.logger.warn('ML API URL not configured, using heuristic fallback');
      return null;
    }

    try {
      // TODO: Implémenter appel réel à l'API ML
      // const response = await fetch(`${this.mlApiUrl}/predict/${modelType}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ features }),
      // });
      // return await response.json();

      this.logger.warn(`ML API call not implemented for ${modelType}`);
      return null;
    } catch (error) {
      this.logger.error(`ML API call failed: ${error.message}`);
      return null;
    }
  }

  // ========================================
  // FEATURE EXTRACTION (pour modèles ML)
  // ========================================

  private async getChurnFeatures(userId: string): Promise<Record<string, any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brand: {
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const lastLogin = user.lastLoginAt || user.createdAt;
    const daysSinceLastLogin = Math.floor(
      (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      daysSinceLastLogin,
      totalOrders: user.orders.length,
      totalRevenue: user.orders.reduce((sum, o) => sum + (o.totalCents || 0), 0) / 100,
      currentPlan: user.brand?.subscriptionPlan || 'FREE',
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  private async getLTVFeatures(userId: string): Promise<Record<string, any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brand: {
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        orders: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      totalOrders: user.orders.length,
      avgOrderValue: user.orders.length > 0
        ? user.orders.reduce((sum, o) => sum + (o.totalCents || 0), 0) / user.orders.length / 100
        : 0,
      currentPlan: user.brand?.subscriptionPlan || 'FREE',
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  private async getConversionFeatures(userId: string): Promise<Record<string, any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        brand: {
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        orders: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      hasSubscription: user.brand?.subscriptionStatus === 'ACTIVE' || false,
      totalOrders: user.orders.length,
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  private async getRevenueFeatures(brandId: string): Promise<Record<string, any>> {
    const orders = await this.prisma.order.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: 90, // Last 90 days
    });

    const dailyRevenue = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (order.totalCents || 0) / 100;
      return acc;
    }, {} as Record<string, number>);

    return {
      historicalRevenue: Object.values(dailyRevenue),
      avgDailyRevenue: Object.values(dailyRevenue).reduce((a, b) => a + b, 0) / Object.keys(dailyRevenue).length || 0,
      trend: this.calculateTrend(Object.values(dailyRevenue)),
    };
  }

  // ========================================
  // HEURISTIC CALCULATIONS (fallback)
  // ========================================

  private calculateChurnRiskHeuristic(features: Record<string, any>): {
    risk: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    let risk = 0;
    const factors: Array<{ name: string; impact: number }> = [];

    // Days since last login
    if (features.daysSinceLastLogin > 30) {
      risk += 30;
      factors.push({ name: 'Inactive for 30+ days', impact: 30 });
    } else if (features.daysSinceLastLogin > 14) {
      risk += 15;
      factors.push({ name: 'Inactive for 14+ days', impact: 15 });
    }

    // No orders
    if (features.totalOrders === 0) {
      risk += 20;
      factors.push({ name: 'No orders placed', impact: 20 });
    }

    // Free plan
    if (features.currentPlan === 'free') {
      risk += 10;
      factors.push({ name: 'Free plan', impact: 10 });
    }

    return {
      risk: Math.min(risk, 100),
      confidence: 0.6, // Low confidence for heuristic
      factors,
    };
  }

  private calculateLTVHeuristic(features: Record<string, any>): {
    value: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    const baseLTV = features.avgOrderValue * 12; // Assume 12 orders per year
    const planMultiplier = features.currentPlan === 'pro' ? 1.5 : 1.0;

    return {
      value: baseLTV * planMultiplier,
      confidence: 0.5,
      factors: [
        { name: 'Average order value', impact: features.avgOrderValue },
        { name: 'Current plan', impact: planMultiplier },
      ],
    };
  }

  private calculateConversionHeuristic(features: Record<string, any>): {
    probability: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    let probability = 0;

    if (features.hasSubscription) {
      probability = 100; // Already converted
    } else if (features.totalOrders > 0) {
      probability = 70; // Has made purchases
    } else if (features.accountAge > 7) {
      probability = 40; // Active account
    } else {
      probability = 20; // New account
    }

    return {
      probability,
      confidence: 0.5,
      factors: [
        { name: 'Has subscription', impact: features.hasSubscription ? 50 : 0 },
        { name: 'Total orders', impact: features.totalOrders * 10 },
      ],
    };
  }

  private calculateRevenueHeuristic(features: Record<string, any>): {
    value: number;
    confidence: number;
    factors: Array<{ name: string; impact: number }>;
  } {
    const trend = features.trend || 0;
    const predictedRevenue = features.avgDailyRevenue * 30 * (1 + trend / 100);

    return {
      value: predictedRevenue,
      confidence: 0.6,
      factors: [
        { name: 'Average daily revenue', impact: features.avgDailyRevenue },
        { name: 'Trend', impact: trend },
      ],
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (firstAvg === 0) return 0;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }
}
