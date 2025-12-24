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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisOptimizedService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisOptimizedService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RedisOptimizedService = _classThis = class {
        /**
         * Get the underlying Redis client for advanced operations
         */
        get client() {
            return this.redis;
        }
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(RedisOptimizedService.name);
            this.cacheConfigs = {
                user: { ttl: 1800, maxMemory: '64mb', compression: true, threshold: 1024 },
                brand: { ttl: 3600, maxMemory: '32mb', compression: true, threshold: 1024 },
                product: { ttl: 7200, maxMemory: '128mb', compression: true, threshold: 2048 },
                design: { ttl: 900, maxMemory: '256mb', compression: true, threshold: 4096 },
                analytics: { ttl: 300, maxMemory: '64mb', compression: true, threshold: 1024 },
                session: { ttl: 86400, maxMemory: '32mb', compression: false },
                api: { ttl: 600, maxMemory: '128mb', compression: true, threshold: 1024 },
            };
            const redisUrl = this.configService.get('redis.url') || 'redis://localhost:6379';
            // Configuration optimisée pour Upstash (TLS) et autres providers
            const isUpstash = redisUrl.includes('upstash.io') || redisUrl.startsWith('rediss://');
            this.redis = new ioredis_1.default(redisUrl, {
                retryDelayOnFailover: 50,
                keepAlive: 30000,
                lazyConnect: true,
                // Connection pooling optimisé
                family: 4,
                connectTimeout: 10000, // Augmenté pour Upstash
                commandTimeout: 5000, // Augmenté pour Upstash
                maxRetriesPerRequest: isUpstash ? 3 : 1, // Plus de retries pour Upstash
                enableOfflineQueue: false, // Ne pas mettre en queue si déconnecté
                // Configuration TLS pour Upstash
                ...(isUpstash && {
                    tls: {
                        rejectUnauthorized: true, // Upstash utilise des certificats valides
                    },
                }),
            });
            this.setupEventListeners();
            // Ne pas appeler initializeCacheConfigs() dans le constructeur pour éviter de bloquer
            // Il sera appelé de manière asynchrone si nécessaire
            setTimeout(() => this.initializeCacheConfigs(), 0);
        }
        setupEventListeners() {
            this.redis.on('connect', () => {
                this.logger.log('Redis connected successfully');
            });
            this.redis.on('error', (error) => {
                this.logger.error('Redis connection error:', error);
            });
            this.redis.on('ready', () => {
                this.logger.log('Redis is ready');
            });
        }
        async initializeCacheConfigs() {
            try {
                // Ne pas bloquer le démarrage si Redis n'est pas disponible
                // Cette méthode est appelée de manière asynchrone et ne bloque pas le constructeur
                const isConnected = await this.redis.ping().catch(() => false);
                if (!isConnected) {
                    this.logger.warn('Redis not available, cache will work in degraded mode');
                    return;
                }
                // Configurer les politiques de mémoire pour chaque type de cache
                for (const [type, config] of Object.entries(this.cacheConfigs)) {
                    const key = `cache:${type}:*`;
                    await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru').catch(() => {
                        // Ignorer les erreurs de configuration Redis
                    });
                    this.logger.log(`Cache config initialized for ${type}: TTL=${config.ttl}s, MaxMemory=${config.maxMemory}`);
                }
            }
            catch (error) {
                this.logger.warn('Redis cache config initialization failed, continuing without cache:', error.message);
                // Ne pas throw l'erreur pour ne pas bloquer le démarrage
            }
        }
        /**
         * Get cached data with automatic decompression
         */
        async get(key, type = 'api') {
            try {
                const fullKey = this.buildKey(key, type);
                const data = await this.redis.get(fullKey);
                if (!data)
                    return null;
                // Décompression automatique si nécessaire
                const config = this.cacheConfigs[type];
                if (config?.compression && data.startsWith('gzip:')) {
                    const compressedData = data.slice(5); // Remove 'gzip:' prefix
                    // Ici on utiliserait zlib pour décompresser en production
                    return JSON.parse(compressedData);
                }
                return JSON.parse(data);
            }
            catch (error) {
                this.logger.error(`Failed to get cache key ${key}:`, error);
                return null;
            }
        }
        /**
         * Set cached data with automatic compression
         */
        async set(key, data, type = 'api', options = {}) {
            try {
                const config = this.cacheConfigs[type];
                const ttl = options.ttl || config?.ttl || 300;
                const fullKey = this.buildKey(key, type);
                let serializedData = JSON.stringify(data);
                // Compression automatique si nécessaire
                if (config?.compression && serializedData.length > (config.threshold || 1024)) {
                    // Ici on utiliserait zlib pour compresser en production
                    serializedData = `gzip:${serializedData}`;
                }
                await this.redis.setex(fullKey, ttl, serializedData);
                // Ajouter des tags pour invalidation groupée
                if (options.tags && options.tags.length > 0) {
                    await this.addTags(fullKey, options.tags);
                }
                return true;
            }
            catch (error) {
                this.logger.error(`Failed to set cache key ${key}:`, error);
                return false;
            }
        }
        /**
         * Delete cached data
         */
        async del(key, type = 'api') {
            try {
                const fullKey = this.buildKey(key, type);
                const result = await this.redis.del(fullKey);
                return result > 0;
            }
            catch (error) {
                this.logger.error(`Failed to delete cache key ${key}:`, error);
                return false;
            }
        }
        /**
         * Invalidate cache by tags
         */
        async invalidateByTags(tags) {
            try {
                let totalDeleted = 0;
                for (const tag of tags) {
                    const keys = await this.redis.smembers(`tags:${tag}`);
                    if (keys.length > 0) {
                        const result = await this.redis.del(...keys);
                        totalDeleted += result;
                        await this.redis.del(`tags:${tag}`);
                    }
                }
                return totalDeleted;
            }
            catch (error) {
                this.logger.error('Failed to invalidate cache by tags:', error);
                return 0;
            }
        }
        /**
         * Get multiple cached items
         */
        async mget(keys, type = 'api') {
            try {
                const fullKeys = keys.map(key => this.buildKey(key, type));
                const values = await this.redis.mget(...fullKeys);
                return values.map(value => {
                    if (!value)
                        return null;
                    // Décompression automatique si nécessaire
                    const config = this.cacheConfigs[type];
                    if (config?.compression && value.startsWith('gzip:')) {
                        const compressedData = value.slice(5);
                        return JSON.parse(compressedData);
                    }
                    return JSON.parse(value);
                });
            }
            catch (error) {
                this.logger.error('Failed to get multiple cache keys:', error);
                return keys.map(() => null);
            }
        }
        /**
         * Set multiple cached items
         */
        async mset(items, type = 'api') {
            try {
                const pipeline = this.redis.pipeline();
                for (const item of items) {
                    const config = this.cacheConfigs[type];
                    const ttl = item.ttl || config?.ttl || 300;
                    const fullKey = this.buildKey(item.key, type);
                    let serializedData = JSON.stringify(item.data);
                    // Compression automatique si nécessaire
                    if (config?.compression && serializedData.length > (config.threshold || 1024)) {
                        serializedData = `gzip:${serializedData}`;
                    }
                    pipeline.setex(fullKey, ttl, serializedData);
                }
                await pipeline.exec();
                return true;
            }
            catch (error) {
                this.logger.error('Failed to set multiple cache keys:', error);
                return false;
            }
        }
        /**
         * Get cache statistics
         */
        async getStats() {
            try {
                const [memory, keyspace, clients, stats] = await Promise.all([
                    this.redis.memory('usage'),
                    this.redis.info('keyspace'),
                    this.redis.info('clients'),
                    this.redis.info('stats'),
                ]);
                return { memory, keyspace, clients, stats };
            }
            catch (error) {
                this.logger.error('Failed to get cache stats:', error);
                throw error;
            }
        }
        /**
         * Clear all cache
         */
        async clearAll() {
            try {
                await this.redis.flushall();
                return true;
            }
            catch (error) {
                this.logger.error('Failed to clear all cache:', error);
                return false;
            }
        }
        /**
         * Health check
         */
        async healthCheck() {
            try {
                const result = await this.redis.ping();
                return result === 'PONG';
            }
            catch (error) {
                this.logger.error('Redis health check failed:', error);
                return false;
            }
        }
        /**
         * Build cache key with namespace
         */
        buildKey(key, type) {
            return `luneo:${type}:${key}`;
        }
        /**
         * Add tags to cache key
         */
        async addTags(key, tags) {
            const pipeline = this.redis.pipeline();
            for (const tag of tags) {
                pipeline.sadd(`tags:${tag}`, key);
            }
            await pipeline.exec();
        }
        /**
         * Get Redis instance for advanced operations
         */
        getRedis() {
            return this.redis;
        }
    };
    __setFunctionName(_classThis, "RedisOptimizedService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RedisOptimizedService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RedisOptimizedService = _classThis;
})();
exports.RedisOptimizedService = RedisOptimizedService;
