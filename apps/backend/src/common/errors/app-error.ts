/**
 * AppError - Système de gestion d'erreurs typé et standardisé
 * Fournit des classes d'erreur avec codes, catégories et métadonnées
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Codes d'erreur standardisés de l'application
 */
export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  AUTH_REQUIRED = 'AUTH_1001',
  AUTH_INVALID_TOKEN = 'AUTH_1002',
  AUTH_TOKEN_EXPIRED = 'AUTH_1003',
  AUTH_INVALID_CREDENTIALS = 'AUTH_1004',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_1005',
  AUTH_ACCOUNT_LOCKED = 'AUTH_1006',
  AUTH_ACCOUNT_DISABLED = 'AUTH_1007',

  // Validation (2xxx)
  VALIDATION_FAILED = 'VAL_2001',
  VALIDATION_INVALID_INPUT = 'VAL_2002',
  VALIDATION_MISSING_REQUIRED = 'VAL_2003',
  VALIDATION_INVALID_FORMAT = 'VAL_2004',
  VALIDATION_OUT_OF_RANGE = 'VAL_2005',

  // Resource Not Found (3xxx)
  NOT_FOUND = 'NOTFOUND_3001',
  NOT_FOUND_USER = 'NOTFOUND_3002',
  NOT_FOUND_PRODUCT = 'NOTFOUND_3003',
  NOT_FOUND_DESIGN = 'NOTFOUND_3004',
  NOT_FOUND_ORDER = 'NOTFOUND_3005',
  NOT_FOUND_BRAND = 'NOTFOUND_3006',
  NOT_FOUND_RESOURCE = 'NOTFOUND_3007',

  // Business Logic (4xxx)
  BUSINESS_RULE_VIOLATION = 'BIZ_4001',
  BUSINESS_CONFLICT = 'BIZ_4002',
  BUSINESS_INVALID_STATE = 'BIZ_4003',
  BUSINESS_QUOTA_EXCEEDED = 'BIZ_4004',
  BUSINESS_OPERATION_NOT_ALLOWED = 'BIZ_4005',

  // External Services (5xxx)
  EXTERNAL_SERVICE_ERROR = 'EXT_5001',
  EXTERNAL_SERVICE_TIMEOUT = 'EXT_5002',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXT_5003',
  EXTERNAL_API_ERROR = 'EXT_5004',
  EXTERNAL_PAYMENT_ERROR = 'EXT_5005',

  // Database (6xxx)
  DATABASE_ERROR = 'DB_6001',
  DATABASE_CONSTRAINT_VIOLATION = 'DB_6002',
  DATABASE_CONNECTION_ERROR = 'DB_6003',
  DATABASE_QUERY_ERROR = 'DB_6004',
  DATABASE_TRANSACTION_ERROR = 'DB_6005',

  // Rate Limiting (7xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_7001',
  RATE_LIMIT_QUOTA_EXCEEDED = 'RATE_7002',

  // Internal Server (9xxx)
  INTERNAL_SERVER_ERROR = 'INT_9001',
  INTERNAL_PROCESSING_ERROR = 'INT_9002',
  INTERNAL_CONFIGURATION_ERROR = 'INT_9003',
}

/**
 * Catégories d'erreur pour classification
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  RATE_LIMITING = 'rate_limiting',
  INTERNAL = 'internal',
}

/**
 * Interface pour les métadonnées d'erreur
 */
export interface ErrorMetadata {
  [key: string]: unknown;
  resourceId?: string;
  resourceType?: string;
  userId?: string;
  operation?: string;
  context?: Record<string, unknown>;
}

/**
 * Classe de base AppError
 * Étend HttpException avec codes d'erreur standardisés
 */
export class AppError extends HttpException {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly metadata: ErrorMetadata;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    category: ErrorCategory,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    metadata: ErrorMetadata = {},
    isOperational: boolean = true,
  ) {
    super(
      {
        success: false,
        error: code,
        message,
        category,
        metadata,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );

    this.code = code;
    this.category = category;
    this.metadata = metadata;
    this.timestamp = new Date();
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }

  /**
   * Convertit l'erreur en objet JSON pour logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      statusCode: this.getStatus(),
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
      stack: this.stack,
    };
  }

  /**
   * Crée une erreur à partir d'une erreur existante
   */
  static fromError(
    error: Error,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    metadata: ErrorMetadata = {},
  ): AppError {
    return new AppError(
      error.message,
      code,
      category,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        ...metadata,
        originalError: error.name,
        originalStack: error.stack,
      },
      false,
    );
  }
}

/**
 * Erreur d'authentification
 */
export class AuthenticationError extends AppError {
  constructor(message: string, code: ErrorCode, metadata: ErrorMetadata = {}) {
    super(
      message,
      code,
      ErrorCategory.AUTHENTICATION,
      HttpStatus.UNAUTHORIZED,
      metadata,
    );
  }
}

/**
 * Erreur d'autorisation
 */
export class AuthorizationError extends AppError {
  constructor(message: string, code: ErrorCode, metadata: ErrorMetadata = {}) {
    super(
      message,
      code,
      ErrorCategory.AUTHORIZATION,
      HttpStatus.FORBIDDEN,
      metadata,
    );
  }
}

