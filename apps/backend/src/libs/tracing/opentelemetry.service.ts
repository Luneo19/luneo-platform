import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Optional: OpenTelemetry packages (install with: npm install @opentelemetry/sdk-node @opentelemetry/exporter-jaeger ...)
let NodeSDK: new (config: Record<string, unknown>) => { start: () => void; shutdown: () => Promise<void> };
let JaegerExporter: new (config: { endpoint: string }) => unknown;
let ZipkinExporter: new (config: { url: string }) => unknown;
let OTLPTraceExporter: new (config: { url: string }) => unknown;
let HttpInstrumentation: new (config?: Record<string, unknown>) => unknown;
let ExpressInstrumentation: new (config?: Record<string, unknown>) => unknown;
let Resource: new (config: Record<string, unknown>) => unknown;
let SemanticResourceAttributes: Record<string, string>;

try {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const sdkNode = require('@opentelemetry/sdk-node') as { NodeSDK: typeof NodeSDK };
  NodeSDK = sdkNode.NodeSDK;
  const jaegerExporter = require('@opentelemetry/exporter-jaeger') as { JaegerExporter: typeof JaegerExporter };
  JaegerExporter = jaegerExporter.JaegerExporter;
  const zipkinExporter = require('@opentelemetry/exporter-zipkin') as { ZipkinExporter: typeof ZipkinExporter };
  ZipkinExporter = zipkinExporter.ZipkinExporter;
  const otlpExporter = require('@opentelemetry/exporter-otlp-http') as { OTLPTraceExporter: typeof OTLPTraceExporter };
  OTLPTraceExporter = otlpExporter.OTLPTraceExporter;
  const httpInstrumentation = require('@opentelemetry/instrumentation-http') as { HttpInstrumentation: typeof HttpInstrumentation };
  HttpInstrumentation = httpInstrumentation.HttpInstrumentation;
  const expressInstrumentation = require('@opentelemetry/instrumentation-express') as { ExpressInstrumentation: typeof ExpressInstrumentation };
  ExpressInstrumentation = expressInstrumentation.ExpressInstrumentation;
  const resources = require('@opentelemetry/resources') as { Resource: typeof Resource; SemanticResourceAttributes: typeof SemanticResourceAttributes };
  Resource = resources.Resource;
  SemanticResourceAttributes = resources.SemanticResourceAttributes;
  /* eslint-enable @typescript-eslint/no-var-requires */
} catch {
  // OpenTelemetry packages not installed
  NodeSDK = null as unknown as typeof NodeSDK;
  JaegerExporter = null as unknown as typeof JaegerExporter;
  ZipkinExporter = null as unknown as typeof ZipkinExporter;
  OTLPTraceExporter = null as unknown as typeof OTLPTraceExporter;
  HttpInstrumentation = null as unknown as typeof HttpInstrumentation;
  ExpressInstrumentation = null as unknown as typeof ExpressInstrumentation;
  Resource = null as unknown as typeof Resource;
  SemanticResourceAttributes = {} as typeof SemanticResourceAttributes;
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
@Injectable()
export class OpenTelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OpenTelemetryService.name);
  private sdk: { start: () => void; shutdown: () => Promise<void> } | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      const enabled = this.configService.get<boolean>('monitoring.opentelemetry.enabled', false);
      
      if (!enabled) {
        this.logger.log('OpenTelemetry is disabled');
        return;
      }

      if (!NodeSDK) {
        this.logger.warn('OpenTelemetry packages not installed. Install with: npm install @opentelemetry/sdk-node @opentelemetry/exporter-jaeger ...');
        return;
      }

      const serviceName = 'luneo-backend';
      const exporterType = this.configService.get<string>(
        'monitoring.opentelemetry.exporter',
        'jaeger',
      );
      const endpoint = this.configService.get<string>(
        'monitoring.opentelemetry.endpoint',
        'http://localhost:14268/api/traces',
      );

      // Create exporter based on type
      let exporter: unknown;
      switch (exporterType) {
        case 'jaeger':
          exporter = new (JaegerExporter as new (config: { endpoint: string }) => unknown)({
            endpoint,
          });
          break;
        case 'zipkin':
          exporter = new (ZipkinExporter as new (config: { url: string }) => unknown)({
            url: endpoint,
          });
          break;
        case 'otlp':
          exporter = new (OTLPTraceExporter as new (config: { url: string }) => unknown)({
            url: endpoint,
          });
          break;
        default:
          this.logger.warn(`Unknown exporter type: ${exporterType}, using Jaeger`);
          exporter = new (JaegerExporter as new (config: { endpoint: string }) => unknown)({
            endpoint: 'http://localhost:14268/api/traces',
          });
      }

      // Initialize SDK
      const SemAttr = SemanticResourceAttributes as Record<string, string>;
      this.sdk = new (NodeSDK as new (config: Record<string, unknown>) => { start: () => void; shutdown: () => Promise<void> })({
        resource: new (Resource as new (config: Record<string, string>) => unknown)({
          [SemAttr.SERVICE_NAME]: serviceName,
          [SemAttr.SERVICE_VERSION]: '1.0.0',
          [SemAttr.DEPLOYMENT_ENVIRONMENT]: this.configService.get<string>(
            'app.nodeEnv',
            'development',
          ),
        }),
        traceExporter: exporter,
        instrumentations: [
          new (HttpInstrumentation as new (config: Record<string, unknown>) => unknown)({
            requestHeaders: ['x-trace-id', 'x-request-id', 'authorization'],
            responseHeaders: ['x-trace-id', 'x-request-id'],
            ignoreIncomingRequestHook: (req: { url?: string }) => {
              return req.url?.includes('/health') || req.url?.includes('/metrics');
            },
          }),
          new (ExpressInstrumentation as new (config: Record<string, unknown>) => unknown)({
            ignoreIncomingRequestHook: (req: { url?: string }) => {
              return req.url?.includes('/health') || req.url?.includes('/metrics');
            },
          }),
        ],
      });

      // Start SDK
      this.sdk.start();
      this.logger.log(
        `OpenTelemetry initialized with ${exporterType} exporter at ${endpoint}`,
      );
    } catch (error) {
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
}

































