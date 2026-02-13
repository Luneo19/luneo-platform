/**
 * StripeClientService
 * Centralizes Stripe SDK initialization, lazy loading, and resilience (circuit breaker + retry).
 * All other billing services should use this service to get a Stripe instance.
 */
import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '@/libs/resilience/circuit-breaker.service';
import { RetryService } from '@/libs/resilience/retry.service';
import type Stripe from 'stripe';

/** Validated price IDs for each plan/interval */
export interface ValidatedPriceIds {
  starter: { monthly: string; yearly: string };
  professional: { monthly: string; yearly: string };
  business: { monthly: string; yearly: string };
  enterprise: { monthly: string; yearly: string };
}

const STRIPE_SERVICE = 'stripe-api';

@Injectable()
export class StripeClientService implements OnModuleInit {
  private readonly logger = new Logger(StripeClientService.name);
  private stripeInstance: Stripe | null = null;
  private stripeModule: typeof import('stripe') | null = null;
  private _validatedPriceIds: ValidatedPriceIds | null = null;
  private _stripeConfigValid = false;

  constructor(
    private configService: ConfigService,
    private circuitBreaker: CircuitBreakerService,
    private retryService: RetryService,
  ) {
    this.circuitBreaker.configure(STRIPE_SERVICE, {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringWindow: 60000,
      halfOpenMaxCalls: 3,
    });
  }

  get stripeConfigValid(): boolean {
    return this._stripeConfigValid;
  }

  get validatedPriceIds(): ValidatedPriceIds | null {
    return this._validatedPriceIds;
  }

  /**
   * Validate Stripe configuration at startup
   */
  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || 'development';

    this.logger.log('Validating Stripe configuration...');

    try {
      const secretKey = this.configService.get<string>('stripe.secretKey');
      if (!secretKey) {
        if (nodeEnv === 'production') {
          this.logger.error('STRIPE_SECRET_KEY is required in production');
          throw new InternalServerErrorException('STRIPE_SECRET_KEY is required');
        }
        this.logger.warn('STRIPE_SECRET_KEY not configured — Stripe features disabled');
        return;
      }

      const priceIds = {
        starter: {
          monthly: this.configService.get<string>('stripe.priceStarterMonthly'),
          yearly: this.configService.get<string>('stripe.priceStarterYearly'),
        },
        professional: {
          monthly: this.configService.get<string>('stripe.priceProMonthly'),
          yearly: this.configService.get<string>('stripe.priceProYearly'),
        },
        business: {
          monthly: this.configService.get<string>('stripe.priceBusinessMonthly'),
          yearly: this.configService.get<string>('stripe.priceBusinessYearly'),
        },
        enterprise: {
          monthly: this.configService.get<string>('stripe.priceEnterpriseMonthly'),
          yearly: this.configService.get<string>('stripe.priceEnterpriseYearly'),
        },
      };

      const missingIds: string[] = [];
      for (const [plan, intervals] of Object.entries(priceIds)) {
        if (!intervals.monthly) missingIds.push(`stripe.price${plan.charAt(0).toUpperCase() + plan.slice(1)}Monthly`);
        if (!intervals.yearly) missingIds.push(`stripe.price${plan.charAt(0).toUpperCase() + plan.slice(1)}Yearly`);
      }

      if (missingIds.length > 0) {
        if (nodeEnv === 'production') {
          this.logger.error(`Missing Stripe Price IDs: ${missingIds.join(', ')}`);
          throw new InternalServerErrorException(`Missing Stripe Price IDs: ${missingIds.join(', ')}`);
        }
        this.logger.warn(`Missing Stripe Price IDs (using test fallbacks): ${missingIds.join(', ')}`);
      }

      if (nodeEnv === 'production') {
        let validationSuccessful = true;
        try {
          const stripe = await this.getStripe();
          for (const [plan, intervals] of Object.entries(priceIds)) {
            for (const [interval, priceId] of Object.entries(intervals)) {
              if (priceId) {
                try {
                  const price = await stripe.prices.retrieve(priceId);
                  if (!price.active) {
                    this.logger.warn(`Stripe Price ID ${priceId} (${plan}/${interval}) is inactive`);
                  }
                  this.logger.debug(`Validated ${plan}/${interval}: ${priceId}`);
                } catch (error: unknown) {
                  const msg = error instanceof Error ? error.message : String(error);
                  this.logger.error(`Invalid Stripe Price ID: ${priceId} (${plan}/${interval}) — ${msg}`);
                  validationSuccessful = false;
                }
              }
            }
          }

          if (validationSuccessful) {
            this._validatedPriceIds = priceIds as ValidatedPriceIds;
            this.logger.log('All Stripe Price IDs validated successfully');
            this._stripeConfigValid = true;
          } else {
            this.logger.warn('Some Stripe Price IDs are invalid — billing features may be limited');
            this._stripeConfigValid = false;
          }
        } catch (stripeError: unknown) {
          const msg = stripeError instanceof Error ? stripeError.message : String(stripeError);
          this.logger.error(`Stripe API error during validation: ${msg}`);
          this.logger.warn('App starting in degraded mode — billing features unavailable');
          this._stripeConfigValid = false;
        }
      } else {
        this._stripeConfigValid = true;
        this.logger.log('Stripe configuration validated (non-production mode)');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stripe configuration validation failed: ${msg}`);
      this.logger.warn('App starting in degraded mode — billing features unavailable');
      this._stripeConfigValid = false;
    }
  }

  /**
   * Lazy-load the Stripe SDK instance
   */
  async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      if (!this.stripeModule) {
        this.stripeModule = await import('stripe');
      }
      const secretKey = this.configService.get<string>('stripe.secretKey');
      if (!secretKey) {
        throw new InternalServerErrorException('STRIPE_SECRET_KEY is not configured');
      }
      this.stripeInstance = new this.stripeModule.default(secretKey, {
        apiVersion: '2023-10-16',
      });
    }
    return this.stripeInstance;
  }

  /**
   * Execute a Stripe operation with circuit-breaker + exponential-backoff retry
   */
  async executeWithResilience<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: { maxRetries?: number; skipCircuitBreaker?: boolean },
  ): Promise<T> {
    const executeWithRetry = () =>
      this.retryService.execute(
        operation,
        {
          maxAttempts: options?.maxRetries ?? 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          exponentialBackoff: true,
          retryableErrors: RetryService.isRetryableStripeError,
        },
        operationName,
      );

    if (options?.skipCircuitBreaker) {
      return executeWithRetry();
    }

    return this.circuitBreaker.execute(STRIPE_SERVICE, executeWithRetry, undefined);
  }

  /**
   * Get circuit breaker status (for monitoring)
   */
  getCircuitStatus() {
    return this.circuitBreaker.getStatus(STRIPE_SERVICE);
  }
}
