import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as { message?: string; error?: string };
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.message;
      } else {
        message = exception.message;
        error = exception.message;
      }
    } else if (exception instanceof Error) {
      // SECURITY FIX: Never expose internal error details to clients
      // Log the real error internally, but return a generic message
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
    }

    // Log error details internally
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof HttpException ? undefined : (exception instanceof Error ? exception.stack : undefined),
    );

    // SECURITY FIX: For 500 errors, always return generic message to prevent info leakage
    const safeMessage = status >= 500 ? 'An unexpected error occurred. Please try again later.' : message;
    const safeError = status >= 500 ? 'Internal Server Error' : error;

    const errorResponse = {
      success: false,
      error: safeError,
      message: safeMessage,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
