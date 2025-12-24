/**
 * Validation Helpers
 * Common validation decorators and utilities
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { z } from 'zod';

/**
 * Custom validators
 */

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isUrlOrEmpty', async: false })
export class IsUrlOrEmptyConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    if (!url || url === '') return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Must be a valid URL or empty';
  }
}

export function IsUrlOrEmpty(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUrlOrEmptyConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isJsonString', async: false })
export class IsJsonStringConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (typeof value !== 'string') return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Must be a valid JSON string';
  }
}

export function IsJsonString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsJsonStringConstraint,
    });
  };
}

/**
 * Zod schemas for common validations
 */

export const CommonZodSchemas = {
  email: z.string().email('Invalid email format'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
  
  url: z.string().url('Invalid URL format'),
  
  uuid: z.string().uuid('Invalid UUID format'),
  
  positiveInt: z.number().int().positive('Must be a positive integer'),
  
  nonNegativeInt: z.number().int().nonnegative('Must be a non-negative integer'),
  
  dateString: z.string().datetime('Invalid date format'),
  
  jsonString: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid JSON string' }
  ),
};

/**
 * Create a Zod schema for pagination
 */
export function createPaginationSchema() {
  return z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    skip: z.coerce.number().int().nonnegative().optional(),
    take: z.coerce.number().int().positive().max(100).optional(),
  });
}

/**
 * Create a Zod schema for sorting
 */
export function createSortSchema(allowedFields: string[]) {
  return z.object({
    field: z.enum(allowedFields as [string, ...string[]]),
    order: z.enum(['asc', 'desc']).default('desc'),
  });
}

/**
 * Create a Zod schema for date range
 */
export function createDateRangeSchema() {
  return z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: 'startDate must be before or equal to endDate' }
  );
}

