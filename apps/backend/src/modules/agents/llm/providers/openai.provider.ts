import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subscriber } from 'rxjs';
import OpenAI from 'openai';
import {
  BaseLLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMHealthStatus,
  LLMMessage,
} from './base-llm.provider';

@Injectable()
export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI | null = null;

  get isAvailable(): boolean {
    return !!this.configService.get<string>('OPENAI_API_KEY');
  }

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.client) throw new Error('OpenAI client not configured');

    const params = this.buildParams(request);
    const response = await this.client.chat.completions.create({ ...params, stream: false });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      finishReason: choice.finish_reason || 'stop',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      toolCalls: choice.message.tool_calls?.map((tc: OpenAI.ChatCompletionMessageToolCall) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
      model: response.model,
    };
  }

  stream(request: LLMCompletionRequest): Observable<LLMStreamChunk> {
    return new Observable((subscriber: Subscriber<LLMStreamChunk>) => {
      if (!this.client) {
        subscriber.error(new Error('OpenAI client not configured'));
        return;
      }

      const params = this.buildParams(request);
      let _totalContent = '';

      (async () => {
        try {
          const stream = await this.client!.chat.completions.create({
            ...params,
            stream: true,
            stream_options: { include_usage: true },
          });

          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta;
            const finishReason = chunk.choices?.[0]?.finish_reason;

            if (delta?.content) {
              _totalContent += delta.content;
              subscriber.next({ type: 'content', content: delta.content });
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                subscriber.next({
                  type: 'tool_call',
                  toolCall: {
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' },
                  },
                });
              }
            }

            if (finishReason) {
              subscriber.next({
                type: 'done',
                finishReason,
                usage: chunk.usage
                  ? {
                      promptTokens: chunk.usage.prompt_tokens,
                      completionTokens: chunk.usage.completion_tokens,
                      totalTokens: chunk.usage.total_tokens,
                    }
                  : undefined,
              });
            }
          }
          subscriber.complete();
        } catch (error) {
          this.logger.error(`OpenAI stream error: ${error}`);
          subscriber.next({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
          subscriber.complete();
        }
      })();
    });
  }

  async countTokens(text: string, _model: string): Promise<number> {
    try {
      const { encoding_for_model } = await import('tiktoken');
      const enc = encoding_for_model('gpt-4o' as Parameters<typeof encoding_for_model>[0]);
      const tokens = enc.encode(text);
      const count = tokens.length;
      enc.free();
      return count;
    } catch {
      return Math.ceil(text.length / 4);
    }
  }

  async healthCheck(): Promise<LLMHealthStatus> {
    if (!this.client) return { healthy: false, latencyMs: 0, error: 'Client not configured' };

    const start = Date.now();
    try {
      await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start, error: (error as Error).message };
    }
  }

  private buildParams(request: LLMCompletionRequest): OpenAI.ChatCompletionCreateParams {
    const params: OpenAI.ChatCompletionCreateParams = {
      model: request.model,
      messages: request.messages.map((m) => this.toOpenAIMessage(m)),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (request.topP !== undefined) params.top_p = request.topP;
    if (request.frequencyPenalty !== undefined) params.frequency_penalty = request.frequencyPenalty;
    if (request.presencePenalty !== undefined) params.presence_penalty = request.presencePenalty;
    if (request.stop) params.stop = request.stop;
    if (request.responseFormat) params.response_format = request.responseFormat;

    if (request.tools?.length) {
      params.tools = request.tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters as Record<string, unknown>,
        },
      }));
      if (request.toolChoice) {
        params.tool_choice = request.toolChoice as OpenAI.ChatCompletionToolChoiceOption;
      }
    }

    return params;
  }

  private toOpenAIMessage(msg: LLMMessage): OpenAI.ChatCompletionMessageParam {
    if (msg.role === 'tool') {
      return { role: 'tool', content: msg.content, tool_call_id: msg.toolCallId || '' };
    }
    return { role: msg.role as 'system' | 'user' | 'assistant', content: msg.content };
  }
}
