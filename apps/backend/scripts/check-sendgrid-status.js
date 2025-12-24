#!/usr/bin/env node

/**
 * Script de vérification automatique du statut SendGrid
 * Ce script vérifie votre configuration SendGrid sans intervention
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

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

// Charger la configuration depuis .env
function loadConfig() {
  const envPath = path.join(process.cwd(), '.env');
  const config = {};
  
  if (!fs.existsSync(envPath)) {
    logError('Fichier .env non trouvé');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      config[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
  
  return config;
}

// Vérifier la configuration
function checkConfig(config) {
  logStep(1, 'Vérification de la configuration');
  
  const checks = {
    apiKey: config.SENDGRID_API_KEY && config.SENDGRID_API_KEY.startsWith('SG.'),
    domain: !!config.SENDGRID_DOMAIN,
    fromEmail: !!config.SENDGRID_FROM_EMAIL,
    smtpFrom: !!config.SMTP_FROM,
    domainVerified: config.DOMAIN_VERIFIED === 'true',
  };
  
  logInfo('Configuration SendGrid :');
  logInfo(`  - API Key: ${checks.apiKey ? '✅ Valide' : '❌ Invalide ou manquante'}`);
  logInfo(`  - Domaine: ${checks.domain ? '✅ Configuré' : '❌ Non configuré'}`);
  logInfo(`  - From Email: ${checks.fromEmail ? '✅ Configuré' : '❌ Non configuré'}`);
  logInfo(`  - SMTP From: ${checks.smtpFrom ? '✅ Configuré' : '❌ Non configuré'}`);
  logInfo(`  - Domaine vérifié: ${checks.domainVerified ? '✅ Oui' : '❌ Non'}`);
  
  if (checks.apiKey) {
    logInfo(`  - API Key: ${config.SENDGRID_API_KEY.substring(0, 10)}...`);
  }
  
  if (checks.domain) {
    logInfo(`  - Domaine: ${config.SENDGRID_DOMAIN}`);
  }
  
  if (checks.smtpFrom) {
    logInfo(`  - SMTP From: ${config.SMTP_FROM}`);
  }
  
  return checks;
}

// Tester la connexion SMTP
async function testSMTPConnection(config) {
  logStep(2, 'Test de connexion SMTP');
  
  if (!config.SENDGRID_API_KEY) {
    logError('Clé API SendGrid manquante');
    return false;
  }
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: config.SENDGRID_API_KEY,
    },
  });
  
  try {
    logInfo('Test de connexion à SendGrid SMTP...');
    await transporter.verify();
    logSuccess('Connexion SMTP réussie !');
    return true;
  } catch (error) {
    logError(`Échec de la connexion SMTP: ${error.message}`);
    
    if (error.message.includes('Authentication failed')) {
      logWarning('Vérifiez votre clé API SendGrid');
    } else if (error.message.includes('Invalid login')) {
      logWarning('Clé API invalide ou expirée');
    } else if (error.message.includes('ECONNREFUSED')) {
      logWarning('Problème de réseau ou pare-feu');
    }
    
    return false;
  }
}

// Tester l'envoi d'email
async function testEmailSending(config) {
  logStep(3, 'Test d\'envoi d\'email');
  
  if (!config.SENDGRID_API_KEY || !config.SMTP_FROM) {
    logError('Configuration incomplète pour l\'envoi d\'email');
    return false;
  }
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: config.SENDGRID_API_KEY,
    },
  });
  
  try {
    logInfo('Envoi d\'un email de test...');
    
    const result = await transporter.sendMail({
      from: config.SMTP_FROM,
      to: 'service.luneo@gmail.com',
      subject: 'Test de configuration SendGrid - Luneo',
      text: 'Ceci est un test de configuration SendGrid.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Test de Configuration Réussi !</h1>
          <p>Votre configuration SendGrid fonctionne parfaitement.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails de la configuration :</h3>
            <ul>
              <li><strong>Domaine :</strong> ${config.SENDGRID_DOMAIN || 'Non configuré'}</li>
              <li><strong>From :</strong> ${config.SMTP_FROM}</li>
              <li><strong>Status :</strong> ✅ Opérationnel</li>
              <li><strong>Timestamp :</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
    });
    
    logSuccess('Email de test envoyé avec succès !');
    logInfo(`Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    logError(`Échec de l'envoi d'email: ${error.message}`);
    
    if (error.message.includes('From address not verified')) {
      logWarning('Votre domaine n\'est pas encore vérifié dans SendGrid');
      logInfo('Authentifiez votre domaine dans SendGrid Dashboard');
    } else if (error.message.includes('Rate limit exceeded')) {
      logWarning('Limite de taux dépassée (100 emails/jour en gratuit)');
    } else if (error.message.includes('Invalid from address')) {
      logWarning('Adresse d\'expéditeur invalide');
    }
    
    return false;
  }
}

// Vérifier les enregistrements DNS
async function checkDNSRecords(config) {
  logStep(4, 'Vérification des enregistrements DNS');
  
  if (!config.SENDGRID_DOMAIN) {
    logError('Domaine non configuré');
    return false;
  }
  
  logInfo('Enregistrements DNS requis pour SendGrid :');
  logInfo('');
  logInfo('SPF Record :');
  logInfo(`  Type: TXT`);
  logInfo(`  Name: @`);
  logInfo(`  Value: v=spf1 include:_spf.sendgrid.net ~all`);
  logInfo('');
  logInfo('DKIM Record :');
  logInfo(`  Type: TXT`);
  logInfo(`  Name: s1._domainkey.${config.SENDGRID_DOMAIN}`);
  logInfo(`  Value: [Fourni par SendGrid]`);
  logInfo('');
  logInfo('DMARC Record :');
  logInfo(`  Type: TXT`);
  logInfo(`  Name: _dmarc.${config.SENDGRID_DOMAIN}`);
  logInfo(`  Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@${config.SENDGRID_DOMAIN}`);
  logInfo('');
  
  logWarning('Vérifiez manuellement ces enregistrements dans votre fournisseur DNS');
  logInfo('Utilisez des outils comme :');
  logInfo('  - https://mxtoolbox.com/');
  logInfo('  - https://dnschecker.org/');
  logInfo('  - https://toolbox.googleapps.com/apps/dig/');
  
  return true;
}

// Générer un rapport de statut
function generateStatusReport(config, checks, smtpTest, emailTest) {
  logStep(5, 'Rapport de statut');
  
  const allChecks = {
    config: checks.apiKey && checks.domain && checks.fromEmail && checks.smtpFrom,
    smtp: smtpTest,
    email: emailTest,
    domainVerified: checks.domainVerified,
  };
  
  logInfo('Résumé de la configuration :');
  logInfo(`  - Configuration : ${allChecks.config ? '✅ Complète' : '❌ Incomplète'}`);
  logInfo(`  - Connexion SMTP : ${allChecks.smtp ? '✅ Fonctionnelle' : '❌ Échec'}`);
  logInfo(`  - Envoi d'email : ${allChecks.email ? '✅ Fonctionnel' : '❌ Échec'}`);
  logInfo(`  - Domaine vérifié : ${allChecks.domainVerified ? '✅ Oui' : '❌ Non'}`);
  
  if (allChecks.config && allChecks.smtp && allChecks.email) {
    logSuccess('🎉 Votre configuration SendGrid est opérationnelle !');
    logInfo('Vous pouvez maintenant utiliser SendGrid dans votre application.');
  } else {
    logWarning('⚠️  Votre configuration SendGrid nécessite des ajustements.');
    
    if (!allChecks.config) {
      logInfo('Actions requises :');
      logInfo('  1. Configurez votre fichier .env');
      logInfo('  2. Exécutez : node scripts/verify-sendgrid-setup.js');
    }
    
    if (!allChecks.smtp) {
      logInfo('Actions requises :');
      logInfo('  1. Vérifiez votre clé API SendGrid');
      logInfo('  2. Assurez-vous que la clé a les bonnes permissions');
    }
    
    if (!allChecks.email) {
      logInfo('Actions requises :');
      logInfo('  1. Authentifiez votre domaine dans SendGrid');
      logInfo('  2. Ajoutez les enregistrements DNS requis');
    }
    
    if (!allChecks.domainVerified) {
      logInfo('Actions requises :');
      logInfo('  1. Terminez l\'authentification de domaine dans SendGrid');
      logInfo('  2. Attendez la propagation DNS (24-48h)');
    }
  }
  
  return allChecks;
}

// Fonction principale
async function main() {
  log('🔍 Vérification Automatique SendGrid', 'bright');
  log('=====================================\n', 'bright');
  
  try {
    // Charger la configuration
    const config = loadConfig();
    if (!config) {
      logError('Impossible de charger la configuration');
      process.exit(1);
    }
    
    // Vérifier la configuration
    const checks = checkConfig(config);
    
    // Tester la connexion SMTP
    const smtpTest = await testSMTPConnection(config);
    
    // Tester l'envoi d'email
    const emailTest = await testEmailSending(config);
    
    // Vérifier les enregistrements DNS
    await checkDNSRecords(config);
    
    // Générer le rapport
    const status = generateStatusReport(config, checks, smtpTest, emailTest);
    
    // Recommandations
    logStep(6, 'Recommandations');
    
    if (status.config && status.smtp && status.email) {
      logSuccess('Configuration optimale !');
      logInfo('Prochaines étapes :');
      logInfo('  1. Intégrez SendGrid dans vos services');
      logInfo('  2. Configurez les templates d\'email');
      logInfo('  3. Mettez en place le monitoring');
    } else {
      logWarning('Configuration à améliorer');
      logInfo('Actions recommandées :');
      logInfo('  1. Exécutez : node scripts/verify-sendgrid-setup.js');
      logInfo('  2. Consultez : SENDGRID_PROFESSIONAL_SETUP.md');
      logInfo('  3. Testez avec : node test-smtp.js');
    }
    
  } catch (error) {
    logError('Erreur lors de la vérification : ' + error.message);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  loadConfig,
  checkConfig,
  testSMTPConnection,
  testEmailSending,
  checkDNSRecords,
  generateStatusReport,
};
