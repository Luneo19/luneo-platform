import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// Re-export currency configuration utilities
export { 
  currencyConfig, 
  CurrencyUtils, 
  SUPPORTED_CURRENCIES, 
  CURRENCY_SYMBOLS, 
  STRIPE_CURRENCIES,
  type SupportedCurrency,
} from './currency.config';

const logger = new Logger('EnvValidation');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * SVC-04: Validation stricte des variables d'environnement au démarrage
 * 
 * Variables critiques (obligatoires en production) :
 * - DATABASE_URL : Connexion PostgreSQL
 * - JWT_SECRET / JWT_REFRESH_SECRET : Authentification
 * - STRIPE_SECRET_KEY : Paiements (si billing activé)
 * 
 * Variables optionnelles (fonctionnalités désactivées si absentes) :
 * - Redis, OAuth, Cloudinary, AI providers, Email
 */

// Schéma de base avec toutes les variables
const baseEnvSchema = z.object({
  // Database - CRITIQUE
  DATABASE_URL: z.string().url().optional(),
  
  // Redis - Optionnel (cache/sessions)
  REDIS_URL: z.string().optional(),
  
  // JWT - CRITIQUE pour l'authentification
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // OAuth - Optionnel
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Stripe - CRITIQUE en production (pas de fallback hardcodé!)
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
  STRIPE_TRIAL_PERIOD_DAYS: z.string().transform(Number).optional(),
  
  // Cloudinary - Optionnel
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // AI Providers - Optionnel
  OPENAI_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  
  // Email - Optionnel (alertes désactivées si absent)
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
  
  // Currency - Multi-devises support
  DEFAULT_CURRENCY: z.enum(['EUR', 'USD', 'GBP', 'CHF', 'CAD']).default('EUR'),
  SUPPORTED_CURRENCIES: z.string().optional(),
  CURRENCY_EXCHANGE_RATE_USD: z.string().transform(Number).optional(),
  CURRENCY_EXCHANGE_RATE_GBP: z.string().transform(Number).optional(),
  CURRENCY_EXCHANGE_RATE_CHF: z.string().transform(Number).optional(),
  CURRENCY_EXCHANGE_RATE_CAD: z.string().transform(Number).optional(),
});

export type EnvConfig = z.infer<typeof baseEnvSchema>;

/**
 * Variables critiques qui DOIVENT être présentes en production
 */
const CRITICAL_VARS = {
  DATABASE_URL: 'Connexion base de données PostgreSQL',
  JWT_SECRET: 'Secret JWT pour l\'authentification (min 32 caractères)',
  JWT_REFRESH_SECRET: 'Secret JWT refresh (min 32 caractères)',
} as const;

/**
 * Variables recommandées pour la production (warning si absentes)
 */
const RECOMMENDED_PRODUCTION_VARS = {
  STRIPE_SECRET_KEY: 'Paiements Stripe (billing désactivé si absent)',
  STRIPE_WEBHOOK_SECRET: 'Webhook Stripe (events non vérifiés si absent)',
  SENTRY_DSN: 'Monitoring Sentry (erreurs non trackées si absent)',
  FRONTEND_URL: 'URL frontend pour CORS et redirections',
  SENDGRID_API_KEY: 'Emails transactionnels (notifications désactivées si absent)',
} as const;

/**
 * Vérifie la présence des variables critiques
 */
function checkCriticalVars(): { missing: string[]; details: string[] } {
  const missing: string[] = [];
  const details: string[] = [];
  
  for (const [key, description] of Object.entries(CRITICAL_VARS)) {
    if (!process.env[key]) {
      missing.push(key);
      details.push(`  ❌ ${key}: ${description}`);
    }
  }
  
  return { missing, details };
}

/**
 * Vérifie les variables recommandées en production
 */
function checkRecommendedVars(): { missing: string[]; details: string[] } {
  if (!isProduction) return { missing: [], details: [] };
  
  const missing: string[] = [];
  const details: string[] = [];
  
  for (const [key, description] of Object.entries(RECOMMENDED_PRODUCTION_VARS)) {
    if (!process.env[key]) {
      missing.push(key);
      details.push(`  ⚠️  ${key}: ${description}`);
    }
  }
  
  return { missing, details };
}

/**
 * Valide et parse les variables d'environnement au démarrage
 * SVC-04: Validation stricte avec arrêt en cas de variable critique manquante
 */
