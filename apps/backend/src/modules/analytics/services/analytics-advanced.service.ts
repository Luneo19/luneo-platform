/**
 * ★★★ SERVICE - ANALYTICS AVANCÉES ★★★
 * Service pour analytics avancées (funnels, cohortes, segments, prédictions)
 * Respecte les patterns existants du projet
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AnalyticsCalculationsService } from './analytics-calculations.service';
import { Prisma } from '@prisma/client';
import {
  Funnel,
  FunnelData,
  Cohort,
  CohortAnalysis,
  Segment,
  Prediction,
  RevenuePrediction,
  Correlation,
  Anomaly,
  AnalyticsAdvancedFilters,
} from '../interfaces/analytics-advanced.interface';

@Injectable()
export class AnalyticsAdvancedService {
  private readonly logger = new Logger(AnalyticsAdvancedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationsService: AnalyticsCalculationsService,
  ) {}

  // ========================================
  // FUNNELS
  // ========================================

  /**
   * Récupère tous les funnels d'une marque
   */
  async getFunnels(brandId: string): Promise<Funnel[]> {
    try {
      this.logger.log(`Getting funnels for brand: ${brandId}`);

      // Récupérer les funnels depuis Prisma
      const funnels = await this.prisma.analyticsFunnel.findMany({
        where: {
          brandId,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformer les données Prisma en format Funnel
      return funnels.map((funnel) => {
        const steps = Array.isArray(funnel.steps) ? funnel.steps : [];
        return {
          id: funnel.id,
          name: funnel.name,
          description: funnel.description || undefined,
          steps: steps.map((step: unknown, index: number) => {
            const stepObj = step as Record<string, unknown>;
            return {
              id: (stepObj.id as string) || `step-${index + 1}`,
              name: (stepObj.name as string) || 'Step',
              eventType: (stepObj.eventType as string) || '',
              order: (stepObj.order as number) || index + 1,
              description: (stepObj.description as string) || undefined,
            };
          }),
          isActive: funnel.isActive,
          brandId: funnel.brandId,
          createdAt: funnel.createdAt,
          updatedAt: funnel.updatedAt,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get funnels: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les données d'un funnel spécifique
   */
  async getFunnelData(funnelId: string, brandId: string, filters?: AnalyticsAdvancedFilters): Promise<FunnelData> {
    try {
      this.logger.log(`Getting funnel data for funnel: ${funnelId}, brand: ${brandId}`);

      // Calculer les dates
      const endDate = filters?.endDate || new Date();
      const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Utiliser le service de calculs
      return await this.calculationsService.calculateFunnelData(funnelId, brandId, startDate, endDate);
    } catch (error) {
      this.logger.error(`Failed to get funnel data: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Récupère les données d'un funnel spécifique (ancienne méthode mockée - à supprimer)
   */
  private async getFunnelDataMocked(funnelId: string, brandId: string, filters?: AnalyticsAdvancedFilters): Promise<FunnelData> {
      const mockData: FunnelData = {
        funnelId,
        steps: [
          {
            stepId: 'step-1',
            stepName: 'Email envoyé',
            users: 50000,
            conversion: 100,
            dropoff: 0,
            details: { opens: 34250, clicks: 12500 },
          },
          {
            stepId: 'step-2',
            stepName: 'Email ouvert',
            users: 34250,
            conversion: 68.5,
            dropoff: 0,
            details: { openRate: 68.5 },
          },
          {
            stepId: 'step-3',
            stepName: 'Lien cliqué',
            users: 12500,
            conversion: 25.0,
            dropoff: 0,
            details: { clickRate: 25.0 },
          },
          {
            stepId: 'step-4',
            stepName: 'Landing page visitée',
            users: 11250,
            conversion: 22.5,
            dropoff: 2.5,
            details: { bounceRate: 2.5 },
          },
          {
            stepId: 'step-5',
            stepName: 'Formulaire commencé',
            users: 5670,
            conversion: 11.3,
            dropoff: 11.2,
            details: { completionRate: 50.4 },
          },
          {
            stepId: 'step-6',
            stepName: 'Inscription complétée',
            users: 4560,
            conversion: 9.1,
            dropoff: 2.2,
            details: { successRate: 80.4 },
          },
        ],
        totalConversion: 9.1,
        dropoffPoint: 'Formulaire commencé',
      };

      return mockData;
  }

  /**
   * Crée un nouveau funnel
   */
  async createFunnel(brandId: string, data: Omit<Funnel, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>): Promise<Funnel> {
    try {
      this.logger.log(`Creating funnel for brand: ${brandId}`);

      // Créer le funnel dans Prisma
      const funnel = await this.prisma.analyticsFunnel.create({
        data: {
          name: data.name,
          description: data.description,
          steps: data.steps as unknown as Prisma.InputJsonValue,
          isActive: data.isActive,
          brandId,
        },
      });

      // Transformer en format Funnel
      const steps = Array.isArray(funnel.steps) ? funnel.steps : [];
      return {
        id: funnel.id,
        name: funnel.name,
        description: funnel.description || undefined,
        steps: steps.map((step: unknown, index: number) => {
          const stepObj = step as Record<string, unknown>;
          return {
            id: (stepObj.id as string) || `step-${index + 1}`,
            name: (stepObj.name as string) || 'Step',
            eventType: (stepObj.eventType as string) || '',
            order: (stepObj.order as number) || index + 1,
            description: (stepObj.description as string) || undefined,
          };
        }),
        isActive: funnel.isActive,
        brandId: funnel.brandId,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create funnel: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // COHORTES
  // ========================================

  /**
   * Récupère les analyses de cohortes
   */
  async getCohorts(brandId: string, filters?: AnalyticsAdvancedFilters): Promise<CohortAnalysis> {
    try {
      this.logger.log(`Getting cohorts for brand: ${brandId}`);

      // Calculer les dates
      const endDate = filters?.endDate || new Date();
      const startDate = filters?.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      // Utiliser le service de calculs
      return await this.calculationsService.calculateCohorts(brandId, startDate, endDate);
    } catch (error) {
      this.logger.error(`Failed to get cohorts: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Récupère les analyses de cohortes (ancienne méthode mockée - à supprimer)
   */
  private async getCohortsMocked(brandId: string, filters?: AnalyticsAdvancedFilters): Promise<CohortAnalysis> {
      const mockAnalysis: CohortAnalysis = {
        cohorts: [
          {
            cohort: 'Jan 2024',
            users: 12500,
            retention30: 45.2,
            retention90: 28.5,
            ltv: 145.80,
            revenue: 1822500,
          },
          {
            cohort: 'Fév 2024',
            users: 8900,
            retention30: 38.7,
            retention90: 22.3,
            ltv: 125.30,
            revenue: 1115170,
          },
          {
            cohort: 'Mar 2024',
            users: 6700,
            retention30: 32.5,
            retention90: 18.2,
            ltv: 98.50,
            revenue: 659950,
          },
        ],
        trends: {
          retention: 'down',
          revenue: 'down',
        },
      };

      return mockAnalysis;
  }

  /**
   * Calcule les prédictions de rétention pour une cohorte
   */
  async getRetentionPredictions(brandId: string): Promise<Array<{
    cohort: string;
    current: number;
    predicted30: number;
    predicted90: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }>> {
    try {
      this.logger.log(`Getting retention predictions for brand: ${brandId}`);

      // TODO: Implémenter avec ML models
      return [
        {
          cohort: 'Avril 2024 (prédit)',
          current: 87.2,
          predicted30: 65.8,
          predicted90: 45.3,
          confidence: 92.5,
          trend: 'up',
        },
        {
          cohort: 'Mai 2024 (prédit)',
          current: 89.5,
          predicted30: 68.2,
          predicted90: 47.8,
          confidence: 89.3,
          trend: 'up',
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to get retention predictions: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // SEGMENTS
  // ========================================

  /**
   * Récupère tous les segments d'une marque
   */
  async getSegments(brandId: string): Promise<Segment[]> {
    try {
      this.logger.log(`Getting segments for brand: ${brandId}`);

      // Récupérer les segments depuis Prisma
      const segments = await this.prisma.analyticsSegment.findMany({
        where: {
          brandId,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformer les données Prisma en format Segment
      return segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        description: segment.description || undefined,
        criteria: (segment.criteria as Record<string, unknown>) || {},
        userCount: segment.userCount,
        isActive: segment.isActive,
        brandId: segment.brandId,
        createdAt: segment.createdAt,
        updatedAt: segment.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to get segments: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Crée un nouveau segment
   */
  async createSegment(brandId: string, data: Omit<Segment, 'id' | 'brandId' | 'userCount' | 'createdAt' | 'updatedAt'>): Promise<Segment> {
    try {
      this.logger.log(`Creating segment for brand: ${brandId}`);

      // Créer le segment dans Prisma
      const segment = await this.prisma.analyticsSegment.create({
        data: {
          name: data.name,
          description: data.description,
          criteria: data.criteria as Prisma.InputJsonValue,
          isActive: data.isActive,
          brandId,
          userCount: 0, // Sera calculé après création
        },
      });

      // TODO: Calculer userCount en fonction des critères
      // Pour l'instant, on retourne 0

      return {
        id: segment.id,
        name: segment.name,
        description: segment.description || undefined,
        criteria: (segment.criteria as Record<string, unknown>) || {},
        userCount: segment.userCount,
        isActive: segment.isActive,
        brandId: segment.brandId,
        createdAt: segment.createdAt,
        updatedAt: segment.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create segment: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // PRÉDICTIONS
  // ========================================

  /**
   * Récupère les prédictions de revenus
   */
  async getRevenuePredictions(brandId: string): Promise<RevenuePrediction[]> {
    try {
      this.logger.log(`Getting revenue predictions for brand: ${brandId}`);

      // TODO: Implémenter avec ML models
      return [
        {
          scenario: 'conservative',
          revenue: 125450,
          probability: 35,
          factors: ['Croissance normale 5%', 'Pas de changement majeur', 'Saisonnalité attendue'],
          confidence: 92.5,
        },
        {
          scenario: 'optimistic',
          revenue: 187230,
          probability: 45,
          factors: ['Nouvelle campagne réussie', 'Optimisation conversion +10%', 'Croissance organique +15%'],
          confidence: 87.3,
        },
        {
          scenario: 'very_optimistic',
          revenue: 245680,
          probability: 20,
          factors: ['Viralité sur réseaux sociaux', 'Nouveau produit lancé', 'Partenariats stratégiques'],
          confidence: 78.5,
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to get revenue predictions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les prédictions par segment
   */
  async getSegmentPredictions(brandId: string): Promise<Array<{
    segment: string;
    current: string;
    predicted7d: string;
    predicted30d: string;
    growth7d: string;
    growth30d: string;
    confidence: number;
    factors: string[];
  }>> {
    try {
      this.logger.log(`Getting segment predictions for brand: ${brandId}`);

      // TODO: Implémenter avec ML models
      return [
        {
          segment: 'Nouveaux Utilisateurs',
          current: '€45,230',
          predicted7d: '€52,180',
          predicted30d: '€78,450',
          growth7d: '+15.4%',
          growth30d: '+73.5%',
          confidence: 89.2,
          factors: ['Croissance organique', 'Nouveaux canaux'],
        },
        {
          segment: 'Utilisateurs Récurrents',
          current: '€78,450',
          predicted7d: '€89,230',
          predicted30d: '€125,670',
          growth7d: '+13.7%',
          growth30d: '+60.2%',
          confidence: 92.5,
          factors: ['Rétention élevée', 'Panier moyen stable'],
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to get segment predictions: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========================================
  // CORRÉLATIONS
  // ========================================

  /**
   * Récupère les corrélations entre métriques
   */
  async getCorrelations(brandId: string, filters?: AnalyticsAdvancedFilters): Promise<Correlation[]> {
    try {
      this.logger.log(`Getting correlations for brand: ${brandId}`);

      // Calculer les dates
      const endDate = filters?.endDate || new Date();
      const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Récupérer les types d'événements uniques
      const eventTypes = await this.prisma.analyticsEvent.findMany({
        where: {
          brandId,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { eventType: true },
        distinct: ['eventType'],
        take: 10, // Limiter pour performance
      });

      // Calculer les corrélations entre les paires de métriques
      const correlations: Correlation[] = [];
      for (let i = 0; i < eventTypes.length; i++) {
        for (let j = i + 1; j < eventTypes.length; j++) {
          const correlation = await this.calculationsService.calculateCorrelation(
            brandId,
            eventTypes[i].eventType,
            eventTypes[j].eventType,
            startDate,
            endDate,
          );

          correlations.push({
            metric1: eventTypes[i].eventType,
            metric2: eventTypes[j].eventType,
            ...correlation,
          });
        }
      }

      // Trier par corrélation absolue décroissante
      return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    } catch (error) {
      this.logger.error(`Failed to get correlations: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Récupère les corrélations entre métriques (ancienne méthode mockée - à supprimer)
   */
  private async getCorrelationsMocked(brandId: string): Promise<Correlation[]> {
      return [
        {
          metric1: 'Temps sur site',
          metric2: 'Taux de conversion',
          correlation: 0.78,
          significance: 'high',
          insight: 'Les utilisateurs qui restent plus longtemps convertissent mieux',
        },
        {
          metric1: 'Taux de rebond',
          metric2: 'Taux de conversion',
          correlation: -0.72,
          significance: 'high',
          insight: 'Taux de rebond élevé = conversion faible (attendu)',
        },
      ];
  }

  // ========================================
  // ANOMALIES
  // ========================================

  /**
   * Détecte les anomalies dans les données
   */
  async getAnomalies(brandId: string, filters?: AnalyticsAdvancedFilters): Promise<Anomaly[]> {
    try {
      this.logger.log(`Getting anomalies for brand: ${brandId}`);

      // Calculer les dates
      const endDate = filters?.endDate || new Date();
      const startDate = filters?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Utiliser le service de calculs
      return await this.calculationsService.detectAnomalies(brandId, startDate, endDate);
    } catch (error) {
      this.logger.error(`Failed to get anomalies: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Détecte les anomalies dans les données (ancienne méthode mockée - à supprimer)
   */
  private async getAnomaliesMocked(brandId: string): Promise<Anomaly[]> {
      return [
        {
          id: 'anomaly-1',
          type: 'Spike de revenus',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
          value: '+45%',
          expected: '+5%',
          severity: 'high',
          cause: 'Campagne email réussie',
          action: 'Analyser et répliquer',
        },
        {
          id: 'anomaly-2',
          type: 'Drop de conversion',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
          value: '-18%',
          expected: 'Stable',
          severity: 'high',
          cause: 'Problème technique détecté',
          action: 'Vérifier infrastructure',
        },
      ];
  }

  // ========================================
  // BENCHMARKS & SAISONNALITÉ
  // ========================================

  /**
   * Récupère les benchmarks de l'industrie
   */
  async getBenchmarks(brandId: string): Promise<Array<{
    metric: string;
    yourValue: number;
    industryAvg: number;
    industryTop: number;
    percentile: number;
    status: 'above' | 'below';
  }>> {
    try {
      this.logger.log(`Getting benchmarks for brand: ${brandId}`);

      // TODO: Implémenter avec données benchmarks
      return [
        {
          metric: 'Taux de conversion',
          yourValue: 3.42,
          industryAvg: 2.86,
          industryTop: 5.2,
          percentile: 72,
          status: 'above',
        },
        {
          metric: 'Panier moyen',
          yourValue: 87.50,
          industryAvg: 78.30,
          industryTop: 125.00,
          percentile: 65,
          status: 'above',
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to get benchmarks: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les analyses de saisonnalité
   */
  async getSeasonality(brandId: string): Promise<{
    patterns: Array<{
      pattern: string;
      period: string;
      impact: string;
      confidence: number;
    }>;
    forecasts: Array<{
      period: string;
      forecast: string;
      trend: string;
      reason: string;
      confidence: number;
    }>;
  }> {
    try {
      this.logger.log(`Getting seasonality for brand: ${brandId}`);

      // TODO: Implémenter avec analyses temporelles
      return {
        patterns: [
          {
            pattern: 'Pic hebdomadaire',
            period: 'Vendredi-Samedi',
            impact: '+35% revenus',
            confidence: 96.2,
          },
          {
            pattern: 'Saisonnalité annuelle',
            period: 'Novembre-Décembre',
            impact: '+125% revenus',
            confidence: 98.7,
          },
        ],
        forecasts: [
          {
            period: 'Semaine prochaine',
            forecast: '€145,230',
            trend: '+12.5%',
            reason: 'Pic hebdomadaire attendu',
            confidence: 87.3,
          },
          {
            period: 'Mois prochain',
            forecast: '€612,450',
            trend: '+8.2%',
            reason: 'Saisonnalité positive',
            confidence: 92.1,
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get seasonality: ${error.message}`, error.stack);
      throw error;
    }
  }
}

