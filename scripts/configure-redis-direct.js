#!/usr/bin/env node

/**
 * Script pour configurer Upstash Redis directement avec les credentials REST
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
  log(`✅ ${name} ajouté dans .env.local`, 'green');
}

// Fonction principale
function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CONFIGURATION DIRECTE UPSTASH REDIS                        ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // L'identifiant fourni pourrait être utilisé pour construire l'URL
  // Mais nous avons besoin des credentials REST complets
  const providedId = process.argv[2] || 'e4fbfc42-3b87-4dbc-bfa0-dd598b924340';
  
  log(`🔑 Identifiant fourni: ${providedId}`, 'cyan');
  log('');
  log('📋 Pour configurer Upstash Redis, nous avons besoin:', 'blue');
  log('   1. UPSTASH_REDIS_REST_URL (ex: https://xxx.upstash.io)', 'yellow');
  log('   2. UPSTASH_REDIS_REST_TOKEN (ex: AXXXxxxxx)', 'yellow');
  log('');
  log('💡 Ces credentials se trouvent dans le dashboard Upstash:', 'blue');
  log('   1. Aller sur https://console.upstash.com', 'cyan');
  log('   2. Sélectionner votre database', 'cyan');
  log('   3. Onglet "REST API"', 'cyan');
  log('   4. Copier les deux valeurs', 'cyan');
  log('');
  
  // Si l'utilisateur fournit les credentials en arguments
  const restUrl = process.argv[3];
  const restToken = process.argv[4];
  
  if (restUrl && restToken) {
    log('🔧 Configuration avec les credentials fournis...', 'blue');
    writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
    writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
    
    log('');
    log('✅ Configuration terminée!', 'green');
    log('');
    log('📋 Vérification...', 'blue');
    
    // Vérifier la configuration
    if (fs.existsSync(path.join(__dirname, '..', 'scripts', 'check-services-config.js'))) {
      require('child_process').exec('node scripts/check-services-config.js', (error, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
      });
    }
  } else {
    log('📝 Usage:', 'blue');
    log('   node scripts/configure-redis-direct.js <id> <REST_URL> <REST_TOKEN>', 'cyan');
    log('');
    log('💡 Exemple:', 'blue');
    log('   node scripts/configure-redis-direct.js e4fbfc42-3b87-4dbc-bfa0-dd598b924340 "https://xxx.upstash.io" "AXXXxxxxx"', 'cyan');
    log('');
    log('💡 Ou utiliser le script interactif:', 'blue');
    log('   node scripts/auto-setup-upstash.js', 'cyan');
  }
}

main();

