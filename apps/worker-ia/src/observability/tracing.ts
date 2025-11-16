import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

interface TracingOptions {
  enabled: boolean;
  serviceName: string;
  serviceNamespace: string;
  environment: string;
  exporterUrl?: string;
  exporterHeaders?: Record<string, string>;
  samplerRatio?: number;
  debug?: boolean;
  logLevel?: DiagLogLevel;
}

let sdk: NodeSDK | undefined;
let initialized = false;

export async function initializeTracing(
  overrides: Partial<TracingOptions> = {},
): Promise<void> {
  if (initialized) {
    return;
  }

  const options = resolveOptions(overrides);
  if (!options.enabled) {
    return;
  }

  if (options.debug) {
    diag.setLogger(new DiagConsoleLogger(), options.logLevel ?? DiagLogLevel.INFO);
  }

  prepareResourceAttributes(options);

  const traceExporter = createTraceExporter(options);
  const sampler = createSampler(options);

  sdk = new NodeSDK({
    traceExporter,
    sampler,
    instrumentations: [
      new HttpInstrumentation(),
      new IORedisInstrumentation({ requireParentSpan: false }),
      new UndiciInstrumentation(),
    ],
  });

  await sdk.start();
  initialized = true;
}

export async function shutdownTracing(): Promise<void> {
  if (!sdk) {
    return;
  }

  try {
    await sdk.shutdown();
  } catch (error) {
    diag.error('Failed to shut down tracing SDK', error);
  } finally {
    sdk = undefined;
    initialized = false;
  }
}

function resolveOptions(overrides: Partial<TracingOptions>): TracingOptions {
  const envEnabled =
    (process.env.OTEL_ENABLED ?? process.env.OTEL_TRACES_ENABLED ?? '').toLowerCase();
  const enabledFromEnv =
    envEnabled === '1' ||
    envEnabled === 'true' ||
    envEnabled === 'yes' ||
    envEnabled === 'on' ||
    Boolean(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT);

  return {
    enabled: overrides.enabled ?? enabledFromEnv,
    serviceName: overrides.serviceName ?? process.env.OTEL_SERVICE_NAME ?? 'luneo-worker-ia',
    serviceNamespace:
      overrides.serviceNamespace ?? process.env.OTEL_SERVICE_NAMESPACE ?? 'luneo-platform',
    environment: overrides.environment ?? process.env.NODE_ENV ?? 'development',
    exporterUrl:
      overrides.exporterUrl ??
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
      process.env.OTEL_COLLECTOR_URL,
    exporterHeaders:
      overrides.exporterHeaders ?? parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    samplerRatio: overrides.samplerRatio ?? readSamplerRatio(),
    debug: overrides.debug ?? process.env.OTEL_DEBUG === 'true',
    logLevel: overrides.logLevel ?? DiagLogLevel.ERROR,
  };
}

function createTraceExporter(options: TracingOptions) {
  if (!options.exporterUrl) {
    return undefined;
  }

  const endpoint = options.exporterUrl.endsWith('/v1/traces')
    ? options.exporterUrl
    : `${options.exporterUrl.replace(/\/+$/, '')}/v1/traces`;

  return new OTLPTraceExporter({
    url: endpoint,
    headers: options.exporterHeaders,
  });
}

function createSampler(options: TracingOptions) {
  if (
    options.samplerRatio === undefined ||
    options.samplerRatio >= 1 ||
    options.samplerRatio <= 0
  ) {
    return undefined;
  }

  return new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(options.samplerRatio),
  });
}

function prepareResourceAttributes(options: TracingOptions): void {
  if (!process.env.OTEL_SERVICE_NAME) {
    process.env.OTEL_SERVICE_NAME = options.serviceName;
  }

  const attributes = parseResourceAttributes(process.env.OTEL_RESOURCE_ATTRIBUTES);

  attributes.set(SemanticResourceAttributes.SERVICE_NAMESPACE, options.serviceNamespace);
  attributes.set(
    SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT,
    options.environment,
  );
  attributes.set(
    SemanticResourceAttributes.SERVICE_VERSION,
    process.env.npm_package_version ?? '0.0.0',
  );
  attributes.set(SemanticResourceAttributes.HOST_NAME, process.env.HOSTNAME ?? 'unknown');

  process.env.OTEL_RESOURCE_ATTRIBUTES = serializeResourceAttributes(attributes);
}

function parseHeaders(raw?: string): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }

  return raw.split(',').reduce<Record<string, string>>((acc, entry) => {
    const [key, value] = entry.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});
}

function readSamplerRatio(): number | undefined {
  const raw = process.env.OTEL_TRACES_SAMPLER_RATIO;
  if (!raw) {
    return undefined;
  }

  const ratio = Number.parseFloat(raw);
  if (Number.isFinite(ratio) && ratio >= 0 && ratio <= 1) {
    return ratio;
  }

  return undefined;
}

function parseResourceAttributes(raw?: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw) {
    return map;
  }

  raw.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      map.set(key.trim(), value.trim());
    }
  });

  return map;
}

function serializeResourceAttributes(attributes: Map<string, string>): string {
  return Array.from(attributes.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}



