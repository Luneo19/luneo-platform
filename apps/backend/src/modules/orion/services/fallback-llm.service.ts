import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '@/libs/resilience/circuit-breaker.service';
import { RetryService } from '@/libs/resilience/retry.service';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMCompletionOptions {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

interface LLMCompletionResult {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

type LLMProvider = 'openai' | 'anthropic' | 'mistral';

interface ProviderConfig {
  name: LLMProvider;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  circuitName: string;
}

@Injectable()
export class FallbackLLMService {
  private readonly logger = new Logger(FallbackLLMService.name);
  private readonly providers: ProviderConfig[] = [];
  private currentProviderIndex = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly retryService: RetryService,
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.providers.push({
        name: 'openai',
        apiKey: openaiKey,
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        circuitName: 'orion_openai',
      });
    }

    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.providers.push({
        name: 'anthropic',
        apiKey: anthropicKey,
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-haiku-20240307',
        circuitName: 'orion_anthropic',
      });
    }

    const mistralKey = this.config.get<string>('MISTRAL_API_KEY');
    if (mistralKey) {
      this.providers.push({
        name: 'mistral',
        apiKey: mistralKey,
        baseUrl: 'https://api.mistral.ai/v1',
        defaultModel: 'mistral-small-latest',
        circuitName: 'orion_mistral',
      });
    }

    for (const p of this.providers) {
      this.circuitBreaker.configure(p.circuitName, {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        monitoringWindow: 60000,
      });
    }

    this.logger.log(
      `Initialized ${this.providers.length} LLM providers: ${this.providers.map((p) => p.name).join(', ')}`,
    );
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResult> {
    if (this.providers.length === 0) {
      throw new Error('No LLM providers configured');
    }

    const startIndex = this.currentProviderIndex;
    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex =
        (startIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];

      if (!this.circuitBreaker.canCall(provider.circuitName)) {
        this.logger.warn(
          `Circuit open for ${provider.name}, skipping`,
        );
        continue;
      }

      try {
        const result = await this.callProvider(provider, options);
        this.circuitBreaker.recordSuccess(provider.circuitName);
        this.currentProviderIndex =
          (providerIndex + 1) % this.providers.length;
        return result;
      } catch (error) {
        this.circuitBreaker.recordFailure(provider.circuitName);
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Provider ${provider.name} failed: ${lastError.message}, trying next`,
        );
      }
    }

    throw lastError || new Error('All LLM providers failed');
  }

  private async callProvider(
    provider: ProviderConfig,
    options: LLMCompletionOptions,
  ): Promise<LLMCompletionResult> {
    const model = options.model || provider.defaultModel;
    const start = Date.now();

    const result = await this.retryService.execute(
      async () => {
        if (provider.name === 'anthropic') {
          return this.callAnthropic(provider, options, model);
        }
        return this.callOpenAICompatible(provider, options, model);
      },
      { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000, exponentialBackoff: true },
    );

    return { ...result, latencyMs: Date.now() - start };
  }

  private async callOpenAICompatible(
    provider: ProviderConfig,
    options: LLMCompletionOptions,
    model: string,
  ): Promise<Omit<LLMCompletionResult, 'latencyMs'>> {
    const body: Record<string, unknown> = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2000,
    };

    if (options.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${provider.name} API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: provider.name,
      model,
      tokensUsed:
        (data.usage?.prompt_tokens || 0) +
        (data.usage?.completion_tokens || 0),
    };
  }

  private async callAnthropic(
    provider: ProviderConfig,
    options: LLMCompletionOptions,
    model: string,
  ): Promise<Omit<LLMCompletionResult, 'latencyMs'>> {
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystemMessages = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model,
      messages: nonSystemMessages,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.3,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      provider: provider.name,
      model,
      tokensUsed:
        (data.usage?.input_tokens || 0) +
        (data.usage?.output_tokens || 0),
    };
  }

  getProvidersStatus() {
    return this.providers.map((p) => ({
      name: p.name,
      model: p.defaultModel,
      circuit: this.circuitBreaker.getStatus(p.circuitName),
    }));
  }
}
