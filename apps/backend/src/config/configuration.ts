import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
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
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  SENTRY_ENVIRONMENT: z.string().optional(),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_PREFIX: z.string().default('/api'),
  
  // Security
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_TTL: z.string().transform(Number).default('60'),
  RATE_LIMIT_LIMIT: z.string().transform(Number).default('100'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const validateEnv = (): EnvConfig => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
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
    passwordReset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET || 'd-password-reset-template-id',
    emailConfirmation: process.env.EMAIL_TEMPLATE_EMAIL_CONFIRMATION || 'd-email-confirmation-template-id',
    invoice: process.env.EMAIL_TEMPLATE_INVOICE || 'd-invoice-template-id',
    newsletter: process.env.EMAIL_TEMPLATE_NEWSLETTER || 'd-newsletter-template-id',
  },
}));

// App configuration
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
  rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
}));

// Monitoring configuration
export const monitoringConfig = registerAs('monitoring', () => ({
  sentryDsn: process.env.SENTRY_DSN,
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
}));
