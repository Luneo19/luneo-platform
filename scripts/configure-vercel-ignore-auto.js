#!/usr/bin/env node

/**
 * Script pour configurer automatiquement l'Ignored Build Step dans Vercel
 * via l'API Vercel
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9';
const TEAM_ID = 'team_hEYzAnyaxsCQkF2sJqEzWKS9';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

const IGNORE_BUILD_STEP = 'git log -1 --pretty=format:\'%an\' | grep -q \'dependabot\' && exit 1 || exit 0';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
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

async function configureIgnoredBuildStep() {
  if (!VERCEL_TOKEN) {
    log('❌ VERCEL_TOKEN non défini', 'red');
    log('\nPour utiliser ce script:', 'yellow');
    log('  1. Créer un token: https://vercel.com/account/tokens', 'yellow');
    log('  2. Exporter: export VERCEL_TOKEN="votre_token"', 'yellow');
    log('  3. Exécuter: node scripts/configure-vercel-ignore-auto.js', 'yellow');
    process.exit(1);
  }

  log('🔧 Configuration automatique de l\'Ignored Build Step...\n', 'blue');

  // Essayer via l'API Vercel v9 (Project Settings)
  log('📡 Tentative via API Vercel v9...', 'blue');

  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // Note: L'API Vercel v9 ne supporte pas directement ignoredBuildStep
  // Il faut utiliser l'API v2 ou configurer via Dashboard
  log('⚠️  L\'API Vercel v9 ne permet pas de modifier ignoredBuildStep directement', 'yellow');
  log('\n📝 Solution alternative: Configuration via Dashboard', 'blue');
  log('\n1. Ouvrir: https://vercel.com/luneos-projects/frontend/settings/git', 'yellow');
  log('2. Section "Ignored Build Step"', 'yellow');
  log('3. Ajouter cette commande:', 'yellow');
  log(`\n${IGNORE_BUILD_STEP}\n`, 'green');
  log('4. Cliquer sur "Save"\n', 'yellow');

  // Essayer quand même de récupérer les infos du projet
  try {
    const getOptions = {
      hostname: 'api.vercel.com',
      path: `/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    };

    const response = await makeRequest(getOptions);
    
    if (response.status === 200) {
      log('✅ Connexion à l\'API Vercel réussie', 'green');
      log(`   Project: ${response.data.name || PROJECT_ID}`, 'green');
      log(`   Team: ${TEAM_ID}\n`, 'green');
    }
  } catch (error) {
    log(`❌ Erreur API: ${error.message}`, 'red');
  }

  // Générer un script de configuration manuelle
  const scriptPath = path.join(__dirname, '..', '.vercel-configure-ignore.sh');
  const scriptContent = `#!/bin/bash
# Script généré automatiquement pour configurer l'Ignored Build Step
# Exécuter ce script dans le terminal après avoir configuré VERCEL_TOKEN

VERCEL_TOKEN="${VERCEL_TOKEN}"
PROJECT_ID="${PROJECT_ID}"
TEAM_ID="${TEAM_ID}"

echo "🔧 Configuration de l'Ignored Build Step..."
echo ""
echo "⚠️  Note: L'API Vercel ne permet pas de modifier ignoredBuildStep directement"
echo "   Il faut le configurer manuellement dans le Dashboard:"
echo "   https://vercel.com/luneos-projects/frontend/settings/git"
echo ""
echo "Commande à ajouter:"
echo "${IGNORE_BUILD_STEP}"
`;

  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');

  log('📄 Script de configuration généré:', 'blue');
  log(`   ${scriptPath}\n`, 'green');

  log('💡 Pour configurer automatiquement, utilisez le Dashboard Vercel:', 'blue');
  log('   https://vercel.com/luneos-projects/frontend/settings/git\n', 'yellow');

  // Essayer via l'API v2 (si disponible)
  log('🔄 Tentative via API v2...', 'blue');
  
  try {
    const v2Options = {
      hostname: 'api.vercel.com',
      path: `/v2/projects/${PROJECT_ID}?teamId=${TEAM_ID}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    // L'API v2 pourrait avoir un champ différent
    const v2Response = await makeRequest(v2Options, {
      // Essayer différents champs possibles
      ignoredBuildStep: IGNORE_BUILD_STEP,
      buildCommand: undefined, // Ne pas modifier
    });

    if (v2Response.status === 200) {
      log('✅ Configuration réussie via API v2!', 'green');
      return;
    } else {
      log(`⚠️  API v2: Status ${v2Response.status}`, 'yellow');
    }
  } catch (error) {
    log(`⚠️  API v2 non disponible: ${error.message}`, 'yellow');
  }

  log('\n✅ Instructions générées. Veuillez configurer manuellement dans le Dashboard.', 'green');
}

// Exécuter
configureIgnoredBuildStep().catch((error) => {
  log(`❌ Erreur: ${error.message}`, 'red');
  process.exit(1);
});
