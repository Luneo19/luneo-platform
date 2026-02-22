import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CONFIGURATOR_3D_RATE_LIMITS,
  type Configurator3DRateLimitKey,
} from '../configurator-3d.constants';

/**
 * Decorator that applies configurator-specific rate limits.
 * Uses CONFIGURATOR_3D_RATE_LIMITS for the given key (requests per minute).
 */
export function ConfiguratorRateLimit(key: Configurator3DRateLimitKey) {
  const limit = CONFIGURATOR_3D_RATE_LIMITS[key];
  return applyDecorators(
    Throttle({
      default: {
        limit,
        ttl: 60_000, // 1 minute
      },
    }),
  );
}
