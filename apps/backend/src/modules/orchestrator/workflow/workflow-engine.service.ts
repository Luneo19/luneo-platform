import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { ActionRegistryService } from '../actions/action-registry.service';

// ─── Types ───────────────────────────────────────────────────────

export interface WorkflowNode {
  id: string;
  type:
    | 'start'
    | 'message'
    | 'condition'
    | 'action'
    | 'branch'
    | 'loop'
    | 'variable'
    | 'end';
  data: Record<string, unknown>;
  next?: string | string[];
}

export interface WorkflowCondition {
  field: string;
  operator:
    | 'equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'matches'
    | 'exists';
  value: unknown;
}

export interface WorkflowVariable {
  name: string;
  value: unknown;
  source: 'user_input' | 'api_response' | 'static' | 'extracted';
}

export interface WorkflowContext {
  variables: Map<string, unknown>;
  conversationId: string;
  agentId: string;
  currentNodeId: string;
  history: string[];
  loopCounters: Map<string, number>;
}

export interface WorkflowResult {
  response: string;
  variables: Record<string, unknown>;
  actionsExecuted: string[];
  nextNodeId?: string;
}

const MAX_LOOP_ITERATIONS = 5;
const MAX_NODE_VISITS = 100;

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  async executeWorkflow(
    agentId: string,
    conversationId: string,
    userMessage: string,
    flowDataOverride?: Record<string, unknown> | null,
  ): Promise<WorkflowResult> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, organizationId: true, flowData: true },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} introuvable`);
    }

    const flowData = (flowDataOverride ?? agent.flowData) as Record<string, unknown> | null;
    if (!flowData || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
      return {
        response: '',
        variables: {},
        actionsExecuted: [],
      };
    }

    const nodes = new Map<string, WorkflowNode>();
    for (const raw of flowData.nodes as WorkflowNode[]) {
      nodes.set(raw.id, raw);
    }

    const startNode = (flowData.nodes as WorkflowNode[]).find(
      (n) => n.type === 'start',
    );
    if (!startNode) {
      this.logger.warn(`Aucun nœud 'start' trouvé pour l'agent ${agentId}`);
      return { response: '', variables: {}, actionsExecuted: [] };
    }

    const context: WorkflowContext = {
      variables: new Map<string, unknown>([['user_message', userMessage]]),
      conversationId,
      agentId,
      currentNodeId: startNode.id,
      history: [],
      loopCounters: new Map<string, number>(),
    };

    const responseParts: string[] = [];
    const actionsExecuted: string[] = [];
    let visits = 0;

    let currentId: string | undefined = this.resolveNextId(startNode.next);

    while (currentId && visits < MAX_NODE_VISITS) {
      visits++;
      const node = nodes.get(currentId);
      if (!node) {
        this.logger.warn(`Nœud ${currentId} introuvable dans le workflow`);
        break;
      }

      context.currentNodeId = currentId;
      context.history.push(currentId);

      switch (node.type) {
        case 'message': {
          const text = this.interpolate(String(node.data.text ?? ''), context);
          responseParts.push(text);
          currentId = this.resolveNextId(node.next);
          break;
        }

        case 'condition': {
          const condition = node.data.condition as WorkflowCondition | undefined;
          const branches = Array.isArray(node.next) ? node.next : [];
          if (condition && branches.length >= 2) {
            const result = this.evaluateCondition(condition, context);
            currentId = result ? branches[0] : branches[1];
          } else {
            currentId = this.resolveNextId(node.next);
          }
          break;
        }

        case 'branch': {
          const conditions = node.data.conditions as WorkflowCondition[] | undefined;
          const branches = Array.isArray(node.next) ? node.next : [];
          let matched = false;
          if (conditions && branches.length > 0) {
            for (let i = 0; i < conditions.length; i++) {
              if (this.evaluateCondition(conditions[i], context)) {
                currentId = branches[i];
                matched = true;
                break;
              }
            }
          }
          if (!matched) {
            currentId = branches[branches.length - 1] ?? this.resolveNextId(node.next);
          }
          break;
        }

        case 'action': {
          const actionId = String(node.data.actionId ?? '');
          const params = (node.data.params as Record<string, unknown>) ?? {};

          const interpolatedParams: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(params)) {
            interpolatedParams[key] =
              typeof val === 'string' ? this.interpolate(val, context) : val;
          }

          const actionResult = await this.actionRegistry.executeAction(
            actionId,
            interpolatedParams,
            {
              organizationId: agent.organizationId,
              agentId,
              conversationId,
            },
          );

          actionsExecuted.push(actionId);
          context.variables.set(`action_${actionId}_result`, actionResult.data ?? {});
          context.variables.set(`action_${actionId}_success`, actionResult.success);

          if (actionResult.message) {
            responseParts.push(actionResult.message);
          }

          currentId = this.resolveNextId(node.next);
          break;
        }

        case 'variable': {
          const varName = String(node.data.name ?? '');
          const source = node.data.source as WorkflowVariable['source'] | undefined;

          if (varName) {
            switch (source) {
              case 'extracted': {
                const pattern = String(node.data.pattern ?? '');
                const extracted = this.extractVariable(pattern, userMessage);
                context.variables.set(varName, extracted);
                break;
              }
              case 'static':
                context.variables.set(varName, node.data.value);
                break;
              case 'user_input':
                context.variables.set(varName, userMessage);
                break;
              case 'api_response': {
                const refAction = String(node.data.actionRef ?? '');
                context.variables.set(
                  varName,
                  context.variables.get(`action_${refAction}_result`) ?? null,
                );
                break;
              }
              default:
                context.variables.set(varName, node.data.value ?? null);
            }
          }

          currentId = this.resolveNextId(node.next);
          break;
        }

        case 'loop': {
          const counter = context.loopCounters.get(currentId) ?? 0;
          if (counter >= MAX_LOOP_ITERATIONS) {
            this.logger.warn(
              `Boucle ${currentId} a atteint la limite de ${MAX_LOOP_ITERATIONS} itérations`,
            );
            const branches = Array.isArray(node.next) ? node.next : [];
            currentId = branches[1] ?? undefined;
          } else {
            context.loopCounters.set(currentId, counter + 1);
            const branches = Array.isArray(node.next) ? node.next : [];
            currentId = branches[0] ?? undefined;
          }
          break;
        }

        case 'end':
          currentId = undefined;
          break;

        case 'start':
          currentId = this.resolveNextId(node.next);
          break;

        default:
          this.logger.warn(`Type de nœud inconnu: ${node.type}`);
          currentId = this.resolveNextId(node.next);
      }
    }

    if (visits >= MAX_NODE_VISITS) {
      this.logger.warn(
        `Workflow pour agent ${agentId} a atteint la limite de ${MAX_NODE_VISITS} nœuds visités`,
      );
    }

    const exportedVars: Record<string, unknown> = {};
    for (const [key, val] of context.variables.entries()) {
      exportedVars[key] = val;
    }

    return {
      response: responseParts.join('\n'),
      variables: exportedVars,
      actionsExecuted,
      nextNodeId: context.history[context.history.length - 1],
    };
  }

  evaluateCondition(condition: WorkflowCondition, context: WorkflowContext): boolean {
    const fieldValue = this.resolveFieldValue(condition.field, context);

    switch (condition.operator) {
      case 'equals':
        return String(fieldValue) === String(condition.value);

      case 'contains':
        return String(fieldValue ?? '')
          .toLowerCase()
          .includes(String(condition.value ?? '').toLowerCase());

      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);

      case 'less_than':
        return Number(fieldValue) < Number(condition.value);

      case 'matches': {
        try {
          const regex = new RegExp(String(condition.value ?? ''), 'i');
          return regex.test(String(fieldValue ?? ''));
        } catch {
          this.logger.warn(`Regex invalide dans la condition: ${condition.value}`);
          return false;
        }
      }

      case 'exists':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';

      default:
        return false;
    }
  }

  extractVariable(pattern: string, text: string): string | null {
    if (!pattern || !text) return null;

    try {
      const regex = new RegExp(pattern, 'i');
      const match = regex.exec(text);
      return match ? (match[1] ?? match[0]) : null;
    } catch {
      this.logger.warn(`Regex d'extraction invalide: ${pattern}`);
      return null;
    }
  }

  // ─── Private helpers ───────────────────────────────────────────

  private resolveFieldValue(field: string, context: WorkflowContext): unknown {
    if (context.variables.has(field)) {
      return context.variables.get(field);
    }

    switch (field) {
      case 'user_message':
        return context.variables.get('user_message') ?? '';
      case 'sentiment':
        return context.variables.get('sentiment') ?? 'neutral';
      case 'channel':
        return context.variables.get('channel') ?? 'web';
      case 'time':
        return new Date().getHours();
      default:
        return context.variables.get(field) ?? null;
    }
  }

  private interpolate(template: string, context: WorkflowContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
      const val = context.variables.get(varName);
      return val !== undefined && val !== null ? String(val) : '';
    });
  }

  private resolveNextId(next: string | string[] | undefined): string | undefined {
    if (!next) return undefined;
    return Array.isArray(next) ? next[0] : next;
  }
}
