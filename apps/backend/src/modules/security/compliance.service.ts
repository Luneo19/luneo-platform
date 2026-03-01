import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

export interface ComplianceStatus {
  gdprCompliant: boolean;
  dataRetentionDays: number;
  lastAuditDate: Date | null;
  pendingDeletionRequests: number;
  encryptionStatus: 'full' | 'partial' | 'none';
}

export interface PurgeResult {
  conversationsPurged: number;
  messagesPurged: number;
  eventsPurged: number;
}

export interface UserDataExport {
  exportedAt: string;
  userId: string;
  organizationId: string;
  profile: Record<string, unknown>;
  conversations: Array<Record<string, unknown>>;
  messages: Array<Record<string, unknown>>;
  settings: Record<string, unknown>;
}

const MIN_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 365;
const DEFAULT_RETENTION_DAYS = 90;

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async getComplianceStatus(organizationId: string): Promise<ComplianceStatus> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${organizationId} introuvable`);
    }

    const features = (org.features as Record<string, unknown>) ?? {};
    const retentionDays =
      typeof features.dataRetentionDays === 'number'
        ? features.dataRetentionDays
        : DEFAULT_RETENTION_DAYS;

    const gdprCompliant =
      features.gdprConsentEnabled === true && retentionDays <= MAX_RETENTION_DAYS;

    const lastAuditDate =
      features.lastAuditDate && typeof features.lastAuditDate === 'string'
        ? new Date(features.lastAuditDate)
        : null;

    const pendingDeletionRequests = await this.prisma.auditLog.count({
      where: {
        organizationId,
        action: 'gdpr.data_deleted',
        success: false,
      },
    });

    const hasEncryptionAtRest = features.encryptionAtRest === true;
    const hasEncryptionInTransit = features.encryptionInTransit !== false;
    let encryptionStatus: 'full' | 'partial' | 'none';
    if (hasEncryptionAtRest && hasEncryptionInTransit) {
      encryptionStatus = 'full';
    } else if (hasEncryptionAtRest || hasEncryptionInTransit) {
      encryptionStatus = 'partial';
    } else {
      encryptionStatus = 'none';
    }

    return {
      gdprCompliant,
      dataRetentionDays: retentionDays,
      lastAuditDate,
      pendingDeletionRequests,
      encryptionStatus,
    };
  }

  async setRetentionPolicy(organizationId: string, days: number): Promise<void> {
    if (days < MIN_RETENTION_DAYS || days > MAX_RETENTION_DAYS) {
      throw new BadRequestException(
        `La politique de rétention doit être entre ${MIN_RETENTION_DAYS} et ${MAX_RETENTION_DAYS} jours`,
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${organizationId} introuvable`);
    }

    const features = (org.features as Record<string, unknown>) ?? {};

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        features: { ...features, dataRetentionDays: days },
      },
    });

    this.logger.log(
      `Politique de rétention mise à jour pour org ${organizationId}: ${days} jours`,
    );
  }

  async purgeExpiredData(organizationId: string): Promise<PurgeResult> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { features: true },
    });

    if (!org) {
      throw new NotFoundException(`Organisation ${organizationId} introuvable`);
    }

    const features = (org.features as Record<string, unknown>) ?? {};
    const retentionDays =
      typeof features.dataRetentionDays === 'number'
        ? features.dataRetentionDays
        : DEFAULT_RETENTION_DAYS;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(
      `Purge des données expirées pour org ${organizationId} (avant ${cutoffDate.toISOString()})`,
    );

    const conversationsResult = await this.prisma.conversation.updateMany({
      where: {
        organizationId,
        createdAt: { lt: cutoffDate },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    const messagesResult = await this.prisma.message.updateMany({
      where: {
        conversation: {
          organizationId,
          createdAt: { lt: cutoffDate },
        },
        content: { not: '[REDACTED]' },
      },
      data: { content: '[REDACTED]' },
    });

    const eventsResult = await this.prisma.analyticsEvent.deleteMany({
      where: {
        organizationId,
        createdAt: { lt: cutoffDate },
      },
    });

    const result: PurgeResult = {
      conversationsPurged: conversationsResult.count,
      messagesPurged: messagesResult.count,
      eventsPurged: eventsResult.count,
    };

    this.logger.log(
      `Purge terminée pour org ${organizationId}: ${JSON.stringify(result)}`,
    );

    return result;
  }

  async exportUserData(userId: string, organizationId: string): Promise<UserDataExport> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        locale: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        memberships: {
          where: { organizationId },
          select: { role: true, joinedAt: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${userId} introuvable`);
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        organizationId,
        OR: [{ visitorId: userId }, { assignedToId: userId }],
        deletedAt: null,
      },
      select: {
        id: true,
        channelType: true,
        visitorEmail: true,
        visitorName: true,
        status: true,
        messageCount: true,
        summary: true,
        topics: true,
        sentiment: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const conversationIds = conversations.map((c) => c.id);

    const messages =
      conversationIds.length > 0
        ? await this.prisma.message.findMany({
            where: {
              conversationId: { in: conversationIds },
              deletedAt: null,
            },
            select: {
              id: true,
              conversationId: true,
              role: true,
              content: true,
              contentType: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          })
        : [];

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, defaultLanguage: true, defaultTone: true },
    });

    return {
      exportedAt: new Date().toISOString(),
      userId,
      organizationId,
      profile: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        locale: user.locale,
        timezone: user.timezone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        memberships: user.memberships,
      },
      conversations: conversations as unknown as Array<Record<string, unknown>>,
      messages: messages as unknown as Array<Record<string, unknown>>,
      settings: {
        organization: org,
      },
    };
  }

  async getConsentStatus(
    conversationId: string,
  ): Promise<{ hasConsent: boolean; consentDate: Date | null }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { visitorMetadata: true, organizationId: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} introuvable`);
    }

    const metadata = (conversation.visitorMetadata as Record<string, unknown>) ?? {};
    const hasConsent = metadata.gdprConsent === true;
    const consentDate =
      metadata.gdprConsentDate && typeof metadata.gdprConsentDate === 'string'
        ? new Date(metadata.gdprConsentDate)
        : null;

    return { hasConsent, consentDate };
  }
}
