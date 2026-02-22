import { Injectable, Logger, Optional, Inject } from '@nestjs/common';

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    block: { id: string; name: string; category: string };
    config: Record<string, unknown>;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowContext {
  message: string;
  variables: Record<string, unknown>;
  conversationHistory: Array<{ role: string; content: string }>;
  sources: Array<{ title: string; content: string; score?: number }>;
  agentId?: string;
  conversationId?: string;
}

export interface ExecutionStep {
  nodeId: string;
  blockId: string;
  blockName: string;
  result: unknown;
  duration: number;
  output?: string;
}

export interface FlowExecutionResult {
  finalResponse: string;
  sources: Array<{ title: string; content: string; score?: number }>;
  trace: ExecutionStep[];
  variables: Record<string, unknown>;
}

export type BlockHandler = (
  context: FlowContext,
  config: Record<string, unknown>,
) => Promise<{
  data?: {
    message?: string;
    sources?: Array<{ title: string; content: string; score?: number }>;
    variables?: Record<string, unknown>;
    intent?: string;
    confidence?: number;
    extractedData?: Record<string, unknown>;
  };
  output?: string;
}>;

export const FLOW_ORCHESTRATOR = 'FLOW_ORCHESTRATOR';
export const FLOW_LLM = 'FLOW_LLM';
export const FLOW_KNOWLEDGE = 'FLOW_KNOWLEDGE';

@Injectable()
export class FlowExecutionEngine {
  private readonly logger = new Logger(FlowExecutionEngine.name);
  private readonly blockHandlers: Map<string, BlockHandler>;
  private executionTrace: ExecutionStep[];

  constructor(
    @Optional() @Inject(FLOW_ORCHESTRATOR)
    private readonly orchestratorService?: {
      executeAgent: (params: Record<string, unknown>) => Promise<{ response: string; sources?: Array<{ title: string; content: string }> }>;
    },
    @Optional() @Inject(FLOW_LLM)
    private readonly llmService?: {
      complete: (params: Record<string, unknown>) => Promise<{ content: string }>;
    },
    @Optional() @Inject(FLOW_KNOWLEDGE)
    private readonly knowledgeService?: {
      search: (params: Record<string, unknown>) => Promise<Array<{ title: string; content: string; score: number }>>;
    },
  ) {
    this.blockHandlers = new Map();
    this.executionTrace = [];
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    this.blockHandlers.set('trigger_message_received', async (ctx) => ({
      data: { variables: { userMessage: ctx.message } },
      output: 'message',
    }));

    this.blockHandlers.set('trigger_new_conversation', async (_ctx, config) => ({
      data: { message: (config.greetingMessage as string) || 'Bonjour !', variables: { isNewConversation: true } },
      output: 'conversation',
    }));

    this.blockHandlers.set('action_search_knowledge', async (ctx, config) => {
      if (this.knowledgeService) {
        try {
          const results = await this.knowledgeService.search({
            query: ctx.message,
            topK: config.topK ?? 5,
            scoreThreshold: config.scoreThreshold ?? 0.7,
          });
          return { data: { sources: results }, output: 'results' };
        } catch {
          return { data: { sources: [] }, output: 'results' };
        }
      }
      return { data: { sources: [] }, output: 'results' };
    });

    this.blockHandlers.set('ai_generate_response', async (ctx, config) => {
      if (this.orchestratorService) {
        try {
          const result = await this.orchestratorService.executeAgent({
            agentId: ctx.agentId,
            message: ctx.message,
            conversationId: ctx.conversationId,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          });
          return {
            data: {
              message: result.response,
              sources: result.sources,
            },
            output: 'response',
          };
        } catch {
          return { data: { message: 'Désolé, je ne peux pas répondre pour le moment.' }, output: 'response' };
        }
      }
      return { data: { message: `[Sandbox] Réponse simulée pour: "${ctx.message}"` }, output: 'response' };
    });

    this.blockHandlers.set('action_send_message', async (ctx, config) => {
      const template = (config.messageTemplate as string) || '{{response}}';
      const lastResponse = (ctx.variables.lastResponse as string) || ctx.message;
      const message = template.replace('{{response}}', lastResponse);
      return { data: { message }, output: 'sent' };
    });

    this.blockHandlers.set('action_transfer_to_human', async (_ctx, config) => ({
      data: {
        message: (config.transferMessage as string) || 'Transfert vers un agent humain.',
        variables: { transferred: true, department: config.department, priority: config.priority },
      },
      output: 'transferred',
    }));

    this.blockHandlers.set('condition_if', async (ctx, config) => {
      const variable = ctx.variables[(config.variable as string)] ?? '';
      const value = config.value as string;
      const operator = config.operator as string;
      let result = false;

      switch (operator) {
        case 'equals': result = String(variable) === value; break;
        case 'not_equals': result = String(variable) !== value; break;
        case 'contains': result = String(variable).includes(value); break;
        case 'not_contains': result = !String(variable).includes(value); break;
        case 'greater_than': result = Number(variable) > Number(value); break;
        case 'less_than': result = Number(variable) < Number(value); break;
        case 'is_empty': result = !variable; break;
        case 'is_not_empty': result = !!variable; break;
      }

      return { data: { variables: { conditionResult: result } }, output: result ? 'true' : 'false' };
    });

    this.blockHandlers.set('condition_confidence_check', async (ctx, config) => {
      const confidence = (ctx.variables.confidence as number) ?? 0.5;
      const threshold = (config.threshold as number) ?? 0.7;
      return {
        data: { variables: { isConfident: confidence >= threshold } },
        output: confidence >= threshold ? 'confident' : 'uncertain',
      };
    });

    this.blockHandlers.set('ai_analyze_intent', async (ctx, config) => {
      if (this.llmService) {
        try {
          const intents = (config.intents as Array<{ name: string; description: string }>) || [];
          const intentList = intents.map((i) => `- ${i.name}: ${i.description}`).join('\n');
          const result = await this.llmService.complete({
            messages: [
              {
                role: 'system',
                content: `Classify the user intent. Available intents:\n${intentList}\n\nRespond with ONLY the intent name.`,
              },
              { role: 'user', content: ctx.message },
            ],
            temperature: 0.1,
            maxTokens: 50,
          });
          return {
            data: { intent: result.content.trim().toLowerCase(), confidence: 0.8, variables: { intent: result.content.trim().toLowerCase() } },
            output: 'intent',
          };
        } catch {
          return { data: { intent: 'other', confidence: 0.3 }, output: 'intent' };
        }
      }
      return { data: { intent: 'other', confidence: 0.5, variables: { intent: 'other' } }, output: 'intent' };
    });

    this.blockHandlers.set('ai_extract_data', async (ctx, config) => {
      if (this.llmService) {
        try {
          const fields = (config.fields as Array<{ name: string; type: string }>) || [];
          const fieldList = fields.map((f) => `- ${f.name} (${f.type})`).join('\n');
          const result = await this.llmService.complete({
            messages: [
              {
                role: 'system',
                content: `Extract the following data from the message:\n${fieldList}\n\nRespond in JSON format.`,
              },
              { role: 'user', content: ctx.message },
            ],
            temperature: 0,
            maxTokens: 200,
          });
          const extracted = JSON.parse(result.content);
          return { data: { extractedData: extracted, variables: extracted }, output: 'data' };
        } catch {
          return { data: { extractedData: {} }, output: 'data' };
        }
      }
      return { data: { extractedData: {} }, output: 'data' };
    });
  }

