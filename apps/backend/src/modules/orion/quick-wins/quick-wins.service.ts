// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class QuickWinsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Welcome Email: create/update template for post-signup automation
   */
  async setupWelcomeAutomation() {
    const template = await this.prisma.emailTemplate.upsert({
      where: { slug: 'welcome-email' },
      create: {
        name: 'Welcome Email',
        slug: 'welcome-email',
        subject: 'Bienvenue sur Luneo! 🎉',
        htmlContent: this.getWelcomeEmailHtml(),
        textContent:
          'Bienvenue sur Luneo! Commencez a creer des designs incroyables.',
        variables: ['firstName', 'loginUrl'],
      },
      update: {
        name: 'Welcome Email',
        subject: 'Bienvenue sur Luneo! 🎉',
        htmlContent: this.getWelcomeEmailHtml(),
        textContent:
          'Bienvenue sur Luneo! Commencez a creer des designs incroyables.',
        variables: ['firstName', 'loginUrl'],
      },
    });
    return { template, status: 'ready' as const };
  }

  /**
   * Low Credits Alert: users with aiCredits <= 10
   */
  async checkLowCredits() {
    const users = await this.prisma.user.findMany({
      where: {
        aiCredits: { lte: 10 },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        aiCredits: true,
      },
    });
    return { usersAtRisk: users.length, users };
  }

  /**
   * Churn Alert: users inactive > 14 days (by lastLoginAt)
   */
  async checkInactiveUsers(daysThreshold: number = 14) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const users = await this.prisma.user.findMany({
      where: {
        lastLoginAt: { lt: thresholdDate },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastLoginAt: true,
      },
      take: 100,
    });
    return {
      inactiveUsers: users.length,
      users,
      thresholdDays: daysThreshold,
    };
  }

  /**
   * Trial Ending Reminder: brands whose trial ends in 1-3 days; returns users of those brands
   */
  async checkTrialEnding() {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const brands = await this.prisma.brand.findMany({
      where: {
        trialEndsAt: { gte: now, lte: threeDays },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        trialEndsAt: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    const users = brands.flatMap((b) =>
      b.users.map((u) => ({
        ...u,
        trialEndsAt: b.trialEndsAt,
        brandName: b.name,
      })),
    );

    return { trialEnding: users.length, users, brands: brands.length };
  }

  /**
   * Status of all quick wins
   */
  async getStatus() {
    const [welcomeTemplate, welcomeSentCount, lowCredits, inactive, trialEnding] =
      await Promise.all([
        this.prisma.emailTemplate.findFirst({
          where: { slug: 'welcome-email' },
        }),
        this.prisma.emailLog.count({
          where: {
            OR: [
              { template: 'welcome-email' },
              { subject: { contains: 'Bienvenue', mode: 'insensitive' } },
            ],
          },
        }),
        this.checkLowCredits(),
        this.checkInactiveUsers(),
        this.checkTrialEnding(),
      ]);

    return {
      welcomeEmail: {
        configured: !!welcomeTemplate,
        templateId: welcomeTemplate?.id ?? null,
        lastSentCount: welcomeSentCount,
      },
      lowCreditsAlert: { usersAtRisk: lowCredits.usersAtRisk },
      churnAlert: { inactiveUsers: inactive.inactiveUsers },
      trialReminder: { trialEnding: trialEnding.trialEnding },
    };
  }

  private getWelcomeEmailHtml(): string {
    return `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #8B5CF6; font-size: 28px;">Bienvenue sur Luneo! 🎉</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Bonjour {{firstName}},<br><br>
          Nous sommes ravis de vous accueillir sur Luneo, la plateforme tout-en-un pour creer, gerer et vendre vos designs.
        </p>
        <div style="margin: 30px 0;">
          <a href="{{loginUrl}}" style="background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Commencer maintenant →
          </a>
        </div>
        <p style="color: #6B7280; font-size: 14px;">
          Voici ce que vous pouvez faire :<br>
          ✨ Creer des designs avec l'IA<br>
          🛍️ Configurer votre boutique en ligne<br>
          📊 Suivre vos performances
        </p>
      </div>
    `;
  }
}
