#!/usr/bin/env node

/**
 * Test final SendGrid avec configuration .env
 */

const nodemailer = require('nodemailer');
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

async function testSendGrid() {
  log('🧪 Test Final SendGrid avec Configuration .env', 'bright');
  log('==============================================\n', 'bright');
  
  // Charger la configuration
  const config = loadConfig();
  if (!config) {
    process.exit(1);
  }
  
  logInfo('Configuration chargée :');
  logInfo(`  - API Key: ${config.SENDGRID_API_KEY ? config.SENDGRID_API_KEY.substring(0, 10) + '...' : 'Non configurée'}`);
  logInfo(`  - Domaine: ${config.SENDGRID_DOMAIN || 'Non configuré'}`);
  logInfo(`  - SMTP From: ${config.SMTP_FROM || 'Non configuré'}`);
  
  if (!config.SENDGRID_API_KEY) {
    logError('Clé API SendGrid manquante dans .env');
    process.exit(1);
  }
  
  // Créer le transporteur SMTP
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
    logInfo('🔍 Test de connexion SMTP...');
    await transporter.verify();
    logSuccess('Connexion SMTP réussie !');
    
    logInfo('📧 Envoi d\'email de test...');
    
    const result = await transporter.sendMail({
      from: config.SMTP_FROM,
      to: 'service.luneo@gmail.com',
      subject: '🎉 Test Final SendGrid - Configuration .env',
      text: 'Test final de configuration SendGrid avec fichier .env',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Test Final Réussi !</h1>
          <p>Votre configuration SendGrid avec fichier .env fonctionne parfaitement !</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Configuration détectée :</h3>
            <ul>
              <li><strong>Domaine :</strong> ${config.SENDGRID_DOMAIN}</li>
              <li><strong>From :</strong> ${config.SMTP_FROM}</li>
              <li><strong>API Key :</strong> ${config.SENDGRID_API_KEY.substring(0, 10)}...</li>
              <li><strong>Status :</strong> ✅ Opérationnel</li>
              <li><strong>Timestamp :</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin: 0;">Configuration Validée</h4>
            <p style="margin: 10px 0 0 0; color: #2e7d32;">
              ✅ Fichier .env configuré<br>
              ✅ Clé API valide<br>
              ✅ Domaine authentifié<br>
              ✅ SMTP opérationnel
            </p>
          </div>
          
          <p>Votre système d'email SendGrid est maintenant prêt pour la production !</p>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
    });
    
    logSuccess('Email de test envoyé avec succès !');
    logInfo(`Message ID: ${result.messageId}`);
    logInfo(`From: ${result.from}`);
    logInfo(`To: ${result.to}`);
    
    log('\n🎉 Configuration SendGrid Validée !', 'green');
    log('Votre système d\'email est opérationnel.', 'blue');
    
  } catch (error) {
    logError(`Erreur lors du test : ${error.message}`);
    
    if (error.message.includes('Authentication failed')) {
      logError('Problème d\'authentification - Vérifiez votre clé API');
    } else if (error.message.includes('From address not verified')) {
      logError('Domaine non vérifié - Attendez la vérification SendGrid');
    } else if (error.message.includes('Rate limit exceeded')) {
      logError('Limite de taux dépassée - Respectez les limites SendGrid');
    }
    
    process.exit(1);
  }
}

// Exécuter le test
testSendGrid();
