import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PLAN_DEFINITIONS } from '@luneo/billing-plans';
import { UserRole } from '@prisma/client';

import { QUOTA_ALERT_EVENT, type QuotaAlertEventPayload } from '../events/quota.events';
import { IntegrationsService } from '@/modules/integrations/integrations.service';
import { EmailService } from '@/modules/email/email.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { QuotaMetricsService } from './quota-metrics.service';

@Injectable()
export class QuotaAlertListenerService {
  private readonly logger = new Logger(QuotaAlertListenerService.name);

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly quotaMetricsService: QuotaMetricsService,
  ) {}

  @OnEvent(QUOTA_ALERT_EVENT, { async: true })
  async handleQuotaAlert(payload: QuotaAlertEventPayload): Promise<void> {
    const { brandId, planId, metric, percentage, severity, remaining } = payload;

    this.logger.warn(
      `[QuotaAlert] Brand=${brandId} Plan=${planId} Metric=${metric} Usage=${percentage.toFixed(
        2,
      )}% Remaining=${remaining} Severity=${severity}`,
    );

    const plan = PLAN_DEFINITIONS[planId];
    const quota = plan?.quotas.find((q) => q.metric === metric);
    this.quotaMetricsService.recordAlert({
      brandId,
      planId,
      metric,
      severity,
      overage: payload.overage,
      remaining,
      limit: payload.limit,
      overagePolicy: quota?.overage ?? 'block',
    });

    await Promise.allSettled([
      this.dispatchIntegrations(payload),
      this.dispatchEmail(payload),
    ]);
  }

  private async dispatchIntegrations(payload: QuotaAlertEventPayload): Promise<void> {
    try {
      await this.integrationsService.sendNotification(payload.brandId, 'quota.alert', {
        ...payload,
        percentage: Number(payload.percentage.toFixed(2)),
        message: this.buildAlertMessage(payload),
      });
    } catch (error) {
      this.logger.error(`Failed to send quota alert via integrations for brand ${payload.brandId}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async dispatchEmail(payload: QuotaAlertEventPayload): Promise<void> {
    const recipients = await this.resolveEmailRecipients(payload.brandId);
    if (!recipients.length) {
      return;
    }

    const plan = PLAN_DEFINITIONS[payload.planId];
    const subject = `[Quota ${payload.severity.toUpperCase()}] ${plan?.name ?? payload.planId} · ${payload.metric}`;
    const html = this.buildEmailBody(payload, plan?.name);

    try {
      await this.emailService.sendEmail({
        to: recipients,
        subject,
        html,
        tags: ['usage', 'quota', payload.severity],
      });
    } catch (error) {
      this.logger.error(`Failed to send quota alert email for brand ${payload.brandId}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async resolveEmailRecipients(brandId: string): Promise<string[]> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { settings: true },
    });

    const settings = (brand?.settings as Record<string, any>) ?? {};
    const configuredEmails: string[] =
      Array.isArray(settings.alerts?.quota?.emails)
        ? settings.alerts.quota.emails
        : typeof settings.alerts?.quota?.emails === 'string'
          ? settings.alerts.quota.emails.split(',').map((email: string) => email.trim())
          : [];

    const adminUsers = await this.prisma.user.findMany({
      where: {
        brandId,
        isActive: true,
        role: { in: [UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN] },
      },
      select: { email: true },
    });

    const adminEmails = adminUsers
      .map((user) => user.email?.trim())
      .filter((email): email is string => Boolean(email));

    return Array.from(new Set([...configuredEmails, ...adminEmails]));
  }

  private buildAlertMessage(payload: QuotaAlertEventPayload): string {
    const plan = PLAN_DEFINITIONS[payload.planId];
    const percentage = payload.percentage.toFixed(2);
    return `${plan?.name ?? payload.planId} - ${payload.metric}: ${percentage}% utilisé (reste ${payload.remaining})`;
  }

  private buildEmailBody(payload: QuotaAlertEventPayload, planName?: string): string {
    const percentage = payload.percentage.toFixed(2);
    const severityLabel =
      payload.severity === 'critical'
        ? 'Critique'
        : payload.severity === 'warning'
          ? 'Avertissement'
          : 'Information';

    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <h2 style="margin-top: 0; font-size: 20px;">${severityLabel} · Quota ${payload.metric}</h2>
        <p style="margin-bottom: 24px;">
          Votre plan <strong>${planName ?? payload.planId}</strong> a atteint <strong>${percentage}%</strong> de son quota pour la métrique <strong>${payload.metric}</strong>.
        </p>
        <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px;">
            Limite : <strong>${payload.limit.toLocaleString()}</strong><br/>
            Consommé : <strong>${(payload.limit - payload.remaining).toLocaleString()}</strong><br/>
            Restant : <strong>${payload.remaining.toLocaleString()}</strong>
          </p>
        </div>
        <p style="margin-bottom: 16px;">Pensez à :</p>
        <ul style="margin-top: 0; color: #cbd5f5;">
          <li>Optimiser les appels ou files d’attente liés à cette métrique.</li>
          <li>Planifier un passage au plan supérieur si la consommation reste élevée.</li>
          <li>Contacter votre CSM pour débloquer des crédits supplémentaires.</li>
        </ul>
        <p style="margin-top: 32px; font-size: 13px; color: #94a3b8;">
          Cette alerte est envoyée automatiquement par le moteur de quotas Luneo.
        </p>
      </div>
    `;
  }
}

