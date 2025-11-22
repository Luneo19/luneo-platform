#!/usr/bin/env node

/**
 * Script pour créer automatiquement une database Upstash Redis
 * Utilise l'API Upstash si un token est fourni
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
    // Supprimer la ligne existante
    content = content.replace(new RegExp(`^${name}=.*$`, 'gm'), '');
  }
  
  // Ajouter la nouvelle ligne
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
      region: 'eu-west-1', // Europe (Ireland)
      primary_region: 'eu-west-1',
      read_regions: [],
      tls: true,
      eviction: true,
      consistent: false,
    });

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
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CRÉATION AUTOMATIQUE UPSTASH REDIS                        ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Vérifier le token API
  const apiToken = process.env.UPSTASH_API_TOKEN;
  
  if (!apiToken) {
    log('❌ UPSTASH_API_TOKEN non trouvé dans les variables d\'environnement', 'red');
    log('');
    log('Pour obtenir un token API:', 'yellow');
    log('1. Aller sur https://console.upstash.com', 'cyan');
    log('2. Settings → API Keys → Create API Key', 'cyan');
    log('3. Exporter: export UPSTASH_API_TOKEN="votre_token"', 'cyan');
    log('4. Réexécuter ce script', 'cyan');
    log('');
    process.exit(1);
  }

  log('🚀 Création de la database Redis...', 'blue');

  try {
    const result = await createUpstashDatabase(apiToken);
    
    log('✅ Database créée avec succès!', 'green');
    log('');
    log(`   Name: ${result.database_name || result.name}`, 'cyan');
    log(`   Region: ${result.primary_region || result.region}`, 'cyan');
    log('');

    // Récupérer les credentials REST
    const restUrl = result.rest_url || result.endpoint || result.rest_api_url;
    const restToken = result.rest_token || result.password || result.rest_api_token;

    if (restUrl && restToken) {
      writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
      writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
      
      log('');
      log('✅ Configuration terminée!', 'green');
      log('');
      log('📋 Variables ajoutées dans .env.local:', 'blue');
      log(`   UPSTASH_REDIS_REST_URL="${restUrl}"`, 'cyan');
      log(`   UPSTASH_REDIS_REST_TOKEN="${restToken.substring(0, 10)}..."`, 'cyan');
      log('');
      log('📋 Prochaines étapes:', 'blue');
      log('1. Copier ces variables sur Vercel', 'yellow');
      log('2. Redéployer l\'application', 'yellow');
    } else {
      log('⚠️  Database créée mais credentials REST non disponibles dans la réponse', 'yellow');
      log('   Réponse complète:', 'yellow');
      console.log(JSON.stringify(result, null, 2));
      log('');
      log('💡 Veuillez récupérer les credentials manuellement depuis le dashboard', 'yellow');
      log('   https://console.upstash.com', 'cyan');
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

