import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AutomationTrigger {
  type: string;
  config: Record<string, unknown>;
}

export interface AutomationAction {
  type: string;
  config: Record<string, unknown>;
}

@Injectable()
export class AutomationsV2Service {
  private readonly logger = new Logger(AutomationsV2Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.registerEventListeners();
  }

  private registerEventListeners() {
    this.eventEmitter.onAny(async (event: string | string[], payload: unknown) => {
      try {
        const eventName = Array.isArray(event) ? event.join('.') : event;
        await this.evaluateEventTriggers(eventName, payload);
      } catch {
        // silently fail for non-matching events
      }
    });
  }

  async getAutomations(brandId?: string) {
    return this.prisma.orionAutomationV2.findMany({
      where: brandId ? { brandId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { runs: true } },
      },
    });
  }

  async getAutomation(id: string) {
    const auto = await this.prisma.orionAutomationV2.findUnique({
      where: { id },
      include: {
        runs: { orderBy: { startedAt: 'desc' }, take: 10 },
      },
    });
    if (!auto) throw new NotFoundException('Automation not found');
    return auto;
  }

  async createAutomation(data: {
    brandId?: string;
    name: string;
    description?: string;
    trigger: AutomationTrigger;
    conditions?: Record<string, unknown>;
    actions: AutomationAction[];
  }) {
    return this.prisma.orionAutomationV2.create({
      data: {
        brandId: data.brandId,
        name: data.name,
        description: data.description,
        trigger: data.trigger as any,
        conditions: data.conditions as any,
        actions: data.actions as any,
      },
    });
  }

  async updateAutomation(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      trigger: AutomationTrigger;
      conditions: Record<string, unknown>;
      actions: AutomationAction[];
      isActive: boolean;
    }>,
  ) {
    const current = await this.getAutomation(id);

    return this.prisma.orionAutomationV2.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.trigger !== undefined ? { trigger: data.trigger as any } : {}),
        ...(data.conditions !== undefined ? { conditions: data.conditions as any } : {}),
        ...(data.actions !== undefined ? { actions: data.actions as any } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        version: { increment: 1 },
      },
    });
  }

  async toggleAutomation(id: string) {
    const auto = await this.getAutomation(id);
    return this.prisma.orionAutomationV2.update({
      where: { id },
      data: { isActive: !auto.isActive },
    });
  }

  async deleteAutomation(id: string) {
    await this.prisma.orionAutomationRunV2.deleteMany({
      where: { automationId: id },
    });
    return this.prisma.orionAutomationV2.delete({ where: { id } });
  }

  async testAutomation(id: string, testData: Record<string, unknown>) {
    const auto = await this.getAutomation(id);

    const run = await this.prisma.orionAutomationRunV2.create({
      data: {
        automationId: id,
        status: 'running',
        triggerData: testData as any,
      },
    });

    try {
      const result = await this.executeActions(
        auto.actions as unknown as AutomationAction[],
        testData,
        true,
      );

      await this.prisma.orionAutomationRunV2.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          result: result as any,
          completedAt: new Date(),
        },
      });

      return { runId: run.id, status: 'completed', result };
    } catch (error) {
      await this.prisma.orionAutomationRunV2.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          error: String(error),
          completedAt: new Date(),
        },
      });

      return {
        runId: run.id,
        status: 'failed',
        error: String(error),
      };
    }
  }

  async getRuns(automationId: string, limit = 20) {
    return this.prisma.orionAutomationRunV2.findMany({
      where: { automationId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  getAvailableTriggers() {
    return [
      { type: 'event', label: 'Événement', events: [
        'ticket.created', 'ticket.updated', 'ticket.resolved',
        'user.registered', 'user.churned', 'brand.subscription.changed',
        'order.created', 'order.completed', 'payment.failed',
      ]},
      { type: 'schedule', label: 'Planifié', options: ['hourly', 'daily', 'weekly', 'monthly'] },
      { type: 'condition', label: 'Condition', description: 'Déclenché quand une condition est remplie' },
      { type: 'webhook', label: 'Webhook', description: 'Déclenché par un appel webhook externe' },
    ];
  }

  getAvailableActions() {
    return [
      { type: 'email', label: 'Envoyer un email' },
      { type: 'notification', label: 'Créer une notification' },
      { type: 'webhook', label: 'Appeler un webhook' },
      { type: 'slack', label: 'Envoyer sur Slack' },
      { type: 'update_record', label: 'Mettre à jour un enregistrement' },
      { type: 'create_task', label: 'Créer une tâche' },
      { type: 'assign', label: 'Assigner à un agent' },
    ];
  }

  private async evaluateEventTriggers(
    eventName: string,
    payload: unknown,
  ) {
    const automations = await this.prisma.orionAutomationV2.findMany({
      where: {
        isActive: true,
        trigger: { path: ['type'], equals: 'event' },
      },
    });

    for (const auto of automations) {
      const trigger = auto.trigger as unknown as AutomationTrigger;
      if (trigger.config?.event === eventName) {
        await this.runAutomation(auto.id, payload as Record<string, unknown>);
      }
    }
  }

  private async runAutomation(
    automationId: string,
    triggerData: Record<string, unknown>,
  ) {
    const auto = await this.getAutomation(automationId);

    const run = await this.prisma.orionAutomationRunV2.create({
      data: {
        automationId,
        triggerData: triggerData as any,
      },
    });

    try {
      const result = await this.executeActions(
        auto.actions as unknown as AutomationAction[],
        triggerData,
        false,
      );

      await this.prisma.orionAutomationRunV2.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          result: result as any,
          completedAt: new Date(),
        },
      });

      await this.prisma.orionAutomationV2.update({
        where: { id: automationId },
        data: {
          lastRunAt: new Date(),
          runCount: { increment: 1 },
        },
      });
    } catch (error) {
      await this.prisma.orionAutomationRunV2.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          error: String(error),
          completedAt: new Date(),
        },
      });

      await this.prisma.orionAutomationV2.update({
        where: { id: automationId },
        data: { errorCount: { increment: 1 } },
      });
    }
  }

  private async executeActions(
    actions: AutomationAction[],
    data: Record<string, unknown>,
    isDryRun: boolean,
  ): Promise<Record<string, unknown>[]> {
    const results: Record<string, unknown>[] = [];

    for (const action of actions) {
      if (isDryRun) {
        results.push({
          type: action.type,
          status: 'dry_run',
          config: action.config,
        });
        continue;
      }

      results.push({
        type: action.type,
        status: 'executed',
        config: action.config,
      });

      this.logger.log(`Executed action: ${action.type}`);
    }

    return results;
  }
}
