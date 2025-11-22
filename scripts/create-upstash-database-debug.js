#!/usr/bin/env node

/**
 * Script pour créer automatiquement une database Upstash Redis avec debug
 */

const https = require('https');
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

// Fonction pour créer une database via l'API Upstash
function createUpstashDatabase(apiToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.upstash.com',
      path: '/v2/redis/database',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    };

    const data = JSON.stringify({
      name: 'luneo-production-redis',
      type: 'regional',
      region: 'eu-west-1',
      primary_region: 'eu-west-1',
      read_regions: [],
      tls: true,
      eviction: true,
      consistent: false,
    });

    log(`📡 Requête vers: https://api.upstash.com/v2/redis/database`, 'blue');
    log(`📋 Données: ${data}`, 'cyan');

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        log(`📥 Status: ${res.statusCode}`, 'blue');
        log(`📥 Réponse: ${body.substring(0, 200)}...`, 'cyan');
        
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          log(`❌ Erreur parsing: ${e.message}`, 'red');
          log(`📄 Réponse complète: ${body}`, 'yellow');
          reject(new Error(`Parse error: ${e.message}. Response: ${body.substring(0, 500)}`));
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ Erreur réseau: ${error.message}`, 'red');
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CRÉATION AUTOMATIQUE UPSTASH REDIS (DEBUG)                  ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const apiToken = process.env.UPSTASH_API_TOKEN || 'e4fbfc42-3b87-4dbc-bfa0-dd598b924340';
  
  if (!apiToken) {
    log('❌ Token API non fourni', 'red');
    process.exit(1);
  }

  log(`🔑 Token API: ${apiToken.substring(0, 10)}...`, 'cyan');
  log('');

  log('🚀 Création de la database Redis...', 'blue');

  try {
    const result = await createUpstashDatabase(apiToken);
    
    log('✅ Database créée avec succès!', 'green');
    log('');
    log(`   Réponse complète:`, 'cyan');
    console.log(JSON.stringify(result, null, 2));
    log('');

    // Récupérer les credentials REST
    const restUrl = result.rest_url || result.endpoint || result.rest_api_url || result.rest_api?.url;
    const restToken = result.rest_token || result.password || result.rest_api_token || result.rest_api?.token;

    if (restUrl && restToken) {
      writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
      writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
      
      log('');
      log('✅ Configuration terminée!', 'green');
    } else {
      log('⚠️  Database créée mais credentials REST non disponibles', 'yellow');
      log('   Structure de la réponse:', 'yellow');
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    log('');
    log('💡 Vérifiez que:', 'yellow');
    log('   - Le token API est valide', 'yellow');
    log('   - Vous avez les permissions nécessaires', 'yellow');
    log('   - Votre compte Upstash est actif', 'yellow');
    log('');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

