import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Optional: OpenTelemetry packages (install with: npm install @opentelemetry/sdk-node @opentelemetry/exporter-jaeger ...)
let NodeSDK: any, JaegerExporter: any, ZipkinExporter: any, OTLPTraceExporter: any;
let HttpInstrumentation: any, ExpressInstrumentation: any;
let Resource: any, SemanticResourceAttributes: any;

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
} catch (e) {
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
@Injectable()
export class OpenTelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OpenTelemetryService.name);
  private sdk: any | null = null;

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
          [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.configService.get<string>(
            'app.nodeEnv',
            'development',
          ),
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





























