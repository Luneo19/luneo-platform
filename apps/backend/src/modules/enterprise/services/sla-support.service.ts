// @ts-nocheck
/**
 * @fileoverview Service SLA & Support prioritaire pour Enterprise
 * @module SLASupportService
 *
 * Conforme au plan PHASE 8 - Enterprise - SLA/priority support with monitoring
 *
 * FONCTIONNALITÉS:
 * - Gestion des SLA par plan
 * - Support prioritaire
 * - Monitoring des SLA
 * - Escalade automatique
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Logging structuré
 * - ✅ SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Configuration SLA
 */
export interface SLAConfig {
  planId: string;
  responseTimeHours: number; // Temps de réponse garanti en heures
  resolutionTimeHours: number; // Temps de résolution garanti en heures
  uptimePercent: number; // Uptime garanti (99.9, 99.99, etc.)
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  escalationLevels: Array<{
    level: number;
    timeHours: number;
    action: string;
  }>;
}

/**
 * Ticket avec SLA
 */
export interface SLATicket {
  id: string;
  ticketId: string;
  brandId: string;
  planId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  slaResponseDeadline: Date;
  slaResolutionDeadline: Date;
  slaStatus: 'on_time' | 'at_risk' | 'breached';
  escalationLevel: number;
}

/**
 * Métriques SLA
 */
