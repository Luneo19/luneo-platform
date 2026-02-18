import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subscriber } from 'rxjs';
import Anthropic from '@anthropic-ai/sdk';
import {
  BaseLLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMHealthStatus,
  LLMMessage,
  LLMToolDefinition,
} from './base-llm.provider';

@Injectable()
export class AnthropicProvider extends BaseLLMProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic | null = null;

  get isAvailable(): boolean {
    return !!this.configService.get<string>('ANTHROPIC_API_KEY');
  }

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.client) throw new Error('Anthropic client not configured');

    const { systemPrompt, messages } = this.splitSystemPrompt(request.messages);
    const params: Anthropic.MessageCreateParams = {
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      messages: messages.map((m) => this.toAnthropicMessage(m)),
      temperature: request.temperature ?? 0.7,
    };

    if (systemPrompt) params.system = systemPrompt;
    if (request.topP !== undefined) params.top_p = request.topP;
    if (request.stop) params.stop_sequences = request.stop;
    if (request.tools?.length) {
      params.tools = request.tools.map((t) => this.toAnthropicTool(t));
    }

    const response = await this.client.messages.create(params);

    let content = '';
    const toolCalls: LLMCompletionResponse['toolCalls'] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }

    return {
      content,
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : (response.stop_reason || 'stop'),
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: response.model,
    };
  }

  stream(request: LLMCompletionRequest): Observable<LLMStreamChunk> {
    return new Observable((subscriber: Subscriber<LLMStreamChunk>) => {
      if (!this.client) {
        subscriber.error(new Error('Anthropic client not configured'));
        return;
      }

      const { systemPrompt, messages } = this.splitSystemPrompt(request.messages);
      const params: Anthropic.MessageCreateParams = {
        model: request.model,
        max_tokens: request.maxTokens ?? 4096,
        messages: messages.map((m) => this.toAnthropicMessage(m)),
        temperature: request.temperature ?? 0.7,
        stream: true,
      };

      if (systemPrompt) params.system = systemPrompt;
      if (request.tools?.length) {
        params.tools = request.tools.map((t) => this.toAnthropicTool(t));
      }

      (async () => {
        try {
          const stream = this.client!.messages.stream(params);
          let inputTokens = 0;
          let outputTokens = 0;

          stream.on('text', (text) => {
            subscriber.next({ type: 'content', content: text });
          });

          stream.on('message', (message) => {
            inputTokens = message.usage.input_tokens;
            outputTokens = message.usage.output_tokens;
            subscriber.next({
              type: 'done',
              finishReason: message.stop_reason === 'end_turn' ? 'stop' : (message.stop_reason || 'stop'),
              usage: {
                promptTokens: inputTokens,
                completionTokens: outputTokens,
                totalTokens: inputTokens + outputTokens,
              },
            });
            subscriber.complete();
          });

          stream.on('error', (error) => {
            this.logger.error(`Anthropic stream error: ${error}`);
            subscriber.next({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
            subscriber.complete();
          });
        } catch (error) {
          this.logger.error(`Anthropic stream setup error: ${error}`);
          subscriber.next({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
          subscriber.complete();
        }
      })();
    });
  }

  async countTokens(text: string, _model: string): Promise<number> {
    return Math.ceil(text.length / 3.5);
  }

  async healthCheck(): Promise<LLMHealthStatus> {
    if (!this.client) return { healthy: false, latencyMs: 0, error: 'Client not configured' };

    const start = Date.now();
    try {
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start, error: (error as Error).message };
    }
  }

  private splitSystemPrompt(messages: LLMMessage[]): { systemPrompt: string; messages: LLMMessage[] } {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');
    return {
      systemPrompt: systemMessages.map((m) => m.content).join('\n\n'),
      messages: otherMessages,
    };
  }

  private toAnthropicMessage(msg: LLMMessage): Anthropic.MessageParam {
    return {
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    };
  }

  private toAnthropicTool(tool: LLMToolDefinition): Anthropic.Tool {
    return {
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters as Anthropic.Tool['input_schema'],
    };
  }
}
