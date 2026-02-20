/**
 * Zod Validation Pipe
 * Use Zod schemas for runtime validation
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);

  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      const parsed = this.schema.parse(value);
      return parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = this.formatZodErrors(error);
        this.logger.warn(`Zod validation failed: ${JSON.stringify(formattedErrors)}`);
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      throw error;
    }
  }

  private formatZodErrors(error: ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!formatted[path]) {
        formatted[path] = [];
      }
      formatted[path].push(issue.message);
    }

    return formatted;
  }
}

/**
 * Create a Zod validation pipe for a schema
 */
export function createZodPipe(schema: ZodSchema) {
  return new ZodValidationPipe(schema);
}

