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
exports.OpenTelemetryService = void 0;
const common_1 = require("@nestjs/common");
// Optional: OpenTelemetry packages (install with: npm install @opentelemetry/sdk-node @opentelemetry/exporter-jaeger ...)
let NodeSDK, JaegerExporter, ZipkinExporter, OTLPTraceExporter;
let HttpInstrumentation, ExpressInstrumentation;
let Resource, SemanticResourceAttributes;
try {
    const sdkNode = require('@opentelemetry/sdk-node');
    NodeSDK = sdkNode.NodeSDK;
    const jaegerExporter = require('@opentelemetry/exporter-jaeger');
    JaegerExporter = jaegerExporter.JaegerExporter;
    const zipkinExporter = require('@opentelemetry/exporter-zipkin');
    ZipkinExporter = zipkinExporter.ZipkinExporter;
    const otlpExporter = require('@opentelemetry/exporter-otlp-http');
    OTLPTraceExporter = otlpExporter.OTLPTraceExporter;
    const httpInstrumentation = require('@opentelemetry/instrumentation-http');
    HttpInstrumentation = httpInstrumentation.HttpInstrumentation;
    const expressInstrumentation = require('@opentelemetry/instrumentation-express');
    ExpressInstrumentation = expressInstrumentation.ExpressInstrumentation;
    const resources = require('@opentelemetry/resources');
    Resource = resources.Resource;
    SemanticResourceAttributes = resources.SemanticResourceAttributes;
}
catch (e) {
    // OpenTelemetry packages not installed
}
/**
 * OpenTelemetry Service
 * Initialise et configure le tracing distribué
 *
 * Usage:
 * ```typescript
 * import { trace } from '@opentelemetry/api';
 *
 * const tracer = trace.getTracer('luneo-backend');
 * const span = tracer.startSpan('processOrder');
 * span.setAttribute('orderId', orderId);
 * // ... processing
 * span.end();
 * ```
 */
let OpenTelemetryService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OpenTelemetryService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(OpenTelemetryService.name);
            this.sdk = null;
        }
        onModuleInit() {
            try {
                const enabled = this.configService.get('monitoring.opentelemetry.enabled', false);
                if (!enabled) {
                    this.logger.log('OpenTelemetry is disabled');
                    return;
                }
                if (!NodeSDK) {
                    this.logger.warn('OpenTelemetry packages not installed. Install with: npm install @opentelemetry/sdk-node @opentelemetry/exporter-jaeger ...');
                    return;
                }
                const serviceName = 'luneo-backend';
                const exporterType = this.configService.get('monitoring.opentelemetry.exporter', 'jaeger');
                const endpoint = this.configService.get('monitoring.opentelemetry.endpoint', 'http://localhost:14268/api/traces');
                // Create exporter based on type
                let exporter;
                switch (exporterType) {
                    case 'jaeger':
                        exporter = new JaegerExporter({
                            endpoint,
                        });
                        break;
                    case 'zipkin':
                        exporter = new ZipkinExporter({
                            url: endpoint,
                        });
                        break;
                    case 'otlp':
                        exporter = new OTLPTraceExporter({
                            url: endpoint,
                        });
                        break;
                    default:
                        this.logger.warn(`Unknown exporter type: ${exporterType}, using Jaeger`);
                        exporter = new JaegerExporter({
                            endpoint: 'http://localhost:14268/api/traces',
                        });
                }
                // Initialize SDK
                this.sdk = new NodeSDK({
                    resource: new Resource({
                        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
                        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
                        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.configService.get('app.nodeEnv', 'development'),
                    }),
                    traceExporter: exporter,
                    instrumentations: [
                        new HttpInstrumentation({
                            // Capture headers
                            requestHeaders: ['x-trace-id', 'x-request-id', 'authorization'],
                            responseHeaders: ['x-trace-id', 'x-request-id'],
                            // Ignore health checks
                            ignoreIncomingRequestHook: (req) => {
                                return req.url?.includes('/health') || req.url?.includes('/metrics');
                            },
                        }),
                        new ExpressInstrumentation({
                            // Ignore routes
                            ignoreIncomingRequestHook: (req) => {
                                return req.url?.includes('/health') || req.url?.includes('/metrics');
                            },
                        }),
                    ],
                });
                // Start SDK
                this.sdk.start();
                this.logger.log(`OpenTelemetry initialized with ${exporterType} exporter at ${endpoint}`);
            }
            catch (error) {
                this.logger.error('Failed to initialize OpenTelemetry:', error);
                // Don't throw - allow app to start without tracing
            }
        }
        onModuleDestroy() {
            if (this.sdk) {
                this.sdk.shutdown();
                this.logger.log('OpenTelemetry SDK shut down');
            }
        }
    };
    __setFunctionName(_classThis, "OpenTelemetryService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OpenTelemetryService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OpenTelemetryService = _classThis;
})();
exports.OpenTelemetryService = OpenTelemetryService;
