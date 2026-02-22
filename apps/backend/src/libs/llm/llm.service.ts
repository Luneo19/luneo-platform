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
import { GroqProvider } from './providers/groq.provider';
import { MistralProvider } from './providers/mistral.provider';

const MODEL_ROUTING_RULES: Array<{ pattern: RegExp; provider: LlmProvider }> = [
  { pattern: /^gpt-/, provider: LlmProvider.OPENAI },
  { pattern: /^o[1-9]/, provider: LlmProvider.OPENAI },
  { pattern: /^claude-/, provider: LlmProvider.ANTHROPIC },
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
    private readonly groq: GroqProvider,
    private readonly mistral: MistralProvider,
  ) {}

  onModuleInit(): void {
    const providers: LlmProviderInterface[] = [
      this.openai,
      this.anthropic,
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

    try {
      return await provider.complete(options);
    } catch (error) {
      this.logger.error(
        `Provider ${providerEnum} failed for model ${options.model}: ${error.message}`,
      );

      for (const fallback of fallbacks) {
        try {
          const fallbackProvider = this.getProvider(fallback);
          this.logger.warn(`Falling back to ${fallback} for model ${options.model}`);
          return await fallbackProvider.complete(options);
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
}
