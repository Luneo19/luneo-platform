#!/usr/bin/env node

/**
 * Script pour récupérer les credentials REST d'une database Upstash existante
 * Utilise soit un token API, soit un ID de database
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

// Fonction pour lister les databases avec un token API
function listDatabases(apiToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.upstash.com',
      path: '/v2/redis/databases',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}. Response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Fonction pour obtenir les credentials REST d'une database
function getDatabaseCredentials(apiToken, databaseId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.upstash.com',
      path: `/v2/redis/database/${databaseId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}. Response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉCUPÉRATION CREDENTIALS UPSTASH REDIS                     ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Le token fourni pourrait être un ID de database ou un token API
  const providedToken = process.argv[2] || 'e4fbfc42-3b87-4dbc-bfa0-dd598b924340';
  
  log(`🔑 Identifiant fourni: ${providedToken.substring(0, 20)}...`, 'cyan');
  log('');

  // Essayer d'abord comme token API pour lister les databases
  log('📡 Tentative 1: Utiliser comme token API...', 'blue');
  try {
    const databases = await listDatabases(providedToken);
    log('✅ Token API valide!', 'green');
    log(`📋 Databases trouvées: ${databases.length || databases.length || 0}`, 'cyan');
    
    if (databases.length > 0 || (databases.databases && databases.databases.length > 0)) {
      const dbList = databases.databases || databases;
      log('');
      log('📋 Databases disponibles:', 'blue');
      dbList.forEach((db, i) => {
        log(`   ${i + 1}. ${db.name || db.database_name} (ID: ${db.database_id || db.id})`, 'cyan');
      });
      
      // Prendre la première database ou chercher luneo-production-redis
      const targetDb = dbList.find(db => 
        (db.name || db.database_name || '').includes('luneo') || 
        (db.name || db.database_name || '').includes('production')
      ) || dbList[0];
      
      const dbId = targetDb.database_id || targetDb.id;
      log('');
      log(`🎯 Utilisation de la database: ${targetDb.name || targetDb.database_name}`, 'blue');
      
      // Récupérer les credentials REST
      const credentials = await getDatabaseCredentials(providedToken, dbId);
      
      const restUrl = credentials.rest_url || credentials.endpoint || credentials.rest_api_url || credentials.rest_api?.url;
      const restToken = credentials.rest_token || credentials.password || credentials.rest_api_token || credentials.rest_api?.token;
      
      if (restUrl && restToken) {
        writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
        writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
        
        log('');
        log('✅ Configuration terminée!', 'green');
        log(`   URL: ${restUrl}`, 'cyan');
        log(`   Token: ${restToken.substring(0, 10)}...`, 'cyan');
      } else {
        log('⚠️  Credentials REST non trouvés dans la réponse', 'yellow');
        log('   Structure:', 'yellow');
        console.log(JSON.stringify(credentials, null, 2));
      }
    }
  } catch (error) {
    log(`❌ Erreur avec token API: ${error.message}`, 'yellow');
    log('');
    
    // Essayer comme ID de database directement
    log('📡 Tentative 2: Utiliser comme ID de database...', 'blue');
    log('💡 Note: Pour obtenir les credentials REST, vous avez besoin:', 'yellow');
    log('   1. D\'un token API Upstash valide', 'yellow');
    log('   2. Ou des credentials REST directement depuis le dashboard', 'yellow');
    log('');
    log('📋 Pour obtenir les credentials REST manuellement:', 'blue');
    log('   1. Aller sur https://console.upstash.com', 'cyan');
    log('   2. Sélectionner votre database', 'cyan');
    log('   3. Onglet "REST API"', 'cyan');
    log('   4. Copier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN', 'cyan');
    log('');
    log('💡 Ou utiliser le script interactif:', 'blue');
    log('   node scripts/auto-setup-upstash.js', 'cyan');
  }
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

