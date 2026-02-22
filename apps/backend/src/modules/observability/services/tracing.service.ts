// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface Trace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // ms
  status: 'success' | 'error';
  tags?: Record<string, string>;
  logs?: Array<{ timestamp: Date; message: string; level: string }>;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un span de trace
   */
  startSpan(service: string, operation: string, traceId?: string, parentSpanId?: string): Trace {
    const span: Trace = {
      traceId: traceId || this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId,
      service,
      operation,
      startTime: new Date(),
      status: 'success',
      tags: {},
      logs: [],
    };

    return span;
  }

  /**
   * Finalise un span
   */
  finishSpan(span: Trace, status: 'success' | 'error' = 'success', error?: Error): Trace {
    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    if (error) {
      span.logs?.push({
        timestamp: new Date(),
        message: error.message,
        level: 'error',
      });
      span.tags = {
        ...span.tags,
        'error.type': error.constructor.name,
        'error.message': error.message,
      };
    }

    // Sauvegarder le span
    this.saveSpan(span);

    return span;
  }

  /**
   * Ajoute un tag à un span
   */
  addTag(span: Trace, key: string, value: string): void {
    if (!span.tags) {
      span.tags = {};
    }
    span.tags[key] = value;
  }

  /**
   * Ajoute un log à un span
   */
  addLog(span: Trace, message: string, level: string = 'info'): void {
    if (!span.logs) {
      span.logs = [];
    }
    span.logs.push({
      timestamp: new Date(),
      message,
      level,
    });
  }

  /**
   * Récupère une trace complète (tous les spans d'un traceId)
   */
  async getTrace(traceId: string): Promise<Trace[]> {
    const rows = await this.prisma.trace.findMany({
      where: { traceId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.rowToTrace(r));
  }

  /**
   * Récupère les traces d'un service
   */
  async getServiceTraces(service: string, limit: number = 100): Promise<Trace[]> {
    const rows = await this.prisma.trace.findMany({
      where: { serviceName: service },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.rowToTrace(r));
  }

  /**
   * Sauvegarde un span dans la table Trace
   */
  private async saveSpan(span: Trace): Promise<void> {
    await this.prisma.trace.create({
      data: {
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId ?? null,
        operationName: span.operation,
        serviceName: span.service,
        duration: span.duration ?? 0,
        status: span.status === 'success' ? 'ok' : 'error',
        metadata: (span.tags || span.logs ? { tags: span.tags, logs: span.logs } : undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    if (span.status === 'error') {
      this.logger.debug(`Trace error: ${span.traceId}/${span.spanId} - ${span.service}.${span.operation}`, {
        duration: span.duration,
        tags: span.tags,
      });
    }
  }

  /**
   * Map Prisma Trace row to Trace interface
   */
  private rowToTrace(r: {
    traceId: string;
    spanId: string;
    parentSpanId: string | null;
    operationName: string;
    serviceName: string;
    duration: number;
    status: string;
    metadata: unknown;
    createdAt: Date;
  }): Trace {
    const meta = (r.metadata as { tags?: Record<string, string>; logs?: Trace['logs'] }) || {};
    return {
      traceId: r.traceId,
      spanId: r.spanId,
      parentSpanId: r.parentSpanId ?? undefined,
      service: r.serviceName,
      operation: r.operationName,
      startTime: r.createdAt,
      duration: r.duration,
      status: r.status === 'ok' ? 'success' : 'error',
      tags: meta.tags,
      logs: meta.logs,
    };
  }

  /**
   * Génère un Trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Génère un Span ID
   */
  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crée un decorator pour tracer automatiquement les méthodes
   */
  static Trace(service: string, operation?: string) {
    return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
      const opName = operation || propertyKey;

      descriptor.value = async function (this: TracingService, ...args: unknown[]) {
        // OpenTelemetry: Deferred to future phase (microservices architecture)
        // Current stack: Sentry (errors + performance) + custom DB tracing (spans in Trace table)
        // Migrate to OpenTelemetry when:
        // 1. Architecture splits into microservices (AI engine Python, etc.)
        // 2. Need distributed tracing across services
        // 3. Want vendor-neutral telemetry export (Jaeger, Datadog, etc.)
        // Estimated effort: 15-20h for full setup
        const startTime = Date.now();
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          if (duration > 1000) {
            this.logger.warn(`Slow operation detected: ${service}.${opName} took ${duration}ms`, {
              service,
              operation: opName,
              duration,
            });
          }
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.logger.error(`Operation failed: ${service}.${opName} failed after ${duration}ms`, error instanceof Error ? error.stack : String(error), {
            service,
            operation: opName,
            duration,
          });
          throw error;
        }
      };

      return descriptor;
    };
  }
}

// OpenTelemetry: Deferred to future phase (microservices architecture)
// Current stack: Sentry (errors + performance) + custom DB tracing (spans in Trace table)
// Migrate to OpenTelemetry when:
// 1. Architecture splits into microservices (AI engine Python, etc.)
// 2. Need distributed tracing across services
// 3. Want vendor-neutral telemetry export (Jaeger, Datadog, etc.)
// Estimated effort: 15-20h for full setup
export interface OpenTelemetryTracer {
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): OpenTelemetrySpan;
  getActiveSpan(): OpenTelemetrySpan | null;
}

export interface OpenTelemetrySpan {
  end(): void;
  setAttribute(key: string, value: string | number | boolean): void;
  recordException(error: Error): void;
}













