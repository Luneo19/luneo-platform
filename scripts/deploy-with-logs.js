#!/usr/bin/env node

/**
 * Script pour déployer avec gestion complète des logs et erreurs
 * Permet de voir et diagnostiquer tous les problèmes
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

// Déployer avec logs complets
function deployWithLogs(project) {
  return new Promise((resolve) => {
    log(`\n${'='.repeat(70)}`, 'cyan');
    log(`🚀 DÉPLOIEMENT: ${project.name.toUpperCase()}`, 'cyan');
    log(`${'='.repeat(70)}`, 'cyan');
    log('');
    
    const projectPath = path.join(__dirname, '..', project.path);
    
    if (!fs.existsSync(projectPath)) {
      log(`❌ Répertoire non trouvé: ${projectPath}`, 'red');
      resolve({ success: false, error: 'Répertoire non trouvé' });
      return;
    }
    
    log(`📁 Répertoire: ${projectPath}`, 'blue');
    log('');
    
    // Vérifier la configuration
    log('🔍 Vérification de la configuration...', 'blue');
    const vercelPath = path.join(projectPath, '.vercel');
    if (!fs.existsSync(vercelPath)) {
      log('⚠️  Configuration Vercel non trouvée', 'yellow');
      log('📝 Liaison du projet...', 'blue');
      try {
        execSync('vercel link --yes', {
          cwd: projectPath,
          stdio: 'pipe',
        });
        log('✅ Projet lié', 'green');
      } catch (error) {
        log(`❌ Erreur lors de la liaison: ${error.message}`, 'red');
        resolve({ success: false, error: error.message });
        return;
      }
    } else {
      log('✅ Configuration Vercel trouvée', 'green');
    }
    
    log('');
    log('🚀 Déploiement en cours...', 'blue');
    log('📋 Les logs complets seront affichés ci-dessous:', 'yellow');
    log('');
    
    // Déployer avec affichage des logs en temps réel
    const deployProcess = spawn('vercel', ['--prod', '--yes'], {
      cwd: projectPath,
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
      
      // Détecter l'URL de déploiement
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        deploymentUrl = urlMatch[0];
      }
      
      // Détecter les erreurs
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
      
      if (code === 0 && !hasError && deploymentUrl) {
        log(`✅ ${project.name} déployé avec succès!`, 'green');
        log(`🌐 URL: ${deploymentUrl}`, 'cyan');
        resolve({ 
          success: true, 
          url: deploymentUrl,
          code: 0 
        });
      } else if (code === 0 && deploymentUrl) {
        log(`⚠️  ${project.name} déployé mais avec des avertissements`, 'yellow');
        log(`🌐 URL: ${deploymentUrl}`, 'cyan');
        resolve({ 
          success: true, 
          url: deploymentUrl,
          code: 0,
          warnings: true 
        });
      } else {
        log(`❌ ${project.name} - Erreur de déploiement`, 'red');
        log(`   Code de sortie: ${code}`, 'red');
        
        // Analyser les erreurs
        const errorAnalysis = analyzeErrors(stdout + stderr);
        if (errorAnalysis.length > 0) {
          log('\n🔍 Analyse des erreurs:', 'yellow');
          errorAnalysis.forEach((error, i) => {
            log(`   ${i + 1}. ${error}`, 'red');
          });
        }
        
        resolve({ 
          success: false, 
          error: `Code ${code}`,
          stdout,
          stderr,
          analysis: errorAnalysis
        });
      }
      
      log(`${'='.repeat(70)}`, 'cyan');
      log('');
    });
    
    deployProcess.on('error', (error) => {
      log(`❌ Erreur lors du lancement: ${error.message}`, 'red');
      resolve({ success: false, error: error.message });
    });
  });
}

// Analyser les erreurs pour donner des suggestions
function analyzeErrors(output) {
  const errors = [];
  const lowerOutput = output.toLowerCase();
  
  if (lowerOutput.includes('root directory') || lowerOutput.includes('path') && lowerOutput.includes('does not exist')) {
    errors.push('Root Directory mal configuré dans Vercel. Corriger dans Settings → General → Root Directory');
  }
  
  if (lowerOutput.includes('build') && lowerOutput.includes('failed')) {
    errors.push('Erreur de build. Vérifier les logs de build ci-dessus pour plus de détails');
  }
  
  if (lowerOutput.includes('environment variable') || lowerOutput.includes('env')) {
    errors.push('Variables d\'environnement manquantes. Vérifier les variables dans Vercel Settings');
  }
  
  if (lowerOutput.includes('dependency') || lowerOutput.includes('package')) {
    errors.push('Problème de dépendances. Vérifier package.json et node_modules');
  }
  
  if (lowerOutput.includes('timeout')) {
    errors.push('Timeout lors du déploiement. Le build prend trop de temps');
  }
  
  if (lowerOutput.includes('unauthorized') || lowerOutput.includes('403')) {
    errors.push('Problème d\'autorisation. Vérifier la connexion Vercel: vercel login');
  }
  
  if (errors.length === 0) {
    errors.push('Erreur non identifiée. Vérifier les logs complets ci-dessus');
  }
  
  return errors;
}

// Vérifier les logs d'un déploiement précédent
function checkPreviousDeployment(project) {
  return new Promise((resolve) => {
    log(`\n🔍 Vérification du dernier déploiement de ${project.name}...`, 'blue');
    
    const projectPath = path.join(__dirname, '..', project.path);
    
    try {
      const output = execSync('vercel ls --prod', {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      
      const lines = output.split('\n');
      const deploymentLine = lines.find(line => line.includes('https://'));
      
      if (deploymentLine) {
        const urlMatch = deploymentLine.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          log(`📋 Dernier déploiement: ${url}`, 'cyan');
          
          // Essayer de récupérer les logs
          try {
            log('📋 Récupération des logs...', 'blue');
            const logsOutput = execSync(`vercel logs ${url}`, {
              cwd: projectPath,
              encoding: 'utf-8',
              stdio: 'pipe',
              timeout: 10000,
            });
            
            if (logsOutput && logsOutput.length > 0) {
              log('\n📄 Logs du dernier déploiement:', 'yellow');
              log(logsOutput.substring(0, 1000), 'cyan');
              if (logsOutput.length > 1000) {
                log('... (tronqué)', 'yellow');
              }
            }
          } catch (logError) {
            log(`⚠️  Impossible de récupérer les logs: ${logError.message}`, 'yellow');
          }
        }
      }
    } catch (error) {
      log(`⚠️  Impossible de vérifier les déploiements précédents: ${error.message}`, 'yellow');
    }
    
    resolve();
  });
}

// Fonction principale
async function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  DÉPLOIEMENT AVEC GESTION DES LOGS ET ERREURS              ║', 'cyan');
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
  
  log('');
  
  const results = [];
  
  // Vérifier les déploiements précédents
  for (const project of PROJECTS) {
    await checkPreviousDeployment(project);
  }
  
  log('');
  log('🚀 Démarrage des déploiements...', 'blue');
  log('');
  
  // Déployer chaque projet
  for (const project of PROJECTS) {
    const result = await deployWithLogs(project);
    results.push({ project: project.name, ...result });
  }
  
  // Résumé final
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ FINAL                                                ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  results.forEach((result) => {
    if (result.success) {
      if (result.url) {
        log(`✅ ${result.project}: Déployé - ${result.url}`, 'green');
      } else {
        log(`✅ ${result.project}: Déploiement réussi`, 'green');
      }
      if (result.warnings) {
        log(`   ⚠️  Avec des avertissements (voir logs ci-dessus)`, 'yellow');
      }
    } else {
      log(`❌ ${result.project}: Échec`, 'red');
      if (result.analysis && result.analysis.length > 0) {
        log(`   Suggestions:`, 'yellow');
        result.analysis.forEach((suggestion) => {
          log(`   - ${suggestion}`, 'yellow');
        });
      }
    }
  });
  
  log('');
  log('📋 Dashboards Vercel:', 'blue');
  log('   Frontend: https://vercel.com/luneos-projects/frontend', 'cyan');
  log('   Backend: https://vercel.com/luneos-projects/backend', 'cyan');
  log('');
  
  const allSuccess = results.every(r => r.success);
  process.exit(allSuccess ? 0 : 1);
}

main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