/**
 * Erreur de validation
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.VALIDATION_FAILED,
    metadata: ErrorMetadata = {},
    validationErrors?: Array<{ field: string; message: string }>,
  ) {
    super(
      message,
      code,
      ErrorCategory.VALIDATION,
      HttpStatus.BAD_REQUEST,
      {
        ...metadata,
        validationErrors,
      },
    );
  }
}

/**
 * Erreur de ressource non trouvée
 */
export class NotFoundError extends AppError {
  constructor(
    resourceType: string,
    resourceId?: string,
    code: ErrorCode = ErrorCode.NOT_FOUND,
    metadata: ErrorMetadata = {},
  ) {
    const message = resourceId
      ? `${resourceType} with id '${resourceId}' not found`
      : `${resourceType} not found`;

    super(
      message,
      code,
      ErrorCategory.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      {
        ...metadata,
        resourceType,
        resourceId,
      },
    );
  }
}

/**
 * Erreur de logique métier
 */
export class BusinessError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION,
    metadata: ErrorMetadata = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.BUSINESS_LOGIC,
      HttpStatus.CONFLICT,
      metadata,
    );
  }
}

/**
 * Erreur de service externe
 */
export class ExternalServiceError extends AppError {
  constructor(
    serviceName: string,
    message: string,
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    metadata: ErrorMetadata = {},
  ) {
    // Use SERVICE_UNAVAILABLE for EXTERNAL_SERVICE_UNAVAILABLE code, otherwise BAD_GATEWAY
    const statusCode = code === ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE
      ? HttpStatus.SERVICE_UNAVAILABLE
      : HttpStatus.BAD_GATEWAY;
    
    super(
      `${serviceName}: ${message}`,
      code,
      ErrorCategory.EXTERNAL_SERVICE,
      statusCode,
      {
        ...metadata,
        serviceName,
      },
    );
  }
}

/**
 * Erreur de base de données
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.DATABASE_ERROR,
    metadata: ErrorMetadata = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.DATABASE,
      HttpStatus.INTERNAL_SERVER_ERROR,
      metadata,
      false, // Database errors are not operational
    );
  }
}

/**
 * Erreur de rate limiting
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.RATE_LIMIT_EXCEEDED,
    metadata: ErrorMetadata = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.RATE_LIMITING,
      HttpStatus.TOO_MANY_REQUESTS,
      metadata,
    );
  }
}

/**
 * Helper pour créer des erreurs typées
 */
export class AppErrorFactory {
  /**
   * Crée une erreur d'authentification
   */
  static authRequired(metadata?: ErrorMetadata): AuthenticationError {
    return new AuthenticationError(
      'Authentication required',
      ErrorCode.AUTH_REQUIRED,
      metadata,
    );
  }

  /**
   * Crée une erreur d'invalid token
   */
  static invalidToken(metadata?: ErrorMetadata): AuthenticationError {
    return new AuthenticationError(
      'Invalid or expired token',
      ErrorCode.AUTH_INVALID_TOKEN,
      metadata,
    );
  }

  /**
   * Crée une erreur d'invalid credentials
   */
  static invalidCredentials(metadata?: ErrorMetadata): AuthenticationError {
    return new AuthenticationError(
      'Invalid credentials',
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      metadata,
    );
  }

  /**
   * Crée une erreur d'autorisation
   */
  static insufficientPermissions(
    operation: string,
    metadata?: ErrorMetadata,
  ): AuthorizationError {
    return new AuthorizationError(
      `Insufficient permissions for operation: ${operation}`,
      ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      { ...metadata, operation },
    );
  }

  /**
   * Crée une erreur de validation
   */
  static validationFailed(
    message: string,
    validationErrors?: Array<{ field: string; message: string }>,
    metadata?: ErrorMetadata,
  ): ValidationError {
    return new ValidationError(
      message,
      ErrorCode.VALIDATION_FAILED,
      metadata,
      validationErrors,
    );
  }

  /**
   * Crée une erreur de ressource non trouvée
   */
  static notFound(
    resourceType: string,
    resourceId?: string,
    metadata?: ErrorMetadata,
  ): NotFoundError {
    return new NotFoundError(resourceType, resourceId, ErrorCode.NOT_FOUND, metadata);
  }

  /**
   * Crée une erreur de conflit métier
   */
  static conflict(message: string, metadata?: ErrorMetadata): BusinessError {
    return new BusinessError(message, ErrorCode.BUSINESS_CONFLICT, metadata);
  }

  /**
   * Crée une erreur de quota dépassé
   */
  static quotaExceeded(
    quotaType: string,
    metadata?: ErrorMetadata,
  ): BusinessError {
    return new BusinessError(
      `Quota exceeded for ${quotaType}`,
      ErrorCode.BUSINESS_QUOTA_EXCEEDED,
      { ...metadata, quotaType },
    );
  }

  /**
   * Crée une erreur de service externe
   */
  static externalService(
    serviceName: string,
    message: string,
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    metadata?: ErrorMetadata,
  ): ExternalServiceError {
    return new ExternalServiceError(serviceName, message, code, metadata);
  }

  /**
   * Crée une erreur de base de données
   */
  static database(message: string, metadata?: ErrorMetadata): DatabaseError {
    return new DatabaseError(message, ErrorCode.DATABASE_ERROR, metadata);
  }

  /**
   * Crée une erreur de rate limit
   */
  static rateLimitExceeded(metadata?: ErrorMetadata): RateLimitError {
    return new RateLimitError(
      'Rate limit exceeded',
      ErrorCode.RATE_LIMIT_EXCEEDED,
      metadata,
    );
  }
}

