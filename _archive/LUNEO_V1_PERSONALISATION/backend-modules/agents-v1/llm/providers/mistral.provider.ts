import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subscriber } from 'rxjs';
import { Mistral } from '@mistralai/mistralai';
import {
  BaseLLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMHealthStatus,
} from './base-llm.provider';

@Injectable()
export class MistralProvider extends BaseLLMProvider {
  readonly name = 'mistral';
  private readonly logger = new Logger(MistralProvider.name);
  private client: Mistral | null = null;

  get isAvailable(): boolean {
    return !!this.configService.get<string>('MISTRAL_API_KEY');
  }

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY');
    if (apiKey) {
      this.client = new Mistral({ apiKey });
    }
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.client) throw new Error('Mistral client not configured');

    const response = await this.client.chat.complete({
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens ?? 4096,
      topP: request.topP,
      stop: request.stop,
      ...(request.tools?.length && {
        tools: request.tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
          },
        })),
      }),
    });

    const choice = response.choices?.[0];
    const message = choice?.message;

    return {
      content: (message?.content as string) || '',
      finishReason: choice?.finishReason || 'stop',
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
      },
      toolCalls: message?.toolCalls?.map((tc) => ({
        id: tc.id || `tc_${Date.now()}`,
        type: 'function' as const,
        function: {
          name: tc.function?.name || '',
          arguments: tc.function?.arguments
            ? (typeof tc.function.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function.arguments))
            : '{}',
        },
      })),
      model: request.model,
    };
  }

  stream(request: LLMCompletionRequest): Observable<LLMStreamChunk> {
    return new Observable((subscriber: Subscriber<LLMStreamChunk>) => {
      if (!this.client) {
        subscriber.error(new Error('Mistral client not configured'));
        return;
      }

      (async () => {
        try {
          const stream = await this.client!.chat.stream({
            model: request.model,
            messages: request.messages.map((m) => ({
              role: m.role as 'system' | 'user' | 'assistant',
              content: m.content,
            })),
            temperature: request.temperature ?? 0.7,
            maxTokens: request.maxTokens ?? 4096,
          });

          for await (const event of stream) {
            const chunk = event.data;
            const delta = chunk.choices?.[0]?.delta;
            const finishReason = chunk.choices?.[0]?.finishReason;

            if (delta?.content) {
              subscriber.next({ type: 'content', content: delta.content as string });
            }

            if (finishReason) {
              subscriber.next({
                type: 'done',
                finishReason,
                usage: chunk.usage
                  ? {
                      promptTokens: chunk.usage.promptTokens || 0,
                      completionTokens: chunk.usage.completionTokens || 0,
                      totalTokens: chunk.usage.totalTokens || 0,
                    }
                  : undefined,
              });
            }
          }
          subscriber.complete();
        } catch (error) {
          this.logger.error(`Mistral stream error: ${error}`);
          subscriber.next({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
          subscriber.complete();
        }
      })();
    });
  }

  async countTokens(text: string, _model: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  async healthCheck(): Promise<LLMHealthStatus> {
    if (!this.client) return { healthy: false, latencyMs: 0, error: 'Client not configured' };

    const start = Date.now();
    try {
      await this.client.chat.complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start, error: (error as Error).message };
    }
  }
}
