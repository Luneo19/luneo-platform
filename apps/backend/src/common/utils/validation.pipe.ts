import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';
import xss from 'xss';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform<T>(value: T, { metatype }: ArgumentMetadata): Promise<T> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize input
    const sanitizedValue = this.sanitizeInput(value);
    
    const object = plainToClass(metatype, sanitizedValue) as T;
    const errors = await validate(object as object);

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

  private sanitizeInput<T>(value: T): T {
    if (typeof value === 'string') {
      // Remove XSS
      let sanitized = xss(value);
      // Remove HTML tags
      sanitized = sanitizeHtml(sanitized, { allowedTags: [] });
      return sanitized as unknown as T;
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.sanitizeInput(item)) as unknown as T;
      }

      const entries = Object.entries(value as Record<string, unknown>).map(
        ([key, val]) => [key, this.sanitizeInput(val)],
      );

      return Object.fromEntries(entries) as unknown as T;
    }

    return value;
  }
}
