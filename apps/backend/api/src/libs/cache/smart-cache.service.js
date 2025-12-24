"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartCacheService = void 0;
const common_1 = require("@nestjs/common");
let SmartCacheService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SmartCacheService = _classThis = class {
        constructor(redisService, prismaService) {
            this.redisService = redisService;
            this.prismaService = prismaService;
            this.logger = new common_1.Logger(SmartCacheService.name);
            this.strategies = {
                user: { ttl: 1800, refreshThreshold: 0.8, maxRetries: 3, fallbackToCache: true },
                brand: { ttl: 3600, refreshThreshold: 0.7, maxRetries: 3, fallbackToCache: true },
                product: { ttl: 7200, refreshThreshold: 0.6, maxRetries: 2, fallbackToCache: true },
                design: { ttl: 900, refreshThreshold: 0.9, maxRetries: 5, fallbackToCache: false },
                analytics: { ttl: 300, refreshThreshold: 0.5, maxRetries: 2, fallbackToCache: true },
                session: { ttl: 86400, refreshThreshold: 0.9, maxRetries: 3, fallbackToCache: true },
            };
        }
        /**
         * Smart cache with automatic refresh and fallback
         */
        async get(key, type, fetchFn, options = {}) {
            const strategy = this.strategies[type] || this.strategies.api;
            const cacheKey = `${type}:${key}`;
            try {
                // Essayer de récupérer depuis le cache
                const cached = await this.redisService.get(cacheKey, type);
                if (cached) {
                    const now = Date.now();
                    const age = (now - cached.timestamp) / 1000;
                    const remainingTtl = cached.ttl - age;
                    // Si le cache est encore valide
                    if (remainingTtl > 0) {
                        // Vérifier si on doit pré-charger (refresh en arrière-plan)
                        const shouldRefresh = remainingTtl < (cached.ttl * strategy.refreshThreshold);
                        if (shouldRefresh) {
                            // Refresh en arrière-plan sans bloquer
                            this.refreshInBackground(cacheKey, type, fetchFn, options, strategy);
                        }
                        return cached.data;
                    }
                }
                // Cache expiré ou inexistant, récupérer les données
                return await this.fetchAndCache(cacheKey, type, fetchFn, options, strategy);
            }
            catch (error) {
                this.logger.error(`Smart cache error for key ${cacheKey}:`, error);
                // Fallback vers le cache même expiré si configuré
                if (strategy.fallbackToCache) {
                    const staleCache = await this.redisService.get(cacheKey, type);
                    if (staleCache) {
                        this.logger.warn(`Using stale cache for key ${cacheKey}`);
                        return staleCache.data;
                    }
                }
                return null;
            }
        }
        /**
         * Invalide tous les caches avec les tags spécifiés
         */
        async invalidateTags(tags) {
            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                const keys = await this.redisService.get(tagKey, 'cache') || [];
                // Delete all keys with this tag
                await Promise.all(keys.map(key => this.redisService.del(key, 'cache')));
                // Delete tag key itself
                await this.redisService.del(tagKey, 'cache');
            }
        }
        /**
         * Set avec invalidation intelligente et tags
         */
        async set(key, type, data, options = {}) {
            const strategy = this.strategies[type] || this.strategies.api;
            const cacheKey = `${type}:${key}`;
            const ttl = options.ttl || strategy.ttl;
            const cacheData = {
                data,
                timestamp: Date.now(),
                ttl
            };
            try {
                const result = await this.redisService.set(cacheKey, cacheData, type, { ttl });
                // Store tags if provided
                if (options.tags && options.tags.length > 0) {
                    for (const tag of options.tags) {
                        const tagKey = `tag:${tag}`;
                        const keys = await this.redisService.get(tagKey, 'cache') || [];
                        if (!keys.includes(cacheKey)) {
                            keys.push(cacheKey);
                            await this.redisService.set(tagKey, keys, 'cache', { ttl: ttl * 2 }); // Tags expire later
                        }
                    }
                }
                return result;
            }
            catch (error) {
                this.logger.error(`Smart cache set error for key ${cacheKey}:`, error);
                return false;
            }
        }
        /**
         * Invalidation par patterns
         */
        async invalidate(pattern, type) {
            try {
                const cacheKey = `${type}:${pattern}`;
                return await this.redisService.invalidateByTags([cacheKey]);
            }
            catch (error) {
                this.logger.error(`Smart cache invalidation error for pattern ${pattern}:`, error);
                return 0;
            }
        }
        /**
         * Invalidation par tags
         */
        async invalidateByTags(tags) {
            try {
                return await this.redisService.invalidateByTags(tags);
            }
            catch (error) {
                this.logger.error(`Smart cache invalidation error for tags ${tags.join(', ')}:`, error);
                return 0;
            }
        }
        /**
         * Pré-chargement intelligent
         */
        async preload(keys, type, fetchFn, options = {}) {
            const strategy = this.strategies[type] || this.strategies.api;
            try {
                const promises = keys.map(async (key) => {
                    const cacheKey = `${type}:${key}`;
                    // Vérifier si déjà en cache
                    const existing = await this.redisService.get(cacheKey, type);
                    if (existing)
                        return;
                    // Pré-charger
                    try {
                        const data = await fetchFn(key);
                        await this.set(key, type, data, options);
                    }
                    catch (error) {
                        this.logger.warn(`Preload failed for key ${key}:`, error);
                    }
                });
                await Promise.allSettled(promises);
            }
            catch (error) {
                this.logger.error('Smart cache preload error:', error);
            }
        }
        /**
         * Cache warming pour les données critiques
         */
        async warmup() {
            this.logger.log('Starting cache warmup...');
            try {
                // Récupérer les brands les plus actives
                const activeBrands = await this.prismaService.brand.findMany({
                    select: { id: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                });
                // Pré-charger les données pour chaque brand
                for (const brand of activeBrands) {
                    await Promise.allSettled([
                        this.preload([brand.id], 'brand', async (id) => this.prismaService.brand.findUnique({ where: { id } })),
                        this.preload([brand.id], 'analytics', async (id) => this.prismaService.getDashboardMetrics(id))
                    ]);
                }
                this.logger.log('Cache warmup completed');
            }
            catch (error) {
                this.logger.error('Cache warmup failed:', error);
            }
        }
        /**
         * Méthode simple get pour compatibilité
         */
        async getSimple(key) {
            try {
                const cached = await this.redisService.get(key, 'default');
                return cached?.data || null;
            }
            catch (error) {
                this.logger.error(`Error getting cache key ${key}:`, error);
                return null;
            }
        }
        /**
         * Méthode simple set pour compatibilité
         */
        async setSimple(key, data, ttl) {
            try {
                const cacheData = {
                    data,
                    timestamp: Date.now(),
                    ttl: ttl || 3600
                };
                return await this.redisService.set(key, cacheData, 'default', { ttl: ttl || 3600 });
            }
            catch (error) {
                this.logger.error(`Error setting cache key ${key}:`, error);
                return false;
            }
        }
        /**
         * Méthode simple del pour compatibilité
         */
        async delSimple(key) {
            try {
                return await this.redisService.del(key, 'default');
            }
            catch (error) {
                this.logger.error(`Error deleting cache key ${key}:`, error);
                return false;
            }
        }
        /**
         * Méthode getOrSet pour compatibilité
         */
        async getOrSet(key, fetchFn, ttl = 3600) {
            const cached = await this.getSimple(key);
            if (cached !== null) {
                return cached;
            }
            const data = await fetchFn();
            await this.setSimple(key, data, ttl);
            return data;
        }
        /**
         * Statistiques de cache
         */
        async getCacheStats() {
            try {
                const stats = await this.redisService.getStats();
                // Calculer le hit rate (approximatif)
                const totalCommands = parseInt(stats.stats.match(/keyspace_hits:(\d+)/)?.[1] || '0') +
                    parseInt(stats.stats.match(/keyspace_misses:(\d+)/)?.[1] || '0');
                const hits = parseInt(stats.stats.match(/keyspace_hits:(\d+)/)?.[1] || '0');
                const hitRate = totalCommands > 0 ? (hits / totalCommands) * 100 : 0;
                return {
                    hitRate: Math.round(hitRate * 100) / 100,
                    memoryUsage: (stats.memory || {}),
                    keyCounts: this.extractKeyCounts(stats.keyspace)
                };
            }
            catch (error) {
                this.logger.error('Failed to get cache stats:', error);
                return { hitRate: 0, memoryUsage: {}, keyCounts: {} };
            }
        }
        /**
         * Refresh en arrière-plan
         */
        async refreshInBackground(cacheKey, type, fetchFn, options, strategy) {
            try {
                const data = await fetchFn();
                await this.set(cacheKey.replace(`${type}:`, ''), type, data, options);
                this.logger.debug(`Background refresh completed for key ${cacheKey}`);
            }
            catch (error) {
                this.logger.warn(`Background refresh failed for key ${cacheKey}:`, error);
            }
        }
        /**
         * Fetch et cache avec retry
         */
        async fetchAndCache(cacheKey, type, fetchFn, options, strategy) {
            let lastError = null;
            for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
                try {
                    const data = await fetchFn();
                    // Mettre en cache
                    await this.set(cacheKey.replace(`${type}:`, ''), type, data, options);
                    return data;
                }
                catch (error) {
                    lastError = error;
                    this.logger.warn(`Fetch attempt ${attempt} failed for key ${cacheKey}:`, error);
                    if (attempt < strategy.maxRetries) {
                        // Attendre avant de réessayer (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    }
                }
            }
            throw lastError;
        }
        /**
         * Invalider les caches liés
         */
        async invalidateRelatedCaches(tags) {
            try {
                for (const tag of tags) {
                    await this.redisService.invalidateByTags([tag]);
                }
            }
            catch (error) {
                this.logger.error('Failed to invalidate related caches:', error);
            }
        }
        /**
         * Extraire les compteurs de clés
         */
        extractKeyCounts(keyspace) {
            const counts = {};
            const matches = keyspace.match(/db\d+:keys=(\d+)/g);
            if (matches) {
                matches.forEach(match => {
                    const [db, count] = match.split('=');
                    counts[db] = parseInt(count);
                });
            }
            return counts;
        }
    };
    __setFunctionName(_classThis, "SmartCacheService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SmartCacheService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SmartCacheService = _classThis;
})();
exports.SmartCacheService = SmartCacheService;
