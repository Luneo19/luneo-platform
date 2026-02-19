import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Centralised configuration for the PCE module.
 * Reads from environment / NestJS config and provides defaults.
 */
@Injectable()
export class PCEConfigService {
  constructor(private readonly config: ConfigService) {}

  get isEnabled(): boolean {
    return this.config.get<string>('PCE_ENABLED', 'true') === 'true';
  }

  get autoProcessOnPayment(): boolean {
    return this.config.get<string>('PCE_AUTO_PROCESS_ON_PAYMENT', 'true') === 'true';
  }

  get maxRetries(): number {
    return this.config.get<number>('PCE_MAX_RETRIES', 3);
  }

  get retryDelayMs(): number {
    return this.config.get<number>('PCE_RETRY_DELAY_MS', 60_000);
  }

  get qualityCheckThresholdCents(): number {
    return this.config.get<number>('PCE_QUALITY_CHECK_THRESHOLD_CENTS', 10_000);
  }

  get pipelineRefreshIntervalMs(): number {
    return this.config.get<number>('PCE_PIPELINE_REFRESH_MS', 5_000);
  }

  get dashboardRefreshIntervalMs(): number {
    return this.config.get<number>('PCE_DASHBOARD_REFRESH_MS', 30_000);
  }
}
