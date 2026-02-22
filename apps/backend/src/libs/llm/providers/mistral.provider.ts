import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import { Observable, Subscriber } from 'rxjs';
import {
  LlmProvider,
  LlmProviderInterface,
  LlmCompletionOptions,
  LlmCompletionResult,
  LlmStreamEvent,
  calculateCost,
} from '../llm.interface';

@Injectable()
export class MistralProvider implements LlmProviderInterface {
  readonly provider = LlmProvider.MISTRAL;
  private readonly logger = new Logger(MistralProvider.name);
  private client: Mistral | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('MISTRAL_API_KEY');
    if (apiKey) {
      this.client = new Mistral({ apiKey });
    } else {
      this.logger.warn('MISTRAL_API_KEY not configured — Mistral provider disabled');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    if (!this.client) throw new Error('Mistral provider is not configured');

    const start = Date.now();

    const response = await this.client.chat.complete({
      model: options.model,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens,
      topP: options.topP,
      stop: options.stop,
    });

    const latencyMs = Date.now() - start;
    const tokensIn = response.usage?.promptTokens ?? 0;
    const tokensOut = response.usage?.completionTokens ?? 0;
    const model = response.model ?? options.model;

    return {
      content: (response.choices?.[0]?.message?.content as string) ?? '',
      tokensIn,
      tokensOut,
      model,
      provider: this.provider,
      latencyMs,
      costUsd: calculateCost(model, tokensIn, tokensOut),
    };
  }

  stream(options: LlmCompletionOptions): Observable<LlmStreamEvent> {
    return new Observable((subscriber: Subscriber<LlmStreamEvent>) => {
      if (!this.client) {
        subscriber.error(new Error('Mistral provider is not configured'));
        return;
      }

      this.runStream(options, subscriber).catch((err) => {
        subscriber.next({ type: 'error', error: err.message });
        subscriber.complete();
      });
    });
  }

  private async runStream(
    options: LlmCompletionOptions,
    subscriber: Subscriber<LlmStreamEvent>,
  ): Promise<void> {
    const start = Date.now();
    let fullContent = '';
    let tokensIn = 0;
    let tokensOut = 0;

    const stream = await this.client!.chat.stream({
      model: options.model,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens,
      topP: options.topP,
      stop: options.stop,
    });

    for await (const event of stream) {
      const delta = event.data?.choices?.[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        subscriber.next({ type: 'delta', content: delta as string });
      }

      if (event.data?.usage) {
        tokensIn = event.data.usage.promptTokens ?? 0;
        tokensOut = event.data.usage.completionTokens ?? 0;
      }
    }

    const latencyMs = Date.now() - start;
    subscriber.next({
      type: 'done',
      content: fullContent,
      model: options.model,
      provider: this.provider,
      tokensIn,
      tokensOut,
      latencyMs,
      costUsd: calculateCost(options.model, tokensIn, tokensOut),
    });
    subscriber.complete();
  }
}
