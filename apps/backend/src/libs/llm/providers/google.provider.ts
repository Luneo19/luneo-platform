import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
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
export class GoogleProvider implements LlmProviderInterface {
  readonly provider = LlmProvider.GOOGLE;
  private readonly logger = new Logger(GoogleProvider.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GOOGLE_AI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GOOGLE_AI_API_KEY not configured — Google provider disabled');
    }
  }

  isAvailable(): boolean {
    return this.genAI !== null;
  }

  private getModel(options: LlmCompletionOptions): GenerativeModel {
    if (!this.genAI) throw new Error('Google provider is not configured');

    const systemMessage = options.messages.find((m) => m.role === 'system');

    return this.genAI.getGenerativeModel({
      model: options.model,
      ...(systemMessage ? { systemInstruction: systemMessage.content } : {}),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        topP: options.topP,
        maxOutputTokens: options.maxTokens,
        stopSequences: options.stop,
      },
    });
  }

  private buildContents(options: LlmCompletionOptions) {
    return options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const start = Date.now();
    const model = this.getModel(options);
    const contents = this.buildContents(options);

    const result = await model.generateContent({ contents });
    const response = result.response;

    const latencyMs = Date.now() - start;
    const tokensIn = response.usageMetadata?.promptTokenCount ?? 0;
    const tokensOut = response.usageMetadata?.candidatesTokenCount ?? 0;
    const content = response.text();

    return {
      content,
      tokensIn,
      tokensOut,
      model: options.model,
      provider: this.provider,
      latencyMs,
      costUsd: calculateCost(options.model, tokensIn, tokensOut),
    };
  }

  stream(options: LlmCompletionOptions): Observable<LlmStreamEvent> {
    return new Observable((subscriber: Subscriber<LlmStreamEvent>) => {
      if (!this.genAI) {
        subscriber.error(new Error('Google provider is not configured'));
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
    const model = this.getModel(options);
    const contents = this.buildContents(options);

    const result = await model.generateContentStream({ contents });

    let tokensIn = 0;
    let tokensOut = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullContent += text;
        subscriber.next({ type: 'delta', content: text });
      }

      if (chunk.usageMetadata) {
        tokensIn = chunk.usageMetadata.promptTokenCount ?? 0;
        tokensOut = chunk.usageMetadata.candidatesTokenCount ?? 0;
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
