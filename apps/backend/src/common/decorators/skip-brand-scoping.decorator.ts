import { SetMetadata } from '@nestjs/common';
import { SKIP_BRAND_SCOPING_KEY } from '../guards/brand-scoped.guard';

/**
 * Decorator to explicitly skip brand scoping on a route or controller.
 * Use sparingly - only for routes that genuinely need cross-brand access
 * (e.g., health checks, shared resources, consumer-facing storefront).
 * 
 * @example
 * ```typescript
 * @SkipBrandScoping()
 * @Get('health')
 * async healthCheck() { ... }
 * ```
 */
export const SkipBrandScoping = () => SetMetadata(SKIP_BRAND_SCOPING_KEY, true);
