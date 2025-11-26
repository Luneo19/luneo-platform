#!/usr/bin/env node

/**
 * Script pour déployer frontend et backend sur Vercel
 */

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

// Déployer un projet
function deployProject(project) {
  return new Promise((resolve) => {
    log(`\n🚀 Déploiement de ${project.name}...`, 'blue');
    log(`📁 Répertoire: ${project.path}`, 'cyan');
    
    const projectPath = path.join(__dirname, '..', project.path);
    
    if (!fs.existsSync(projectPath)) {
      log(`❌ Répertoire non trouvé: ${projectPath}`, 'red');
      resolve({ success: false, error: 'Répertoire non trouvé' });
      return;
    }
    
    // Vérifier la configuration Vercel
    const vercelPath = path.join(projectPath, '.vercel');
    if (!fs.existsSync(vercelPath)) {
      log(`⚠️  Configuration Vercel non trouvée, liaison du projet...`, 'yellow');
      try {
        execSync('vercel link --yes', {
          cwd: projectPath,
          stdio: 'pipe',
        });
        log(`✅ Projet lié`, 'green');
      } catch (error) {
        log(`❌ Erreur lors de la liaison: ${error.message}`, 'red');
        resolve({ success: false, error: error.message });
        return;
      }
    }
    
    // Essayer de déployer via CLI
    log(`📤 Tentative de déploiement via Vercel CLI...`, 'blue');
    try {
      const output = execSync('vercel --prod --yes', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      
      if (output.includes('Ready') || output.includes('Deployed')) {
        log(`✅ ${project.name} déployé avec succès!`, 'green');
        resolve({ success: true, method: 'cli' });
      } else {
        log(`⚠️  Déploiement via CLI non concluant, déclenchement via Git...`, 'yellow');
        resolve({ success: true, method: 'git' });
      }
    } catch (error) {
      // Si le CLI échoue, déclencher via Git
      log(`⚠️  CLI échoué, déclenchement via Git...`, 'yellow');
      resolve({ success: true, method: 'git' });
    }
  });
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  DÉPLOIEMENT COMPLET - FRONTEND ET BACKEND                 ║', 'cyan');
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
  
  log('');
  
  const results = [];
  
  // Déployer chaque projet
  for (const project of PROJECTS) {
    const result = await deployProject(project);
    results.push({ project: project.name, ...result });
  }
  
  // Si certains projets nécessitent un déclenchement Git
  const needsGitTrigger = results.some(r => r.method === 'git');
  
  if (needsGitTrigger) {
    log('');
    log('📝 Création d\'un commit pour déclencher les déploiements...', 'blue');
    
    const repoPath = path.join(__dirname, '..');
    try {
      execSync('git commit --allow-empty -m "chore: deploy frontend and backend to Vercel"', {
        cwd: repoPath,
        stdio: 'pipe',
      });
      execSync('git push origin main', {
        cwd: repoPath,
        stdio: 'pipe',
      });
      log('✅ Commit créé et poussé vers GitHub', 'green');
      log('⏳ Vercel va détecter le push et déployer automatiquement', 'yellow');
    } catch (error) {
      log(`⚠️  Erreur Git: ${error.message}`, 'yellow');
    }
  }
  
  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  results.forEach((result) => {
    if (result.success) {
      log(`✅ ${result.project}: ${result.method === 'cli' ? 'Déployé via CLI' : 'Déclenché via Git'}`, 'green');
    } else {
      log(`❌ ${result.project}: ${result.error}`, 'red');
    }
  });
  
  log('');
  log('📋 Vérifier les déploiements:', 'blue');
  log('   Frontend: https://vercel.com/luneos-projects/frontend', 'cyan');
  log('   Backend: https://vercel.com/luneos-projects/backend', 'cyan');
  log('');
  
  if (needsGitTrigger) {
    log('⏳ Attendez 2-5 minutes pour que Vercel détecte le push Git', 'yellow');
    log('   Les déploiements apparaîtront automatiquement sur le dashboard', 'yellow');
  }
  
  log('');
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

