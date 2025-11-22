#!/usr/bin/env node

/**
 * Script pour récupérer automatiquement les credentials REST Upstash Redis
 * Utilise le token API pour lister les databases et récupérer les credentials
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
  log(`✅ ${name} configuré`, 'green');
}

// Fonction pour faire une requête HTTPS
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
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
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

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉCUPÉRATION AUTOMATIQUE CREDENTIALS UPSTASH             ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const apiToken = process.argv[2] || 'e4fbfc42-3b87-4dbc-bfa0-dd598b924340';
  
  log(`🔑 Token API: ${apiToken.substring(0, 20)}...`, 'cyan');
  log('');

  try {
    // Essayer de lister les databases
    log('📡 Récupération de la liste des databases...', 'blue');
    
    const databasesResponse = await makeRequest('https://api.upstash.com/v2/redis/databases', {
      token: apiToken,
      method: 'GET',
    });

    log('✅ Connexion réussie!', 'green');
    log('');

    const databases = databasesResponse.data.databases || databasesResponse.data || [];
    
    if (databases.length === 0) {
      log('⚠️  Aucune database trouvée', 'yellow');
      log('💡 Créons une nouvelle database...', 'blue');
      
      // Créer une nouvelle database
      const createResponse = await makeRequest('https://api.upstash.com/v2/redis/database', {
        token: apiToken,
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
      });

      const newDb = createResponse.data;
      log('✅ Database créée!', 'green');
      
      const restUrl = newDb.rest_url || newDb.endpoint || newDb.rest_api_url;
      const restToken = newDb.rest_token || newDb.password || newDb.rest_api_token;

      if (restUrl && restToken) {
        writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
        writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
        log('✅ Configuration terminée!', 'green');
        return;
      }
    } else {
      log(`📋 ${databases.length} database(s) trouvée(s):`, 'blue');
      databases.forEach((db, i) => {
        log(`   ${i + 1}. ${db.name || db.database_name} (ID: ${db.database_id || db.id})`, 'cyan');
      });
      log('');

      // Chercher une database luneo ou prendre la première
      const targetDb = databases.find(db => 
        (db.name || db.database_name || '').toLowerCase().includes('luneo') ||
        (db.name || db.database_name || '').toLowerCase().includes('production')
      ) || databases[0];

      const dbId = targetDb.database_id || targetDb.id;
      log(`🎯 Utilisation de: ${targetDb.name || targetDb.database_name}`, 'blue');
      log('');

      // Récupérer les détails de la database pour obtenir les credentials REST
      log('📡 Récupération des credentials REST...', 'blue');
      
      const dbDetailsResponse = await makeRequest(`https://api.upstash.com/v2/redis/database/${dbId}`, {
        token: apiToken,
        method: 'GET',
      });

      const dbDetails = dbDetailsResponse.data;
      
      // Essayer différents chemins pour les credentials REST
      const restUrl = dbDetails.rest_url || 
                     dbDetails.endpoint || 
                     dbDetails.rest_api_url ||
                     dbDetails.rest_api?.url ||
                     dbDetails.rest_api_url ||
                     (dbDetails.endpoints && dbDetails.endpoints.rest);

      const restToken = dbDetails.rest_token || 
                       dbDetails.password || 
                       dbDetails.rest_api_token ||
                       dbDetails.rest_api?.token ||
                       dbDetails.rest_api_token;

      if (restUrl && restToken) {
        writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
        writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
        
        log('✅ Credentials REST récupérés et configurés!', 'green');
        log(`   URL: ${restUrl}`, 'cyan');
        log(`   Token: ${restToken.substring(0, 15)}...`, 'cyan');
      } else {
        log('⚠️  Credentials REST non trouvés dans la réponse', 'yellow');
        log('📄 Structure de la réponse:', 'yellow');
        console.log(JSON.stringify(dbDetails, null, 2));
        log('');
        log('💡 Les credentials REST peuvent être récupérés depuis:', 'blue');
        log('   https://console.upstash.com/redis', 'cyan');
        log('   → Sélectionner la database → Onglet "REST API"', 'cyan');
      }
    }

  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    log('');
    
    // Si c'est une erreur d'authentification, le token n'est peut-être pas valide
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      log('💡 Le token API semble invalide ou expiré', 'yellow');
      log('');
      log('📋 Pour obtenir un nouveau token API:', 'blue');
      log('   1. Aller sur https://console.upstash.com/account/api', 'cyan');
      log('   2. Cliquer "Create API Key"', 'cyan');
      log('   3. Copier le nouveau token', 'cyan');
      log('');
      log('📋 Ou récupérer les credentials REST directement:', 'blue');
      log('   1. Aller sur https://console.upstash.com/redis', 'cyan');
      log('   2. Sélectionner votre database', 'cyan');
      log('   3. Onglet "REST API"', 'cyan');
      log('   4. Copier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN', 'cyan');
    }
  }
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

