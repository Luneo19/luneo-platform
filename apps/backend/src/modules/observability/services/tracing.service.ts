import { Injectable, Logger } from '@nestjs/common';
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
   * Récupère une trace complète
   */
  async getTrace(traceId: string): Promise<Trace[]> {
    // TODO: Récupérer depuis la table Trace
    // Pour l'instant, retourner vide
    return [];
  }

  /**
   * Récupère les traces d'un service
   */
  async getServiceTraces(service: string, limit: number = 100): Promise<Trace[]> {
    // TODO: Récupérer depuis la table Trace
    return [];
  }

  /**
   * Sauvegarde un span
   */
  private async saveSpan(span: Trace): Promise<void> {
    // TODO: Sauvegarder dans une table Trace
    // Pour l'instant, log seulement les erreurs
    if (span.status === 'error') {
      this.logger.debug(`Trace error: ${span.traceId}/${span.spanId} - ${span.service}.${span.operation}`, {
        duration: span.duration,
        tags: span.tags,
      });
    }
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
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const opName = operation || propertyKey;

      descriptor.value = async function (...args: any[]) {
        // TODO: Intégrer avec OpenTelemetry
        // Pour l'instant, wrapper simple
        const startTime = Date.now();
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          // Log si durée > seuil
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












