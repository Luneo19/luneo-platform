import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CurrentUser } from '@/common/types/user.types';
import { ActionRegistryService } from '@/modules/orchestrator/actions/action-registry.service';
import { ExecuteActionDto } from './dto/execute-action.dto';

@Injectable()
export class ActionsService {
  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  listCatalog() {
    return this.actionRegistry.getActions();
  }

  async execute(user: CurrentUser, dto: ExecuteActionDto) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const [agent, conversation] = await Promise.all([
      this.prisma.agent.findFirst({
        where: { id: dto.agentId, organizationId: user.organizationId },
        select: { id: true, organizationId: true },
      }),
      this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, organizationId: user.organizationId, deletedAt: null },
        select: { id: true, visitorEmail: true, visitorName: true },
      }),
    ]);

    if (!agent) throw new NotFoundException('Agent introuvable');
    if (!conversation) throw new NotFoundException('Conversation introuvable');

    return this.actionRegistry.executeAction(
      dto.actionId,
      dto.params ?? {},
      {
        organizationId: user.organizationId,
        agentId: dto.agentId,
        conversationId: dto.conversationId,
        visitorEmail: conversation.visitorEmail ?? undefined,
        visitorName: conversation.visitorName ?? undefined,
        idempotencyKey: `${dto.actionId}:${dto.conversationId}`,
      },
    );
  }
}
