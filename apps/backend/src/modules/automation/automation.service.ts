import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CurrentUser } from '@/common/types/user.types';
import { WorkflowEngineService } from '@/modules/orchestrator/workflow/workflow-engine.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';

@Injectable()
export class AutomationService {
  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  async list(user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    return this.prisma.workflow.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(user: CurrentUser, dto: CreateWorkflowDto) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    return this.prisma.workflow.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        triggerConfig: dto.triggerConfig as Prisma.InputJsonValue | undefined,
        steps: dto.steps as Prisma.InputJsonValue | undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(user: CurrentUser, id: string, dto: UpdateWorkflowDto) {
    const workflow = await this.getById(user, id);
    return this.prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        triggerConfig: dto.triggerConfig as Prisma.InputJsonValue | undefined,
        steps: dto.steps as Prisma.InputJsonValue | undefined,
        isActive: dto.isActive,
      },
    });
  }

  async toggle(user: CurrentUser, id: string) {
    const workflow = await this.getById(user, id);
    return this.prisma.workflow.update({
      where: { id: workflow.id },
      data: { isActive: !workflow.isActive },
    });
  }

  async execute(user: CurrentUser, dto: ExecuteWorkflowDto) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    const workflow = await this.getById(user, dto.workflowId);

    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        organizationId: user.organizationId,
        status: 'RUNNING',
      },
      select: { id: true },
    });

    try {
      const result = await this.workflowEngine.executeWorkflow(
        dto.agentId,
        dto.conversationId,
        dto.userMessage,
        (workflow.steps as Record<string, unknown> | null) ?? null,
      );

      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          currentStep: result.actionsExecuted.length,
        },
      });

      return result;
    } catch (error) {
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  private async getById(user: CurrentUser, id: string) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!workflow) throw new NotFoundException('Workflow introuvable');
    return workflow;
  }
}
