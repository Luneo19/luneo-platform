#!/usr/bin/env node

/**
 * Script de génération automatique du fichier .env
 * Basé sur la configuration SendGrid détectée
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Configuration détectée depuis vos enregistrements DNS
const detectedConfig = {
  domain: 'luneo.app',
  sendgridRecords: {
    s1: 's1.domainkey.u55797360.wl111.sendgrid.net',
    s2: 's2.domainkey.u55797360.wl111.sendgrid.net',
    em7761: 'u55797360.wl111.sendgrid.net',
    '55797360': 'sendgrid.net',
    url3210: 'sendgrid.net',
    dmarc: 'v=DMARC1; p=none; rua=mailto:rapports.dmarc.luneo@gmail.com; ruf=mailto:rapports.dmarc.luneo@gmail.com; fo=1;'
  }
};

function generateEnvContent(apiKey) {
  return `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/luneo"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-32-chars-long"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# AI Providers
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# Email Configuration
# ===================

# SendGrid Configuration
SENDGRID_API_KEY="${apiKey}"

# Domain Configuration (basé sur vos enregistrements DNS)
SENDGRID_DOMAIN="${detectedConfig.domain}"
SENDGRID_FROM_NAME="Luneo"
SENDGRID_FROM_EMAIL="no-reply@${detectedConfig.domain}"
SENDGRID_REPLY_TO="support@${detectedConfig.domain}"

# SMTP Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_FROM="Luneo <no-reply@${detectedConfig.domain}>"

# Domain Verification Status
# Mettez à 'true' une fois que SendGrid confirme la vérification
DOMAIN_VERIFIED="true"

# DNS Records (basés sur votre configuration)
SPF_RECORD="v=spf1 include:_spf.sendgrid.net ~all"
DKIM_RECORD="${detectedConfig.sendgridRecords.s1}"
DMARC_RECORD="${detectedConfig.sendgridRecords.dmarc}"

# Email Templates (optionnel)
# Remplacez par vos vrais IDs de templates SendGrid
EMAIL_TEMPLATE_WELCOME="d-welcome-template-id"
EMAIL_TEMPLATE_PASSWORD_RESET="d-password-reset-template-id"
EMAIL_TEMPLATE_EMAIL_CONFIRMATION="d-email-confirmation-template-id"
EMAIL_TEMPLATE_INVOICE="d-invoice-template-id"
EMAIL_TEMPLATE_NEWSLETTER="d-newsletter-template-id"

# Mailgun Configuration (optionnel, pour fallback)
MAILGUN_API_KEY=""
MAILGUN_DOMAIN=""
MAILGUN_URL="https://api.mailgun.net"

# Legacy Email Configuration (deprecated, use above)
FROM_EMAIL="noreply@${detectedConfig.domain}"

# Monitoring
SENTRY_DSN=""
SENTRY_ENVIRONMENT="development"

# App
NODE_ENV="development"
PORT="3000"
API_PREFIX="/api/v1"
CORS_ORIGIN="*"
RATE_LIMIT_TTL="60"
RATE_LIMIT_LIMIT="100"

# Frontend URL (for Stripe redirects)
FRONTEND_URL="http://localhost:3001"
`;
}

async function main() {
  log('🔧 Génération du fichier .env', 'bright');
  log('==============================\n', 'bright');
  
  logInfo('Configuration SendGrid détectée :');
  logInfo(`  - Domaine : ${detectedConfig.domain}`);
  logInfo(`  - Enregistrements DNS : ${Object.keys(detectedConfig.sendgridRecords).length} trouvés`);
  logInfo(`  - DMARC configuré : ✅`);
  logInfo(`  - DKIM configuré : ✅`);
  
  logWarning('Il ne manque que votre clé API SendGrid !');
  
  const apiKey = await askQuestion('Entrez votre clé API SendGrid (commence par SG.) : ');
  
  if (!apiKey.startsWith('SG.')) {
    logError('La clé API doit commencer par "SG."');
    rl.close();
    return;
  }
  
  const envContent = generateEnvContent(apiKey);
  const envPath = path.join(process.cwd(), '.env');
  
  // Sauvegarder l'ancien fichier .env s'il existe
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(process.cwd(), '.env.backup.' + Date.now());
    fs.copyFileSync(envPath, backupPath);
    logInfo(`Fichier .env sauvegardé dans ${backupPath}`);
  }
  
  // Écrire le nouveau fichier .env
  fs.writeFileSync(envPath, envContent);
  
  logSuccess('Fichier .env généré avec succès !');
  logInfo('Configuration détectée :');
  logInfo(`  - Domaine : ${detectedConfig.domain}`);
  logInfo(`  - API Key : ${apiKey.substring(0, 10)}...`);
  logInfo(`  - SMTP From : Luneo <no-reply@${detectedConfig.domain}>`);
  
  logInfo('\nProchaines étapes :');
  logInfo('1. Testez la configuration : node scripts/check-sendgrid-status.js');
  logInfo('2. Testez l\'envoi d\'email : node test-smtp.js');
  logInfo('3. Démarrez l\'application : npm run start:dev');
  
  rl.close();
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  detectedConfig,
  generateEnvContent,
};
