import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './performance.service';

/**
 * Performance Monitoring Middleware
 * Inspired by Vercel Analytics and Sentry Performance Monitoring
 * 
 * Tracks:
 * - Request duration
 * - Status codes
 * - Endpoint performance
 * - Error rates
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  constructor(private readonly performanceService: PerformanceService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const endpoint = req.path;
    const method = req.method;

    // Track response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Record metric
      this.performanceService
        .recordMetric({
          endpoint,
          method,
          duration,
          statusCode,
          timestamp: new Date(),
          userId: (req as any).user?.id,
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.get('user-agent'),
        })
        .catch((error) => {
          this.logger.error('Failed to record performance metric', error);
        });

      // Log slow requests
      if (duration > 1000) {
        this.logger.warn(`Slow request detected: ${method} ${endpoint} took ${duration}ms`);
      }

      // Log errors
      if (statusCode >= 500) {
        this.logger.error(`Server error: ${method} ${endpoint} returned ${statusCode}`);
      }
    });

    next();
  }
}
