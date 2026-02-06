import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Options pour la pagination cursor-based
 */
export interface CursorPaginationOptions<T> {
  take: number;
  cursor?: T;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Résultat de la pagination cursor-based
 */
export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Options pour la pagination offset-based
 */
export interface OffsetPaginationOptions {
  page: number;
  limit: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Résultat de la pagination offset-based
 */
export interface OffsetPaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Service d'optimisation des requêtes Prisma
 * PHASE 4: Optimisation Base de Données
 */
@Injectable()
export class PrismaQueryHelper {
  private readonly logger = new Logger(PrismaQueryHelper.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Pagination cursor-based pour de meilleures performances sur grandes tables
   * Recommandé pour les flux infinis et les grandes listes
   * 
   * @example
   * const result = await this.queryHelper.cursorPaginate(
   *   this.prisma.design,
   *   { where: { brandId }, orderBy: { createdAt: 'desc' } },
   *   { take: 20, cursor: lastCursor }
   * );
   */
  async cursorPaginate<T extends Record<string, any>>(
    model: {
      findMany: (args: any) => Promise<T[]>;
    },
    queryArgs: any,
    options: CursorPaginationOptions<string>,
  ): Promise<CursorPaginatedResult<T>> {
    const { take, cursor, orderBy } = options;

    // Prendre un élément de plus pour déterminer hasMore
    const actualTake = take + 1;

    const findManyArgs = {
      ...queryArgs,
      take: actualTake,
      orderBy: orderBy || queryArgs.orderBy,
    };

    // Ajouter le cursor si fourni
    if (cursor) {
      findManyArgs.cursor = { id: cursor };
      findManyArgs.skip = 1; // Skip le cursor lui-même
    }

    const items = await model.findMany(findManyArgs);

    // Vérifier s'il y a plus d'éléments
    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, -1) : items;

    // Calculer le prochain cursor
    const nextCursor = hasMore && data.length > 0 
      ? data[data.length - 1].id 
      : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Pagination offset-based avec optimisation
   * Utilise count séparé pour éviter les scans complets
   */
  async offsetPaginate<T>(
    model: {
      findMany: (args: any) => Promise<T[]>;
      count: (args: any) => Promise<number>;
    },
    queryArgs: any,
    options: OffsetPaginationOptions,
  ): Promise<OffsetPaginatedResult<T>> {
    const { page, limit, orderBy } = options;
    const skip = (page - 1) * limit;

    // Exécuter les deux requêtes en parallèle
    const [data, total] = await Promise.all([
      model.findMany({
        ...queryArgs,
        skip,
        take: limit,
        orderBy: orderBy || queryArgs.orderBy,
      }),
      model.count({
        where: queryArgs.where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Batch processing pour les opérations sur grandes quantités de données
   * Évite les timeouts et les problèmes de mémoire
   * 
   * @example
   * await this.queryHelper.batchProcess(
   *   this.prisma.order,
   *   { where: { status: 'PROCESSING' } },
   *   async (orders) => {
   *     for (const order of orders) {
   *       await this.processOrder(order);
   *     }
   *   },
   *   { batchSize: 100 }
   * );
   */
  async batchProcess<T extends { id: string }>(
    model: {
      findMany: (args: any) => Promise<T[]>;
    },
    queryArgs: any,
    processFn: (items: T[]) => Promise<void>,
    options: { batchSize?: number; onProgress?: (processed: number) => void } = {},
  ): Promise<{ processed: number; batches: number }> {
    const { batchSize = 100, onProgress } = options;
    let cursor: string | undefined;
    let processed = 0;
    let batches = 0;

    while (true) {
      const findManyArgs = {
        ...queryArgs,
        take: batchSize,
        orderBy: queryArgs.orderBy || { id: 'asc' },
      };

      if (cursor) {
        findManyArgs.cursor = { id: cursor };
        findManyArgs.skip = 1;
      }

      const items = await model.findMany(findManyArgs);

      if (items.length === 0) break;

      await processFn(items);

      processed += items.length;
      batches++;
      cursor = items[items.length - 1].id;

      onProgress?.(processed);

      // Si moins d'éléments que la taille du batch, on a fini
      if (items.length < batchSize) break;
    }

    this.logger.log(`Batch processing complete: ${processed} items in ${batches} batches`);

    return { processed, batches };
  }

  /**
   * Upsert en batch avec gestion des conflits
   */
  async batchUpsert<T, CreateInput, UpdateInput>(
    model: {
      upsert: (args: { where: any; create: CreateInput; update: UpdateInput }) => Promise<T>;
    },
    items: Array<{
      where: Record<string, any>;
      create: CreateInput;
      update: UpdateInput;
    }>,
    options: { concurrency?: number } = {},
  ): Promise<T[]> {
    const { concurrency = 10 } = options;
    const results: T[] = [];

    // Process en chunks pour éviter de surcharger la connexion
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map((item) => model.upsert(item)),
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Transaction avec retry automatique sur deadlock
   */
  async transactionWithRetry<T>(
    operation: (tx: Parameters<typeof this.prisma.$transaction>[0] extends (fn: infer U) => any ? U : never) => Promise<T>,
    options: { maxRetries?: number; retryDelay?: number } = {},
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 100 } = options;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(operation as any) as T;
      } catch (error: any) {
        lastError = error;
        
        // Retry uniquement sur les deadlocks ou timeouts
        const isRetryable = 
          error.code === 'P2034' || // Deadlock
          error.code === 'P1017' || // Server closed connection
          error.message?.includes('deadlock') ||
          error.message?.includes('timeout');

        if (!isRetryable || attempt === maxRetries - 1) {
          throw error;
        }

        this.logger.warn(`Transaction failed (attempt ${attempt + 1}/${maxRetries}), retrying...`, {
          error: error.message,
          code: error.code,
        });

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  /**
   * Soft delete avec cascade manuelle
   */
  async softDelete(
    model: {
      update: (args: any) => Promise<any>;
    },
    where: Record<string, any>,
    options: { deletedByField?: string; deletedBy?: string } = {},
  ): Promise<void> {
    const { deletedByField = 'deletedBy', deletedBy } = options;

    const updateData: Record<string, any> = {
      deletedAt: new Date(),
    };

    if (deletedBy && deletedByField) {
      updateData[deletedByField] = deletedBy;
    }

    await model.update({
      where,
      data: updateData,
    });
  }

  /**
   * Optimise les requêtes avec select partiel
   * Réduit la taille des données transférées
   */
  buildSelectFields<T extends string>(fields: T[]): Record<T, true> {
    return fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<T, true>);
  }

  /**
   * Log des requêtes lentes pour debugging
   */
  async measureQuery<T>(
    name: string,
    queryFn: () => Promise<T>,
    threshold: number = 100,
  ): Promise<T> {
    const start = Date.now();
    try {
      return await queryFn();
    } finally {
      const duration = Date.now() - start;
      if (duration > threshold) {
        this.logger.warn(`Slow query detected: ${name} took ${duration}ms`);
      }
    }
  }
}
