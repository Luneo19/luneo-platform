import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { CircuitBreakerInitService } from './circuit-breaker-init.service';

@Global()
@Module({
  providers: [CircuitBreakerService, RetryService, CircuitBreakerInitService],
  exports: [CircuitBreakerService, RetryService],
})
export class ResilienceModule {}
