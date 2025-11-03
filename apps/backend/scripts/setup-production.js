#!/usr/bin/env node

/**
 * Script de configuration automatique pour la production
 * Configure SendGrid et tous les services pour le déploiement production
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const axios = require('axios');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logQuestion(message) {
  log(`❓ ${message}`, 'magenta');
}

// Interface de lecture
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Configuration par défaut production
const defaultConfig = {
  // Environment
  NODE_ENV: 'production',
  PORT: '3000',
  API_PREFIX: '/api/v1',
  CORS_ORIGIN: 'https://app.luneo.app',
  
  // SendGrid
  SENDGRID_DOMAIN: 'luneo.app',
  SENDGRID_FROM_NAME: 'Luneo',
  SENDGRID_FROM_EMAIL: 'no-reply@luneo.app',
  SENDGRID_REPLY_TO: 'support@luneo.app',
  SMTP_HOST: 'smtp.sendgrid.net',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
  DOMAIN_VERIFIED: 'true',
  
  // DNS Records
  SPF_RECORD: 'v=spf1 include:_spf.sendgrid.net ~all',
  DKIM_RECORD: 's1.domainkey.u55797360.wl111.sendgrid.net',
  DMARC_RECORD: 'v=DMARC1; p=quarantine; rua=mailto:rapports.dmarc.luneo@gmail.com; ruf=mailto:rapports.dmarc.luneo@gmail.com; fo=1; adkim=r; aspf=r;',
  
  // URLs
  FRONTEND_URL: 'https://app.luneo.app',
  API_URL: 'https://api.luneo.app',
  
  // Security
  RATE_LIMIT_TTL: '60',
  RATE_LIMIT_LIMIT: '1000',
  HELMET_ENABLED: 'true',
  COMPRESSION_ENABLED: 'true',
  
  // Monitoring
  SENTRY_ENVIRONMENT: 'production',
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'json',
  
  // Email Limits
  MAX_EMAILS_PER_HOUR: '10000',
  MAX_EMAILS_PER_DAY: '100000',
  MAX_RECIPIENTS_PER_EMAIL: '100'
};

async function testSendGridAPI(apiKey) {
  try {
    logInfo('Test de la clé API SendGrid...');
    const response = await axios.get('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      logSuccess('Clé API SendGrid valide !');
      return { valid: true, data: response.data };
    }
  } catch (error) {
    logError(`Clé API SendGrid invalide: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    return { valid: false, error: error.message };
  }
}

async function testDomainAuthentication(apiKey, domain) {
  try {
    logInfo(`Vérification de l'authentification du domaine ${domain}...`);
    const response = await axios.get(`https://api.sendgrid.com/v3/whitelabel/domains`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const domainConfig = response.data.results.find(d => d.domain === domain);
    if (domainConfig && domainConfig.valid) {
      logSuccess(`Domaine ${domain} authentifié et vérifié !`);
      return { valid: true, data: domainConfig };
    } else {
      logWarning(`Domaine ${domain} non vérifié ou en attente`);
      return { valid: false, data: domainConfig };
    }
  } catch (error) {
    logError(`Erreur lors de la vérification du domaine: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

function generateProductionEnv(config) {
  return `# ==============================================
# CONFIGURATION PRODUCTION LUneo
# Généré le: ${new Date().toISOString()}
# ==============================================

# Environment
NODE_ENV=${config.NODE_ENV}
PORT=${config.PORT}
API_PREFIX=${config.API_PREFIX}
CORS_ORIGIN=${config.CORS_ORIGIN}

# Database Production
DATABASE_URL="${config.DATABASE_URL || 'postgresql://luneo_user:secure_password@prod-db.luneo.app:5432/luneo_production'}"

# Redis Production
REDIS_URL="${config.REDIS_URL || 'redis://prod-redis.luneo.app:6379'}"

# JWT Production (CHANGEZ CES VALEURS!)
JWT_SECRET="${config.JWT_SECRET || 'your-super-secure-production-jwt-secret-32-chars-long'}"
JWT_REFRESH_SECRET="${config.JWT_REFRESH_SECRET || 'your-super-secure-production-refresh-secret-32-chars-long'}"
JWT_EXPIRES_IN="${config.JWT_EXPIRES_IN || '15m'}"
JWT_REFRESH_EXPIRES_IN="${config.JWT_REFRESH_EXPIRES_IN || '7d'}"

# OAuth Production
GOOGLE_CLIENT_ID="${config.GOOGLE_CLIENT_ID || ''}"
GOOGLE_CLIENT_SECRET="${config.GOOGLE_CLIENT_SECRET || ''}"
GITHUB_CLIENT_ID="${config.GITHUB_CLIENT_ID || ''}"
GITHUB_CLIENT_SECRET="${config.GITHUB_CLIENT_SECRET || ''}"

# Stripe Production
STRIPE_SECRET_KEY="${config.STRIPE_SECRET_KEY || 'sk_live_your-production-stripe-secret-key'}"
STRIPE_WEBHOOK_SECRET="${config.STRIPE_WEBHOOK_SECRET || 'whsec_your-production-stripe-webhook-secret'}"

# Cloudinary Production
CLOUDINARY_CLOUD_NAME="${config.CLOUDINARY_CLOUD_NAME || 'luneo-production'}"
CLOUDINARY_API_KEY="${config.CLOUDINARY_API_KEY || ''}"
CLOUDINARY_API_SECRET="${config.CLOUDINARY_API_SECRET || ''}"

# AI Providers Production
OPENAI_API_KEY="${config.OPENAI_API_KEY || ''}"
REPLICATE_API_TOKEN="${config.REPLICATE_API_TOKEN || ''}"

# ==============================================
# CONFIGURATION EMAIL PRODUCTION
# ==============================================

# SendGrid Production Configuration
SENDGRID_API_KEY="${config.SENDGRID_API_KEY}"
SENDGRID_DOMAIN="${config.SENDGRID_DOMAIN}"
SENDGRID_FROM_NAME="${config.SENDGRID_FROM_NAME}"
SENDGRID_FROM_EMAIL="${config.SENDGRID_FROM_EMAIL}"
SENDGRID_REPLY_TO="${config.SENDGRID_REPLY_TO}"

# SMTP Production Configuration
SMTP_HOST="${config.SMTP_HOST}"
SMTP_PORT="${config.SMTP_PORT}"
SMTP_SECURE="${config.SMTP_SECURE}"
SMTP_FROM="${config.SMTP_FROM}"

# Domain Verification Status
DOMAIN_VERIFIED="${config.DOMAIN_VERIFIED}"

# DNS Records Production
SPF_RECORD="${config.SPF_RECORD}"
DKIM_RECORD="${config.DKIM_RECORD}"
DMARC_RECORD="${config.DMARC_RECORD}"

# Email Templates Production
EMAIL_TEMPLATE_WELCOME="${config.EMAIL_TEMPLATE_WELCOME || 'd-welcome-production-template'}"
EMAIL_TEMPLATE_PASSWORD_RESET="${config.EMAIL_TEMPLATE_PASSWORD_RESET || 'd-password-reset-production-template'}"
EMAIL_TEMPLATE_EMAIL_CONFIRMATION="${config.EMAIL_TEMPLATE_EMAIL_CONFIRMATION || 'd-email-confirmation-production-template'}"
EMAIL_TEMPLATE_INVOICE="${config.EMAIL_TEMPLATE_INVOICE || 'd-invoice-production-template'}"
EMAIL_TEMPLATE_NEWSLETTER="${config.EMAIL_TEMPLATE_NEWSLETTER || 'd-newsletter-production-template'}"

# Mailgun Fallback Production
MAILGUN_API_KEY="${config.MAILGUN_API_KEY || ''}"
MAILGUN_DOMAIN="${config.MAILGUN_DOMAIN || 'mg.luneo.app'}"
MAILGUN_URL="${config.MAILGUN_URL || 'https://api.mailgun.net'}"

# Legacy Email Configuration
FROM_EMAIL="${config.FROM_EMAIL || 'noreply@luneo.app'}"

# ==============================================
# MONITORING ET SÉCURITÉ PRODUCTION
# ==============================================

# Sentry Production
SENTRY_DSN="${config.SENTRY_DSN || ''}"
SENTRY_ENVIRONMENT="${config.SENTRY_ENVIRONMENT}"

# Rate Limiting Production
RATE_LIMIT_TTL="${config.RATE_LIMIT_TTL}"
RATE_LIMIT_LIMIT="${config.RATE_LIMIT_LIMIT}"

# Security Headers
HELMET_ENABLED="${config.HELMET_ENABLED}"
COMPRESSION_ENABLED="${config.COMPRESSION_ENABLED}"

# ==============================================
# URLS PRODUCTION
# ==============================================

# Frontend Production URL
FRONTEND_URL="${config.FRONTEND_URL}"

# API Production URL
API_URL="${config.API_URL}"

# Webhook URLs
SENDGRID_WEBHOOK_URL="${config.SENDGRID_WEBHOOK_URL || 'https://api.luneo.app/webhooks/sendgrid'}"
STRIPE_WEBHOOK_URL="${config.STRIPE_WEBHOOK_URL || 'https://api.luneo.app/webhooks/stripe'}"

# ==============================================
# CONFIGURATION AVANCÉE PRODUCTION
# ==============================================

# Logging Production
LOG_LEVEL="${config.LOG_LEVEL}"
LOG_FORMAT="${config.LOG_FORMAT}"

# Health Check
HEALTH_CHECK_ENABLED="true"
HEALTH_CHECK_INTERVAL="30000"

# Performance Monitoring
PERFORMANCE_MONITORING="true"
SLOW_QUERY_THRESHOLD="1000"

# Email Limits Production
MAX_EMAILS_PER_HOUR="${config.MAX_EMAILS_PER_HOUR}"
MAX_EMAILS_PER_DAY="${config.MAX_EMAILS_PER_DAY}"
MAX_RECIPIENTS_PER_EMAIL="${config.MAX_RECIPIENTS_PER_EMAIL}"

# Backup Configuration
BACKUP_ENABLED="true"
BACKUP_INTERVAL="24h"
BACKUP_RETENTION_DAYS="30"

# ==============================================
# CONFIGURATION SÉCURITÉ AVANCÉE
# ==============================================

# CORS Production (Restrictif)
ALLOWED_ORIGINS="${config.ALLOWED_ORIGINS || 'https://app.luneo.app,https://admin.luneo.app'}"

# Session Security
SESSION_SECRET="${config.SESSION_SECRET || 'your-super-secure-session-secret-32-chars'}"
SESSION_COOKIE_SECURE="true"
SESSION_COOKIE_HTTP_ONLY="true"
SESSION_COOKIE_SAME_SITE="strict"

# API Security
API_KEY_HEADER="x-api-key"
API_KEY_REQUIRED="true"

# Database Security
DB_SSL_ENABLED="true"
DB_SSL_REJECT_UNAUTHORIZED="true"

# Redis Security
REDIS_PASSWORD="${config.REDIS_PASSWORD || ''}"
REDIS_TLS_ENABLED="true"
`;
}

async function main() {
  log('🚀 Configuration Production SendGrid', 'bright');
  log('=====================================\n', 'bright');
  
  const config = { ...defaultConfig };
  
  // 1. Configuration SendGrid
  logInfo('📧 Configuration SendGrid Production');
  const sendgridApiKey = await askQuestion('Clé API SendGrid Production (commence par SG.) : ');
  
  if (!sendgridApiKey.startsWith('SG.')) {
    logError('La clé API doit commencer par "SG."');
    rl.close();
    return;
  }
  
  config.SENDGRID_API_KEY = sendgridApiKey;
  
  // Test de la clé API
  const apiTest = await testSendGridAPI(sendgridApiKey);
  if (!apiTest.valid) {
    logError('Clé API SendGrid invalide. Arrêt de la configuration.');
    rl.close();
    return;
  }
  
  // Test de l'authentification du domaine
  const domainTest = await testDomainAuthentication(sendgridApiKey, config.SENDGRID_DOMAIN);
  if (!domainTest.valid) {
    logWarning('Domaine non vérifié. Continuez quand même ? (y/n)');
    const continueAnyway = await askQuestion('');
    if (continueAnyway.toLowerCase() !== 'y') {
      rl.close();
      return;
    }
  }
  
  // 2. Configuration SMTP From
  config.SMTP_FROM = `${config.SENDGRID_FROM_NAME} <${config.SENDGRID_FROM_EMAIL}>`;
  
  // 3. Configuration des URLs
  const apiUrl = await askQuestion(`URL de l'API Production [${config.API_URL}] : `);
  if (apiUrl) config.API_URL = apiUrl;
  
  const frontendUrl = await askQuestion(`URL du Frontend Production [${config.FRONTEND_URL}] : `);
  if (frontendUrl) config.FRONTEND_URL = frontendUrl;
  
  // 4. Configuration Sentry
  const sentryDsn = await askQuestion('Sentry DSN Production (optionnel) : ');
  if (sentryDsn) config.SENTRY_DSN = sentryDsn;
  
  // 5. Génération du fichier .env.production
  const envContent = generateProductionEnv(config);
  const envPath = path.join(process.cwd(), '.env.production');
  
  fs.writeFileSync(envPath, envContent);
  
  logSuccess('Fichier .env.production généré !');
  
  // 6. Création du script de test production
  const testScript = `#!/usr/bin/env node

/**
 * Test de configuration production
 */

