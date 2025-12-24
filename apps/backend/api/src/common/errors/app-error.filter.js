"use strict";
/**
 * AppErrorFilter - Filtre d'exception amélioré pour AppError
 * Intègre avec le système de logging et sanitization
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppErrorFilter = void 0;
const common_1 = require("@nestjs/common");
const app_error_1 = require("./app-error");
const log_sanitizer_service_1 = require("@/libs/logger/log-sanitizer.service");
let AppErrorFilter = (() => {
    let _classDecorators = [(0, common_1.Catch)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppErrorFilter = _classThis = class {
        constructor() {
            this.logger = new common_1.Logger(AppErrorFilter.name);
            this.sanitizer = new log_sanitizer_service_1.LogSanitizerService();
        }
        catch(exception, host) {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse();
            const request = ctx.getRequest();
            let appError;
            let status;
            let errorResponse;
            // Handle AppError instances
            if (exception instanceof app_error_1.AppError) {
                appError = exception;
                status = exception.getStatus();
                errorResponse = exception.getResponse();
            }
            // Handle NestJS HttpException
            else if (exception instanceof common_1.HttpException) {
                status = exception.getStatus();
                const exceptionResponse = exception.getResponse();
                // Convert to AppError format
                if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                    errorResponse = {
                        success: false,
                        error: exceptionResponse.error || 'HTTP_ERROR',
                        message: exceptionResponse.message || exception.message,
                        statusCode: status,
                        timestamp: new Date().toISOString(),
                    };
                }
                else {
                    errorResponse = {
                        success: false,
                        error: 'HTTP_ERROR',
                        message: exception.message,
                        statusCode: status,
                        timestamp: new Date().toISOString(),
                    };
                }
                // Create AppError from HttpException for consistent logging
                appError = app_error_1.AppError.fromError(exception, this.mapHttpStatusToErrorCode(status), this.mapHttpStatusToCategory(status), {
                    path: request.url,
                    method: request.method,
                });
            }
            // Handle generic Error
            else if (exception instanceof Error) {
                appError = app_error_1.AppError.fromError(exception, app_error_1.ErrorCode.INTERNAL_SERVER_ERROR, app_error_1.ErrorCategory.INTERNAL, {
                    path: request.url,
                    method: request.method,
                });
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                errorResponse = appError.getResponse();
            }
            // Handle unknown errors
            else {
                appError = new app_error_1.AppError('An unexpected error occurred', app_error_1.ErrorCode.INTERNAL_SERVER_ERROR, app_error_1.ErrorCategory.INTERNAL, common_1.HttpStatus.INTERNAL_SERVER_ERROR, {
                    path: request.url,
                    method: request.method,
                    originalError: String(exception),
                }, false);
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                errorResponse = appError.getResponse();
            }
            // Sanitize error response for logging (remove sensitive data)
            const sanitizedError = this.sanitizer.sanitizeObject(appError.toJSON());
            // Log error with appropriate level
            if (status >= 500) {
                // Server errors - log with stack trace
                this.logger.error(`${request.method} ${request.url} - ${status} - ${appError.message}`, appError.stack, {
                    error: sanitizedError,
                    request: {
                        method: request.method,
                        url: request.url,
                        ip: request.ip,
                        userAgent: request.get('user-agent'),
                    },
                });
            }
            else if (status >= 400) {
                // Client errors - log as warning
                this.logger.warn(`${request.method} ${request.url} - ${status} - ${appError.message}`, {
                    error: sanitizedError,
                    request: {
                        method: request.method,
                        url: request.url,
                        ip: request.ip,
                    },
                });
            }
            // Add path to error response
            const finalResponse = {
                ...errorResponse,
                path: request.url,
            };
            response.status(status).json(finalResponse);
        }
        /**
         * Map HTTP status code to ErrorCode
         */
        mapHttpStatusToErrorCode(status) {
            switch (status) {
                case common_1.HttpStatus.BAD_REQUEST:
                    return app_error_1.ErrorCode.VALIDATION_FAILED;
                case common_1.HttpStatus.UNAUTHORIZED:
                    return app_error_1.ErrorCode.AUTH_REQUIRED;
                case common_1.HttpStatus.FORBIDDEN:
                    return app_error_1.ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
                case common_1.HttpStatus.NOT_FOUND:
                    return app_error_1.ErrorCode.NOT_FOUND;
                case common_1.HttpStatus.CONFLICT:
                    return app_error_1.ErrorCode.BUSINESS_CONFLICT;
                case common_1.HttpStatus.TOO_MANY_REQUESTS:
                    return app_error_1.ErrorCode.RATE_LIMIT_EXCEEDED;
                case common_1.HttpStatus.BAD_GATEWAY:
                case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                    return app_error_1.ErrorCode.EXTERNAL_SERVICE_ERROR;
                default:
                    return app_error_1.ErrorCode.INTERNAL_SERVER_ERROR;
            }
        }
        /**
         * Map HTTP status code to ErrorCategory
         */
        mapHttpStatusToCategory(status) {
            switch (status) {
                case common_1.HttpStatus.BAD_REQUEST:
                    return app_error_1.ErrorCategory.VALIDATION;
                case common_1.HttpStatus.UNAUTHORIZED:
                case common_1.HttpStatus.FORBIDDEN:
                    return app_error_1.ErrorCategory.AUTHORIZATION;
                case common_1.HttpStatus.NOT_FOUND:
                    return app_error_1.ErrorCategory.NOT_FOUND;
                case common_1.HttpStatus.CONFLICT:
                    return app_error_1.ErrorCategory.BUSINESS_LOGIC;
                case common_1.HttpStatus.TOO_MANY_REQUESTS:
                    return app_error_1.ErrorCategory.RATE_LIMITING;
                case common_1.HttpStatus.BAD_GATEWAY:
                case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                    return app_error_1.ErrorCategory.EXTERNAL_SERVICE;
                default:
                    return app_error_1.ErrorCategory.INTERNAL;
            }
        }
    };
    __setFunctionName(_classThis, "AppErrorFilter");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppErrorFilter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppErrorFilter = _classThis;
})();
exports.AppErrorFilter = AppErrorFilter;
