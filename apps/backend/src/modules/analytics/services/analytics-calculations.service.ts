/**
 * ★★★ SERVICE - ANALYTICS CALCULATIONS ★★★
 * Service pour les calculs analytiques avancés (funnels, cohortes, prédictions)
 * Respecte les patterns existants du projet
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { FunnelData, CohortAnalysis } from '../interfaces/analytics-advanced.interface';

@Injectable()
export class AnalyticsCalculationsService {
  private readonly logger = new Logger(AnalyticsCalculationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule les données d'un funnel depuis les événements analytics
   */
  async calculateFunnelData(
    funnelId: string,
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FunnelData> {
    try {
      this.logger.log(`Calculating funnel data for funnel ${funnelId}`);

      // Récupérer le funnel
      const funnel = await this.prisma.analyticsFunnel.findUnique({
        where: { id: funnelId, brandId },
      });

      if (!funnel) {
        throw new Error(`Funnel ${funnelId} not found`);
      }

      const steps = Array.isArray(funnel.steps) ? funnel.steps : [];
      if (steps.length === 0) {
        return {
          funnelId,
          steps: [],
          totalConversion: 0,
        };
      }

      // Pour chaque étape, compter les événements
      const funnelSteps = await Promise.all(
        steps.map(async (step: any, index: number) => {
          const stepEventType = typeof step?.eventType === 'string' ? step.eventType : (step?.eventType as any)?.toString?.() || '';
          const eventCount = await this.prisma.analyticsEvent.count({
            where: {
              brandId,
              eventType: stepEventType,
              timestamp: { gte: startDate, lte: endDate },
            },
          });

          // Calculer la conversion par rapport à l'étape précédente
          let previousCount = eventCount;
          if (index > 0) {
            const previousStep = steps[index - 1] as any;
            const previousStepEventType = typeof previousStep?.eventType === 'string' 
              ? previousStep.eventType 
              : (previousStep?.eventType as any)?.toString?.() || '';
            previousCount = await this.prisma.analyticsEvent.count({
              where: {
                brandId,
                eventType: previousStepEventType,
                timestamp: { gte: startDate, lte: endDate },
              },
            });
          }

          const conversion = previousCount > 0 ? (eventCount / previousCount) * 100 : 100;
          const dropoff = previousCount > 0 ? ((previousCount - eventCount) / previousCount) * 100 : 0;

          return {
            stepId: step.id,
            stepName: step.name,
            users: eventCount,
            conversion: Math.round(conversion * 100) / 100,
            dropoff: Math.round(dropoff * 100) / 100,
            details: {
              eventType: step.eventType,
              previousStepUsers: previousCount,
            },
          };
        }),
      );

      // Calculer la conversion totale
      const firstStepUsers = funnelSteps[0]?.users || 1;
      const lastStepUsers = funnelSteps[funnelSteps.length - 1]?.users || 0;
      const totalConversion = (lastStepUsers / firstStepUsers) * 100;

      // Trouver le point de dropoff le plus important
      const dropoffPoint = funnelSteps.reduce(
        (max, step) => (step.dropoff > max.dropoff ? step : max),
        { dropoff: 0, stepName: '' },
      );

      return {
        funnelId,
        steps: funnelSteps,
        totalConversion: Math.round(totalConversion * 100) / 100,
        dropoffPoint: dropoffPoint.stepName,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate funnel data: ${error.message}`, error.stack);
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
    events1: Array<{ timestamp: Date; properties: any }>,
    events2: Array<{ timestamp: Date; properties: any }>,
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







