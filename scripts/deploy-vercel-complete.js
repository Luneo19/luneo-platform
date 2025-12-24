#!/usr/bin/env node

/**
 * Script complet pour déployer sur Vercel en utilisant l'API directement
 * Contourne le problème de Root Directory
 */

const https = require('https');
const { execSync } = require('child_process');
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

// Créer un déploiement
async function createDeployment(token) {
  log('🚀 Création d\'un nouveau déploiement...', 'blue');
  
  try {
    // Récupérer les informations du projet
    const projectResponse = await makeRequest(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`,
      { token, method: 'GET' }
    );
    
    log(`✅ Projet trouvé: ${projectResponse.data.name}`, 'green');
    
    // Créer un déploiement depuis Git
    // Vercel détecte automatiquement les commits Git
    log('📡 Vérification des déploiements récents...', 'blue');
    
    const deploymentsResponse = await makeRequest(
      `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=5`,
      { token, method: 'GET' }
    );
    
    const deployments = deploymentsResponse.data.deployments || [];
    
    if (deployments.length > 0) {
      const latest = deployments[0];
      log(`📋 Dernier déploiement:`, 'cyan');
      log(`   URL: ${latest.url}`, 'cyan');
      log(`   Statut: ${latest.readyState || latest.state}`, latest.readyState === 'READY' ? 'green' : 'yellow');
      log(`   Créé: ${new Date(latest.createdAt).toLocaleString()}`, 'cyan');
      
      if (latest.readyState === 'READY') {
        log('✅ Dernier déploiement réussi!', 'green');
        return { success: true, deployment: latest };
      } else if (latest.readyState === 'BUILDING' || latest.readyState === 'QUEUED') {
        log('⏳ Déploiement en cours...', 'yellow');
        return { success: true, deployment: latest, building: true };
      }
    }
    
    // Si pas de déploiement récent ou échoué, déclencher via Git
    log('📤 Déclenchement d\'un nouveau déploiement via Git...', 'blue');
    
    // Créer un commit vide pour déclencher
    const repoPath = path.join(__dirname, '..');
    process.chdir(repoPath);
    
    try {
      execSync('git commit --allow-empty -m "chore: trigger Vercel deployment"', { stdio: 'pipe' });
      execSync('git push origin main', { stdio: 'pipe' });
      log('✅ Commit créé et poussé vers GitHub', 'green');
      log('⏳ Vercel va détecter le push et déployer automatiquement', 'yellow');
      log('   Cela peut prendre 2-5 minutes', 'yellow');
      return { success: true, triggered: true };
    } catch (error) {
      log(`⚠️  Erreur Git: ${error.message}`, 'yellow');
      // Continuer quand même
    }
    
    return { success: true };
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  DÉPLOIEMENT COMPLET SUR VERCEL                              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  // Vérifier le token
  const token = getVercelToken();
  if (!token) {
    log('❌ Token Vercel non trouvé', 'red');
    log('');
    log('💡 Le déploiement automatique via Git devrait fonctionner', 'yellow');
    log('   Vérifiez: https://vercel.com/luneos-projects/frontend', 'cyan');
    process.exit(1);
  }

  log('✅ Token Vercel trouvé', 'green');
  log('');

  // Vérifier les variables d'environnement
  log('📋 Vérification des variables d\'environnement...', 'blue');
  try {
    const envResponse = await makeRequest(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      { token, method: 'GET' }
    );
    
    const envs = envResponse.data.envs || [];
    const serviceVars = envs.filter(e => 
      e.key.includes('UPSTASH') || 
      e.key.includes('QSTASH') || 
      e.key.includes('SENTRY') || 
      e.key.includes('CLOUDINARY') || 
      e.key.includes('SENDGRID')
    );
    
    log(`✅ ${serviceVars.length} variables de service trouvées`, 'green');
  } catch (error) {
    log(`⚠️  Erreur lors de la vérification: ${error.message}`, 'yellow');
  }

  log('');

  // Créer le déploiement
  const result = await createDeployment(token);

  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  if (result.success) {
    if (result.deployment) {
      log('✅ Déploiement trouvé:', 'green');
      log(`   URL: ${result.deployment.url}`, 'cyan');
      if (result.building) {
        log('⏳ Le déploiement est en cours...', 'yellow');
      }
    } else if (result.triggered) {
      log('✅ Déploiement déclenché via Git', 'green');
      log('⏳ Attendez 2-5 minutes pour que Vercel détecte le push', 'yellow');
    }
  } else {
    log('❌ Erreur lors du déploiement', 'red');
  }

  log('');
  log('📋 Vérifier le statut:', 'blue');
  log('   https://vercel.com/luneos-projects/frontend', 'cyan');
  log('');
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

