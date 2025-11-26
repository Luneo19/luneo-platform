#!/usr/bin/env node

/**
 * Script pour corriger le Root Directory dans Vercel via l'API
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

const PROJECTS = [
  {
    name: 'frontend',
    projectId: 'prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9',
    rootDirectory: 'apps/frontend',
  },
  {
    name: 'backend',
    projectId: 'prj_u2BdMAGZ7L8JSs0CQcMq1Nk1nLNU',
    rootDirectory: 'apps/backend',
  },
];

const TEAM_ID = 'team_hEYzAnyaxsCQkF2sJqEzWKS9';

// Obtenir le token Vercel
function getVercelToken() {
  try {
    const configPath = path.join(process.env.HOME, '.vercel', 'auth.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.token;
    }
  } catch (error) {
    // Ignorer
  }
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
          const errorBody = body.length > 500 ? body.substring(0, 500) : body;
          reject(new Error(`HTTP ${res.statusCode}: ${errorBody}`));
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

// Corriger le Root Directory
async function fixRootDirectory(token, project) {
  log(`\n🔧 Correction du Root Directory pour ${project.name}...`, 'blue');
  
  try {
    // Récupérer les paramètres actuels
    const currentSettings = await makeRequest(
      `https://api.vercel.com/v9/projects/${project.projectId}?teamId=${TEAM_ID}`,
      { token, method: 'GET' }
    );
    
    log(`📋 Root Directory actuel: ${currentSettings.data.rootDirectory || '(vide)'}`, 'cyan');
    log(`📋 Root Directory souhaité: ${project.rootDirectory}`, 'cyan');
    
    // Mettre à jour le Root Directory
    const updateResponse = await makeRequest(
      `https://api.vercel.com/v9/projects/${project.projectId}?teamId=${TEAM_ID}`,
      {
        token,
        method: 'PATCH',
        body: {
          rootDirectory: project.rootDirectory,
        },
      }
    );
    
    log(`✅ Root Directory corrigé: ${updateResponse.data.rootDirectory}`, 'green');
    return { success: true };
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    
    // Si l'API ne permet pas de modifier, donner les instructions
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      log('\n💡 Solution manuelle:', 'yellow');
      log(`   1. Aller sur: https://vercel.com/luneos-projects/${project.name}/settings`, 'cyan');
      log(`   2. Section "General" → "Root Directory"`, 'cyan');
      log(`   3. Définir: ${project.rootDirectory}`, 'cyan');
      log(`   4. Sauvegarder`, 'cyan');
    }
    
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  CORRECTION ROOT DIRECTORY VERCEL                           ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  const token = getVercelToken();
  if (!token) {
    log('❌ Token Vercel non trouvé', 'red');
    log('');
    log('💡 Instructions manuelles:', 'yellow');
    PROJECTS.forEach((project) => {
      log(`\n${project.name}:`, 'cyan');
      log(`   1. https://vercel.com/luneos-projects/${project.name}/settings`, 'cyan');
      log(`   2. General → Root Directory: ${project.rootDirectory}`, 'cyan');
    });
    process.exit(1);
  }
  
  log('✅ Token Vercel trouvé', 'green');
  log('');
  
  const results = [];
  
  for (const project of PROJECTS) {
    const result = await fixRootDirectory(token, project);
    results.push({ project: project.name, ...result });
  }
  
  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  results.forEach((result) => {
    if (result.success) {
      log(`✅ ${result.project}: Root Directory corrigé`, 'green');
    } else {
      log(`❌ ${result.project}: ${result.error}`, 'red');
    }
  });
  
  log('');
  
  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    log('🚀 Vous pouvez maintenant redéployer:', 'blue');
    log('   node scripts/deploy-with-logs.js', 'cyan');
  }
  
  log('');
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

