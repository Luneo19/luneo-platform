import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.isZodSchema(metadata.metatype)) {
      return value;
    }

    try {
      const schema = metadata.metatype as unknown as ZodSchema;
      const parsed = schema.parse(value);
      return parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        this.logger.warn('Zod validation failed', {
          errors,
          value: this.sanitizeValue(value),
        });

        throw new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      }

      throw error;
    }
  }

  private isZodSchema(metatype: unknown): boolean {
    return (
      typeof metatype === 'function' &&
      'parse' in metatype &&
      'safeParse' in metatype &&
      'schema' in metatype
    );
  }

  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        // Mask sensitive fields
        if (['password', 'token', 'secret', 'key', 'apiKey'].some(sensitive => 
          key.toLowerCase().includes(sensitive.toLowerCase())
        )) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = val;
        }
      }
      return sanitized;
    }
    return value;
  }
}

