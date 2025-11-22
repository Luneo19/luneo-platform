#!/usr/bin/env node

/**
 * Script pour vérifier la configuration des services externes
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Lire les variables depuis .env.local
function readEnvFile() {
  const envFile = path.join(__dirname, '..', 'apps', 'frontend', '.env.local');
  
  if (!fs.existsSync(envFile)) {
    return {};
  }

  const content = fs.readFileSync(envFile, 'utf-8');
  const vars = {};

  content.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)="(.+)"$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  });

  return vars;
}

// Tester Upstash Redis
async function testUpstashRedis(url, token) {
  return new Promise((resolve) => {
    const testUrl = new URL(url);
    const options = {
      hostname: testUrl.hostname,
      path: '/ping',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

// Tester Sentry DSN
function testSentryDSN(dsn) {
  try {
    const url = new URL(dsn);
    return url.hostname.includes('sentry.io') || url.hostname.includes('sentry');
  } catch {
    return false;
  }
}

// Tester Cloudinary
function testCloudinary(cloudName, apiKey, apiSecret) {
  return cloudName && apiKey && apiSecret && 
         cloudName.length > 0 && apiKey.length > 0 && apiSecret.length > 0;
}

// Tester SendGrid
function testSendGrid(apiKey) {
  return apiKey && apiKey.startsWith('SG.') && apiKey.length > 20;
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  VÉRIFICATION CONFIGURATION SERVICES EXTERNES              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const envVars = readEnvFile();
  let allOk = true;

  // 1. Upstash Redis
  log('1. Upstash Redis', 'blue');
  const redisUrl = envVars.UPSTASH_REDIS_REST_URL;
  const redisToken = envVars.UPSTASH_REDIS_REST_TOKEN;
  
  if (redisUrl && redisToken) {
    log('   📡 Test de connexion...', 'yellow');
    const isConnected = await testUpstashRedis(redisUrl, redisToken);
    if (isConnected) {
      log('   ✅ Connecté et fonctionnel', 'green');
    } else {
      log('   ❌ Connexion échouée', 'red');
      allOk = false;
    }
  } else {
    log('   ❌ Non configuré', 'red');
    allOk = false;
  }
  log('');

  // 2. Sentry
  log('2. Sentry', 'blue');
  const sentryDSN = envVars.NEXT_PUBLIC_SENTRY_DSN;
  
  if (sentryDSN) {
    const isValid = testSentryDSN(sentryDSN);
    if (isValid) {
      log('   ✅ DSN valide', 'green');
    } else {
      log('   ⚠️  DSN format suspect', 'yellow');
    }
  } else {
    log('   ❌ Non configuré', 'red');
    allOk = false;
  }
  log('');

  // 3. Cloudinary
  log('3. Cloudinary', 'blue');
  const cloudName = envVars.CLOUDINARY_CLOUD_NAME;
  const cloudKey = envVars.CLOUDINARY_API_KEY;
  const cloudSecret = envVars.CLOUDINARY_API_SECRET;
  
  if (testCloudinary(cloudName, cloudKey, cloudSecret)) {
    log('   ✅ Configuration complète', 'green');
  } else {
    log('   ❌ Configuration incomplète', 'red');
    allOk = false;
  }
  log('');

  // 4. SendGrid
  log('4. SendGrid', 'blue');
  const sendgridKey = envVars.SENDGRID_API_KEY;
  
  if (testSendGrid(sendgridKey)) {
    log('   ✅ API Key valide', 'green');
  } else {
    log('   ❌ API Key invalide ou manquante', 'red');
    allOk = false;
  }
  log('');

  // Résumé
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  if (allOk) {
    log('✅ Tous les services sont configurés correctement!', 'green');
    log('');
    log('📋 Prochaines étapes:', 'blue');
    log('1. Copier les variables vers Vercel', 'yellow');
    log('2. Redéployer l\'application', 'yellow');
    log('3. Tester en production', 'yellow');
  } else {
    log('⚠️  Certains services nécessitent une configuration', 'yellow');
    log('');
    log('Pour configurer:', 'blue');
    log('./scripts/auto-configure-services.sh', 'cyan');
  }
  log('');
}

main().catch((error) => {
  log(`❌ Erreur: ${error.message}`, 'red');
  process.exit(1);
});

