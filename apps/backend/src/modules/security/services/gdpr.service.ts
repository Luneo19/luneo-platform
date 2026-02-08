import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AuditLogsService, AuditEventType } from './audit-logs.service';

/**
 * Service GDPR (Conformité RGPD)
 * Gère les droits des utilisateurs: accès, rectification, effacement, portabilité
 */
@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  /**
   * Exporter toutes les données d'un utilisateur (Right to access)
   */
  async exportUserData(userId: string): Promise<{
    user: any;
    designs: any[];
    orders: any[];
    auditLogs: any[];
    usageMetrics: any[];
    exportedAt: Date;
  }> {
    try {
      this.logger.log(`Exporting data for user ${userId}`);

      // Récupérer toutes les données de l'utilisateur
      const [user, designs, orders, auditLogs, usageMetrics] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            brandId: true,
            createdAt: true,
            updatedAt: true,
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
                website: true,
              },
            },
          },
        }),
        this.prisma.design.findMany({
          where: { userId },
        }),
        this.prisma.order.findMany({
          where: { userId },
        }),
        this.auditLogs.getUserActivity(userId, 1000),
        this.prisma.usageMetric.findMany({
          where: {
            brand: {
              users: {
                some: { id: userId },
              },
            },
          },
          take: 1000,
        }),
      ]);

      // Anonymiser les données sensibles dans l'export
      // Note: password n'est pas inclus dans le select, donc pas besoin de le supprimer
      const sanitizedUser = { ...user };

      const exportData = {
        user: sanitizedUser,
        designs,
        orders,
        auditLogs,
        usageMetrics,
        exportedAt: new Date(),
      };

      // Logger l'export
      await this.auditLogs.logSuccess(
        AuditEventType.DATA_EXPORTED,
        'User data exported',
        {
          userId,
          userEmail: user?.email,
          metadata: {
            itemsCount: {
              designs: designs.length,
              orders: orders.length,
              auditLogs: auditLogs.length,
              usageMetrics: usageMetrics.length,
            },
          },
        },
      );

      return exportData;
    } catch (error) {
      this.logger.error(`Failed to export user data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Supprimer toutes les données d'un utilisateur (Right to erasure)
   */
  async deleteUserData(userId: string, reason?: string): Promise<{
    deleted: boolean;
    itemsDeleted: Record<string, number>;
  }> {
    try {
      this.logger.warn(`Deleting data for user ${userId}. Reason: ${reason || 'N/A'}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, brandId: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Compter ce qui va être supprimé
      const [designsCount, ordersCount] = await Promise.all([
        this.prisma.design.count({ where: { userId } }),
        this.prisma.order.count({ where: { userId } }),
      ]);

      // Supprimer toutes les données associées
      await this.prisma.$transaction([
        // Designs
        this.prisma.design.deleteMany({ where: { userId } }),

        // Orders (garder mais anonymiser)
        this.prisma.order.updateMany({
          where: { userId },
          data: {
            userId: null,
            userEmail: 'deleted@user.anonymized',
          },
        }),

        // Usage metrics (anonymiser)
        // Pas de userId direct, mais on peut anonymiser via le brand

        // Supprimer l'utilisateur
        this.prisma.user.delete({ where: { id: userId } }),
      ]);

      // Logger la suppression
      await this.auditLogs.logSuccess(
        AuditEventType.DATA_DELETED,
        'User data deleted (GDPR)',
        {
          userId,
          userEmail: user.email,
          brandId: user.brandId,
          metadata: {
            reason,
            itemsDeleted: {
              designs: designsCount,
              orders: ordersCount,
            },
          },
        },
      );

      return {
        deleted: true,
        itemsDeleted: {
          user: 1,
          designs: designsCount,
          orders: ordersCount,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to delete user data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Anonymiser les données d'un utilisateur (alternative à la suppression)
   */
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      this.logger.log(`Anonymizing data for user ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      // Générer un email anonymisé
      const anonymousEmail = `anonymous_${Date.now()}@deleted.user`;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymousEmail,
          firstName: 'Deleted',
          lastName: 'User',
          password: null,
          // phone: null, // Commenté car pas dans UserUpdateInput
          avatar: null,
        },
      });

      await this.auditLogs.logSuccess(
        AuditEventType.DATA_DELETED,
        'User data anonymized',
        {
          userId,
          userEmail: user?.email,
          metadata: { anonymousEmail },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to anonymize user data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Enregistrer le consentement d'un utilisateur
   */
  async recordConsent(
    userId: string,
    consentType: string,
    given: boolean,
  ): Promise<void> {
    try {
      await this.prisma.userConsent.create({
        data: {
          userId,
          consentType,
          granted: given,
          recordedAt: new Date(),
        },
      });

      await this.auditLogs.logSuccess(
        given ? AuditEventType.CONSENT_GIVEN : AuditEventType.CONSENT_WITHDRAWN,
        `Consent ${given ? 'given' : 'withdrawn'} for ${consentType}`,
        {
          userId,
          metadata: { consentType, given },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to record consent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Vérifier le consentement d'un utilisateur
   */
  async hasConsent(userId: string, consentType: string): Promise<boolean> {
    try {
      const latestConsent = await this.prisma.userConsent.findFirst({
        where: { userId, consentType },
        orderBy: { recordedAt: 'desc' },
      });

      return latestConsent?.granted || false;
    } catch (error) {
      this.logger.error(`Failed to check consent: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Récupérer l'historique des consentements
   */
  async getConsentHistory(userId: string): Promise<any[]> {
    try {
      return await this.prisma.userConsent.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get consent history: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Générer un rapport de conformité GDPR pour un brand
   */
  async generateComplianceReport(brandId: string): Promise<{
    brand: any;
    usersCount: number;
    consentsCount: number;
    dataExportsCount: number;
    dataDeletionsCount: number;
    complianceScore: number;
    recommendations: string[];
  }> {
    try {
      const [
        brand,
        usersCount,
        consentsCount,
        recentExports,
        recentDeletions,
      ] = await Promise.all([
        this.prisma.brand.findUnique({ where: { id: brandId } }),
        this.prisma.user.count({ where: { brandId } }),
        this.prisma.userConsent.count({
          where: { user: { brandId } },
        }),
        this.auditLogs.search({
          brandId,
          eventType: AuditEventType.DATA_EXPORTED,
          limit: 1000,
        }),
        this.auditLogs.search({
          brandId,
          eventType: AuditEventType.DATA_DELETED,
          limit: 1000,
        }),
      ]);

      // Calculer un score de conformité (simplifié)
      let complianceScore = 100;
      const recommendations: string[] = [];

      // Vérifier les politiques (champs optionnels sur Brand ou dans config)
      const brandWithPolicies = brand as { privacyPolicyUrl?: string; termsOfServiceUrl?: string } | null;
      if (!brandWithPolicies?.privacyPolicyUrl) {
        complianceScore -= 20;
        recommendations.push('❌ Add a privacy policy URL');
      }

      if (!brandWithPolicies?.termsOfServiceUrl) {
        complianceScore -= 10;
        recommendations.push('❌ Add terms of service URL');
      }

      // Vérifier les consentements
      if (consentsCount < usersCount) {
        complianceScore -= 15;
        recommendations.push(
          '⚠️  Not all users have recorded consents. Implement consent collection.',
        );
      }

      // Vérifier les exports de données
      if (recentExports.total === 0) {
        recommendations.push(
          '✅ No data export requests (good, or users are not aware of this right)',
        );
      }

      // Vérifier les suppressions
      if (recentDeletions.total === 0) {
        recommendations.push(
          '✅ No data deletion requests (good, or users are not aware of this right)',
        );
      }

      if (complianceScore >= 90) {
        recommendations.unshift('✅ Excellent GDPR compliance!');
      } else if (complianceScore >= 70) {
        recommendations.unshift('⚠️  Good compliance, but improvements needed');
      } else {
        recommendations.unshift('❌ Critical compliance issues detected');
      }

      return {
        brand,
        usersCount,
        consentsCount,
        dataExportsCount: recentExports.total,
        dataDeletionsCount: recentDeletions.total,
        complianceScore,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate compliance report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Planifier la suppression automatique des données anciennes (data retention)
   */
  async scheduleDataRetention(days: number = 365 * 3): Promise<{
    analyzed: number;
    scheduled: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Identifier les designs inactifs à supprimer
      const oldDesigns = await this.prisma.design.findMany({
        where: {
          updatedAt: { lte: cutoffDate },
          status: { not: 'COMPLETED' },
        },
        select: { id: true },
      });

      this.logger.log(
        `Found ${oldDesigns.length} old designs to delete (older than ${days} days)`,
      );

      // Ici, on pourrait les marquer pour suppression ou les supprimer directement
      // Pour l'instant, on retourne juste le count

      return {
        analyzed: oldDesigns.length,
        scheduled: 0, // À implémenter avec un scheduler
      };
    } catch (error) {
      this.logger.error(
        `Failed to schedule data retention: ${error.message}`,
        error.stack,
      );
      return { analyzed: 0, scheduled: 0 };
    }
  }
}

