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
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
let RateLimitGuard = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RateLimitGuard = _classThis = class {
        constructor(rateLimitService) {
            this.rateLimitService = rateLimitService;
        }
        async canActivate(context) {
            const request = context.switchToHttp().getRequest();
            // Get API key from request (set by ApiKeyGuard)
            const apiKey = request['apiKey'];
            if (!apiKey) {
                return true; // Let ApiKeyGuard handle authentication
            }
            // Get rate limit configuration from API key
            const config = this.rateLimitService.getConfigForApiKey(apiKey);
            // Use API key ID as identifier
            const identifier = apiKey.id;
            // Check rate limit
            const result = await this.rateLimitService.checkRateLimit(identifier, config);
            if (!result.allowed) {
                // Add rate limit headers
                const response = context.switchToHttp().getResponse();
                response.setHeader('X-RateLimit-Limit', config.requestsPerMinute);
                response.setHeader('X-RateLimit-Remaining', result.remaining);
                response.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));
                response.setHeader('Retry-After', Math.floor((result.resetTime - Date.now()) / 1000));
                throw new common_1.HttpException('Rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            // Add rate limit headers to successful response
            const response = context.switchToHttp().getResponse();
            response.setHeader('X-RateLimit-Limit', config.requestsPerMinute);
            response.setHeader('X-RateLimit-Remaining', result.remaining);
            response.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));
            return true;
        }
    };
    __setFunctionName(_classThis, "RateLimitGuard");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RateLimitGuard = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RateLimitGuard = _classThis;
})();
exports.RateLimitGuard = RateLimitGuard;
