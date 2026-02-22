import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

export interface Insight {
  emoji: string;
  title: string;
  description: string;
  action?: { label: string; url: string };
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly redis: RedisOptimizedService,
  ) {}

  async getWeeklyInsights(organizationId: string): Promise<Insight[]> {
    const cacheKey = `insights:${organizationId}:weekly`;
    const cached = await this.redis.get<Insight[]>(cacheKey, 'analytics');
    if (cached) return cached;

    try {
      const insights = await this.generateInsights(organizationId);

      await this.redis.set(cacheKey, insights, 'analytics', { ttl: 86400 });

      return insights;
    } catch (error: unknown) {
      this.logger.error('Failed to generate insights', error instanceof Error ? error.message : String(error));
      return this.getFallbackInsights();
    }
  }

  private async generateInsights(organizationId: string): Promise<Insight[]> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      conversationCount,
      messageCount,
      agentCount,
      avgSatisfaction,
    ] = await Promise.all([
      this.prisma.conversation.count({
        where: { agent: { organizationId }, createdAt: { gte: weekAgo } },
      }),
      this.prisma.message.count({
        where: { conversation: { agent: { organizationId } }, createdAt: { gte: weekAgo } },
      }),
      this.prisma.agent.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.conversation.aggregate({
        where: { agent: { organizationId }, createdAt: { gte: weekAgo }, satisfactionRating: { not: null } },
        _avg: { satisfactionRating: true },
      }),
    ]);

    const insights: Insight[] = [];

    if (conversationCount > 0) {
      const avgMsgsPerConv = Math.round(messageCount / conversationCount);
      insights.push({
        emoji: '💬',
        title: `${conversationCount} conversations cette semaine`,
        description: `Avec une moyenne de ${avgMsgsPerConv} messages par conversation. ${
          conversationCount > 50
            ? 'Volume élevé — pensez à optimiser vos réponses automatiques.'
            : 'Volume normal pour votre activité.'
        }`,
        action: { label: 'Voir les conversations', url: '/dashboard/conversations' },
      });
    }

    const satisfaction = avgSatisfaction._avg?.satisfactionRating;
    if (satisfaction) {
      insights.push({
        emoji: satisfaction >= 4 ? '🌟' : satisfaction >= 3 ? '👍' : '⚠️',
        title: `Satisfaction client : ${satisfaction.toFixed(1)}/5`,
        description: satisfaction >= 4
          ? 'Excellent ! Vos clients sont très satisfaits des réponses de vos agents.'
          : satisfaction >= 3
          ? 'Bonne satisfaction. Quelques améliorations dans la base de connaissances pourraient aider.'
          : 'Score en dessous de la moyenne. Vérifiez votre base de connaissances et les réponses fréquentes.',
        action: satisfaction < 4 ? { label: 'Optimiser la KB', url: '/dashboard/knowledge' } : undefined,
      });
    }

    if (agentCount === 0) {
      insights.push({
        emoji: '🚀',
        title: 'Créez votre premier agent',
        description: 'Commencez par créer un agent IA pour automatiser votre service client.',
        action: { label: 'Créer un agent', url: '/dashboard/agents/new' },
      });
    } else if (conversationCount === 0) {
      insights.push({
        emoji: '📡',
        title: 'Déployez votre agent',
        description: `Vous avez ${agentCount} agent(s) mais aucune conversation cette semaine. Installez le widget sur votre site.`,
        action: { label: 'Configurer le widget', url: '/dashboard/agents' },
      });
    }

    if (insights.length === 0) {
      return this.getFallbackInsights();
    }

    return insights.slice(0, 5);
  }

  private getFallbackInsights(): Insight[] {
    return [
      {
        emoji: '📊',
        title: 'Insights en cours de génération',
        description: 'Vos insights hebdomadaires seront disponibles prochainement.',
      },
    ];
  }
}
