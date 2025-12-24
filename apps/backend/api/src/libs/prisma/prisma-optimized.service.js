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
exports.PrismaOptimizedService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaOptimizedService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = client_1.PrismaClient;
    var PrismaOptimizedService = _classThis = class extends _classSuper {
        constructor(redisService) {
            super({
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL,
                    },
                },
                log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
                errorFormat: 'pretty',
            });
            this.redisService = redisService;
            this.logger = new common_1.Logger(PrismaOptimizedService.name);
        }
        async onModuleInit() {
            await this.$connect();
            this.logger.log('Prisma connected to database');
        }
        async onModuleDestroy() {
            await this.$disconnect();
            this.logger.log('Prisma disconnected from database');
        }
        /**
         * Find many with cache
         */
        async findManyWithCache(model, args, cacheKey, cacheType = 'api', ttl) {
            try {
                // Essayer de récupérer depuis le cache
                const cached = await this.redisService.get(cacheKey, cacheType);
                if (cached) {
                    this.logger.debug(`Cache hit for key: ${cacheKey}`);
                    return cached;
                }
                // Si pas en cache, exécuter la requête
                this.logger.debug(`Cache miss for key: ${cacheKey}, executing query`);
                const result = await model.findMany(args);
                // Mettre en cache le résultat
                await this.redisService.set(cacheKey, result, cacheType, { ttl });
                return result;
            }
            catch (error) {
                this.logger.error(`Error in findManyWithCache for key ${cacheKey}:`, error);
                throw error;
            }
        }
        /**
         * Find unique with cache
         */
        async findUniqueWithCache(model, args, cacheKey, cacheType = 'api', ttl) {
            try {
                // Essayer de récupérer depuis le cache
                const cached = await this.redisService.get(cacheKey, cacheType);
                if (cached) {
                    this.logger.debug(`Cache hit for key: ${cacheKey}`);
                    return cached;
                }
                // Si pas en cache, exécuter la requête
                this.logger.debug(`Cache miss for key: ${cacheKey}, executing query`);
                const result = await model.findUnique(args);
                // Mettre en cache le résultat (même si null)
                await this.redisService.set(cacheKey, result, cacheType, { ttl });
                return result;
            }
            catch (error) {
                this.logger.error(`Error in findUniqueWithCache for key ${cacheKey}:`, error);
                throw error;
            }
        }
        /**
         * Count with cache
         */
        async countWithCache(model, args, cacheKey, cacheType = 'api', ttl) {
            try {
                // Essayer de récupérer depuis le cache
                const cached = await this.redisService.get(cacheKey, cacheType);
                if (cached !== null) {
                    this.logger.debug(`Cache hit for count key: ${cacheKey}`);
                    return cached;
                }
                // Si pas en cache, exécuter la requête
                this.logger.debug(`Cache miss for count key: ${cacheKey}, executing query`);
                const result = await model.count(args);
                // Mettre en cache le résultat
                await this.redisService.set(cacheKey, result, cacheType, { ttl });
                return result;
            }
            catch (error) {
                this.logger.error(`Error in countWithCache for key ${cacheKey}:`, error);
                throw error;
            }
        }
        /**
         * Aggregation with cache
         */
        async aggregateWithCache(model, args, cacheKey, cacheType = 'analytics', ttl) {
            try {
                // Essayer de récupérer depuis le cache
                const cached = await this.redisService.get(cacheKey, cacheType);
                if (cached) {
                    this.logger.debug(`Cache hit for aggregate key: ${cacheKey}`);
                    return cached;
                }
                // Si pas en cache, exécuter la requête
                this.logger.debug(`Cache miss for aggregate key: ${cacheKey}, executing query`);
                const result = await model.aggregate(args);
                // Mettre en cache le résultat
                await this.redisService.set(cacheKey, result, cacheType, { ttl });
                return result;
            }
            catch (error) {
                this.logger.error(`Error in aggregateWithCache for key ${cacheKey}:`, error);
                throw error;
            }
        }
        /**
         * Invalidate cache after write operations
         */
        async invalidateCachePattern(pattern) {
            try {
                await this.redisService.invalidateByTags([pattern]);
                this.logger.debug(`Cache invalidated for pattern: ${pattern}`);
            }
            catch (error) {
                this.logger.error(`Error invalidating cache pattern ${pattern}:`, error);
            }
        }
        /**
         * Transaction with cache invalidation
         */
        async transactionWithCacheInvalidation(fn, invalidatePatterns = []) {
            const result = await this.$transaction(fn);
            // Invalider le cache après la transaction
            for (const pattern of invalidatePatterns) {
                await this.invalidateCachePattern(pattern);
            }
            return result;
        }
        /**
         * Optimized query for dashboard metrics
         */
        async getDashboardMetrics(brandId) {
            const cacheKey = `dashboard:metrics:${brandId}`;
            try {
                const cached = await this.redisService.get(cacheKey, 'analytics');
                if (cached) {
                    return cached;
                }
                const [designsCount, ordersCount, revenue, usersCount] = await Promise.all([
                    this.design.count({ where: { brandId } }),
                    this.order.count({
                        where: {
                            brandId,
                            status: { in: ['PAID', 'DELIVERED'] }
                        }
                    }),
                    this.order.aggregate({
                        where: {
                            brandId,
                            status: { in: ['PAID', 'DELIVERED'] }
                        },
                        _sum: { totalCents: true }
                    }),
                    this.user.count({ where: { brandId } })
                ]);
                const metrics = {
                    designsCount,
                    ordersCount,
                    revenue: revenue._sum.totalCents || 0,
                    usersCount,
                    lastUpdated: new Date().toISOString()
                };
                // Cache pour 5 minutes
                await this.redisService.set(cacheKey, metrics, 'analytics', { ttl: 300 });
                return metrics;
            }
            catch (error) {
                this.logger.error('Error getting dashboard metrics:', error);
                throw error;
            }
        }
        /**
         * Optimized query for products with pagination and filters
         */
        async getProductsOptimized(brandId, page = 1, limit = 20, filters = {}) {
            const cacheKey = `products:${brandId}:${page}:${limit}:${JSON.stringify(filters)}`;
            try {
                const cached = await this.redisService.get(cacheKey, 'product');
                if (cached) {
                    return cached;
                }
                const skip = (page - 1) * limit;
                const [products, total] = await Promise.all([
                    this.product.findMany({
                        where: {
                            brandId,
                            ...filters
                        },
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            currency: true,
                            images: true,
                            isActive: true,
                            createdAt: true,
                            _count: {
                                select: {
                                    designs: true,
                                    orders: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: limit
                    }),
                    this.product.count({
                        where: {
                            brandId,
                            ...filters
                        }
                    })
                ]);
                const result = {
                    products,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                };
                // Cache pour 2 heures
                await this.redisService.set(cacheKey, result, 'product', { ttl: 7200 });
                return result;
            }
            catch (error) {
                this.logger.error('Error getting optimized products:', error);
                throw error;
            }
        }
        /**
         * Health check
         */
        async healthCheck() {
            const start = Date.now();
            try {
                await this.$queryRaw `SELECT 1`;
                const latency = Date.now() - start;
                return {
                    status: 'healthy',
                    latency
                };
            }
            catch (error) {
                this.logger.error('Database health check failed:', error);
                return {
                    status: 'unhealthy',
                    latency: Date.now() - start
                };
            }
        }
    };
    __setFunctionName(_classThis, "PrismaOptimizedService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PrismaOptimizedService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PrismaOptimizedService = _classThis;
})();
exports.PrismaOptimizedService = PrismaOptimizedService;
