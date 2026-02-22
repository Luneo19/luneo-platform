// @ts-nocheck
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma, AutomationStatus, AutomationRunStatus, PaymentStatus } from '@prisma/client';

export type CreateAutomationStepDto = {
  order: number;
  type: string;
  templateId?: string;
  subject?: string;
  waitDuration?: number;
  condition?: Prisma.JsonValue;
};

export type CreateAutomationDto = {
  name: string;
  description?: string;
  trigger: string;
  triggerConfig?: Prisma.JsonValue;
  status?: string;
  steps?: CreateAutomationStepDto[];
};

export type UpdateAutomationDto = {
  name?: string;
  description?: string;
  trigger?: string;
  triggerConfig?: Prisma.JsonValue;
  status?: string;
  steps?: CreateAutomationStepDto[];
};

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const automations = await this.prisma.emailAutomation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { runs: true } },
      },
    });

    const runsAggregates = await Promise.all(
      automations.map((a) =>
        this.prisma.automationRun.groupBy({
          by: ['status'],
          where: { automationId: a.id },
          _count: true,
        }),
      ),
    );

    return automations.map((a, i) => {
      const byStatus = runsAggregates[i] ?? [];
      const totalRuns = byStatus.reduce((s, x) => s + x._count, 0);
      const completedRuns =
        byStatus.find((x) => x.status === AutomationRunStatus.completed)?._count ?? 0;
      return {
        ...a,
        runsCount: totalRuns,
        completedRunsCount: completedRuns,
        completionRate:
          totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0,
      };
    });
  }

  async findById(id: string) {
    const automation = await this.prisma.emailAutomation.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: 'asc' }, include: { template: true } },
        runs: {
          take: 50,
          orderBy: { startedAt: 'desc' },
          include: { customer: { select: { id: true, user: { select: { email: true } } } } },
        },
      },
    });
    if (!automation) {
      throw new NotFoundException('Automation not found');
    }
    return automation;
  }

  async create(data: CreateAutomationDto) {
    const { steps, ...rest } = data;
    const payload: Prisma.EmailAutomationCreateInput = {
      ...rest,
      status: (rest.status as AutomationStatus) ?? AutomationStatus.draft,
      triggerConfig: rest.triggerConfig != null ? (rest.triggerConfig as Prisma.InputJsonValue) : undefined,
    };
    if (steps?.length) {
      payload.steps = {
        create: steps.map((s) => ({
          order: s.order,
          type: s.type,
          templateId: s.templateId,
          subject: s.subject,
          waitDuration: s.waitDuration,
          condition: s.condition != null ? (s.condition as Prisma.InputJsonValue) : undefined,
        })),
      };
    }
    return this.prisma.emailAutomation.create({
      data: payload,
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, data: UpdateAutomationDto) {
    const existing = await this.prisma.emailAutomation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Automation not found');
    }

    const { steps, status, ...rest } = data;
    const payload: Prisma.EmailAutomationUpdateInput = {
      ...rest,
      ...(status ? { status: status as AutomationStatus } : {}),
      triggerConfig: rest.triggerConfig != null ? (rest.triggerConfig as Prisma.InputJsonValue) : undefined,
    };

    if (steps !== undefined) {
      await this.prisma.automationStep.deleteMany({ where: { automationId: id } });
      if (steps.length > 0) {
        payload.steps = {
          create: steps.map((s) => ({
            order: s.order,
            type: s.type,
            templateId: s.templateId,
            subject: s.subject,
            waitDuration: s.waitDuration,
            condition: s.condition != null ? (s.condition as Prisma.InputJsonValue) : undefined,
          })),
        };
      }
    }

    return this.prisma.emailAutomation.update({
      where: { id },
      data: payload,
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.emailAutomation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Automation not found');
    }
    await this.prisma.emailAutomation.delete({ where: { id } });
    return { deleted: true, id };
  }

  async getStats(id: string) {
    const automation = await this.prisma.emailAutomation.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    const [byStatus, total, completedRuns] = await Promise.all([
      this.prisma.automationRun.groupBy({
        by: ['status'],
        where: { automationId: id },
        _count: true,
      }),
      this.prisma.automationRun.count({ where: { automationId: id } }),
      this.prisma.automationRun.findMany({
        where: { automationId: id, status: AutomationRunStatus.completed },
        select: { customerId: true },
      }),
    ]);

    const completed =
      byStatus.find((x) => x.status === AutomationRunStatus.completed)?._count ?? 0;
    const active = byStatus.find((x) => x.status === AutomationRunStatus.active)?._count ?? 0;
    const cancelled =
      byStatus.find((x) => x.status === AutomationRunStatus.cancelled)?._count ?? 0;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const customerIds = [...new Set(completedRuns.map((r) => r.customerId))];
    let conversionCount = 0;
    if (customerIds.length > 0) {
      const customers = await this.prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { userId: true },
      });
      const userIds = customers.map((c) => c.userId);
      const ordersFromConverted = await this.prisma.order.findMany({
        where: {
          userId: { in: userIds },
          paymentStatus: PaymentStatus.SUCCEEDED,
          deletedAt: null,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { userId: true },
      });
      conversionCount = new Set(
        ordersFromConverted
          .map((o) => o.userId)
          .filter((id): id is string => id != null),
      ).size;
    }
    const conversionRate =
      total > 0 ? Math.round((conversionCount / total) * 1000) / 1000 : 0;

    return {
      automationId: id,
      automationName: automation.name,
      triggeredCount: total,
      completedRuns: completed,
      activeRuns: active,
      cancelledRuns: cancelled,
      completionRate: Math.round(completionRate * 100) / 100,
      conversionRate,
    };
  }
}
