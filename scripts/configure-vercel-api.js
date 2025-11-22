#!/usr/bin/env node

/**
 * Script pour configurer toutes les variables d'environnement sur Vercel
 * Utilise l'API Vercel directement avec le token
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const PROJECT_NAME = 'frontend';
const TEAM_ID = 'luneos-projects';

// Lire les variables depuis .env.local
function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    log('⚠️  Fichier .env.local non trouvé', 'yellow');
    return {};
  }

  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const vars = {};

  content.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)=["']?([^"'\n]+)["']?$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  });

  return vars;
}

// Obtenir le token Vercel depuis la config locale
function getVercelToken() {
  try {
    // Essayer de récupérer depuis la config Vercel
    const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.vercel', 'auth.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.token;
    }
  } catch (error) {
    // Ignorer
  }
  
  // Essayer depuis les variables d'environnement
  return process.env.VERCEL_TOKEN;
}

// Faire une requête HTTPS
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

// Obtenir l'ID du projet
async function getProjectId(token) {
  const response = await makeRequest(
    `https://api.vercel.com/v9/projects/${PROJECT_NAME}?teamId=${TEAM_ID}`,
    { token, method: 'GET' }
  );
  return response.data.id;
}

// Créer ou mettre à jour une variable d'environnement
async function setEnvVar(token, projectId, key, value, environments = ['production', 'preview', 'development']) {
  try {
    // Essayer de créer
    const response = await makeRequest(
      `https://api.vercel.com/v10/projects/${projectId}/env`,
      {
        token,
        method: 'POST',
        body: {
          key,
          value,
          type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
          target: environments,
        },
      }
    );
    return { success: true, action: 'created' };
  } catch (error) {
    // Si la variable existe déjà (409), la mettre à jour
    if (error.message.includes('409') || error.message.includes('already exists')) {
      // Récupérer toutes les variables pour trouver l'ID
      const listResponse = await makeRequest(
        `https://api.vercel.com/v10/projects/${projectId}/env`,
        { token, method: 'GET' }
      );
      
      const existingVar = listResponse.data.envs?.find((env) => env.key === key);
      
      if (existingVar) {
        // Mettre à jour
        await makeRequest(
          `https://api.vercel.com/v10/projects/${projectId}/env/${existingVar.id}`,
          {
            token,
            method: 'PATCH',
            body: {
              value,
              target: environments,
            },
          }
        );
        return { success: true, action: 'updated' };
      }
    }
    throw error;
  }
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CONFIGURATION AUTOMATIQUE VERCEL (API)                     ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Obtenir le token Vercel
  const token = getVercelToken();
  if (!token) {
    log('❌ Token Vercel non trouvé', 'red');
    log('');
    log('💡 Solutions:', 'yellow');
    log('   1. Exporter: export VERCEL_TOKEN="votre_token"', 'cyan');
    log('   2. Ou obtenir depuis: ~/.vercel/auth.json', 'cyan');
    log('');
    log('   Pour obtenir un token:', 'yellow');
    log('   https://vercel.com/account/tokens', 'cyan');
    process.exit(1);
  }

  log('✅ Token Vercel trouvé', 'green');
  log('');

  // Lire les variables depuis .env.local
  log('📄 Lecture des variables depuis .env.local...', 'blue');
  const envVars = readEnvFile();

  // Liste des variables à configurer
  const serviceVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'QSTASH_URL',
    'QSTASH_TOKEN',
    'QSTASH_CURRENT_SIGNING_KEY',
    'QSTASH_NEXT_SIGNING_KEY',
    'NEXT_PUBLIC_SENTRY_DSN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SENDGRID_API_KEY',
  ].filter((key) => envVars[key]);

  if (serviceVars.length === 0) {
    log('⚠️  Aucune variable trouvée', 'yellow');
    process.exit(1);
  }

  log(`✅ ${serviceVars.length} variables trouvées`, 'green');
  log('');

  // Obtenir l'ID du projet
  log('🔍 Récupération de l\'ID du projet...', 'blue');
  let projectId;
  try {
    projectId = await getProjectId(token);
    log(`✅ Projet trouvé: ${projectId}`, 'green');
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  }

  log('');

  // Afficher les variables
  log('📋 Variables à configurer:', 'cyan');
  serviceVars.forEach((key) => {
    const value = envVars[key];
    const displayValue = key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')
      ? '***' + value.slice(-4)
      : value;
    log(`   - ${key} = ${displayValue}`, 'cyan');
  });
  log('');

  log('🚀 Configuration des variables sur Vercel...', 'blue');
  log('');

  // Configurer chaque variable
  const results = { success: 0, failed: 0, created: 0, updated: 0 };
  const failedVars = [];

  for (const key of serviceVars) {
    const value = envVars[key];
    const environments = key.startsWith('NEXT_PUBLIC_')
      ? ['production', 'preview', 'development']
      : ['production', 'preview', 'development'];

    log(`📤 ${key}...`, 'blue');
    
    try {
      const result = await setEnvVar(token, projectId, key, value, environments);
      if (result.action === 'created') {
        results.created++;
        log(`   ✅ Créé`, 'green');
      } else {
        results.updated++;
        log(`   ✅ Mis à jour`, 'green');
      }
      results.success++;
    } catch (error) {
      log(`   ❌ Erreur: ${error.message.substring(0, 100)}`, 'red');
      results.failed++;
      failedVars.push(key);
    }
  }

  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  log(`✅ Succès: ${results.success} (${results.created} créées, ${results.updated} mises à jour)`, 'green');
  
  if (results.failed > 0) {
    log(`❌ Échecs: ${results.failed}`, 'red');
    log('');
    log('Variables en échec:', 'yellow');
    failedVars.forEach((key) => {
      log(`   - ${key}`, 'red');
    });
  }

  log('');
  
  if (results.success > 0) {
    log('📋 PROCHAINES ÉTAPES:', 'blue');
    log('1. Vérifier: vercel env ls', 'yellow');
    log('2. Redéployer: vercel --prod', 'yellow');
    log('3. Tester les services en production', 'yellow');
    log('');
  }
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

