#!/usr/bin/env node

/**
 * Script pour configurer Upstash Redis avec un token API
 * Essaie différentes approches pour créer/récupérer une database
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

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CONFIGURATION UPSTASH REDIS AVEC TOKEN API                ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const apiToken = process.argv[2] || 'e4fbfc42-3b87-4dbc-bfa0-dd598b924340';
  
  log(`🔑 Token API: ${apiToken}`, 'cyan');
  log('');

  // Essayer différentes approches
  const approaches = [
    {
      name: 'Liste des databases (v2)',
      url: 'https://api.upstash.com/v2/redis/databases',
      method: 'GET',
    },
    {
      name: 'Liste des databases (v1)',
      url: 'https://api.upstash.com/v1/redis/databases',
      method: 'GET',
    },
    {
      name: 'Liste des databases (legacy)',
      url: 'https://api.upstash.com/redis/databases',
      method: 'GET',
    },
  ];

  for (const approach of approaches) {
    try {
      log(`📡 Tentative: ${approach.name}...`, 'blue');
      
      const response = await makeRequest(approach.url, {
        token: apiToken,
        method: approach.method,
      });

      log(`✅ Connexion réussie avec ${approach.name}!`, 'green');
      log('');

      // Analyser la réponse
      let databases = [];
      if (Array.isArray(response.data)) {
        databases = response.data;
      } else if (response.data.databases) {
        databases = response.data.databases;
      } else if (response.data.data) {
        databases = response.data.data;
      } else if (response.data.result) {
        databases = Array.isArray(response.data.result) ? response.data.result : [response.data.result];
      }

      log(`📋 ${databases.length} database(s) trouvée(s)`, 'blue');
      
      if (databases.length > 0) {
        // Afficher les databases
        databases.forEach((db, i) => {
          const name = db.name || db.database_name || db.databaseName || `Database ${i + 1}`;
          const id = db.database_id || db.id || db.databaseId || 'N/A';
          log(`   ${i + 1}. ${name} (ID: ${id})`, 'cyan');
        });
        log('');

        // Chercher une database luneo ou prendre la première
        const targetDb = databases.find(db => {
          const name = (db.name || db.database_name || db.databaseName || '').toLowerCase();
          return name.includes('luneo') || name.includes('production');
        }) || databases[0];

        const dbId = targetDb.database_id || targetDb.id || targetDb.databaseId;
        const dbName = targetDb.name || targetDb.database_name || targetDb.databaseName || 'Database';
        
        log(`🎯 Utilisation de: ${dbName}`, 'blue');
        log('');

        // Essayer de récupérer les détails avec différentes URLs
        const detailUrls = [
          `https://api.upstash.com/v2/redis/database/${dbId}`,
          `https://api.upstash.com/v1/redis/database/${dbId}`,
          `https://api.upstash.com/redis/database/${dbId}`,
        ];

        for (const detailUrl of detailUrls) {
          try {
            log(`📡 Récupération des détails depuis ${detailUrl}...`, 'blue');
            
            const dbDetailsResponse = await makeRequest(detailUrl, {
              token: apiToken,
              method: 'GET',
            });

            const dbDetails = dbDetailsResponse.data.database || dbDetailsResponse.data.data || dbDetailsResponse.data.result || dbDetailsResponse.data;
            
            // Essayer différents chemins pour les credentials REST
            const restUrl = dbDetails.rest_url || 
                           dbDetails.endpoint || 
                           dbDetails.rest_api_url ||
                           dbDetails.rest_api?.url ||
                           dbDetails.rest_endpoint ||
                           (dbDetails.endpoints && dbDetails.endpoints.rest) ||
                           (dbDetails.endpoints && dbDetails.endpoints.rest_url);

            const restToken = dbDetails.rest_token || 
                             dbDetails.password || 
                             dbDetails.rest_api_token ||
                             dbDetails.rest_api?.token ||
                             dbDetails.rest_password ||
                             dbDetails.rest_token ||
                             targetDb.rest_token ||
                             targetDb.password;

            if (restUrl && restToken) {
              writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
              writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
              
              log('✅ Credentials REST récupérés et configurés!', 'green');
              log(`   URL: ${restUrl}`, 'cyan');
              log(`   Token: ${restToken.substring(0, 20)}...`, 'cyan');
              log('');
              
              // Vérifier la connexion
              log('🔍 Vérification de la connexion...', 'blue');
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
                log('⚠️  Impossible de tester la connexion (peut être normal)', 'yellow');
              }
              
              return;
            } else {
              log('⚠️  Credentials REST non trouvés dans cette réponse', 'yellow');
              log('📄 Structure de la réponse:', 'yellow');
              console.log(JSON.stringify(dbDetails, null, 2).substring(0, 1000));
            }
          } catch (detailError) {
            log(`⚠️  Erreur avec ${detailUrl}: ${detailError.message}`, 'yellow');
          }
        }

        // Si on arrive ici, essayer de créer une nouvelle database
        log('');
        log('💡 Tentative de création d\'une nouvelle database...', 'blue');
        
        try {
          const createUrls = [
            'https://api.upstash.com/v2/redis/database',
            'https://api.upstash.com/v1/redis/database',
          ];

          for (const createUrl of createUrls) {
            try {
              const createResponse = await makeRequest(createUrl, {
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

              const newDb = createResponse.data.database || createResponse.data.data || createResponse.data.result || createResponse.data;
              
              const restUrl = newDb.rest_url || newDb.endpoint || newDb.rest_api_url;
              const restToken = newDb.rest_token || newDb.password || newDb.rest_api_token;

              if (restUrl && restToken) {
                writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
                writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
                log('✅ Nouvelle database créée et configurée!', 'green');
                return;
              }
            } catch (createError) {
              // Continuer avec la prochaine URL
            }
          }
        } catch (createError) {
          log(`⚠️  Impossible de créer une database: ${createError.message}`, 'yellow');
        }

      } else {
        log('⚠️  Aucune database trouvée', 'yellow');
        log('💡 Créons une nouvelle database...', 'blue');
        
        // Créer une nouvelle database
        const createUrls = [
          'https://api.upstash.com/v2/redis/database',
          'https://api.upstash.com/v1/redis/database',
        ];

        for (const createUrl of createUrls) {
          try {
            log(`📡 Création via ${createUrl}...`, 'blue');
            
            const createResponse = await makeRequest(createUrl, {
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

            const newDb = createResponse.data.database || createResponse.data.data || createResponse.data.result || createResponse.data;
            
            const restUrl = newDb.rest_url || newDb.endpoint || newDb.rest_api_url;
            const restToken = newDb.rest_token || newDb.password || newDb.rest_api_token;

            if (restUrl && restToken) {
              writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
              writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
              log('✅ Nouvelle database créée et configurée!', 'green');
              return;
            }
          } catch (createError) {
            log(`⚠️  Erreur avec ${createUrl}: ${createError.message}`, 'yellow');
          }
        }
      }

      break; // Si on arrive ici, on a réussi avec cette approche
      
    } catch (error) {
      log(`❌ Erreur avec ${approach.name}: ${error.message}`, 'red');
      log('');
    }
  }

  log('');
  log('❌ Impossible de configurer automatiquement avec ce token', 'red');
  log('');
  log('💡 Solutions alternatives:', 'yellow');
  log('   1. Récupérer les credentials REST depuis le dashboard:', 'blue');
  log('      https://console.upstash.com/redis', 'cyan');
  log('      → Sélectionner database → Onglet "REST API"', 'cyan');
  log('');
  log('   2. Utiliser le script de configuration directe:', 'blue');
  log('      node scripts/configure-redis-final.js <REST_URL> <REST_TOKEN>', 'cyan');
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

