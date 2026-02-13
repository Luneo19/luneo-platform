import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sanitizeHtml = require('sanitize-html') as (html: string, options?: { allowedTags?: string[] }) => string;
import xss from 'xss';
import { JsonValue } from '../types/utility-types';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize input
    const sanitizedValue = this.sanitizeInput(value);
    
    const object = plainToClass(metatype, sanitizedValue);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      throw new BadRequestException(messages.join('; '));
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: unknown): JsonValue {
    if (typeof value === 'string') {
      // Remove XSS
      let sanitized = xss(value);
      // Remove HTML tags
      sanitized = sanitizeHtml(sanitized, { allowedTags: [] });
      return sanitized;
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.sanitizeInput(item));
      }
      
      const sanitized: Record<string, JsonValue> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeInput(val);
      }
      
      return sanitized;
    }

    return value as JsonValue;
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
