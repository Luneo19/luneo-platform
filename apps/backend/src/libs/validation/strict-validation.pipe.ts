/**
 * Strict Validation Pipe
 * Enhanced validation with whitelist, transform, and detailed error messages
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class StrictValidationPipe implements PipeTransform<unknown, unknown> {
  private readonly logger = new Logger(StrictValidationPipe.name);

  constructor(
    private readonly options: {
      whitelist?: boolean;
      forbidNonWhitelisted?: boolean;
      transform?: boolean;
      transformOptions?: {
        enableImplicitConversion?: boolean;
      };
      skipMissingProperties?: boolean;
      skipNullProperties?: boolean;
      skipUndefinedProperties?: boolean;
      validationError?: {
        target?: boolean;
        value?: boolean;
      };
    } = {},
  ) {
    // Default options
    this.options = {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      validationError: {
        target: false,
        value: false,
      },
      ...options,
    };
  }

  async transform(value: unknown, { metatype, type }: ArgumentMetadata) {
    // Skip validation for primitive types
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Skip validation for query params if not a DTO
    if (type === 'query' && !this.isDto(metatype)) {
      return value;
    }

    try {
      // Transform plain object to class instance
      const object = plainToInstance(metatype, value, {
        enableImplicitConversion: this.options.transformOptions?.enableImplicitConversion,
        excludeExtraneousValues: this.options.whitelist,
      });

      // Validate
      const errors = await validate(object, {
        whitelist: this.options.whitelist,
        forbidNonWhitelisted: this.options.forbidNonWhitelisted,
        skipMissingProperties: this.options.skipMissingProperties,
        skipNullProperties: this.options.skipNullProperties,
        skipUndefinedProperties: this.options.skipUndefinedProperties,
        validationError: this.options.validationError,
      });

      if (errors.length > 0) {
        const formattedErrors = this.formatErrors(errors);
        this.logger.warn(`Validation failed: ${JSON.stringify(formattedErrors)}`);
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }

      return object;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Validation pipe error:', error);
      throw new BadRequestException('Validation failed');
    }
  }

  private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
    const types: (new (...args: unknown[]) => unknown)[] = [String, Boolean, Number, Array, Object, Date];
    return !types.includes(metatype as (new (...args: unknown[]) => unknown));
  }

  private isDto(metatype: new (...args: unknown[]) => unknown): boolean {
    // Check if class has validation decorators (simple heuristic)
    return metatype.prototype && typeof metatype === 'function';
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const error of errors) {
      if (error.constraints) {
        formatted[error.property] = Object.values(error.constraints);
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        for (const [key, value] of Object.entries(nestedErrors)) {
          formatted[`${error.property}.${key}`] = value;
        }
      }
    }

    return formatted;
  }
}

