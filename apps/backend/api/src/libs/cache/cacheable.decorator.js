"use strict";
/**
 * Cache Decorator for NestJS Services
 * Automatically caches method results using Redis
 *
 * Usage:
 * @Cacheable({ type: 'product', ttl: 3600 })
 * async findOne(id: string) { ... }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_INVALIDATE_METADATA = exports.CACHEABLE_METADATA = void 0;
exports.Cacheable = Cacheable;
exports.CacheInvalidate = CacheInvalidate;
exports.defaultKeyGenerator = defaultKeyGenerator;
exports.generateCacheKey = generateCacheKey;
const common_1 = require("@nestjs/common");
exports.CACHEABLE_METADATA = 'cacheable';
exports.CACHE_INVALIDATE_METADATA = 'cache_invalidate';
/**
 * Decorator to cache method results automatically
 *
 * @example
 * ```typescript
 * @Cacheable({ type: 'product', ttl: 3600 })
 * async findOne(id: string) {
 *   return this.prisma.product.findUnique({ where: { id } });
 * }
 * ```
 */
function Cacheable(options = {}) {
    return (0, common_1.SetMetadata)(exports.CACHEABLE_METADATA, {
        type: options.type || 'api',
        ttl: options.ttl,
        keyGenerator: options.keyGenerator,
        tags: options.tags,
        skipIfNull: options.skipIfNull ?? true,
        cacheErrors: options.cacheErrors ?? false,
    });
}
/**
 * Decorator to invalidate cache when method is called
 *
 * @example
 * ```typescript
 * @CacheInvalidate({ type: 'product', pattern: 'product:*' })
 * async update(id: string, data: any) {
 *   return this.prisma.product.update({ where: { id }, data });
 * }
 * ```
 */
function CacheInvalidate(options = {}) {
    return (0, common_1.SetMetadata)(exports.CACHE_INVALIDATE_METADATA, {
        type: options.type || 'api',
        pattern: options.pattern,
        tags: options.tags,
    });
}
/**
 * Default key generator: methodName:arg1:arg2:...
 */
function defaultKeyGenerator(args, target, methodName) {
    const className = target.constructor.name;
    const serializedArgs = args
        .map(arg => {
        if (arg === null || arg === undefined)
            return 'null';
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg);
            }
            catch {
                return String(arg);
            }
        }
        return String(arg);
    })
        .join(':');
    return `${className}:${methodName}:${serializedArgs}`;
}
/**
 * Helper to generate cache key from method arguments
 */
function generateCacheKey(args, target, methodName, customGenerator) {
    if (customGenerator) {
        return customGenerator(args, target, methodName);
    }
    return defaultKeyGenerator(args, target, methodName);
}
