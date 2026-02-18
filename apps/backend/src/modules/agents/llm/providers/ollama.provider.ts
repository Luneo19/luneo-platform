import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable, Subscriber } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  BaseLLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMHealthStatus,
} from './base-llm.provider';

@Injectable()
export class OllamaProvider extends BaseLLMProvider {
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;

  get isAvailable(): boolean {
    return this.enabled;
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super();
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    this.enabled =
      this.configService.get<string>('OLLAMA_ENABLED', 'false') === 'true' ||
      this.configService.get<string>('NODE_ENV') === 'development';
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    if (!this.enabled) throw new Error('Ollama is disabled in this environment');

    const start = Date.now();
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/api/chat`, {
        model: request.model,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 4096,
          top_p: request.topP,
          stop: request.stop,
        },
        stream: false,
      }),
    );

    const data = response.data;
    const latencyMs = Date.now() - start;
    const promptTokens = data.prompt_eval_count || 0;
    const completionTokens = data.eval_count || 0;

    return {
      content: data.message?.content || '',
      finishReason: data.done ? 'stop' : 'length',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      model: data.model || request.model,
    };
  }

  stream(request: LLMCompletionRequest): Observable<LLMStreamChunk> {
    return new Observable((subscriber: Subscriber<LLMStreamChunk>) => {
      if (!this.enabled) {
        subscriber.error(new Error('Ollama is disabled in this environment'));
        return;
      }

      (async () => {
        try {
          const response = await firstValueFrom(
            this.httpService.post(
              `${this.baseUrl}/api/chat`,
              {
                model: request.model,
                messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
                options: {
                  temperature: request.temperature ?? 0.7,
                  num_predict: request.maxTokens ?? 4096,
                },
                stream: true,
              },
              { responseType: 'stream' },
            ),
          );

          const stream = response.data;
          let buffer = '';

          stream.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  subscriber.next({ type: 'content', content: data.message.content });
                }
                if (data.done) {
                  subscriber.next({
                    type: 'done',
                    finishReason: 'stop',
                    usage: {
                      promptTokens: data.prompt_eval_count || 0,
                      completionTokens: data.eval_count || 0,
                      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                    },
                  });
                }
              } catch {
                // skip malformed JSON lines
              }
            }
          });

          stream.on('end', () => subscriber.complete());
          stream.on('error', (error: Error) => {
            subscriber.next({ type: 'error', error: error.message });
            subscriber.complete();
          });
        } catch (error) {
          this.logger.error(`Ollama stream error: ${error}`);
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
    if (!this.enabled) return { healthy: false, latencyMs: 0, error: 'Ollama disabled' };

    const start = Date.now();
    try {
      await firstValueFrom(this.httpService.get(`${this.baseUrl}/api/tags`));
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start, error: (error as Error).message };
    }
  }
}
