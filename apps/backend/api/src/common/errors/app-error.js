"use strict";
/**
 * AppError - Système de gestion d'erreurs typé et standardisé
 * Fournit des classes d'erreur avec codes, catégories et métadonnées
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppErrorFactory = exports.RateLimitError = exports.DatabaseError = exports.ExternalServiceError = exports.BusinessError = exports.NotFoundError = exports.ValidationError = exports.AuthorizationError = exports.AuthenticationError = exports.AppError = exports.ErrorCategory = exports.ErrorCode = void 0;
const common_1 = require("@nestjs/common");
/**
 * Codes d'erreur standardisés de l'application
 */
var ErrorCode;
(function (ErrorCode) {
    // Authentication & Authorization (1xxx)
    ErrorCode["AUTH_REQUIRED"] = "AUTH_1001";
    ErrorCode["AUTH_INVALID_TOKEN"] = "AUTH_1002";
    ErrorCode["AUTH_TOKEN_EXPIRED"] = "AUTH_1003";
    ErrorCode["AUTH_INVALID_CREDENTIALS"] = "AUTH_1004";
    ErrorCode["AUTH_INSUFFICIENT_PERMISSIONS"] = "AUTH_1005";
    ErrorCode["AUTH_ACCOUNT_LOCKED"] = "AUTH_1006";
    ErrorCode["AUTH_ACCOUNT_DISABLED"] = "AUTH_1007";
    // Validation (2xxx)
    ErrorCode["VALIDATION_FAILED"] = "VAL_2001";
    ErrorCode["VALIDATION_INVALID_INPUT"] = "VAL_2002";
    ErrorCode["VALIDATION_MISSING_REQUIRED"] = "VAL_2003";
    ErrorCode["VALIDATION_INVALID_FORMAT"] = "VAL_2004";
    ErrorCode["VALIDATION_OUT_OF_RANGE"] = "VAL_2005";
    // Resource Not Found (3xxx)
    ErrorCode["NOT_FOUND"] = "NOTFOUND_3001";
    ErrorCode["NOT_FOUND_USER"] = "NOTFOUND_3002";
    ErrorCode["NOT_FOUND_PRODUCT"] = "NOTFOUND_3003";
    ErrorCode["NOT_FOUND_DESIGN"] = "NOTFOUND_3004";
    ErrorCode["NOT_FOUND_ORDER"] = "NOTFOUND_3005";
    ErrorCode["NOT_FOUND_BRAND"] = "NOTFOUND_3006";
    ErrorCode["NOT_FOUND_RESOURCE"] = "NOTFOUND_3007";
    // Business Logic (4xxx)
    ErrorCode["BUSINESS_RULE_VIOLATION"] = "BIZ_4001";
    ErrorCode["BUSINESS_CONFLICT"] = "BIZ_4002";
    ErrorCode["BUSINESS_INVALID_STATE"] = "BIZ_4003";
    ErrorCode["BUSINESS_QUOTA_EXCEEDED"] = "BIZ_4004";
    ErrorCode["BUSINESS_OPERATION_NOT_ALLOWED"] = "BIZ_4005";
    // External Services (5xxx)
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXT_5001";
    ErrorCode["EXTERNAL_SERVICE_TIMEOUT"] = "EXT_5002";
    ErrorCode["EXTERNAL_SERVICE_UNAVAILABLE"] = "EXT_5003";
    ErrorCode["EXTERNAL_API_ERROR"] = "EXT_5004";
    ErrorCode["EXTERNAL_PAYMENT_ERROR"] = "EXT_5005";
    // Database (6xxx)
    ErrorCode["DATABASE_ERROR"] = "DB_6001";
    ErrorCode["DATABASE_CONSTRAINT_VIOLATION"] = "DB_6002";
    ErrorCode["DATABASE_CONNECTION_ERROR"] = "DB_6003";
    ErrorCode["DATABASE_QUERY_ERROR"] = "DB_6004";
    ErrorCode["DATABASE_TRANSACTION_ERROR"] = "DB_6005";
    // Rate Limiting (7xxx)
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_7001";
    ErrorCode["RATE_LIMIT_QUOTA_EXCEEDED"] = "RATE_7002";
    // Internal Server (9xxx)
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INT_9001";
    ErrorCode["INTERNAL_PROCESSING_ERROR"] = "INT_9002";
    ErrorCode["INTERNAL_CONFIGURATION_ERROR"] = "INT_9003";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Catégories d'erreur pour classification
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["NOT_FOUND"] = "not_found";
    ErrorCategory["BUSINESS_LOGIC"] = "business_logic";
    ErrorCategory["EXTERNAL_SERVICE"] = "external_service";
    ErrorCategory["DATABASE"] = "database";
    ErrorCategory["RATE_LIMITING"] = "rate_limiting";
    ErrorCategory["INTERNAL"] = "internal";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
/**
 * Classe de base AppError
 * Étend HttpException avec codes d'erreur standardisés
 */
class AppError extends common_1.HttpException {
    constructor(message, code, category, statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR, metadata = {}, isOperational = true) {
        super({
            success: false,
            error: code,
            message,
            category,
            metadata,
            timestamp: new Date().toISOString(),
        }, statusCode);
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
    toJSON() {
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
    static fromError(error, code = ErrorCode.INTERNAL_SERVER_ERROR, category = ErrorCategory.INTERNAL, metadata = {}) {
        return new AppError(error.message, code, category, common_1.HttpStatus.INTERNAL_SERVER_ERROR, {
            ...metadata,
            originalError: error.name,
            originalStack: error.stack,
        }, false);
    }
}
exports.AppError = AppError;
/**
 * Erreur d'authentification
 */
class AuthenticationError extends AppError {
    constructor(message, code, metadata = {}) {
        super(message, code, ErrorCategory.AUTHENTICATION, common_1.HttpStatus.UNAUTHORIZED, metadata);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Erreur d'autorisation
 */
class AuthorizationError extends AppError {
    constructor(message, code, metadata = {}) {
        super(message, code, ErrorCategory.AUTHORIZATION, common_1.HttpStatus.FORBIDDEN, metadata);
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Erreur de validation
 */
class ValidationError extends AppError {
    constructor(message, code = ErrorCode.VALIDATION_FAILED, metadata = {}, validationErrors) {
        super(message, code, ErrorCategory.VALIDATION, common_1.HttpStatus.BAD_REQUEST, {
            ...metadata,
            validationErrors,
        });
    }
}
exports.ValidationError = ValidationError;
/**
 * Erreur de ressource non trouvée
 */
class NotFoundError extends AppError {
    constructor(resourceType, resourceId, code = ErrorCode.NOT_FOUND, metadata = {}) {
        const message = resourceId
            ? `${resourceType} with id '${resourceId}' not found`
            : `${resourceType} not found`;
        super(message, code, ErrorCategory.NOT_FOUND, common_1.HttpStatus.NOT_FOUND, {
            ...metadata,
            resourceType,
            resourceId,
        });
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Erreur de logique métier
 */
class BusinessError extends AppError {
    constructor(message, code = ErrorCode.BUSINESS_RULE_VIOLATION, metadata = {}) {
        super(message, code, ErrorCategory.BUSINESS_LOGIC, common_1.HttpStatus.CONFLICT, metadata);
    }
}
exports.BusinessError = BusinessError;
/**
 * Erreur de service externe
 */
class ExternalServiceError extends AppError {
    constructor(serviceName, message, code = ErrorCode.EXTERNAL_SERVICE_ERROR, metadata = {}) {
        // Use SERVICE_UNAVAILABLE for EXTERNAL_SERVICE_UNAVAILABLE code, otherwise BAD_GATEWAY
        const statusCode = code === ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE
            ? common_1.HttpStatus.SERVICE_UNAVAILABLE
            : common_1.HttpStatus.BAD_GATEWAY;
        super(`${serviceName}: ${message}`, code, ErrorCategory.EXTERNAL_SERVICE, statusCode, {
            ...metadata,
            serviceName,
        });
    }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * Erreur de base de données
 */
class DatabaseError extends AppError {
    constructor(message, code = ErrorCode.DATABASE_ERROR, metadata = {}) {
        super(message, code, ErrorCategory.DATABASE, common_1.HttpStatus.INTERNAL_SERVER_ERROR, metadata, false);
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Erreur de rate limiting
 */
class RateLimitError extends AppError {
    constructor(message, code = ErrorCode.RATE_LIMIT_EXCEEDED, metadata = {}) {
        super(message, code, ErrorCategory.RATE_LIMITING, common_1.HttpStatus.TOO_MANY_REQUESTS, metadata);
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Helper pour créer des erreurs typées
 */
class AppErrorFactory {
    /**
     * Crée une erreur d'authentification
     */
    static authRequired(metadata) {
        return new AuthenticationError('Authentication required', ErrorCode.AUTH_REQUIRED, metadata);
    }
    /**
     * Crée une erreur d'invalid token
     */
    static invalidToken(metadata) {
        return new AuthenticationError('Invalid or expired token', ErrorCode.AUTH_INVALID_TOKEN, metadata);
    }
    /**
     * Crée une erreur d'invalid credentials
     */
    static invalidCredentials(metadata) {
        return new AuthenticationError('Invalid credentials', ErrorCode.AUTH_INVALID_CREDENTIALS, metadata);
    }
    /**
     * Crée une erreur d'autorisation
     */
    static insufficientPermissions(operation, metadata) {
        return new AuthorizationError(`Insufficient permissions for operation: ${operation}`, ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, { ...metadata, operation });
    }
    /**
     * Crée une erreur de validation
     */
    static validationFailed(message, validationErrors, metadata) {
        return new ValidationError(message, ErrorCode.VALIDATION_FAILED, metadata, validationErrors);
    }
    /**
     * Crée une erreur de ressource non trouvée
     */
    static notFound(resourceType, resourceId, metadata) {
        return new NotFoundError(resourceType, resourceId, ErrorCode.NOT_FOUND, metadata);
    }
    /**
     * Crée une erreur de conflit métier
     */
    static conflict(message, metadata) {
        return new BusinessError(message, ErrorCode.BUSINESS_CONFLICT, metadata);
    }
    /**
     * Crée une erreur de quota dépassé
     */
    static quotaExceeded(quotaType, metadata) {
        return new BusinessError(`Quota exceeded for ${quotaType}`, ErrorCode.BUSINESS_QUOTA_EXCEEDED, { ...metadata, quotaType });
    }
    /**
     * Crée une erreur de service externe
     */
    static externalService(serviceName, message, code = ErrorCode.EXTERNAL_SERVICE_ERROR, metadata) {
        return new ExternalServiceError(serviceName, message, code, metadata);
    }
    /**
     * Crée une erreur de base de données
     */
    static database(message, metadata) {
        return new DatabaseError(message, ErrorCode.DATABASE_ERROR, metadata);
    }
    /**
     * Crée une erreur de rate limit
     */
    static rateLimitExceeded(metadata) {
        return new RateLimitError('Rate limit exceeded', ErrorCode.RATE_LIMIT_EXCEEDED, metadata);
    }
}
exports.AppErrorFactory = AppErrorFactory;
