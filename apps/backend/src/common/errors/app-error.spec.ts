/**
 * AppError - Tests unitaires
 * Tests pour le système de gestion d'erreurs
 */

import { HttpStatus } from '@nestjs/common';
import {
  AppError,
  AppErrorFactory,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  BusinessError,
  DatabaseError,
  RateLimitError,
  ErrorCode,
  ErrorCategory,
} from './app-error';

describe('AppError', () => {
  describe('AppError base class', () => {
    it('should create error with all properties', () => {
      const error = new AppError(
        'Test error',
        ErrorCode.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        HttpStatus.INTERNAL_SERVER_ERROR,
        { resourceId: '123' },
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(error.category).toBe(ErrorCategory.INTERNAL);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.metadata?.resourceId).toBe('123');
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with 401 status', () => {
      const error = new AuthenticationError(
        'Invalid token',
        ErrorCode.AUTH_INVALID_TOKEN,
      );

      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with 403 status', () => {
      const error = new AuthorizationError(
        'Access denied',
        ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      );

      expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError(
        'Invalid input',
        ErrorCode.VALIDATION_FAILED,
        {},
        [{ field: 'email', message: 'Email is required' }],
      );

      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.metadata?.validationErrors).toBeDefined();
      expect(error.metadata?.validationErrors).toEqual([{ field: 'email', message: 'Email is required' }]);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource info', () => {
      const error = new NotFoundError(
        'Product',
        'prod_123',
        ErrorCode.NOT_FOUND_PRODUCT,
        { resourceType: 'Product', resourceId: 'prod_123' }
      );

      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(error.category).toBe(ErrorCategory.NOT_FOUND);
      expect(error.message).toContain('Product');
      expect(error.metadata?.resourceType).toBe('Product');
      expect(error.metadata?.resourceId).toBe('prod_123');
    });
  });

  describe('BusinessError', () => {
    it('should create business error with 409 status', () => {
      const error = new BusinessError(
        'Conflict',
        ErrorCode.BUSINESS_CONFLICT,
      );

      expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error with service name', () => {
      const error = AppErrorFactory.externalService(
        'Stripe',
        'Payment failed',
        ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      );

      expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(error.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(error.metadata?.serviceName).toBe('Stripe');
    });
  });

  describe('DatabaseError', () => {
    it('should create database error', () => {
      const error = new DatabaseError('Database connection failed');

      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with 429 status', () => {
      const error = new RateLimitError('Rate limit exceeded');

      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(error.category).toBe(ErrorCategory.RATE_LIMITING);
    });
  });

  describe('AppErrorFactory', () => {
    it('should create unauthorized error', () => {
      const error = AppErrorFactory.authRequired({ userId: '123' });

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED);
      expect(error.metadata?.userId).toBe('123');
    });

    it('should create forbidden error', () => {
      const error = AppErrorFactory.insufficientPermissions('read:product', { resourceId: '123' });

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.code).toBe(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS);
    });

    it('should create validation failed error', () => {
      const error = AppErrorFactory.validationFailed(
        'Validation failed',
        [{ field: 'email', message: 'Email is required' }],
        { field: 'email' }
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('should create not found error', () => {
      const error = AppErrorFactory.notFound('Product', '123');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('should create internal error', () => {
      const error = new AppError(
        'Internal server error',
        ErrorCode.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        HttpStatus.INTERNAL_SERVER_ERROR,
        { operation: 'test' }
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    });
  });
});

