import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Stripe Price IDs - par plan et cycle de facturation
  STRIPE_PRICE_STARTER_MONTHLY: z.string().optional(),
  STRIPE_PRICE_STARTER_YEARLY: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_MONTHLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_YEARLY: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_YEARLY: z.string().optional(),
  // Legacy (deprecated - use specific monthly/yearly IDs)
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_BUSINESS: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().url().optional(),
  STRIPE_CANCEL_URL: z.string().url().optional(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // AI Providers
  OPENAI_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  
  // Email
  SENDGRID_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_URL: z.string().url().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Email Domain Configuration
  SENDGRID_DOMAIN: z.string().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_REPLY_TO: z.string().email().optional(),
  SMTP_HOST: z.string().default('smtp.sendgrid.net'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform(val => val === 'true').default('false'),
  SMTP_FROM: z.string().optional(),
  DOMAIN_VERIFIED: z.string().transform(val => val === 'true').default('false'),
  SPF_RECORD: z.string().optional(),
  DKIM_RECORD: z.string().optional(),
  DMARC_RECORD: z.string().optional(),
  
  // Email Templates
  EMAIL_TEMPLATE_WELCOME: z.string().optional(),
  EMAIL_TEMPLATE_PASSWORD_RESET: z.string().optional(),
  EMAIL_TEMPLATE_EMAIL_CONFIRMATION: z.string().optional(),
  EMAIL_TEMPLATE_INVOICE: z.string().optional(),
  EMAIL_TEMPLATE_NEWSLETTER: z.string().optional(),
  EMAIL_TEMPLATE_ORDER_CONFIRMATION: z.string().optional(),
  EMAIL_TEMPLATE_PRODUCTION_READY: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  SENTRY_ENVIRONMENT: z.string().optional(),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_PREFIX: z.string().default('/api'),
  FRONTEND_URL: z.string().url().optional(),
  
  // Security
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_TTL: z.string().transform(Number).default('60'),
  RATE_LIMIT_LIMIT: z.string().transform(Number).default('100'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const validateEnv = (): EnvConfig => {
  const logger = new Logger('Configuration');
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // Log les détails de l'erreur pour debugging
    logger.error('Environment validation error details:', {
      message: error.message,
      issues: error.issues || [],
      input: Object.keys(process.env).filter(key => key.startsWith('DATABASE') || key.startsWith('JWT') || key.startsWith('STRIPE')),
    });
    throw new Error(`Environment validation failed: ${error.message}`);
  }
};

// Database configuration
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

// Redis configuration
export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
}));

// JWT configuration
export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

// OAuth configuration
export const oauthConfig = registerAs('oauth', () => ({
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
export const stripeConfig = registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  // Price IDs par plan et cycle de facturation
  priceStarterMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  priceStarterYearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  priceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO,
  priceProYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  priceBusinessMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || process.env.STRIPE_PRICE_BUSINESS,
  priceBusinessYearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  priceEnterpriseMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  priceEnterpriseYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
  // Legacy (deprecated)
  pricePro: process.env.STRIPE_PRICE_PRO,
  priceBusiness: process.env.STRIPE_PRICE_BUSINESS,
  priceEnterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  // URLs
  successUrl: process.env.STRIPE_SUCCESS_URL || 'https://app.luneo.app/dashboard/billing/success',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'https://app.luneo.app/dashboard/billing/cancel',
}));

// Cloudinary configuration
export const cloudinaryConfig = registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}));

// AI configuration
export const aiConfig = registerAs('ai', () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  replicate: {
    apiToken: process.env.REPLICATE_API_TOKEN,
  },
}));

// Email configuration
export const emailConfig = registerAs('email', () => ({
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailgunUrl: process.env.MAILGUN_URL,
  fromEmail: process.env.FROM_EMAIL,
}));

// Email domain configuration
export const emailDomainConfig = registerAs('emailDomain', () => ({
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
export const appConfig = registerAs('app', () => {
  // Use API_PREFIX from env, or default to /api/v1 for backward compatibility
  // IMPORTANT: If API_PREFIX is /api, override to /api/v1 for consistency
  const envApiPrefix = process.env.API_PREFIX;
  const apiPrefix = (envApiPrefix === '/api' || !envApiPrefix) ? '/api/v1' : envApiPrefix;
  
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || process.env.$PORT || '3000', 10),
    apiPrefix: apiPrefix,
    frontendUrl: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.luneo.app',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  };
});

// Monitoring configuration
export const monitoringConfig = registerAs('monitoring', () => ({
  sentryDsn: process.env.SENTRY_DSN,
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  opentelemetry: {
    enabled: process.env.MONITORING_OPENTELEMETRY_ENABLED === 'true',
    exporter: process.env.MONITORING_OPENTELEMETRY_EXPORTER || 'jaeger',
    endpoint: process.env.MONITORING_OPENTELEMETRY_ENDPOINT || 'http://localhost:14268/api/traces',
  },
}));
