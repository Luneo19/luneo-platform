#!/usr/bin/env node

/**
 * Script de configuration de domaine SendGrid
 * Ce script aide à configurer l'authentification de domaine pour SendGrid
 */

const fs = require('fs');
const path = require('path');

// Configuration par défaut
const DEFAULT_CONFIG = {
  domain: 'luneo.app',
  fromName: 'Luneo',
  fromEmail: 'no-reply@luneo.app',
  replyTo: 'support@luneo.app',
  smtpHost: 'smtp.sendgrid.net',
  smtpPort: 587,
  smtpSecure: false,
};

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

function generateEnvContent(config) {
  return `# SendGrid Domain Configuration
# ======================================

# Domain Configuration
SENDGRID_DOMAIN="${config.domain}"
SENDGRID_FROM_NAME="${config.fromName}"
SENDGRID_FROM_EMAIL="${config.fromEmail}"
SENDGRID_REPLY_TO="${config.replyTo}"

# SMTP Configuration
SMTP_HOST="${config.smtpHost}"
SMTP_PORT="${config.smtpPort}"
SMTP_SECURE="${config.smtpSecure}"
SMTP_FROM="${config.fromName} <${config.fromEmail}>"

# Domain Verification Status
# Set to 'true' once your domain is verified in SendGrid
DOMAIN_VERIFIED=false

# DNS Records (to be added to your domain provider)
# These will be provided by SendGrid during domain authentication
SPF_RECORD="v=spf1 include:_spf.sendgrid.net ~all"
DKIM_RECORD=""
DMARC_RECORD="v=DMARC1; p=quarantine; rua=mailto:dmarc@${config.domain}"

# Email Templates (optional)
# Replace with your actual SendGrid template IDs
EMAIL_TEMPLATE_WELCOME="d-welcome-template-id"
EMAIL_TEMPLATE_PASSWORD_RESET="d-password-reset-template-id"
EMAIL_TEMPLATE_EMAIL_CONFIRMATION="d-email-confirmation-template-id"
EMAIL_TEMPLATE_INVOICE="d-invoice-template-id"
EMAIL_TEMPLATE_NEWSLETTER="d-newsletter-template-id"
`;
}

function generateDNSGuide(config) {
  return `# Guide de Configuration DNS pour SendGrid
# ================================================

## 1. Authentification de Domaine dans SendGrid

1. Connectez-vous à [SendGrid](https://app.sendgrid.com/)
2. Allez dans **Settings > Sender Authentication**
3. Cliquez sur **Authenticate Your Domain**
4. Entrez votre domaine : ${config.domain}
5. Suivez les instructions pour ajouter les enregistrements DNS

## 2. Enregistrements DNS à Ajouter

### SPF Record
Type: TXT
Name: @ (ou votre domaine)
Value: v=spf1 include:_spf.sendgrid.net ~all

### DKIM Record
Type: TXT
Name: s1._domainkey.${config.domain}
Value: [Fourni par SendGrid]

### DMARC Record (Recommandé)
Type: TXT
Name: _dmarc.${config.domain}
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@${config.domain}

## 3. Vérification

1. Attendez que SendGrid confirme que votre domaine est vérifié
2. Testez l'envoi d'email avec votre domaine
3. Mettez à jour DOMAIN_VERIFIED=true dans votre .env

## 4. Fournisseurs DNS Courants

### Cloudflare
- Allez dans DNS > Records
- Ajoutez les enregistrements TXT

### Google Domains
- Allez dans DNS > Records personnalisés
- Ajoutez les enregistrements TXT

### OVH
- Allez dans Zone DNS
- Ajoutez les enregistrements TXT

### AWS Route 53
- Allez dans Hosted zones > Votre domaine
- Créez les enregistrements TXT
`;
}

function generateSendGridSetupGuide(config) {
  return `# Guide de Configuration SendGrid
# =====================================

## 1. Créer un Compte SendGrid

1. Allez sur [SendGrid](https://sendgrid.com/)
2. Créez un compte gratuit (100 emails/jour)
3. Vérifiez votre email

## 2. Créer une Clé API

1. Dans SendGrid, allez dans **Settings > API Keys**
2. Cliquez sur **Create API Key**
3. Nommez-la : "Luneo Backend"
4. Sélectionnez "Mail Send" permissions
5. Copiez la clé API (commence par SG.)

## 3. Authentifier votre Domaine

1. Allez dans **Settings > Sender Authentication**
2. Cliquez sur **Authenticate Your Domain**
3. Entrez votre domaine : ${config.domain}
4. Suivez les instructions DNS

## 4. Configurer les Templates (Optionnel)

1. Allez dans **Email API > Dynamic Templates**
2. Créez des templates pour :
   - Welcome Email
   - Password Reset
   - Email Confirmation
   - Invoice
   - Newsletter
3. Copiez les IDs des templates

## 5. Configuration dans votre Application

Ajoutez ces variables à votre .env :

\`\`\`bash
# SendGrid API Key
SENDGRID_API_KEY="SG.your-api-key-here"

# Domain Configuration
SENDGRID_DOMAIN="${config.domain}"
SENDGRID_FROM_NAME="${config.fromName}"
SENDGRID_FROM_EMAIL="${config.fromEmail}"
SENDGRID_REPLY_TO="${config.replyTo}"

# SMTP Configuration
SMTP_FROM="${config.fromName} <${config.fromEmail}>"
DOMAIN_VERIFIED=true
\`\`\`

## 6. Test de Configuration

\`\`\`bash
# Test SMTP
node test-smtp.js

# Test SendGrid API
node test-sendgrid.js

# Test complet
npm run test:email
\`\`\`
`;
}

