import { Injectable } from '@nestjs/common';

export class IntegrationHttpError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'IntegrationHttpError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export interface IntegrationProviderMetric {
  calls: number;
  success: number;
  errors: number;
  avgLatencyMs: number;
}

@Injectable()
export class IntegrationHttpClient {
  private static readonly providerMetrics = new Map<string, IntegrationProviderMetric>();

  private static detectProviderFromUrl(url: string): string {
    if (url.includes('hubapi.com')) return 'hubspot';
    if (url.includes('salesforce.com')) return 'salesforce';
    if (url.includes('googleapis.com/calendar')) return 'google_calendar';
    if (url.includes('calendly.com')) return 'calendly';
    return 'unknown';
  }

  private static updateMetrics(provider: string, success: boolean, latencyMs: number) {
    const prev = IntegrationHttpClient.providerMetrics.get(provider) ?? {
      calls: 0,
      success: 0,
      errors: 0,
      avgLatencyMs: 0,
    };
    const calls = prev.calls + 1;
    const avgLatencyMs = ((prev.avgLatencyMs * prev.calls) + latencyMs) / calls;
    IntegrationHttpClient.providerMetrics.set(provider, {
      calls,
      success: prev.success + (success ? 1 : 0),
      errors: prev.errors + (success ? 0 : 1),
      avgLatencyMs,
    });
  }

  static getGlobalMetrics(): Record<string, IntegrationProviderMetric> {
    return Object.fromEntries(IntegrationHttpClient.providerMetrics.entries());
  }

  async requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method ?? 'GET';
    const timeoutMs = options.timeoutMs ?? 10000;
    const retries = Math.max(0, options.retries ?? 1);

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method,
          headers: options.headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal,
        });

        const raw = await response.text();
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const parsed = raw && isJson ? JSON.parse(raw) : raw;

        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          throw new IntegrationHttpError(
            `HTTP ${response.status} on ${url}`,
            response.status === 401 || response.status === 403
              ? 'PROVIDER_AUTH'
              : response.status === 429
                ? 'PROVIDER_RATE_LIMIT'
                : response.status >= 500
                  ? 'PROVIDER_DOWN'
                  : 'PROVIDER_ERROR',
            response.status,
            retryable,
          );
        }

        IntegrationHttpClient.updateMetrics(
          IntegrationHttpClient.detectProviderFromUrl(url),
          true,
          Date.now() - startedAt,
        );
        return parsed as T;
      } catch (error) {
        lastError = error;
        IntegrationHttpClient.updateMetrics(
          IntegrationHttpClient.detectProviderFromUrl(url),
          false,
          Date.now() - startedAt,
        );
        const retryable =
          error instanceof IntegrationHttpError
            ? error.retryable
            : error instanceof Error && error.name === 'AbortError';
        const hasNextAttempt = attempt < retries;
        if (!retryable || !hasNextAttempt) break;
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      } finally {
        clearTimeout(timeout);
      }
    }

    if (lastError instanceof IntegrationHttpError) {
      throw lastError;
    }
    if (lastError instanceof Error && lastError.name === 'AbortError') {
      throw new IntegrationHttpError('Provider request timeout', 'PROVIDER_TIMEOUT', undefined, true);
    }
    throw new IntegrationHttpError(
      lastError instanceof Error ? lastError.message : 'Unknown provider error',
      'PROVIDER_ERROR',
      undefined,
      false,
    );
  }
}
