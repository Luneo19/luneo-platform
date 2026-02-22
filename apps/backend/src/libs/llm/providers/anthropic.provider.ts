import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
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
export class AnthropicProvider implements LlmProviderInterface {
  readonly provider = LlmProvider.ANTHROPIC;
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured — Anthropic provider disabled');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    if (!this.client) throw new Error('Anthropic provider is not configured');

    const start = Date.now();

    const systemMessage = options.messages.find((m) => m.role === 'system');
    const userMessages = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await this.client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP,
      stop_sequences: options.stop,
      ...(systemMessage ? { system: systemMessage.content } : {}),
      messages: userMessages,
    });

    const latencyMs = Date.now() - start;
    const tokensIn = response.usage.input_tokens;
    const tokensOut = response.usage.output_tokens;
    const content =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    return {
      content,
      tokensIn,
      tokensOut,
      model: response.model,
      provider: this.provider,
      latencyMs,
      costUsd: calculateCost(response.model, tokensIn, tokensOut),
    };
  }

  stream(options: LlmCompletionOptions): Observable<LlmStreamEvent> {
    return new Observable((subscriber: Subscriber<LlmStreamEvent>) => {
      if (!this.client) {
        subscriber.error(new Error('Anthropic provider is not configured'));
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

    const systemMessage = options.messages.find((m) => m.role === 'system');
    const userMessages = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const stream = this.client!.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP,
      stop_sequences: options.stop,
      ...(systemMessage ? { system: systemMessage.content } : {}),
      messages: userMessages,
    });

    stream.on('text', (text) => {
      fullContent += text;
      subscriber.next({ type: 'delta', content: text });
    });

    const finalMessage = await stream.finalMessage();

    const latencyMs = Date.now() - start;
    const tokensIn = finalMessage.usage.input_tokens;
    const tokensOut = finalMessage.usage.output_tokens;

    subscriber.next({
      type: 'done',
      content: fullContent,
      model: finalMessage.model,
      provider: this.provider,
      tokensIn,
      tokensOut,
      latencyMs,
      costUsd: calculateCost(finalMessage.model, tokensIn, tokensOut),
    });
    subscriber.complete();
  }
}
