#!/usr/bin/env node

/**
 * Script pour configurer automatiquement les services sur Vercel
 * Nécessite: VERCEL_TOKEN dans les variables d'environnement
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Configuration
const VERCEL_API_URL = 'https://api.vercel.com';
const PROJECT_NAME = 'frontend';
const TEAM_ID = 'luneos-projects'; // À adapter selon votre équipe

// Couleurs pour la console
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

// Fonction pour faire une requête HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Lire les variables depuis .env.local
function readEnvFile() {
  const envFile = path.join(__dirname, '..', 'apps', 'frontend', '.env.local');
  
  if (!fs.existsSync(envFile)) {
    log('⚠️  Fichier .env.local non trouvé', 'yellow');
    return {};
  }

  const content = fs.readFileSync(envFile, 'utf-8');
  const vars = {};

  content.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)="(.+)"$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  });

  return vars;
}

// Obtenir ou créer une variable d'environnement sur Vercel
async function setEnvVar(token, projectId, key, value, environments = ['production', 'preview', 'development']) {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v10/projects/${projectId}/env`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const data = {
    key,
    value,
    type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
    target: environments,
  };

  try {
    const response = await makeRequest(options, data);
    log(`✅ ${key} configuré`, 'green');
    return response;
  } catch (error) {
    // Si la variable existe déjà, on la met à jour
    if (error.message.includes('409') || error.message.includes('already exists')) {
      log(`⚠️  ${key} existe déjà, mise à jour...`, 'yellow');
      return await updateEnvVar(token, projectId, key, value, environments);
    }
    throw error;
  }
}

// Mettre à jour une variable existante
async function updateEnvVar(token, projectId, key, value, environments) {
  // D'abord, récupérer toutes les variables pour trouver l'ID
  const listOptions = {
    hostname: 'api.vercel.com',
    path: `/v10/projects/${projectId}/env`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  try {
    const { data } = await makeRequest(listOptions);
    const existingVar = data.envs?.find((env) => env.key === key);

    if (existingVar) {
      // Mettre à jour
      const updateOptions = {
        hostname: 'api.vercel.com',
        path: `/v10/projects/${projectId}/env/${existingVar.id}`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const updateData = {
        value,
        target: environments,
      };

      await makeRequest(updateOptions, updateData);
      log(`✅ ${key} mis à jour`, 'green');
    } else {
      // Créer si n'existe pas
      await setEnvVar(token, projectId, key, value, environments);
    }
  } catch (error) {
    log(`❌ Erreur lors de la mise à jour de ${key}: ${error.message}`, 'red');
    throw error;
  }
}

// Obtenir l'ID du projet
async function getProjectId(token, projectName) {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${projectName}?teamId=${TEAM_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  try {
    const { data } = await makeRequest(options);
    return data.id;
  } catch (error) {
    log(`❌ Erreur lors de la récupération du projet: ${error.message}`, 'red');
    throw error;
  }
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CONFIGURATION AUTOMATIQUE VERCEL                          ║', 'cyan');
  log('║  Luneo Platform - Services Externes                        ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Vérifier le token Vercel
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    log('❌ VERCEL_TOKEN n\'est pas défini dans les variables d\'environnement', 'red');
    log('');
    log('Pour obtenir un token:', 'yellow');
    log('1. Aller sur https://vercel.com/account/tokens', 'yellow');
    log('2. Créer un nouveau token', 'yellow');
    log('3. Exporter: export VERCEL_TOKEN="votre_token"', 'yellow');
    log('');
    process.exit(1);
  }

  // Lire les variables depuis .env.local
  log('📄 Lecture des variables depuis .env.local...', 'blue');
  const envVars = readEnvFile();

  // Filtrer les variables des services externes
  const serviceVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_SENTRY_DSN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SENDGRID_API_KEY',
  ].filter((key) => envVars[key]);

  if (serviceVars.length === 0) {
    log('⚠️  Aucune variable de service trouvée dans .env.local', 'yellow');
    log('Exécutez d\'abord: ./scripts/auto-configure-services.sh', 'yellow');
    process.exit(1);
  }

  log(`✅ ${serviceVars.length} variables trouvées`, 'green');
  log('');

  // Obtenir l'ID du projet
  log('🔍 Récupération de l\'ID du projet...', 'blue');
  let projectId;
  try {
    projectId = await getProjectId(vercelToken, PROJECT_NAME);
    log(`✅ Projet trouvé: ${projectId}`, 'green');
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    log('Vérifiez que le nom du projet et l\'ID de l\'équipe sont corrects', 'yellow');
    process.exit(1);
  }

  log('');

  // Demander confirmation
  log('📋 Variables à configurer:', 'cyan');
  serviceVars.forEach((key) => {
    const value = envVars[key];
    const displayValue = key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')
      ? '***' + value.slice(-4)
      : value;
    log(`   - ${key} = ${displayValue}`, 'cyan');
  });
  log('');

  rl.question('Continuer avec la configuration sur Vercel? (O/n): ', async (answer) => {
    if (answer.toLowerCase() === 'n') {
      log('Configuration annulée', 'yellow');
      rl.close();
      process.exit(0);
    }

    log('');
    log('🚀 Configuration des variables sur Vercel...', 'blue');
    log('');

    // Configurer chaque variable
    const results = { success: 0, failed: 0 };

    for (const key of serviceVars) {
      try {
        await setEnvVar(vercelToken, projectId, key, envVars[key]);
        results.success++;
      } catch (error) {
        log(`❌ Erreur pour ${key}: ${error.message}`, 'red');
        results.failed++;
      }
    }

    log('');
    log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
    log('║  RÉSUMÉ                                                      ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
    log('');
    log(`✅ Succès: ${results.success}`, 'green');
    if (results.failed > 0) {
      log(`❌ Échecs: ${results.failed}`, 'red');
    }
    log('');

    if (results.success > 0) {
      log('📋 PROCHAINES ÉTAPES:', 'blue');
      log('1. Vérifier les variables sur Vercel Dashboard', 'yellow');
      log('2. Redéployer l\'application', 'yellow');
      log('3. Tester les services', 'yellow');
      log('');
    }

    rl.close();
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

// Exécuter
main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

