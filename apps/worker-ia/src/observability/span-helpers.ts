import {
  trace,
  SpanStatusCode,
  type Span,
  type SpanAttributes,
  propagation,
  context as otContext,
  ROOT_CONTEXT,
  type Context,
} from '@opentelemetry/api';
import type { Job } from 'bullmq';

const TRACER_NAME = 'luneo-worker-ia';

export async function withActiveSpan<T>(
  name: string,
  attributes: SpanAttributes = {},
  fn: (span: Span) => Promise<T>,
  parentContext?: Context,
): Promise<T> {
  const tracer = trace.getTracer(TRACER_NAME);
  const context = parentContext ?? otContext.active();

  return otContext.with(context, () => {
    return tracer.startActiveSpan(name, async (span) => {
      try {
        setAttributes(span, attributes);
        const result = await fn(span);
        annotateResult(span, result);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        span.end();
      }
    });
  });
}

export async function traceJob<TData, TResult>(
  spanName: string,
  job: Job<TData>,
  fn: (span: Span) => Promise<TResult>,
  extraAttributes: SpanAttributes = {},
): Promise<TResult> {
  const baseAttributes: SpanAttributes = {
    'queue.name': job.queueName,
    'queue.job.id': job.id?.toString() ?? 'unknown',
    'queue.job.attempts': job.attemptsMade ?? 0,
    ...extractJobAttributes(job),
    ...extraAttributes,
  };

  const parentContext = extractParentContext(job);

  return withActiveSpan(spanName, baseAttributes, fn, parentContext);
}

function extractParentContext(job: Job<unknown>): Context | undefined {
  const data = job.data as Record<string, unknown> | undefined;
  const carrier = data?.__trace;
  if (carrier && typeof carrier === 'object' && data) {
    delete data.__trace;
    return propagation.extract(ROOT_CONTEXT, carrier as Record<string, string>);
  }
  return undefined;
}

function extractJobAttributes(job: Job<unknown>): SpanAttributes {
  const attributes: SpanAttributes = {};

  const data = (job.data ?? {}) as Record<string, unknown>;

  if (typeof data.designId === 'string') {
    attributes['luneo.design.id'] = data.designId;
  }
  if (typeof data.userId === 'string') {
    attributes['luneo.user.id'] = data.userId;
  }
  if (typeof data.brandId === 'string') {
    attributes['luneo.brand.id'] = data.brandId;
  }

  return attributes;
}

function setAttributes(span: Span, attributes: SpanAttributes): void {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      span.setAttribute(key, value);
    }
  });
}

function annotateResult(span: Span, result: unknown): void {
  if (typeof result === 'object' && result !== null && 'success' in result) {
    const success = (result as { success?: unknown }).success;
    if (typeof success === 'boolean') {
      span.setAttribute('job.result.success', success);
    }
  }
}