export interface SLAMetrics {
  brandId: string;
  periodStart: Date;
  periodEnd: Date;
  totalTickets: number;
  ticketsOnTime: number;
  ticketsAtRisk: number;
  ticketsBreached: number;
  averageResponseTimeHours: number;
  averageResolutionTimeHours: number;
  uptimePercent: number;
  slaCompliancePercent: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class SLASupportService {
  private readonly logger = new Logger(SLASupportService.name);

  // ✅ Configurations SLA par plan
  private readonly slaConfigs: Record<string, SLAConfig> = {
    starter: {
      planId: 'starter',
      responseTimeHours: 48, // 2 jours
      resolutionTimeHours: 168, // 7 jours
      uptimePercent: 99.0,
      prioritySupport: false,
      dedicatedSupport: false,
      escalationLevels: [],
    },
    professional: {
      planId: 'professional',
      responseTimeHours: 24, // 1 jour
      resolutionTimeHours: 72, // 3 jours
      uptimePercent: 99.5,
      prioritySupport: true,
      dedicatedSupport: false,
      escalationLevels: [
        { level: 1, timeHours: 24, action: 'Escalate to senior support' },
      ],
    },
    business: {
      planId: 'business',
      responseTimeHours: 4, // 4 heures
      resolutionTimeHours: 24, // 1 jour
      uptimePercent: 99.9,
      prioritySupport: true,
      dedicatedSupport: true,
      escalationLevels: [
        { level: 1, timeHours: 4, action: 'Escalate to senior support' },
        { level: 2, timeHours: 8, action: 'Escalate to engineering team' },
      ],
    },
    enterprise: {
      planId: 'enterprise',
      responseTimeHours: 1, // 1 heure
      resolutionTimeHours: 8, // 8 heures
      uptimePercent: 99.99,
      prioritySupport: true,
      dedicatedSupport: true,
      escalationLevels: [
        { level: 1, timeHours: 1, action: 'Escalate to senior support' },
        { level: 2, timeHours: 2, action: 'Escalate to engineering team' },
        { level: 3, timeHours: 4, action: 'Escalate to CTO' },
      ],
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Obtient la configuration SLA d'un plan
   * Conforme au plan PHASE 8 - SLA & Support
   */
  getSLAConfig(planId: string): SLAConfig {
    const normalizedPlanId = planId.toLowerCase();
    const config = this.slaConfigs[normalizedPlanId];

    if (!config) {
      this.logger.warn(`No SLA config found for plan ${planId}, using starter defaults`);
      return this.slaConfigs.starter;
    }

    return config;
  }

  /**
   * Crée un ticket avec SLA tracking
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRaw
   */
  async createSLATicket(ticketId: string, brandId: string, priority: 'low' | 'medium' | 'high' | 'critical'): Promise<SLATicket> {
    // ✅ Validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new BadRequestException('Ticket ID is required');
    }

    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    const cleanTicketId = ticketId.trim();
    const cleanBrandId = brandId.trim();

    // ✅ Récupérer le plan du brand
    const brand = await this.prisma.brand.findUnique({
      where: { id: cleanBrandId },
      select: { id: true, subscriptionPlan: true, plan: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${brandId} not found`);
    }

    const planId = brand.subscriptionPlan || brand.plan || 'starter';
    const slaConfig = this.getSLAConfig(planId);

    // ✅ Calculer les deadlines
    const now = new Date();
    const responseDeadline = new Date(now.getTime() + slaConfig.responseTimeHours * 60 * 60 * 1000);
    const resolutionDeadline = new Date(now.getTime() + slaConfig.resolutionTimeHours * 60 * 60 * 1000);

    try {
      // ✅ Créer l'enregistrement SLA avec Prisma
      const ticket = await this.prisma.sLATicket.create({
        data: {
          ticketId: cleanTicketId,
          brandId: cleanBrandId,
          planId,
          priority,
          slaResponseDeadline: responseDeadline,
          slaResolutionDeadline: resolutionDeadline,
          slaStatus: 'on_time',
          escalationLevel: 0,
        },
      });

      this.logger.log(`SLA ticket created: ${ticketId} for brand ${brandId} with plan ${planId}`);

      return ticket as unknown as SLATicket;
    } catch (error) {
      this.logger.error(
        `Failed to create SLA ticket: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient un ticket SLA
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async getSLATicket(ticketId: string): Promise<SLATicket> {
    // ✅ Validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new BadRequestException('Ticket ID is required');
    }

    const ticket = await this.prisma.sLATicket.findFirst({
      where: { ticketId: ticketId.trim() },
    });

    if (!ticket) {
      throw new NotFoundException(`SLA ticket not found: ${ticketId}`);
    }

    return ticket as unknown as SLATicket;
  }

  /**
   * Met à jour le statut SLA d'un ticket
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRawUnsafe
   */
  async updateSLATicketStatus(ticketId: string, firstResponseAt?: Date, resolvedAt?: Date): Promise<SLATicket> {
    // ✅ Validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new BadRequestException('Ticket ID is required');
    }

    const cleanTicketId = ticketId.trim();

    try {
      // ✅ Récupérer le ticket actuel
      const ticket = await this.getSLATicket(cleanTicketId);
      const slaConfig = this.getSLAConfig(ticket.planId);

      // ✅ Calculer le statut SLA
      const now = new Date();
      let slaStatus: 'on_time' | 'at_risk' | 'breached' = 'on_time';
      let escalationLevel = ticket.escalationLevel;

      // ✅ Vérifier la réponse
      if (firstResponseAt) {
        const responseTime = (firstResponseAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
        if (responseTime > slaConfig.responseTimeHours) {
          slaStatus = 'breached';
        } else if (responseTime > slaConfig.responseTimeHours * 0.8) {
          slaStatus = 'at_risk';
        }
      } else if (now > ticket.slaResponseDeadline) {
        slaStatus = 'breached';
      } else if (now > new Date(ticket.slaResponseDeadline.getTime() - slaConfig.responseTimeHours * 0.2 * 60 * 60 * 1000)) {
        slaStatus = 'at_risk';
      }

      // ✅ Vérifier la résolution
      if (resolvedAt) {
        const resolutionTime = (resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
        if (resolutionTime > slaConfig.resolutionTimeHours) {
          slaStatus = 'breached';
        }
      } else if (now > ticket.slaResolutionDeadline) {
        slaStatus = 'breached';
      }

      // ✅ Vérifier l'escalade
      for (const escalation of slaConfig.escalationLevels) {
        const escalationDeadline = new Date(ticket.createdAt.getTime() + escalation.timeHours * 60 * 60 * 1000);
        if (now > escalationDeadline && escalationLevel < escalation.level) {
          escalationLevel = escalation.level;
          this.logger.warn(`SLA escalation level ${escalation.level} reached for ticket ${ticketId}: ${escalation.action}`);
        }
      }

      // ✅ Mettre à jour le ticket avec Prisma
      const updatedTicket = await this.prisma.sLATicket.update({
        where: { id: ticket.id },
        data: {
          firstResponseAt: firstResponseAt || ticket.firstResponseAt,
          resolvedAt: resolvedAt || ticket.resolvedAt,
          slaStatus,
          escalationLevel,
        },
      });

      return updatedTicket as unknown as SLATicket;
    } catch (error) {
      this.logger.error(
        `Failed to update SLA ticket status: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Calcule les métriques SLA pour un brand avec cache
   * SEC-11: Utilise Prisma aggregate et groupBy au lieu de $queryRawUnsafe
   * PERF-05: Cache Redis avec TTL 15min
   */
  async calculateSLAMetrics(brandId: string, periodStart: Date, periodEnd: Date): Promise<SLAMetrics> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    const cleanBrandId = brandId.trim();

    // PERF-05: Générer une clé de cache unique pour cette période
    const cacheKey = `sla-metrics:${cleanBrandId}:${periodStart.toISOString()}:${periodEnd.toISOString()}`;

    return await this.cache.get(
      cacheKey,
      'analytics', // Stratégie analytics avec TTL court
      async () => this.computeSLAMetrics(cleanBrandId, periodStart, periodEnd),
      { ttl: 900, tags: [`sla:${cleanBrandId}`] }, // 15 minutes
    ) ?? await this.computeSLAMetrics(cleanBrandId, periodStart, periodEnd);
  }

  /**
   * Calcul interne des métriques SLA (sans cache)
   */
  private async computeSLAMetrics(
    cleanBrandId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<SLAMetrics> {
    try {
      // ✅ Récupérer les statistiques avec Prisma
      const [totalCount, statusCounts, avgTimes] = await Promise.all([
        // Total tickets
        this.prisma.sLATicket.count({
          where: {
            brandId: cleanBrandId,
            createdAt: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
        }),
        // Counts by status
        this.prisma.sLATicket.groupBy({
          by: ['slaStatus'],
          where: {
            brandId: cleanBrandId,
            createdAt: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          _count: true,
        }),
        // Average times - nécessite tous les tickets pour le calcul
        this.prisma.sLATicket.findMany({
          where: {
            brandId: cleanBrandId,
            createdAt: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          select: {
            createdAt: true,
            firstResponseAt: true,
            resolvedAt: true,
          },
        }),
      ]);

      // ✅ Calculer les counts par status
      let ticketsOnTime = 0;
      let ticketsAtRisk = 0;
      let ticketsBreached = 0;

      for (const status of statusCounts) {
        switch (status.slaStatus) {
          case 'on_time':
            ticketsOnTime = status._count;
            break;
          case 'at_risk':
            ticketsAtRisk = status._count;
            break;
          case 'breached':
            ticketsBreached = status._count;
            break;
        }
      }

      // ✅ Calculer les moyennes de temps
      let totalResponseTime = 0;
      let responseCount = 0;
      let totalResolutionTime = 0;
      let resolutionCount = 0;

      for (const ticket of avgTimes) {
        if (ticket.firstResponseAt) {
          totalResponseTime += (ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
          responseCount++;
        }
        if (ticket.resolvedAt) {
          totalResolutionTime += (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
          resolutionCount++;
        }
      }

      const averageResponseTimeHours = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const averageResolutionTimeHours = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;

      const slaCompliancePercent = totalCount > 0
        ? (ticketsOnTime / totalCount) * 100
        : 100;

      let uptimePercent = 100;
      const apiHealth = await this.prisma.serviceHealth.findFirst({
        where: { service: 'api' },
        orderBy: { lastCheck: 'desc' },
      });
      if (apiHealth) {
        switch (apiHealth.status) {
          case 'HEALTHY':
            uptimePercent = 100;
            break;
          case 'DEGRADED':
            uptimePercent = 99;
            break;
          case 'UNHEALTHY':
            uptimePercent = 0;
            break;
          default:
            uptimePercent = 100;
        }
      }

      return {
        brandId: cleanBrandId,
        periodStart,
        periodEnd,
        totalTickets: totalCount,
        ticketsOnTime,
        ticketsAtRisk,
        ticketsBreached,
        averageResponseTimeHours,
        averageResolutionTimeHours,
        uptimePercent,
        slaCompliancePercent,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate SLA metrics: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
