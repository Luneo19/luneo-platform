import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subscriber } from 'rxjs';
import Groq from 'groq-sdk';
import {
  BaseLLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMHealthStatus,
} from './base-llm.provider';

@Injectable()
export class GroqProvider extends BaseLLMProvider {
  readonly name = 'groq';
  private readonly logger = new Logger(GroqProvider.name);
  private client: Groq | null = null;

  get isAvailable(): boolean {
    return !!this.configService.get<string>('GROQ_API_KEY');
  }

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.client = new Groq({ apiKey });
    }
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.client) throw new Error('Groq client not configured');

    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      top_p: request.topP,
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

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      finishReason: choice.finish_reason || 'stop',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      toolCalls: choice.message.tool_calls?.map((tc) => ({
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
        subscriber.error(new Error('Groq client not configured'));
        return;
      }

      (async () => {
        try {
          const stream = await this.client!.chat.completions.create({
            model: request.model,
            messages: request.messages.map((m) => ({
              role: m.role as 'system' | 'user' | 'assistant',
              content: m.content,
            })),
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 4096,
            stream: true,
          });

          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta;
            const finishReason = chunk.choices?.[0]?.finish_reason;

            if (delta?.content) {
              subscriber.next({ type: 'content', content: delta.content });
            }

            if (finishReason) {
              subscriber.next({
                type: 'done',
                finishReason,
                usage: chunk.x_groq?.usage
                  ? {
                      promptTokens: chunk.x_groq.usage.prompt_tokens || 0,
                      completionTokens: chunk.x_groq.usage.completion_tokens || 0,
                      totalTokens: chunk.x_groq.usage.total_tokens || 0,
                    }
                  : undefined,
              });
            }
          }
          subscriber.complete();
        } catch (error) {
          this.logger.error(`Groq stream error: ${error}`);
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
      await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start, error: (error as Error).message };
    }
  }
}
