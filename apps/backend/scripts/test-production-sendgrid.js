#!/usr/bin/env node

/**
 * Test complet de configuration SendGrid en production
 */

const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

// Charger la configuration depuis .env.production
function loadProductionConfig() {
  const envPath = path.join(process.cwd(), '.env.production');
  const config = {};
  
  if (!fs.existsSync(envPath)) {
    logError('Fichier .env.production non trouvé');
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

async function testSendGridAPI(config) {
  logInfo('🔍 Test de la clé API SendGrid...');
  
  try {
    const response = await axios.get('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('Clé API SendGrid valide !');
    logInfo(`Compte: ${response.data.type} - ${response.data.username}`);
    return { valid: true, data: response.data };
  } catch (error) {
    logError(`Clé API SendGrid invalide: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    return { valid: false, error: error.message };
  }
}

async function testDomainAuthentication(config) {
  logInfo(`🔍 Vérification de l'authentification du domaine ${config.SENDGRID_DOMAIN}...`);
  
  try {
    const response = await axios.get(`https://api.sendgrid.com/v3/whitelabel/domains`, {
      headers: {
        'Authorization': `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const domainConfig = response.data.results.find(d => d.domain === config.SENDGRID_DOMAIN);
    
    if (domainConfig) {
      if (domainConfig.valid) {
        logSuccess(`Domaine ${config.SENDGRID_DOMAIN} authentifié et vérifié !`);
        logInfo(`DNS Valid: ${domainConfig.dns.valid}`);
        logInfo(`SPF Valid: ${domainConfig.spf.valid}`);
        logInfo(`DKIM Valid: ${domainConfig.dkim.valid}`);
        return { valid: true, data: domainConfig };
      } else {
        logWarning(`Domaine ${config.SENDGRID_DOMAIN} configuré mais non vérifié`);
        return { valid: false, data: domainConfig };
      }
    } else {
      logError(`Domaine ${config.SENDGRID_DOMAIN} non trouvé dans SendGrid`);
      return { valid: false, data: null };
    }
  } catch (error) {
    logError(`Erreur lors de la vérification du domaine: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function testSMTPConnection(config) {
  logInfo('🔍 Test de connexion SMTP...');
  
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT),
    secure: config.SMTP_SECURE === 'true',
    auth: {
      user: 'apikey',
      pass: config.SENDGRID_API_KEY,
    },
  });
  
  try {
    await transporter.verify();
    logSuccess('Connexion SMTP réussie !');
    return { valid: true };
  } catch (error) {
    logError(`Erreur de connexion SMTP: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function testEmailSending(config) {
  logInfo('📧 Test d\'envoi d\'email...');
  
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT),
    secure: config.SMTP_SECURE === 'true',
    auth: {
      user: 'apikey',
      pass: config.SENDGRID_API_KEY,
    },
  });
  
  try {
    const result = await transporter.sendMail({
      from: config.SMTP_FROM,
      to: 'test@example.com',
      subject: '🧪 Test Production SendGrid - ' + new Date().toISOString(),
      text: 'Test de configuration SendGrid en production',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🧪 Test Production SendGrid</h1>
          <p>Ceci est un test de configuration SendGrid en production.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Configuration testée :</h3>
            <ul>
              <li><strong>Domaine :</strong> ${config.SENDGRID_DOMAIN}</li>
              <li><strong>From :</strong> ${config.SMTP_FROM}</li>
              <li><strong>Environment :</strong> ${config.NODE_ENV}</li>
              <li><strong>Timestamp :</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin: 0;">✅ Test Réussi</h4>
            <p style="margin: 10px 0 0 0; color: #2e7d32;">
              Votre configuration SendGrid en production est opérationnelle !
            </p>
          </div>
          
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
    });
    
    logSuccess('Email de test envoyé avec succès !');
    logInfo(`Message ID: ${result.messageId}`);
    return { valid: true, messageId: result.messageId };
  } catch (error) {
    logError(`Erreur lors de l'envoi: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function testTemplates(config) {
  logInfo('🔍 Test des templates SendGrid...');
  
  try {
    const response = await axios.get('https://api.sendgrid.com/v3/templates', {
      headers: {
        'Authorization': `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const templates = response.data.templates;
    logInfo(`Templates trouvés: ${templates.length}`);
    
    // Vérifier les templates de production
    const requiredTemplates = [
      'EMAIL_TEMPLATE_WELCOME',
      'EMAIL_TEMPLATE_PASSWORD_RESET',
      'EMAIL_TEMPLATE_EMAIL_CONFIRMATION',
      'EMAIL_TEMPLATE_INVOICE',
      'EMAIL_TEMPLATE_NEWSLETTER'
    ];
    
    requiredTemplates.forEach(templateKey => {
      const templateId = config[templateKey];
      if (templateId && templateId !== 'd-' + templateKey.toLowerCase().replace('email_template_', '') + '-template') {
        logSuccess(`Template ${templateKey}: ${templateId}`);
      } else {
        logWarning(`Template ${templateKey}: Non configuré`);
      }
    });
    
    return { valid: true, templates: templates.length };
  } catch (error) {
    logError(`Erreur lors de la vérification des templates: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function testWebhooks(config) {
  logInfo('🔍 Test de la configuration des webhooks...');
  
  try {
    const response = await axios.get('https://api.sendgrid.com/v3/user/webhooks/event/settings', {
      headers: {
        'Authorization': `Bearer ${config.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const webhookConfig = response.data;
    
    if (webhookConfig.enabled && webhookConfig.url) {
      logSuccess(`Webhook configuré: ${webhookConfig.url}`);
      logInfo(`Événements activés: ${Object.keys(webhookConfig.group_resubscribe).filter(k => webhookConfig[k]).join(', ')}`);
      return { valid: true, data: webhookConfig };
    } else {
      logWarning('Webhook non configuré');
      return { valid: false, data: webhookConfig };
    }
  } catch (error) {
    logError(`Erreur lors de la vérification des webhooks: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

async function generateProductionReport(config, results) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    domain: config.SENDGRID_DOMAIN,
    tests: {
      apiKey: results.apiTest.valid,
      domainAuth: results.domainTest.valid,
      smtpConnection: results.smtpTest.valid,
      emailSending: results.emailTest.valid,
      templates: results.templateTest.valid,
      webhooks: results.webhookTest.valid
    },
    configuration: {
      fromEmail: config.SMTP_FROM,
      domainVerified: config.DOMAIN_VERIFIED,
      maxEmailsPerHour: config.MAX_EMAILS_PER_HOUR,
      maxEmailsPerDay: config.MAX_EMAILS_PER_DAY
    }
  };
  
  const reportPath = path.join(process.cwd(), 'production-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logInfo(`Rapport de test sauvegardé: ${reportPath}`);
  return report;
}

async function main() {
  log('🧪 Test Configuration SendGrid Production', 'bright');
  log('==========================================\n', 'bright');
  
  // Charger la configuration
  const config = loadProductionConfig();
  if (!config) {
    process.exit(1);
  }
  
  logInfo('Configuration chargée depuis .env.production');
  logInfo(`Environment: ${config.NODE_ENV}`);
  logInfo(`Domain: ${config.SENDGRID_DOMAIN}`);
  logInfo(`From: ${config.SMTP_FROM}`);
  
  // Tests
  const apiTest = await testSendGridAPI(config);
  const domainTest = await testDomainAuthentication(config);
  const smtpTest = await testSMTPConnection(config);
  const emailTest = await testEmailSending(config);
  const templateTest = await testTemplates(config);
  const webhookTest = await testWebhooks(config);
  
  // Résumé
  log('\n📊 Résumé des Tests', 'bright');
  log('==================', 'bright');
  
  const results = {
    apiTest,
    domainTest,
    smtpTest,
    emailTest,
    templateTest,
    webhookTest
  };
  
  const passedTests = Object.values(results).filter(r => r.valid).length;
  const totalTests = Object.keys(results).length;
  
  logInfo(`Tests réussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    logSuccess('🎉 Tous les tests de production sont passés !');
    logSuccess('Votre configuration SendGrid est prête pour la production !');
  } else {
    logWarning(`${totalTests - passedTests} test(s) ont échoué`);
    logInfo('Vérifiez les erreurs ci-dessus avant le déploiement');
  }
  
  // Générer le rapport
  const report = await generateProductionReport(config, results);
  
  logInfo('\n📋 Prochaines étapes :');
  logInfo('1. Corrigez les erreurs si nécessaire');
  logInfo('2. Déployez avec: npm run start:prod');
  logInfo('3. Surveillez les logs et métriques');
  logInfo('4. Configurez les alertes de monitoring');
  
  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  testSendGridAPI,
  testDomainAuthentication,
  testSMTPConnection,
  testEmailSending,
  testTemplates,
  testWebhooks
};
