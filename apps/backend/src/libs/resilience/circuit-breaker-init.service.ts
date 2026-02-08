import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';

/**
 * Initializes circuit breaker configurations for all third-party services.
 * Runs on module init to ensure circuits are configured before first use.
 */
@Injectable()
export class CircuitBreakerInitService implements OnModuleInit {
  private readonly logger = new Logger(CircuitBreakerInitService.name);

  constructor(private readonly circuitBreaker: CircuitBreakerService) {}

  onModuleInit() {
    // Stripe - already used via StripeClientService, configure as fallback
    this.circuitBreaker.configure('stripe', {
      failureThreshold: 5,
      recoveryTimeout: 30000,   // 30s
      monitoringWindow: 60000,  // 1 min
      halfOpenMaxCalls: 2,
    });

    // Cloudinary - image upload/transformation
    this.circuitBreaker.configure('cloudinary', {
      failureThreshold: 3,
      recoveryTimeout: 20000,   // 20s
      monitoringWindow: 60000,  // 1 min
      halfOpenMaxCalls: 2,
    });

    // SendGrid/Mailgun - email sending
    this.circuitBreaker.configure('email', {
      failureThreshold: 5,
      recoveryTimeout: 60000,   // 1 min (email can be retried later)
      monitoringWindow: 120000, // 2 min
      halfOpenMaxCalls: 2,
    });

    // OpenAI - AI operations
    this.circuitBreaker.configure('openai', {
      failureThreshold: 3,
      recoveryTimeout: 45000,   // 45s
      monitoringWindow: 90000,  // 1.5 min
      halfOpenMaxCalls: 1,
    });

    // Replicate - AI model inference
    this.circuitBreaker.configure('replicate', {
      failureThreshold: 3,
      recoveryTimeout: 45000,   // 45s
      monitoringWindow: 90000,  // 1.5 min
      halfOpenMaxCalls: 1,
    });

    this.logger.log('Circuit breakers configured for: stripe, cloudinary, email, openai, replicate');
  }
}
