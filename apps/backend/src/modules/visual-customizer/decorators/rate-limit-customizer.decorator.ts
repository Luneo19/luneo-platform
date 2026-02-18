import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { VISUAL_CUSTOMIZER_RATE_LIMITS } from '../visual-customizer.constants';

type RateLimitKey = keyof typeof VISUAL_CUSTOMIZER_RATE_LIMITS;

/**
 * Decorator to apply customizer-specific rate limiting
 * Usage: @CustomizerRateLimit('PUBLIC_SESSION_CREATE')
 */
export const CustomizerRateLimit = (key: RateLimitKey) => {
  const limitConfig = VISUAL_CUSTOMIZER_RATE_LIMITS[key];
  if (!limitConfig) {
    throw new Error(`Rate limit key '${key}' not found in VISUAL_CUSTOMIZER_RATE_LIMITS`);
  }

  return applyDecorators(
    Throttle({
      default: {
        limit: limitConfig.limit,
        ttl: limitConfig.ttl * 1000, // Convert seconds to milliseconds
      },
    }),
  );
};
