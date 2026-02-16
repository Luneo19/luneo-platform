import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AICapability,
  AIGenerationRequest,
  AIGenerationResponse,
  EnhancedAIProvider,
  EnhancedAIProviderConfig,
  ProviderHealthInfo,
  ProviderStatus,
} from '@/modules/ai/providers/base/ai-provider.interface';

const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_MAX_RETRIES = 3;
const HEALTH_DEGRADED_FAILURES = 3;
const HEALTH_UNAVAILABLE_FAILURES = 5;
const LATENCY_SAMPLES_MAX = 20;

/**
 * Abstract base class for AI providers with retry, timeout, and health tracking.
 * Subclasses implement executeGeneration() with the actual provider call.
 */
export abstract class BaseAIProvider implements EnhancedAIProvider {
  protected readonly logger: Logger;
  protected lastError: Error | null = null;
  protected consecutiveFailures = 0;
  protected readonly latencySamples: number[] = [];
  protected lastHealthCheck: Date = new Date(0);

  constructor(protected readonly configService: ConfigService) {
    this.logger = new Logger(this.constructor.name);
  }

  abstract getName(): string;
  abstract getDisplayName(): string;
  abstract getConfig(): EnhancedAIProviderConfig;
  abstract getCapabilities(): AICapability[];

  supportsCapability(capability: AICapability): boolean {
    return this.getConfig().capabilities.includes(capability);
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const config = this.getConfig();
    const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const start = Date.now();
        const result = await this.withTimeout(
          this.executeGeneration(request),
          timeoutMs,
        );
        const latencyMs = Date.now() - start;

        this.recordSuccess(latencyMs);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.lastError = lastError;
        this.consecutiveFailures++;

        const delayMs = this.getBackoffDelayMs(attempt, maxRetries);
        if (attempt < maxRetries && delayMs > 0) {
          this.logger.warn(
            `Generation attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delayMs}ms: ${lastError.message}`,
          );
          await this.sleep(delayMs);
        }
      }
    }

    this.recordFailure();
    throw lastError ?? new Error('Generation failed after retries');
  }

  abstract estimateCost(
    request: AIGenerationRequest,
  ): { credits: number; costCents: number };

  async isAvailable(): Promise<boolean> {
    const health = await this.getHealth();
    return health.status !== ProviderStatus.UNAVAILABLE;
  }

  async getHealth(): Promise<ProviderHealthInfo> {
    const now = new Date();
    const failures = this.consecutiveFailures;
    const latencyMs =
      this.latencySamples.length > 0
        ? this.latencySamples.reduce((a, b) => a + b, 0) /
          this.latencySamples.length
        : 0;
    const totalCalls = this.latencySamples.length + failures;
    const errorRate = totalCalls > 0 ? failures / totalCalls : 0;

    let status: ProviderStatus = ProviderStatus.HEALTHY;
    if (failures >= HEALTH_UNAVAILABLE_FAILURES) {
      status = ProviderStatus.UNAVAILABLE;
    } else if (failures >= HEALTH_DEGRADED_FAILURES || errorRate > 0.2) {
      status = ProviderStatus.DEGRADED;
    }

    return {
      status,
      latencyMs: Math.round(latencyMs),
      errorRate,
      lastChecked: now,
      consecutiveFailures: failures,
    };
  }

  /**
   * Subclasses implement this with the actual provider API call.
   */
  protected abstract executeGeneration(
    request: AIGenerationRequest,
  ): Promise<AIGenerationResponse>;

  private recordSuccess(latencyMs: number): void {
    this.consecutiveFailures = 0;
    this.lastError = null;
    this.latencySamples.push(latencyMs);
    if (this.latencySamples.length > LATENCY_SAMPLES_MAX) {
      this.latencySamples.shift();
    }
    this.lastHealthCheck = new Date();
  }

  private recordFailure(): void {
    this.lastHealthCheck = new Date();
  }

  private getBackoffDelayMs(attempt: number, maxRetries: number): number {
    if (attempt >= maxRetries) return 0;
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Provider ${this.getName()} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
