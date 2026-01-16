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
   */
  async createSLATicket(ticketId: string, brandId: string, priority: 'low' | 'medium' | 'high' | 'critical'): Promise<SLATicket> {
    // ✅ Validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new BadRequestException('Ticket ID is required');
    }

    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    // ✅ Récupérer le plan du brand
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId.trim() },
      select: { id: true, plan: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${brandId} not found`);
    }

    const planId = brand.plan || 'starter';
    const slaConfig = this.getSLAConfig(planId);

    // ✅ Calculer les deadlines
    const now = new Date();
    const responseDeadline = new Date(now.getTime() + slaConfig.responseTimeHours * 60 * 60 * 1000);
    const resolutionDeadline = new Date(now.getTime() + slaConfig.resolutionTimeHours * 60 * 60 * 1000);

    try {
      // ✅ Créer l'enregistrement SLA
      await this.prisma.$executeRaw`
        INSERT INTO "SLATicket" (
          "id", "ticketId", "brandId", "planId", "priority",
          "createdAt", "slaResponseDeadline", "slaResolutionDeadline",
          "slaStatus", "escalationLevel"
        ) VALUES (
          gen_random_uuid()::text,
          ${ticketId.trim()},
          ${brandId.trim()},
          ${planId},
          ${priority},
          NOW(),
          ${responseDeadline},
          ${resolutionDeadline},
          'on_time',
          0
        )
      `;

      this.logger.log(`SLA ticket created: ${ticketId} for brand ${brandId} with plan ${planId}`);

      // ✅ Récupérer le ticket créé
      return this.getSLATicket(ticketId.trim());
    } catch (error) {
      this.logger.error(
        `Failed to create SLA ticket: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient un ticket SLA
   */
  async getSLATicket(ticketId: string): Promise<SLATicket> {
    // ✅ Validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new BadRequestException('Ticket ID is required');
    }

    const tickets = await this.prisma.$queryRawUnsafe<SLATicket[]>(
      `SELECT * FROM "SLATicket" WHERE "ticketId" = $1 LIMIT 1`,
      ticketId.trim(),
    );

    if (!tickets || tickets.length === 0) {
      throw new NotFoundException(`SLA ticket not found: ${ticketId}`);
    }

    return tickets[0];
  }

  /**
   * Met à jour le statut SLA d'un ticket
   */
  async updateSLATicketStatus(ticketId: string, firstResponseAt?: Date, resolvedAt?: Date): Promise<SLATicket> {
    // ✅ Validation
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
      throw new BadRequestException('Ticket ID is required');
    }

    try {
      // ✅ Récupérer le ticket actuel
      const ticket = await this.getSLATicket(ticketId.trim());
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

      // ✅ Mettre à jour le ticket
      await this.prisma.$executeRawUnsafe(
        `UPDATE "SLATicket" SET
          "firstResponseAt" = COALESCE($1, "firstResponseAt"),
          "resolvedAt" = COALESCE($2, "resolvedAt"),
          "slaStatus" = $3,
          "escalationLevel" = $4,
          "updatedAt" = NOW()
        WHERE "ticketId" = $5`,
        firstResponseAt || null,
        resolvedAt || null,
        slaStatus,
        escalationLevel,
        ticketId.trim(),
      );

      return this.getSLATicket(ticketId.trim());
    } catch (error) {
      this.logger.error(
        `Failed to update SLA ticket status: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Calcule les métriques SLA pour un brand
   */
  async calculateSLAMetrics(brandId: string, periodStart: Date, periodEnd: Date): Promise<SLAMetrics> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    try {
      const metrics = await this.prisma.$queryRawUnsafe<Array<{
        totalTickets: number;
        ticketsOnTime: number;
        ticketsAtRisk: number;
        ticketsBreached: number;
        averageResponseTimeHours: number;
        averageResolutionTimeHours: number;
      }>>(
        `SELECT
          COUNT(*)::int as "totalTickets",
          COUNT(*) FILTER (WHERE "slaStatus" = 'on_time')::int as "ticketsOnTime",
          COUNT(*) FILTER (WHERE "slaStatus" = 'at_risk')::int as "ticketsAtRisk",
          COUNT(*) FILTER (WHERE "slaStatus" = 'breached')::int as "ticketsBreached",
          COALESCE(AVG(EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")) / 3600), 0)::float as "averageResponseTimeHours",
          COALESCE(AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600), 0)::float as "averageResolutionTimeHours"
        FROM "SLATicket"
        WHERE "brandId" = $1
          AND "createdAt" >= $2
          AND "createdAt" < $3`,
        brandId.trim(),
        periodStart,
        periodEnd,
      );

      if (!metrics || metrics.length === 0) {
        return {
          brandId: brandId.trim(),
          periodStart,
          periodEnd,
          totalTickets: 0,
          ticketsOnTime: 0,
          ticketsAtRisk: 0,
          ticketsBreached: 0,
          averageResponseTimeHours: 0,
          averageResolutionTimeHours: 0,
          uptimePercent: 100,
          slaCompliancePercent: 100,
        };
      }

      const metric = metrics[0];
      const slaCompliancePercent = metric.totalTickets > 0
        ? (metric.ticketsOnTime / metric.totalTickets) * 100
        : 100;

      return {
        brandId: brandId.trim(),
        periodStart,
        periodEnd,
        totalTickets: metric.totalTickets,
        ticketsOnTime: metric.ticketsOnTime,
        ticketsAtRisk: metric.ticketsAtRisk,
        ticketsBreached: metric.ticketsBreached,
        averageResponseTimeHours: metric.averageResponseTimeHours,
        averageResolutionTimeHours: metric.averageResolutionTimeHours,
        uptimePercent: 100, // TODO: Calculer depuis les métriques de monitoring
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
