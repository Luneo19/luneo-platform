/**
 * ★★★ SERVICE - ANALYTICS CALCULATIONS ★★★
 * Service pour les calculs analytiques avancés (funnels, cohortes, prédictions)
 * Respecte les patterns existants du projet
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { FunnelData, CohortAnalysis } from '../interfaces/analytics-advanced.interface';

@Injectable()
export class AnalyticsCalculationsService {
  private readonly logger = new Logger(AnalyticsCalculationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule les données d'un funnel depuis les événements analytics
   * Conforme au plan PHASE 2 - Analytics & BI - Activer funnels réels
   * Amélioré pour suivre les utilisateurs uniques plutôt que juste compter les événements
   */
  async calculateFunnelData(
    funnelId: string,
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FunnelData> {
    // ✅ Validation des entrées
    if (!funnelId || typeof funnelId !== 'string' || funnelId.trim().length === 0) {
      throw new BadRequestException('Funnel ID is required');
    }

    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!(startDate instanceof Date) || !(endDate instanceof Date) || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Valid start and end dates are required');
    }

    if (startDate.getTime() >= endDate.getTime()) {
      throw new BadRequestException('Start date must be before end date');
    }

    try {
      this.logger.log(`Calculating funnel data for funnel ${funnelId}, brand ${brandId}, period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // ✅ Récupérer le funnel avec validation
      const funnel = await this.prisma.analyticsFunnel.findUnique({
        where: { id: funnelId.trim(), brandId: brandId.trim() },
      });

      if (!funnel) {
        throw new NotFoundException(`Funnel ${funnelId} not found for brand ${brandId}`);
      }

      // ✅ Normaliser les steps avec gardes
      const steps = Array.isArray(funnel.steps) && funnel.steps.length > 0
        ? funnel.steps
        : [];

      if (steps.length === 0) {
        this.logger.warn(`Funnel ${funnelId} has no steps defined`);
        return {
          funnelId,
          steps: [],
          totalConversion: 0,
        };
      }

      // ✅ Pour chaque étape, compter les utilisateurs uniques (pas juste les événements)
      const funnelSteps = await Promise.all(
        steps.map(async (step: unknown, index: number) => {
          // ✅ Validation et normalisation de l'étape
          if (!step || typeof step !== 'object') {
            throw new BadRequestException(`Invalid step at index ${index}`);
          }

          const stepObj = step as { id?: string; name?: string; eventType?: string; order?: number };
          const stepEventType = typeof stepObj.eventType === 'string' && stepObj.eventType.trim().length > 0
            ? stepObj.eventType.trim()
            : '';

          if (!stepEventType) {
            throw new BadRequestException(`Step at index ${index} has no eventType`);
          }

          // ✅ Compter les utilisateurs uniques pour cette étape (amélioration PHASE 2)
          const uniqueUsers = await this.prisma.analyticsEvent.findMany({
            where: {
              brandId: brandId.trim(),
              eventType: stepEventType,
              timestamp: { gte: startDate, lte: endDate },
            },
            select: { userId: true },
            distinct: ['userId'],
          });

          const userCount = uniqueUsers.filter((e) => e.userId && typeof e.userId === 'string').length;

          // ✅ Calculer la conversion par rapport à l'étape précédente
          let previousUserCount = userCount;
          if (index > 0) {
            const previousStep = steps[index - 1] as unknown;
            if (!previousStep || typeof previousStep !== 'object') {
              throw new BadRequestException(`Invalid previous step at index ${index - 1}`);
            }

            const previousStepObj = previousStep as { eventType?: string };
            const previousStepEventType = typeof previousStepObj.eventType === 'string' && previousStepObj.eventType.trim().length > 0
              ? previousStepObj.eventType.trim()
              : '';

            if (previousStepEventType) {
              const previousUniqueUsers = await this.prisma.analyticsEvent.findMany({
                where: {
                  brandId: brandId.trim(),
                  eventType: previousStepEventType,
                  timestamp: { gte: startDate, lte: endDate },
                },
                select: { userId: true },
                distinct: ['userId'],
              });

              previousUserCount = previousUniqueUsers.filter((e) => e.userId && typeof e.userId === 'string').length;
            }
          }

          // ✅ Calculer conversion et dropoff avec gardes
          const conversion = previousUserCount > 0
            ? Math.round((userCount / previousUserCount) * 100 * 100) / 100
            : userCount > 0 ? 100 : 0;

          const dropoff = previousUserCount > 0
            ? Math.round(((previousUserCount - userCount) / previousUserCount) * 100 * 100) / 100
            : 0;

          return {
            stepId: typeof stepObj.id === 'string' ? stepObj.id : `step-${index}`,
            stepName: typeof stepObj.name === 'string' ? stepObj.name : `Step ${index + 1}`,
            users: userCount,
            conversion,
            dropoff,
            details: {
              eventType: stepEventType,
              previousStepUsers: previousUserCount,
            },
          };
        }),
      );

      // ✅ Calculer la conversion totale avec gardes
      const firstStepUsers = funnelSteps[0]?.users || 0;
      const lastStepUsers = funnelSteps[funnelSteps.length - 1]?.users || 0;
      const totalConversion = firstStepUsers > 0
        ? Math.round((lastStepUsers / firstStepUsers) * 100 * 100) / 100
        : 0;

      // ✅ Trouver le point de dropoff le plus important
      const dropoffPoint = funnelSteps.length > 0
        ? funnelSteps.reduce(
            (max, step) => (step.dropoff > max.dropoff ? step : max),
            { dropoff: 0, stepName: '' },
          ).stepName
        : undefined;

      return {
        funnelId,
        steps: funnelSteps,
        totalConversion,
        dropoffPoint,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate funnel data: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Calcule les analyses de cohortes depuis les données réelles
   */
  async calculateCohorts(
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CohortAnalysis> {
    try {
      this.logger.log(`Calculating cohorts for brand ${brandId}`);

      // Récupérer les cohortes depuis la base de données
      const cohorts = await this.prisma.analyticsCohort.findMany({
        where: {
          brandId,
          cohortDate: { gte: startDate, lte: endDate },
        },
        orderBy: { cohortDate: 'desc' },
      });

      // Formater les cohortes
      const formattedCohorts = cohorts.map(cohort => {
        // Trouver les cohortes pour les périodes 30 et 90 jours
        const retention30 = cohorts.find(
          c => c.cohortDate.getTime() === cohort.cohortDate.getTime() && c.period === 30,
        )?.retention || 0;
        const retention90 = cohorts.find(
          c => c.cohortDate.getTime() === cohort.cohortDate.getTime() && c.period === 90,
        )?.retention || 0;

        return {
          cohort: new Date(cohort.cohortDate).toLocaleDateString('fr-FR', {
            month: 'short',
            year: 'numeric',
          }),
          users: cohort.userCount,
          retention30,
          retention90,
          ltv: cohort.userCount > 0 ? cohort.revenue / cohort.userCount : 0,
          revenue: cohort.revenue,
        };
      });

      // Calculer les tendances
      const trends = {
        retention: 'stable' as 'up' | 'down' | 'stable',
        revenue: 'stable' as 'up' | 'down' | 'stable',
      };

      if (cohorts.length >= 2) {
        const latest = cohorts[0];
        const previous = cohorts[1];
        trends.retention =
          latest.retention > previous.retention
            ? 'up'
            : latest.retention < previous.retention
              ? 'down'
              : 'stable';
        trends.revenue =
          latest.revenue > previous.revenue
            ? 'up'
            : latest.revenue < previous.revenue
              ? 'down'
              : 'stable';
      }

      return {
        cohorts: formattedCohorts,
        trends,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate cohorts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calcule les corrélations entre deux métriques
   */
  async calculateCorrelation(
    brandId: string,
    metric1: string,
    metric2: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    correlation: number;
    significance: 'high' | 'medium' | 'low';
    insight: string;
  }> {
    try {
      this.logger.log(`Calculating correlation between ${metric1} and ${metric2}`);

      // Récupérer les événements pour les deux métriques
      const events1 = await this.prisma.analyticsEvent.findMany({
        where: {
          brandId,
          eventType: metric1,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { timestamp: true, properties: true },
      });

      const events2 = await this.prisma.analyticsEvent.findMany({
        where: {
          brandId,
          eventType: metric2,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { timestamp: true, properties: true },
      });

      // Calculer la corrélation (simplifié - utiliser une vraie formule statistique en production)
      const correlation = this.calculatePearsonCorrelation(events1, events2);

      // Déterminer la significativité
      const significance =
        Math.abs(correlation) > 0.7 ? 'high' : Math.abs(correlation) > 0.4 ? 'medium' : 'low';

      // Générer un insight
      const insight = this.generateCorrelationInsight(metric1, metric2, correlation, significance);

      return {
        correlation: Math.round(correlation * 100) / 100,
        significance,
        insight,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate correlation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Détecte les anomalies dans les données
   */
  async detectAnomalies(
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{
    id: string;
    type: string;
    date: Date;
    value: string;
    expected: string;
    severity: 'high' | 'medium' | 'low';
    cause: string;
    action: string;
  }>> {
    try {
      this.logger.log(`Detecting anomalies for brand ${brandId}`);

      // Récupérer les événements
      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          brandId,
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { eventType: true, timestamp: true, properties: true },
      });

      // Grouper par type d'événement et par jour
      const eventsByType = events.reduce((acc, event) => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        const key = `${event.eventType}_${date}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculer les moyennes et écarts-types
      const anomalies: Array<{
        id: string;
        type: string;
        date: Date;
        value: string;
        expected: string;
        severity: 'high' | 'medium' | 'low';
        cause: string;
        action: string;
      }> = [];

      // Détecter les spikes (simplifié - utiliser ML en production)
      const values = Object.values(eventsByType);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length,
      );

      for (const [key, count] of Object.entries(eventsByType)) {
        if (count > mean + 2 * stdDev) {
          const [eventType, dateStr] = key.split('_');
          anomalies.push({
            id: `anomaly-${key}`,
            type: `Spike de ${eventType}`,
            date: new Date(dateStr),
            value: `+${Math.round(((count - mean) / mean) * 100)}%`,
            expected: `${Math.round(mean)}`,
            severity: count > mean + 3 * stdDev ? 'high' : 'medium',
            cause: 'Variation anormale détectée',
            action: 'Analyser les causes et répliquer si positif',
          });
        }
      }

      return anomalies;
    } catch (error) {
      this.logger.error(`Failed to detect anomalies: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calcule la corrélation de Pearson (simplifié)
   */
  private calculatePearsonCorrelation(
    events1: Array<{ timestamp: Date; properties: Prisma.JsonValue }>,
    events2: Array<{ timestamp: Date; properties: Prisma.JsonValue }>,
  ): number {
    // Simplification : compter les événements par jour et calculer la corrélation
    const daily1 = this.groupEventsByDay(events1);
    const daily2 = this.groupEventsByDay(events2);

    const days = Array.from(new Set([...Object.keys(daily1), ...Object.keys(daily2)]));
    const values1 = days.map(day => daily1[day] || 0);
    const values2 = days.map(day => daily2[day] || 0);

    if (values1.length === 0 || values2.length === 0) return 0;

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Groupe les événements par jour
   */
  private groupEventsByDay(events: Array<{ timestamp: Date }>): Record<string, number> {
    return events.reduce((acc, event) => {
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Génère un insight basé sur la corrélation
   */
  private generateCorrelationInsight(
    metric1: string,
    metric2: string,
    correlation: number,
    significance: 'high' | 'medium' | 'low',
  ): string {
    if (Math.abs(correlation) < 0.3) {
      return `Pas de corrélation significative entre ${metric1} et ${metric2}`;
    }

    const direction = correlation > 0 ? 'augmente' : 'diminue';
    const strength = significance === 'high' ? 'fortement' : significance === 'medium' ? 'modérément' : 'légèrement';

    return `Quand ${metric1} ${direction}, ${metric2} ${direction} également (corrélation ${strength} ${correlation > 0 ? 'positive' : 'négative'})`;
  }
}







