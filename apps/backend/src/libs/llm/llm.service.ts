import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  LlmProvider,
  LlmProviderInterface,
  LlmCompletionOptions,
  LlmCompletionResult,
  LlmStreamEvent,
} from './llm.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';
import { MODEL_CATALOG, LlmModelInfo } from './llm.interface';

const MODEL_ROUTING_RULES: Array<{ pattern: RegExp; provider: LlmProvider }> = [
  { pattern: /^gpt-/, provider: LlmProvider.OPENAI },
  { pattern: /^o[1-9]/, provider: LlmProvider.OPENAI },
  { pattern: /^claude-/, provider: LlmProvider.ANTHROPIC },
  { pattern: /^gemini-/, provider: LlmProvider.GOOGLE },
  { pattern: /^llama-/, provider: LlmProvider.GROQ },
  { pattern: /^llama3/, provider: LlmProvider.GROQ },
  { pattern: /^mixtral-/, provider: LlmProvider.GROQ },
  { pattern: /^gemma-/, provider: LlmProvider.GROQ },
  { pattern: /^mistral-/, provider: LlmProvider.MISTRAL },
  { pattern: /^open-mistral-/, provider: LlmProvider.MISTRAL },
  { pattern: /^codestral-/, provider: LlmProvider.MISTRAL },
];

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private readonly providerMap = new Map<LlmProvider, LlmProviderInterface>();

  constructor(
    private readonly openai: OpenAiProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly google: GoogleProvider,
    private readonly groq: GroqProvider,
    private readonly mistral: MistralProvider,
  ) {}

  onModuleInit(): void {
    const providers: LlmProviderInterface[] = [
      this.openai,
      this.anthropic,
      this.google,
      this.groq,
      this.mistral,
    ];

    for (const provider of providers) {
      this.providerMap.set(provider.provider, provider);
      const status = provider.isAvailable() ? 'available' : 'disabled';
      this.logger.log(`LLM provider ${provider.provider}: ${status}`);
    }
  }

  async complete(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const providerEnum = this.resolveProvider(options);
    const provider = this.getProvider(providerEnum);

    const fallbacks = options.fallbackProviders ?? [];
    const retries = Math.max(0, options.retryCount ?? 1);
    const timeoutMs = Math.max(5000, options.timeoutMs ?? 30000);

    try {
      return await this.executeWithRetries(
        () => this.withTimeout(provider.complete(options), timeoutMs),
        retries,
      );
    } catch (error) {
      this.logger.error(
        `Provider ${providerEnum} failed for model ${options.model}: ${error.message}`,
      );

      for (const fallback of fallbacks) {
        try {
          const fallbackProvider = this.getProvider(fallback);
          this.logger.warn(`Falling back to ${fallback} for model ${options.model}`);
          return await this.executeWithRetries(
            () => this.withTimeout(fallbackProvider.complete(options), timeoutMs),
            retries,
          );
        } catch (fallbackError) {
          this.logger.error(
            `Fallback provider ${fallback} also failed: ${fallbackError.message}`,
          );
        }
      }

      throw error;
    }
  }

  stream(options: LlmCompletionOptions): Observable<LlmStreamEvent> {
    const providerEnum = this.resolveProvider(options);
    const provider = this.getProvider(providerEnum);
    return provider.stream(options);
  }

  resolveProvider(options: LlmCompletionOptions): LlmProvider {
    if (options.provider) return options.provider;

    const rule = MODEL_ROUTING_RULES.find((r) => r.pattern.test(options.model));
    if (rule) return rule.provider;

    throw new Error(
      `Cannot determine provider for model "${options.model}". ` +
        `Specify options.provider explicitly or use a known model prefix.`,
    );
  }

  getAvailableProviders(): LlmProvider[] {
    return Array.from(this.providerMap.entries())
      .filter(([, p]) => p.isAvailable())
      .map(([key]) => key);
  }

  isProviderAvailable(provider: LlmProvider): boolean {
    return this.providerMap.get(provider)?.isAvailable() ?? false;
  }

  getAvailableModels(): LlmModelInfo[] {
    return MODEL_CATALOG.filter((m) => this.isProviderAvailable(m.provider));
  }

  getAvailableModelsByProvider(): Record<string, LlmModelInfo[]> {
    const available = this.getAvailableModels();
    const grouped: Record<string, LlmModelInfo[]> = {};
    for (const model of available) {
      if (!grouped[model.provider]) grouped[model.provider] = [];
      grouped[model.provider].push(model);
    }
    return grouped;
  }

  /**
   * Generate embedding vector for text. Uses OpenAI text-embedding-3-small.
   */
  async generateEmbedding(text: string, model = 'text-embedding-3-small'): Promise<number[]> {
    const openaiProvider = this.providerMap.get(LlmProvider.OPENAI);
    if (!openaiProvider || !openaiProvider.isAvailable()) {
      throw new Error('OpenAI provider is not available for embeddings');
    }
    return (openaiProvider as OpenAiProvider).generateEmbedding(text, model);
  }

  private getProvider(provider: LlmProvider): LlmProviderInterface {
    const instance = this.providerMap.get(provider);
    if (!instance) {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }
    if (!instance.isAvailable()) {
      throw new Error(
        `LLM provider ${provider} is not available. Check the API key configuration.`,
      );
    }
    return instance;
  }

  private async executeWithRetries<T>(
    fn: () => Promise<T>,
    retries: number,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          const delayMs = 200 * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError;
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`LLM call timeout after ${timeoutMs}ms`)),
        timeoutMs,
      );
      promise
        .then((value) => resolve(value))
        .catch((error) => reject(error))
        .finally(() => clearTimeout(timeout));
    });
  }
}
