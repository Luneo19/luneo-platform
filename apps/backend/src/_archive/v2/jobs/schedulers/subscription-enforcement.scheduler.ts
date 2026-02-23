import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { DistributedLockService } from '@/libs/redis/distributed-lock.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const GRACE_DAYS = 3;

/**
 * Subscription enforcement scheduler.
 * Runs every hour to:
 * 1. Set readOnlyMode = true for brands whose grace period has expired.
 * 2. Send grace period reminder emails at day 1 and day 2.
 *
 * Uses a distributed lock to prevent double execution in multi-instance deployments.
 */
@Injectable()
export class SubscriptionEnforcementScheduler {
  private readonly logger = new Logger(SubscriptionEnforcementScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly lock: DistributedLockService,
  ) {}

  /**
   * Run every hour: enforce read-only for expired grace periods and send reminders.
   */
  @Cron('0 * * * *') // Every hour at minute 0
  async enforceSubscription() {
    const acquired = await this.lock.acquire('subscription-enforcement', 600);
    if (!acquired) {
      this.logger.debug('Subscription enforcement skipped — another instance holds the lock');
      return;
    }
    try {
      await this.activateReadOnlyMode();
      await this.sendGraceReminders();
      await this.expireStaleTrials();
    } catch (error) {
      this.logger.error('Subscription enforcement failed', error instanceof Error ? error.stack : String(error));
    } finally {
      await this.lock.release('subscription-enforcement');
    }
  }

  /**
   * Brands with gracePeriodEndsAt in the past and not yet in read-only mode:
   * 1. Set readOnlyMode = true
   * 2. Downgrade plan to FREE to prevent paid-tier quota access
   */
  private async activateReadOnlyMode() {
    const now = new Date();
    const updated = await this.prisma.brand.updateMany({
      where: {
        gracePeriodEndsAt: { not: null, lt: now },
        readOnlyMode: false,
      },
      data: {
        readOnlyMode: true,
        plan: 'free',
        subscriptionPlan: 'FREE',
      },
    });
    if (updated.count > 0) {
      this.logger.log(`Read-only mode enabled + plan downgraded to FREE for ${updated.count} brand(s) after grace period expiry`);
    }
  }

  /**
   * For brands still in grace period, send day 1 and day 2 reminder emails.
   * Day 0 is sent by Stripe webhook on payment failure.
   */
  private async sendGraceReminders() {
    const now = new Date();
    const brandsInGrace = await this.prisma.brand.findMany({
      where: {
        gracePeriodEndsAt: { not: null, gt: now },
        subscriptionStatus: 'PAST_DUE',
      },
      include: {
        users: { select: { id: true, email: true, firstName: true, role: true } },
      },
    });

    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? 'https://luneo.app';

    for (const brand of brandsInGrace) {
      const graceEndsAt = brand.gracePeriodEndsAt!;
      const graceStartMs = graceEndsAt.getTime() - GRACE_DAYS * MS_PER_DAY;
      const daysElapsed = Math.floor((now.getTime() - graceStartMs) / MS_PER_DAY);
      const lastReminder = brand.lastGraceReminderDay ?? -1;

      const owner = brand.users?.find((u) => u.role === 'BRAND_ADMIN') || brand.users?.[0];
      if (!owner?.email) continue;

      if (daysElapsed >= 1 && lastReminder < 1) {
        await this.sendReminderEmail(owner.email, owner.firstName ?? '', 1, frontendUrl);
        await this.prisma.brand.update({
          where: { id: brand.id },
          data: { lastGraceReminderDay: 1 },
        });
        this.logger.log(`Grace day 1 reminder sent for brand ${brand.id}`);
      } else if (daysElapsed >= 2 && lastReminder < 2) {
        await this.sendReminderEmail(owner.email, owner.firstName ?? '', 2, frontendUrl);
        await this.prisma.brand.update({
          where: { id: brand.id },
          data: { lastGraceReminderDay: 2 },
        });
        this.logger.log(`Grace day 2 reminder sent for brand ${brand.id}`);
      }
    }
  }

  /**
   * Safety net: expire trials that ended more than 24h ago but whose status was
   * never updated (e.g. Stripe webhook lost). Downgrade to FREE + no subscription.
   */
  private async expireStaleTrials() {
    const oneDayAgo = new Date(Date.now() - MS_PER_DAY);
    const staleTrials = await this.prisma.brand.findMany({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { not: null, lt: oneDayAgo },
      },
      select: { id: true, trialEndsAt: true },
    });

    if (staleTrials.length === 0) return;

    for (const brand of staleTrials) {
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          subscriptionStatus: 'CANCELED',
          plan: 'free',
          subscriptionPlan: 'FREE',
          stripeSubscriptionId: null,
          trialEndsAt: null,
        },
      });
      this.logger.warn(
        `Safety net: Brand ${brand.id} trial expired (trialEndsAt=${brand.trialEndsAt?.toISOString()}) — downgraded to FREE`,
      );
    }

    this.logger.log(`Safety net: ${staleTrials.length} stale trial(s) expired and downgraded to FREE`);
  }

  private async sendReminderEmail(to: string, firstName: string, day: number, frontendUrl: string) {
    const subject = day === 1
      ? 'Rappel — Paiement en attente (jour 1) — Luneo'
      : 'Dernier rappel — Paiement en attente (jour 2) — Luneo';
    const daysLeft = 3 - day;
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h1 style="color:#dc2626">Rappel : échec de paiement</h1>
  <p>Bonjour ${firstName || ''},</p>
  <p>Votre paiement n'a toujours pas été mis à jour. Il vous reste <strong>${daysLeft} jour(s)</strong> avant que votre compte ne passe en mode lecture seule.</p>
  <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin:20px 0">
    <p style="margin:0;color:#991b1b">Mettez à jour votre moyen de paiement pour continuer à utiliser toutes les fonctionnalités.</p>
  </div>
  <div style="margin:30px 0">
    <a href="${frontendUrl}/dashboard/billing" style="background:#dc2626;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Mettre à jour mes informations de paiement</a>
  </div>
  <p>L'équipe Luneo</p>
</div>`;

    try {
      await this.emailService.sendEmail({ to, subject, html });
    } catch (err) {
      this.logger.warn(`Failed to send grace day ${day} reminder to ${to}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
