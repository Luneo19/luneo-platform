#!/usr/bin/env node

/**
 * Script automatique pour créer et configurer Upstash Redis
 * Utilise l'API Upstash si un token est fourni
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
  content += `\n${name}="${value}"`;
  
  fs.writeFileSync(ENV_FILE, content.trim() + '\n');
  log(`✅ ${name} ajouté dans .env.local`, 'green');
}

// Fonction pour créer une database via l'API Upstash
async function createUpstashDatabase(apiToken) {
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
  log('║  CONFIGURATION AUTOMATIQUE UPSTASH REDIS                    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Vérifier si déjà configuré
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    const hasUrl = content.includes('UPSTASH_REDIS_REST_URL=');
    const hasToken = content.includes('UPSTASH_REDIS_REST_TOKEN=');
    
    if (hasUrl && hasToken) {
      log('✅ Upstash Redis est déjà configuré', 'green');
      log('');
      rl.question('Voulez-vous le reconfigurer? (o/N): ', (answer) => {
        if (answer.toLowerCase() !== 'o') {
          log('Configuration conservée', 'green');
          rl.close();
          process.exit(0);
        }
        rl.close();
        setup();
      });
      return;
    }
  }

  setup();
}

async function setup() {
  log('');
  log('📋 Deux options disponibles:', 'blue');
  log('');
  log('Option 1: Configuration automatique via API (recommandé)', 'cyan');
  log('  - Nécessite un token API Upstash', 'yellow');
  log('  - Crée automatiquement la database', 'yellow');
  log('');
  log('Option 2: Configuration manuelle', 'cyan');
  log('  - Vous créez la database manuellement', 'yellow');
  log('  - Vous copiez les credentials', 'yellow');
  log('');

  rl.question('Choisir l\'option (1/2): ', async (option) => {
    if (option === '1') {
      await setupViaAPI();
    } else {
      await setupManual();
    }
  });
}

async function setupViaAPI() {
  log('');
  log('🔑 Configuration via API Upstash', 'blue');
  log('');
  log('Pour obtenir un token API:', 'yellow');
  log('1. Aller sur https://console.upstash.com', 'cyan');
  log('2. Settings → API Keys → Create API Key', 'cyan');
  log('3. Copier le token', 'cyan');
  log('');

  rl.question('Token API Upstash: ', async (apiToken) => {
    if (!apiToken || apiToken.trim().length === 0) {
      log('❌ Token non fourni', 'red');
      rl.close();
      process.exit(1);
    }

    log('');
    log('🚀 Création de la database Redis...', 'blue');

    try {
      const result = await createUpstashDatabase(apiToken.trim());
      
      log('✅ Database créée avec succès!', 'green');
      log('');
      log(`   Name: ${result.database_name}`, 'cyan');
      log(`   Region: ${result.primary_region}`, 'cyan');
      log('');

      // Récupérer les credentials REST
      const restUrl = result.rest_url || result.endpoint;
      const restToken = result.rest_token || result.password;

      if (restUrl && restToken) {
        writeEnvVar('UPSTASH_REDIS_REST_URL', restUrl);
        writeEnvVar('UPSTASH_REDIS_REST_TOKEN', restToken);
        
        log('');
        log('✅ Configuration terminée!', 'green');
        log('');
        log('📋 Prochaines étapes:', 'blue');
        log('1. Copier ces variables sur Vercel', 'yellow');
        log('2. Redéployer l\'application', 'yellow');
      } else {
        log('⚠️  Database créée mais credentials REST non disponibles', 'yellow');
        log('   Veuillez les récupérer manuellement depuis le dashboard', 'yellow');
      }
    } catch (error) {
      log(`❌ Erreur: ${error.message}`, 'red');
      log('');
      log('💡 Essayez la configuration manuelle (Option 2)', 'yellow');
    }

    rl.close();
  });
}

async function setupManual() {
  log('');
  log('📝 Configuration manuelle', 'blue');
  log('');
  log('1. Ouvrir https://console.upstash.com dans votre navigateur', 'cyan');
  log('2. Créer une nouvelle database Redis', 'cyan');
  log('3. Copier les credentials REST API', 'cyan');
  log('');

  rl.question('UPSTASH_REDIS_REST_URL: ', (url) => {
    if (!url || url.trim().length === 0) {
      log('❌ URL non fournie', 'red');
      rl.close();
      process.exit(1);
    }

    rl.question('UPSTASH_REDIS_REST_TOKEN: ', (token) => {
      if (!token || token.trim().length === 0) {
        log('❌ Token non fourni', 'red');
        rl.close();
        process.exit(1);
      }

      writeEnvVar('UPSTASH_REDIS_REST_URL', url.trim());
      writeEnvVar('UPSTASH_REDIS_REST_TOKEN', token.trim());

      log('');
      log('✅ Configuration terminée!', 'green');
      log('');
      log('📋 Prochaines étapes:', 'blue');
      log('1. Copier ces variables sur Vercel', 'yellow');
      log('2. Redéployer l\'application', 'yellow');

      rl.close();
    });
  });
}

main().catch((error) => {
  log(`❌ Erreur: ${error.message}`, 'red');
  process.exit(1);
});

