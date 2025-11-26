#!/usr/bin/env node

/**
 * Script pour déployer depuis la racine du repo
 * Contourne le problème de Root Directory
 */

const { execSync, spawn } = require('child_process');
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

// Déployer depuis la racine avec spécification explicite du répertoire
function deployFromRoot(project) {
  return new Promise((resolve) => {
    log(`\n${'='.repeat(70)}`, 'cyan');
    log(`🚀 DÉPLOIEMENT: ${project.name.toUpperCase()}`, 'cyan');
    log(`${'='.repeat(70)}`, 'cyan');
    log('');
    
    const repoRoot = path.join(__dirname, '..');
    const projectPath = path.join(repoRoot, project.path);
    
    log(`📁 Répertoire racine: ${repoRoot}`, 'blue');
    log(`📁 Répertoire projet: ${projectPath}`, 'blue');
    log('');
    
    // Vérifier que le projet existe
    if (!fs.existsSync(projectPath)) {
      log(`❌ Répertoire non trouvé: ${projectPath}`, 'red');
      resolve({ success: false, error: 'Répertoire non trouvé' });
      return;
    }
    
    log('🚀 Déploiement en cours depuis la racine...', 'blue');
    log('📋 Logs complets:', 'yellow');
    log('');
    
    // Déployer depuis la racine en spécifiant le répertoire
    const deployProcess = spawn('vercel', [
      '--prod',
      '--yes',
      '--cwd', projectPath,
    ], {
      cwd: repoRoot,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });
    
    let stdout = '';
    let stderr = '';
    let deploymentUrl = null;
    let hasError = false;
    
    deployProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
      
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        deploymentUrl = urlMatch[0];
      }
      
      if (output.toLowerCase().includes('error') || 
          output.toLowerCase().includes('failed') ||
          output.toLowerCase().includes('✖')) {
        hasError = true;
      }
    });
    
    deployProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(colors.red + output + colors.reset);
      hasError = true;
    });
    
    deployProcess.on('close', (code) => {
      log('');
      log(`${'='.repeat(70)}`, 'cyan');
      
      if (code === 0 && deploymentUrl) {
        log(`✅ ${project.name} déployé avec succès!`, 'green');
        log(`🌐 URL: ${deploymentUrl}`, 'cyan');
        resolve({ success: true, url: deploymentUrl });
      } else {
        log(`❌ ${project.name} - Erreur de déploiement`, 'red');
        log(`   Code: ${code}`, 'red');
        
        // Analyser les erreurs
        const fullOutput = stdout + stderr;
        if (fullOutput.includes('root directory') || fullOutput.includes('path') && fullOutput.includes('does not exist')) {
          log('\n💡 Solution:', 'yellow');
          log('   Le Root Directory dans Vercel doit être vide ou correspondre au repo root', 'yellow');
          log(`   Aller sur: https://vercel.com/luneos-projects/${project.name}/settings`, 'cyan');
          log('   Section "Build and Deployment" → "Root Directory"', 'cyan');
          log('   Laisser VIDE (car le repo root est déjà apps/frontend)', 'cyan');
        }
        
        resolve({ success: false, error: `Code ${code}`, stdout, stderr });
      }
      
      log(`${'='.repeat(70)}`, 'cyan');
      log('');
    });
    
    deployProcess.on('error', (error) => {
      log(`❌ Erreur: ${error.message}`, 'red');
      resolve({ success: false, error: error.message });
    });
  });
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  DÉPLOIEMENT DEPUIS LA RACINE DU REPO                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf-8' }).trim();
    log(`✅ Connecté à Vercel: ${whoami}`, 'green');
  } catch (error) {
    log('❌ Non connecté à Vercel. Exécutez: vercel login', 'red');
    process.exit(1);
  }
  
  log('');
  
  const results = [];
  
  for (const project of PROJECTS) {
    const result = await deployFromRoot(project);
    results.push({ project: project.name, ...result });
  }
  
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ                                                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  results.forEach((result) => {
    if (result.success) {
      log(`✅ ${result.project}: ${result.url}`, 'green');
    } else {
      log(`❌ ${result.project}: ${result.error}`, 'red');
    }
  });
  
  log('');
  
  const allSuccess = results.every(r => r.success);
  process.exit(allSuccess ? 0 : 1);
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

