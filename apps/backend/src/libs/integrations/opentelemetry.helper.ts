/**
 * OpenTelemetry Helper - FUTURE PHASE
 *
 * This helper provides basic OpenTelemetry integration points.
 * Currently, the platform uses Sentry + custom DB tracing.
 *
 * This file is kept as scaffolding for future migration when:
 * - The platform splits into microservices
 * - Distributed tracing becomes necessary
 * - User base exceeds 10,000+ requiring advanced observability
 *
 * DO NOT invest in full OpenTelemetry setup while architecture is monolithic.
 *
 * Usage (when enabled):
 * ```typescript
 * import { OpenTelemetryHelper } from '@/libs/integrations/opentelemetry.helper';
 *
 * const otel = new OpenTelemetryHelper('api');
 * const span = otel.startSpan('processOrder', { orderId: 'order-123' });
 * otel.addTag(span, 'userId', 'user-456');
 * otel.finishSpan(span, 'success');
 * ```
 */

import type { Tracer, Span as OTelSpan, Context } from '@opentelemetry/api';

let otelApi: {
  trace: { getTracer: (name: string, version?: string) => Tracer };
  context: { active: () => Context };
  SpanKind: { INTERNAL: number };
  SpanStatusCode: { ERROR: number; OK: number };
} | null = null;

const SPAN_STATUS_ERROR = 2;

function getOtelApi(): typeof otelApi {
  if (otelApi === null) {
    try {
      otelApi = require('@opentelemetry/api');
    } catch {
      // @opentelemetry/api not installed – no-op
    }
  }
  return otelApi;
}

export interface Span {
  traceId: string;
  spanId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'success' | 'error';
  tags: Record<string, string>;
  logs: Array<{ timestamp: number; message: string; level: string }>;
}

export class OpenTelemetryHelper {
  private serviceName: string;
  private tracer: Tracer | undefined;
  private otelSpanMap = new Map<string, OTelSpan>();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    try {
      const api = getOtelApi();
      this.tracer = api ? api.trace.getTracer('luneo-backend', '1.0.0') : undefined;
    } catch {
      this.tracer = undefined;
    }
  }

  /**
   * Start a span
   */
  startSpan(operation: string, tags?: Record<string, string>): Span {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const span: Span = {
      traceId,
      spanId,
      startTime: Date.now(),
      status: 'success',
      tags: tags || {},
      logs: [],
    };

    try {
      const api = getOtelApi();
      if (api && this.tracer) {
        const parentContext = api.context.active();
        const attributes = tags ? { ...tags } : undefined;
        const otelSpan = this.tracer.startSpan(operation, {
          kind: api.SpanKind.INTERNAL,
          attributes,
        }, parentContext);
        this.otelSpanMap.set(span.spanId, otelSpan);
      }
    } catch {
      // no-op when OTel not available
    }

    return span;
  }

  /**
   * Finish a span
   */
  finishSpan(span: Span, status: 'success' | 'error' = 'success', error?: Error): void {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.logs.push({
        timestamp: Date.now(),
        message: error.message,
        level: 'error',
      });
      span.tags['error.type'] = error.constructor.name;
      span.tags['error.message'] = error.message;
    }

    try {
      const otelSpan = this.otelSpanMap.get(span.spanId);
      if (otelSpan) {
        if (status === 'error' && error) {
          otelSpan.setStatus({ code: SPAN_STATUS_ERROR, message: error.message });
        }
        otelSpan.end();
        this.otelSpanMap.delete(span.spanId);
      }
    } catch {
      // no-op when OTel not available
    }
  }

  /**
   * Add tag to span
   */
  addTag(span: Span, key: string, value: string): void {
    span.tags[key] = value;
    try {
      const otelSpan = this.otelSpanMap.get(span.spanId);
      if (otelSpan) {
        otelSpan.setAttribute(key, value);
      }
    } catch {
      // no-op when OTel not available
    }
  }

  /**
   * Add log to span
   */
  addLog(span: Span, message: string, level: string = 'info'): void {
    span.logs.push({
      timestamp: Date.now(),
      message,
      level,
    });
    try {
      const otelSpan = this.otelSpanMap.get(span.spanId);
      if (otelSpan) {
        otelSpan.addEvent(message, { level });
      }
    } catch {
      // no-op when OTel not available
    }
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

































