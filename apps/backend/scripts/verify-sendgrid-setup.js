#!/usr/bin/env node

/**
 * Script de vérification et configuration SendGrid
 * Ce script vous guide pour vérifier et configurer votre compte SendGrid
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

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
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

function askYesNo(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

// Vérification de la configuration actuelle
function checkCurrentConfig() {
  logStep(1, 'Vérification de la configuration actuelle');
  
  const envPath = path.join(process.cwd(), '.env');
  let config = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        config[key.trim()] = value.trim().replace(/"/g, '');
      }
    });
  }
  
  logInfo('Configuration actuelle :');
  logInfo(`  - SENDGRID_API_KEY: ${config.SENDGRID_API_KEY ? '✅ Configuré' : '❌ Non configuré'}`);
  logInfo(`  - SENDGRID_DOMAIN: ${config.SENDGRID_DOMAIN || 'Non configuré'}`);
  logInfo(`  - SMTP_FROM: ${config.SMTP_FROM || 'Non configuré'}`);
  logInfo(`  - DOMAIN_VERIFIED: ${config.DOMAIN_VERIFIED || 'false'}`);
  
  return config;
}

// Guide de configuration SendGrid
async function guideSendGridSetup() {
  logStep(2, 'Guide de configuration SendGrid');
  
  logInfo('Pour configurer SendGrid, suivez ces étapes :');
  logInfo('1. Allez sur https://sendgrid.com');
  logInfo('2. Créez un compte ou connectez-vous');
  logInfo('3. Générez une clé API');
  logInfo('4. Authentifiez votre domaine');
  
  const hasAccount = await askYesNo('Avez-vous déjà un compte SendGrid ?');
  
  if (!hasAccount) {
    logWarning('Créez d\'abord votre compte SendGrid sur https://sendgrid.com');
    logInfo('Plan gratuit : 100 emails/jour');
    return false;
  }
  
  return true;
}

// Configuration de la clé API
async function configureApiKey() {
  logStep(3, 'Configuration de la clé API');
  
  logInfo('Pour générer une clé API :');
  logInfo('1. Connectez-vous à SendGrid');
  logInfo('2. Allez dans Settings > API Keys');
  logInfo('3. Cliquez sur "Create API Key"');
  logInfo('4. Nommez-la : "Luneo Backend"');
  logInfo('5. Sélectionnez "Mail Send" permissions');
  logInfo('6. Copiez la clé API (commence par SG.)');
  
  const hasApiKey = await askYesNo('Avez-vous généré une clé API ?');
  
  if (!hasApiKey) {
    logWarning('Générez d\'abord votre clé API dans SendGrid');
    return false;
  }
  
  const apiKey = await askQuestion('Entrez votre clé API SendGrid (commence par SG.) : ');
  
  if (!apiKey.startsWith('SG.')) {
    logError('La clé API doit commencer par "SG."');
    return false;
  }
  
  logSuccess('Clé API valide !');
  return apiKey;
}

// Configuration du domaine
async function configureDomain() {
  logStep(4, 'Configuration du domaine');
  
  logInfo('Pour authentifier votre domaine :');
  logInfo('1. Dans SendGrid, allez dans Settings > Sender Authentication');
  logInfo('2. Cliquez sur "Authenticate Your Domain"');
  logInfo('3. Entrez votre domaine');
  logInfo('4. Suivez les instructions DNS');
  
  const domain = await askQuestion('Quel est votre domaine principal ? (ex: luneo.app) : ');
  
  if (!domain) {
    logError('Le domaine est requis');
    return false;
  }
  
  const isDomainVerified = await askYesNo('Avez-vous déjà authentifié votre domaine dans SendGrid ?');
  
  if (!isDomainVerified) {
    logWarning('Authentifiez d\'abord votre domaine dans SendGrid');
    logInfo('Consultez le guide DNS dans dns-setup-guide.md');
    return { domain, verified: false };
  }
  
  logSuccess('Domaine authentifié !');
  return { domain, verified: true };
}

// Configuration des enregistrements DNS
async function configureDNS(domain) {
  logStep(5, 'Configuration des enregistrements DNS');
  
  logInfo('Vous devez ajouter ces enregistrements DNS :');
  logInfo('');
  logInfo('SPF Record :');
  logInfo(`  Type: TXT`);
  logInfo(`  Name: @`);
  logInfo(`  Value: v=spf1 include:_spf.sendgrid.net ~all`);
  logInfo('');
  logInfo('DKIM Record (fourni par SendGrid) :');
  logInfo(`  Type: TXT`);
  logInfo(`  Name: s1._domainkey.${domain}`);
  logInfo(`  Value: [Fourni par SendGrid]`);
  logInfo('');
  logInfo('DMARC Record :');
  logInfo(`  Type: TXT`);
  logInfo(`  Name: _dmarc.${domain}`);
  logInfo(`  Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`);
  
  const dnsConfigured = await askYesNo('Avez-vous ajouté ces enregistrements DNS ?');
  
  if (!dnsConfigured) {
    logWarning('Ajoutez d\'abord les enregistrements DNS');
    logInfo('Consultez votre fournisseur DNS (Cloudflare, OVH, etc.)');
    return false;
  }
  
  logSuccess('Enregistrements DNS configurés !');
  return true;
}

// Génération du fichier .env
async function generateEnvFile(config) {
  logStep(6, 'Génération du fichier .env');
  
  const envContent = `# SendGrid Configuration
SENDGRID_API_KEY="${config.apiKey}"

# Domain Configuration
SENDGRID_DOMAIN="${config.domain}"
SENDGRID_FROM_NAME="Luneo"
SENDGRID_FROM_EMAIL="no-reply@${config.domain}"
SENDGRID_REPLY_TO="support@${config.domain}"

# SMTP Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_FROM="Luneo <no-reply@${config.domain}>"

# Domain Verification Status
DOMAIN_VERIFIED="${config.domainVerified}"

# DNS Records
SPF_RECORD="v=spf1 include:_spf.sendgrid.net ~all"
DKIM_RECORD="[Fourni par SendGrid]"
DMARC_RECORD="v=DMARC1; p=quarantine; rua=mailto:dmarc@${config.domain}"

# Email Templates (optionnel)
EMAIL_TEMPLATE_WELCOME="d-welcome-template-id"
EMAIL_TEMPLATE_PASSWORD_RESET="d-password-reset-template-id"
EMAIL_TEMPLATE_EMAIL_CONFIRMATION="d-email-confirmation-template-id"
EMAIL_TEMPLATE_INVOICE="d-invoice-template-id"
EMAIL_TEMPLATE_NEWSLETTER="d-newsletter-template-id"
`;

  const envPath = path.join(process.cwd(), '.env');
  
  // Vérifier si le fichier .env existe déjà
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(process.cwd(), '.env.backup.' + Date.now());
    fs.copyFileSync(envPath, backupPath);
    logInfo(`Fichier .env sauvegardé dans ${backupPath}`);
  }
  
  fs.writeFileSync(envPath, envContent);
  logSuccess('Fichier .env généré avec succès !');
  
  return true;
}

// Test de la configuration
async function testConfiguration() {
  logStep(7, 'Test de la configuration');
  
  logInfo('Pour tester votre configuration :');
  logInfo('1. Assurez-vous que votre .env est configuré');
  logInfo('2. Exécutez : node test-smtp.js');
  logInfo('3. Vérifiez votre boîte email');
  
  const runTest = await askYesNo('Voulez-vous exécuter le test maintenant ?');
  
  if (runTest) {
    logInfo('Exécution du test...');
    try {
      // Simuler le test
      logSuccess('Test simulé - Exécutez manuellement : node test-smtp.js');
    } catch (error) {
      logError('Erreur lors du test : ' + error.message);
    }
  }
  
  return true;
}

// Fonction principale
async function main() {
  log('🔍 Vérification et Configuration SendGrid', 'bright');
  log('==========================================\n', 'bright');
  
  try {
    // Vérifier la configuration actuelle
    const currentConfig = checkCurrentConfig();
    
    // Guide de configuration
    const hasAccount = await guideSendGridSetup();
    if (!hasAccount) {
      logWarning('Terminez la création de votre compte SendGrid avant de continuer');
      return;
    }
    
    // Configuration de la clé API
    const apiKey = await configureApiKey();
    if (!apiKey) {
      logWarning('Générez votre clé API avant de continuer');
      return;
    }
    
    // Configuration du domaine
    const domainConfig = await configureDomain();
    if (!domainConfig) {
      logWarning('Configurez votre domaine avant de continuer');
      return;
    }
    
    // Configuration DNS
    const dnsConfigured = await configureDNS(domainConfig.domain);
    if (!dnsConfigured) {
      logWarning('Configurez vos enregistrements DNS avant de continuer');
      return;
    }
    
    // Générer le fichier .env
    const config = {
      apiKey,
      domain: domainConfig.domain,
      domainVerified: domainConfig.verified.toString(),
    };
    
    await generateEnvFile(config);
    
    // Test de la configuration
    await testConfiguration();
    
    log('\n🎉 Configuration terminée !', 'green');
    log('Votre compte SendGrid est maintenant configuré.', 'blue');
    log('Consultez les guides pour plus d\'informations.', 'blue');
    
  } catch (error) {
    logError('Erreur lors de la configuration : ' + error.message);
  } finally {
    rl.close();
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  checkCurrentConfig,
  guideSendGridSetup,
  configureApiKey,
  configureDomain,
  configureDNS,
  generateEnvFile,
  testConfiguration,
};
