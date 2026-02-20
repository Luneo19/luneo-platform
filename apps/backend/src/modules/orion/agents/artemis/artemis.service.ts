import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ORION_DEFAULTS, ARTEMIS_THRESHOLDS, AuditLogMetadata } from '../../orion.constants';

@Injectable()
export class ArtemisService {
  private readonly logger = new Logger(ArtemisService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async scanThreats() {
    this.logger.debug('Artemis: Scanning for security threats');

    await Promise.all([
      this.detectBruteForce(),
      this.detectSuspiciousLogins(),
      this.detectAPIAbuse(),
    ]);
  }

  async getActiveThreats(limit: number = ORION_DEFAULTS.LIST_LIMIT) {
    return this.prisma.securityThreat.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async resolveThreat(threatId: string, resolvedBy: string) {
    return this.prisma.securityThreat.update({
      where: { id: threatId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  }

  async blockIP(
    ipAddress: string,
    reason: string,
    blockedBy: string,
    expiresAt?: Date,
    brandId?: string,
  ) {
    return this.prisma.blockedIP.upsert({
      where: {
        brandId_ipAddress: {
          brandId: brandId || '',
          ipAddress,
        },
      },
      update: {
        reason,
        blockedBy,
        expiresAt,
        isActive: true,
      },
      create: {
        ipAddress,
        reason,
        blockedBy,
        expiresAt,
        isActive: true,
        brandId,
      },
    });
  }

  async unblockIP(ipAddress: string, brandId?: string) {
    await this.prisma.blockedIP.updateMany({
      where: { ipAddress, brandId, isActive: true },
      data: { isActive: false },
    });
  }

  async getBlockedIPs(activeOnly = true) {
    return this.prisma.blockedIP.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFraudChecks(limit: number = ORION_DEFAULTS.LIST_LIMIT) {
    return this.prisma.fraudCheck.findMany({
      where: { riskLevel: { in: ['high', 'critical'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getSecurityScore(): Promise<number> {
    const [activeThreats, blockedIPs, recentFraud] = await Promise.all([
      this.prisma.securityThreat.count({ where: { status: 'active' } }),
      this.prisma.blockedIP.count({ where: { isActive: true } }),
      this.prisma.fraudCheck.count({
        where: {
          riskLevel: { in: ['high', 'critical'] },
          createdAt: { gte: new Date(Date.now() - ARTEMIS_THRESHOLDS.ONE_DAY_MS) },
        },
      }),
    ]);

    let score = 100;
    score -= activeThreats * ARTEMIS_THRESHOLDS.SECURITY_SCORE_THREAT_PENALTY;
    score -= recentFraud * ARTEMIS_THRESHOLDS.SECURITY_SCORE_FRAUD_PENALTY;
    score += blockedIPs > 0 ? ARTEMIS_THRESHOLDS.SECURITY_SCORE_BLOCKED_BONUS : 0;

    return Math.max(0, Math.min(100, score));
  }

  async getDashboard() {
    const [
      activeThreats,
      blockedIPs,
      recentFraud,
      securityScore,
      recentAudit,
    ] = await Promise.all([
      this.getActiveThreats(10),
      this.getBlockedIPs(),
      this.getFraudChecks(10),
      this.getSecurityScore(),
      this.prisma.auditLog.findMany({
        where: {
          eventType: { startsWith: 'security' },
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
      }),
    ]);

    return {
      securityScore,
      activeThreats,
      blockedIPs,
      recentFraud,
      recentAudit,
      stats: {
        threatsCount: activeThreats.length,
        blockedIPsCount: blockedIPs.length,
        fraudAlertsCount: recentFraud.length,
      },
    };
  }

  private async detectBruteForce() {
    const tenMinAgo = new Date(Date.now() - ARTEMIS_THRESHOLDS.BRUTE_FORCE_WINDOW_MS);

    const failedLogins = await this.prisma.auditLog.groupBy({
      by: ['metadata'],
      where: {
        eventType: 'auth.login',
        success: false,
        timestamp: { gte: tenMinAgo },
      },
      _count: true,
    });

    for (const group of failedLogins) {
      if (group._count >= ARTEMIS_THRESHOLDS.BRUTE_FORCE_MIN_ATTEMPTS) {
        const ip = (group.metadata as AuditLogMetadata)?.ipAddress;
        if (ip) {
          await this.createThreat({
            type: 'brute_force',
            severity: group._count >= ARTEMIS_THRESHOLDS.BRUTE_FORCE_CRITICAL_THRESHOLD ? 'critical' : 'high',
            source: ip,
            description: `${group._count} tentatives de connexion échouées depuis ${ip} en 10 minutes`,
            ipAddress: ip,
          });
        }
      }
    }
  }

  private async detectSuspiciousLogins() {
    const oneHourAgo = new Date(Date.now() - ARTEMIS_THRESHOLDS.SUSPICIOUS_LOGIN_WINDOW_MS);

    const recentLogins = await this.prisma.auditLog.findMany({
      where: {
        eventType: 'auth.login',
        success: true,
        timestamp: { gte: oneHourAgo },
      },
      select: {
        userId: true,
        metadata: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    const userLogins = new Map<string, Array<{ ip: string; time: Date }>>();
    for (const login of recentLogins) {
      if (!login.userId) continue;
      const ip = (login.metadata as AuditLogMetadata)?.ipAddress;
      if (!ip) continue;

      if (!userLogins.has(login.userId)) {
        userLogins.set(login.userId, []);
      }
      userLogins.get(login.userId)!.push({ ip, time: login.timestamp });
    }

    for (const [userId, logins] of userLogins) {
      const uniqueIPs = new Set(logins.map((l) => l.ip));
      if (uniqueIPs.size >= ARTEMIS_THRESHOLDS.SUSPICIOUS_LOGIN_IP_THRESHOLD) {
        await this.createThreat({
          type: 'suspicious_login',
          severity: 'medium',
          source: 'login_analysis',
          description: `Utilisateur ${userId} connecté depuis ${uniqueIPs.size} IPs différentes en 1h`,
          userId,
        });
      }
    }
  }

  private async detectAPIAbuse() {
    const fiveMinAgo = new Date(Date.now() - ARTEMIS_THRESHOLDS.API_ABUSE_WINDOW_MS);

    const highActivity = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: fiveMinAgo },
        userId: { not: null },
      },
      _count: true,
      having: { userId: { _count: { gt: 100 } } },
    });

    for (const user of highActivity) {
      if (user._count > ARTEMIS_THRESHOLDS.API_ABUSE_THRESHOLD) {
        await this.createThreat({
          type: 'api_abuse',
          severity: 'warning',
          source: 'rate_analysis',
          description: `Activité API anormale: ${user._count} requêtes en 5 minutes pour user ${user.userId}`,
          userId: user.userId || undefined,
        });
      }
    }
  }

  private async createThreat(data: {
    type: string;
    severity: string;
    source: string;
    description: string;
    ipAddress?: string;
    userId?: string;
    brandId?: string;
  }) {
    const recent = await this.prisma.securityThreat.findFirst({
      where: {
        type: data.type,
        status: 'active',
        ipAddress: data.ipAddress,
        userId: data.userId,
        createdAt: { gte: new Date(Date.now() - ARTEMIS_THRESHOLDS.THREAT_DEDUP_WINDOW_MS) },
      },
    });

    if (!recent) {
      await this.prisma.securityThreat.create({
        data: {
          type: data.type,
          severity: data.severity,
          source: data.source,
          description: data.description,
          ipAddress: data.ipAddress,
          userId: data.userId,
          brandId: data.brandId,
        },
      });
    }
  }
}