  async execute(
    flow: { nodes: FlowNode[]; edges: FlowEdge[] },
    message: string,
    options: {
      sandbox?: boolean;
      traceExecution?: boolean;
      agentId?: string;
      conversationId?: string;
    } = {},
  ): Promise<FlowExecutionResult> {
    this.executionTrace = [];

    const triggerNode = flow.nodes.find(
      (n) => n.data.block.category === 'TRIGGER',
    );
    if (!triggerNode) {
      throw new Error('No trigger block found in the flow');
    }

    const context: FlowContext = {
      message,
      variables: {},
      conversationHistory: [],
      sources: [],
      agentId: options.agentId,
      conversationId: options.conversationId,
    };

    let currentNodeId: string | null = triggerNode.id;
    let finalResponse = '';
    let maxSteps = 50;

    while (currentNodeId && maxSteps > 0) {
      maxSteps--;

      const node = flow.nodes.find((n) => n.id === currentNodeId);
      if (!node) break;

      const handler = this.blockHandlers.get(node.data.block.id);
      if (!handler) {
        this.logger.warn(`No handler for block: ${node.data.block.id}`);
        break;
      }

      const startTime = Date.now();
      const result = await handler(context, node.data.config);
      const duration = Date.now() - startTime;

      if (options.traceExecution) {
        this.executionTrace.push({
          nodeId: node.id,
          blockId: node.data.block.id,
          blockName: node.data.block.name,
          result: result.data,
          duration,
          output: result.output,
        });
      }

      if (result.data?.message) {
        finalResponse = result.data.message;
        context.variables.lastResponse = result.data.message;
      }
      if (result.data?.sources) {
        context.sources.push(...result.data.sources);
      }
      if (result.data?.variables) {
        Object.assign(context.variables, result.data.variables);
      }

      const outEdge = flow.edges.find(
        (e) =>
          e.source === currentNodeId &&
          (e.sourceHandle === result.output || !e.sourceHandle),
      );
      currentNodeId = outEdge?.target ?? null;
    }

    if (maxSteps === 0) {
      this.logger.warn('Flow execution hit max steps limit (infinite loop protection)');
    }

    return {
      finalResponse,
      sources: context.sources,
      trace: this.executionTrace,
      variables: context.variables,
    };
  }
}
