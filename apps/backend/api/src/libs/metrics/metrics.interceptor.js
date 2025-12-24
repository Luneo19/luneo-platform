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
exports.MetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
/**
 * Interceptor pour capturer automatiquement les métriques HTTP
 */
let MetricsInterceptor = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MetricsInterceptor = _classThis = class {
        constructor(prometheus) {
            this.prometheus = prometheus;
            this.logger = new common_1.Logger(MetricsInterceptor.name);
        }
        intercept(context, next) {
            const request = context.switchToHttp().getRequest();
            const response = context.switchToHttp().getResponse();
            const startTime = Date.now();
            // Extract route (remove query params)
            const route = request.route?.path || request.path;
            const method = request.method;
            const brandId = request.user?.brandId || 'unknown';
            // Track request size
            const requestSize = this.getRequestSize(request);
            if (requestSize > 0) {
                this.prometheus.httpRequestSize.observe({ method, route }, requestSize);
            }
            return next.handle().pipe((0, operators_1.tap)(() => {
                const duration = (Date.now() - startTime) / 1000;
                const status = String(response.statusCode);
                const responseSize = this.getResponseSize(response);
                // Increment request counter
                this.prometheus.httpRequestsTotal.inc({
                    method,
                    route,
                    status,
                    brandId,
                });
                // Record duration
                this.prometheus.httpRequestDuration.observe({ method, route, status }, duration);
                // Record response size
                if (responseSize > 0) {
                    this.prometheus.httpResponseSize.observe({ method, route, status }, responseSize);
                }
            }), (0, operators_1.catchError)((error) => {
                const duration = (Date.now() - startTime) / 1000;
                const status = String(error.status || 500);
                // Increment error counter
                this.prometheus.httpRequestsTotal.inc({
                    method,
                    route,
                    status,
                    brandId,
                });
                // Record error duration
                this.prometheus.httpRequestDuration.observe({ method, route, status }, duration);
                throw error;
            }));
        }
        getRequestSize(request) {
            if (request.headers['content-length']) {
                return parseInt(request.headers['content-length'], 10);
            }
            if (request.body) {
                return JSON.stringify(request.body).length;
            }
            return 0;
        }
        getResponseSize(response) {
            const contentLength = response.get('content-length');
            if (contentLength) {
                return parseInt(contentLength, 10);
            }
            return 0;
        }
    };
    __setFunctionName(_classThis, "MetricsInterceptor");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MetricsInterceptor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MetricsInterceptor = _classThis;
})();
exports.MetricsInterceptor = MetricsInterceptor;
