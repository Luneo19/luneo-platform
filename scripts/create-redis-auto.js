#!/usr/bin/env node

/**
 * Script pour créer automatiquement une database Redis Upstash
 * et récupérer les credentials REST
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

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CRÉATION AUTOMATIQUE DATABASE REDIS UPSTASH              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Essayer avec le token Management API
  const managementToken = 'e4fbfc42-3b87-4dbc-bfa0-dd598b924340';
  
  log('🔑 Utilisation du token Management API...', 'cyan');
  log('');

  // Essayer différentes méthodes pour créer/récupérer une database
  const methods = [
    {
      name: 'Créer database via API v2',
      url: 'https://api.upstash.com/v2/redis/database',
      method: 'POST',
      body: {
        name: 'luneo-production-redis',
        type: 'regional',
        region: 'eu-west-1',
        primary_region: 'eu-west-1',
        read_regions: [],
        tls: true,
        eviction: true,
        consistent: false,
      },
    },
    {
      name: 'Créer database via API v1',
      url: 'https://api.upstash.com/v1/redis/database',
      method: 'POST',
      body: {
        name: 'luneo-production-redis',
        type: 'regional',
        region: 'eu-west-1',
        primary_region: 'eu-west-1',
        read_regions: [],
        tls: true,
        eviction: true,
        consistent: false,
      },
    },
  ];

  for (const method of methods) {
    try {
      log(`📡 Tentative: ${method.name}...`, 'blue');
      
      const response = await makeRequest(method.url, {
        token: managementToken,
        method: method.method,
        body: method.body,
      });

      log(`✅ Succès avec ${method.name}!`, 'green');
      log('');

      const db = response.data.database || response.data.data || response.data.result || response.data;
      
      // Essayer différents chemins pour les credentials
      const restUrl = db.rest_url || 
                     db.endpoint || 
                     db.rest_api_url ||
                     db.rest_endpoint ||
                     db.rest_api?.url ||
                     (db.endpoints && db.endpoints.rest) ||
                     (db.endpoints && db.endpoints.rest_url);

      const restToken = db.rest_token || 
                       db.password || 
                       db.rest_api_token ||
                       db.rest_password ||
                       db.rest_api?.token ||
                       db.token;

      if (restUrl && restToken) {
        writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
        writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
        
        log('✅ Database Redis créée et configurée!', 'green');
        log(`   URL: ${restUrl}`, 'cyan');
        log(`   Token: ${restToken.substring(0, 20)}...`, 'cyan');
        log('');
        
        // Tester la connexion
        log('🔍 Test de connexion...', 'blue');
        try {
          const testResponse = await makeRequest(`${restUrl}/ping`, {
            token: restToken,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${restToken}`,
            },
          });
          log('✅ Connexion Redis testée avec succès!', 'green');
        } catch (testError) {
          log('⚠️  Test de connexion échoué (peut être normal)', 'yellow');
        }
        
        return;
      } else {
        log('⚠️  Credentials REST non trouvés dans la réponse', 'yellow');
        log('📄 Structure de la réponse:', 'yellow');
        console.log(JSON.stringify(db, null, 2).substring(0, 1000));
      }
    } catch (error) {
      log(`❌ Erreur: ${error.message}`, 'red');
      
      // Si c'est une erreur 401, le token n'est pas valide
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        log('');
        log('💡 Le token Management API ne permet pas de créer des databases', 'yellow');
        log('   Il faut utiliser les credentials REST depuis le dashboard', 'yellow');
        break;
      }
    }
  }

  log('');
  log('❌ Impossible de créer automatiquement la database', 'red');
  log('');
  log('💡 Solution: Récupérer les credentials REST manuellement', 'yellow');
  log('');
  log('📋 Étapes:', 'blue');
  log('   1. Aller sur https://console.upstash.com/redis', 'cyan');
  log('   2. Cliquer sur "+ Create Database"', 'cyan');
  log('   3. Remplir:', 'cyan');
  log('      - Name: luneo-production-redis', 'cyan');
  log('      - Type: Regional', 'cyan');
  log('      - Region: eu-west-1', 'cyan');
  log('   4. Cliquer "Create"', 'cyan');
  log('   5. Aller dans l\'onglet "REST API"', 'cyan');
  log('   6. Copier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN', 'cyan');
  log('');
  log('   Puis exécutez:', 'blue');
  log('   node scripts/configure-redis-final.js <URL> <TOKEN>', 'cyan');
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