export const validateEnv = (): EnvConfig => {
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('🔍 Validation des variables d\'environnement...');
  logger.log(`   Environnement: ${process.env.NODE_ENV || 'development'}`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1. Vérifier les variables critiques
  const critical = checkCriticalVars();
  if (critical.missing.length > 0) {
    logger.error('❌ Variables d\'environnement CRITIQUES manquantes:');
    critical.details.forEach(detail => logger.error(detail));
    
    if (isProduction) {
      logger.error('');
      logger.error('🚨 ARRÊT: Variables critiques manquantes en PRODUCTION');
      logger.error('   L\'application ne peut pas démarrer sans ces variables.');
      logger.error('');
      throw new Error(
        `Variables critiques manquantes: ${critical.missing.join(', ')}. ` +
        'Définissez ces variables d\'environnement avant de démarrer en production.'
      );
    } else {
      logger.warn('⚠️  Mode développement: poursuite malgré les variables manquantes');
    }
  } else {
    logger.log('✅ Toutes les variables critiques sont présentes');
  }
  
  // 2. Vérifier les variables recommandées (warning seulement)
  const recommended = checkRecommendedVars();
  if (recommended.missing.length > 0) {
    logger.warn('');
    logger.warn('⚠️  Variables recommandées manquantes en production:');
    recommended.details.forEach(detail => logger.warn(detail));
    logger.warn('   Certaines fonctionnalités seront désactivées.');
  }
  
  // 3. Valider avec Zod (format et types)
  try {
    const config = baseEnvSchema.parse(process.env);
    
    logger.log('');
    logger.log('✅ Validation des variables d\'environnement réussie');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Log des fonctionnalités activées/désactivées
    logFeatureStatus();
    
    return config;
  } catch (error: any) {
    // Erreur Zod (format invalide)
    logger.error('');
    logger.error('❌ Erreur de validation (format invalide):');
    
    if (error.issues) {
      error.issues.forEach((issue: any) => {
        logger.error(`   ${issue.path.join('.')}: ${issue.message}`);
      });
    } else {
      logger.error(`   ${error.message}`);
    }
    
    if (isProduction) {
      throw new Error(`Validation des variables d'environnement échouée: ${error.message}`);
    }
    
    logger.warn('⚠️  Mode développement: poursuite avec configuration partielle');
    // En dev, retourner une config partielle
    return baseEnvSchema.partial().parse(process.env) as EnvConfig;
  }
};

/**
 * Log le statut des fonctionnalités basé sur les variables d'environnement
 */
function logFeatureStatus(): void {
  const features = [
    { name: 'Base de données', enabled: !!process.env.DATABASE_URL },
    { name: 'Redis (cache)', enabled: !!process.env.REDIS_URL },
    { name: 'Paiements Stripe', enabled: !!process.env.STRIPE_SECRET_KEY },
    { name: 'OAuth Google', enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) },
    { name: 'OAuth GitHub', enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) },
    { name: 'Cloudinary (images)', enabled: !!process.env.CLOUDINARY_API_KEY },
    { name: 'OpenAI', enabled: !!process.env.OPENAI_API_KEY },
    { name: 'Emails (SendGrid)', enabled: !!process.env.SENDGRID_API_KEY },
    { name: 'Monitoring Sentry', enabled: !!process.env.SENTRY_DSN },
  ];
  
  logger.log('');
  logger.log('📋 Statut des fonctionnalités:');
  features.forEach(f => {
    const status = f.enabled ? '✅' : '⬚ ';
    logger.log(`   ${status} ${f.name}`);
  });
  logger.log('');
}

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
  // Add-on Price IDs
  addons: {
    extraDesigns: {
      productId: process.env.STRIPE_ADDON_EXTRA_DESIGNS_PRODUCT_ID,
      monthly: process.env.STRIPE_ADDON_EXTRA_DESIGNS_MONTHLY,
      yearly: process.env.STRIPE_ADDON_EXTRA_DESIGNS_YEARLY,
    },
    extraStorage: {
      productId: process.env.STRIPE_ADDON_EXTRA_STORAGE_PRODUCT_ID,
      monthly: process.env.STRIPE_ADDON_EXTRA_STORAGE_MONTHLY,
      yearly: process.env.STRIPE_ADDON_EXTRA_STORAGE_YEARLY,
    },
    extraTeamMembers: {
      productId: process.env.STRIPE_ADDON_EXTRA_TEAM_MEMBERS_PRODUCT_ID,
      monthly: process.env.STRIPE_ADDON_EXTRA_TEAM_MEMBERS_MONTHLY,
      yearly: process.env.STRIPE_ADDON_EXTRA_TEAM_MEMBERS_YEARLY,
    },
    extraApiCalls: {
      productId: process.env.STRIPE_ADDON_EXTRA_API_CALLS_PRODUCT_ID,
      monthly: process.env.STRIPE_ADDON_EXTRA_API_CALLS_MONTHLY,
      yearly: process.env.STRIPE_ADDON_EXTRA_API_CALLS_YEARLY,
    },
    extraRenders3d: {
      productId: process.env.STRIPE_ADDON_EXTRA_RENDERS_3D_PRODUCT_ID,
      monthly: process.env.STRIPE_ADDON_EXTRA_RENDERS_3D_MONTHLY,
      yearly: process.env.STRIPE_ADDON_EXTRA_RENDERS_3D_YEARLY,
    },
  },
  // URLs
  successUrl: process.env.STRIPE_SUCCESS_URL || 'https://app.luneo.app/dashboard/billing/success',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'https://app.luneo.app/dashboard/billing/cancel',
  // Trial period (configurable)
  trialPeriodDays: parseInt(process.env.STRIPE_TRIAL_PERIOD_DAYS || '14', 10),
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

// Marketplace configuration
export const marketplaceConfig = registerAs('marketplace', () => ({
  // Pourcentage de la plateforme sur les ventes de templates (par défaut 30%)
  platformFeePercent: parseInt(process.env.MARKETPLACE_PLATFORM_FEE_PERCENT || '30', 10),
  // Montant minimum de payout en centimes (par défaut 10€)
  minPayoutCents: parseInt(process.env.MARKETPLACE_MIN_PAYOUT_CENTS || '1000', 10),
  // Stripe Connect fees percentage (par défaut 2%)
  connectFeesPercent: parseFloat(process.env.MARKETPLACE_CONNECT_FEES_PERCENT || '2'),
}));

// Referral configuration
export const referralConfig = registerAs('referral', () => ({
  // Pourcentage de commission par défaut pour les affiliés (par défaut 10%)
  commissionPercent: parseInt(process.env.REFERRAL_COMMISSION_PERCENT || '10', 10),
  // Durée du cookie de referral en jours (par défaut 30)
  cookieDurationDays: parseInt(process.env.REFERRAL_COOKIE_DURATION_DAYS || '30', 10),
  // Montant minimum de retrait en centimes (par défaut 50€)
  minWithdrawalCents: parseInt(process.env.REFERRAL_MIN_WITHDRAWAL_CENTS || '5000', 10),
}));
