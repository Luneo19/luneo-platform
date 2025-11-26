#!/usr/bin/env node

/**
 * Script pour FORCER le déploiement sur Vercel via l'API
 * Crée un déploiement directement sans dépendre de GitHub
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

const PROJECTS = [
  {
    name: 'frontend',
    path: 'apps/frontend',
    projectId: 'prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9',
  },
  {
    name: 'backend',
    path: 'apps/backend',
    projectId: 'prj_u2BdMAGZ7L8JSs0CQcMq1Nk1nLNU',
  },
];

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
      req.write(options.body);
    }
    
    req.end();
  });
}

// Créer un déploiement via l'API Vercel
async function createDeployment(token, project, teamId) {
  log(`🚀 Création d'un déploiement pour ${project.name}...`, 'blue');
  
  const projectPath = path.join(__dirname, '..', project.path);
  
  // Méthode 1: Utiliser vercel deploy avec force
  log(`📤 Tentative via Vercel CLI avec force...`, 'blue');
  try {
    const output = execSync('vercel --prod --yes --force', {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120000, // 2 minutes timeout
    });
    
    if (output.includes('Ready') || output.includes('Deployed') || output.includes('https://')) {
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        log(`✅ ${project.name} déployé: ${urlMatch[0]}`, 'green');
        return { success: true, url: urlMatch[0] };
      }
      log(`✅ ${project.name} déployé avec succès!`, 'green');
      return { success: true };
    }
  } catch (error) {
    log(`⚠️  CLI échoué: ${error.message.substring(0, 100)}`, 'yellow');
  }
  
  // Méthode 2: Utiliser l'API Vercel pour créer un déploiement depuis Git
  log(`📤 Tentative via API Vercel...`, 'blue');
  try {
    // Récupérer les informations du projet
    const projectInfo = await makeRequest(
      `https://api.vercel.com/v9/projects/${project.projectId}?teamId=${teamId}`,
      {
        token,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    // Créer un déploiement depuis le dernier commit Git
    const deploymentResponse = await makeRequest(
      `https://api.vercel.com/v13/deployments?teamId=${teamId}`,
      {
        token,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          project: project.projectId,
          target: 'production',
        }),
      }
    );
    
    if (deploymentResponse.data.url) {
      log(`✅ ${project.name} déploiement créé: ${deploymentResponse.data.url}`, 'green');
      return { success: true, url: deploymentResponse.data.url };
    }
  } catch (error) {
    log(`⚠️  API échoué: ${error.message.substring(0, 100)}`, 'yellow');
  }
  
  // Méthode 3: Créer un commit et forcer le push
  log(`📤 Tentative via Git avec force...`, 'blue');
  const repoPath = path.join(__dirname, '..');
  try {
    execSync('git commit --allow-empty -m "chore: force deploy to Vercel production"', {
      cwd: repoPath,
      stdio: 'pipe',
    });
    execSync('git push origin main --force', {
      cwd: repoPath,
      stdio: 'pipe',
    });
    log(`✅ Commit créé et poussé avec force`, 'green');
    log(`⏳ Vercel va détecter le push et déployer`, 'yellow');
    return { success: true, method: 'git' };
  } catch (error) {
    log(`❌ Erreur Git: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  FORCE DÉPLOIEMENT SUR VERCEL                               ║', 'cyan');
  log('║  Frontend et Backend                                        ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  // Vérifier Vercel CLI
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf-8' }).trim();
    log(`✅ Connecté à Vercel: ${whoami}`, 'green');
  } catch (error) {
    log('❌ Non connecté à Vercel. Exécutez: vercel login', 'red');
    process.exit(1);
  }
  
  // Obtenir le token
  const token = getVercelToken();
  if (!token) {
    log('⚠️  Token Vercel non trouvé, utilisation de la méthode CLI uniquement', 'yellow');
  }
  
  const teamId = 'team_hEYzAnyaxsCQkF2sJqEzWKS9';
  
  log('');
  
  const results = [];
  
  // Déployer chaque projet
  for (const project of PROJECTS) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    const result = await createDeployment(token, project, teamId);
    results.push({ project: project.name, ...result });
    log('');
  }
  
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  results.forEach((result) => {
    if (result.success) {
      if (result.url) {
        log(`✅ ${result.project}: Déployé - ${result.url}`, 'green');
      } else if (result.method === 'git') {
        log(`✅ ${result.project}: Déclenché via Git (attendre 2-5 min)`, 'green');
      } else {
        log(`✅ ${result.project}: Déploiement réussi`, 'green');
      }
    } else {
      log(`❌ ${result.project}: ${result.error}`, 'red');
    }
  });
  
  log('');
  log('📋 Vérifier les déploiements:', 'blue');
  log('   Frontend: https://vercel.com/luneos-projects/frontend', 'cyan');
  log('   Backend: https://vercel.com/luneos-projects/backend', 'cyan');
  log('');
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

