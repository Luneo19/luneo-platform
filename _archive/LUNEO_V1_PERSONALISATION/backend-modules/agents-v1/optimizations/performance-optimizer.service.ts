/**
 * @fileoverview Service d'optimisation performance pour Agents IA
 * @module PerformanceOptimizerService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

@Injectable()
export class PerformanceOptimizerService {
  private readonly logger = new Logger(PerformanceOptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Optimise les requêtes Prisma pour les agents
   */
  async optimizePrismaQueries(): Promise<void> {
    this.logger.log('Optimisation des requêtes Prisma...');

    // Vérifier indexes existants
    const indexes = await this.prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('AgentConversation', 'AgentMessage', 'KnowledgeBaseArticle')
    `;

    this.logger.log(`Indexes existants: ${indexes.length}`);

    // Créer indexes manquants si nécessaire
    // Note: À faire via migration Prisma
  }

  /**
   * Optimise le cache Redis
   */
  async optimizeCache(): Promise<void> {
    this.logger.log('Optimisation du cache...');

    // Pré-chargement: charger les données fréquemment accédées en cache
    try {
      const [conversations, articles] = await Promise.all([
        this.prisma.agentConversation.findMany({
          take: 100,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, brandId: true, agentType: true, updatedAt: true },
        }),
        this.prisma.knowledgeBaseArticle.findMany({
          where: { isPublished: true },
          take: 50,
          select: { id: true, title: true, slug: true },
        }),
      ]);
      await this.cache.set('perf:preload:conversations', 'data', conversations, { ttl: 300 });
      await this.cache.set('perf:preload:articles', 'data', articles, { ttl: 300 });
      this.logger.log(`Preloaded ${conversations.length} conversations, ${articles.length} articles`);
    } catch (err) {
      this.logger.warn(`Cache prefetch failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  /**
   * Analyse les performances
   */
  async analyzePerformance(): Promise<{
    slowQueries: number;
    cacheHitRate: number;
    averageLatency: number;
  }> {
    let averageLatency = 0;
    let slowQueries = 0;

    try {
      const recent = await this.prisma.aIUsageLog.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
        select: { latencyMs: true },
      });
      const latencies = recent.map((l) => l.latencyMs).filter((n): n is number => typeof n === 'number' && n > 0);
      averageLatency = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;
      const threshold = averageLatency * 2;
      slowQueries = latencies.filter((l) => l > threshold).length;
    } catch (err) {
      this.logger.warn(`Performance analysis failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    return {
      slowQueries,
      cacheHitRate: 0,
      averageLatency,
    };
  }
}
