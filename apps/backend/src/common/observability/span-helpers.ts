import { trace, SpanStatusCode, type Span, type SpanAttributes } from '@opentelemetry/api';
import type { Job } from 'bullmq';

const TRACER_NAME = 'luneo-backend';

export async function withActiveSpan<T>(
  name: string,
  attributes: SpanAttributes = {},
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer(TRACER_NAME);

  return tracer.startActiveSpan(name, async (span) => {
    try {
      applyAttributes(span, attributes);
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
}

export async function traceJob<TPayload, TResult>(
  name: string,
  job: Job<TPayload>,
  fn: (span: Span) => Promise<TResult>,
  extra: SpanAttributes = {},
): Promise<TResult> {
  const attributes: SpanAttributes = {
    'queue.name': job?.queueName ?? 'unknown',
    'queue.job.id': job?.id?.toString() ?? 'unknown',
    'queue.job.attempts': job?.attemptsMade ?? 0,
    ...extractPayloadAttributes(job?.data),
    ...extra,
  };

  return withActiveSpan(name, attributes, fn);
}

function extractPayloadAttributes(payload: unknown): SpanAttributes {
  if (typeof payload !== 'object' || payload === null) {
    return {};
  }

  const data = payload as Record<string, unknown>;
  const attributes: SpanAttributes = {};

  if (typeof data.renderId === 'string') {
    attributes['luneo.render.id'] = data.renderId;
  }
  if (typeof data.designId === 'string') {
    attributes['luneo.design.id'] = data.designId;
  }
  if (typeof data.productId === 'string') {
    attributes['luneo.product.id'] = data.productId;
  }
  if (typeof data.batchId === 'string') {
    attributes['luneo.batch.id'] = data.batchId;
  }

  return attributes;
}

function applyAttributes(span: Span, attributes: SpanAttributes): void {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      span.setAttribute(key, value);
    }
  });
}

function annotateResult(span: Span, result: unknown): void {
  if (typeof result === 'object' && result !== null && 'status' in result) {
    const status = (result as { status?: unknown }).status;
    if (typeof status === 'string') {
      span.setAttribute('job.result.status', status);
    }
  }
}


