import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get API key from request (set by ApiKeyGuard)
    const apiKey = request['apiKey'];
    if (!apiKey) {
      return true; // Let ApiKeyGuard handle authentication
    }

    // Get rate limit configuration from API key
    const config = this.rateLimitService.getConfigForApiKey(apiKey);
    
    // Use API key ID as identifier
    const identifier = apiKey.id;

    // Check rate limit
    const result = await this.rateLimitService.checkRateLimit(identifier, config);

    if (!result.allowed) {
      // Add rate limit headers
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', config.requestsPerMinute);
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));
      response.setHeader('Retry-After', Math.floor((result.resetTime - Date.now()) / 1000));

      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Add rate limit headers to successful response
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.requestsPerMinute);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));

    return true;
  }
}
