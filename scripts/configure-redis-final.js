#!/usr/bin/env node

/**
 * Script pour configurer Upstash Redis avec les credentials REST
 * Usage: node scripts/configure-redis-final.js <REST_URL> <REST_TOKEN>
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
  log('║  CONFIGURATION UPSTASH REDIS                                ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const restUrl = process.argv[2];
  const restToken = process.argv[3];

  if (!restUrl || !restToken) {
    log('📋 Pour configurer Upstash Redis, fournissez les credentials REST:', 'blue');
    log('');
    log('📋 Comment les obtenir:', 'yellow');
    log('   1. Aller sur https://console.upstash.com/redis', 'cyan');
    log('   2. Sélectionner votre database Redis', 'cyan');
    log('   3. Onglet "REST API"', 'cyan');
    log('   4. Copier "UPSTASH_REDIS_REST_URL" et "UPSTASH_REDIS_REST_TOKEN"', 'cyan');
    log('');
    log('📋 Usage:', 'blue');
    log('   node scripts/configure-redis-final.js <REST_URL> <REST_TOKEN>', 'cyan');
    log('');
    log('💡 Exemple:', 'blue');
    log('   node scripts/configure-redis-final.js "https://xxx.upstash.io" "AXXXxxxxx"', 'cyan');
    process.exit(1);
  }

  // Valider le format
  if (!restUrl.startsWith('https://') || !restUrl.includes('upstash.io')) {
    log('⚠️  Format d\'URL suspect. Continuer quand même?', 'yellow');
  }

  if (!restToken.startsWith('A')) {
    log('⚠️  Format de token suspect. Les tokens Upstash commencent généralement par "A"', 'yellow');
  }

  log('🔧 Configuration en cours...', 'blue');
  log('');

  writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
  writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);

  log('');
  log('✅ Configuration terminée!', 'green');
  log('');

  // Vérifier
  log('🔍 Vérification...', 'blue');
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/check-services-config.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    // Ignorer les erreurs de vérification
  }

  log('');
  log('📋 Prochaines étapes:', 'blue');
  log('   1. Copier ces variables sur Vercel', 'yellow');
  log('   2. Redéployer l\'application', 'yellow');
  log('');
}

main();