function generateTestScript(config) {
  return `const nodemailer = require('nodemailer');

// Configuration SMTP SendGrid
const transporter = nodemailer.createTransporter({
  host: '${config.smtpHost}',
  port: ${config.smtpPort},
  secure: ${config.smtpSecure},
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

async function testSMTP() {
  try {
    console.log('🧪 Test de connexion SMTP...');
    
    // Vérifier la connexion
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');
    
    // Envoyer un email de test
    const result = await transporter.sendMail({
      from: '${config.fromName} <${config.fromEmail}>',
      to: 'test@example.com',
      subject: 'Test SMTP SendGrid - Luneo',
      html: \`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Test SMTP Réussi !</h1>
          <p>Votre configuration SMTP SendGrid fonctionne parfaitement.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Configuration :</h3>
            <ul>
              <li><strong>Domaine :</strong> ${config.domain}</li>
              <li><strong>From :</strong> ${config.fromName} <${config.fromEmail}></li>
              <li><strong>SMTP :</strong> ${config.smtpHost}:${config.smtpPort}</li>
              <li><strong>Status :</strong> ✅ Opérationnel</li>
            </ul>
          </div>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      \`,
    });
    
    console.log('✅ Email de test envoyé !');
    console.log('📧 Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Erreur SMTP:', error.message);
    process.exit(1);
  }
}

testSMTP();
`;
}

function main() {
  log('🚀 Configuration SendGrid Domain', 'bright');
  log('=====================================\n', 'bright');

  // Demander la configuration
  logStep(1, 'Configuration du domaine');
  
  const config = { ...DEFAULT_CONFIG };
  
  // Vous pouvez personnaliser ces valeurs ici
  logInfo(`Configuration par défaut :`);
  logInfo(`  - Domaine : ${config.domain}`);
  logInfo(`  - From Name : ${config.fromName}`);
  logInfo(`  - From Email : ${config.fromEmail}`);
  logInfo(`  - Reply To : ${config.replyTo}`);
  
  logStep(2, 'Génération des fichiers de configuration');
  
  // Créer le dossier scripts s'il n'existe pas
  const scriptsDir = path.join(__dirname);
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // Générer les fichiers
  const envContent = generateEnvContent(config);
  const dnsGuide = generateDNSGuide(config);
  const setupGuide = generateSendGridSetupGuide(config);
  const testScript = generateTestScript(config);
  
  // Écrire les fichiers
  fs.writeFileSync(path.join(__dirname, 'sendgrid-domain.env'), envContent);
  fs.writeFileSync(path.join(__dirname, 'dns-setup-guide.md'), dnsGuide);
  fs.writeFileSync(path.join(__dirname, 'sendgrid-setup-guide.md'), setupGuide);
  fs.writeFileSync(path.join(__dirname, 'test-smtp.js'), testScript);
  
  logSuccess('Fichiers générés avec succès !');
  
  logStep(3, 'Fichiers créés');
  logInfo('📄 sendgrid-domain.env - Variables d\'environnement');
  logInfo('📄 dns-setup-guide.md - Guide de configuration DNS');
  logInfo('📄 sendgrid-setup-guide.md - Guide de configuration SendGrid');
  logInfo('📄 test-smtp.js - Script de test SMTP');
  
  logStep(4, 'Prochaines étapes');
  logInfo('1. Copiez le contenu de sendgrid-domain.env dans votre .env');
  logInfo('2. Suivez le guide dns-setup-guide.md pour configurer votre DNS');
  logInfo('3. Suivez le guide sendgrid-setup-guide.md pour configurer SendGrid');
  logInfo('4. Testez avec : node scripts/test-smtp.js');
  
  log('\n🎉 Configuration terminée !', 'green');
  log('Consultez les guides générés pour continuer.', 'blue');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  generateEnvContent,
  generateDNSGuide,
  generateSendGridSetupGuide,
  generateTestScript,
};
