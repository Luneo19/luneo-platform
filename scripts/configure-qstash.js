#!/usr/bin/env node

/**
 * Script pour configurer QStash (queue de messages Upstash)
 * Note: QStash n'est pas actuellement utilisé dans le projet, mais configuré pour référence future
 */

const fs = require('fs');
const path = require('path');

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

const ENV_FILE = path.join(__dirname, '..', 'apps', 'frontend', '.env.local');

// Fonction pour écrire une variable d'environnement
function writeEnvVar(name, value) {
  let content = '';
  
  if (fs.existsSync(ENV_FILE)) {
    content = fs.readFileSync(ENV_FILE, 'utf-8');
    content = content.replace(new RegExp(`^${name}=.*$`, 'gm'), '');
  }
  
  if (content && !content.endsWith('\n')) {
    content += '\n';
  }
  content += `${name}="${value}"\n`;
  
  fs.writeFileSync(ENV_FILE, content);
  log(`✅ ${name} configuré`, 'green');
}

// Fonction principale
function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CONFIGURATION QSTASH                                       ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const qstashUrl = process.argv[2] || 'https://qstash.upstash.io';
  const qstashToken = process.argv[3];
  const currentSigningKey = process.argv[4];
  const nextSigningKey = process.argv[5];

  if (!qstashToken) {
    log('📋 Usage:', 'blue');
    log('   node scripts/configure-qstash.js <QSTASH_TOKEN> [CURRENT_SIGNING_KEY] [NEXT_SIGNING_KEY]', 'cyan');
    log('');
    log('💡 Note: QStash n\'est pas actuellement utilisé dans le projet', 'yellow');
    log('   Il est configuré pour référence future si nécessaire', 'yellow');
    process.exit(1);
  }

  log('🔧 Configuration QStash...', 'blue');
  log('');

  writeEnvVar('QSTASH_URL', qstashUrl);
  writeEnvVar('QSTASH_TOKEN', qstashToken);
  
  if (currentSigningKey) {
    writeEnvVar('QSTASH_CURRENT_SIGNING_KEY', currentSigningKey);
  }
  
  if (nextSigningKey) {
    writeEnvVar('QSTASH_NEXT_SIGNING_KEY', nextSigningKey);
  }

  log('');
  log('✅ QStash configuré!', 'green');
  log('');
  log('⚠️  IMPORTANT: Pour que le rate limiting fonctionne, vous devez aussi configurer Redis:', 'yellow');
  log('   - UPSTASH_REDIS_REST_URL', 'cyan');
  log('   - UPSTASH_REDIS_REST_TOKEN', 'cyan');
  log('');
  log('📋 Pour obtenir les credentials Redis REST:', 'blue');
  log('   1. Aller sur https://console.upstash.com/redis', 'cyan');
  log('   2. Sélectionner votre database Redis', 'cyan');
  log('   3. Onglet "REST API"', 'cyan');
  log('   4. Copier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN', 'cyan');
  log('');
}

main();

