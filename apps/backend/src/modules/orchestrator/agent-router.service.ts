import { Injectable } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

interface RouteInput {
  organizationId: string;
  currentAgentId: string;
  channelType: ChannelType;
  intent: string;
}

@Injectable()
export class AgentRouterService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async route(input: RouteInput): Promise<string> {
    const agents = await this.prisma.agent.findMany({
      where: {
        organizationId: input.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        scope: true,
      },
    });

    if (agents.length === 0) return input.currentAgentId;

    let best = { agentId: input.currentAgentId, score: 0 };
    for (const agent of agents) {
      let score = 0;
      const scope = (agent.scope as Record<string, unknown> | null) ?? {};
      const channels = Array.isArray(scope.channels) ? (scope.channels as string[]) : [];
      const intents = Array.isArray(scope.intents) ? (scope.intents as string[]) : [];

      if (agent.id === input.currentAgentId) score += 1;
      if (channels.map((v) => v.toUpperCase()).includes(input.channelType)) score += 3;
      if (intents.map((v) => v.toLowerCase()).includes(input.intent.toLowerCase())) score += 4;

      if (score > best.score) best = { agentId: agent.id, score };
    }

    return best.agentId;
  }
}
