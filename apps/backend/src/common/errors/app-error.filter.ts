/**
 * AppErrorFilter - Filtre d'exception amélioré pour AppError
 * Intègre avec le système de logging et sanitization
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError, ErrorCode, ErrorCategory } from './app-error';
import { LogSanitizerService } from '@/libs/logger/log-sanitizer.service';

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);
  private readonly sanitizer: LogSanitizerService;

  constructor() {
    this.sanitizer = new LogSanitizerService();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let appError: AppError;
    let status: number;
    let errorResponse: Record<string, unknown> | string | object;

    // Handle AppError instances
    if (exception instanceof AppError) {
      appError = exception;
      status = exception.getStatus();
      errorResponse = exception.getResponse();
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Convert to AppError format
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as { error?: string; message?: string };
        errorResponse = {
          success: false,
          error: resp.error || 'HTTP_ERROR',
          message: resp.message || exception.message,
          statusCode: status,
          timestamp: new Date().toISOString(),
        };
      } else {
        errorResponse = {
          success: false,
          error: 'HTTP_ERROR',
          message: exception.message,
          statusCode: status,
          timestamp: new Date().toISOString(),
        };
      }

      // Create AppError from HttpException for consistent logging
      appError = AppError.fromError(
        exception as Error,
        this.mapHttpStatusToErrorCode(status),
        this.mapHttpStatusToCategory(status),
        {
          path: request.url,
          method: request.method,
        },
      );
    }
    // Handle generic Error
    else if (exception instanceof Error) {
      appError = AppError.fromError(
        exception,
        ErrorCode.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        {
          path: request.url,
          method: request.method,
        },
      );
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = appError.getResponse();
    }
    // Handle unknown errors
    else {
      appError = new AppError(
        'An unexpected error occurred',
        ErrorCode.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          path: request.url,
          method: request.method,
          originalError: String(exception),
        },
        false,
      );
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = appError.getResponse();
    }

    // Sanitize error response for logging (remove sensitive data)
    const sanitizedError = this.sanitizer.sanitizeObject(appError.toJSON());

    // Log error with appropriate level
    if (status >= 500) {
      // Server errors - log with stack trace
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${appError.message}`,
        appError.stack,
        {
          error: sanitizedError,
          request: {
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.get('user-agent'),
          },
        },
      );
    } else if (status >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${appError.message}`,
        {
          error: sanitizedError,
          request: {
            method: request.method,
            url: request.url,
            ip: request.ip,
          },
        },
      );
    }

    const timestamp = new Date().toISOString();

    // Never expose technical details to clients on server-side failures.
    const finalResponse = status >= 500
      ? {
          success: false,
          error: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          statusCode: status,
          timestamp,
          path: request.url,
        }
      : typeof errorResponse === 'object' && errorResponse !== null
        ? { ...errorResponse, path: request.url }
        : { message: errorResponse, path: request.url, timestamp };

    response.status(status).json(finalResponse);
  }

  /**
   * Map HTTP status code to ErrorCode
   */
  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_REQUIRED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.BUSINESS_CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.EXTERNAL_SERVICE_ERROR;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Map HTTP status code to ErrorCategory
   */
  private mapHttpStatusToCategory(status: number): ErrorCategory {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCategory.VALIDATION;
      case HttpStatus.UNAUTHORIZED:
      case HttpStatus.FORBIDDEN:
        return ErrorCategory.AUTHORIZATION;
      case HttpStatus.NOT_FOUND:
        return ErrorCategory.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCategory.BUSINESS_LOGIC;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCategory.RATE_LIMITING;
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCategory.EXTERNAL_SERVICE;
      default:
        return ErrorCategory.INTERNAL;
    }
  }
}

