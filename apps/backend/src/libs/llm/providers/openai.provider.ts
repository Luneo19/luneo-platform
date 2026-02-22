import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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
export class OpenAiProvider implements LlmProviderInterface {
  readonly provider = LlmProvider.OPENAI;
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not configured — OpenAI provider disabled');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    if (!this.client) throw new Error('OpenAI provider is not configured');

    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: options.model,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
    });

    const latencyMs = Date.now() - start;
    const tokensIn = response.usage?.prompt_tokens ?? 0;
    const tokensOut = response.usage?.completion_tokens ?? 0;

    return {
      content: response.choices[0]?.message?.content ?? '',
      tokensIn,
      tokensOut,
      model: response.model,
      provider: this.provider,
      latencyMs,
      costUsd: calculateCost(response.model, tokensIn, tokensOut),
    };
  }

  /**
   * Generate embedding vector for text using OpenAI text-embedding-3-small.
   */
  async generateEmbedding(text: string, model = 'text-embedding-3-small'): Promise<number[]> {
    if (!this.client) throw new Error('OpenAI provider is not configured');

    const response = await this.client.embeddings.create({
      model,
      input: text,
    });

    const embedding = response.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding response from OpenAI');
    }
    return embedding;
  }

  stream(options: LlmCompletionOptions): Observable<LlmStreamEvent> {
    return new Observable((subscriber: Subscriber<LlmStreamEvent>) => {
      if (!this.client) {
        subscriber.error(new Error('OpenAI provider is not configured'));
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

    const stream = await this.client!.chat.completions.create({
      model: options.model,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: true,
      stream_options: { include_usage: true },
    });

    let tokensIn = 0;
    let tokensOut = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        subscriber.next({ type: 'delta', content: delta });
      }

      if (chunk.usage) {
        tokensIn = chunk.usage.prompt_tokens ?? 0;
        tokensOut = chunk.usage.completion_tokens ?? 0;
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
