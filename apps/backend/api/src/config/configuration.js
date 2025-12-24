"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringConfig = exports.appConfig = exports.emailDomainConfig = exports.emailConfig = exports.aiConfig = exports.cloudinaryConfig = exports.stripeConfig = exports.oauthConfig = exports.jwtConfig = exports.redisConfig = exports.databaseConfig = exports.validateEnv = void 0;
const config_1 = require("@nestjs/config");
const zod_1 = require("zod");
const common_1 = require("@nestjs/common");
const envSchema = zod_1.z.object({
    // Database
    DATABASE_URL: zod_1.z.string().url(),
    // Redis
    REDIS_URL: zod_1.z.string().optional(),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    // OAuth
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GITHUB_CLIENT_ID: zod_1.z.string().optional(),
    GITHUB_CLIENT_SECRET: zod_1.z.string().optional(),
    // Stripe
    STRIPE_SECRET_KEY: zod_1.z.string().startsWith('sk_').optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    STRIPE_PRICE_PRO: zod_1.z.string().optional(),
    STRIPE_PRICE_BUSINESS: zod_1.z.string().optional(),
    STRIPE_PRICE_ENTERPRISE: zod_1.z.string().optional(),
    STRIPE_SUCCESS_URL: zod_1.z.string().url().optional(),
    STRIPE_CANCEL_URL: zod_1.z.string().url().optional(),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    // AI Providers
    OPENAI_API_KEY: zod_1.z.string().optional(),
    REPLICATE_API_TOKEN: zod_1.z.string().optional(),
    // Email
    SENDGRID_API_KEY: zod_1.z.string().optional(),
    MAILGUN_API_KEY: zod_1.z.string().optional(),
    MAILGUN_DOMAIN: zod_1.z.string().optional(),
    MAILGUN_URL: zod_1.z.string().url().optional(),
    FROM_EMAIL: zod_1.z.string().email().optional(),
    // Email Domain Configuration
    SENDGRID_DOMAIN: zod_1.z.string().optional(),
    SENDGRID_FROM_NAME: zod_1.z.string().optional(),
    SENDGRID_FROM_EMAIL: zod_1.z.string().email().optional(),
    SENDGRID_REPLY_TO: zod_1.z.string().email().optional(),
    SMTP_HOST: zod_1.z.string().default('smtp.sendgrid.net'),
    SMTP_PORT: zod_1.z.string().transform(Number).default('587'),
    SMTP_SECURE: zod_1.z.string().transform(val => val === 'true').default('false'),
    SMTP_FROM: zod_1.z.string().optional(),
    DOMAIN_VERIFIED: zod_1.z.string().transform(val => val === 'true').default('false'),
    SPF_RECORD: zod_1.z.string().optional(),
    DKIM_RECORD: zod_1.z.string().optional(),
    DMARC_RECORD: zod_1.z.string().optional(),
    // Email Templates
    EMAIL_TEMPLATE_WELCOME: zod_1.z.string().optional(),
    EMAIL_TEMPLATE_PASSWORD_RESET: zod_1.z.string().optional(),
    EMAIL_TEMPLATE_EMAIL_CONFIRMATION: zod_1.z.string().optional(),
    EMAIL_TEMPLATE_INVOICE: zod_1.z.string().optional(),
    EMAIL_TEMPLATE_NEWSLETTER: zod_1.z.string().optional(),
    EMAIL_TEMPLATE_ORDER_CONFIRMATION: zod_1.z.string().optional(),
    EMAIL_TEMPLATE_PRODUCTION_READY: zod_1.z.string().optional(),
    // Monitoring
    SENTRY_DSN: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    SENTRY_ENVIRONMENT: zod_1.z.string().optional(),
    // App
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    API_PREFIX: zod_1.z.string().default('/api'),
    FRONTEND_URL: zod_1.z.string().url().optional(),
    // Security
    CORS_ORIGIN: zod_1.z.string().default('*'),
    RATE_LIMIT_TTL: zod_1.z.string().transform(Number).default('60'),
    RATE_LIMIT_LIMIT: zod_1.z.string().transform(Number).default('100'),
});
const validateEnv = () => {
    const logger = new common_1.Logger('Configuration');
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        // Log les détails de l'erreur pour debugging
        logger.error('Environment validation error details:', {
            message: error.message,
            issues: error.issues || [],
            input: Object.keys(process.env).filter(key => key.startsWith('DATABASE') || key.startsWith('JWT') || key.startsWith('STRIPE')),
        });
        throw new Error(`Environment validation failed: ${error.message}`);
    }
};
exports.validateEnv = validateEnv;
// Database configuration
exports.databaseConfig = (0, config_1.registerAs)('database', () => ({
    url: process.env.DATABASE_URL,
}));
// Redis configuration
exports.redisConfig = (0, config_1.registerAs)('redis', () => ({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
}));
// JWT configuration
exports.jwtConfig = (0, config_1.registerAs)('jwt', () => ({
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
// OAuth configuration
exports.oauthConfig = (0, config_1.registerAs)('oauth', () => ({
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
}));
// Stripe configuration
exports.stripeConfig = (0, config_1.registerAs)('stripe', () => ({
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    pricePro: process.env.STRIPE_PRICE_PRO,
    priceBusiness: process.env.STRIPE_PRICE_BUSINESS,
    priceEnterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    successUrl: process.env.STRIPE_SUCCESS_URL || 'https://app.luneo.app/dashboard/billing/success',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'https://app.luneo.app/dashboard/billing/cancel',
}));
// Cloudinary configuration
exports.cloudinaryConfig = (0, config_1.registerAs)('cloudinary', () => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
}));
// AI configuration
exports.aiConfig = (0, config_1.registerAs)('ai', () => ({
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
    },
    replicate: {
        apiToken: process.env.REPLICATE_API_TOKEN,
    },
}));
// Email configuration
exports.emailConfig = (0, config_1.registerAs)('email', () => ({
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    mailgunApiKey: process.env.MAILGUN_API_KEY,
    mailgunDomain: process.env.MAILGUN_DOMAIN,
    mailgunUrl: process.env.MAILGUN_URL,
    fromEmail: process.env.FROM_EMAIL,
}));
// Email domain configuration
exports.emailDomainConfig = (0, config_1.registerAs)('emailDomain', () => ({
    sendgridDomain: process.env.SENDGRID_DOMAIN || 'luneo.app',
    sendgridFromName: process.env.SENDGRID_FROM_NAME || 'Luneo',
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@luneo.app',
    sendgridReplyTo: process.env.SENDGRID_REPLY_TO || 'support@luneo.app',
    smtpHost: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpFrom: process.env.SMTP_FROM || `Luneo <no-reply@luneo.app>`,
    domainVerified: process.env.DOMAIN_VERIFIED === 'true',
    spfRecord: process.env.SPF_RECORD,
    dkimRecord: process.env.DKIM_RECORD,
    dmarcRecord: process.env.DMARC_RECORD,
    emailTemplates: {
        welcome: process.env.EMAIL_TEMPLATE_WELCOME || 'd-welcome-template-id',
        orderConfirmation: process.env.EMAIL_TEMPLATE_ORDER_CONFIRMATION || 'd-order-confirmation-template-id',
        productionReady: process.env.EMAIL_TEMPLATE_PRODUCTION_READY || 'd-production-ready-template-id',
        passwordReset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET || 'd-password-reset-template-id',
        emailConfirmation: process.env.EMAIL_TEMPLATE_EMAIL_CONFIRMATION || 'd-email-confirmation-template-id',
        invoice: process.env.EMAIL_TEMPLATE_INVOICE || 'd-invoice-template-id',
        newsletter: process.env.EMAIL_TEMPLATE_NEWSLETTER || 'd-newsletter-template-id',
    },
}));
// App configuration
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || '/api',
    frontendUrl: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
}));
// Monitoring configuration
exports.monitoringConfig = (0, config_1.registerAs)('monitoring', () => ({
    sentryDsn: process.env.SENTRY_DSN,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    opentelemetry: {
        enabled: process.env.MONITORING_OPENTELEMETRY_ENABLED === 'true',
        exporter: process.env.MONITORING_OPENTELEMETRY_EXPORTER || 'jaeger',
        endpoint: process.env.MONITORING_OPENTELEMETRY_ENDPOINT || 'http://localhost:14268/api/traces',
    },
}));
