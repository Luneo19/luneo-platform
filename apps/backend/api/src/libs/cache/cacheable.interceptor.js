"use strict";
/**
 * Cache Interceptor for NestJS
 * Automatically intercepts methods decorated with @Cacheable
 * and caches their results
 */
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
exports.CacheableInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const cacheable_decorator_1 = require("./cacheable.decorator");
let CacheableInterceptor = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CacheableInterceptor = _classThis = class {
        constructor(cache, reflector) {
            this.cache = cache;
            this.reflector = reflector;
            this.logger = new common_1.Logger(CacheableInterceptor.name);
        }
        async intercept(context, next) {
            const handler = context.getHandler();
            const target = context.getClass();
            const args = context.getArgs();
            // Check for @Cacheable decorator
            const cacheableOptions = this.reflector.get(cacheable_decorator_1.CACHEABLE_METADATA, handler);
            // Check for @CacheInvalidate decorator
            const invalidateOptions = this.reflector.get(cacheable_decorator_1.CACHE_INVALIDATE_METADATA, handler);
            // Handle cache invalidation first
            if (invalidateOptions) {
                await this.handleInvalidation(invalidateOptions, args, target, handler.name);
            }
            // Handle caching
            if (cacheableOptions) {
                return this.handleCache(cacheableOptions, args, target, handler.name, next);
            }
            // No caching, proceed normally
            return next.handle();
        }
        async handleInvalidation(options, args, target, methodName) {
            try {
                const cacheType = options.type || 'api';
                // Invalidate by pattern
                if (options.pattern) {
                    const pattern = typeof options.pattern === 'function'
                        ? options.pattern(args, target, methodName)
                        : options.pattern;
                    await this.cache.invalidate(pattern, cacheType);
                    this.logger.debug(`Cache invalidated: ${pattern}`);
                }
                // Invalidate by tags
                if (options.tags) {
                    const tags = typeof options.tags === 'function'
                        ? options.tags(args, target, methodName)
                        : options.tags;
                    // Use invalidateByTags if available, otherwise fallback to invalidate
                    if (typeof this.cache.invalidateByTags === 'function') {
                        await this.cache.invalidateByTags(tags);
                    }
                    else {
                        for (const tag of tags) {
                            await this.cache.invalidate(tag, cacheType);
                        }
                    }
                    this.logger.debug(`Cache invalidated by tags: ${tags.join(', ')}`);
                }
            }
            catch (error) {
                this.logger.error('Cache invalidation error:', error);
                // Don't throw, continue execution
            }
        }
        handleCache(options, args, target, methodName, next) {
            const cacheType = options.type || 'api';
            const cacheKey = (0, cacheable_decorator_1.generateCacheKey)(args, target, methodName, options.keyGenerator);
            // Try to get from cache
            return new rxjs_1.Observable((observer) => {
                this.cache
                    .get(cacheKey, cacheType, async () => {
                    // Cache miss, execute method
                    return new Promise((resolve, reject) => {
                        next
                            .handle()
                            .pipe((0, operators_1.tap)({
                            next: (data) => {
                                // Skip caching if null/undefined and option is set
                                if (options.skipIfNull && (data === null || data === undefined)) {
                                    resolve(data);
                                    return;
                                }
                                // Determine tags
                                let tags = [];
                                if (options.tags) {
                                    tags =
                                        typeof options.tags === 'function'
                                            ? options.tags(args, target, methodName)
                                            : options.tags;
                                }
                                // Cache the result
                                this.cache
                                    .set(cacheKey, cacheType, data, {
                                    ttl: options.ttl,
                                    tags,
                                })
                                    .then(() => {
                                    this.logger.debug(`Cached: ${cacheKey}`);
                                    resolve(data);
                                })
                                    .catch((error) => {
                                    this.logger.warn(`Cache set error for ${cacheKey}:`, error);
                                    resolve(data); // Return data even if cache fails
                                });
                            },
                            error: (error) => {
                                if (options.cacheErrors) {
                                    // Cache the error (not recommended)
                                    this.cache
                                        .set(cacheKey, cacheType, { error: error.message }, {
                                        ttl: options.ttl || 60,
                                    })
                                        .catch(() => { });
                                }
                                reject(error);
                            },
                        }))
                            .subscribe({
                            next: () => { },
                            error: (error) => reject(error),
                        });
                    });
                }, {
                    ttl: options.ttl,
                    tags: typeof options.tags === 'function'
                        ? options.tags(args, target, methodName)
                        : options.tags,
                })
                    .then((data) => {
                    if (data !== null) {
                        observer.next(data);
                        observer.complete();
                    }
                    else {
                        // Cache miss, execute method
                        next.handle().subscribe({
                            next: (value) => observer.next(value),
                            error: (error) => observer.error(error),
                            complete: () => observer.complete(),
                        });
                    }
                })
                    .catch((error) => {
                    this.logger.error(`Cache error for ${cacheKey}:`, error);
                    // Fallback to executing method
                    next.handle().subscribe({
                        next: (value) => observer.next(value),
                        error: (error) => observer.error(error),
                        complete: () => observer.complete(),
                    });
                });
            });
        }
    };
    __setFunctionName(_classThis, "CacheableInterceptor");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CacheableInterceptor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CacheableInterceptor = _classThis;
})();
exports.CacheableInterceptor = CacheableInterceptor;
