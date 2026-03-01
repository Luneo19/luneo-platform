import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WorkflowTriggerType } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { VerticalsService } from '@/modules/verticals/verticals.service';

@Injectable()
export class VerticalSetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verticalsService: VerticalsService,
  ) {}

  async apply(userId: string, verticalSlug: string, answers: Record<string, unknown>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const orgId = user.memberships?.[0]?.organizationId;
    if (!orgId) throw new BadRequestException('No organization found');

    const selected = await this.verticalsService.selectVerticalByOrganizationId(orgId, verticalSlug, {
      verticalAnswers: answers,
    });

    const template = await this.verticalsService.getTemplate(verticalSlug);
    const workflows = this.extractTemplateWorkflows(template);

    if (workflows.length > 0) {
      await this.prisma.workflow.createMany({
        data: workflows.map((workflow) => ({
          organizationId: orgId,
          name: workflow.name,
          description: `Workflow par defaut: ${verticalSlug}`,
          triggerType: this.toWorkflowTriggerType(workflow.triggerType),
          triggerConfig: { source: 'vertical-template', verticalSlug },
          steps: workflow.steps as Prisma.InputJsonValue,
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    return {
      organization: selected.organization,
      template: selected.template,
      createdWorkflows: workflows.length,
    };
  }

  private extractTemplateWorkflows(template: unknown): Array<{ name: string; triggerType: string; steps: unknown[] }> {
    if (!template || typeof template !== 'object') return [];
    const raw = (template as Record<string, unknown>).defaultWorkflows;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const asRecord = item as Record<string, unknown>;
        return {
          name: String(asRecord.name ?? 'Workflow'),
          triggerType: String(asRecord.triggerType ?? 'MANUAL'),
          steps: Array.isArray(asRecord.steps) ? asRecord.steps : [],
        };
      });
  }

  private toWorkflowTriggerType(value: string): WorkflowTriggerType {
    const normalized = value.trim().toUpperCase();
    const allowed = Object.values(WorkflowTriggerType);
    if (allowed.includes(normalized as WorkflowTriggerType)) {
      return normalized as WorkflowTriggerType;
    }
    return WorkflowTriggerType.MANUAL;
  }
}
