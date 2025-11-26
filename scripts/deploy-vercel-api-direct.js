#!/usr/bin/env node

/**
 * Script pour déployer directement sur Vercel via l'API
 * Contourne les problèmes de CLI
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

const PROJECT_ID = 'prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9';
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

// Obtenir les informations du projet
async function getProjectInfo(token) {
  try {
    const response = await makeRequest(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`,
      { token, method: 'GET' }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Erreur lors de la récupération du projet: ${error.message}`);
  }
}

// Obtenir les déploiements récents
async function getRecentDeployments(token) {
  try {
    const response = await makeRequest(
      `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=10`,
      { token, method: 'GET' }
    );
    return response.data.deployments || [];
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des déploiements: ${error.message}`);
  }
}

// Créer un déploiement depuis Git
async function createDeploymentFromGit(token, projectInfo) {
  log('🚀 Création d\'un déploiement depuis Git...', 'blue');
  
  // Vercel détecte automatiquement les commits Git
  // On va juste vérifier qu'un nouveau déploiement est en cours
  // ou créer un commit pour le déclencher
  
  const repoPath = path.join(__dirname, '..');
  process.chdir(repoPath);
  
  try {
    // Vérifier le dernier commit
    const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf-8' }).trim();
    log(`📝 Dernier commit: ${lastCommit}`, 'cyan');
    
    // Créer un commit de déploiement
    execSync('git commit --allow-empty -m "chore: deploy to Vercel production"', { stdio: 'pipe' });
    execSync('git push origin main', { stdio: 'pipe' });
    
    log('✅ Commit créé et poussé vers GitHub', 'green');
    log('⏳ Vercel va détecter le push et déployer automatiquement', 'yellow');
    
    return { success: true, triggered: true };
  } catch (error) {
    log(`⚠️  Erreur Git: ${error.message}`, 'yellow');
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  DÉPLOIEMENT DIRECT SUR VERCEL                               ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Obtenir le token
  const token = getVercelToken();
  if (!token) {
    log('❌ Token Vercel non trouvé', 'red');
    log('');
    log('💡 Tentative de déploiement via Git...', 'yellow');
    const repoPath = path.join(__dirname, '..');
    process.chdir(repoPath);
    try {
      execSync('git commit --allow-empty -m "chore: deploy to Vercel"', { stdio: 'pipe' });
      execSync('git push origin main', { stdio: 'pipe' });
      log('✅ Commit créé et poussé', 'green');
      log('⏳ Vercel va déployer automatiquement', 'yellow');
    } catch (error) {
      log(`❌ Erreur: ${error.message}`, 'red');
    }
    process.exit(1);
  }

  log('✅ Token Vercel trouvé', 'green');
  log('');

  // Obtenir les informations du projet
  log('📋 Récupération des informations du projet...', 'blue');
  let projectInfo;
  try {
    projectInfo = await getProjectInfo(token);
    log(`✅ Projet: ${projectInfo.name}`, 'green');
    log(`   URL: ${projectInfo.targets?.production?.url || 'N/A'}`, 'cyan');
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  }

  log('');

  // Vérifier les déploiements récents
  log('📋 Vérification des déploiements récents...', 'blue');
  let deployments;
  try {
    deployments = await getRecentDeployments(token);
    
    if (deployments.length > 0) {
      const latest = deployments[0];
      const age = Math.floor((Date.now() - new Date(latest.createdAt).getTime()) / 1000 / 60);
      
      log(`📦 Dernier déploiement:`, 'cyan');
      log(`   URL: ${latest.url}`, 'cyan');
      log(`   Statut: ${latest.readyState || latest.state}`, 
          latest.readyState === 'READY' ? 'green' : 
          (latest.readyState === 'BUILDING' || latest.readyState === 'QUEUED') ? 'yellow' : 'red');
      log(`   Âge: ${age} minutes`, 'cyan');
      
      if (latest.readyState === 'READY') {
        log('✅ Dernier déploiement réussi!', 'green');
        log(`   Accéder à: ${latest.url}`, 'cyan');
        return;
      } else if (latest.readyState === 'BUILDING' || latest.readyState === 'QUEUED') {
        log('⏳ Déploiement en cours...', 'yellow');
        log('   Attendez quelques minutes', 'yellow');
        return;
      }
    }
  } catch (error) {
    log(`⚠️  Erreur: ${error.message}`, 'yellow');
  }

  log('');

  // Créer un nouveau déploiement
  log('🚀 Déclenchement d\'un nouveau déploiement...', 'blue');
  const result = await createDeploymentFromGit(token, projectInfo);

  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  if (result.success) {
    log('✅ Déploiement déclenché avec succès!', 'green');
    log('');
    log('📋 Prochaines étapes:', 'blue');
    log('1. Attendez 2-5 minutes pour que Vercel détecte le push', 'yellow');
    log('2. Vérifiez le dashboard: https://vercel.com/luneos-projects/frontend', 'cyan');
    log('3. Surveillez le statut du déploiement', 'yellow');
  } else {
    log('❌ Erreur lors du déclenchement', 'red');
    log(`   ${result.error}`, 'red');
  }

  log('');
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

