import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';

interface OTelOptions {
  enabled: boolean;
  serviceName: string;
  serviceNamespace: string;
  environment: string;
  exporterUrl?: string;
  exporterHeaders?: Record<string, string>;
  logLevel?: DiagLogLevel;
  debug?: boolean;
  samplerRatio?: number;
}

let initialized = false;
let sdk: NodeSDK | undefined;

export async function initializeTracing(options?: Partial<OTelOptions>): Promise<void> {
  if (initialized) {
    return;
  }

  const merged = resolveOptions(options);
  if (!merged.enabled) {
    return;
  }

  if (merged.debug) {
    diag.setLogger(new DiagConsoleLogger(), merged.logLevel ?? DiagLogLevel.INFO);
  }

  prepareResourceAttributes(merged);

  const traceExporter = createTraceExporter(merged);

  const sampler =
    merged.samplerRatio !== undefined && merged.samplerRatio >= 0 && merged.samplerRatio < 1
      ? new ParentBasedSampler({
          root: new TraceIdRatioBasedSampler(merged.samplerRatio),
        })
      : undefined;

  sdk = new NodeSDK({
    traceExporter,
    sampler,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => shouldIgnoreRoute(request.url ?? ''),
      }),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
      new IORedisInstrumentation({
        requireParentSpan: false,
      }),
      new PrismaInstrumentation(),
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
    diag.error('Failed to shutdown OpenTelemetry SDK', error);
  } finally {
    sdk = undefined;
    initialized = false;
  }
}

function resolveOptions(overrides?: Partial<OTelOptions>): OTelOptions {
  const envEnabled =
    (process.env.OTEL_ENABLED ?? process.env.OTEL_TRACES_ENABLED ?? '').toLowerCase();

  const fromEnv =
    envEnabled === '1' ||
    envEnabled === 'true' ||
    envEnabled === 'yes' ||
    envEnabled === 'on' ||
    Boolean(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT);

  return {
    enabled: overrides?.enabled ?? fromEnv,
    serviceName: overrides?.serviceName ?? process.env.OTEL_SERVICE_NAME ?? 'luneo-backend',
    serviceNamespace:
      overrides?.serviceNamespace ?? process.env.OTEL_SERVICE_NAMESPACE ?? 'luneo-platform',
    environment: overrides?.environment ?? process.env.NODE_ENV ?? 'development',
    exporterUrl:
      overrides?.exporterUrl ??
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
      process.env.OTEL_COLLECTOR_URL,
    exporterHeaders:
      overrides?.exporterHeaders ?? parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    logLevel: overrides?.logLevel ?? DiagLogLevel.ERROR,
    debug: overrides?.debug ?? process.env.OTEL_DEBUG === 'true',
    samplerRatio: overrides?.samplerRatio ?? readSamplerRatio(),
  };
}

function createTraceExporter(options: OTelOptions) {
  if (options.exporterUrl) {
    return new OTLPTraceExporter({
      url: options.exporterUrl.endsWith('/v1/traces')
        ? options.exporterUrl
        : `${options.exporterUrl.replace(/\/+$/, '')}/v1/traces`,
      headers: options.exporterHeaders,
    });
  }

  return undefined;
}

function parseHeaders(raw?: string): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }

  return raw.split(',').reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split('=').map((chunk) => chunk.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function shouldIgnoreRoute(url: string): boolean {
  if (!url) {
    return false;
  }

  const sanitized = url.toLowerCase();
  return (
    sanitized.includes('/metrics') ||
    sanitized.includes('/health') ||
    sanitized.includes('/ready') ||
    sanitized.includes('/live')
  );
}

function readSamplerRatio(): number {
  const raw = process.env.OTEL_TRACES_SAMPLER_RATIO;
  if (!raw) {
    return 1;
  }

  const ratio = Number.parseFloat(raw);
  if (Number.isFinite(ratio) && ratio >= 0 && ratio <= 1) {
    return ratio;
  }

  return 1;
}

function prepareResourceAttributes(options: OTelOptions): void {
  if (!process.env.OTEL_SERVICE_NAME) {
    process.env.OTEL_SERVICE_NAME = options.serviceName;
  }

  const attributes = parseResourceAttributes(process.env.OTEL_RESOURCE_ATTRIBUTES);

  attributes.set(
    SemanticResourceAttributes.SERVICE_NAMESPACE,
    options.serviceNamespace,
  );
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


