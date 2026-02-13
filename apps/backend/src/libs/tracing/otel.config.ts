/**
 * OpenTelemetry bootstrap (run before NestFactory.create).
 * Uses MONITORING_OPENTELEMETRY_ENDPOINT to send traces via OTLP HTTP.
 * Optional: requires @opentelemetry/sdk-node, @opentelemetry/auto-instrumentations-node,
 * @opentelemetry/exporter-trace-otlp-http, @opentelemetry/resources, @opentelemetry/semantic-conventions.
 */
export function initTracing(): void {
  const otlpEndpoint = process.env.MONITORING_OPENTELEMETRY_ENDPOINT;
  if (!otlpEndpoint?.trim()) return;

  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { Resource } = require('@opentelemetry/resources');
    const { SEMRESATTRS_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

    const traceUrl = otlpEndpoint.replace(/\/$/, '') + '/v1/traces';
    const sdk = new NodeSDK({
      resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: 'luneo-backend' }),
      traceExporter: new OTLPTraceExporter({ url: traceUrl }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    sdk.start();
    process.on('SIGTERM', () => sdk.shutdown());
  } catch {
    // Optional deps not installed or invalid config – skip tracing
  }
}
