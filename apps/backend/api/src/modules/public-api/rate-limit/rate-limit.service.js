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
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
let RateLimitService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RateLimitService = _classThis = class {
        constructor(cache) {
            this.cache = cache;
        }
        /**
         * Check if request is within rate limit
         */
        async checkRateLimit(identifier, config) {
            const now = Date.now();
            const minute = Math.floor(now / 60000);
            const hour = Math.floor(now / 3600000);
            const day = Math.floor(now / 86400000);
            const month = Math.floor(now / 2592000000); // Approximate month
            // Check minute rate limit
            const minuteKey = `rate_limit:${identifier}:minute:${minute}`;
            const minuteCount = Number(await this.cache.getSimple(minuteKey)) || 0;
            if (minuteCount >= config.requestsPerMinute) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: (minute + 1) * 60000,
                };
            }
            // Check hour rate limit
            const hourKey = `rate_limit:${identifier}:hour:${hour}`;
            const hourCount = Number(await this.cache.getSimple(hourKey)) || 0;
            if (hourCount >= config.requestsPerHour) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: (hour + 1) * 3600000,
                };
            }
            // Check day rate limit
            const dayKey = `rate_limit:${identifier}:day:${day}`;
            const dayCount = Number(await this.cache.getSimple(dayKey)) || 0;
            if (dayCount >= config.requestsPerDay) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: (day + 1) * 86400000,
                };
            }
            // Check month rate limit
            const monthKey = `rate_limit:${identifier}:month:${month}`;
            const monthCount = Number(await this.cache.getSimple(monthKey)) || 0;
            if (monthCount >= config.requestsPerMonth) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: (month + 1) * 2592000000,
                };
            }
            // Increment counters
            await Promise.all([
                this.cache.setSimple(minuteKey, minuteCount + 1, 120), // 2 minutes TTL
                this.cache.setSimple(hourKey, hourCount + 1, 7200), // 2 hours TTL
                this.cache.setSimple(dayKey, dayCount + 1, 172800), // 2 days TTL
                this.cache.setSimple(monthKey, monthCount + 1, 5184000), // 2 months TTL
            ]);
            // Calculate remaining requests (use the most restrictive limit)
            const remaining = Math.min(config.requestsPerMinute - minuteCount - 1, config.requestsPerHour - hourCount - 1, config.requestsPerDay - dayCount - 1, config.requestsPerMonth - monthCount - 1);
            return {
                allowed: true,
                remaining: Math.max(0, remaining),
                resetTime: (minute + 1) * 60000, // Reset time for minute limit
            };
        }
        /**
         * Get current rate limit status
         */
        async getRateLimitStatus(identifier, config) {
            const now = Date.now();
            const minute = Math.floor(now / 60000);
            const hour = Math.floor(now / 3600000);
            const day = Math.floor(now / 86400000);
            const month = Math.floor(now / 2592000000);
            const [minuteCount, hourCount, dayCount, monthCount] = await Promise.all([
                Number(await this.cache.getSimple(`rate_limit:${identifier}:minute:${minute}`)) || 0,
                Number(await this.cache.getSimple(`rate_limit:${identifier}:hour:${hour}`)) || 0,
                Number(await this.cache.getSimple(`rate_limit:${identifier}:day:${day}`)) || 0,
                Number(await this.cache.getSimple(`rate_limit:${identifier}:month:${month}`)) || 0,
            ]);
            return {
                minute: {
                    used: minuteCount,
                    limit: config.requestsPerMinute,
                    remaining: Math.max(0, config.requestsPerMinute - minuteCount),
                },
                hour: {
                    used: hourCount,
                    limit: config.requestsPerHour,
                    remaining: Math.max(0, config.requestsPerHour - hourCount),
                },
                day: {
                    used: dayCount,
                    limit: config.requestsPerDay,
                    remaining: Math.max(0, config.requestsPerDay - dayCount),
                },
                month: {
                    used: monthCount,
                    limit: config.requestsPerMonth,
                    remaining: Math.max(0, config.requestsPerMonth - monthCount),
                },
            };
        }
        /**
         * Reset rate limit for identifier
         */
        async resetRateLimit(identifier) {
            const now = Date.now();
            const minute = Math.floor(now / 60000);
            const hour = Math.floor(now / 3600000);
            const day = Math.floor(now / 86400000);
            const month = Math.floor(now / 2592000000);
            await Promise.all([
                this.cache.delSimple(`rate_limit:${identifier}:minute:${minute}`),
                this.cache.delSimple(`rate_limit:${identifier}:hour:${hour}`),
                this.cache.delSimple(`rate_limit:${identifier}:day:${day}`),
                this.cache.delSimple(`rate_limit:${identifier}:month:${month}`),
            ]);
        }
        /**
         * Get default rate limit configuration
         */
        getDefaultConfig() {
            return {
                requestsPerMinute: 60,
                requestsPerHour: 1000,
                requestsPerDay: 10000,
                requestsPerMonth: 100000,
            };
        }
        /**
         * Get rate limit configuration for API key
         */
        getConfigForApiKey(apiKeyConfig) {
            if (!apiKeyConfig || !apiKeyConfig.rateLimit) {
                return this.getDefaultConfig();
            }
            return {
                requestsPerMinute: apiKeyConfig.rateLimit.requestsPerMinute || 60,
                requestsPerHour: apiKeyConfig.rateLimit.requestsPerHour || 1000,
                requestsPerDay: apiKeyConfig.rateLimit.requestsPerDay || 10000,
                requestsPerMonth: apiKeyConfig.rateLimit.requestsPerMonth || 100000,
            };
        }
    };
    __setFunctionName(_classThis, "RateLimitService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RateLimitService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RateLimitService = _classThis;
})();
exports.RateLimitService = RateLimitService;