require('dotenv').config({ path: '.env.production' });
const nodemailer = require('nodemailer');

async function testProduction() {
  console.log('🧪 Test Configuration Production');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
  
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP Production réussie');
    
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'test@example.com',
      subject: 'Test Production SendGrid',
      text: 'Test de configuration production',
    });
    
    console.log('✅ Email de test envoyé:', result.messageId);
    console.log('🎉 Configuration production validée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testProduction();
`;

  fs.writeFileSync(path.join(process.cwd(), 'test-production.js'), testScript);
  
  logSuccess('Script de test production créé !');
  
  // 7. Instructions finales
  logInfo('\n📋 Instructions de déploiement :');
  logInfo('1. Copiez .env.production vers votre serveur de production');
  logInfo('2. Configurez les variables manquantes (DB, Redis, etc.)');
  logInfo('3. Testez avec: node test-production.js');
  logInfo('4. Déployez avec: npm run start:prod');
  logInfo('5. Vérifiez les webhooks SendGrid');
  
  logInfo('\n🔗 Liens utiles :');
  logInfo('- SendGrid Dashboard: https://app.sendgrid.com/');
  logInfo('- Domain Authentication: https://app.sendgrid.com/settings/sender_auth');
  logInfo('- Webhook Configuration: https://app.sendgrid.com/settings/mail_settings');
  logInfo('- Templates: https://app.sendgrid.com/dynamic_templates');
  
  logSuccess('\n🎉 Configuration production terminée !');
  
  rl.close();
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  defaultConfig,
  generateProductionEnv,
  testSendGridAPI,
  testDomainAuthentication
};
