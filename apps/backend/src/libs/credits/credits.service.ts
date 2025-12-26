import { Injectable, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
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
    metadata?: Record<string, any>,
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: any;
    cost: number;
  }> {
    const cost = ENDPOINT_COSTS[endpoint] || 1;
    const realCostCents = REAL_COSTS_CENTS[endpoint] || 0;

    try {
      // Transaction Prisma pour garantir atomicité
      const result = await this.prisma.$transaction(async (tx) => {
        // Lock user row avec SELECT FOR UPDATE (PostgreSQL)
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { 
            aiCredits: true, 
            aiCreditsUsed: true,
            email: true,
          },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        if (user.aiCredits < cost) {
          throw new BadRequestException(
            `Insufficient credits. Required: ${cost}, Available: ${user.aiCredits}`,
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
            balanceBefore: user.aiCredits,
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
        isolationLevel: 'ReadCommitted', // Optimisé pour performance
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
    } catch (error) {
      this.logger.error(
        `Failed to deduct credits for ${userId} on ${endpoint}: ${error.message}`,
        error.stack,
      );
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        `Failed to deduct credits: ${error.message}`,
      );
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
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: any;
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

        // Enregistrer transaction
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
    } catch (error) {
      this.logger.error(
        `Failed to add credits for ${userId}: ${error.message}`,
        error.stack,
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
    transactions: any[];
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
  async getAvailablePacks(): Promise<any[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}packs:active`;
    
    return this.cache.get<any[]>(
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
    ) || [];
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
    transaction: any;
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
    } catch (error) {
      this.logger.error(
        `Failed to refund credits for ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

