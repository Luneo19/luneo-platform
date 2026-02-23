import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import type { CreditTransaction, CreditPack } from '@prisma/client';
import { ENDPOINT_COSTS, REAL_COSTS_CENTS } from './costs';

/**
 * Service de gestion des crédits IA
 * Optimisé avec cache Redis, transactions atomiques, et retry logic
 */
@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);
  private readonly CACHE_TTL = 5; // 5 secondes pour balance (fréquent mais critique)
  private readonly CACHE_KEY_PREFIX = 'credits:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Vérifier si l'utilisateur a assez de crédits
   * Optimisé avec cache Redis pour éviter queries répétées
   */
  async checkCredits(
    userId: string,
    endpoint: string,
    amount?: number,
  ): Promise<{
    sufficient: boolean;
    balance: number;
    required: number;
    missing: number;
    willCharge: boolean;
  }> {
    const required = amount || ENDPOINT_COSTS[endpoint] || 1;
    
    // Cache Redis (5 secondes) pour éviter queries répétées
    const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${userId}`;
    
    // Utiliser smart cache avec fetch function
    const balance = await this.cache.get<number>(
      cacheKey,
      'user',
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true },
        });
        return user?.aiCredits || 0;
      },
      { ttl: this.CACHE_TTL }
    ) || 0;

    const sufficient = balance >= required;
    const missing = sufficient ? 0 : required - balance;

    return {
      sufficient,
      balance,
      required,
      missing,
      willCharge: sufficient,
    };
  }

  /**
   * Déduire des crédits (transaction atomique)
   * Garantit la cohérence même en cas de concurrence
   */
  async deductCredits(
    userId: string,
    endpoint: string,
    metadata?: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: CreditTransaction;
    cost: number;
  }> {
    const cost = ENDPOINT_COSTS[endpoint] || 1;
    const realCostCents = REAL_COSTS_CENTS[endpoint] || 0;

    try {
      // Transaction Prisma pour garantir atomicité
      const result = await this.prisma.$transaction(async (tx) => {
        // ✅ FIX: Lock user row avec SELECT FOR UPDATE (PostgreSQL) pour éviter race conditions
        const lockedUsers = await tx.$queryRaw<Array<{ ai_credits: number; ai_credits_used: number; email: string }>>`
          SELECT ai_credits, ai_credits_used, email FROM "User" WHERE id = ${userId} FOR UPDATE
        `;

        const user = lockedUsers[0];
        if (!user) {
          throw new BadRequestException('User not found');
        }

        const userCredits = user.ai_credits;
        const _userCreditsUsed = user.ai_credits_used;

        if (userCredits < cost) {
          throw new BadRequestException(
            `Insufficient credits. Required: ${cost}, Available: ${userCredits}`,
          );
        }

        // Déduire crédits atomiquement
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { decrement: cost },
            aiCreditsUsed: { increment: cost },
          },
          select: { aiCredits: true },
        });

        // Enregistrer transaction pour audit trail
        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount: -cost,
            balanceBefore: userCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'usage',
            source: endpoint,
            metadata: {
              ...metadata,
              realCostCents,
              timestamp: new Date().toISOString(),
              userEmail: user.email,
            },
          },
        });

        return { newBalance: updatedUser.aiCredits, transaction };
      }, {
        timeout: 10000, // 10 secondes max pour transaction
        isolationLevel: 'RepeatableRead', // ✅ FIX: Plus sûr pour les opérations de crédits
      });

      // Invalider cache immédiatement
      const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${userId}`;
      try {
        await this.cache.delSimple(cacheKey);
        await this.cache.invalidateTags([`user:${userId}`]);
      } catch (cacheError) {
        // Ne pas bloquer si cache échoue
        this.logger.warn('Failed to invalidate cache', { error: cacheError });
      }

      this.logger.log(
        `Credits deducted: ${cost} for ${userId} on ${endpoint}. New balance: ${result.newBalance}`,
      );

      return {
        success: true,
        newBalance: result.newBalance,
        transaction: result.transaction,
        cost,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to deduct credits for ${userId} on ${endpoint}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        `Failed to deduct credits: ${message}`,
      );
    }
  }

  /**
   * Déduire un montant fixe de crédits (ex: achat marketplace)
   * Utilisé quand le coût n'est pas défini par ENDPOINT_COSTS.
   */
  async deductCreditsByAmount(
    userId: string,
    amount: number,
    source: string,
    metadata?: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: CreditTransaction;
    cost: number;
  }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const lockedUsers = await tx.$queryRaw<Array<{ ai_credits: number; ai_credits_used: number; email: string }>>`
          SELECT ai_credits, ai_credits_used, email FROM "User" WHERE id = ${userId} FOR UPDATE
        `;
        const user = lockedUsers[0];
        if (!user) {
          throw new BadRequestException('User not found');
        }
        const userCredits = user.ai_credits;
        if (userCredits < amount) {
          throw new BadRequestException(
            `Insufficient credits. Required: ${amount}, Available: ${userCredits}`,
          );
        }
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { decrement: amount },
            aiCreditsUsed: { increment: amount },
          },
          select: { aiCredits: true },
        });
        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount: -amount,
            balanceBefore: userCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'usage',
            source,
            metadata: {
              ...metadata,
              timestamp: new Date().toISOString(),
              userEmail: user.email,
            },
          },
        });
        return { newBalance: updatedUser.aiCredits, transaction };
      }, {
        timeout: 10000,
        isolationLevel: 'RepeatableRead',
      });

      const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${userId}`;
      try {
        await this.cache.delSimple(cacheKey);
        await this.cache.invalidateTags([`user:${userId}`]);
      } catch (cacheError) {
        this.logger.warn('Failed to invalidate cache', { error: cacheError });
      }

      this.logger.log(
        `Credits deducted by amount: ${amount} for ${userId} (${source}). New balance: ${result.newBalance}`,
      );

      return {
        success: true,
        newBalance: result.newBalance,
        transaction: result.transaction,
        cost: amount,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to deduct credits for ${userId} (${source}): ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to deduct credits: ${message}`,
      );
    }
  }

  /**
   * Refill monthly credits for a brand on subscription renewal (plan-included credits, no expiration).
   * Credits are applied to the brand's primary user (BRAND_ADMIN or first user).
   */
  async refillMonthlyCredits(
    brandId: string,
    planCredits: number,
  ): Promise<{
    success: boolean;
    userId?: string;
    newBalance?: number;
    transaction?: CreditTransaction;
    skipped?: boolean;
  }> {
    if (planCredits <= 0) {
      return { success: true, skipped: true };
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: { users: { orderBy: { createdAt: 'asc' }, take: 10 } },
    });
    if (!brand?.users?.length) {
      this.logger.warn(`No users found for brand ${brandId}, skipping monthly credit refill`);
      return { success: false, skipped: true };
    }

    const primaryUser = brand.users.find((u) => u.role === 'BRAND_ADMIN') || brand.users[0];
    if (!primaryUser) {
      return { success: false, skipped: true };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: primaryUser.id },
          select: { aiCredits: true, email: true },
        });
        if (!user) {
          throw new BadRequestException('User not found');
        }
        const updatedUser = await tx.user.update({
          where: { id: primaryUser.id },
          data: { aiCredits: { increment: planCredits } },
          select: { aiCredits: true },
        });
        const transaction = await tx.creditTransaction.create({
          data: {
            userId: primaryUser.id,
            amount: planCredits,
            balanceBefore: user.aiCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'monthly_refill',
            source: 'stripe_webhook',
            metadata: {
              brandId,
              timestamp: new Date().toISOString(),
              userEmail: user.email,
            },
          },
        });
        return { newBalance: updatedUser.aiCredits, transaction };
      }, { timeout: 10000, isolationLevel: 'ReadCommitted' });

      const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${primaryUser.id}`;
      try {
        await this.cache.delSimple(cacheKey);
        await this.cache.invalidateTags([`user:${primaryUser.id}`]);
      } catch (cacheError) {
        this.logger.warn('Failed to invalidate cache', { error: cacheError });
      }

      this.logger.log(
        `Monthly credits refilled: ${planCredits} for brand ${brandId} (user ${primaryUser.id}). New balance: ${result.newBalance}`,
      );
      return {
        success: true,
        userId: primaryUser.id,
        newBalance: result.newBalance,
        transaction: result.transaction,
      };
    } catch (error) {
      this.logger.error(
        `Failed to refill monthly credits for brand ${brandId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Ajouter des crédits (achat)
   * Appelé par webhook Stripe après paiement réussi
   */
  async addCredits(
    userId: string,
    amount: number,
    packId?: string,
    stripeSessionId?: string,
    stripePaymentId?: string,
    expiresAt?: Date | null,
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: CreditTransaction;
  }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { 
            aiCredits: true, 
            aiCreditsPurchased: true,
            email: true,
          },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        // Vérifier si transaction Stripe déjà traitée (idempotency)
        if (stripeSessionId) {
          const existing = await tx.creditTransaction.findFirst({
            where: {
              stripeSessionId,
              type: 'purchase',
            },
          });

          if (existing) {
            this.logger.warn(
              `Duplicate Stripe session detected: ${stripeSessionId}. Skipping.`,
            );
            // Retourner la transaction existante
            const currentUser = await tx.user.findUnique({
              where: { id: userId },
              select: { aiCredits: true },
            });
            return {
              newBalance: currentUser?.aiCredits || 0,
              transaction: existing,
            };
          }
        }

        // Ajouter crédits atomiquement
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { increment: amount },
            aiCreditsPurchased: { increment: amount },
            lastCreditPurchase: new Date(),
          },
          select: { aiCredits: true },
        });

        // Enregistrer transaction (expiresAt set for add-on purchases, null for other credits)
        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            packId,
            amount,
            balanceBefore: user.aiCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'purchase',
            source: 'stripe',
            stripeSessionId,
            stripePaymentId,
            expiresAt: expiresAt ?? undefined,
            metadata: {
              timestamp: new Date().toISOString(),
              userEmail: user.email,
            },
          },
        });

        return { newBalance: updatedUser.aiCredits, transaction };
      }, {
        timeout: 10000,
        isolationLevel: 'ReadCommitted',
      });

      // Invalider cache
      const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${userId}`;
      try {
        await this.cache.delSimple(cacheKey);
        await this.cache.invalidateTags([`user:${userId}`]);
      } catch (cacheError) {
        this.logger.warn('Failed to invalidate cache', { error: cacheError });
      }

      this.logger.log(
        `Credits added: ${amount} for ${userId}. New balance: ${result.newBalance}`,
      );

      return {
        success: true,
        newBalance: result.newBalance,
        transaction: result.transaction,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to add credits for ${userId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Récupérer le solde actuel (avec cache)
   */
  async getBalance(userId: string): Promise<{
    balance: number;
    purchased: number;
    used: number;
  }> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${userId}`;
    
    const data = await this.cache.get<{
      aiCredits: number;
      aiCreditsPurchased: number;
      aiCreditsUsed: number;
    }>(
      cacheKey,
      'user',
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            aiCredits: true,
            aiCreditsPurchased: true,
            aiCreditsUsed: true,
          },
        });
        return user || { aiCredits: 0, aiCreditsPurchased: 0, aiCreditsUsed: 0 };
      },
      { ttl: this.CACHE_TTL }
    ) || { aiCredits: 0, aiCreditsPurchased: 0, aiCreditsUsed: 0 };
    
    return {
      balance: data.aiCredits,
      purchased: data.aiCreditsPurchased,
      used: data.aiCreditsUsed,
    };
  }

  /**
   * Récupérer l'historique des transactions
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    transactions: (CreditTransaction & { pack: { name: string; credits: number } | null })[];
    total: number;
  }> {
    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          pack: {
            select: { name: true, credits: true },
          },
        },
      }),
      this.prisma.creditTransaction.count({
        where: { userId },
      }),
    ]);

    return { transactions, total };
  }

  /**
   * Récupérer tous les packs disponibles
   */
  async getAvailablePacks(): Promise<CreditPack[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}packs:active`;
    
    return (await this.cache.get<CreditPack[]>(
      cacheKey,
      'api',
      async () => {
        return this.prisma.creditPack.findMany({
          where: { isActive: true },
          orderBy: [
            { isFeatured: 'desc' },
            { credits: 'asc' },
          ],
        });
      },
      { ttl: 3600 } // 1 heure (packs changent rarement)
    )) ?? [];
  }

  /**
   * Rembourser des crédits (refund)
   */
  async refundCredits(
    userId: string,
    amount: number,
    reason: string,
    originalTransactionId?: string,
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: CreditTransaction;
  }> {
    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { increment: amount },
          },
          select: { aiCredits: true },
        });

        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount,
            balanceBefore: user.aiCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'refund',
            source: 'admin',
            metadata: {
              reason,
              originalTransactionId,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return { newBalance: updatedUser.aiCredits, transaction };
      });

      const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${userId}`;
      try {
        await this.cache.delSimple(cacheKey);
        await this.cache.invalidateTags([`user:${userId}`]);
      } catch (cacheError) {
        this.logger.warn('Failed to invalidate cache', { error: cacheError });
      }

      this.logger.log(
        `Credits refunded: ${amount} for ${userId}. Reason: ${reason}`,
      );

      return {
        success: true,
        newBalance: result.newBalance,
        transaction: result.transaction,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to refund credits for ${userId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Expire add-on credits that have passed their expiresAt date.
   * Finds transactions with expiresAt < now and expiredAt null, marks them expired and adjusts user balance.
   * Plan-included credits (monthly_refill) have no expiresAt and are not affected.
   */
  async expireCredits(): Promise<{ expiredCount: number; usersAffected: number }> {
    const now = new Date();
    const expiredTxns = await this.prisma.creditTransaction.findMany({
      where: {
        expiresAt: { not: null, lt: now },
        expiredAt: null,
        amount: { gt: 0 },
      },
      select: { id: true, userId: true, amount: true },
    });

    if (expiredTxns.length === 0) {
      return { expiredCount: 0, usersAffected: 0 };
    }

    const byUser = new Map<string, { ids: string[]; totalAmount: number }>();
    for (const t of expiredTxns) {
      const cur = byUser.get(t.userId) ?? { ids: [], totalAmount: 0 };
      cur.ids.push(t.id);
      cur.totalAmount += t.amount;
      byUser.set(t.userId, cur);
    }

    let expiredCount = 0;
    for (const [userId, { ids, totalAmount }] of byUser.entries()) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const locked = await tx.$queryRaw<Array<{ ai_credits: number }>>`
            SELECT ai_credits FROM "User" WHERE id = ${userId} FOR UPDATE
          `;
          const currentBalance = locked[0]?.ai_credits ?? 0;
          const toDeduct = Math.min(totalAmount, currentBalance);

          if (toDeduct <= 0) {
            await tx.creditTransaction.updateMany({
              where: { id: { in: ids } },
              data: { expiredAt: now },
            });
            expiredCount += ids.length;
            return;
          }

          await tx.user.update({
            where: { id: userId },
            data: { aiCredits: { decrement: toDeduct } },
          });
          await tx.creditTransaction.updateMany({
            where: { id: { in: ids } },
            data: { expiredAt: now },
          });
          expiredCount += ids.length;
        }, { timeout: 10000, isolationLevel: 'RepeatableRead' });

        const cacheKey = `${this.CACHE_KEY_PREFIX}balance:${userId}`;
        try {
          await this.cache.delSimple(cacheKey);
          await this.cache.invalidateTags([`user:${userId}`]);
        } catch {
          // ignore
        }
      } catch (err) {
        this.logger.warn(
          `Failed to expire credits for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} credit transaction(s) across ${byUser.size} user(s)`);
    }
    return { expiredCount, usersAffected: byUser.size };
  }
}













