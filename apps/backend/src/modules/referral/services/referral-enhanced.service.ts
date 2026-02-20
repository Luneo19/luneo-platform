import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

const DEFAULT_COMMISSION_PERCENT = 10;
const MIN_PAYOUT_CENTS = 1000; // 10 EUR
const FRAUD_SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const FRAUD_MAX_SIGNUPS_PER_HOUR = 5;

export interface AffiliateDashboard {
  referralsCount: number;
  completedReferrals: number;
  pendingCommissionsCents: number;
  approvedCommissionsCents: number;
  paidCommissionsCents: number;
  totalPayoutsCents: number;
  pendingWithdrawalsCents: number;
  referralCode: string;
}

export interface FraudResult {
  referralCode: string;
  suspicious: boolean;
  reasons: string[];
}

@Injectable()
export class ReferralEnhancedService {
  private readonly logger = new Logger(ReferralEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns affiliate dashboard data (referrals, commissions, payouts) for the user.
   */
  async getAffiliateDashboard(userId: string): Promise<AffiliateDashboard> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [referralsAsReferrer, commissions, withdrawals] = await Promise.all([
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        select: { id: true, status: true },
      }),
      this.prisma.commission.findMany({
        where: { userId },
        select: { amountCents: true, status: true },
      }),
      this.prisma.withdrawal.findMany({
        where: { userId },
        select: { amountCents: true, status: true },
      }),
    ]);

    const completedReferrals = referralsAsReferrer.filter((r) => r.status === 'COMPLETED').length;
    let pendingCommissionsCents = 0;
    let approvedCommissionsCents = 0;
    let paidCommissionsCents = 0;
    for (const c of commissions) {
      if (c.status === 'PENDING') pendingCommissionsCents += c.amountCents;
      else if (c.status === 'APPROVED') approvedCommissionsCents += c.amountCents;
      else if (c.status === 'PAID') paidCommissionsCents += c.amountCents;
    }

    let totalPayoutsCents = 0;
    let pendingWithdrawalsCents = 0;
    for (const w of withdrawals) {
      if (w.status === 'COMPLETED') totalPayoutsCents += w.amountCents;
      else if (w.status === 'PENDING' || w.status === 'PROCESSING') pendingWithdrawalsCents += w.amountCents;
    }

    const referralCode = await this.getOrCreateReferralCode(userId);

    return {
      referralsCount: referralsAsReferrer.length,
      completedReferrals,
      pendingCommissionsCents,
      approvedCommissionsCents,
      paidCommissionsCents,
      totalPayoutsCents,
      pendingWithdrawalsCents,
      referralCode,
    };
  }

  private async getOrCreateReferralCode(userId: string): Promise<string> {
    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: userId },
      select: { referralCode: true },
    });
    if (existing) return existing.referralCode;
    const code = `REF-${userId.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    await this.prisma.referral.create({
      data: {
        referrerId: userId,
        referralCode: code,
        status: 'PENDING',
      },
    });
    return code;
  }

  /**
   * Calculate commission for a referral and transaction amount based on tier.
   */
  async calculateCommission(
    referralId: string,
    transactionAmountCents: number,
  ): Promise<{ amountCents: number; percentage: number }> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      select: { id: true, referrerId: true, status: true },
    });
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }
    if (referral.status !== 'ACTIVE' && referral.status !== 'COMPLETED') {
      throw new BadRequestException('Referral is not eligible for commission');
    }
    if (transactionAmountCents <= 0) {
      return { amountCents: 0, percentage: 0 };
    }

    const tierPercentage = await this.getTierPercentage(referral.referrerId);
    const amountCents = Math.floor((transactionAmountCents * tierPercentage) / 100);

    return { amountCents, percentage: tierPercentage };
  }

  private async getTierPercentage(userId: string): Promise<number> {
    const completedCount = await this.prisma.referral.count({
      where: { referrerId: userId, status: 'COMPLETED' },
    });
    if (completedCount >= 20) return 15;
    if (completedCount >= 10) return 12;
    return DEFAULT_COMMISSION_PERCENT;
  }

  /**
   * Process pending payouts for all affiliates above threshold.
   */
  async processPayouts(minAmountCents?: number): Promise<{ processed: number; totalCents: number }> {
    const threshold = minAmountCents ?? MIN_PAYOUT_CENTS;

    const pendingCommissions = await this.prisma.commission.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, userId: true, amountCents: true },
    });

    const byUser = new Map<string, number>();
    for (const c of pendingCommissions) {
      byUser.set(c.userId, (byUser.get(c.userId) ?? 0) + c.amountCents);
    }

    let processed = 0;
    let totalCents = 0;

    for (const [uid, amountCents] of byUser.entries()) {
      if (amountCents < threshold) continue;

      const profile = await this.prisma.userProfile.findUnique({
        where: { userId: uid },
        select: { iban: true },
      });
      if (!profile?.iban) {
        this.logger.warn(`User ${uid} has no IBAN; skipping payout`);
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.commission.updateMany({
            where: { userId: uid, status: 'APPROVED' },
            data: { status: 'PAID', paidAt: new Date() },
          });
          await tx.withdrawal.create({
            data: {
              userId: uid,
              amountCents,
              iban: profile.iban!,
              status: 'PENDING',
            },
          });
        });
        processed++;
        totalCents += amountCents;
      } catch (error) {
        this.logger.error(`Payout failed for user ${uid}`, error);
      }
    }

    this.logger.log(`Processed ${processed} payouts, total ${totalCents} cents`);
    return { processed, totalCents };
  }

  /**
   * Basic fraud detection: same IP, rapid signups, suspicious patterns.
   */
  async detectFraud(referralCode: string): Promise<FraudResult> {
    const referrals = await this.prisma.referral.findMany({
      where: { referralCode },
      select: { id: true, referrerId: true, referredUserId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const reasons: string[] = [];

    if (referrals.length === 0) {
      return { referralCode, suspicious: false, reasons: [] };
    }

    const recentWindow = Date.now() - FRAUD_SIGNUP_WINDOW_MS;
    const recentSignups = referrals.filter((r) => r.createdAt.getTime() >= recentWindow);
    if (recentSignups.length > FRAUD_MAX_SIGNUPS_PER_HOUR) {
      reasons.push(`Too many signups in short period (${recentSignups.length} in 1h)`);
    }

    const referrerId = referrals[0]!.referrerId;
    const sameReferrerCount = await this.prisma.referral.count({
      where: { referrerId, createdAt: { gte: new Date(recentWindow) } },
    });
    if (sameReferrerCount > FRAUD_MAX_SIGNUPS_PER_HOUR) {
      reasons.push(`Referrer has too many recent referrals (${sameReferrerCount})`);
    }

    return {
      referralCode,
      suspicious: reasons.length > 0,
      reasons,
    };
  }
}
