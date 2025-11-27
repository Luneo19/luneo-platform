/**
 * Cache Module - Exports centralisés
 */

// Cache général Redis
export {
  cacheService,
  cacheKeys,
  cacheTTL,
} from './redis';

// Cache spécialisé APIs publiques
export {
  publicApiCache,
  PUBLIC_CACHE_TTL,
  CACHE_PREFIX,
  marketingCacheKey,
  solutionCacheKey,
  industryCacheKey,
  integrationCacheKey,
  pricingCacheKey,
  blogCacheKey,
  withPublicApiCache,
} from './public-api-cache';

// Re-export redis-cache pour backwards compatibility
export {
  CACHE_TTL,
  getCache,
  setCache,
  delCache,
  delCachePattern,
  userCacheKey,
  cacheWrapper,
  invalidateUserCache,
} from '../redis-cache';

