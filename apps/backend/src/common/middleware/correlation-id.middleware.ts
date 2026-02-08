/**
 * Correlation ID Middleware
 * Assigns a unique request ID to every request for distributed tracing.
 * The ID is propagated via the `X-Request-Id` header and attached to logs.
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Reuse existing correlation ID from upstream proxy, or generate new one
    const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();

    // Attach to request for downstream use
    req.headers[CORRELATION_ID_HEADER] = correlationId;

    // Return it in response for client-side tracing
    res.setHeader('X-Request-Id', correlationId);

    next();
  }
}
