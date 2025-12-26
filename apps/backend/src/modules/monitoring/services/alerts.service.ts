import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateAlertDto } from '../dto/create-alert.dto';
import { CreateAlertRuleDto } from '../dto/create-alert-rule.dto';
import { AlertSeverity, AlertStatus } from '@prisma/client';

/**
 * Alerts Service - Enterprise Grade
 * Handles alert creation, management, and rule evaluation
 * Inspired by: PagerDuty, Datadog Alerts, Linear Issues
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new alert
   */
  async createAlert(dto: CreateAlertDto, userId?: string) {
    const alert = await this.prisma.alert.create({
      data: {
        severity: dto.severity,
        title: dto.title,
        message: dto.message,
        service: dto.service,
        metric: dto.metric,
        threshold: dto.threshold,
        currentValue: dto.currentValue,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
        status: 'ACTIVE',
      },
    });

    this.logger.log('Alert created', {
      alertId: alert.id,
      severity: alert.severity,
      service: alert.service,
    });

    // In production, trigger notifications here
    // await this.notifyAlert(alert);

    return alert;
  }

  /**
   * Get all alerts with filters
   */
  async getAlerts(filters: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    service?: string;
    limit?: number;
  }) {
    const { status, severity, service, limit = 50 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (service) where.service = service;

    const alerts = await this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });

    this.logger.log('Alert acknowledged', {
      alertId: alert.id,
      userId,
    });

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    userId: string,
    reason?: string
  ) {
    const alert = await this.prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolvedReason: reason,
      },
    });

    this.logger.log('Alert resolved', {
      alertId: alert.id,
      userId,
      reason,
    });

    return alert;
  }

  /**
   * Create an alert rule
   */
  async createAlertRule(dto: CreateAlertRuleDto) {
    const rule = await this.prisma.alertRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        service: dto.service,
        metric: dto.metric,
        condition: dto.condition,
        threshold: dto.threshold,
        severity: dto.severity,
        enabled: dto.enabled ?? true,
        cooldown: dto.cooldown ?? 300,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
    });

    this.logger.log('Alert rule created', {
      ruleId: rule.id,
      service: rule.service,
      metric: rule.metric,
    });

    return rule;
  }

  /**
   * Get all alert rules
   */
  async getAlertRules(enabled?: boolean) {
    const where: any = {};
    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    const rules = await this.prisma.alertRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  }

  /**
   * Evaluate alert rules against current metrics
   * This would typically run as a scheduled job
   */
  async evaluateAlertRules() {
    const rules = await this.prisma.alertRule.findMany({
      where: { enabled: true },
    });

    const now = new Date();
    const results = [];

    for (const rule of rules) {
      // Check cooldown
      if (
        rule.lastTriggered &&
        now.getTime() - rule.lastTriggered.getTime() < rule.cooldown * 1000
      ) {
        continue;
      }

      // Get latest metric value
      const latestMetric = await this.prisma.monitoringMetric.findFirst({
        where: {
          service: rule.service,
          metric: rule.metric,
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!latestMetric) continue;

      // Evaluate condition
      const shouldTrigger = this.evaluateCondition(
        latestMetric.value,
        rule.condition,
        rule.threshold
      );

      if (shouldTrigger) {
        // Create alert
        const alert = await this.createAlert({
          severity: rule.severity,
          title: `Alert: ${rule.name}`,
          message: `${rule.service}/${rule.metric} ${rule.condition} ${rule.threshold}. Current: ${latestMetric.value}`,
          service: rule.service,
          metric: rule.metric,
          threshold: rule.threshold,
          currentValue: latestMetric.value,
        });

        // Update rule
        await this.prisma.alertRule.update({
          where: { id: rule.id },
          data: {
            lastTriggered: now,
            triggerCount: { increment: 1 },
          },
        });

        results.push({ ruleId: rule.id, alertId: alert.id, triggered: true });
      }
    }

    return results;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(
    value: number,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }
}

