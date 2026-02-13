/**
 * ★★★ SERVICE - ANALYTICS AVANCÉES ★★★
 * Service pour analytics avancées (funnels, cohortes, segments, prédictions)
 * Respecte les patterns existants du projet
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AnalyticsCalculationsService } from './analytics-calculations.service';
import { Prisma, UserRole } from '@prisma/client';
import {
  Funnel,
  FunnelData,
  FunnelWithConversionData,
  FunnelStepConversion,
  Cohort,
  CohortAnalysis,
  Segment,
  Prediction,
  RevenuePrediction,
  Correlation,
  Anomaly,
  AnalyticsAdvancedFilters,
} from '../interfaces/analytics-advanced.interface';

// ============================================================================
// TYPES STRICTS POUR ANALYTICS AVANCÉES
// ============================================================================

/**
 * Étape de funnel depuis Prisma (JSON)
 */
interface FunnelStepFromPrisma {
  id?: string;
  name?: string;
  eventType?: string;
  order?: number;
  description?: string;
}

/**
 * Critères de segment depuis Prisma (JSON)
 */
interface SegmentCriteria {
  [key: string]: unknown;
}

/**
 * Prédiction de rétention
 */
interface RetentionPrediction {
  cohort: string;
  current: number;
  predicted30: number;
  predicted90: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Prédiction par segment
 */
interface SegmentPrediction {
  segment: string;
  current: string;
  predicted7d: string;
  predicted30d: string;
  growth7d: string;
  growth30d: string;
  confidence: number;
  factors: string[];
}

/**
 * Benchmark de métrique
 */
interface MetricBenchmark {
  metric: string;
  yourValue: number;
  industryAvg: number;
  industryTop: number;
  percentile: number;
  status: 'above' | 'below';
}

/**
 * Pattern de saisonnalité
 */
interface SeasonalityPattern {
  pattern: string;
  period: string;
  impact: string;
  confidence: number;
}

/**
 * Prévision de saisonnalité
 */
interface SeasonalityForecast {
  period: string;
  forecast: string;
  trend: string;
  reason: string;
  confidence: number;
}

/**
 * Analyse de saisonnalité complète
 */
interface SeasonalityAnalysis {
  patterns: SeasonalityPattern[];
  forecasts: SeasonalityForecast[];
}

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
   * Récupère tous les funnels d'une marque avec conversion réelle depuis AnalyticsEvent
   */
  async getFunnels(
    brandId: string,
    options?: { dateFrom?: Date; dateTo?: Date },
  ): Promise<FunnelWithConversionData[]> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getFunnels');
      throw new BadRequestException('Brand ID is required');
    }

    const trimmedBrandId = brandId.trim();

    try {
      this.logger.log(`Getting funnels with conversion data for brand: ${trimmedBrandId}`);

      const funnels = await this.prisma.analyticsFunnel.findMany({
        where: { brandId: trimmedBrandId, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const dateFrom = options?.dateFrom;
      const dateTo = options?.dateTo;

      const results: FunnelWithConversionData[] = [];

      for (const funnel of funnels) {
        const rawSteps = Array.isArray(funnel.steps) ? funnel.steps : [];
        const sortedSteps = [...rawSteps].sort(
          (a: unknown, b: unknown) =>
            (typeof (a as { order?: number }).order === 'number' ? (a as { order: number }).order : 0) -
            (typeof (b as { order?: number }).order === 'number' ? (b as { order: number }).order : 0),
        );

        const stepResults: FunnelStepConversion[] = [];
        let previousCount = 0;

        for (const step of sortedSteps) {
          const stepObj = step as Partial<FunnelStepFromPrisma>;
          const eventType =
            typeof stepObj?.eventType === 'string' && stepObj.eventType.trim().length > 0
              ? stepObj.eventType.trim()
              : '';
          const stepName =
            typeof stepObj?.name === 'string' && stepObj.name.trim().length > 0
              ? stepObj.name.trim()
              : 'Step';

          const timestampFilter =
            dateFrom && dateTo
              ? { gte: dateFrom, lte: dateTo }
              : dateFrom
                ? { gte: dateFrom }
                : dateTo
                  ? { lte: dateTo }
                  : undefined;

          const count =
            eventType === ''
              ? 0
              : await this.prisma.analyticsEvent.count({
                  where: {
                    brandId: trimmedBrandId,
                    eventType,
                    ...(timestampFilter && { timestamp: timestampFilter }),
                  },
                });

          const conversionRate =
            previousCount > 0 ? Math.round((count / previousCount) * 100 * 100) / 100 : count > 0 ? 100 : 0;
          const dropoffRate =
            previousCount > 0 ? Math.round(((previousCount - count) / previousCount) * 100 * 100) / 100 : 0;

          stepResults.push({
            name: stepName,
            eventType: eventType || '',
            count,
            conversionRate,
            dropoffRate,
          });
          previousCount = count;
        }

        const firstCount = stepResults[0]?.count ?? 0;
        const lastCount = stepResults.length > 0 ? stepResults[stepResults.length - 1]?.count ?? 0 : 0;
        const overallConversion =
          stepResults.length > 1 && firstCount > 0 ? Math.round((lastCount / firstCount) * 100 * 100) / 100 : 0;

        results.push({
          id: funnel.id,
          name: funnel.name ?? 'Unnamed Funnel',
          isActive: Boolean(funnel.isActive),
          steps: stepResults,
          overallConversion,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to get funnels: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Normalise un funnel depuis Prisma avec gardes
   */
  private normalizeFunnel(funnel: {
    id: string;
    name: string;
    description: string | null;
    steps: Prisma.JsonValue;
    isActive: boolean;
    brandId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Funnel {
    const steps = Array.isArray(funnel.steps) ? funnel.steps : [];

    return {
      id: funnel.id ?? '',
      name: funnel.name ?? 'Unnamed Funnel',
      description: funnel.description && typeof funnel.description === 'string' && funnel.description.trim().length > 0
        ? funnel.description.trim()
        : undefined,
      steps: steps.map((step: unknown, index: number) => this.normalizeFunnelStep(step, index)),
      isActive: Boolean(funnel.isActive),
      brandId: funnel.brandId ?? '',
      createdAt: funnel.createdAt,
      updatedAt: funnel.updatedAt,
    };
  }

  /**
   * Normalise une étape de funnel avec gardes
   */
  private normalizeFunnelStep(step: unknown, index: number): Funnel['steps'][0] {
    if (!step || typeof step !== 'object') {
      return {
        id: `step-${index + 1}`,
        name: 'Step',
        eventType: '',
        order: index + 1,
      };
    }

    const stepObj = step as Partial<FunnelStepFromPrisma>;

    return {
      id: typeof stepObj.id === 'string' && stepObj.id.trim().length > 0
        ? stepObj.id.trim()
        : `step-${index + 1}`,
      name: typeof stepObj.name === 'string' && stepObj.name.trim().length > 0
        ? stepObj.name.trim()
        : 'Step',
      eventType: typeof stepObj.eventType === 'string' && stepObj.eventType.trim().length > 0
        ? stepObj.eventType.trim()
        : '',
      order: typeof stepObj.order === 'number' && stepObj.order > 0
        ? stepObj.order
        : index + 1,
      description: typeof stepObj.description === 'string' && stepObj.description.trim().length > 0
        ? stepObj.description.trim()
        : undefined,
    };
  }

  /**
   * Récupère les données d'un funnel spécifique avec validation robuste
   */
  async getFunnelData(funnelId: string, brandId: string, filters?: AnalyticsAdvancedFilters): Promise<FunnelData> {
    // ✅ Validation des entrées
    if (!funnelId || typeof funnelId !== 'string' || funnelId.trim().length === 0) {
      this.logger.warn('Invalid funnelId provided to getFunnelData');
      throw new BadRequestException('Funnel ID is required');
    }

    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getFunnelData');
      throw new BadRequestException('Brand ID is required');
    }

    try {
      this.logger.log(`Getting funnel data for funnel: ${funnelId}, brand: ${brandId}`);

      // ✅ Calculer les dates avec validation
      const endDate = filters?.endDate && filters.endDate instanceof Date && !Number.isNaN(filters.endDate.getTime())
        ? filters.endDate
        : new Date();
      const startDate = filters?.startDate && filters.startDate instanceof Date && !Number.isNaN(filters.startDate.getTime())
        ? filters.startDate
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // ✅ Validation que startDate < endDate
      if (startDate.getTime() >= endDate.getTime()) {
        this.logger.warn('Invalid date range: start >= end, using defaults');
        const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const defaultEnd = new Date();
        return await this.calculationsService.calculateFunnelData(funnelId.trim(), brandId.trim(), defaultStart, defaultEnd);
      }

      // ✅ Utiliser le service de calculs
      return await this.calculationsService.calculateFunnelData(funnelId.trim(), brandId.trim(), startDate, endDate);
    } catch (error) {
      this.logger.error(
        `Failed to get funnel data: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Récupère un funnel par ID pour une marque
   */
  async getFunnelById(id: string, brandId: string): Promise<Funnel> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      this.logger.warn('Invalid funnel id provided to getFunnelById');
      throw new BadRequestException('Funnel ID is required');
    }
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getFunnelById');
      throw new BadRequestException('Brand ID is required');
    }
    const funnel = await this.prisma.analyticsFunnel.findFirst({
      where: { id: id.trim(), brandId: brandId.trim() },
    });
    if (!funnel) {
      throw new NotFoundException(`Funnel with ID ${id} not found`);
    }
    return this.normalizeFunnel(funnel);
  }
  
  /**
   * Crée un nouveau funnel avec validation robuste
   */
  async createFunnel(brandId: string, data: Omit<Funnel, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>): Promise<Funnel> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to createFunnel');
      throw new BadRequestException('Brand ID is required');
    }

    if (!data || typeof data !== 'object') {
      this.logger.warn('Invalid data provided to createFunnel');
      throw new BadRequestException('Funnel data is required');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      this.logger.warn('Invalid funnel name provided');
      throw new BadRequestException('Funnel name is required');
    }

    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      this.logger.warn('Invalid funnel steps provided');
      throw new BadRequestException('At least one funnel step is required');
    }

    try {
      this.logger.log(`Creating funnel for brand: ${brandId}`);

      // ✅ Créer le funnel dans Prisma avec validation
      const funnel = await this.prisma.analyticsFunnel.create({
        data: {
          name: data.name.trim(),
          description: data.description && typeof data.description === 'string' && data.description.trim().length > 0
            ? data.description.trim()
            : null,
          steps: data.steps as unknown as Prisma.InputJsonValue,
          isActive: Boolean(data.isActive),
          brandId: brandId.trim(),
        },
      });

      // ✅ Transformer en format Funnel avec normalisation
      return this.normalizeFunnel(funnel);
    } catch (error) {
      this.logger.error(
        `Failed to create funnel: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
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
      this.logger.error(
        `Failed to get cohorts: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  
  /**
   * Calcule les prédictions de rétention pour une cohorte avec typage strict.
   * Données réelles depuis AnalyticsCohort ; prédictions 30/90 basées sur les périodes enregistrées.
   */
  async getRetentionPredictions(brandId: string): Promise<RetentionPrediction[]> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getRetentionPredictions');
      throw new BadRequestException('Brand ID is required');
    }
    const trimmedBrandId = brandId.trim();
    try {
      this.logger.log(`Getting retention predictions for brand: ${trimmedBrandId}`);

      const cohorts = await this.prisma.analyticsCohort.findMany({
        where: { brandId: trimmedBrandId },
        orderBy: [{ cohortDate: 'desc' }, { period: 'asc' }],
        take: 100,
      });

      const byCohort = new Map<string, { cohortDate: Date; retentionByPeriod: Map<number, number> }>();
      for (const c of cohorts) {
        const key = c.cohortDate.toISOString().slice(0, 7);
        if (!byCohort.has(key)) {
          byCohort.set(key, { cohortDate: c.cohortDate, retentionByPeriod: new Map() });
        }
        byCohort.get(key)!.retentionByPeriod.set(c.period, c.retention);
      }

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const results: RetentionPrediction[] = [];
      const entries = Array.from(byCohort.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 12);

      for (let i = 0; i < entries.length; i++) {
        const [cohortKey, { retentionByPeriod }] = entries[i];
        const [y, m] = cohortKey.split('-').map(Number);
        const label = `${monthNames[m - 1]} ${y}`;
        const ret30 = retentionByPeriod.get(30) ?? retentionByPeriod.get(7) ?? 0;
        const ret90 = retentionByPeriod.get(90) ?? ret30 * 0.7;
        const prevEntry = entries[i + 1];
        const prevRet30 = prevEntry
          ? prevEntry[1].retentionByPeriod.get(30) ?? prevEntry[1].retentionByPeriod.get(7)
          : null;
        const trend: 'up' | 'down' | 'stable' =
          prevRet30 == null ? 'stable' : ret30 > prevRet30 ? 'up' : ret30 < prevRet30 ? 'down' : 'stable';
        results.push({
          cohort: label,
          current: Math.round(ret30 * 100) / 100,
          predicted30: Math.round(ret30 * 100) / 100,
          predicted90: Math.round(ret90 * 100) / 100,
          confidence: 85,
          trend,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to get retention predictions: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // ========================================
  // SEGMENTS
  // ========================================

  /**
   * Récupère tous les segments d'une marque avec typage strict et validation
   */
  async getSegments(brandId: string): Promise<Segment[]> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getSegments');
      throw new BadRequestException('Brand ID is required');
    }

    try {
      this.logger.log(`Getting segments for brand: ${brandId}`);

      // ✅ Récupérer les segments depuis Prisma
      const segments = await this.prisma.analyticsSegment.findMany({
        where: {
          brandId: brandId.trim(),
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      // ✅ Transformer les données Prisma en format Segment avec normalisation
      return segments.map((segment) => this.normalizeSegment(segment));
    } catch (error) {
      this.logger.error(
        `Failed to get segments: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Normalise un segment depuis Prisma avec gardes
   */
  private normalizeSegment(segment: {
    id: string;
    name: string;
    description: string | null;
    criteria: Prisma.JsonValue;
    userCount: number;
    isActive: boolean;
    brandId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Segment {
    return {
      id: segment.id ?? '',
      name: segment.name ?? 'Unnamed Segment',
      description: segment.description && typeof segment.description === 'string' && segment.description.trim().length > 0
        ? segment.description.trim()
        : undefined,
      criteria: this.normalizeSegmentCriteria(segment.criteria),
      userCount: typeof segment.userCount === 'number' && segment.userCount >= 0
        ? segment.userCount
        : 0,
      isActive: Boolean(segment.isActive),
      brandId: segment.brandId ?? '',
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
    };
  }

  /**
   * Normalise les critères de segment avec gardes
   */
  private normalizeSegmentCriteria(criteria: Prisma.JsonValue): SegmentCriteria {
    if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
      return {};
    }

    return criteria as SegmentCriteria;
  }

  /**
   * Count users matching segment criteria using Prisma on User, Order, AnalyticsEvent.
   * Supported criteria: role, createdAfter, createdBefore, lastLoginAfter, hasOrder, minOrders, eventType, minEvents.
   */
  private async countUsersBySegmentCriteria(brandId: string, criteria: SegmentCriteria): Promise<number> {
    const baseWhere = await this.buildSegmentUserWhere(brandId, criteria);
    if (baseWhere.id === 'impossible-id') return 0;
    return this.prisma.user.count({ where: baseWhere });
  }

  /**
   * Returns user IDs matching segment criteria (same logic as countUsersBySegmentCriteria), for use in revenue/activity aggregation.
   */
  private async getUserIdsBySegmentCriteria(brandId: string, criteria: SegmentCriteria, limit = 5000): Promise<string[]> {
    const baseWhere = await this.buildSegmentUserWhere(brandId, criteria);
    if (baseWhere.id === 'impossible-id') return [];
    const users = await this.prisma.user.findMany({
      where: baseWhere,
      select: { id: true },
      take: limit,
    });
    return users.map((u) => u.id);
  }

  /**
   * Builds Prisma UserWhereInput for segment criteria (shared by count and getUserIdList).
   */
  private async buildSegmentUserWhere(brandId: string, criteria: SegmentCriteria): Promise<Prisma.UserWhereInput> {
    const baseWhere: Prisma.UserWhereInput = {
      brandId,
      isActive: true,
      deletedAt: null,
    };

    const role = criteria['role'];
    const validRoles: UserRole[] = ['CONSUMER', 'BRAND_USER', 'BRAND_ADMIN', 'PLATFORM_ADMIN', 'FABRICATOR'];
    if (typeof role === 'string' && validRoles.includes(role as UserRole)) {
      baseWhere.role = role as UserRole;
    }

    const createdAfter = criteria['createdAfter'];
    const createdBefore = criteria['createdBefore'];
    const createdAtParts: { gte?: Date; lte?: Date } = {};
    if (typeof createdAfter === 'string') {
      const d = new Date(createdAfter);
      if (!Number.isNaN(d.getTime())) createdAtParts.gte = d;
    }
    if (typeof createdBefore === 'string') {
      const d = new Date(createdBefore);
      if (!Number.isNaN(d.getTime())) createdAtParts.lte = d;
    }
    if (Object.keys(createdAtParts).length > 0) baseWhere.createdAt = createdAtParts;

    const lastLoginAfter = criteria['lastLoginAfter'];
    if (typeof lastLoginAfter === 'string') {
      const d = new Date(lastLoginAfter);
      if (!Number.isNaN(d.getTime())) baseWhere.lastLoginAt = { gte: d };
    }

    const hasOrder = criteria['hasOrder'];
    const minOrders = criteria['minOrders'];
    if (hasOrder === true || (typeof minOrders === 'number' && minOrders >= 1)) {
      const threshold = typeof minOrders === 'number' && minOrders > 0 ? minOrders : 1;
      const orderCounts = await this.prisma.order.groupBy({
        by: ['userId'],
        where: {
          brandId,
          paymentStatus: 'SUCCEEDED',
          userId: { not: null },
          deletedAt: null,
        },
        _count: { id: true },
      });
      const orderUserIds = orderCounts
        .filter((r) => r.userId != null && r._count.id >= threshold)
        .map((r) => r.userId as string);
      if (orderUserIds.length === 0) return { ...baseWhere, id: 'impossible-id' };
      baseWhere.id = { ...(baseWhere.id as object || {}), in: orderUserIds };
    }

    const eventType = criteria['eventType'];
    const minEvents = criteria['minEvents'];
    if (typeof eventType === 'string' && eventType.trim().length > 0 && typeof minEvents === 'number' && minEvents >= 1) {
      const eventCounts = await this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          brandId,
          eventType: eventType.trim(),
          userId: { not: null },
        },
        _count: { id: true },
      });
      const eventUserIds = eventCounts
        .filter((r) => r.userId != null && r._count.id >= minEvents)
        .map((r) => r.userId as string);
      if (eventUserIds.length === 0) return { ...baseWhere, id: 'impossible-id' };
      const inIds = eventUserIds;
      baseWhere.id = baseWhere.id && typeof baseWhere.id === 'object' && 'in' in baseWhere.id
        ? { in: (baseWhere.id as { in: string[] }).in.filter((id) => inIds.includes(id)) }
        : { in: inIds };
    }

    return baseWhere;
  }

  /**
   * Crée un nouveau segment avec validation robuste
   */
  async createSegment(brandId: string, data: Omit<Segment, 'id' | 'brandId' | 'userCount' | 'createdAt' | 'updatedAt'>): Promise<Segment> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to createSegment');
      throw new BadRequestException('Brand ID is required');
    }

    if (!data || typeof data !== 'object') {
      this.logger.warn('Invalid data provided to createSegment');
      throw new BadRequestException('Segment data is required');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      this.logger.warn('Invalid segment name provided');
      throw new BadRequestException('Segment name is required');
    }

    try {
      this.logger.log(`Creating segment for brand: ${brandId}`);

      // ✅ Créer le segment dans Prisma avec validation
      const segment = await this.prisma.analyticsSegment.create({
        data: {
          name: data.name.trim(),
          description: data.description && typeof data.description === 'string' && data.description.trim().length > 0
            ? data.description.trim()
            : null,
          criteria: (data.criteria && typeof data.criteria === 'object' && !Array.isArray(data.criteria))
            ? (data.criteria as Prisma.InputJsonValue)
            : {},
          isActive: Boolean(data.isActive),
          brandId: brandId.trim(),
          userCount: 0, // Sera calculé après création
        },
      });

      // ✅ Calculer userCount en fonction des critères du segment (User, Order, AnalyticsEvent)
      const criteriaObj = (data.criteria && typeof data.criteria === 'object' && !Array.isArray(data.criteria))
        ? (data.criteria as SegmentCriteria)
        : {};
      const hasCriteria = Object.keys(criteriaObj).length > 0;
      const userCount = hasCriteria
        ? await this.countUsersBySegmentCriteria(brandId.trim(), criteriaObj)
        : await this.prisma.user.count({
            where: {
              brandId: brandId.trim(),
              isActive: true,
              deletedAt: null,
            },
          });

      // ✅ Mettre à jour le userCount
      const updatedSegment = await this.prisma.analyticsSegment.update({
        where: { id: segment.id },
        data: { userCount },
      });

      return this.normalizeSegment(updatedSegment);
    } catch (error) {
      this.logger.error(
        `Failed to create segment: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // ========================================
  // PRÉDICTIONS
  // ========================================

  /**
   * Récupère les prédictions de revenus basées sur les commandes payées (Order).
   * Scénarios dérivés du revenu des 30 derniers jours.
   */
  async getRevenuePredictions(brandId: string): Promise<RevenuePrediction[]> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getRevenuePredictions');
      throw new BadRequestException('Brand ID is required');
    }
    const trimmedBrandId = brandId.trim();
    try {
      this.logger.log(`Getting revenue predictions for brand: ${trimmedBrandId}`);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const orders = await this.prisma.order.findMany({
        where: {
          brandId: trimmedBrandId,
          paymentStatus: 'SUCCEEDED',
          createdAt: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
        select: { totalCents: true },
        take: 1000,
      });

      const revenueCentsLast30 = orders.reduce((sum, o) => sum + o.totalCents, 0);
      const baseRevenue = Math.round(revenueCentsLast30 / 100);

      return [
        {
          scenario: 'conservative',
          revenue: baseRevenue,
          probability: 35,
          factors: ['Croissance normale ~5%', 'Pas de changement majeur', 'Saisonnalité attendue'],
          confidence: 90,
        },
        {
          scenario: 'optimistic',
          revenue: Math.round(baseRevenue * 1.15),
          probability: 45,
          factors: ['Nouvelle campagne réussie', 'Optimisation conversion +10%', 'Croissance organique +15%'],
          confidence: 85,
        },
        {
          scenario: 'very_optimistic',
          revenue: Math.round(baseRevenue * 1.35),
          probability: 20,
          factors: ['Viralité sur réseaux sociaux', 'Nouveau produit lancé', 'Partenariats stratégiques'],
          confidence: 75,
        },
      ];
    } catch (error) {
      this.logger.error(
        `Failed to get revenue predictions: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Récupère les prédictions par segment avec heuristiques (tendance taille, AOV, activité).
   */
  async getSegmentPredictions(brandId: string): Promise<SegmentPrediction[]> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getSegmentPredictions');
      throw new BadRequestException('Brand ID is required');
    }
    const trimmedBrandId = brandId.trim();
    try {
      this.logger.log(`Getting segment predictions for brand: ${trimmedBrandId}`);

      const segments = await this.prisma.analyticsSegment.findMany({
        where: { brandId: trimmedBrandId, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const now = Date.now();
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const results: SegmentPrediction[] = [];

      for (const seg of segments) {
        const criteria = this.normalizeSegmentCriteria(seg.criteria);
        const userIds = await this.getUserIdsBySegmentCriteria(trimmedBrandId, criteria, 5000);
        const userCount = userIds.length;
        if (userCount === 0) {
          results.push({
            segment: seg.name ?? 'Unnamed',
            current: '€0',
            predicted7d: '€0',
            predicted30d: '€0',
            growth7d: '0%',
            growth30d: '0%',
            confidence: 50,
            factors: ['Segment vide', 'Pas de données'],
          });
          continue;
        }

        const [revenueLast7d, revenuePrev7d, revenueLast30d, eventCount] = await Promise.all([
          this.prisma.order.aggregate({
            where: {
              brandId: trimmedBrandId,
              paymentStatus: 'SUCCEEDED',
              userId: { in: userIds },
              createdAt: { gte: sevenDaysAgo },
              deletedAt: null,
            },
            _sum: { totalCents: true },
          }),
          this.prisma.order.aggregate({
            where: {
              brandId: trimmedBrandId,
              paymentStatus: 'SUCCEEDED',
              userId: { in: userIds },
              createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
              deletedAt: null,
            },
            _sum: { totalCents: true },
          }),
          this.prisma.order.aggregate({
            where: {
              brandId: trimmedBrandId,
              paymentStatus: 'SUCCEEDED',
              userId: { in: userIds },
              createdAt: { gte: thirtyDaysAgo },
              deletedAt: null,
            },
            _sum: { totalCents: true },
          }),
          this.prisma.analyticsEvent.count({
            where: {
              brandId: trimmedBrandId,
              userId: { in: userIds },
              timestamp: { gte: thirtyDaysAgo },
            },
          }),
        ]);

        const rev7 = (revenueLast7d._sum.totalCents ?? 0) / 100;
        const revPrev7 = (revenuePrev7d._sum.totalCents ?? 0) / 100;
        const rev30 = (revenueLast30d._sum.totalCents ?? 0) / 100;
        const eventsPerUser = userCount > 0 ? eventCount / userCount : 0;

        const growth7dPct = revPrev7 > 0 ? ((rev7 - revPrev7) / revPrev7) * 100 : (rev7 > 0 ? 20 : 0);
        const growth30dPct = rev30 > 0 ? growth7dPct * 1.2 : 0;
        const predicted7d = rev7 * (1 + Math.max(-0.2, Math.min(0.25, growth7dPct / 100)));
        const predicted30d = rev30 * (1 + Math.max(-0.1, Math.min(0.4, growth30dPct / 100)));

        const factors: string[] = [];
        if (eventsPerUser >= 5) factors.push('Activité élevée');
        else if (eventsPerUser >= 1) factors.push('Activité modérée');
        if (rev30 / userCount >= 100) factors.push('Panier moyen élevé');
        if (growth7dPct > 5) factors.push('Croissance récente');
        if (factors.length === 0) factors.push('Données limitées');

        const confidence = Math.min(95, Math.max(60, 70 + Math.log10(userCount + 1) * 5));

        const formatEur = (v: number) => `€${Math.round(v).toLocaleString('fr-FR')}`;

        results.push({
          segment: seg.name ?? 'Unnamed',
          current: formatEur(rev30),
          predicted7d: formatEur(predicted7d),
          predicted30d: formatEur(predicted30d),
          growth7d: `${growth7dPct >= 0 ? '+' : ''}${Math.round(growth7dPct * 10) / 10}%`,
          growth30d: `${growth30dPct >= 0 ? '+' : ''}${Math.round(growth30dPct * 10) / 10}%`,
          confidence: Math.round(confidence * 10) / 10,
          factors,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to get segment predictions: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
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
        take: 100,
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
      this.logger.error(
        `Failed to get correlations: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
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
      this.logger.error(
        `Failed to get anomalies: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  
  // ========================================
  // BENCHMARKS & SAISONNALITÉ
  // ========================================

  /**
   * Récupère les benchmarks à partir des données réelles de la marque vs moyennes plateforme.
   */
  async getBenchmarks(brandId: string): Promise<MetricBenchmark[]> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getBenchmarks');
      throw new BadRequestException('Brand ID is required');
    }
    const trimmedBrandId = brandId.trim();
    try {
      this.logger.log(`Getting benchmarks for brand: ${trimmedBrandId}`);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        brandConversionEvents,
        brandPageViews,
        brandOrdersAgg,
        brandSessionDurations,
        platformConversionEvents,
        platformPageViews,
        platformOrdersAgg,
        platformSessionDurations,
      ] = await Promise.all([
        this.prisma.analyticsEvent.count({
          where: {
            brandId: trimmedBrandId,
            eventType: 'conversion',
            timestamp: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.analyticsEvent.count({
          where: {
            brandId: trimmedBrandId,
            eventType: 'page_view',
            timestamp: { gte: thirtyDaysAgo },
          },
        }),
        this.prisma.order.aggregate({
          where: {
            brandId: trimmedBrandId,
            paymentStatus: 'SUCCEEDED',
            createdAt: { gte: thirtyDaysAgo },
            deletedAt: null,
          },
          _avg: { totalCents: true },
          _count: { id: true },
        }),
        this.getAvgSessionDurationSeconds(trimmedBrandId, thirtyDaysAgo),
        this.prisma.analyticsEvent.count({
          where: { eventType: 'conversion', timestamp: { gte: thirtyDaysAgo } },
        }),
        this.prisma.analyticsEvent.count({
          where: { eventType: 'page_view', timestamp: { gte: thirtyDaysAgo } },
        }),
        this.prisma.order.aggregate({
          where: {
            paymentStatus: 'SUCCEEDED',
            createdAt: { gte: thirtyDaysAgo },
            deletedAt: null,
          },
          _avg: { totalCents: true },
        }),
        this.getAvgSessionDurationSecondsPlatform(thirtyDaysAgo),
      ]);

      const brandConversionRate =
        brandPageViews > 0 ? (brandConversionEvents / brandPageViews) * 100 : 0;
      const platformConversionRate =
        platformPageViews > 0 ? (platformConversionEvents / platformPageViews) * 100 : 2.5;
      const industryTopConversion = Math.max(platformConversionRate * 1.8, 5);

      const brandAov = (brandOrdersAgg._avg.totalCents ?? 0) / 100;
      const platformAov = (platformOrdersAgg._avg.totalCents ?? 0) / 100;
      const industryTopAov = Math.max(platformAov * 1.5, 100);

      const brandAvgSessionSec = brandSessionDurations;
      const platformAvgSessionSec = platformSessionDurations;
      const industryTopSession = Math.max(platformAvgSessionSec * 1.5, 180);

      const percentileConversion =
        industryTopConversion > platformConversionRate
          ? Math.round(
              ((brandConversionRate - platformConversionRate) /
                (industryTopConversion - platformConversionRate)) *
                50 +
                50,
            )
          : 50;
      const percentileAov =
        industryTopAov > platformAov
          ? Math.round(
              ((brandAov - platformAov) / (industryTopAov - platformAov)) * 50 + 50,
            )
          : 50;
      const percentileSession =
        industryTopSession > platformAvgSessionSec
          ? Math.round(
              ((brandAvgSessionSec - platformAvgSessionSec) /
                (industryTopSession - platformAvgSessionSec)) *
                50 +
                50,
            )
          : 50;

      const clampPct = (n: number) => Math.max(0, Math.min(100, n));

      return [
        {
          metric: 'Taux de conversion',
          yourValue: Math.round(brandConversionRate * 100) / 100,
          industryAvg: Math.round(platformConversionRate * 100) / 100,
          industryTop: Math.round(industryTopConversion * 100) / 100,
          percentile: clampPct(percentileConversion),
          status: brandConversionRate >= platformConversionRate ? 'above' : 'below',
        },
        {
          metric: 'Panier moyen',
          yourValue: Math.round(brandAov * 100) / 100,
          industryAvg: Math.round(platformAov * 100) / 100,
          industryTop: Math.round(industryTopAov * 100) / 100,
          percentile: clampPct(percentileAov),
          status: brandAov >= platformAov ? 'above' : 'below',
        },
        {
          metric: 'Durée session moy. (s)',
          yourValue: Math.round(brandAvgSessionSec),
          industryAvg: Math.round(platformAvgSessionSec),
          industryTop: Math.round(industryTopSession),
          percentile: clampPct(percentileSession),
          status: brandAvgSessionSec >= platformAvgSessionSec ? 'above' : 'below',
        },
      ];
    } catch (error) {
      this.logger.error(
        `Failed to get benchmarks: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** Average session duration in seconds for a brand (from AnalyticsEvent sessionId min/max timestamp). */
  private async getAvgSessionDurationSeconds(brandId: string, since: Date): Promise<number> {
    const sessions = await this.prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        brandId,
        sessionId: { not: null },
        timestamp: { gte: since },
      },
      _min: { timestamp: true },
      _max: { timestamp: true },
    });
    let totalSec = 0;
    let count = 0;
    for (const s of sessions) {
      if (s.sessionId && s._min.timestamp && s._max.timestamp) {
        totalSec += (s._max.timestamp.getTime() - s._min.timestamp.getTime()) / 1000;
        count += 1;
      }
    }
    return count > 0 ? totalSec / count : 0;
  }

  /** Platform-wide average session duration in seconds. */
  private async getAvgSessionDurationSecondsPlatform(since: Date): Promise<number> {
    const sessions = await this.prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        sessionId: { not: null },
        timestamp: { gte: since },
      },
      _min: { timestamp: true },
      _max: { timestamp: true },
    });
    let totalSec = 0;
    let count = 0;
    for (const s of sessions) {
      if (s.sessionId && s._min.timestamp && s._max.timestamp) {
        totalSec += (s._max.timestamp.getTime() - s._min.timestamp.getTime()) / 1000;
        count += 1;
      }
    }
    return count > 0 ? totalSec / count : 60;
  }

  /**
   * Récupère les analyses de saisonnalité à partir des commandes (12 derniers mois).
   */
  async getSeasonality(brandId: string): Promise<SeasonalityAnalysis> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to getSeasonality');
      throw new BadRequestException('Brand ID is required');
    }
    const trimmedBrandId = brandId.trim();
    try {
      this.logger.log(`Getting seasonality for brand: ${trimmedBrandId}`);

      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      twelveMonthsAgo.setDate(1);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const orders = await this.prisma.order.findMany({
        where: {
          brandId: trimmedBrandId,
          paymentStatus: 'SUCCEEDED',
          createdAt: { gte: twelveMonthsAgo },
          deletedAt: null,
        },
        select: { createdAt: true, totalCents: true },
        take: 1000,
      });

      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
      const byMonth = new Map<string, { count: number; revenueCents: number }>();

      for (let i = 0; i < 12; i++) {
        const d = new Date(twelveMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth.set(key, { count: 0, revenueCents: 0 });
      }

      for (const o of orders) {
        const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
        const entry = byMonth.get(key);
        if (entry) {
          entry.count += 1;
          entry.revenueCents += o.totalCents;
        }
      }

      const entries = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const volumes = entries.map(([, v]) => v.count);
      const revenues = entries.map(([, v]) => v.revenueCents / 100);
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / (volumes.length || 1);
      const avgRevenue = revenues.reduce((a, b) => a + b, 0) / (revenues.length || 1);

      const patterns: SeasonalityPattern[] = [];
      let peakMonth = '';
      let peakImpact = 0;
      let lowMonth = '';
      let lowImpact = 0;
      let maxRelRevenue = 0;
      let minRelRevenue = 200;

      for (let i = 0; i < entries.length; i++) {
        const [key, { count, revenueCents }] = entries[i];
        const [, m] = key.split('-').map(Number);
        const label = monthNames[m - 1];
        const relRevenue = avgRevenue > 0 ? (revenueCents / 100 / avgRevenue) * 100 : 100;
        if (relRevenue > maxRelRevenue) {
          maxRelRevenue = relRevenue;
          peakMonth = label;
          peakImpact = Math.round(relRevenue - 100);
        }
        if (relRevenue < minRelRevenue && (revenueCents > 0 || count > 0)) {
          minRelRevenue = relRevenue;
          lowMonth = label;
          lowImpact = Math.round(100 - relRevenue);
        }
      }

      if (peakMonth && maxRelRevenue > 105) {
        patterns.push({
          pattern: 'Pic de volume',
          period: peakMonth,
          impact: `+${peakImpact}% revenus vs moyenne`,
          confidence: 85,
        });
      }
      if (lowMonth && minRelRevenue < 95) {
        patterns.push({
          pattern: 'Creux de volume',
          period: lowMonth,
          impact: `-${lowImpact}% revenus vs moyenne`,
          confidence: 85,
        });
      }
      if (patterns.length === 0 && entries.length > 0) {
        patterns.push({
          pattern: 'Volume stable',
          period: '12 derniers mois',
          impact: 'Pas de pic/creux marqué',
          confidence: 70,
        });
      }

      const totalRevenue = revenues.reduce((a, b) => a + b, 0);
      const lastMonthRevenue = revenues.length > 0 ? revenues[revenues.length - 1] : 0;
      const prevMonthRevenue = revenues.length > 1 ? revenues[revenues.length - 2] : lastMonthRevenue;
      const trendPct = prevMonthRevenue > 0 ? ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

      const forecasts: SeasonalityForecast[] = [
        {
          period: 'Mois prochain',
          forecast: `€${Math.round(lastMonthRevenue * (1 + trendPct / 100)).toLocaleString('fr-FR')}`,
          trend: `${trendPct >= 0 ? '+' : ''}${Math.round(trendPct * 10) / 10}%`,
          reason: trendPct >= 0 ? 'Tendance récente positive' : 'Tendance récente à la baisse',
          confidence: 75,
        },
        {
          period: 'Trimestre prochain',
          forecast: `€${Math.round((totalRevenue / 4) * (1 + trendPct / 100)).toLocaleString('fr-FR')}`,
          trend: 'Basé sur moyenne 3 mois',
          reason: 'Extrapolation sur saisonnalité observée',
          confidence: 70,
        },
      ];

      return { patterns, forecasts };
    } catch (error) {
      this.logger.error(
        `Failed to get seasonality: ${error instanceof Error ? error.message : 'Unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}

